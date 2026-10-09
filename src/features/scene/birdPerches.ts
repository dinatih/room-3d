import * as THREE from 'three';
import { GARDEN_PANEL_DEFS, pEast, pWest, pNorth } from './wallData';

export const ROBIN_HEIGHT = 15; // cm

export type BirdSupportKind = 'furniture' | 'lid' | 'plant' | 'feeder' | 'fence' | 'ground';
export type BirdSupport = { id: string; kind: BirdSupportKind };
export type BirdPerch = {
  support: THREE.Object3D;
  descriptor: BirdSupport;
  mesh: THREE.Mesh;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  tangent: THREE.Vector3;
  id: string;
};
export type BirdFootPose = {
  left: THREE.Vector3;
  right: THREE.Vector3;
  thickness: number;
  height: number;
  radius: number;
};

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
// Standing supports may slope by at most 45 degrees; vertical sides aren't perches.
const MIN_UP_NORMAL = Math.cos(Math.PI / 4);
const raycaster = new THREE.Raycaster();
raycaster.layers.enableAll();
const pixels = new WeakMap<THREE.Texture, ImageData>();

function textureValue(texture: THREE.Texture, uv: THREE.Vector2, channel: number): number {
  let data = pixels.get(texture);
  if (!data) {
    const source = texture.image as CanvasImageSource & { width: number; height: number };
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(source, 0, 0);
    data = context.getImageData(0, 0, canvas.width, canvas.height);
    pixels.set(texture, data);
  }
  texture.updateMatrix();
  const coordinate = texture.transformUv(uv.clone());
  const x = THREE.MathUtils.clamp(Math.floor(coordinate.x * data.width), 0, data.width - 1);
  const y = THREE.MathUtils.clamp(Math.floor(coordinate.y * data.height), 0, data.height - 1);
  return data.data[(y * data.width + x) * 4 + channel] / 255;
}

/** Three's raycaster doesn't test texture alpha: a transparent leaf corner isn't an appui. */
function solidHit(hit: THREE.Intersection): boolean {
  const mesh = hit.object as THREE.Mesh;
  const material = (Array.isArray(mesh.material)
    ? mesh.material[hit.face!.materialIndex] : mesh.material) as THREE.MeshStandardMaterial;
  if (!material.visible) return false;
  if (material.alphaTest === 0) return true;
  if (!hit.uv) throw new Error('Robin : surface découpée sans coordonnées UV');
  let alpha = material.opacity;
  if (material.map) alpha *= textureValue(material.map, hit.uv, 3);
  if (material.alphaMap) alpha *= textureValue(material.alphaMap, hit.uv, 1);
  return alpha >= material.alphaTest;
}

export function supportIsAvailable(support: THREE.Object3D, world: THREE.Scene): boolean {
  let object: THREE.Object3D | null = support;
  while (object && object !== world) {
    if (!object.visible) return false;
    object = object.parent;
  }
  return object === world;
}

function meshesOf(support: THREE.Object3D, perchesOnly: boolean): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  support.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && mesh.visible && (!perchesOnly || mesh.userData.birdPerch)) meshes.push(mesh);
  });
  return meshes;
}

function perchMeshes(support: THREE.Object3D): THREE.Mesh[] {
  const marked = meshesOf(support, true);
  return marked.length ? marked : meshesOf(support, false);
}

function supportsOf(world: THREE.Scene): THREE.Object3D[] {
  const supports: THREE.Object3D[] = [];
  world.traverse(object => {
    if (object.userData.birdSupport && supportIsAvailable(object, world)) supports.push(object);
  });
  return supports;
}

function castAt(x: number, z: number, top: number, meshes: THREE.Mesh[]): THREE.Intersection | undefined {
  raycaster.set(new THREE.Vector3(x, top, z), DOWN);
  return raycaster.intersectObjects(meshes, false).find(solidHit);
}

