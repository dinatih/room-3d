const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');

// Exercise the actual controller with a synchronous navigation world. Geometry,
// GLB playback and posture transitions are covered by the browser scenario.
function world(id = 'native', withMeal = false, withSleep = false, withHygiene = false, diagnostics = false) {
  const journal = [];
  const characterLives = { native: life.createLife('native'), cha: life.createLife('cha') };
  const lifeState = characterLives[life.isLifeCharacter(id) ? id : 'native'], logs = [], reservations = new Map();
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
  const duo = { leaveDuoZone: noop, getSessionFor: noop, startDuoSession: () => null,
    markReady: noop, isPlaying: () => false, isWaitingPartner: () => true, getCurrentAnimState: () => null };
  const duoTicks = [];
  const { createAgentController } = load('src/features/scene/ai/agentController.ts', {
    './smartObjectRegistry': { SMART_OBJECTS: objects, getSmartObject: objectId => objects[objectId], buildSmartObjectInstructionSequence: sequence, isDuoSlot: objectId => Boolean(objects[objectId]?.isDuo) },
    './autonomousActivities': { getAvailableAutonomousActivities: () => candidates, MEAL_PREPARATION,
      getLaraLifeCandidates: (characterId, dirty) => candidates.filter(c => c.activity !== 'wash-hands' || dirty), buildLaraLifeInstructions: (characterId, candidate) => candidate.activity === 'toilet' ? [
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
      ] : sequence(candidate.id, candidate.slotId).map(step => ({ ...step, lifePhase: candidate.activity === 'social' ? 'social' : undefined })) },
    './laraLife': life, './laraLifeStore': { characterLives, publishLife: (characterId, state) => Object.assign(snapshot, state), useLaraLifeStore: { getState: () => ({ speed: 1 }) } },
    './occupancyManager': { OccupancyManager: occupancy },
    './duoSessionManager': { duoSessionManager: duo },
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
    './agent/agentDuoHandler': { handleDuoInteraction: ctx => {
      duoTicks.push(ctx.dt);
      const animation = duo.getCurrentAnimState();
      if (animation) ctx.state.animation = animation.clipA;
      return false;
    } }, './navigation/doorRequests': { releaseAgentDoors: noop },
    '@features/scene/utils/deskScreenVideo': { setDesk2SmartActionState: noop },
    './navigation/navigationScope': { NavigationScope: class { clear() {} run(callback) { return callback(); } }, NavigationPending },
    '@/devLog': { devLog: entry => journal.push(entry), DEV_LOG_ENABLED: diagnostics }, '../idleState': { isAppIdle: () => false },
  });
  const scenario = sequence(id === 'cha' ? 'walk' : 'desk-bollsidan-2', 'use');
  const controller = createAgentController(id, scenario, true, () => ({ x: 10, y: 0, z: 10, rotY: 0 }));
  controller.configure({ scenario, loop: true, landingAnim: 'idle' });
  const tick = (seconds = 1, playback = true) => {
    if (playback) controller.reportAnimationPlayback(controller.state.animation, 0.5, false);
    return controller.update(seconds);
  };
  return { controller, lifeState, logs, journal, tick, snapshot, attempts, reservations, candidates, objects, duo, duoTicks, characterLives,
    pauseCrowd: value => { crowdWait = value; },
    pauseNavigation: value => { navigationPending = value; },
    fail: objectId => { failedId = objectId; }, changeGeometry: () => { revision++; }, blockActor: objectId => { actorBlockedId = objectId; } };
}

it('termine le diagnostic d’attente lorsque l’interaction commence sans déplacement', () => {
  const w = world('rosanna', false, false, false, true);
  w.pauseNavigation(true); w.tick(.1, false);
  assert(w.journal.some(e => e.action === 'nav_stop'));
  w.pauseNavigation(false); w.tick(.1, false);
  assert.equal(w.controller.getStatus(), 'INTERACTING');
  assert.equal(w.controller.state.animation, 'work');
  const end = w.journal.find(e => e.action === 'nav_stop_end');
  assert(end, 'Une attente résolue ne doit pas englober la durée de l’interaction');
  assert.equal(end.data.movedThisFrame, false);
});

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
  const before = w.lifeState.needs.work;
  w.tick(1, false);
  assert(w.lifeState.needs.work > before);
  assert.equal(w.controller.getStatus(), 'INTERACTING');
  w.tick();
  assert(w.lifeState.needs.work < before);
  assert.equal(w.lifeState.lastActivity, 'work');
});

