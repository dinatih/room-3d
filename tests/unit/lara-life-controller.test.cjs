const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');

// Exercise the actual controller with a synchronous navigation world. Geometry,
// GLB playback and posture transitions are covered by the browser scenario.
function world(id = 'native', withMeal = false, withSleep = false, withHygiene = false, diagnostics = false) {
  const journal = [];
  const home = require('../../src/features/scene/ai/lifeHousekeeping.ts');
  const dirt = home.createHomeDirt();
  const characterLives = Object.fromEntries(life.LIFE_CHARACTER_IDS.map(id => [id, life.createLife(id)]));
  const lifeState = characterLives[life.isLifeCharacter(id) ? id : 'native'], logs = [], reservations = new Map();
  const candidates = ['work', 'rest', 'walk'].map((activity, index) => ({ activity,
    id: activity === 'work' ? 'desk-bollsidan-2' : activity, slotId: 'use', x: 10 + index * 10, z: 10 }));
  const objects = Object.fromEntries(candidates.map(candidate => [candidate.id, { id: candidate.id, name: candidate.id,
    position: [candidate.x, 0, candidate.z], slots: [{ slotId: 'use', animation: candidate.activity, duration: 1 }] }]));
  objects['bathtub-garden'] = { id: 'bathtub-garden', name: 'Baignoire', position: [120, 0, -300], slots: [{ slotId: 'center', animation: 'bath', duration: 1 }] };
  const MEAL_PREPARATION = { id: 'cuisine-group', slotId: 'cook-stove' };
  objects[MEAL_PREPARATION.id] = { id: MEAL_PREPARATION.id, name: 'Kitchen', position: [40, 0, 10], slots: [{ slotId: MEAL_PREPARATION.slotId, animation: 'cook' }] };
  if (withMeal) candidates.push({ ...candidates[1], activity: 'meal' });
  if (withSleep) {
    candidates.push({ activity: 'sleep', id: 'sleep', slotId: 'use', x: 50, z: 10 });
    objects.sleep = { id: 'sleep', name: 'Bed', position: [50, 45, 10], slots: [{ slotId: 'use', animation: 'laying-sleeping' }] };
  }
  const sequence = (objectId, slotId) => [{ type: 'USE_OBJECT', smartObjectId: objectId, slotId, ...objects[objectId].slots[0], duration: objects[objectId].slots[0].duration ?? 1 }];
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
  const scene = { activeCharacterId: id, triggerAction: noop };
  const duo = { leaveDuoZone: noop, getSessionFor: noop, startDuoSession: () => null,
    markReady: noop, isPlaying: () => false, isWaitingPartner: () => true, getCurrentAnimState: () => null };
  const duoTicks = [];
  const duoDefinitions = {};
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
      ] : sequence(candidate.id, candidate.slotId).map(step => ({ ...step, lifePhase: ['social', 'affection', 'shower'].includes(candidate.activity) ? candidate.activity : undefined })) },
    './laraLife': life, './lifeHousekeeping': { ...home, homeDirt: dirt }, './laraLifeStore': { characterLives, publishLife: (characterId, state) => Object.assign(snapshot, state), useLaraLifeStore: { getState: () => ({ speed: 1, characters: { [id]: snapshot } }) } },
    './occupancyManager': { OccupancyManager: occupancy, LIMITED_ROOMS: ['living', 'bathroom'], isInRoom: (room, position) => room === 'bathroom' ? position.z >= 500 : position.z < 500 },
    './duoSessionManager': { duoSessionManager: duo },
    '../animations/duoAnimations': { getDuoAnimationForClip: key => Object.values(duoDefinitions).find(def => [def.id, def.animA, def.animB].includes(key)) },
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
    '../store/useSceneStore': { useSceneStore: { getState: () => scene } },
    '@features/ui/AppConsole': { appLog: (actor, message, meta) => logs.push({ actor, message, ...meta }) },
    '../animOptions': { getEstimatedClipDuration: () => 1 },
    '../animations/animationResolver': { resolveAnimationId: value => value, getAnimationDef: () => ({ duration: 1 }), resolveSlotAnimation: slot => slot },
    '../cameraState': { cameraState }, './agent/agentWalkAnimations': { getRandomNpcWalkAnimation: () => 'walk', getWalkSpeedForAnimation: () => 100 },
    './agent/agentInstructionCoords': { resolveInstructionCoords: instruction => {
      if (navigationPending) throw new NavigationPending({ description: 'Construction du réseau de navigation' });
      if (instruction.targetZoneId === 'living') return { tx: 90, ty: 0, tz: 10, label: 'living' };
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
      if (animation) ctx.state.animation = ctx.duoRole === 'roleB' ? animation.clipB : animation.clipA;
      return false;
    } }, './navigation/doorRequests': { releaseAgentDoors: noop },
    '@features/scene/utils/deskScreenVideo': { setDesk2SmartActionState: noop },
    './navigation/navigationScope': { NavigationScope: class { clear() {} run(callback) { return callback(); } }, NavigationPending },
    '@/devLog': { devLog: entry => journal.push(entry), DEV_LOG_ENABLED: diagnostics }, '../idleState': { isAppIdle: () => false },
  });
  const scenario = id === 'vivida' ? [{ ...sequence('bathtub-garden', 'center')[0], lifePhase: 'bath' }]
    : sequence(id === 'cha' ? 'walk' : 'desk-bollsidan-2', 'use');
  const controller = createAgentController(id, scenario, true, () => ({ x: 10, y: 0, z: 10, rotY: 0 }));
  controller.configure({ scenario, loop: true, landingAnim: 'idle' });
  const tick = (seconds = 1, playback = true) => {
    if (playback) controller.reportAnimationPlayback(controller.state.animation, 0.5, false);
    return controller.update(seconds);
  };
  return { controller, dirt, scene, lifeState, logs, journal, tick, snapshot, attempts, reservations, candidates, objects, duo, duoTicks, duoDefinitions, characterLives, occupancy,
    pauseCrowd: value => { crowdWait = value; },
    pauseNavigation: value => { navigationPending = value; },
    fail: objectId => { failedId = objectId; }, changeGeometry: () => { revision++; }, blockActor: objectId => { actorBlockedId = objectId; } };
}

