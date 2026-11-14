// Browser-only diagnostic. Paired renders share one pose; cadence blocks run normally.
exports.installPassProbe = async function (ids) {
    const renderer = window.__THREE_GL__, main = window.__THREE_SCENE__;
    const { CHARACTERS } = await import('/src/features/scene/characterConfig.ts');
    const { resolveEntityKey } = await import('/src/features/scene/DevToolsCollector.tsx');
    const roots = ids.map(id => {
        const root = main.getObjectByName(CHARACTERS.find(character => character.id === id).name);
        if (!root?.userData.dynamicActor) throw Error(`Missing character root: ${id}`);
        return root;
    });
    const mirrors = [], transmission = new Map();
    main.traverse(object => {
        if (object.isReflector) mirrors.push({ object, before: object.onBeforeRender });
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        for (const material of materials) if (material.transmission > 0) {
            const entry = transmission.get(material) ?? { value: material.transmission, objects: new Set() };
            entry.objects.add(resolveEntityKey(object, main)); transmission.set(material, entry);
        }
    });
    const context = renderer.getContext(), timer = context.getExtension('EXT_disjoint_timer_query_webgl2');
    const render = renderer.render, shadow = renderer.shadowMap.render, direct = renderer.renderBufferDirect;
    const ratio = renderer.getPixelRatio(), shadowsEnabled = renderer.shadowMap.enabled;
    const pending = [], auxiliary = [];
    let task = null, depth = 0, shadowDepth = 0, active = 'baseline', current = null, disjoint = 0;
    const noop = () => {};
    const drain = () => {
        if (!timer) return;
        const invalid = context.getParameter(timer.GPU_DISJOINT_EXT);
        while (pending.length && (invalid || context.getQueryParameter(pending[0].query, context.QUERY_RESULT_AVAILABLE))) {
            const { query, row } = pending.shift();
            if (invalid) { row.disjoint = true; disjoint++; }
            else row.gpuMs = context.getQueryParameter(query, context.QUERY_RESULT) / 1e6;
            context.deleteQuery(query);
        }
    };
    const configure = mode => {
        renderer.shadowMap.enabled = mode === 'shadows-off' ? false : shadowsEnabled;
        for (const mirror of mirrors) mirror.object.onBeforeRender = mode === 'mirror-update-off' ? noop : mirror.before;
        for (const [material, entry] of transmission) {
            const value = mode === 'transmission-off' ? 0 : entry.value;
            if (material.transmission !== value) { material.transmission = value; material.needsUpdate = true; }
        }
    };
    renderer.shadowMap.render = function (...args) {
        if (active === 'shadow-update-off') return;
        shadowDepth++;
        try { return shadow.apply(this, args); } finally { shadowDepth--; }
    };
    renderer.renderBufferDirect = function (...args) {
        if (!current) return direct.apply(this, args);
        const label = shadowDepth ? 'shadow' : depth > 1 ? 'reflection' : renderer.getRenderTarget() ? 'offscreen' : 'main';
        const calls = renderer.info.render.calls, triangles = renderer.info.render.triangles;
        try { return direct.apply(this, args); }
        finally {
            const bucket = current.passes[label] ??= { calls: 0, triangles: 0 };
            bucket.calls += renderer.info.render.calls - calls;
            bucket.triangles += renderer.info.render.triangles - triangles;
        }
    };
    const draw = (scene, camera, mode, frame, secondary = false) => {
        drain(); configure(mode); active = mode;
        const visibility = mode === 'actors-draw-off' ? roots.map(root => root.visible) : null;
        if (visibility) roots.forEach(root => { root.visible = false; });
        const row = { mode, frame, at: performance.now(), secondary, passes: {}, programsBefore: renderer.info.programs.length };
        const previous = current; current = row;
        const query = timer ? context.createQuery() : null;
        if (query) context.beginQuery(timer.TIME_ELAPSED_EXT, query);
        const start = performance.now(); depth++;
        try { render.call(renderer, scene, camera); }
        finally {
            row.cpuMs = performance.now() - start;
            depth--; current = previous;
            if (query) { context.endQuery(timer.TIME_ELAPSED_EXT); pending.push({ query, row }); }
            row.programsAfter = renderer.info.programs.length;
            if (visibility) roots.forEach((root, index) => { root.visible = visibility[index]; });
            configure('baseline'); active = 'baseline';
        }
        return row;
    };
    renderer.render = function (scene, camera) {
        if (depth) {
            depth++;
            try { return render.call(this, scene, camera); } finally { depth--; }
        }
        if (!task) return render.call(this, scene, camera);
        const primary = scene === main && renderer.getRenderTarget() === null;
        if (!primary) {
            if (task.mode === 'secondary-off') return;
            const row = draw(scene, camera, task.kind === 'block' ? task.mode : 'baseline', task.frame, true);
            Object.assign(row, { target: renderer.getRenderTarget()?.uuid, scene: scene.name, camera: camera.type });
            auxiliary.push(row);
            return;
        }
        const frame = task.frame++;
        if (task.kind === 'pairs') {
            const modes = frame % 2 ? [task.mode, 'baseline'] : ['baseline', task.mode];
            for (const mode of modes) {
                const row = draw(scene, camera, mode, frame);
                if (frame >= task.warmFrames) task.rows.push(row);
            }
            if (task.frame >= task.warmFrames + task.frames) { const done = task.resolve; task = null; done(); }
        } else {
            const row = draw(scene, camera, task.mode, frame);
            task.rows.push(row);
        }
    };
    const waitQueries = async () => {
        const start = performance.now();
        while (pending.length) {
            drain();
            if (performance.now() - start > 10000) throw Error('GPU timer results did not arrive');
            if (pending.length) await new Promise(requestAnimationFrame);
        }
    };
    window.__passProbe = {
        get secondaryCount() { return auxiliary.length; },
        info: { timerAvailable: !!timer, ratio, roots: roots.map(root => root.name), mirrors: mirrors.length,
            transmission: [...transmission].map(([material, entry]) => ({ name: material.name, value: entry.value, objects: [...entry.objects] })) },
        async pairs(mode, frames = 60, warmFrames = 12) {
            const rows = [];
            await new Promise(resolve => { task = { kind: 'pairs', mode, frames, warmFrames, rows, resolve, frame: 0 }; });
            await waitQueries();
            return { mode, rows, disjoint };
        },
        async block(mode, durationMs = 8000, settleMs = 2000) {
            renderer.setPixelRatio(mode === 'resolution-70' ? ratio * 0.7 : ratio);
            const rows = [];
            task = { kind: 'block', mode, rows, frame: 0 };
            try {
                await new Promise(resolve => setTimeout(resolve, settleMs));
                rows.length = 0;
                const start = performance.now();
                await new Promise(resolve => setTimeout(resolve, durationMs));
                const elapsedMs = performance.now() - start;
                task = null; await waitQueries();
                return { mode, elapsedMs, rows, drawingBuffer: [context.drawingBufferWidth, context.drawingBufferHeight], disjoint };
            } finally { task = null; renderer.setPixelRatio(ratio); configure('baseline'); }
        },
        dispose() {
            task = null; renderer.render = render; renderer.shadowMap.render = shadow; renderer.renderBufferDirect = direct;
            renderer.setPixelRatio(ratio); configure('baseline');
            for (const { query } of pending) context.deleteQuery(query);
            return { auxiliary, disjoint };
        },
    };
};
