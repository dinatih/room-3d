const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const file = 'src/features/scene/ai/navigation/service.ts';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'advanceRoute');
const code = ts.transpileModule(declaration.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const graph = { obstacles: [], canReach: () => true };
const advance = new Function('getAgentProfile', 'getNavigationGraph', 'furnitureObstacles', 'getContainingObjectOwner', 'retainValidRoute', 'distance', 'segmentFree', 'passDoors', `${code}; return advanceRoute;`)(
  () => ({ height: 170 }), () => graph, new Map(), () => undefined, () => {}, distance, () => true,
  (_route, _id, _profile, _start, proposed) => proposed,
);
// Tangent vertices around a stationary body must be followed exactly, even
// when local avoidance would push the actor away from each successive vertex.
const target = { x: 60, z: 0 };
const path = [{ x: 20, z: 12 }, { x: 40, z: 12 }, target];
const route = { error: null, index: 0, path, graph, target, destination: target, crowd: { base: graph, graph } };
let position = { x: 0, z: 0 }, steeringCalls = 0;
const steer = direction => { steeringCalls++; return { x: -direction.z, z: direction.x }; };
const steps = path.reduce((sum, point, i) => sum + Math.ceil(distance(i ? path[i - 1] : position, point) / 3), 0);
for (let frame = 0; frame < steps; frame++) position = advance(route, 'walker', position, target, 3, steer);
assert.deepEqual(position, target, 'Crowd route must reach its destination in the planned number of steps');
assert.equal(steeringCalls, 0, 'Local steering must not fight a crowd path');
route.crowd = undefined;
route.index = 0;
advance(route, 'walker', { x: 0, z: 0 }, target, 3, steer);
assert.equal(steeringCalls, 1, 'Static routes retain anticipatory steering');
console.log('Crowd tangent waypoints reached; static-route steering retained');
