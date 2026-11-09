const { it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { summary, compareMetric, assertCompatible, powerReferenceId, assertReferencePower } = require('../support/statistics.cjs');
const { installRenderMetrics } = require('../support/render-metrics.cjs');
const { hostMetrics, powerMode } = require('../support/host-metrics.cjs');
const { createProgress } = require('../support/progress.cjs');

it('keeps AC and battery references separate and rejects unknown or changed power', () => {
    assert.equal(powerMode([{ online: true }, { online: false }]), 'ac');
    assert.equal(powerMode([{ online: false }]), 'battery');
    assert.equal(powerMode([]), 'unknown');
    assert.equal(powerReferenceId('studio-mid', 'ac'), 'studio-mid-ac');
    assert.equal(powerReferenceId('studio-mid', 'battery'), 'studio-mid-battery');
    assert.throws(() => powerReferenceId('studio-mid', 'unknown'));
    assert.throws(() => powerReferenceId('../studio', 'ac'));
    const result = { conditions: { powerMode: 'ac' }, disturbances: { powerChanged: false } };
    assertReferencePower(result, 'ac');
    assert.throws(() => assertReferencePower(result, 'battery'));
    assert.throws(() => assertCompatible(result, { conditions: { powerMode: 'battery' } }));
    result.disturbances.powerChanged = true;
    assert.throws(() => assertReferencePower(result, 'ac'));
});

it('writes progress immediately without waiting for the end of a test', () => {
    const lines = [];
    let now = Date.UTC(2026, 10, 9, 12);
    const log = createProgress('studio-run-1', true, line => lines.push(line), () => now);
    log('Chargement');
    assert.equal(lines.length, 1);
    assert.match(lines[0], /studio-run-1 12:00:00 UTC.*Chargement/);
    now += 5000; log('Mesure 5/60 s');
    assert.match(lines[1], /12:00:05 UTC.*Mesure 5\/60 s/);
    createProgress('quiet', false, line => lines.push(line))('hidden');
    assert.equal(lines.length, 2);
});

it('records host memory and explicitly identifies unavailable power and temperature sensors', async () => {
    const host = await hostMetrics();
    assert(Number.isFinite(host.availableBytes) && host.availableBytes > 0);
    assert(Number.isFinite(host.swapUsedBytes) && host.swapUsedBytes >= 0);
    assert.equal(host.powerStatus, host.power.length ? 'observed' : 'unavailable');
    assert.equal(host.temperatureStatus, host.temperatures.length ? 'observed' : 'unavailable');
});

it('alerts only outside reference dispersion, with the correct direction for FPS', () => {
    const reference = summary([40, 45, 50]);
    assert.equal(compareMetric(summary([48, 50, 54]), reference).alert, false);
    assert.equal(compareMetric(summary([51, 55, 56]), reference).alert, true);
    assert.equal(compareMetric(summary([30, 32, 33]), reference, false).alert, true);
    assert.equal(compareMetric(summary([60, 62, 63]), reference, false).alert, false);
    assert.equal(compareMetric(summary([1]), summary([0])).percent, null);
    assert.throws(() => summary([]));
    assert.throws(() => assertCompatible({ conditions: { hour: 12 } }, { conditions: { hour: 0 } }));
});

it('counts one rendered image including nested passes, excludes other canvases, and reports unavailable GPU timing', async () => {
    let now = 0, target = null;
    const main = {}, mirror = {}, other = {};
    const renderer = {
        info: { render: { calls: 0, triangles: 0 } }, getContext: () => ({ getExtension: () => null }), getRenderTarget: () => target,
        render(scene) {
            now += 2;
            this.info.render.calls += 3; this.info.render.triangles += 30;
            if (scene === main) { target = {}; this.render(mirror); target = null; }
        },
    };
    const window = { __THREE_GL__: renderer, __THREE_SCENE__: main };
    await vm.runInNewContext(`(${installRenderMetrics.toString()})()`, { window, performance: { now: () => now } });
    renderer.render(main); now += 12; renderer.render(main);
    const frames = window.__testRenderedFrames;
    assert.equal(frames.length, 1);
    assert.equal(frames[0].ms, 16); assert.equal(frames[0].cpuRenderMs, 4);
    assert.equal(frames[0].calls, 6); assert.equal(frames[0].triangles, 60);
    renderer.render(other); assert.equal(frames.length, 1);
    assert.equal(window.__testGpu.available, false);
});