it('journalise la vie au démarrage réel et à la fin de phase, sans spam pendant le chargement', () => {
  const w = world();
  w.tick(1, false); w.tick(1, false);
  assert(!w.logs.some(log => log.action === 'life_started' || log.action === 'life_result'));
  w.tick(.25);
  assert.equal(w.logs.filter(log => log.action === 'life_started').length, 1);
  assert(!w.logs.some(log => log.action === 'life_result'));
  w.tick(.25); w.tick(.25); w.tick(.25);
  const started = w.logs.filter(log => log.action === 'life_started');
  const results = w.logs.filter(log => log.action === 'life_result');
  assert.equal(started.length, 1);
  assert.equal(results.length, 1);
  assert.equal(started[0].category, 'life');
  assert.deepEqual(started[0].animation, { id: 'work', mode: 'solo', actorId: 'native', label: undefined });
  assert.equal(started[0].object.animationId, 'work');
  assert.equal(started[0].object.actorId, 'native');
  assert.equal(results[0].animation.id, 'work');
  assert.deepEqual(started[0].actors, ['native']);
  assert.equal(results[0].data.seconds, 1);
  assert(results[0].data.changes.work < 0);
  assert.equal(results[0].data.after.work - results[0].data.before.work, results[0].data.changes.work);
  const count = w.logs.length;
  w.tick(0);
  assert.equal(w.logs.length, count);
});

it('explique les décisions et journalise une interruption avant tout bénéfice', () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.needs = { ...w.lifeState.needs, work: 95, rest: 0 };
  w.tick(); w.tick();
  const decision = w.logs.filter(log => log.action === 'life_decision').at(-1);
  assert.equal(decision.category, 'life');
  assert(decision.message.includes('Besoin urgent.'));
  assert.equal(decision.data.activity, 'work');
  assert(decision.data.candidates.some(candidate => candidate.activity === 'work' && candidate.need >= 95 && candidate.preference > 0));
  assert.equal(typeof decision.data.clock.time, 'string');
  const before = { ...w.lifeState.needs };
  w.controller.setPosition(50, 0, 50);
  assert(w.logs.some(log => log.action === 'life_interrupted' && log.message.includes('déplacements')));
  assert.deepEqual(w.lifeState.needs, before);
});

it('termine le diagnostic d’attente lorsque l’interaction commence sans déplacement', () => {
  const w = world('sara', false, false, false, true);
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
  for (const id of ['native', 'sara']) for (const animation of ['miley-armature-cheer-feminine-jump', 'miley-armature-fall-down-f']) {
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
  const w = world('sara');
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
  const w = world('sara');
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
  const w = world('sara');
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
  w.lifeState.needs = { rest: 100, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
  w.fail('rest');
  for (let i = 0; i < 12; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 20).length, 1);
  assert(w.logs.some(entry => entry.action === 'nav_blocked'));
  w.changeGeometry();
  for (let i = 0; i < 4; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 20).length, 2);
});

