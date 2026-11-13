const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

let windowStepElevation = false;

const groundElevation = load('src/features/scene/ai/navigation/groundElevation.ts', {
  '../../wallData': require('../../src/features/scene/wallData.ts'),
  '../../store/useSceneStore': {
    useSceneStore: { getState: () => ({ layers: { windowStepElevation } }) },
  },
});

const controls = load('src/features/scene/camera/subjectControls.ts', {
  './cameraSubjects': { isFlyingSubject: id => id === 'drone' || id === 'robin' },
  three: THREE,
  '../cameraState': { cameraState: { animalViews: { shiba: { forward: { x: 0, y: 0, z: 1 } } }, positions: {} } },
  '../hornetTour': { HornetSpace: class { blocker() { return false; } doorHits() { return false; } } },
  '../ai/navigation/service': { getNavigationGraph: () => ({ obstacles: [] }) },
  '../ai/navigation/groundElevation': groundElevation,
  '../ai/navigation/obstacles': { getAgentProfile: () => ({ radius: 10, height: 30 }) },
  '../ai/agent/agentAvoidance': { limitAgentMovement: (_, __, point) => point },
  '../ai/navigation/navigationScope': { NavigationScope: class { poll(fn) { fn(); return true; } clear() {} } },
  '../ai/navigation/geometry': { inflate: p => p, segmentFree: () => true },
  '../doorObstacles': { DOOR_CONFIGS: {}, doorCollisionState: {}, doorPolygon: () => [] },
});

const dogs = load('src/features/scene/items/dogBehavior.ts', {
  three: THREE,
  '../ai/SpatialZone': { SpatialZoneManager: { getZoneAt: () => null } },
  '../ai/navigation/service': {
    randomReachableTarget: () => null,
    getNavigationGraph: () => ({ canReach: () => true }),
    followRoute: (_route, _id, start, target) => ({ x: target.x, z: target.z }),
    resetRoute() {},
    createRouteState: () => ({}),
  },
  '../ai/navigation/groundElevation': groundElevation,
  '../ai/navigation/obstacles': { getAgentProfile: () => ({ radius: 10, height: 30 }) },
  '../ai/agent/agentAvoidance': {
    computeSteeringVector: () => ({ steerX: 0, steerZ: 0 }),
    computeRotYStep: (_yaw, target) => target,
    reserveAgentDestination() {},
    isAgentDestinationFree: () => true,
  },
  '@features/ui/AppConsole': { appLog() {} },
  './dogBowlData': { dogFeedingStation: { position: null } },
  '../ai/navigation/navigationScope': { NavigationScope: class { poll(fn) { fn(); } clear() {} }, navigationValue: (_k, fn) => fn() },
  '../camera/subjectControls': controls,
});

const { LAYER_DEFAULTS } = load('src/features/scene/store/layerUrlParams.ts', {
  './debugPresets': { getDebugPreset: () => null },
  '../camera/cameraUrlParams': { getUrlParams: () => new URLSearchParams() },
});

it('active le franchissement de la marche par défaut', () => {
  assert.equal(LAYER_DEFAULTS.windowStepElevation, true);
});

it('retourne 0 hors toggle et 25 cm sur la marche de la baie vitrée quand le toggle est actif', () => {
  windowStepElevation = false;
  assert.equal(groundElevation.getWalkableGroundY(177.5, -15), 0);
  assert.equal(groundElevation.getWalkableGroundY(177.5, 50), 0);

  windowStepElevation = true;
  assert.equal(groundElevation.getWalkableGroundY(177.5, -15), 25);
  assert.equal(groundElevation.getWalkableGroundY(95, -30), 25);
  assert.equal(groundElevation.getWalkableGroundY(260, 0), 25);
  assert.equal(groundElevation.getWalkableGroundY(94.9, -15), 0);
  assert.equal(groundElevation.getWalkableGroundY(177.5, 0.1), 0);
  assert.equal(groundElevation.getWalkableGroundY(177.5, -30.1), 0);
});

it('fait monter et descendre un chien (dogBehavior) selon le toggle lors du passage de la marche', () => {
  const parent = new THREE.Group();
  const root = new THREE.Group();
  parent.add(root);
  const state = dogs.createDogBehavior();
  state.position.set(177.5, 0, -50);
  const context = { id: 'shiba', root, play: () => 1 };

  windowStepElevation = true;
  dogs.startDogTrip(state, context, { x: 177.5, z: -15 }, 'walk');
  dogs.updateDogBehavior(state, context, 0.016);
  assert.equal(state.position.y, 25);
  assert.equal(root.position.y, 25);

  windowStepElevation = false;
  dogs.updateDogBehavior(state, context, 0.016);
  assert.equal(state.position.y, 0);
  assert.equal(root.position.y, 0);
});

it('met à jour le Y d’un sujet terrestre piloté manuellement (SubjectDriver)', () => {
  const driver = new controls.SubjectDriver('shiba');
  const root = new THREE.Group();
  root.position.set(177.5, 0, -40);
  windowStepElevation = true;
  try {
    controls.setSubjectInput('shiba', 'character:ArrowUp', true);
    driver.step(root, 0.5, 50);
    assert.equal(root.position.y, 25);

    windowStepElevation = false;
    controls.setSubjectInput('shiba', 'character:ArrowUp', false);
    driver.step(root, 0.5, 50);
    assert.equal(root.position.y, 0);
  } finally {
    driver.dispose();
  }
});
