const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { CHARACTER_CONTROL_ANIMATIONS } = load('src/features/scene/camera/cameraSubjects.ts', {});

it('déclenche uniquement les actions du PNJ actif à l’appui, hors pilotage et previews', () => {
  const previousDocument = global.document;
  const listeners = new Set(), calls = [], cleanups = [];
  const cameraState = { mode: 'follow', positions: { miley: {} }, animalTarget: null };
  const controller = { configure() {}, connect() {}, playControlAnimation: animation => calls.push(animation) };
  global.document = {
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  try {
    const { useAgentController } = load('src/features/scene/ai/useAgentController.ts', {
      react: { useMemo: factory => factory(), useLayoutEffect() {}, useEffect: effect => cleanups.push(effect()) },
      './agentController': { createAgentController: () => controller },
      '../cameraState': { cameraState },
      '../camera/cameraSubjects': { CHARACTER_CONTROL_ANIMATIONS },
      '../store/useSceneStore': { useSceneStore: { getState: () => ({ activeCharacterId: 'miley' }) } },
    });
    useAgentController('miley', null);
    useAgentController('rosanna', null);
    useAgentController('miley:preview', null, false, undefined, undefined, 0, false, 'idle', false);
    const input = (key, pressed = true) => listeners.forEach(listener => listener({ detail: { key, pressed } }));
    input('character:Elevate'); input('character:Elevate', false);
    input('character:Descend'); input('character:ArrowUp'); input('camera:Elevate');
    assert.deepEqual(calls, Object.values(CHARACTER_CONTROL_ANIMATIONS));
    for (const state of [{ animalTarget: 'drone' }, { isIntroRunning: true }, { mode: 'plane' }]) {
      Object.assign(cameraState, { animalTarget: null, isIntroRunning: false, mode: 'follow' }, state);
      input('character:Elevate');
    }
    assert.equal(calls.length, 2);
  } finally {
    cleanups.forEach(cleanup => cleanup?.());
    assert.equal(listeners.size, 0);
    if (previousDocument === undefined) delete global.document; else global.document = previousDocument;
  }
});