it('laisse les autres personnages suivre leur scénario sans simulation de besoins', () => {
  const w = world('sara'), initial = { ...w.lifeState.needs };
  for (let i = 0; i < 10; i++) w.tick();
  assert.deepEqual(w.lifeState.needs, initial);
  assert(!w.logs.some(entry => entry.action === 'life_decision'));
});

it('réexamine une approche lorsque le personnage qui la bloquait s’écarte', () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 100, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
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
    w.lifeState.needs = { rest: 100, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
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
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0, company: 0, environment: 0 };
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
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0, company: 0, environment: 0 };
  w.fail('cuisine-group');
  for (let i = 0; i < 12; i++) w.tick();
  assert.equal(w.attempts.filter(x => x === 40).length, 1);
  assert(w.lifeState.needs.meal >= 90);
  assert.equal(w.reservations.size, 0);
});

it('récupère seulement au lit pendant le sommeil, puis se réveille et libère son lit au sol', () => {
  const w = world('native', false, true);
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 90, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
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
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 90, company: 0, environment: 0 };
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
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 90, environment: 0 };
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
  assert(w.lifeState.memory.work.places['desk-bollsidan-2:use'].satisfaction > 0);
  assert(w.lifeState.memory.work.periods.Matin > 0);
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
    for (const explicitPartner of [false, true]) for (const objectId of ['garden-conversation', 'hugs-point']) for (const animationId of ['conversation', 'kiss', 'interx-g022t008a029r019']) for (const unavailable of [null, 'player', 'hidden', 'busy', 'all-busy']) {
      const lifeState = life.createLife('native');
      lifeState.elapsedSeconds = 600;
      life.rememberLifeConversation(lifeState, 'rosanna', 120);
      lifeState.relationships.rosanna.lastAt = 0;
      const activity = life.lifeSocialActivity(objectId);
      lifeState.relationships.rosanna.activities = { [activity]: 120 };
      lifeState.relationships.marissa = { seconds: 120, lastAt: 0, activities: { [activity === 'social' ? 'affection' : 'social']: 120 } };
      const positions = { native: { x: 0, z: 0 }, marissa: { x: 20, z: 0 }, rosanna: { x: 200, z: 0 } };
      const def = { id: animationId, label: 'Discussion', isCombat: false, animA: 'talk', animB: 'listen', duration: 60 };
      const claims = [];
      const { duoSessionManager } = load('src/features/scene/ai/duoSessionManager.ts', {
        '../animations/duoAnimations': { DUO_ANIMATIONS: [def], canCharacterPerformDuo: () => true },
        '../animations/duoWorldTransform': { computeWorldTransform: anchor => ({ posA: anchor, posB: [0, 0, 100], rotA: 0, rotB: Math.PI }) },
        './occupancyManager': { LIMITED_ROOMS: [], OccupancyManager: { canUseObject: () => true, claimSlot: (...args) => (claims.push(args), true) } },
        '@features/ui/AppConsole': { appLog: () => {} }, '../cameraState': { cameraState: { positions } },
        '../characterConfig': { AUTONOMOUS_NPC_IDS: new Set(Object.keys(positions)), isCharacterVisibleInMode: id => !(unavailable === 'hidden' && id === 'rosanna') },
        './smartObjectRegistry': { getSmartObject: () => ({ id: objectId, name: 'Moment partagé', slots: [{ slotId: 'chat', isDuo: true, duoAnimId: animationId, duoCount: 1, offset: [0, 0, 0] }] }) },
        './autonomousActivities': { INITIAL_SMART_OBJECT_BY_CHAR: { marissa: objectId } },
        '../store/useSceneStore': { useSceneStore: { getState: () => ({ activeCharacterId: unavailable === 'player' ? 'rosanna' : 'native', layers: {} }) } },
        './navigation/duoPlacement': { findDuoAnchor: anchor => anchor },
        './navigation/navigationScope': { navigationValue: (key, fn) => fn() },
        './navigation/service': { getNavigationGraph: () => ({}) }, './navigation/obstacles': { getAgentProfile: () => ({}) },
        './laraLife': life, './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'), './laraLifeStore': { characterLives: { native: lifeState, cha: life.createLife('cha') } },
      });
      const onCheck = event => {
        assert.equal(event.detail.allowDeferral, !explicitPartner);
        if (unavailable === 'all-busy' || (unavailable === 'busy' && event.detail.targetId === 'rosanna')) event.preventDefault();
      };
      document.addEventListener('npc-check-life-invitation', onCheck);
      let result;
      try { result = duoSessionManager.startDuoSession(objectId, 'chat', 'native', explicitPartner ? 'rosanna' : undefined, undefined, true); }
      finally { document.removeEventListener('npc-check-life-invitation', onCheck); }
      if (unavailable === 'all-busy' || (explicitPartner && unavailable && unavailable !== 'player')) {
        assert.equal(result, null);
        assert.equal(claims.length, 0, 'A declined invitation must not reserve either participant');
        assert.equal(duoSessionManager.getSessionFor('native'), null);
      } else assert.equal(result.targetB, unavailable && !(explicitPartner && unavailable === 'player') ? 'marissa' : 'rosanna');
      assert.deepEqual(lifeState.relationships.rosanna, { seconds: 120, lastAt: 0, activities: { [activity]: 120 } }, 'An invitation must not increase an affinity');
    }
  } finally { global.document = originalDocument; }
});

