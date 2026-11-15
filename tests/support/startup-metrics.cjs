// Test-only startup instrumentation. Stops recording when preparation finishes.
exports.installStartupMetrics = function () {
    const phases = [], calls = [];
    let previous, done = false, renderer;
    const phase = () => document.getElementById('loading-item')?.textContent ?? null;
    const observe = () => {
        const text = phase();
        if (text && text !== previous) {
            phases.push({ at: performance.now(), text }); previous = text;
            if (text === '✅ Scène 3D prête') { done = true; observer.disconnect(); }
        }
    };
    const observer = new MutationObserver(observe);
    observer.observe(document, { subtree: true, childList: true, characterData: true });
    Object.defineProperty(window, 'threeGl', {
        configurable: true, get: () => renderer,
        set(gl) {
            renderer = gl;
            const compile = gl.compileAsync, render = gl.render, init = gl.initTexture;
            let renderDepth = 0;
            gl.compileAsync = function (object, camera, target) {
                if (done) return compile.apply(this, arguments);
                const scene = target ?? object, traverse = scene.traverseVisible;
                const row = { method: 'compileAsync', at: performance.now(), phase: phase(), target: object.name, scans: 0, visits: 0 };
                calls.push(row);
                scene.traverseVisible = function (callback) {
                    row.scans++;
                    return traverse.call(this, node => { row.visits++; callback(node); });
                };
                let promise;
                try { promise = compile.apply(this, arguments); }
                finally { row.syncMs = performance.now() - row.at; scene.traverseVisible = traverse; }
                return promise.then(value => { row.elapsedMs = performance.now() - row.at; return value; });
            };
            gl.render = function () {
                if (done || renderDepth) return render.apply(this, arguments);
                const row = { method: 'render', at: performance.now(), phase: phase() };
                calls.push(row); renderDepth++;
                try { return render.apply(this, arguments); }
                finally { row.syncMs = performance.now() - row.at; renderDepth--; }
            };
            gl.initTexture = function () {
                if (done) return init.apply(this, arguments);
                const row = { method: 'initTexture', at: performance.now(), phase: phase() };
                calls.push(row);
                try { return init.apply(this, arguments); }
                finally { row.syncMs = performance.now() - row.at; }
            };
        },
    });
    window.__startupMetrics = { phases, calls, get done() { return done; } };
};