it('interrompt une activité autonome pour le contrôle manuel et reprend sans réinitialisation', () => {
  const w = world();
  w.tick(); w.tick(); w.tick();
  assert.equal(w.controller.hasPendingDynamicTask(), false, 'An autonomous queue must not prevent manual movement');
  const needs = { ...w.lifeState.needs };
  w.controller.setPosition(50, 0, 50);
  assert.deepEqual(w.lifeState.needs, needs);
  assert.equal(w.snapshot.activity, 'Commande utilisateur');
  w.tick();
  assert.equal(w.controller.state.x, 10);
  assert(w.logs.some(entry => entry.action === 'life_decision'));
  assert(w.lifeState.needs.work < needs.work + 1);
});

it('ne retente une cible inaccessible qu’après un changement du monde', () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 100, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0 };
  w.fail('rest');
  for (let i = 0; i < 12; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 20).length, 1);
  assert(w.logs.some(entry => entry.action === 'nav_blocked'));
  w.changeGeometry();
  for (let i = 0; i < 4; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 20).length, 2);
});

it('laisse les autres personnages suivre leur scénario sans simulation de besoins', () => {
  const w = world('rosanna'), initial = { ...w.lifeState.needs };
  for (let i = 0; i < 10; i++) w.tick();
  assert.deepEqual(w.lifeState.needs, initial);
  assert(!w.logs.some(entry => entry.action === 'life_decision'));
});

it('réexamine une approche lorsque le personnage qui la bloquait s’écarte', () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 100, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0 };
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
    w.lifeState.needs = { rest: 100, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0 };
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
  const needs = { ...w.lifeState.needs }, count = w.logs.length;
  for (let i = 0; i < 10; i++) w.tick(0);
  assert.deepEqual(w.lifeState.needs, needs);
  assert.equal(w.logs.length, count);
});

it('prépare puis mange sans satisfaire la faim pendant la préparation ou le chargement', () => {
  const w = world('native', true);
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0, company: 0 };
  w.tick(); w.tick();
  assert.equal(w.controller.state.animation, 'cook');
  const hungry = w.lifeState.needs.meal;
  w.lifeState.needs.rest = 100; // A more urgent need must not replace the meal mid-sequence.
  w.tick();
  assert(w.lifeState.needs.meal > hungry);
  assert.equal(w.lifeState.lastActivity, 'work');
  w.tick();
  assert.equal(w.controller.state.animation, 'eat');
  const beforeEating = w.lifeState.needs.meal;
  w.tick(1, false);
  assert(w.lifeState.needs.meal > beforeEating, 'Loading the eating animation must not feed Lara');
  w.tick();
  assert(w.lifeState.needs.meal < beforeEating);
  assert.equal(w.lifeState.lastActivity, 'meal');
  assert.equal(w.reservations.size, 0);
});

it('abandonne un repas dont la cuisine est inaccessible sans boucle ni faim artificiellement satisfaite', () => {
  const w = world('native', true);
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0, company: 0 };
  w.fail('cuisine-group');
  for (let i = 0; i < 12; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 40).length, 1);
  assert(w.lifeState.needs.meal >= 90);
  assert.equal(w.reservations.size, 0);
});

it('récupère seulement au lit pendant le sommeil, puis se réveille et libère son lit au sol', () => {
  const w = world('native', false, true);
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 90, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0 };
  w.tick(); w.tick();
  const beforeBed = w.lifeState.needs.rest;
  w.tick();
  assert.equal(w.controller.state.animation, 'laying-sleeping');
  assert.equal(w.controller.state.y, 45);
  assert(w.lifeState.needs.rest > beforeBed, 'Reaching the bed must not satisfy fatigue');
  const beforeSleep = w.lifeState.needs.rest;
  w.tick(1, false);
  assert(w.lifeState.needs.rest > beforeSleep, 'Loading the clip must not satisfy fatigue');
  w.tick();
  assert(w.lifeState.needs.rest < beforeSleep);
  assert(w.snapshot.activity.includes('Se réveiller'));
  const beforeWaking = w.lifeState.needs.rest;
  w.tick();
  assert(w.lifeState.needs.rest >= beforeWaking, 'Leaving the bed must stop sleep recovery');
  assert.equal(w.controller.state.y, 0);
  assert.equal(w.lifeState.lastActivity, 'sleep');
  assert.equal(w.reservations.size, 0);
});

