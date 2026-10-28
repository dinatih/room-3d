const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');

// Exercise the actual controller with a synchronous navigation world. Geometry,
// GLB playback and posture transitions are covered by the browser scenario.
function world(id = 'native') {
  const nativeLife = life.createLife(), logs = [], reservations = new Map();
  const candidates = ['work', 'rest', 'walk'].map((activity, index) => ({ activity,
    id: activity === 'work' ? 'desk-bollsidan-2' : activity, slotId: 'use', x: 10 + index * 10, z: 10 }));
  const objects = Object.fromEntries(candidates.map(candidate => [candidate.id, { id: candidate.id, name: candidate.id,
    position: [candidate.x, 0, candidate.z], slots: [{ slotId: 'use', animation: candidate.activity, duration: 1 }] }]));
  const sequence = (objectId, slotId) => [{ type: 'USE_OBJECT', smartObjectId: objectId, slotId, animation: objects[objectId].slots[0].animation, duration: 1 }];
  let revision = 0, failedId, actorBlockedId, crowdWait, navigationPending, attempts = [], snapshot = {};
  class NavigationBlockedError extends Error { constructor() { super('actor in the approach'); this.target = { x: 20, z: 10 }; } }
  class NavigationPending { constructor(job) { this.job = job; } }
  const graph = {}, cameraState = { isSceneLaunched: true, positions: {} };
  const occupancy = { canUseObject: () => true, isSlotOccupied: () => false,
    claimSlot: (objectId, slotId, characterId) => (reservations.set(`${objectId}:${slotId}`, characterId), true),
    releaseSlot: (objectId, slotId) => reservations.delete(`${objectId}:${slotId}`),
    releaseAllForCharacter: () => reservations.clear(),
    getReservations: () => [...reservations].map(([slot, characterId]) => ({ slot, characterId })) };
  const noop = () => {};
  const { createAgentController } = load('src/features/scene/ai/agentController.ts', {
    './smartObjectRegistry': { SMART_OBJECTS: objects, getSmartObject: objectId => objects[objectId], buildSmartObjectInstructionSequence: sequence, isDuoSlot: () => false },
    './autonomousActivities': { getAvailableAutonomousActivities: () => candidates,
      getLaraLifeCandidates: () => candidates, buildLaraLifeInstructions: candidate => sequence(candidate.id, candidate.slotId) },
    './laraLife': life, './laraLifeStore': { nativeLife, useLaraLifeStore: { setState: state => Object.assign(snapshot, state) } },
    './occupancyManager': { OccupancyManager: occupancy },
    './duoSessionManager': { duoSessionManager: { leaveDuoZone: noop, getSessionFor: noop } },
    '../animations/duoAnimations': { getDuoAnimationForClip: noop },
    './navigation/service': { createRouteState: () => ({}), resetRoute: route => { route.error = null; }, recoverDoorContact: () => undefined,
      followRoute: (route, actor, start, goal) => {
        attempts.push(goal.x); route.crowd = crowdWait ? {} : undefined;
        if (crowdWait) { route.error = crowdWait === 'blocked' ? 'sealed' : null; return start; }
        if (goal.x === objects[failedId]?.position[0]) { route.error = 'sealed'; return start; } return goal;
      },
      getInteractionOwner: value => value, getContainingObjectOwner: noop, getNavigationGraph: () => graph,
      describeNavigationBlock: () => 'sealed', navigationDiagnostics: noop,
      NavigationBlockedError },
    './diyChairClearance': { releaseKitchenStorageAccess: noop },
    './navigation/obstacles': { hasAgentProfile: () => true, getObstacleRevision: () => revision,
      getAgentProfile: () => ({ radius: 10, height: 170 }), furnitureObstacles: new Map() },
    './navigation/geometry': { distance: (a, b) => Math.hypot(a.x - b.x, a.z - b.z), BOOLEAN_PRECISION: 1e-6 },
    '../store/useSceneStore': { useSceneStore: { getState: () => ({ activeCharacterId: id, triggerAction: noop }) } },
    '@features/ui/AppConsole': { appLog: (actor, message, meta) => logs.push({ actor, message, ...meta }) },
    '../animOptions': { getEstimatedClipDuration: () => 1 },
    '../animations/animationResolver': { resolveAnimationId: value => value, getAnimationDef: () => ({ duration: 1 }), resolveSlotAnimation: slot => slot },
    '../cameraState': { cameraState }, './agent/agentWalkAnimations': { getRandomNpcWalkAnimation: () => 'walk', getWalkSpeedForAnimation: () => 100 },
    './agent/agentInstructionCoords': { resolveInstructionCoords: instruction => {
      if (navigationPending) throw new NavigationPending({ description: 'Construction du réseau de navigation' });
      if (actorBlockedId && instruction.smartObjectId === actorBlockedId) throw new NavigationBlockedError();
      const object = objects[instruction.smartObjectId];
      return object ? { tx: object.position[0], ty: 0, tz: object.position[2], anim: object.slots[0].animation, label: object.id }
        : { tx: instruction.targetPos?.[0] ?? 0, tz: instruction.targetPos?.[2] ?? 0, label: 'pause' };
    } },
    './agent/agentAvoidance': { setAgentVelocity: noop, computeRotYStep: (from, to) => to, isAgentDestinationFree: () => true,
      beginActorBlockCheck: noop, endActorBlockCheck: () => new Map([['other', 'position']]), actorBlocksUnchanged: () => Boolean(actorBlockedId) },
    './agent/agentDuoHandler': {}, './navigation/doorRequests': { releaseAgentDoors: noop },
    '@features/scene/utils/deskScreenVideo': { setDesk2SmartActionState: noop },
    './navigation/navigationScope': { NavigationScope: class { clear() {} run(callback) { return callback(); } }, NavigationPending },
    '@/devLog': { devLog: noop, DEV_LOG_ENABLED: false }, '../idleState': { isAppIdle: () => false },
  });
  const scenario = sequence('desk-bollsidan-2', 'use');
  const controller = createAgentController(id, scenario, true, () => ({ x: 10, y: 0, z: 10, rotY: 0 }));
  controller.configure({ scenario, loop: true, landingAnim: 'idle' });
  const tick = (seconds = 1, playback = true) => {
    if (playback) controller.reportAnimationPlayback(controller.state.animation, 0.5, false);
    return controller.update(seconds);
  };
  return { controller, nativeLife, logs, tick, snapshot, attempts,
    pauseCrowd: value => { crowdWait = value; },
    pauseNavigation: value => { navigationPending = value; },
    fail: objectId => { failedId = objectId; }, changeGeometry: () => { revision++; }, blockActor: objectId => { actorBlockedId = objectId; } };
}

