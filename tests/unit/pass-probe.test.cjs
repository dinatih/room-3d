const {it}=require('node:test');
const assert=require('node:assert/strict');
const {installPassProbe}=require('../support/pass-probe.cjs');
async function setup() {
    const root={name:'Native',visible:true,userData:{dynamicActor:true}};
    const material={name:'glass',transmission:1};
    const mirror={isReflector:true,name:'mirror',onBeforeRender:null};
    const main={name:'main',getObjectByName:()=>root,traverse:visit=>{visit(mirror);visit({name:'glass',material});}};
    let target=null,activeQuery=null,clock=0,throwOnHidden=false,pixelRatio=1;
    const timers=[];
    const context={GPU_DISJOINT_EXT:1,QUERY_RESULT_AVAILABLE:2,QUERY_RESULT:3,
        getExtension:()=>({GPU_DISJOINT_EXT:1,TIME_ELAPSED_EXT:4}),getParameter:()=>false,
        get drawingBufferWidth(){return Math.floor(640*pixelRatio);},get drawingBufferHeight(){return Math.floor(480*pixelRatio);},
        createQuery:()=>({}),beginQuery(_type,query){assert.equal(activeQuery,null,'GPU queries must not nest');activeQuery=query;},
        endQuery(){activeQuery.ns=1e6;activeQuery=null;},getQueryParameter:(_query,parameter)=>parameter===2?true:1e6,deleteQuery(){} };
    const renderer={
        info:{programs:[],render:{calls:0,triangles:0}},shadowMap:{enabled:true,render(){renderer.renderBufferDirect();}},
        getContext:()=>context,getRenderTarget:()=>target,getPixelRatio:()=>pixelRatio,setPixelRatio(value){pixelRatio=value;},
        renderBufferDirect(){renderer.info.render.calls++;renderer.info.render.triangles+=12;},
        render(scene,camera){
            if(throwOnHidden&&!root.visible)throw Error('injected render failure');
            if(renderer.shadowMap.enabled)renderer.shadowMap.render();
            if(root.visible)renderer.renderBufferDirect();
            if(material.transmission>0){const previous=target;target={uuid:'transmission'};renderer.renderBufferDirect();target=previous;}
            if(!camera.nested)mirror.onBeforeRender();
        },
    };
    mirror.onBeforeRender=()=>{const previous=target;target={uuid:'reflection'};renderer.render(main,{nested:true});target=previous;};
    const original={render:renderer.render,direct:renderer.renderBufferDirect,shadow:renderer.shadowMap.render,mirror:mirror.onBeforeRender};
    const window={__THREE_GL__:renderer,__THREE_SCENE__:main};
    const imports={
        '/src/features/scene/characterConfig.ts':{CHARACTERS:[{id:'native',name:'Native'}]},
        '/src/features/scene/DevToolsCollector.tsx':{resolveEntityKey:object=>object.name},
    };
    const install=new Function('window','performance','requestAnimationFrame','setTimeout','modules',`return (${installPassProbe.toString().replaceAll('await import(', 'await modules(')});`)(window,{now:()=>++clock},fn=>queueMicrotask(fn),fn=>timers.push(fn),async name=>{
        assert.ok(name in imports,`Unexpected module ${name}`);return imports[name];
    });
    await install(['native']);
    return {renderer,root,material,mirror,main,original,probe:window.__passProbe,fail(){throwOnHidden=true;},async timer(){timers.shift()();await Promise.resolve();},
        secondary(){target={uuid:'feed'};try{renderer.render(main,{nested:true});}finally{target=null;}}};
}
it('alterne les paires à pose identique et mesure les passes imbriquées sans requête GPU imbriquée',async()=>{
    const test=await setup();
    const pending=test.probe.pairs('shadow-update-off',2,0);
    test.renderer.render(test.main,{});test.renderer.render(test.main,{});
    const result=await pending;
    assert.deepEqual(result.rows.map(row=>[row.frame,row.mode]),[[0,'baseline'],[0,'shadow-update-off'],[1,'shadow-update-off'],[1,'baseline']]);
    for(const row of result.rows){
        assert.equal(row.gpuMs,1);
        if(row.mode==='baseline')assert.equal(row.passes.shadow.calls,2);
        else assert.equal(row.passes.shadow,undefined);
    }
    test.probe.dispose();
    assert.equal(test.renderer.render,test.original.render);
    assert.equal(test.renderer.renderBufferDirect,test.original.direct);
    assert.equal(test.renderer.shadowMap.render,test.original.shadow);
});
it('supprime réellement les reflets et la transmission et restaure les propriétés entre les dessins',async()=>{
    const test=await setup();
    for(const mode of ['mirror-update-off','transmission-off']){
        const pending=test.probe.pairs(mode,1,0);test.renderer.render(test.main,{});
        const {rows}=await pending, row=rows.find(row=>row.mode===mode);
        if(mode==='mirror-update-off')assert.equal(row.passes.reflection,undefined);
        else assert.equal(row.passes.offscreen,undefined);
        assert.equal(test.material.transmission,1);assert.equal(test.mirror.onBeforeRender,test.original.mirror);
    }
    test.probe.dispose();
});
it('restaure les personnages et les hooks même si le rendu échoue',async()=>{
    const test=await setup();test.fail();
    void test.probe.pairs('actors-draw-off',1,0);
    assert.throws(()=>test.renderer.render(test.main,{}),/injected render failure/);
    assert.equal(test.root.visible,true);
    test.probe.dispose();assert.equal(test.renderer.render,test.original.render);assert.equal(test.renderer.shadowMap.enabled,true);
});
it('exclut la chauffe des blocs de cadence et restaure la résolution',async()=>{
    const test=await setup();
    const pending=test.probe.block('resolution-70',50,10);
    test.renderer.render(test.main,{});
    await test.timer();
    for(let frame=0;frame<3;frame++)test.renderer.render(test.main,{});
    await test.timer();
    const result=await pending;
    assert.equal(result.rows.length,3);
    assert.deepEqual(result.drawingBuffer,[448,336]);
    assert.equal(test.renderer.getPixelRatio(),1);
    test.probe.dispose();
});
it('trace les rendus secondaires et leurs résultats GPU sans les confondre avec les reflets',async()=>{
    const test=await setup();
    for(const mode of ['baseline','secondary-off']){
        const pending=test.probe.block(mode,50,10);
        await test.timer();
        test.secondary();test.renderer.render(test.main,{});
        await test.timer();await pending;
        assert.equal(test.probe.secondaryCount,1);
    }
    const {auxiliary}=test.probe.dispose();
    assert.equal(auxiliary[0].secondary,true);
    assert.equal(auxiliary[0].target,'feed');
    assert.equal(auxiliary[0].gpuMs,1);
});
