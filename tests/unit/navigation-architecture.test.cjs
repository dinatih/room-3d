const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');

it('removes hidden neighbor architecture and restores it when shown', () => {
    const architecture = require('../../src/features/scene/ai/navigation/architecture.ts');
    architecture.setNeighborArchitectureVisible(false);
    const local = architecture.architectureObstacles;
    architecture.setNeighborArchitectureVisible(true);
    assert(architecture.architectureObstacles.length > local.length);
    for (const obstacle of local) assert(architecture.architectureObstacles.some(other => other.polygon.every((p, i) => p.x === obstacle.polygon[i]?.x && p.z === obstacle.polygon[i]?.z)));
    architecture.setNeighborArchitectureVisible(false);
    assert.strictEqual(architecture.architectureObstacles, local);
});
