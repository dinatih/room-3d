const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { WALL_DEFS, WALL_THICKNESS, wallPlanSegments, wallDefToBoxGeo, pNorth, pEast, pZ } = require('../../src/features/scene/wallData.ts');
const { SEG_CONCRETE_WALLS, SEG_PARTITIONS } = require('../../src/features/scene/floorData.ts');

it('les faces du plan coïncident avec les limites des volumes 3D, même après changement des cotes', () => {
  for (const source of WALL_DEFS.filter(d => d.segKind !== 'door')) {
    for (const d of [source, { ...source, t: (source.t ?? WALL_THICKNESS) * 2 }]) {
      const geometry = wallDefToBoxGeo(d);
      geometry.computeBoundingBox();
      const { min, max } = geometry.boundingBox;
      const expected = d.axis === 'z'
        ? [[min.x, min.z, min.x, max.z], [max.x, min.z, max.x, max.z]]
        : [[min.x, min.z, max.x, min.z], [min.x, max.z, max.x, max.z]];
      wallPlanSegments(d).flat().forEach((value, i) => {
        assert(Math.abs(value - expected.flat()[i]) < 1e-4, 'Précision des positions Float32 de Three.js');
      });
      geometry.dispose();
    }
  }
});

it('chaque mur au sol est projeté et les ouvertures restent exclues', () => {
  for (const d of WALL_DEFS) {
    if (d.segKind === 'door' || (d.yBase ?? 0) !== 0) continue;
    assert(['concrete', 'partition'].includes(d.construction));
    const segments = d.construction === 'concrete' ? SEG_CONCRETE_WALLS : SEG_PARTITIONS;
    for (const face of wallPlanSegments(d)) assert(segments.some(s => s.every((v, i) => v === face[i])));
  }
  const expectedPartitions = WALL_DEFS.filter(d => d.segKind !== 'door' && (d.yBase ?? 0) === 0 && d.construction === 'partition').flatMap(wallPlanSegments);
  assert.deepEqual(SEG_PARTITIONS, expectedPartitions);
});

it('le placo de la niche rejoint la face du pilier sans trait à travers son centre', () => {
  assert(SEG_PARTITIONS.some(([x1, , x2, z2]) => x1 === pEast('niche-beam') && x2 === x1 && z2 === pNorth('niche-beam')));
  assert(!SEG_PARTITIONS.some(([, z1, , z2]) => z1 === pZ('niche-beam') && z2 === z1));
});