/** Resolve against live geometry, including moving armrests and loaded/replaced ground. */
export function resolveBirdPerch(
  perch: BirdPerch, world: THREE.Scene, feet: BirdFootPose,
  position: THREE.Vector3, rotation: THREE.Quaternion,
): boolean {
  if (!supportIsAvailable(perch.support, world)) return false;
  perch.mesh.updateWorldMatrix(true, false);
  position.copy(perch.point).applyMatrix4(perch.mesh.matrixWorld);
  const normal = perch.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(perch.mesh.matrixWorld));
  if (normal.y < MIN_UP_NORMAL) return false;
  const tangent = perch.tangent.clone().transformDirection(perch.mesh.matrixWorld);
  const across = feet.right.clone().sub(feet.left);
  const alignUp = new THREE.Quaternion().setFromUnitVectors(UP, normal);
  tangent.applyQuaternion(alignUp.clone().invert());
  const yaw = Math.atan2(across.x, across.z) - Math.atan2(tangent.x, tangent.z);
  rotation.copy(alignUp).multiply(new THREE.Quaternion().setFromAxisAngle(UP, -yaw));

  const targets = perchMeshes(perch.support);
  const box = new THREE.Box3().setFromObject(perch.support);
  const top = perch.descriptor.kind === 'feeder'
    ? position.y + feet.height : box.max.y + feet.height;
  const contactHits = () => {
    const hits: THREE.Intersection[] = [];
    for (const foot of [feet.left, feet.right]) {
      const contact = foot.clone().applyQuaternion(rotation).add(position);
      const hit = castAt(contact.x, contact.z, top, targets);
      if (!hit || Math.abs(hit.point.y - contact.y) > feet.thickness) return null;
      hits.push(hit);
    }
    return hits;
  };
  let hits = contactHits();
  if (!hits) return false;
  // Fit the stance to both contacts, including rounded rims and gently curved leaves.
  const actualAcross = hits[1].point.clone().sub(hits[0].point).normalize();
  const posedAcross = across.clone().applyQuaternion(rotation).normalize();
  rotation.premultiply(new THREE.Quaternion().setFromUnitVectors(posedAcross, actualAcross));
  hits = contactHits();
  if (!hits) return false;
  position.y += Math.max(...hits.map((hit, i) =>
    hit.point.y - [feet.left, feet.right][i].clone().applyQuaternion(rotation).add(position).y));
  if (perch.descriptor.kind === 'ground') {
    const body = new THREE.Box3().setFromCenterAndSize(
      position.clone().addScaledVector(UP, feet.height / 2),
      new THREE.Vector3(feet.radius * 2, feet.height, feet.radius * 2),
    );
    const occupied = supportsOf(world).some(root => root !== perch.support &&
      body.intersectsBox(new THREE.Box3().setFromObject(root)));
    if (occupied) return false;
  }
  return true;
}

const triangleCache = new WeakMap<THREE.BufferGeometry, {
  point: THREE.Vector3; normal: THREE.Vector3; tangent: THREE.Vector3; index: number;
}[]>();

function trianglesOf(mesh: THREE.Mesh) {
  let triangles = triangleCache.get(mesh.geometry);
  if (triangles) return triangles;
  triangles = [];
  const geometry = mesh.geometry;
  const attribute = geometry.getAttribute('position');
  const index = geometry.index;
  for (let i = 0; i < (index?.count ?? attribute.count); i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(attribute, index ? index.getX(i) : i);
    const b = new THREE.Vector3().fromBufferAttribute(attribute, index ? index.getX(i + 1) : i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(attribute, index ? index.getX(i + 2) : i + 2);
    const normal = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3());
    const edges = [b.clone().sub(a), c.clone().sub(b), a.clone().sub(c)];
    edges.sort((first, second) => second.lengthSq() - first.lengthSq());
    triangles.push({ point: a.add(b).add(c).divideScalar(3), normal, tangent: edges[0].normalize(), index: i / 3 });
  }
  triangleCache.set(geometry, triangles);
  return triangles;
}

function candidatesOf(support: THREE.Object3D, feet: BirdFootPose): BirdPerch[] {
  const descriptor = support.userData.birdSupport as BirdSupport;
  const candidates: BirdPerch[] = [];
  if (descriptor.kind === 'ground') {
    const mesh = support as THREE.Mesh;
    mesh.updateWorldMatrix(true, false);
    const height = new THREE.Box3().setFromObject(mesh).max.y;
    // Bounds of our garden, from the existing pillars and the end of the palissade.
    const xMin = pEast('corner-nw-ext'), xMax = pWest('corner-ne-ext');
    const zMin = Math.min(...GARDEN_PANEL_DEFS.map(panel => panel.cz - panel.d / 2));
    const zMax = pNorth('corner-nw-ext');
    // Sample at bird-sized intervals; exclude occupied locations through geometry checks.
    for (let x = xMin + feet.height; x < xMax - feet.height; x += feet.height) {
      for (let z = zMin + feet.height; z < zMax - feet.height; z += feet.height) {
        candidates.push({ support, descriptor, mesh,
          point: mesh.worldToLocal(new THREE.Vector3(x, height, z)),
          normal: new THREE.Vector3(0, 0, 1), tangent: new THREE.Vector3(1, 0, 0), id: `${descriptor.id}:${x}:${z}` });
      }
    }
  } else {
    for (const mesh of perchMeshes(support)) {
      mesh.updateWorldMatrix(true, false);
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
      const box = new THREE.Box3().setFromObject(support);
      for (const triangle of trianglesOf(mesh)) {
        if (triangle.normal.clone().applyNormalMatrix(normalMatrix).y < MIN_UP_NORMAL) continue;
        if (descriptor.kind === 'lid' && triangle.point.clone().applyMatrix4(mesh.matrixWorld).y < box.max.y - feet.thickness) continue;
        // The feeder's feeding tray is below the roof, in the lower half of the model.
        if (descriptor.kind === 'feeder' && triangle.point.clone().applyMatrix4(mesh.matrixWorld).y >= (box.min.y + box.max.y) / 2) continue;
        candidates.push({ support, descriptor, mesh, ...triangle, id: `${descriptor.id}:${mesh.uuid}:${triangle.index}` });
      }
    }
  }
  return candidates;
}