it('reporte une invitation pendant un repas sans perdre sa place et redevient disponible ensuite', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world('native', true);
  const disconnect = w.controller.connect();
  const invite = () => document.dispatchEvent(new CustomEvent('npc-check-life-invitation', {
    cancelable: true, detail: { targetId: 'native', fromId: 'cha', objectId: 'hugs-point' },
  }));
  try {
    w.tick(); w.tick();
    w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0, company: 0, environment: 0 };
    w.tick(); w.tick();
    assert.equal(w.controller.state.animation, 'cook');
    const before = structuredClone(w.lifeState), reservations = [...w.reservations];
    assert.equal(invite(), false);
    assert.deepEqual(w.lifeState, before);
    assert.deepEqual([...w.reservations], reservations);
    assert(w.logs.some(log => log.action === 'life_invitation_later'));
    w.tick(); w.tick(); w.tick();
    w.lifeState.needs = { ...w.lifeState.needs, meal: 0, work: 100 };
    w.tick(); w.tick();
    assert.equal(invite(), true);
    w.controller.setPosition(50, 0, 50);
    assert.equal(invite(), false);
    assert(w.logs.some(log => log.action === 'life_invitation_declined'));
  } finally {
    disconnect();
    assert.equal(invite(), true, 'Disconnect must remove the invitation listener');
    global.document = originalDocument;
  }
});

