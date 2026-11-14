const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { withBrowser } = require('../tests/support/browser.cjs');
const { installPassProbe } = require('../tests/support/pass-probe.cjs');
const { summary } = require('../tests/support/statistics.cjs');
const { hostMetrics } = require('../tests/support/host-metrics.cjs');
const { createProgress } = require('../tests/support/progress.cjs');
process.env.ROOM_TEST_SUITE = 'perf';
process.env.ROOM_TEST_COMMIT = execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim();
process.env.ROOM_TEST_DIRTY = String(!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
fs.mkdirSync('test-results',{recursive:true});
const directory = fs.mkdtempSync(path.resolve('test-results/pass-audit-'));
process.env.ROOM_TEST_RESULTS = directory;
const fixture = { ...require('../tests/fixtures/cases.cjs').performance[process.argv.includes('--night') ? 'studio-9-mid-night' : 'studio-9-mid-day'],
    id:'pass-audit', localResourcesOnly:true, timeoutMs:300000 };
// Performance diagnosis needs the actual default scene from the first mount.
// Enabling layers afterwards also exercises lifecycle paths and changes the setup.
fixture.query = {...fixture.query, bnfMarker:'0'};
const progress = createProgress(fixture.id);
const report = { commit:process.env.ROOM_TEST_COMMIT, dirty:process.env.ROOM_TEST_DIRTY==='true', fixture, pairs:[], blocks:[] };
const stats = values => values.length ? summary(values) : null;
function pairSummary(data) {
    const frames = Object.values(Object.groupBy(data.rows, row=>row.frame));
    const valid = frames.filter(rows=>rows.length===2 && rows.every(row=>row.programsBefore===row.programsAfter));
    const baseline=valid.map(rows=>rows.find(row=>row.mode==='baseline'));
    const variant=valid.map(rows=>rows.find(row=>row.mode!== 'baseline'));
    const gpu = valid.filter(rows=>rows.every(row=>Number.isFinite(row.gpuMs)));
    const total = (row,key) => Object.values(row.passes).reduce((n,pass)=>n+pass[key],0);
    return { mode:data.mode, frames:valid.length, programChanges:frames.length-valid.length,
        baselineCpuMs:stats(baseline.map(row=>row.cpuMs)), variantCpuMs:stats(variant.map(row=>row.cpuMs)),
        baselineGpuMs:stats(baseline.map(row=>row.gpuMs).filter(Number.isFinite)), variantGpuMs:stats(variant.map(row=>row.gpuMs).filter(Number.isFinite)),
        gpuSavedPercent:stats(gpu.map(rows=>{const a=rows.find(row=>row.mode==='baseline').gpuMs,b=rows.find(row=>row.mode!=='baseline').gpuMs;return 100*(a-b)/a})),
        baselineCalls:stats(baseline.map(row=>total(row,'calls'))), variantCalls:stats(variant.map(row=>total(row,'calls'))),
        baselineTriangles:stats(baseline.map(row=>total(row,'triangles'))),variantTriangles:stats(variant.map(row=>total(row,'triangles'))),
        passes: [...new Set(baseline.flatMap(row=>Object.keys(row.passes)))], rows:data.rows };
}
const save = () => fs.writeFileSync(`${directory}/comparison.json`,JSON.stringify(report,null,2));
withBrowser(fixture, async(page,result)=>{
    report.hostAtStart=await hostMetrics();
    await page.waitForNetworkIdle({idleTime:1000,timeout:fixture.readinessTimeoutMs});
    progress('Vue par défaut complète ; stabilisation de 15 secondes…');
    await new Promise(resolve=>setTimeout(resolve,fixture.stableMs));
    report.conditions = await page.evaluate(async()=>{
        const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');
        const gl=window.__THREE_GL__;return {layers:useSceneStore.getState().layers,drawingBuffer:[gl.domElement.width,gl.domElement.height],programs:gl.info.programs.length};
    });
    await page.evaluate(installPassProbe,result.loaded.models.map(model=>model.id));
    report.info=await page.evaluate(()=>window.__passProbe.info);save();
    try {
        for (const mode of ['shadow-update-off','shadows-off','mirror-update-off','transmission-off','actors-draw-off']) {
            progress(`Paires à pose identique : ${mode}…`);
            const data=await page.evaluate(mode=>window.__passProbe.pairs(mode),mode);
            const row=pairSummary(data);report.pairs.push(row);save();
            progress(`${mode} : GPU ${row.baselineGpuMs?.median.toFixed(2) ?? 'indisponible'} → ${row.variantGpuMs?.median.toFixed(2) ?? 'indisponible'} ms ; dessins ${row.baselineCalls?.median} → ${row.variantCalls?.median}`);
        }
        const candidates=report.pairs.filter(row=>row.gpuSavedPercent?.median>0 && row.baselineCalls?.median!==row.variantCalls?.median);
        const best=candidates.sort((a,b)=>b.gpuSavedPercent.median-a.gpuSavedPercent.median)[0]?.mode;
        const variants=[...(best?[best]:[]),'resolution-70'];
        if(await page.evaluate(()=>window.__passProbe.secondaryCount))variants.push('secondary-off');
        const sequence=['baseline',...variants,...variants.toReversed(),'baseline'];
        report.cadenceCandidate=best ?? null;
        for(const [index,mode] of sequence.entries()) {
            progress(`Cadence normale ${index+1}/${sequence.length} : ${mode} (2 s de chauffe + 8 s)…`);
            const hostBefore=await hostMetrics();
            const data=await page.evaluate(mode=>window.__passProbe.block(mode),mode);
            const times=data.rows.slice(1).map((row,i)=>row.at-data.rows[i].at);
            const fps=times.length ? 1000*times.length/times.reduce((a,b)=>a+b,0):null;
            const block={...data,hostBefore,hostAfter:await hostMetrics(),fps,frameMs:stats(times),cpuMs:stats(data.rows.map(row=>row.cpuMs)),gpuMs:stats(data.rows.map(row=>row.gpuMs).filter(Number.isFinite))};
            report.blocks.push(block);save();progress(`${mode} : ${fps?.toFixed(1)} FPS ; GPU ${block.gpuMs?.median.toFixed(2) ?? 'indisponible'} ms`);
        }
    } finally {report.probe=await page.evaluate(()=>window.__passProbe.dispose());report.hostAtEnd=await hostMetrics();save();}
    report.browser=result.browser;report.gpu=result.loaded.renderer;
    const f=value=>value==null?'—':value.toFixed(2);
    const gib=value=>f(value/1024**3);
    const lines=['# Audit des passes du Studio','',`Commit ${report.commit}, GPU ${report.gpu}, rendu ${report.conditions.drawingBuffer.join(' × ')}, repère BNF masqué.`,
        '', `Machine : alimentation ${report.hostAtStart.powerMode} → ${report.hostAtEnd.powerMode} ; RAM disponible ${gib(report.hostAtStart.availableBytes)} → ${gib(report.hostAtEnd.availableBytes)} Gio ; variation du swap ${gib(report.hostAtEnd.swapUsedBytes-report.hostAtStart.swapUsedBytes)} Gio.`,
        '', 'Diagnostic exploratoire, PNJ actifs. Les paires rendent la même pose dans un ordre alterné ; leurs cadences doubles ne représentent pas les FPS normaux. Les blocs suivants mesurent la cadence normale avec le même instrument. Réseau externe bloqué. Aucun réglage visuel par défaut n’est modifié.',
        '', '| Diagnostic | GPU référence → test (ms médianes) | CPU rendu référence → test (ms) | Dessins référence → test | Gain GPU médian par paire |', '| --- | ---: | ---: | ---: | ---: |',
        ...report.pairs.map(row=>`| ${row.mode} | ${f(row.baselineGpuMs?.median)} → ${f(row.variantGpuMs?.median)} | ${f(row.baselineCpuMs?.median)} → ${f(row.variantCpuMs?.median)} | ${f(row.baselineCalls?.median)} → ${f(row.variantCalls?.median)} | ${f(row.gpuSavedPercent?.median)} % |`),
        '', '| Bloc de cadence | FPS | Image p95 (ms) | GPU médian (ms) | Résolution |', '| --- | ---: | ---: | ---: | --- |',
        ...report.blocks.map(row=>`| ${row.mode} | ${f(row.fps)} | ${f(row.frameMs?.p95)} | ${f(row.gpuMs?.median)} | ${row.drawingBuffer.join(' × ')} |`),
        '', 'Les diagnostics cachent temporairement certains dessins, figent des cartes ou suppriment un effet. Leur gain indique une sensibilité, pas une optimisation visuellement équivalente. Les coûts ne s’additionnent pas. `actors-draw-off` conserve la simulation et les animations CPU. `shadow-update-off` conserve la lecture des cartes précédentes. Les timings CPU incluent les appels au pilote et peuvent subir son attente.',
        '', `Matériaux transmissifs présents : ${report.info.transmission.length}. Réflecteurs recensés : ${report.info.mirrors}. Rendus secondaires hors rendu principal tracés : ${report.probe.auxiliary.length}. Requêtes GPU disjointes rejetées : ${report.probe.disjoint}.`,
        '', 'Données détaillées, conditions machine, passes, matériaux et mesures brutes : comparison.json.'];
    fs.writeFileSync(`${directory}/report.md`,lines.join('\n')+'\n');save();
    progress(`Rapport Markdown : ${directory}/report.md`);
}).catch(error=>{report.error=error.stack;save();console.error(error);process.exitCode=1});
