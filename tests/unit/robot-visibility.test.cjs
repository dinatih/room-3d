const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { useRobotVisibility, isRobotSubjectVisible, ROBOT_SUBJECTS } = load('src/features/scene/store/useRobotVisibility.ts', { zustand: require('zustand') });

it('affiche les cinq robots demandés et retire les autres sujets jusqu’à leur activation', () => {
  const initial = useRobotVisibility.getState().visible;
  assert.deepEqual(initial, ['black-hornet-drone', 'dji-avata-2', 'unitree-g1', 'microduck', 'jumper-robot']);
  for (const [id, subject] of Object.entries(ROBOT_SUBJECTS)) {
    assert.equal(isRobotSubjectVisible(subject, initial), initial.includes(id));
    useRobotVisibility.getState().toggle(id);
    assert.equal(isRobotSubjectVisible(subject, useRobotVisibility.getState().visible), !initial.includes(id));
    useRobotVisibility.getState().toggle(id);
  }
  assert(isRobotSubjectVisible('shiba', []));
});

it('sépare les profils robots des profils humains de mêmes dimensions', () => {
  const profiles = require('../../src/features/scene/ai/navigation/obstacles.ts');
  try {
    profiles.setAgentProfile('test-human', { radius: 10, height: 50 });
    profiles.setAgentProfile('test-robot', { radius: 10, height: 50, excludeStudio: true });
    assert.notStrictEqual(profiles.getAgentProfile('test-human'), profiles.getAgentProfile('test-robot'));
    assert.equal(profiles.getAgentProfile('test-robot').excludeStudio, true);
  } finally { profiles.removeAgentProfile('test-human'); profiles.removeAgentProfile('test-robot'); }
});

it('bloque les destinations et traversées du studio tout en laissant les voisins et le jardin accessibles', () => {
  const { studioRobotObstacle, walkableSurfaces } = require('../../src/features/scene/ai/navigation/architecture.ts');
  const { buildNavigationGraph } = require('../../src/features/scene/ai/navigation/queries.ts');
  const { NEIGHBOR_OFFSETS } = require('../../src/features/scene/environmentData.ts');
  const mesh = buildNavigationGraph({ surfaces: walkableSurfaces, solids: [{ polygon: studioRobotObstacle.polygon, radius: 6 }] });
  const garden = { x: 150, z: -200 };
  for (const goal of [{ x: 150, z: 150 }, { x: 100, z: 500 }, { x: 250, z: 500 }]) assert.equal(mesh.find(garden, goal), null);
  assert(mesh.find(garden, { x: 250, z: -300 }));
  for (const offset of NEIGHBOR_OFFSETS) assert(mesh.find(garden, { x: 150 + offset.x, z: 150 + offset.z }));
});
