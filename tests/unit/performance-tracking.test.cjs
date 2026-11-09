const { it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { summary, compareMetric, assertCompatible } = require('../support/statistics.cjs');
const { installRenderMetrics } = require('../support/render-metrics.cjs');
const { hostMetrics } = require('../support/host-metrics.cjs');

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
