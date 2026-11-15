const {it}=require('node:test');
const assert=require('node:assert/strict');
const {installStartupMetrics}=require('../support/startup-metrics.cjs');
function setup() {
    let observer,clock=0,text='Compilation',fail=false;
    const window={},document={getElementById:()=>({textContent:text})};
    class MutationObserver { constructor(callback){observer=callback;}observe(){}disconnect(){} }
    new Function('window','document','MutationObserver','performance',`return (${installStartupMetrics.toString()})();`)(window,document,MutationObserver,{now:()=>++clock});
    const scene={name:'scene',traverseVisible(callback){callback(scene);callback({name:'light'});}};
    const traverse=scene.traverseVisible;
    const gl={compileAsync(object,camera,target){assert.equal(this,gl);(target??object).traverseVisible(()=>{});if(fail)throw Error('compile failure');return Promise.resolve(object);},
        render(){assert.equal(this,gl);return 42;},initTexture(){assert.equal(this,gl);return 17;}};
    window.threeGl=gl;
    return {window,gl,scene,traverse,fail(){fail=true;},ready(){text='✅ Scène 3D prête';observer();}};
}
it('mesure les parcours sans modifier le résultat des méthodes et arrête la collecte après préparation',async()=>{
    const test=setup();
    assert.equal(await test.gl.compileAsync(test.scene,{}),test.scene);
    assert.equal(test.gl.render(),42);assert.equal(test.gl.initTexture({}),17);
    assert.equal(test.scene.traverseVisible,test.traverse);
    const metrics=test.window.__startupMetrics;
    assert.equal(metrics.calls[0].scans,1);assert.equal(metrics.calls[0].visits,2);
    assert.ok(metrics.calls[0].elapsedMs>=metrics.calls[0].syncMs);
    assert.equal(metrics.calls.length,3);
    test.ready();assert.equal(metrics.done,true);
    await test.gl.compileAsync(test.scene,{});test.gl.render();
    assert.equal(metrics.calls.length,3);
});
it('restaure le parcours Three.js et propage une erreur de compilation synchrone',()=>{
    const test=setup();test.fail();
    assert.throws(()=>test.gl.compileAsync(test.scene,{}),/compile failure/);
    assert.equal(test.scene.traverseVisible,test.traverse);
});
