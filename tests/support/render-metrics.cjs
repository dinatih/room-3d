// Installed only by performance tests. Includes nested mirror and shadow passes.
exports.installRenderMetrics = async function () {
    const renderer = window.__THREE_GL__, main = window.__THREE_SCENE__;
    const context = renderer.getContext();
    const timer = context.getExtension('EXT_disjoint_timer_query_webgl2');
    const original = renderer.render;
    let depth = 0, previous;
    const pending = [];
    window.__testRenderedFrames = [];
    window.__testGpu = { available: !!timer, disjoint: 0, samples: [] };
    renderer.render = function (scene, camera) {
        if (depth || scene !== main || renderer.getRenderTarget() !== null)
            return original.call(this, scene, camera);
        if (timer) {
            const disjoint = context.getParameter(timer.GPU_DISJOINT_EXT);
            while (pending.length && (disjoint || context.getQueryParameter(pending[0].query, context.QUERY_RESULT_AVAILABLE))) {
                const item = pending.shift();
                if (!disjoint) window.__testGpu.samples.push({ at: item.at, ms: context.getQueryParameter(item.query, context.QUERY_RESULT) / 1e6 });
                else window.__testGpu.disjoint++;
                context.deleteQuery(item.query);
            }
        }
        const at = performance.now(), before = { ...renderer.info.render };
        const query = timer ? context.createQuery() : null;
        if (query) context.beginQuery(timer.TIME_ELAPSED_EXT, query);
        depth++;
        try { return original.call(this, scene, camera); }
        finally {
            depth--;
            if (query) { context.endQuery(timer.TIME_ELAPSED_EXT); pending.push({ at, query }); }
            if (previous !== undefined) window.__testRenderedFrames.push({ at, ms: at - previous,
                cpuRenderMs: performance.now() - at,
                calls: renderer.info.render.calls - before.calls,
                triangles: renderer.info.render.triangles - before.triangles });
            previous = at;
        }
    };
};