it('joue les actions de la manette sur place et attend la fin réelle du clip avant de reprendre', () => {
  for (const id of ['native', 'rosanna']) for (const animation of ['miley-armature-cheer-feminine-jump', 'miley-armature-fall-down-f']) {
    const w = world(id);
    w.controller.playControlAnimation(animation);
    assert(w.controller.hasPendingDynamicTask());
    w.tick(1, false);
    assert.equal(w.controller.state.animation, animation);
    assert.equal(w.controller.state.x, 10);
    assert.equal(w.controller.state.z, 10);
    w.tick(30, false);
    assert.equal(w.controller.state.animation, animation, 'Le chargement asynchrone ne doit pas consommer le clip');
    w.controller.reportAnimationPlayback(animation, 1, true);
    w.tick(1, false);
    assert(!w.controller.hasPendingDynamicTask());
  }
});

it('attend un calcul sans conserver le sad de l’action précédente, puis reprend', () => {
  const w = world('rosanna');
  w.controller.configure({ scenario: [{ type: 'MOVE_TO', targetPos: [100, 0, 10] }], loop: false });
  w.controller.state.animation = 'sad-idle';
  w.pauseNavigation(true);
  for (let i = 0; i < 5; i++) {
    w.tick(1, false);
    assert.equal(w.controller.state.animation, 'idle', 'Network preparation must never display sad');
  }
  assert(w.logs.some(log => log.action === 'nav_waiting'));
  w.pauseNavigation(false); w.tick();
  assert.equal(w.controller.state.x, 100);
});

it('attend un contournement sans sad et limite un échec à 250 ms sans cacher son état bloqué', () => {
  const previousClock = globalThis.performance;
  let now = 0;
  globalThis.performance = { now: () => now };
  try {
    const w = world('rosanna');
    w.controller.configure({ scenario: [{ type: 'MOVE_TO', targetPos: [100, 0, 10] }], loop: false });
    w.pauseCrowd(true); w.tick();
    assert.equal(w.controller.getStatus(), 'MOVING');
    assert.equal(w.controller.state.animation, 'idle');
    assert(w.logs.some(log => log.action === 'nav_blocked'), 'The wait must remain visible in diagnostics');
    w.pauseCrowd('blocked'); w.tick();
    assert.equal(w.controller.getStatus(), 'BLOCKED');
    assert.equal(w.controller.state.animation, 'sad-idle');
    now = 249; w.tick();
    assert.equal(w.controller.state.animation, 'sad-idle');
    now = 250; w.tick();
    assert.equal(w.controller.state.animation, 'idle');
    now = 1000; w.tick();
    assert.equal(w.controller.state.animation, 'idle', 'Repeated failures must not restart sad while still stopped');
    assert.equal(w.controller.getStatus(), 'BLOCKED');
    w.pauseCrowd(false); w.tick();
    assert.equal(w.controller.state.x, 100, 'Clearing the other actor must resume the route');
  } finally { globalThis.performance = previousClock; }
});

