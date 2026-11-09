const assert = require('node:assert/strict');
exports.summary = values => {
    assert(values.length, 'No measurement samples');
    assert(values.every(Number.isFinite), 'Nonfinite measurement');
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = p => sorted[Math.ceil((sorted.length - 1) * p)];
    return { samples: values.length, median: percentile(.5), p95: percentile(.95), p99: percentile(.99), min: sorted[0], max: sorted.at(-1), dispersion: sorted.at(-1) - sorted[0] };
};
exports.assertCompatible = (actual, reference) => {
    assert.deepEqual(actual.conditions, reference.conditions, 'Incompatible performance reference (scenario/configuration/environment/cache)');
};
exports.assertArrival = (actors, maxTurnRadians) => {
    for (const actor of actors) {
        assert(actor.arrived, `Destination not reached: ${actor.id}`);
        assert(actor.turn <= maxTurnRadians, `Rotation in a loop: ${actor.id} (${actor.turn} radians)`);
    }
};
exports.referenceId = value => {
    assert.match(value, /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, 'Invalid reference identifier');
    return value;
};
exports.performanceMetrics = result => {
    const values = { startupMs: result.startupMs };
    for (const name of ['startup', 'stable', 'session']) {
        const phase = result.measurements[name];
        for (const metric of ['median', 'p95', 'p99', 'max'])
            values[`${name}.frameMs.${metric}`] = phase.frameMs[metric];
        if (phase.fps !== undefined) values[`${name}.fps`] = phase.fps;
        for (const [key, measurement] of Object.entries(phase.rendering ?? {})) values[`${name}.${key}.median`] = measurement.median;
        if (phase.gpu?.timeMs) values[`${name}.gpuMs.median`] = phase.gpu.timeMs.median;
        if (phase.memorySummary) {
            for (const [key, measurement] of Object.entries(phase.memorySummary)) {
                values[`${name}.${key}.median`] = measurement.median;
                values[`${name}.${key}.max`] = measurement.max;
            }
        }
        const tasks = Array.isArray(phase.longTasks) ? phase.longTasks : phase.longTasks.entries;
        values[`${name}.longTasks.count`] = tasks.length;
        values[`${name}.longTasks.totalMs`] = tasks.reduce((sum, task) => sum + task.duration, 0);
        for (const metric of ['submitted', 'completed', 'cancelled'])
            values[`${name}.pathfinding.${metric}`] = phase.pathfinding[metric];
    }
    return values;
};
exports.aggregatePerformance = results => {
    assert.equal(results.length, 3, 'A reference requires three runs');
    for (const result of results) {
        assert.equal(result.status, 'passed', 'A failed run cannot become a reference');
        exports.assertCompatible(result, results[0]);
    }
    const runs = results.map(exports.performanceMetrics);
    for (const run of runs) assert.deepEqual(Object.keys(run), Object.keys(runs[0]), 'Metric availability changed between runs; repeat the campaign');
    return { id: results[0].configuration.configurationId, conditions: results[0].conditions,
        metrics: Object.fromEntries(Object.keys(runs[0]).map(key => [key, exports.summary(runs.map(run => run[key]))])) };
};

// An alert requires the entire observed run range to move beyond the reference range.
exports.compareMetric = (actual, expected, higherIsWorse = true) => ({
    absolute: actual.median - expected.median,
    percent: expected.median === 0 ? null : (actual.median / expected.median - 1) * 100,
    alert: higherIsWorse ? actual.min > expected.max : actual.max < expected.min,
    overlapsReference: actual.min <= expected.max && actual.max >= expected.min,
});
