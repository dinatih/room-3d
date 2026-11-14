import * as THREE from 'three';

interface ClipVertex {
  pos: THREE.Vector3;
  norm: THREE.Vector3 | null;
  uv: THREE.Vector2 | null;
}

function lerpVertex(a: ClipVertex, b: ClipVertex, t: number): ClipVertex {
  return {
    pos: new THREE.Vector3().lerpVectors(a.pos, b.pos, t),
    norm: a.norm && b.norm ? new THREE.Vector3().lerpVectors(a.norm, b.norm, t).normalize() : null,
    uv: a.uv && b.uv ? new THREE.Vector2().lerpVectors(a.uv, b.uv, t) : null,
  };
}

function clipTriangleBelowY(v0: ClipVertex, v1: ClipVertex, v2: ClipVertex, maxY: number): ClipVertex[] {
  const input = [v0, v1, v2];
  const output: ClipVertex[] = [];
  for (let i = 0; i < 3; i++) {
    const cur = input[i];
    const prev = input[(i + 2) % 3];
    const curIn = cur.pos.y <= maxY;
    const prevIn = prev.pos.y <= maxY;
    if (curIn !== prevIn) {
      const denom = cur.pos.y - prev.pos.y;
      const t = Math.abs(denom) > 1e-8 ? (maxY - prev.pos.y) / denom : 0;
      output.push(lerpVertex(prev, cur, Math.max(0, Math.min(1, t))));
    }
    if (curIn) output.push(cur);
  }
  return output;
}

/** Coupe une géométrie sous le plan horizontal monde `y <= maxWorldY`, en conservant les groupes de matériaux. */
export function clipGeometryWorldY(mesh: THREE.Mesh, maxWorldY: number): THREE.BufferGeometry | null {
  const src = mesh.geometry;
  const posAttr = src.getAttribute('position');
  if (!posAttr) return null;

  mesh.updateMatrixWorld(true);
  const worldMat = mesh.matrixWorld;
  const invWorld = worldMat.clone().invert();
  const normMat = new THREE.Matrix3().getNormalMatrix(worldMat);
  const invNormMat = new THREE.Matrix3().getNormalMatrix(invWorld);

  const normAttr = src.getAttribute('normal');
  const uvAttr = src.getAttribute('uv');
  const index = src.getIndex();
  const totalVerts = index ? index.count : posAttr.count;
  const groups = src.groups.length ? src.groups : [{ start: 0, count: totalVerts, materialIndex: 0 }];

  const outPositions: number[] = [];
  const outNormals: number[] = [];
  const outUvs: number[] = [];
  const outGroups: { start: number; count: number; materialIndex?: number }[] = [];

  const readVertex = (vi: number): ClipVertex => {
    const pos = new THREE.Vector3().fromBufferAttribute(posAttr, vi).applyMatrix4(worldMat);
    const norm = normAttr ? new THREE.Vector3().fromBufferAttribute(normAttr, vi).applyMatrix3(normMat).normalize() : null;
    const uv = uvAttr ? new THREE.Vector2(uvAttr.getX(vi), uvAttr.getY(vi)) : null;
    return { pos, norm, uv };
  };

  const pushVertex = (v: ClipVertex) => {
    const localPos = v.pos.clone().applyMatrix4(invWorld);
    outPositions.push(localPos.x, localPos.y, localPos.z);
    if (normAttr && v.norm) {
      const localNorm = v.norm.clone().applyMatrix3(invNormMat).normalize();
      outNormals.push(localNorm.x, localNorm.y, localNorm.z);
    }
    if (uvAttr && v.uv) {
      outUvs.push(v.uv.x, v.uv.y);
    }
  };

  for (const group of groups) {
    const groupStart = outPositions.length / 3;
    const end = Math.min(totalVerts, group.start + group.count);
    for (let i = group.start; i + 2 < end; i += 3) {
      const i0 = index ? index.getX(i) : i;
      const i1 = index ? index.getX(i + 1) : i + 1;
      const i2 = index ? index.getX(i + 2) : i + 2;
      const poly = clipTriangleBelowY(readVertex(i0), readVertex(i1), readVertex(i2), maxWorldY);
      if (poly.length < 3) continue;
      for (let k = 1; k + 1 < poly.length; k++) {
        pushVertex(poly[0]);
        pushVertex(poly[k]);
        pushVertex(poly[k + 1]);
      }
    }
    const groupCount = outPositions.length / 3 - groupStart;
    if (groupCount > 0) {
      outGroups.push({ start: groupStart, count: groupCount, materialIndex: group.materialIndex });
    }
  }

  if (outPositions.length === 0) return null;

  const clipped = new THREE.BufferGeometry();
  clipped.setAttribute('position', new THREE.Float32BufferAttribute(outPositions, 3));
  if (normAttr) clipped.setAttribute('normal', new THREE.Float32BufferAttribute(outNormals, 3));
  if (uvAttr) clipped.setAttribute('uv', new THREE.Float32BufferAttribute(outUvs, 2));
  for (const g of outGroups) clipped.addGroup(g.start, g.count, g.materialIndex);
  clipped.computeBoundingBox();
  clipped.computeBoundingSphere();
  return clipped;
}
