const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { run } = require('node:test');
const { spec } = require('node:test/reporters');
const { writeReport } = require('./support/report.cjs');
const { referenceId, powerReferenceId, assertReferencePower, assertCompatible, aggregatePerformance, compareMetric } = require('./support/statistics.cjs');
const { hostMetrics } = require('./support/host-metrics.cjs');
const fixtures = require('./fixtures/cases.cjs');
const rendering = require('./fixtures/rendering.cjs');
async function main() {
    const suite = process.argv[2];
    if (!['studio', 'perf'].includes(suite))
        throw Error('Expected studio or perf');
    const options = {};
    for (const argument of process.argv.slice(3)) {
        if (argument === '--hardware-gpu')
            continue;
        const match = /^--(case|reference|approve-reference)=(.+)$/.exec(argument);
        if (!match)
            throw Error(`Unknown argument: ${argument}`);
        if (options[match[1]])
            throw Error(`Duplicate argument: ${match[1]}`);
        options[match[1]] = match[2];
    }
    if (suite === 'studio' && (options.reference || options['approve-reference']))
        throw Error('References apply only to performance');
    if (options.reference && options['approve-reference'])
        throw Error('Select comparison OR explicit approval');
    if (suite === 'perf' && !options.case)
        throw Error('Select configurations explicitly: --case=0-low,7-mid (or --case=all)');
    const cases = suite === 'perf' ? Object.values(fixtures.performance) : [...fixtures.navigation, ...fixtures.interactions, ...rendering];
    const selected = options.case === 'all' ? cases.map(c => c.id) : (options.case?.split(',') ?? cases.map(c => c.id));
    if (new Set(selected).size !== selected.length)
        throw Error('Duplicate case selection');
    for (const id of selected)
        if (!cases.some(c => c.id === id))
            throw Error(`Unknown case ${id}; available: ${cases.map(c => c.id).join(', ')}`);
    options.cases = selected;
    if (options.reference)
        referenceId(options.reference);
    if (options['approve-reference'])
        referenceId(options['approve-reference']);
    const hostAtStart = suite === 'perf' ? await hostMetrics() : null;
    options.powerMode = hostAtStart?.powerMode;
    const referenceName = options.reference && powerReferenceId(options.reference, options.powerMode);
    const reference = referenceName && JSON.parse(fs.readFileSync(path.resolve('tests/references', `${referenceName}.json`)));
    if (reference) {
        if (reference.schema !== 3)
            throw Error('Unsupported reference schema');
        if (JSON.stringify(reference.aggregates.map(a => a.id)) !== JSON.stringify(selected))
            throw Error('Incompatible reference case selection');
        options.referenceConditions = Object.fromEntries(reference.aggregates.map(a => [a.id, a.conditions]));
    }
    const referencePath = options['approve-reference'] && path.resolve('tests/references', `${powerReferenceId(options['approve-reference'], options.powerMode)}.json`);
    if (referencePath && fs.existsSync(referencePath))
        throw Error('Reference already exists; choose a new identifier');
    const directory = path.resolve('test-results', `${new Date().toISOString().replaceAll(':', '-')}-${suite}`);
    fs.mkdirSync(directory, { recursive: true });
    process.env.ROOM_TEST_SUITE = suite;
    process.env.ROOM_TEST_RESULTS = directory;
    process.env.ROOM_TEST_OPTIONS = JSON.stringify(options);
    const report = { suite, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()), startedAt: new Date().toISOString(), hostAtStart, options, results: [] };
    process.env.ROOM_TEST_COMMIT = report.commit;
    process.env.ROOM_TEST_DIRTY = String(report.dirty);
    const save = () => writeReport(directory, report);
    save();
    const files = suite === 'perf' ? ['tests/studio/performance/performance.test.cjs'] : ['tests/studio/navigation/navigation.test.cjs', 'tests/studio/interactions/interactions.test.cjs', 'tests/studio/rendering/shadows.test.cjs'];
    const logPath = path.join(directory, 'runner.log');
    const stdoutWrite = process.stdout.write, stderrWrite = process.stderr.write;
    const capture = original => function (chunk, ...args) { fs.appendFileSync(logPath, chunk); return original.call(this, chunk, ...args); };
    process.stdout.write = capture(stdoutWrite);
    process.stderr.write = capture(stderrWrite);
    if (suite === 'perf') {
        console.log(`[perf] ${selected.length * 3} passages headless ; avancement toutes les 5 s. Alimentation : ${options.powerMode}. RAM disponible : ${(hostAtStart.availableBytes / 1024 ** 3).toFixed(2)} Gio ; swap utilisé : ${(hostAtStart.swapUsedBytes / 1024 ** 3).toFixed(2)} Gio.`);
        console.log(`[perf] Rapports et logs : ${directory}`);
        if (referenceName || referencePath) console.log(`[perf] Référence ${referenceName ? 'comparée' : 'à créer'} : ${referenceName ?? path.basename(referencePath, '.json')}`);
    }
    const stream = run({ files, isolation: 'none', concurrency: 1, argv: process.argv.includes('--hardware-gpu') ? ['--hardware-gpu'] : [] });
    let failures = 0;
    stream.on('test:fail', () => { failures++; });
    const output = stream.compose(spec());
    output.pipe(process.stdout);
    await new Promise((resolve, reject) => { output.on('end', resolve); output.on('error', reject); });
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    for (const id of selected) {
        const passes = suite === 'perf' ? [1, 2, 3] : [null];
        for (const pass of passes) {
            const filename = path.join(directory, pass ? `${id}-run-${pass}` : id, 'result.json');
            report.results.push(fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename)) : { id: pass ? `${id}-run-${pass}` : id, status: 'failed', error: 'No completed result — inspect runner.log' });
        }
    }
    try {
        if (failures || report.results.some(r => r.status !== 'passed'))
            throw Error('Test campaign failed');
        if (suite === 'perf') {
            if (options.reference || referencePath) for (const result of report.results) assertReferencePower(result, options.powerMode);
            report.aggregates = selected.map(id => {
                const results = report.results.filter(r => r.configuration.configurationId === id);
                return aggregatePerformance(results);
            });
            if (options.reference) {
                report.comparison = report.aggregates.map((actual, i) => {
                    const expected = reference.aggregates[i];
                    assertCompatible(actual, expected);
                    return { id: actual.id, informative: true, deltas: Object.fromEntries(Object.entries(actual.metrics).map(([key, metric]) => [key, compareMetric(metric, expected.metrics[key], !key.endsWith('.fps'))])) };
                });
            }
            if (referencePath)
                fs.writeFileSync(referencePath, JSON.stringify({ schema: 3, commit: report.commit, approvedAt: new Date().toISOString(), aggregates: report.aggregates }, null, 2), { flag: 'wx' });
        }
    }
    catch (error) {
        report.error = error.stack;
        process.exitCode = 1;
    }
    save();
    console.log(`Rapport Markdown : ${directory}/report.md`);
    console.log(`Ouvrir : zeditor '${directory}/report.md'`);
    console.log(`Rapport JSON : ${directory}/report.json`);
    for (const aggregate of report.aggregates ?? []) {
        const m = aggregate.metrics;
        if (m['session.fps']) console.log(`${aggregate.id}: FPS moyen par passage, médiane ${m['session.fps'].median.toFixed(2)} (min ${m['session.fps'].min.toFixed(2)}, max ${m['session.fps'].max.toFixed(2)}).`);
        const frames = ['median', 'p95', 'p99'].map(key => m[`session.frameMs.${key}`].median.toFixed(1)).join(' / ');
        const pause = m['session.frameMs.max'];
        console.log(`${aggregate.id}: démarrage médian ${(m.startupMs.median / 1000).toFixed(2)} s; images p50/p95/p99 ${frames} ms; interruption max médiane ${pause.median.toFixed(1)} ms (min ${pause.min.toFixed(1)}, max ${pause.max.toFixed(1)}, dispersion ${pause.dispersion.toFixed(1)}).`);
        console.log(`Mémoire: pic RSS Chrome médian ${(m['session.chromeRssBytes.max'].median / 1024 ** 3).toFixed(2)} GiB (pages partagées comptées plusieurs fois); pic tas JS médian ${(m['session.jsHeapUsedBytes.max'].median / 1024 ** 2).toFixed(1)} MiB.`);
    }
    for (const comparison of report.comparison ?? []) {
        const alerts = Object.entries(comparison.deltas).filter(([, delta]) => delta.alert).map(([key]) => key);
        console.log(`${comparison.id}: alertes hors dispersion : ${alerts.join(', ') || 'aucune'}`);
        const keys = ['startupMs', 'session.frameMs.p95', 'session.frameMs.p99', 'session.chromeRssBytes.max'];
        console.log(`${comparison.id}, écarts informatifs: ${keys.map(key => `${key} ${comparison.deltas[key].percent === null ? 'référence nulle' : comparison.deltas[key].percent.toFixed(1) + '%'}`).join('; ')}`);
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
