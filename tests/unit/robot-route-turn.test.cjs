const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('../support/load-ts.cjs');
const { computeRotYStep } = load('src/features/scene/ai/agent/agentAvoidance.ts', {
  '../../cameraState': {}, '../../store/useSceneStore': {}, '../navigation/obstacles': {},
  '../navigation/geometry': {}, '../duoSessionManager': {}, '@/devLog': {},
});

it('tourne puis repart sur un détour qui ne rappelle pas le steering, même avec un point derrière', () => {
  const source = fs.readFileSync('src/features/scene/placements/RobotPlacements.tsx', 'utf8');
  const begin = source.indexOf('        const before = { x: root.position.x');
  const end = source.indexOf('        if (route.current.error', begin);
  assert(begin > 0 && end > begin);
  const advance = new Function('root', 'route', 'ai', 'config', 'delta', 'followRoute', 'computeRotYStep',
    `const id = 'microduck', selectMotion = () => {}; ${source.slice(begin, end)}`);
  const root = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
  const target = { x: 0, z: -10 }, route = { current: { path: [target], index: 0 } };
  let callbacks = 0;
  const followRoute = (_, id, start, goal, travel) => {
    callbacks++;
    const distance = Math.hypot(goal.x - start.x, goal.z - start.z);
    const step = Math.min(travel, distance);
    return { x: start.x, z: start.z - step };
  };
  for (let frame = 0; frame < 300 && root.position.z !== target.z; frame++) {
    advance(root, route, { target }, { speed: 10 }, 1 / 60, followRoute, computeRotYStep);
  }
  assert(callbacks > 0);
  assert.equal(root.position.z, target.z, 'The robot must reach the waypoint without a steering callback');
});
