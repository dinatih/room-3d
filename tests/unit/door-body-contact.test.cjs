const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const g = require('../../src/features/scene/ai/navigation/geometry.ts');
const obstacles = require('../../src/features/scene/ai/navigation/obstacles.ts');
const cameraState = { positions: {} };
const doors = load('src/features/scene/doorObstacles.ts', {
  './cameraState': { cameraState }, './ai/navigation/obstacles': obstacles, './ai/navigation/geometry': g,
  './ai/navigation/doorRequests': require('../../src/features/scene/ai/navigation/doorRequests.ts'),
  './wallData': require('../../src/features/scene/wallData.ts'),
});
const { useDoorSpring } = load('src/features/scene/items/useDoorSpring.ts', {
  react: { useRef: current => ({ current }) }, '@react-three/fiber': { useThree: () => ({ invalidate() {} }) },
});

it('la porte du séjour ne se referme pas sur Native arrêté à la position des logs', () => {
  const id = 'door-contact-native', door = doors.DOOR_CONFIGS.living, point = { x: 255.5, z: 364.7 };
  const profile = { radius: 13.3, height: 170 };
  obstacles.setAgentProfile(id, profile);
  cameraState.positions[id] = { ...point, y: 0 };
  try {
    assert.equal(doors.computeDoorDynamics(door, 0).minimum, 0, 'A closed door must not reopen just because someone stands in its swing area');
    const bearing = Math.atan2(door.pivot.z - point.z, door.pivot.x - point.x);
    for (const initial of [door.maxAngle, bearing]) for (const sign of [-1, 1]) for (const dt of [1 / 240, 1 / 60, 1 / 15, .5]) {
      const spring = useDoorSpring();
      let angle = sign * initial;
      for (let frame = 0; frame < 120; frame++) {
        const { allowed, minimum, push } = doors.computeDoorDynamics(door, angle);
        assert(minimum > 0);
        const target = sign * Math.max(minimum, push);
        angle = spring(angle, target, dt, sign < 0 ? -allowed : minimum, sign < 0 ? -minimum : allowed);
        assert(g.segmentFree(point, point, [[g.inflate(doors.doorPolygon('living', angle), profile.radius + door.margin)]]), `Door entered the stationary body at ${angle}, dt=${dt}`);
      }
      const escape = { x: point.x - 10, z: point.z };
      assert(g.segmentFree(point, escape, [[g.inflate(doors.doorPolygon('living', angle), profile.radius + door.margin)]]), 'The body must still be able to walk away');
    }
    cameraState.positions[id].x += door.length * 2;
    assert.equal(doors.computeDoorDynamics(door, door.maxAngle).minimum, 0, 'Leaving releases the closing stop');
  } finally { delete cameraState.positions[id]; obstacles.removeAgentProfile(id); }
});