it('préserve une animation sad explicitement demandée par une interaction', () => {
  const w = world('rosanna');
  w.controller.configure({ scenario: [{ type: 'WAIT', duration: 3, animation: 'sad-idle' }], loop: false });
  w.tick(.5, false); w.tick(.5, false);
  assert.equal(w.controller.getStatus(), 'INTERACTING');
  assert.equal(w.controller.state.animation, 'sad-idle');
});

it('attend la vraie animation avant de satisfaire un besoin et de terminer l’activité', () => {
  const w = world();
  w.tick(1, false);
  const before = w.nativeLife.needs.work;
  w.tick(1, false);
  assert(w.nativeLife.needs.work > before);
  assert.equal(w.controller.getStatus(), 'INTERACTING');
  w.tick();
  assert(w.nativeLife.needs.work < before);
  assert.equal(w.nativeLife.lastActivity, 'work');
});

it('interrompt une activité autonome pour le contrôle manuel et reprend sans réinitialisation', () => {
  const w = world();
  w.tick(); w.tick(); w.tick();
  assert.equal(w.controller.hasPendingDynamicTask(), false, 'An autonomous queue must not prevent manual movement');
  const needs = { ...w.nativeLife.needs };
  w.controller.setPosition(50, 0, 50);
  assert.deepEqual(w.nativeLife.needs, needs);
  assert.equal(w.snapshot.activity, 'Commande utilisateur');
  w.tick();
  assert.equal(w.controller.state.x, 10);
  assert(w.logs.some(entry => entry.action === 'life_decision'));
  assert(w.nativeLife.needs.work < needs.work + 1);
});

it('ne retente une cible inaccessible qu’après un changement du monde', () => {
  const w = world();
  w.tick(); w.tick();
  w.nativeLife.needs = { rest: 100, work: 50, walk: 0 };
  w.fail('rest');
  for (let i = 0; i < 12; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 20).length, 1);
  assert(w.logs.some(entry => entry.action === 'nav_blocked'));
  w.changeGeometry();
  for (let i = 0; i < 4; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 20).length, 2);
});

it('laisse les autres personnages suivre leur scénario sans simulation de besoins', () => {
  const w = world('rosanna'), initial = { ...w.nativeLife.needs };
  for (let i = 0; i < 10; i++) w.tick();
  assert.deepEqual(w.nativeLife.needs, initial);
  assert(!w.logs.some(entry => entry.action === 'life_decision'));
});

it('réexamine une approche lorsque le personnage qui la bloquait s’écarte', () => {
  const w = world();
  w.tick(); w.tick();
  w.nativeLife.needs = { rest: 100, work: 50, walk: 0 };
  w.blockActor('rest');
  for (let i = 0; i < 12; i++) w.tick();
  const restDecisions = () => w.logs.filter(entry => entry.action === 'life_decision' && entry.object?.id === 'rest');
  assert.equal(restDecisions().length, 1);
  w.blockActor(undefined);
  for (let i = 0; i < 4; i++) w.tick();
  assert(restDecisions().length >= 2);
  assert(w.attempts.includes(20));
});

it('exécute un ordre direct avant de reprendre le choix selon les besoins', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world(), disconnect = w.controller.connect();
  try {
    w.tick();
    w.nativeLife.needs = { rest: 100, work: 0, walk: 0 };
    document.dispatchEvent(new CustomEvent('agent-force-smartobject', { detail: { targetId: 'native', objectId: 'desk-bollsidan-2', slotId: 'use' } }));
    assert.equal(w.controller.hasPendingDynamicTask(), true);
    w.tick();
    assert.equal(w.controller.state.animation, 'work');
    w.tick(); w.tick();
    assert(w.logs.some(entry => entry.action === 'direct_order'));
    assert(w.logs.some(entry => entry.action === 'life_decision' && entry.object.id === 'rest'));
  } finally {
    disconnect();
    global.document = originalDocument;
  }
});

it('garde les besoins et la décision en pause quand le personnage est masqué', () => {
  const w = world();
  w.tick();
  const needs = { ...w.nativeLife.needs }, count = w.logs.length;
  for (let i = 0; i < 10; i++) w.tick(0);
  assert.deepEqual(w.nativeLife.needs, needs);
  assert.equal(w.logs.length, count);
});
