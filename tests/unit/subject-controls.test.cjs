const { it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const cameraState = { animalViews: { test: { forward: { x: 0, y: 0, z: 1 } } }, positions: {} };
let blocked = false;
const controls = load('src/features/scene/camera/subjectControls.ts', {
  three: THREE, '../cameraState': { cameraState }, '../hornetTour': { HornetSpace: class { blocker() { return blocked; } } },
  '../ai/navigation/service': { getNavigationGraph: () => ({ obstacles: [] }) },
  '../ai/navigation/obstacles': { getAgentProfile: () => ({ radius: 10, height: 30 }) },
  '../ai/agent/agentAvoidance': { limitAgentMovement: (_, __, point) => point },
  '../ai/navigation/navigationScope': { NavigationScope: class { poll(fn) { fn(); return true; } clear() {} } },
  '../ai/navigation/geometry': { segmentFree: () => !blocked }, '../doorObstacles': { DOOR_CONFIGS: {}, doorCollisionState: {} },
});
afterEach(() => { new controls.SubjectDriver('test').dispose(); new controls.SubjectDriver('other').dispose(); blocked = false; });
it('reprend exactement après 12 secondes depuis le relâchement, même après un appui long', () => {
  controls.setSubjectInput('test', 'character:ArrowUp', true, 100);
  assert(controls.readSubjectInput('test', 50000));
  controls.setSubjectInput('test', 'character:ArrowUp', false, 50000);
  assert(controls.readSubjectInput('test', 61999));
  assert.equal(controls.readSubjectInput('test', 62000), null);
});
it('relance le délai à chaque commande et garde les délais propres à chaque cible', () => {
  controls.setSubjectInput('test', 'character:ArrowLeft', true, 100);
  controls.setSubjectInput('other', 'character:ArrowUp', true, 5000);
  controls.releaseSubjectInputs(6000);
  assert(controls.readSubjectInput('other', 17999));
  controls.setSubjectInput('test', 'character:ArrowRight', true, 17000);
  controls.setSubjectInput('test', 'character:ArrowRight', false, 17500);
  assert.equal(controls.readSubjectInput('other', 18000), null);
  assert(controls.readSubjectInput('test', 29499));
  assert.equal(controls.readSubjectInput('test', 29500), null);
});
it('la croix déplace le corps, suspend ensuite le déplacement et respecte les obstacles', () => {
  const driver = new controls.SubjectDriver('test'), root = new THREE.Group();
  controls.setSubjectInput('test', 'character:ArrowUp', true);
  driver.step(root, 1, 50);
  assert(driver.active && driver.started && driver.moving);
  assert.equal(root.position.z, 50);
  controls.releaseSubjectInputs();
  driver.step(root, 1, 50);
  assert(driver.active && !driver.started && !driver.moving);
  assert.equal(root.position.z, 50);
  controls.setSubjectInput('test', 'character:ArrowUp', true);
  blocked = true;
  driver.step(root, 1, 50);
  assert(!driver.moving);
  assert.equal(root.position.z, 50);
});
it('conserve un cap horizontal stable quand la vue du drone pointe verticalement', () => {
  const driver = new controls.SubjectDriver('test'), root = new THREE.Group();
  cameraState.animalViews.test.forward = { x: 0, y: -1, z: 0 };
  cameraState.positions.test = { x: 0, y: 100, z: 0, yaw: Math.PI / 2 };
  root.position.y = 100;
  try {
    controls.setSubjectInput('test', 'character:ArrowUp', true);
    driver.step(root, 1, 50, 10);
    driver.step(root, 1, 50, 10);
    assert(Math.abs(root.position.x - 100) < 1e-9);
    assert(Math.abs(root.position.z) < 1e-9);
    assert.equal(root.position.y, 100);
  } finally { cameraState.animalViews.test.forward = { x: 0, y: 0, z: 1 }; }
});