for (const objectId of ['garden-conversation', 'hugs-point', 'inyeong-cha-hugs-point']) it(`soulage la solitude sur ${objectId} seulement pendant le duo joué`, () => {
  const w = world();
  w.tick(); w.tick();
  w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 90, environment: 0 };
  w.candidates.push({ activity: life.lifeSocialActivity(objectId), id: objectId, slotId: 'chat', x: 60, z: 10 });
  w.objects[objectId] = { id: objectId, name: 'Moment partagé', isDuo: true,
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

it('fait vivre Cha et Vivida indépendamment de Lara et conserve leurs besoins après interruption', () => {
  for (const id of ['cha', 'vivida']) {
    const w = world(id), nativeBefore = structuredClone(w.characterLives.native);
    w.tick(); w.tick(); w.tick();
    assert.notDeepEqual(w.lifeState.needs, nativeBefore.needs);
    assert.deepEqual(w.characterLives.native, nativeBefore);
    assert.equal(w.lifeState.characterId, id);
    if (id === 'vivida') assert(w.lifeState.memory.bath.satisfaction > 0);
    const needs = { ...w.lifeState.needs };
    w.controller.setPosition(50, 0, 50); w.tick(0);
    assert.deepEqual(w.lifeState.needs, needs);
    assert.equal(w.snapshot.activity, 'Commande utilisateur');
  }
});

it('termine les répétitions du slot avec une récupération partielle, puis réévalue les besoins', () => {
  for (const id of life.LIFE_CHARACTER_IDS) {
    const w = world(id);
    w.tick(); w.tick(); w.tick();
    w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 90, toilet: 0, company: 0, environment: 0 };
    const slot = { slotId: 'use', animation: 'wash-a', duration: 2, repeatCount: 3, repeatVariation: true };
    w.objects.shower = { id: 'shower', name: 'Douche', position: [60, 0, 10], slots: [slot] };
    w.candidates.push({ activity: 'shower', id: 'shower', slotId: 'use', x: 60, z: 10 });
    for (let i = 0; i < 10 && w.controller.state.animation !== 'wash-a'; i++) w.tick();
    assert.equal(w.controller.state.animation, 'wash-a');
    const before = w.lifeState.needs.hygiene;
    slot.animation = 'wash-b';
    w.tick(2);
    assert.equal(w.controller.state.animation, 'wash-b');
    const afterFirst = w.lifeState.needs.hygiene;
    assert(afterFirst < before);
    w.tick(2, false);
    assert(w.lifeState.needs.hygiene > afterFirst, 'Loading a variation must not consume its timer or satisfy hygiene');
    slot.animation = 'wash-c';
    w.tick(2);
    assert.equal(w.controller.state.animation, 'wash-c');
    w.tick(2);
    assert.equal(w.lifeState.lastActivity, 'shower');
    assert.deepEqual(w.logs.filter(log => log.action === 'life_started' && log.object?.id === 'shower').map(log => log.animation.id),
      ['wash-a', 'wash-b', 'wash-c'], 'Log each clip actually played, including variations of the same smart action');
    assert(w.lifeState.needs.hygiene > 0 && w.lifeState.needs.hygiene < before);
    assert.equal(w.reservations.size, 0);
    w.lifeState.needs.work = 100;
    w.tick();
    assert.equal(w.logs.filter(log => log.action === 'life_decision').at(-1).object?.id, 'desk-bollsidan-2',
      'A more pressing need must take priority after the slot sequence, even with hygiene still unmet');
  }
});

it('récupère repos et compagnie pour les deux rôles d’un duo assis, seulement après le chargement', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const id of life.LIFE_CHARACTER_IDS) for (const role of ['roleA', 'roleB']) {
      const w = world(id);
      w.tick(); w.tick(); w.tick();
      w.scene.activeCharacterId = 'xbot';
      w.objects.seated = { id: 'seated', name: 'Bord du lit', category: 'bed', isDuo: true, position: [60, 0, 10],
        slots: [{ slotId: 'seat-middle', animation: 'sit-a' }] };
      const partner = id === 'native' ? 'cha' : 'native';
      const session = { participantA: { characterId: role === 'roleA' ? id : partner }, participantB: { characterId: role === 'roleB' ? id : partner } };
      let playing = false;
      const animation = { def: { isCombat: false }, clipA: 'sit-a', clipB: 'sit-b' };
      Object.assign(w.duo, { getSessionFor: () => session, isPlaying: () => playing, getCurrentAnimState: () => playing ? animation : null });
      const disconnect = w.controller.connect();
      try {
        w.lifeState.needs = { ...w.lifeState.needs, rest: 80, company: 90 };
        document.dispatchEvent(new CustomEvent('npc-invite-duo', { detail: {
          targetId: id, fromId: partner, objectId: 'seated', slotId: `seat-middle:${role}`, forceRole: role,
        } }));
        for (let i = 0; i < 3; i++) w.tick();
        assert(w.lifeState.needs.rest >= 80 && w.lifeState.needs.company >= 90, 'Waiting must not satisfy either motive');
        playing = true;
        w.tick(1, false); w.tick(1, false);
        const before = { ...w.lifeState.needs };
        w.tick();
        assert(w.lifeState.needs.rest < before.rest);
        assert(w.lifeState.needs.company < before.company);
        assert.equal(w.lifeState.relationships[partner].seconds, 1);
        assert.equal(w.lifeState.relationships[partner].activities.rest, 1);
        animation.def.isCombat = true;
        const beforeCombat = { ...w.lifeState.needs };
        w.tick();
        assert(w.lifeState.needs.rest > beforeCombat.rest && w.lifeState.needs.company > beforeCombat.company, 'Combat clips must not be treated as seated relaxation');
      } finally { disconnect(); }
    }
  } finally { global.document = originalDocument; }
});

it('actualise la pièce affichée pendant le contrôle manuel sans faire avancer les besoins', () => {
  const w = world();
  w.tick();
  const before = { ...w.lifeState.needs };
  w.controller.setPosition(50, 0, 600);
  assert.equal(w.snapshot.room, 'bathroom');
  assert.deepEqual(w.lifeState.needs, before);
  w.controller.setPosition(50, 0, 50);
  assert.equal(w.snapshot.room, 'living');
});