function shuffle<T>(values: T[]): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const other = Math.floor(Math.random() * (i + 1));
    [values[i], values[other]] = [values[other], values[i]];
  }
  return values;
}

export function chooseBirdPerch(world: THREE.Scene, feet: BirdFootPose, current?: BirdPerch | null, preferredId?: string): BirdPerch | null {
  const supports = shuffle(supportsOf(world));
  // Try the current support last if every other support is unusable.
  supports.sort((a, b) => Number(a === current?.support) - Number(b === current?.support));
  if (preferredId) supports.sort((a, b) => Number(b.userData.birdSupport.id === preferredId) - Number(a.userData.birdSupport.id === preferredId));
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  for (const support of supports) {
    // Give other supports the first choice, instead of weighting by triangle count.
    for (const perch of shuffle(candidatesOf(support, feet))) {
      if (perch.id !== current?.id && resolveBirdPerch(perch, world, feet, position, rotation)) return perch;
    }
  }
  return null; // All supports may legitimately be hidden or still loading.
}

/** Read the actual animated toe geometry, rather than the bind-pose body bounding box. */
export class RobinFootContact {
  private vertices: { mesh: THREE.SkinnedMesh; left: number[]; right: number[] }[] = [];
  private left = new THREE.Box3();
  private right = new THREE.Box3();
  private vertex = new THREE.Vector3();
  private radius: number;

  constructor(model: THREE.Object3D) {
    model.updateWorldMatrix(true, false);
    // SkinnedMesh.updateMatrixWorld also updates bindMatrixInverse after the bird moves.
    model.updateMatrixWorld(true);
    model.traverse(object => {
      if ((object as THREE.SkinnedMesh).isSkinnedMesh) (object as THREE.SkinnedMesh).skeleton.update();
    });
    const size = new THREE.Box3().setFromObject(model, true).getSize(new THREE.Vector3());
    this.radius = Math.hypot(size.x, size.z) / 2;
    model.traverse(object => {
      const mesh = object as THREE.SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      const indices = mesh.geometry.getAttribute('skinIndex');
      const weights = mesh.geometry.getAttribute('skinWeight');
      const left: number[] = [], right: number[] = [];
      for (let i = 0; i < indices.count; i++) {
        let leftWeight = 0, rightWeight = 0;
        for (let channel = 0; channel < 4; channel++) {
          const bone = mesh.skeleton.bones[indices.getComponent(i, channel)].name;
          const weight = weights.getComponent(i, channel);
          if (/^L_Digit/.test(bone)) leftWeight += weight;
          if (/^R_Digit/.test(bone)) rightWeight += weight;
        }
        if (leftWeight > 0.5) left.push(i);
        if (rightWeight > 0.5) right.push(i);
      }
      if (left.length || right.length) this.vertices.push({ mesh, left, right });
    });
    if (!this.vertices.length) throw new Error('Robin : géométrie des pattes introuvable');
  }

  measure(model: THREE.Object3D): BirdFootPose {
    model.updateWorldMatrix(true, false);
    // SkinnedMesh.updateMatrixWorld also updates bindMatrixInverse after the bird moves.
    model.updateMatrixWorld(true);
    const inverse = model.matrixWorld.clone().invert();
    this.left.makeEmpty(); this.right.makeEmpty();
    for (const { mesh, left, right } of this.vertices) {
      mesh.skeleton.update();
      const transform = inverse.clone().multiply(mesh.matrixWorld);
      for (const [indices, box] of [[left, this.left], [right, this.right]] as const) {
        for (const i of indices) {
          mesh.getVertexPosition(i, this.vertex).applyMatrix4(transform);
          box.expandByPoint(this.vertex);
        }
      }
    }
    if (this.left.isEmpty() || this.right.isEmpty()) throw new Error('Robin : une patte manque');
    const left = this.left.getCenter(new THREE.Vector3()); left.y = this.left.min.y;
    const right = this.right.getCenter(new THREE.Vector3()); right.y = this.right.min.y;
    const center = left.clone().add(right).multiplyScalar(0.5);
    center.y = Math.min(left.y, right.y);
    left.sub(center); right.sub(center);
    return { left, right, thickness: Math.min(this.left.max.y - this.left.min.y, this.right.max.y - this.right.min.y), height: ROBIN_HEIGHT, radius: this.radius };
  }

  ground(model: THREE.Object3D, content: THREE.Object3D): BirdFootPose {
    content.position.set(0, 0, 0);
    const pose = this.measure(model);
    const center = this.left.getCenter(new THREE.Vector3()).add(this.right.getCenter(new THREE.Vector3())).multiplyScalar(0.5);
    center.y = Math.min(this.left.min.y, this.right.min.y);
    // content is scaled but its translation is expressed in the parent/model coordinate space.
    content.position.copy(center).negate();
    return pose;
  }
}
