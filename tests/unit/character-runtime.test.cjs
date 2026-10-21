const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { CharacterRuntime, characterRuntimeStats } = require('../../src/features/scene/character/characterRuntime.ts');
const { NavigationScope, NavigationPending, navigationQuery, navigationValue, resolveNavigation } = require('../../src/features/scene/ai/navigation/navigationScope.ts');
const THREE = require('three');
const serialization = require('../../src/features/scene/character/animationSerialization.ts');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');

describe('Moteur commun des personnages', () => {
  it('journalise la veille globale une seule fois, même quand les personnages ne sont plus mis à jour', () => {
    let idle = false, cursor = 0, frame;
    const hooks = [], effects = [], logs = [], stats = structuredClone(characterRuntimeStats);
    const previousWindow = global.window;
    global.window = {};
    try {
      const { CharacterRuntimeProvider } = load('src/features/scene/character/CharacterRuntimeProvider.tsx', {
        react: { createContext: () => ({}), useContext: () => null,
          useRef: value => hooks[cursor++] ??= { current: value },
          useState: create => [hooks[cursor++] ??= create()], useLayoutEffect: effect => effects.push(effect) },
        '@react-three/fiber': { useFrame: callback => { frame = callback; } },
        './characterRuntime': { CharacterRuntime, characterRuntimeStats: stats },
        '../idleState': { APP_IDLE_TIMEOUT_SECONDS: 120, isAppIdle: () => idle, useAppIdle: () => idle },
        '@features/ui/AppConsole': { appLog: (tag, message, meta) => logs.push({ tag, message, ...meta }) },
        './animationLibrary': { animationLibraryStats: () => ({}) },
        '../cameraState': { cameraState: { positions: { lewis: { x: 0, z: 0 } } } },
        '../ai/navigation/pathfindingClient': { pathfindingStats: {} },
        '../ai/navigation/NavigationContext': { useNavigationEnabled: () => true },
      }, source => source.replace('return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;', 'return null;'));
      const render = () => { cursor = 0; CharacterRuntimeProvider({ children: null }); effects.splice(0).forEach(effect => effect()); };
      render(); assert.equal(logs.length, 0);
      idle = true; render(); frame(null, 1 / 60); render();
      assert.equal(stats.frames, 0, 'The character loop remains suspended');
      assert.equal(logs.length, 1); assert.equal(logs[0].action, 'idle_suspend');
      assert.deepEqual(logs[0].actors, ['lewis'], 'The global pause must remain visible when filtering the console for Lewis');
      idle = false; render(); frame(null, 1 / 60);
      assert.equal(stats.frames, 1); assert.equal(logs.length, 2); assert.equal(logs[1].action, 'idle_resume');
    } finally { if (previousWindow === undefined) delete global.window; else global.window = previousWindow; }
  });

  it('avance tous les acteurs avant les poses, refuse les doublons et retire les instances démontées', () => {
    const runtime = new CharacterRuntime(structuredClone(characterRuntimeStats)), calls = [];
    const participant = id => ({ simulate: (_, dt) => calls.push(`${id}:simulate:${dt}`), animate: () => calls.push(`${id}:animate`) });
    const remove = runtime.register('a', participant('a'));
    runtime.register('b', participant('b'));
    assert.throws(() => runtime.register('a', participant('a')), /Duplicate/);
    runtime.tick(null, 1 / 60);
    assert.deepEqual(calls, ['a:simulate:0.016666666666666666', 'b:simulate:0.016666666666666666', 'a:animate', 'b:animate']);
    calls.length = 0; remove(); runtime.tick(null, 0);
    assert.deepEqual(calls, ['b:simulate:0', 'b:animate']);
  });

  it('attend une requête sans la dupliquer, conserve le choix puis libère ses résultats', () => {
    const scope = new NavigationScope();
    let created = 0, choices = 0, cancelled = 0;
    const job = { status: 'pending', settled: Promise.resolve(), cancel() { cancelled++; } };
    const operation = () => {
      const choice = navigationValue('choice', () => ++choices);
      return choice + navigationQuery('route', () => { created++; return job; });
    };
    assert.throws(() => scope.run(operation), NavigationPending);
    assert.throws(() => scope.run(operation), NavigationPending);
    assert.equal(created, 1); assert.equal(choices, 1);
    job.status = 'ready'; job.result = 7;
    assert.equal(scope.run(operation), 8); assert.equal(cancelled, 1);
    assert.equal(scope.run(operation), 9); assert.equal(created, 2); assert.equal(choices, 2);
  });

  it('reprend les commandes asynchrones et propage les erreurs du worker', async () => {
    let settle;
    const job = { status: 'pending', settled: new Promise(resolve => { settle = resolve; }), cancel() {} };
    const result = resolveNavigation(() => navigationQuery('reach', () => job));
    job.status = 'ready'; job.result = false; settle();
    assert.equal(await result, false);
    const scope = new NavigationScope();
    assert.throws(() => scope.poll(() => navigationQuery('invalid', () => ({ ...job, status: 'error', error: Error('invalid coordinates') }))), /invalid coordinates/);
    assert.throws(() => navigationQuery('outside', () => job), /requires a NavigationScope/);
  });

  it('conserve les données du retargeting après transfert du squelette et des pistes', () => {
    const rig = new THREE.Group();
    const hips = new THREE.Bone(); hips.name = 'mixamorig:Hips'; hips.position.y = 100;
    const spine = new THREE.Bone(); spine.name = 'mixamorig:Spine'; spine.position.y = 25;
    rig.add(hips); hips.add(spine); rig.updateMatrixWorld(true);
    rig.traverse(node => {
      node.defaultPosition = node.position.clone(); node.restLocalQuaternion = node.quaternion.clone();
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion()); node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
    });
    const clip = new THREE.AnimationClip('fixture', 1, [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', [0, 1], [0, 1, 0, 0, 1.1, 0]),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', [0, 1], [0, 0, 0, 1, 0, .1, 0, Math.sqrt(.99)]),
    ]);
    const expected = retargetClip(clip, rig, undefined);
    const actual = retargetClip(serialization.restoreAnimationClip(structuredClone(serialization.captureAnimationClip(clip))), serialization.restoreAnimationRig(structuredClone(serialization.captureAnimationRig(rig))), undefined);
    assert.deepEqual(actual.tracks.map(t => [t.name, [...t.times], [...t.values]]), expected.tracks.map(t => [t.name, [...t.times], [...t.values]]));
    const roundTrip = serialization.restoreAnimationClip(structuredClone(serialization.captureAnimationClip(expected)));
    assert.deepEqual(roundTrip.tracks.map(t => t.getInterpolation()), expected.tracks.map(t => t.getInterpolation()));
  });
});