it('conserve les mains sales après interruption et ne les nettoie qu’après le lavage réellement joué', () => {
  const w = world('native', false, false, true);
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 90, company: 0 };
  w.tick(); w.tick();
  assert.equal(w.controller.state.animation, 'toilet');
  w.tick(1, false);
  assert(!w.lifeState.handsDirty, 'Loading a clip does not mean using the toilet');
  w.tick();
  assert(w.lifeState.handsDirty);
  w.controller.setPosition(10, 0, 10);
  assert(w.lifeState.handsDirty, 'Manual interruption must preserve the obligation');
  for (let i = 0; i < 10 && w.controller.state.animation !== 'wash-hands'; i++) w.tick(1, false);
  assert.equal(w.controller.state.animation, 'wash-hands');
  w.tick(1, false);
  assert(w.lifeState.handsDirty, 'Loading the washing clip must not clean hands');
  w.tick();
  assert(!w.lifeState.handsDirty);
});

it('enchaîne toilettes, chasse puis lavage sans soulager les toilettes pendant la chasse', () => {
  const w = world('native', false, false, true);
  w.tick(); w.tick();
  w.lifeState.needs.toilet = 90;
  w.tick(); w.tick();
  for (let i = 0; i < 3; i++) w.tick();
  assert(w.lifeState.handsDirty);
  w.tick();
  assert.equal(w.controller.state.animation, 'flush');
  const beforeFlush = w.lifeState.needs.toilet;
  w.tick();
  assert(w.lifeState.needs.toilet > beforeFlush);
  w.tick();
  assert.equal(w.controller.state.animation, 'wash-hands');
  w.tick();
  assert(!w.lifeState.handsDirty);
  assert.equal(w.lifeState.lastActivity, 'toilet');
});

it('abandonne une conversation sans partenaire sans réessayer en boucle ni satisfaire artificiellement un besoin', () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.elapsedSeconds = 13 * 60;
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 90 };
  w.candidates.push({ activity: 'social', id: 'garden-conversation', slotId: 'chat', x: 60, z: 10 });
  w.objects['garden-conversation'] = { id: 'garden-conversation', name: 'Discussion', isDuo: true,
    position: [60, 0, 10], slots: [{ slotId: 'chat', animation: 'conversation-gestures' }] };
  w.tick(); w.tick();
  assert(w.lifeState.needs.company >= 90, 'An unavailable conversation cannot relieve loneliness');
  for (let i = 0; i < life.LIFE_SETTINGS.socialRetrySeconds / 2; i++) w.tick();
  assert.equal(w.logs.filter(log => log.action === 'life_decision' && log.object?.id === 'garden-conversation').length, 1);
  w.lifeState.elapsedSeconds += life.LIFE_SETTINGS.socialRetrySeconds;
  w.tick(life.LIFE_SETTINGS.pauseSeconds);
  for (let i = 0; i < 4; i++) w.tick();
  assert.equal(w.logs.filter(log => log.action === 'life_decision' && log.object?.id === 'garden-conversation').length, 2, 'Retry after a break, even if furniture is unchanged');
  assert(w.lifeState.elapsedSeconds > 13 * 60);
});

it('mémorise les activités jouées, jamais le chargement, et préserve les goûts après interruption', () => {
  const w = world();
  w.tick(1, false); w.tick(1, false);
  assert.deepEqual(w.lifeState.memory, {});
  w.tick();
  assert(w.lifeState.memory.work.satisfaction > 0);
  const memory = structuredClone(w.lifeState.memory);
  w.controller.setPosition(50, 0, 50);
  assert.deepEqual(w.lifeState.memory, memory);
  w.tick(0);
  assert.deepEqual(w.lifeState.memory, memory);
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
    assert(handleDuoInteraction({ characterId: 'native', dt: 21, waitDt: 21, state: {}, duoRole: 'roleA', duoWaitTimer: 0,
      duoInvited: false, setDuoWaitTimer: () => {}, setDuoInvited: () => {}, onSessionEnded: value => { completed = value; } }));
    assert.equal(completed, outcome === 'completed');
  }
});