it('ignore les balayages autonomes inutiles et compte aussi le ménage des autres PNJ', () => {
  const home = require('../../src/features/scene/ai/lifeHousekeeping.ts');
  for (const actor of ['native', 'sara']) {
    const w = world(actor);
    const id = 'clean-floor-living';
    w.objects[id] = { id, name: 'Balayer', position: [10, 0, 10], slots: [{ slotId: 'sweep', animation: 'sweep', duration: 30, repeatCount: 3 }] };
    const scenario = [{ type: 'USE_OBJECT', smartObjectId: id, slotId: 'sweep', animation: 'sweep', duration: 30, repeatCount: 3 }];
    // A guided/manual sequence can explicitly request cleaning even below the autonomous threshold.
    w.controller.configure({ scenario, loop: false });
    w.dirt.living = 10;
    w.tick(1, false);
    assert.equal(w.controller.state.animation, 'sweep');
    w.tick(1, false);
    assert.equal(w.dirt.living, 10, 'Loading an animation cannot clean the floor');
    w.tick();
    assert.equal(w.dirt.living, 10 - home.HOME_RATES.cleaning);
    w.tick();
    assert.equal(w.dirt.living, 0);
    w.tick();
    assert.notEqual(w.controller.getStatus(), 'INTERACTING', 'A clean floor must end the task without consuming three thirty-second clips');
  }
  const w = world('sara');
  w.objects['clean-floor-living'] = { id: 'clean-floor-living', name: 'Balayer', position: [10, 0, 10], slots: [{ slotId: 'sweep', animation: 'sweep', duration: 30 }] };
  const sweep = { type: 'USE_OBJECT', smartObjectId: 'clean-floor-living', slotId: 'sweep', animation: 'sweep', duration: 30 };
  const scenario = [sweep, { type: 'WAIT', animation: 'idle', duration: 1 }];
  w.controller.configure({ scenario, loop: true });
  w.tick();
  assert(!w.attempts.length, 'A clean room must be skipped before navigating or reserving it');
  assert.notEqual(w.controller.state.animation, 'sweep');
  w.dirt.living = life.LIFE_SETTINGS.priority;
  for (let i = 0; i < 5 && w.controller.state.animation !== 'sweep'; i++) w.tick();
  assert.equal(w.controller.state.animation, 'sweep', 'A later cycle must still sweep when the room becomes dirty');
});

it('salue une connaissance pendant une pause, sans interrompre une réaction ni satisfaire un besoin', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world(), disconnect = w.controller.connect();
  try {
    w.tick(); w.tick();
    w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
    w.tick(); w.tick();
    life.rememberLifeConversation(w.lifeState, 'cha', 10, 'social');
    const arrive = room => document.dispatchEvent(new CustomEvent('npc-life-event', { detail: { kind: 'arrival', room, fromId: 'cha' } }));
    arrive('bathroom');
    assert(!w.logs.some(log => log.action === 'life_reaction'));
    arrive('living'); arrive('living');
    assert.equal(w.logs.filter(log => log.action === 'life_reaction').length, 1);
    w.tick(1, false);
    assert.equal(w.controller.state.animation, 'waving');
    const before = { ...w.lifeState.needs };
    w.controller.reportAnimationPlayback('waving', 1, true);
    w.controller.update(1);
    assert(w.lifeState.needs.company >= before.company && w.lifeState.needs.rest >= before.rest);
    assert.equal(w.lifeState.relationships.cha.seconds, 10, 'A wave is not a conversation');
    assert.equal(w.lifeState.lastActivity, 'work', 'A reaction must preserve the last meaningful activity');
    assert.equal(w.lifeState.memory.pause, undefined);
    w.tick();
    w.lifeState.needs.meal = 100;
    arrive('living');
    assert.equal(w.logs.filter(log => log.action === 'life_reaction').length, 1, 'An urgent need must take priority over a greeting');
    w.controller.setPosition(10, 0, 10);
    arrive('living');
    assert.equal(w.logs.filter(log => log.action === 'life_reaction').length, 1, 'Manual control must remain in charge');
  } finally { disconnect(); global.document = originalDocument; }
});

it('remercie le ménage réellement terminé par un autre PNJ, jamais son chargement', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world(), cleaner = world('sara');
  const disconnect = w.controller.connect(), disconnectCleaner = cleaner.controller.connect();
  try {
    w.tick(); w.tick();
    w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
    w.tick(); w.tick();
    cleaner.objects['clean-floor-living'] = { id: 'clean-floor-living', name: 'Sol', position: [10, 0, 10], slots: [{ slotId: 'sweep', animation: 'sweep', duration: 30 }] };
    cleaner.dirt.living = 5;
    cleaner.controller.configure({ scenario: [{ type: 'USE_OBJECT', smartObjectId: 'clean-floor-living', slotId: 'sweep', animation: 'sweep', duration: 30 }], loop: false });
    cleaner.tick(1, false); cleaner.tick(1, false);
    assert(!w.logs.some(log => log.action === 'life_reaction'));
    cleaner.tick();
    assert.equal(cleaner.dirt.living, 0);
    const reactions = w.logs.filter(log => log.action === 'life_reaction');
    assert.equal(reactions.length, 1);
    assert.equal(reactions[0].animation.id, 'thankful');
    cleaner.tick();
    assert.equal(w.logs.filter(log => log.action === 'life_reaction').length, 1);
  } finally { disconnect(); disconnectCleaner(); global.document = originalDocument; }
});

