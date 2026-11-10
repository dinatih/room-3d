// Isolated ABBA comparison; use the regular 3 x 60 s campaign to approve a reference.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { withBrowser } = require('../tests/support/browser.cjs');
const { measure } = require('../tests/support/performance.cjs');
const { writeReport } = require('../tests/support/report.cjs');
const args = process.argv.slice(2).filter(arg => !['--hardware-gpu', '--night', '--lights'].includes(arg));
const scope = process.argv.includes('--lights') ? 'lights' : 'glass';
const modes = args.length ? args : ['original', 'scene', 'scene', 'original'];
if (modes.some(mode => !['original', 'scene'].includes(mode))) throw Error('Expected original or scene; optional --lights --night --hardware-gpu');
const period = process.argv.includes('--night') ? 'night' : 'day';
const base = require('../tests/fixtures/cases.cjs').performance[`studio-9-mid-${period}`];
process.env.ROOM_TEST_SUITE = 'perf';
const resultsRoot = path.resolve(__dirname, '../test-results');
fs.mkdirSync(resultsRoot, { recursive: true });
process.env.ROOM_TEST_RESULTS = fs.mkdtempSync(path.join(resultsRoot, `${scope}-${period}-`));
process.env.ROOM_TEST_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
process.env.ROOM_TEST_DIRTY = String(!!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
process.env.ROOM_TEST_OPTIONS = '{}';
(async () => {
    const results = [];
    for (const [index, mode] of modes.entries()) {
        const fixture = { ...base, id: `${index + 1}-${mode}`, originalSceneGlass: scope === 'glass' && mode === 'original', originalLightShader: scope === 'lights' && mode === 'original',
            behavior: `${period}, ${scope} ${mode}`, campaignStep: index + 1, campaignTotal: modes.length, sessionMs: 30000,
            reproduction: `node scripts/profile-studio-rendering.cjs ${mode}${scope === 'lights' ? ' --lights' : ''}${period === 'night' ? ' --night' : ''} --hardware-gpu` };
        await withBrowser(fixture, async (page, result, system) => {
            await measure(page, result, system, fixture);
            results.push(result);
            console.log(JSON.stringify({ mode, fps: result.measurements.session.fps, rendering: result.measurements.session.rendering, gpu: result.measurements.session.gpu, disturbances: result.disturbances }));
        });
        // withBrowser sets final status and duration after the callback returns.
        writeReport(process.env.ROOM_TEST_RESULTS, { suite: `${scope}-${period}-30s-exploratory`, commit: process.env.ROOM_TEST_COMMIT, results });
    }
    console.log(`Rapport Markdown : ${process.env.ROOM_TEST_RESULTS}/report.md`);
    console.log(`Rapport JSON : ${process.env.ROOM_TEST_RESULTS}/report.json`);
})().catch(error => { console.error(error); process.exitCode = 1; });