it('choisit une connaissance disponible pour discuter, sans inviter le joueur ou un personnage masqué', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const unavailable of [null, 'player', 'hidden']) {
      const lifeState = life.createLife('native');
      lifeState.elapsedSeconds = 600;
      life.rememberLifeConversation(lifeState, 'rosanna', 120);
      lifeState.relationships.rosanna.lastAt = 0;
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
        './laraLife': life, './laraLifeStore': { characterLives: { native: lifeState, cha: life.createLife('cha') } },
      });
      const result = duoSessionManager.startDuoSession('garden-conversation', 'chat', 'native');
      assert.equal(result.targetB, unavailable ? 'marissa' : 'rosanna');
      assert.deepEqual(lifeState.relationships.rosanna, { seconds: 120, lastAt: 0 }, 'An invitation must not increase an affinity');
    }
  } finally { global.document = originalDocument; }
});

it('soulage la solitude seulement pendant la discussion jouée, jamais pendant l’attente ou le chargement', () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 90 };
  w.candidates.push({ activity: 'social', id: 'garden-conversation', slotId: 'chat', x: 60, z: 10 });
  w.objects['garden-conversation'] = { id: 'garden-conversation', name: 'Discussion', isDuo: true,
    position: [60, 0, 10], slots: [{ slotId: 'chat', animation: 'conversation-gestures' }] };
  let playing = false;
  Object.assign(w.duo, {
    startDuoSession: () => ({ targetA: 'native', targetB: 'rosanna', posA: [60, 0, 10], posB: [60, 0, 110], rotA: 0, rotB: Math.PI, actualSlotId: 'chat' }),
    getSessionFor: () => ({ participantA: { characterId: 'native' }, participantB: { characterId: 'rosanna' } }),
    isPlaying: () => playing,
    getCurrentAnimState: () => playing ? { clipA: 'conversation-gestures', clipB: 'talking-1' } : null,
  });
  for (let i = 0; i < 5; i++) w.tick();
  assert(w.lifeState.needs.company >= 90);
  assert.deepEqual(w.lifeState.relationships, {});
  playing = true;
  w.tick(1, false); w.tick(1, false);
  const lonely = w.lifeState.needs.company;
  assert(lonely >= 90, 'Loading the talking clip must not satisfy company');
  assert.equal(w.duoTicks.at(-1), 0, 'The conversation timer must wait for actual playback');
  w.tick();
  assert(w.lifeState.needs.company < lonely);
  assert(w.lifeState.relationships.rosanna.seconds > 0);
  const needs = { ...w.lifeState.needs }, relationships = structuredClone(w.lifeState.relationships);
  const originalDocument = global.document;
  global.document = new EventTarget();
  try { w.controller.setPosition(10, 0, 10); w.tick(0); }
  finally { global.document = originalDocument; }
  assert.deepEqual(w.lifeState.needs, needs);
  assert.deepEqual(w.lifeState.relationships, relationships);
});

it('laisse au partenaire son temps de déplacement normal même quand la vie de Lara est accélérée', () => {
  let waited = 0, ended = false;
  const { handleDuoInteraction } = load('src/features/scene/ai/agent/agentDuoHandler.ts', {
    '../duoSessionManager': { duoSessionManager: { isCompletedFor: () => false, isPlaying: () => false,
      markReady: () => {}, isWaitingPartner: () => true,
      getCurrentLocation: () => ({ slotId: 'chat', objectId: 'garden-conversation', anchorPos: [0, 0, 0], anchorRotY: 0 }),
    } }, '@features/ui/AppConsole': { appLog: () => {} },
  });
  const update = () => handleDuoInteraction({ characterId: 'native', dt: 10, waitDt: 1, state: {}, duoRole: 'roleA',
    duoWaitTimer: waited, duoInvited: true, setDuoWaitTimer: value => { waited = value; },
    setDuoInvited: () => {}, onSessionEnded: () => { ended = true; } });
  update(); update(); update();
  assert.equal(waited, 3);
  assert(!ended, 'Three normal seconds must not expire an invitation as thirty accelerated seconds');
});

it('fait vivre Cha indépendamment de Lara et conserve ses besoins après une interruption', () => {
  const w = world('cha'), nativeBefore = structuredClone(w.characterLives.native);
  w.tick(); w.tick(); w.tick();
  assert.notDeepEqual(w.lifeState.needs, nativeBefore.needs);
  assert.deepEqual(w.characterLives.native, nativeBefore);
  assert.equal(w.lifeState.characterId, 'cha');
  const needs = { ...w.lifeState.needs };
  w.controller.setPosition(50, 0, 50); w.tick(0);
  assert.deepEqual(w.lifeState.needs, needs);
  assert.equal(w.snapshot.activity, 'Commande utilisateur');
});