it('réagit une fois à une place occupée, puis choisit ailleurs sans faux bénéfice', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world(), disconnect = w.controller.connect();
  try {
    w.occupancy.isSlotOccupied = id => id === 'desk-bollsidan-2';
    w.tick(1, false); w.tick(1, false);
    assert.equal(w.controller.state.animation, 'thoughtful-head-shake');
    assert(w.lifeState.needs.work >= 65);
    assert.equal(w.lifeState.memory.work, undefined);
    w.controller.reportAnimationPlayback('thoughtful-head-shake', 1, true);
    w.controller.update(1);
    for (let tick = 0; tick < 5; tick++) w.tick();
    assert.equal(w.logs.filter(log => log.action === 'life_reaction').length, 1);
    assert.equal(w.logs.filter(log => log.action === 'life_abandoned').length, 1);
    assert.equal(w.reservations.size, 0);
  } finally { disconnect(); global.document = originalDocument; }
});

for (const outcome of ['available', 'busy', 'removed', 'manual', 'urgent', 'mode', 'seated', 'replaced', 'noreturn']) it(`reprend ou annule une invitation reportée après un repas : ${outcome}`, () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world('native', true), disconnect = w.controller.connect(), calls = [];
  const seated = outcome === 'seated', objectId = seated ? 'bed-west' : 'hugs-point', slotId = seated ? 'seat-middle' : 'hug';
  const activity = seated ? 'rest' : 'affection';
  w.objects[objectId] = { id: objectId, name: 'Moment partagé', category: seated ? 'bed' : 'decor', isDuo: !seated,
    position: [60, 0, 10], slots: [{ slotId, animation: 'sit', isDuo: !seated }] };
  w.candidates.push({ activity, id: objectId, slotId, x: 60, z: 10 });
  if (seated) w.duoDefinitions['seat-duo'] = { id: 'seat-duo', animA: 'sit-a', animB: 'sit-b' };
  Object.assign(w.duo, { startDuoSession: (...args) => {
    calls.push(args);
    return { targetA: 'native', targetB: args[3], posA: [60, 0, 10], posB: [60, 0, 100], rotA: 0, rotB: 0, actualSlotId: slotId };
  } });
  try {
    w.tick(); w.tick();
    w.lifeState.needs = { rest: 0, work: 0, walk: 0, meal: 90, hygiene: 0, toilet: 0, company: 0, environment: 0 };
    w.tick(); w.tick();
    assert.equal(w.controller.state.animation, 'cook');
    const reservations = [...w.reservations];
    assert.equal(document.dispatchEvent(new CustomEvent('npc-check-life-invitation', { cancelable: true,
      detail: { targetId: 'native', fromId: 'cha', objectId, slotId, forcedAnimId: seated ? 'seat-duo' : undefined, allowDeferral: outcome !== 'noreturn' } })), false);
    assert(w.logs.some(log => log.action === 'life_invitation_later' && log.data.deferred === (outcome !== 'noreturn')));
    assert.deepEqual([...w.reservations], reservations, 'Deferring must not reserve a new place');
    assert.equal(calls.length, 0);
    assert.equal(w.controller.state.animation, 'cook', 'Finish the meal before returning to the invitation');
    if (outcome === 'replaced') document.dispatchEvent(new CustomEvent('npc-check-life-invitation', { cancelable: true,
      detail: { targetId: 'native', fromId: 'vivida', objectId, slotId } }));
    if (outcome === 'manual') {
      w.controller.setPosition(10, 0, 10);
    } else if (outcome === 'mode') {
      w.controller.configure({ scenario: [], loop: false, landingAnim: 'idle' });
    } else {
      w.tick(); w.tick(); w.tick();
      w.lifeState.needs.meal = 0;
      w.lifeState.needs.work = outcome === 'urgent' ? 100 : 0;
      if (outcome === 'busy') w.duo.getSessionFor = id => id === 'cha' ? {} : undefined;
      if (outcome === 'removed') w.candidates.splice(w.candidates.findIndex(candidate => candidate.id === objectId), 1);
      w.tick(); w.tick();
      if (outcome === 'urgent') {
        assert.equal(calls.length, 0, 'An unrelated urgent need must still come first');
        w.tick();
        w.lifeState.needs.work = 0;
        w.tick(); w.tick();
      }
    }
    if (['available', 'urgent', 'seated', 'replaced'].includes(outcome)) {
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0], [objectId, slotId, 'native', outcome === 'replaced' ? 'vivida' : 'cha', seated ? 'seat-duo' : undefined, true]);
      assert(w.logs.some(log => log.action === 'life_invitation_resumed'));
      assert.deepEqual(w.lifeState.relationships, {}, 'Resuming an invitation is not played time together');
    } else if (outcome === 'noreturn') {
      assert.equal(calls.length, 0, 'A return availability check must not create a reverse invitation');
    } else {
      assert.equal(calls.length, 0);
      assert(w.logs.some(log => log.action === 'life_invitation_cancelled'));
    }
  } finally { disconnect(); global.document = originalDocument; }
});

