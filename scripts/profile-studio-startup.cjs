const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {withBrowser} = require('../tests/support/browser.cjs');
process.env.ROOM_TEST_SUITE='perf';
process.env.ROOM_TEST_COMMIT=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
fs.mkdirSync('test-results',{recursive:true});
const directory=fs.mkdtempSync(path.resolve('test-results/startup-audit-'));
process.env.ROOM_TEST_RESULTS=directory;
process.env.ROOM_TEST_DIRTY=String(!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
const fixture={...require('../tests/fixtures/cases.cjs').performance['studio-9-mid-day'],id:'startup',captureStartup:true,localResourcesOnly:true,timeoutMs:120000};
fixture.query={...fixture.query,bnfMarker:'0'};
withBrowser(fixture,async(page,result)=>{
    const startup=await page.evaluate(()=>window.__startupMetrics);
    fs.writeFileSync(`${directory}/startup.json`,JSON.stringify({startupMs:result.startupMs,renderer:result.loaded.renderer,host:result.hostAtStart,...startup},null,2));
    console.log('Comparaison des stratégies de compilation sur la même scène, cache déjà chaud…');
    const replay=await page.evaluate(async()=>{
        const gl=window.__THREE_GL__,scene=window.__THREE_SCENE__;
        // Capture the real main camera at the next frame, then pause rendering
        // while replaying compilation. Geometry and simulation stay mounted.
        const original=gl.render;
        const camera=await new Promise(resolve=>{
            gl.render=function(s,c){if(s===scene&&gl.getRenderTarget()===null){gl.render=original;resolve(c)}return original.call(this,s,c)};
        });
        const targets=[],seen=new Set();
        scene.traverse(object=>{
            if(!object.material)return;
            const mats=Array.isArray(object.material)?object.material:[object.material];
            if(mats.every(material=>seen.has(material)))return;
            mats.forEach(material=>seen.add(material));targets.push(object);
        });
        const rows=[];
        gl.render=()=>{};
        try{
            for(const mode of ['scene','per-material','per-material','scene']){
                let scans=0,visits=0,compilations=0;
                const traverse=scene.traverseVisible,start=performance.now(),before=gl.info.programs.length;
                scene.traverseVisible=function(callback){scans++;return traverse.call(this,node=>{visits++;callback(node)})};
                try{
                    if(mode==='per-material')for(let i=0;i<targets.length;i+=32){await Promise.all(targets.slice(i,i+32).map(mesh=>{compilations++;return gl.compileAsync(mesh,camera,scene)}))}
                    compilations++;await gl.compileAsync(scene,camera);
                }finally{scene.traverseVisible=traverse}
                rows.push({mode,ms:performance.now()-start,compilations,scans,visits,programsBefore:before,programsAfter:gl.info.programs.length});
            }
        }finally{gl.render=original}
        return {materials:seen.size,targets:targets.length,rows};
    });
    fs.writeFileSync(`${directory}/replay.json`,JSON.stringify(replay,null,2));
    const phases=startup.phases.map((row,i)=>({...row,ms:startup.phases[i+1]?.at-row.at}));
    const compile=startup.calls.filter(row=>row.method==='compileAsync');
    const lines=['# Audit de préparation 3D','',`Commit ${process.env.ROOM_TEST_COMMIT}, arbre modifié : ${process.env.ROOM_TEST_DIRTY}. GPU : ${result.loaded.renderer}. Studio neuf personnages, Mid, 1362 × 810, repère BNF masqué, réseau externe bloqué.`,
        '',`Démarrage jusqu’à disponibilité du scénario : ${(result.startupMs/1000).toFixed(2)} s. Ce délai inclut le chargement et le déploiement des personnages.`,
        '',`Compilation initiale : ${compile.length} appels, ${compile.reduce((n,x)=>n+x.scans,0)} parcours des lumières et ${compile.reduce((n,x)=>n+x.visits,0)} visites d’objets ; ${(compile.reduce((n,x)=>n+x.syncMs,0)/1000).toFixed(3)} s synchrones cumulées. Les durées asynchrones se recouvrent et ne s’additionnent pas.`,
        '', '| Phase affichée | Début (s) | Durée avant le prochain libellé (s) |','| --- | ---: | ---: |',
        ...phases.filter(row=>!row.text.startsWith('📦')).map(row=>`| ${row.text.replaceAll('|','/')} | ${(row.at/1000).toFixed(3)} | ${Number.isFinite(row.ms)?(row.ms/1000).toFixed(3):'—'} |`),
        '', '## Rejeu avec cache chaud, ordre ABBA','', 'Ce rejeu isole les parcours et l’attente de l’API ; il ne mesure pas un nouveau démarrage à froid. Le rendu normal est suspendu pendant le rejeu.',
        '', '| Stratégie | Durée (ms) | Appels | Parcours | Visites | Programmes avant → après |','| --- | ---: | ---: | ---: | ---: | ---: |',
        ...replay.rows.map(row=>`| ${row.mode} | ${row.ms.toFixed(1)} | ${row.compilations} | ${row.scans} | ${row.visits} | ${row.programsBefore} → ${row.programsAfter} |`)];
    fs.writeFileSync(`${directory}/report.md`,lines.join('\n')+'\n');
    console.log(JSON.stringify({initialCompileCalls:compile.length,replay},null,2));
    console.log(`Rapport Markdown : ${directory}/report.md`);
}).catch(error=>{console.error(error);process.exitCode=1});
