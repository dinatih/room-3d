const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { summary, assertArrival, assertCompatible, referenceId, aggregatePerformance } = require('../support/statistics.cjs');
const { deadline, closeResources } = require('../support/browser.cjs');
const { writeReport } = require('../support/report.cjs');
describe('Garde-fous de la suite', () => {
    it('teste tous les personnages du catalogue sans conserver un ancien effectif', () => {
        const { navigation } = require('../fixtures/cases.cjs');
        const { CHARACTERS } = require('../../src/features/scene/characterConfig.ts');
        const all = navigation.find(fixture => fixture.id === 'autonomous-all');
        assert.equal(all.count, CHARACTERS.length);
        for (const fixture of navigation) assert(fixture.count >= 0 && fixture.count <= CHARACTERS.length);
    });
    it('détecte intentionnellement une destination jamais atteinte et une rotation en boucle', () => {
        assert.throws(() => assertArrival([{ id: 'impossible', arrived: false, turn: 0 }], Math.PI), /Destination not reached/);
        assert.throws(() => assertArrival([{ id: 'ancienne-rotation', arrived: true, turn: 2 * Math.PI }], Math.PI), /Rotation in a loop/);
        assertArrival([{ id: 'arrivé', arrived: true, turn: Math.PI / 2 }], Math.PI);
    });
    it('refuse les références incompatibles, y compris GPU, cache, navigateur et résolution', () => {
        const conditions = { gpu: 'hardware', cache: 'cold', browser: 'Chrome/1', viewport: [1280, 720, 1], scenario: 'garden', count: 15 };
        assertCompatible({ conditions }, { conditions: structuredClone(conditions) });
        for (const key of Object.keys(conditions))
            assert.throws(() => assertCompatible({ conditions }, { conditions: { ...conditions, [key]: 'different' } }), /Incompatible/);
        assert.throws(() => referenceId('../outside'), /Invalid/);
    });
    it('observe les instructions du contrôleur réel sans modifier les sources sur disque', () => {
        const { instrumentController } = require('../support/instrument-controller.cjs');
        const source = fs.readFileSync('src/features/scene/ai/agentController.ts', 'utf8');
        const result = instrumentController(source);
        assert.match(result, /__testRecordInstruction\(_characterId, instruction\)/);
        assert.equal(result.replace('    window.__testRecordInstruction(_characterId, instruction);\n', ''), source);
        assert.throws(() => instrumentController('missing marker'), /observation point changed/);
    });
    it('exige trois passages réussis et compatibles pour agréger une référence', () => {
        const phase = value => ({ frameMs: { median: value, p95: value, p99: value, max: value }, longTasks: [], pathfinding: { submitted: 1, completed: 1, cancelled: 0 } });
        const results = [10, 20, 90].map(value => ({ status: 'passed', configuration: { configurationId: 'test' }, conditions: { renderer: 'same' }, startupMs: value, measurements: { startup: phase(value), stable: phase(value), session: phase(value) } }));
        const aggregate = aggregatePerformance(results);
        assert.equal(aggregate.metrics.startupMs.median, 20);
        assert.equal(aggregate.metrics.startupMs.dispersion, 80);
        assert.throws(() => aggregatePerformance(results.slice(0, 2)), /three runs/);
        assert.throws(() => aggregatePerformance([...results.slice(0, 2), { ...results[2], status: 'failed' }]), /failed run/);
        assert.throws(() => aggregatePerformance([...results.slice(0, 2), { ...results[2], conditions: { renderer: 'other' } }]), /Incompatible/);
    });
    it('calcule médianes, quantiles et dispersion sans seuil de performance', () => {
        assert.deepEqual(summary([5, 1, 3]), { samples: 3, median: 3, p95: 5, p99: 5, min: 1, max: 5, dispersion: 4 });
        assert.throws(() => summary([]), /No measurement/);
    });
    it('interrompt une page figée depuis Node et ferme les ressources même après échec', async () => {
        let cleaned = false, killed = false, serverClosed = false;
        await assert.rejects(closeResources({ close: async () => { throw Error('injected close failure'); }, process: () => ({ kill: signal => { killed = signal === 'SIGKILL'; } }) }, { close: async () => { serverClosed = true; } }), /injected close failure/);
        assert(killed && serverClosed);
        await assert.rejects(async () => {
            try {
                await deadline(new Promise(() => { }), 10, 'injected frozen page');
            }
            finally {
                cleaned = true;
            }
        }, /injected frozen page/);
        assert(cleaned);
    });
    it('conserve les rapports partiels JSON et Markdown après un échec', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'room-suite-'));
        try {
            const report = { suite: 'injected-failure', commit: 'test', results: [{ id: 'impossible', status: 'failed', error: 'never reached', reproduction: 'npm run test:studio -- --case=unreachable' }] };
            writeReport(directory, report);
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'report.json'))), report);
            assert.match(fs.readFileSync(path.join(directory, 'report.md'), 'utf8'), /impossible.*failed/);
        }
        finally {
            fs.rmSync(directory, { recursive: true });
        }
    });
});
