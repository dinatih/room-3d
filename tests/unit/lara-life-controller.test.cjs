const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');

// Exercise the actual controller with a synchronous navigation world. Geometry,
// GLB playback and posture transitions are covered by the browser scenario.
function world(id = 'native', withMeal = false, withSleep = false, withHygiene = false) {
  const nativeLife = life.createLife(), logs = [], reservations = new Map();
  const candidates = ['work', 'rest', 'walk'].map((activity, index) => ({ activity,
    id: activity === 'work' ? 'desk-bollsidan-2' : activity, slotId: 'use', x: 10 + index * 10, z: 10 }));
  const objects = Object.fromEntries(candidates.map(candidate => [candidate.id, { id: candidate.id, name: candidate.id,
    position: [candidate.x, 0, candidate.z], slots: [{ slotId: 'use', animation: candidate.activity, duration: 1 }] }]));
  const MEAL_PREPARATION = { id: 'cuisine-group', slotId: 'cook-stove' };
  objects[MEAL_PREPARATION.id] = { id: MEAL_PREPARATION.id, name: 'Kitchen', position: [40, 0, 10], slots: [{ slotId: MEAL_PREPARATION.slotId, animation: 'cook' }] };
  if (withMeal) candidates.push({ ...candidates[1], activity: 'meal' });
  if (withSleep) {
    candidates.push({ activity: 'sleep', id: 'sleep', slotId: 'use', x: 50, z: 10 });
    objects.sleep = { id: 'sleep', name: 'Bed', position: [50, 45, 10], slots: [{ slotId: 'use', animation: 'laying-sleeping' }] };
  }
  const sequence = (objectId, slotId) => [{ type: 'USE_OBJECT', smartObjectId: objectId, slotId, animation: objects[objectId].slots[0].animation, duration: 1 }];
  if (withHygiene) for (const activity of ['toilet', 'wash-hands']) {
    candidates.push({ activity, id: activity, slotId: 'use', x: 60, z: 10 });
    objects[activity] = { id: activity, name: activity, position: [60, 0, 10], slots: [{ slotId: 'use', animation: activity }] };
  }
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
    './smartObjectRegistry': { SMART_OBJECTS: objects, getSmartObject: objectId => objects[objectId], buildSmartObjectInstructionSequence: sequence, isDuoSlot: objectId => Boolean(objects[objectId]?.isDuo) },
    './autonomousActivities': { getAvailableAutonomousActivities: () => candidates, MEAL_PREPARATION,
      getLaraLifeCandidates: dirty => candidates.filter(c => c.activity !== 'wash-hands' || dirty), buildLaraLifeInstructions: candidate => candidate.activity === 'toilet' ? [
        { ...sequence('toilet', 'use')[0], duration: 3, lifePhase: 'use-toilet' },
        { type: 'WAIT', animation: 'flush', duration: 1, lifePhase: 'flush' },
        { ...sequence('wash-hands', 'use')[0], lifePhase: 'wash-hands' },
      ] : candidate.activity === 'wash-hands' ? [{ ...sequence('wash-hands', 'use')[0], lifePhase: 'wash-hands' }]
      : candidate.activity === 'meal' ? [
        { ...sequence(MEAL_PREPARATION.id, MEAL_PREPARATION.slotId)[0], animation: 'cook', lifePhase: 'prepare-meal' },
        { ...sequence(candidate.id, candidate.slotId)[0], animation: 'eat', lifePhase: 'eat-meal' },
      ] : candidate.activity === 'sleep' ? [
        { type: 'MOVE_TO', targetPos: [50, 45, 10] },
        { ...sequence(candidate.id, candidate.slotId)[0], lifePhase: 'sleep' },
        { type: 'MOVE_TO', targetPos: [50, 0, 10], lifePhase: 'wake-up' },
      ] : sequence(candidate.id, candidate.slotId) },
    './laraLife': life, './laraLifeStore': { nativeLife, useLaraLifeStore: { setState: state => Object.assign(snapshot, state) } },
    './occupancyManager': { OccupancyManager: occupancy },
    './duoSessionManager': { duoSessionManager: { leaveDuoZone: noop, getSessionFor: noop, startDuoSession: () => null } },
    '../animations/duoAnimations': { getDuoAnimationForClip: noop },
    './navigation/service': { createRouteState: () => ({}), resetRoute: route => { route.error = null; }, recoverDoorContact: () => undefined,
      followRoute: (route, actor, start, goal) => {
        attempts.push(goal.x); route.crowd = crowdWait ? {} : undefined;
        if (crowdWait) { route.error = crowdWait === 'blocked' ? 'sealed' : null; return start; }
        if (goal.x === objects[failedId]?.position[0]) { route.error = 'sealed'; return start; }
        route.error = null; return goal;
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
      return object ? { tx: object.position[0], ty: object.position[1], tz: object.position[2], anim: object.slots[0].animation, label: object.id }
        : { tx: instruction.targetPos?.[0] ?? 0, ty: instruction.targetPos?.[1], tz: instruction.targetPos?.[2] ?? 0, label: 'pause' };
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
  return { controller, nativeLife, logs, tick, snapshot, attempts, reservations, candidates, objects,
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

it('attend un contournement sans sad et laisse un vrai échec visible jusqu’à sa résolution', () => {
  const w = world('rosanna');
  w.controller.configure({ scenario: [{ type: 'MOVE_TO', targetPos: [100, 0, 10] }], loop: false });
  w.pauseCrowd(true); w.tick();
  assert.equal(w.controller.getStatus(), 'MOVING');
  assert.equal(w.controller.state.animation, 'idle');
  assert(w.logs.some(log => log.action === 'nav_blocked'), 'The wait must remain visible in diagnostics');
  w.pauseCrowd('blocked'); w.tick();
  assert.equal(w.controller.getStatus(), 'BLOCKED');
  assert.equal(w.controller.state.animation, 'sad-idle');
  for (let i = 0; i < 10; i++) w.tick();
  assert.equal(w.controller.state.animation, 'sad-idle', 'A stalled route must not be hidden by an animation deadline');
  assert.equal(w.controller.getStatus(), 'BLOCKED');
  w.pauseCrowd(false); w.tick();
  assert.equal(w.controller.state.x, 100, 'Clearing the other actor must resume the route');
  assert.notEqual(w.controller.getStatus(), 'BLOCKED');
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
  w.nativeLife.needs = { rest: 100, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
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
  w.nativeLife.needs = { rest: 100, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
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
    w.nativeLife.needs = { rest: 100, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
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

it('prépare puis mange sans satisfaire la faim pendant la préparation ou le chargement', () => {
  const w = world('native', true);
  w.tick(); w.tick();
  w.nativeLife.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0 };
  w.tick(); w.tick();
  assert.equal(w.controller.state.animation, 'cook');
  const hungry = w.nativeLife.needs.meal;
  w.nativeLife.needs.rest = 100; // A more urgent need must not replace the meal mid-sequence.
  w.tick();
  assert(w.nativeLife.needs.meal > hungry);
  assert.equal(w.nativeLife.lastActivity, 'work');
  w.tick();
  assert.equal(w.controller.state.animation, 'eat');
  const beforeEating = w.nativeLife.needs.meal;
  w.tick(1, false);
  assert(w.nativeLife.needs.meal > beforeEating, 'Loading the eating animation must not feed Lara');
  w.tick();
  assert(w.nativeLife.needs.meal < beforeEating);
  assert.equal(w.nativeLife.lastActivity, 'meal');
  assert.equal(w.reservations.size, 0);
});

it('abandonne un repas dont la cuisine est inaccessible sans boucle ni faim artificiellement satisfaite', () => {
  const w = world('native', true);
  w.tick(); w.tick();
  w.nativeLife.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0 };
  w.fail('cuisine-group');
  for (let i = 0; i < 12; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 40).length, 1);
  assert(w.nativeLife.needs.meal >= 90);
  assert.equal(w.reservations.size, 0);
});

it('récupère seulement au lit pendant le sommeil, puis se réveille et libère son lit au sol', () => {
  const w = world('native', false, true);
  w.tick(); w.tick();
  w.nativeLife.needs = { rest: 90, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
  w.tick(); w.tick();
  const beforeBed = w.nativeLife.needs.rest;
  w.tick();
  assert.equal(w.controller.state.animation, 'laying-sleeping');
  assert.equal(w.controller.state.y, 45);
  assert(w.nativeLife.needs.rest > beforeBed, 'Reaching the bed must not satisfy fatigue');
  const beforeSleep = w.nativeLife.needs.rest;
  w.tick(1, false);
  assert(w.nativeLife.needs.rest > beforeSleep, 'Loading the clip must not satisfy fatigue');
  w.tick();
  assert(w.nativeLife.needs.rest < beforeSleep);
  assert(w.snapshot.activity.includes('Se réveiller'));
  const beforeWaking = w.nativeLife.needs.rest;
  w.tick();
  assert(w.nativeLife.needs.rest >= beforeWaking, 'Leaving the bed must stop sleep recovery');
  assert.equal(w.controller.state.y, 0);
  assert.equal(w.nativeLife.lastActivity, 'sleep');
  assert.equal(w.reservations.size, 0);
});

it('conserve les mains sales après interruption et ne les nettoie qu’après le lavage réellement joué', () => {
  const w = world('native', false, false, true);
  w.tick(); w.tick();
  w.nativeLife.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 90 };
  w.tick(); w.tick();
  assert.equal(w.controller.state.animation, 'toilet');
  w.tick(1, false);
  assert(!w.nativeLife.handsDirty, 'Loading a clip does not mean using the toilet');
  w.tick();
  assert(w.nativeLife.handsDirty);
  w.controller.setPosition(10, 0, 10);
  assert(w.nativeLife.handsDirty, 'Manual interruption must preserve the obligation');
  for (let i = 0; i < 10 && w.controller.state.animation !== 'wash-hands'; i++) w.tick(1, false);
  assert.equal(w.controller.state.animation, 'wash-hands');
  w.tick(1, false);
  assert(w.nativeLife.handsDirty, 'Loading the washing clip must not clean hands');
  w.tick();
  assert(!w.nativeLife.handsDirty);
});

it('enchaîne toilettes, chasse puis lavage sans soulager les toilettes pendant la chasse', () => {
  const w = world('native', false, false, true);
  w.tick(); w.tick();
  w.nativeLife.needs.toilet = 90;
  w.tick(); w.tick();
  for (let i = 0; i < 3; i++) w.tick();
  assert(w.nativeLife.handsDirty);
  w.tick();
  assert.equal(w.controller.state.animation, 'flush');
  const beforeFlush = w.nativeLife.needs.toilet;
  w.tick();
  assert(w.nativeLife.needs.toilet > beforeFlush);
  w.tick();
  assert.equal(w.controller.state.animation, 'wash-hands');
  w.tick();
  assert(!w.nativeLife.handsDirty);
  assert.equal(w.nativeLife.lastActivity, 'toilet');
});

it('abandonne une conversation sans partenaire sans réessayer en boucle ni satisfaire artificiellement un besoin', () => {
  const w = world();
  w.tick(); w.tick();
  w.nativeLife.elapsedSeconds = 13 * 60;
  w.nativeLife.needs = { rest: 0, work: 60, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
  w.candidates.push({ activity: 'social', id: 'garden-conversation', slotId: 'chat', x: 60, z: 10 });
  w.objects['garden-conversation'] = { id: 'garden-conversation', name: 'Discussion', isDuo: true,
    position: [60, 0, 10], slots: [{ slotId: 'chat', animation: 'conversation-gestures' }] };
  w.tick(); w.tick();
  assert(w.nativeLife.needs.work >= 60, 'An unavailable conversation cannot relieve boredom');
  for (let i = 0; i < 20; i++) w.tick();
  assert.equal(w.logs.filter(log => log.action === 'life_decision' && log.object?.id === 'garden-conversation').length, 1);
  assert(w.nativeLife.elapsedSeconds > 13 * 60);
});

it('mémorise les activités jouées, jamais le chargement, et préserve les goûts après interruption', () => {
  const w = world();
  w.tick(1, false); w.tick(1, false);
  assert.deepEqual(w.nativeLife.memory, {});
  w.tick();
  assert(w.nativeLife.memory.work.satisfaction > 0);
  const memory = structuredClone(w.nativeLife.memory);
  w.controller.setPosition(50, 0, 50);
  assert.deepEqual(w.nativeLife.memory, memory);
  w.tick(0);
  assert.deepEqual(w.nativeLife.memory, memory);
});

it('distingue une discussion achevée d’une attente expirée ou d’un partenaire parti', () => {
  for (const outcome of ['completed', 'timeout', 'cancelled']) {
    const { handleDuoInteraction } = load('src/features/scene/ai/agent/agentDuoHandler.ts', {
      '../duoSessionManager': { duoSessionManager: {
        isCompletedFor: () => outcome !== 'timeout', isPlaying: () => false,
        getSessionFor: () => outcome === 'completed' ? { isSessionComplete: true } : null,
        markReady: () => {}, isWaitingPartner: () => true,
      } },
      '@features/ui/AppConsole': { appLog: () => {} },
    });
    let completed;
    assert(handleDuoInteraction({ characterId: 'native', dt: 21, state: {}, duoRole: 'roleA', duoWaitTimer: 0,
      duoInvited: false, setDuoWaitTimer: () => {}, setDuoInvited: () => {}, onSessionEnded: value => { completed = value; } }));
    assert.equal(completed, outcome === 'completed');
  }
});

it('choisit une connaissance disponible pour discuter, sans inviter le joueur ou un personnage masqué', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const unavailable of [null, 'player', 'hidden']) {
      const nativeLife = life.createLife();
      nativeLife.elapsedSeconds = 600;
      life.rememberLifeConversation(nativeLife, 'rosanna', 120);
      nativeLife.relationships.rosanna.lastAt = 0;
      const positions = { native: { x: 0, z: 0 }, marissa: { x: 20, z: 0 }, rosanna: { x: 200, z: 0 } };
      const def = { id: 'conversation', label: 'Discussion', animA: 'talk', animB: 'listen', duration: 60 };
      const { duoSessionManager } = load('src/features/scene/ai/duoSessionManager.ts', {
        '../animations/duoAnimations': { DUO_ANIMATIONS: [def], canCharacterPerformDuo: () => true },
        '../animations/duoWorldTransform': { computeWorldTransform: anchor => ({ posA: anchor, posB: [0, 0, 100], rotA: 0, rotB: Math.PI }) },
        './occupancyManager': { LIMITED_ROOMS: [], OccupancyManager: { canUseObject: () => true, claimSlot: () => true } },
        '@features/ui/AppConsole': { appLog: () => {} }, '../cameraState': { cameraState: { positions } },
        '../characterConfig': { AUTONOMOUS_NPC_IDS: new Set(Object.keys(positions)), isCharacterVisibleInMode: id => !(unavailable === 'hidden' && id === 'rosanna') },
        './smartObjectRegistry': { getSmartObject: () => ({ id: 'garden-conversation', name: 'Discussion', slots: [{ slotId: 'chat', isDuo: true, duoAnimId: 'conversation', duoCount: 1, offset: [0, 0, 0] }] }) },
        './autonomousActivities': { INITIAL_SMART_OBJECT_BY_CHAR: {} },
        '../store/useSceneStore': { useSceneStore: { getState: () => ({ activeCharacterId: unavailable === 'player' ? 'rosanna' : 'native', layers: {} }) } },
        './navigation/duoPlacement': { findDuoAnchor: anchor => anchor },
        './navigation/navigationScope': { navigationValue: (key, fn) => fn() },
        './navigation/service': { getNavigationGraph: () => ({}) }, './navigation/obstacles': { getAgentProfile: () => ({}) },
        './laraLife': life, './laraLifeStore': { nativeLife },
      });
      const result = duoSessionManager.startDuoSession('garden-conversation', 'chat', 'native');
      assert.equal(result.targetB, unavailable ? 'marissa' : 'rosanna');
      assert.deepEqual(nativeLife.relationships.rosanna, { seconds: 120, lastAt: 0 }, 'An invitation must not increase an affinity');
    }
  } finally { global.document = originalDocument; }
});