it('une reprise confirmée ne prend jamais la main sur un contrôle utilisateur', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  const w = world(), disconnect = w.controller.connect();
  w.objects['hugs-point'] = { id: 'hugs-point', name: 'Câlins', position: [60, 0, 10], slots: [{ slotId: 'hug', isDuo: true }] };
  const invite = confirmed => document.dispatchEvent(new CustomEvent('npc-invite-duo', { detail: {
    targetId: 'native', fromId: 'SmartObject', objectId: 'hugs-point', slotId: 'hug:roleB', forceRole: 'roleB', lifeInvitationConfirmed: confirmed,
  } }));
  try {
    w.tick(); w.tick();
    invite(false);
    assert(!w.logs.some(log => log.action === 'life_invitation_accepted'));
    invite(true);
    assert.equal(w.logs.filter(log => log.action === 'life_invitation_accepted').length, 1);
    w.controller.setPosition(10, 0, 10);
    invite(true);
    assert.equal(w.logs.filter(log => log.action === 'life_invitation_accepted').length, 1);
  } finally { disconnect(); global.document = originalDocument; }
});

it('refuse les invitations entre colocataires en conflit, avec une raison dans le journal', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const [targetId, fromId] of [['cha', 'delphina'], ['delphina', 'cha'], ['cha', 'marissa'], ['marissa', 'cha'], ['sabira', 'marissa'], ['marissa', 'sabira']]) {
      const w = world(targetId), disconnect = w.controller.connect();
      try {
        w.tick();
        const event = new CustomEvent('npc-check-life-invitation', { cancelable: true, detail: { targetId, fromId, objectId: 'garden-conversation', slotId: 'chat' } });
        assert.equal(document.dispatchEvent(event), false);
        const log = w.logs.find(log => log.action === 'life_invitation_declined');
        assert(log.message.includes('Ne s’entend pas'));
        assert.equal(log.data.deferred, false);
      } finally { disconnect(); }
    }
  } finally { global.document = originalDocument; }
});

it('éteint la télé au départ du spectateur sans couper le bureau utilisé par un autre PNJ', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const departure of ['finished', 'manual', 'mode', 'disconnect']) {
      const w = world(), actions = [];
      w.scene.desk2ScreenActive = true;
      w.scene.triggerAction = (key, value) => { actions.push([key, value]); };
      w.objects['tv-view'] = { id: 'tv-view', name: 'Télé', position: [10, 0, 10], slots: [{ slotId: 'watch', animation: 'looking', duration: 1 }] };
      w.controller.configure({ scenario: [{ type: 'USE_OBJECT', smartObjectId: 'tv-view', slotId: 'watch', animation: 'looking', duration: 1, triggerEventKey: 'tv-toggle', triggerEventValue: true }], loop: false });
      const disconnect = w.controller.connect();
      w.tick(1, false);
      assert(actions.some(([key, value]) => key === 'tv-toggle' && value === true));
      if (departure === 'finished') w.tick();
      else if (departure === 'manual') w.controller.setPosition(20, 0, 10);
      else if (departure === 'mode') { w.controller.configure({ scenario: [], loop: false }); w.tick(); }
      else disconnect();
      assert(actions.some(([key, value]) => key === 'tv-toggle' && value === false), departure);
      assert.equal(w.scene.desk2ScreenActive, true);
      if (departure !== 'disconnect') disconnect();
    }
  } finally { global.document = originalDocument; }
});

it('garde le bureau réservé pendant la sortie, même si le trajet attend son calcul', () => {
  const w = world();
  const objectId = 'desk-bollsidan-2', slotId = 'use';
  w.controller.configure({ scenario: [
    { type: 'USE_OBJECT', smartObjectId: objectId, slotId, animation: 'work', duration: 1 },
    { type: 'MOVE_TO', smartObjectId: objectId, slotId, targetZoneId: 'living' },
  ], loop: false });
  w.tick(1, false); w.tick();
  assert.equal(w.reservations.get(`${objectId}:${slotId}`), 'native', 'Finishing the clip must not free the standing area');
  w.pauseNavigation(true); w.tick();
  assert.equal(w.controller.state.x, 10);
  assert.equal(w.reservations.get(`${objectId}:${slotId}`), 'native');
  w.pauseNavigation(false);
  for (let i = 0; i < 5 && w.reservations.size; i++) w.tick();
  assert.equal(w.controller.state.x, 90, 'The character must leave the desk before pausing');
  assert.equal(w.reservations.size, 0);
});
