/** Depth-only native skin batches; colors, outfits and skeletons remain independent. */
import { BufferGeometry, MeshBasicMaterial, Object3D, Scene, SkinnedMesh, Sphere, VSMShadowMap, type Material, type PointLight, type BufferAttribute, type InterleavedBufferAttribute, type WebGLRenderer } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type SkinMaterial = Material & { displacementMap?: unknown; wireframe?: boolean };
type Attribute = BufferAttribute | InterleavedBufferAttribute;
type Source = { mesh: SkinnedMesh; geometry: BufferGeometry; attributes: { name: string; attribute: Attribute; version: number }[]; index: BufferAttribute | null; indexVersion: number };
function version(attribute: Attribute) { return 'data' in attribute ? attribute.data.version : attribute.version; }
function unchanged(source: Source) {
  return source.mesh.geometry === source.geometry && source.geometry.index === source.index &&
    (source.index?.version ?? 0) === source.indexVersion && source.attributes.every(snapshot =>
      source.geometry.getAttribute(snapshot.name) === snapshot.attribute && version(snapshot.attribute) === snapshot.version);
}
type GeometryEntry = { geometry: BufferGeometry; refs: number };
type Cohort = { root: Object3D; sources: Source[]; material: MeshBasicMaterial; sphere: Sphere; key: string; entry?: GeometryEntry };

function eligible(mesh: SkinnedMesh): mesh is SkinnedMesh<BufferGeometry, SkinMaterial> {
  if (!mesh.isSkinnedMesh || !mesh.castShadow || Array.isArray(mesh.material) || mesh.customDepthMaterial || mesh.customDistanceMaterial ||
      mesh.onBeforeShadow !== Object3D.prototype.onBeforeShadow || mesh.onAfterShadow !== Object3D.prototype.onAfterShadow ||
      Object.keys(mesh.geometry.morphAttributes).length ||
      mesh.geometry.drawRange.start !== 0 || mesh.geometry.drawRange.count !== Infinity) return false;
  const m = mesh.material as SkinMaterial;
  return m.visible && !m.transparent && !m.alphaTest && !m.alphaToCoverage && !m.clippingPlanes?.length && !m.displacementMap && !m.wireframe;
}
function visibleWithin(mesh: Object3D, root: Object3D): boolean {
  let node: Object3D | null = mesh;
  while (node) { if (!node.visible) return false; if (node === root) return true; node = node.parent; }
  return false;
}

/** Capture mesh references once, then only reassemble when the active subset changes. */
export function createLaraShadowBatching(roots: Object3D[]) {
  const cohorts: Cohort[] = [], cache = new Map<string, GeometryEntry>();
  const state = { enabled: true };
  let builds = 0;
  const addRoot = (root: Object3D) => {
    const added: Cohort[] = [];
    const groups = new Map<string, Source[]>();
    root.traverse(object => {
      const mesh = object as SkinnedMesh;
      // Hidden native parts may be selected later. Shadow eligibility is checked per render.
      if (!mesh.isSkinnedMesh || Array.isArray(mesh.material) || Object.keys(mesh.geometry.morphAttributes).length ||
          mesh.geometry.drawRange.start !== 0 || mesh.geometry.drawRange.count !== Infinity) return;
      const material = mesh.material;
      const attributes = ['position', 'skinIndex', 'skinWeight'].map(name => {
        const a = mesh.geometry.getAttribute(name);
        if (!a) throw new Error(`Missing ${name} on Lara skin: ${mesh.name}`);
        return [name, a.array.constructor.name, a.itemSize, a.normalized];
      });
      const key = JSON.stringify([mesh.skeleton.uuid, mesh.bindMode, mesh.bindMatrix.elements, mesh.matrixWorld.elements,
        mesh.layers.mask, mesh.frustumCulled, material.side, material.shadowSide, !!mesh.geometry.index, attributes]);
      const sources = groups.get(key) ?? [];
      const snapshots = ['position', 'skinIndex', 'skinWeight'].map(name => {
        const attribute = mesh.geometry.getAttribute(name); return { name, attribute, version: version(attribute) };
      });
      sources.push({ mesh, geometry: mesh.geometry, attributes: snapshots, index: mesh.geometry.index, indexVersion: mesh.geometry.index?.version ?? 0 }); groups.set(key, sources);
    });
    for (const sources of groups.values()) {
      if (sources.length < 2) continue;
      const first = sources[0].mesh.material as Material;
      const material = new MeshBasicMaterial({ side: first.side }); material.shadowSide = first.shadowSide;
      const cohort = { root, sources, material, sphere: new Sphere(), key: '' };
      cohorts.push(cohort); added.push(cohort);
    }
    return () => {
      for (const cohort of added) {
        release(cohort); cohort.material.dispose(); cohorts.splice(cohorts.indexOf(cohort), 1);
      }
    };
  };
  const release = (cohort: Cohort) => {
    if (cohort.entry && --cohort.entry.refs === 0) { cohort.entry.geometry.dispose(); cache.delete(cohort.key); }
    cohort.entry = undefined; cohort.key = '';
  };
  const acquire = (cohort: Cohort, sources: Source[]) => {
    const key = sources.map(source => source.geometry.uuid).join(':');
    if (key === cohort.key) return cohort.entry!;
    release(cohort);
    let entry = cache.get(key);
    if (!entry) {
      const geometries = sources.map(({ geometry }) => {
        const reduced = new BufferGeometry();
        for (const name of ['position', 'skinIndex', 'skinWeight']) reduced.setAttribute(name, geometry.getAttribute(name).clone());
        if (geometry.index) reduced.setIndex(geometry.index.clone());
        return reduced;
      });
      const geometry = mergeGeometries(geometries, false); geometries.forEach(g => g.dispose());
      if (!geometry) throw new Error('Incompatible Lara shadow skin attributes');
      entry = { geometry, refs: 0 }; cache.set(key, entry); builds++;
    }
    entry.refs++; cohort.key = key; cohort.entry = entry; return entry;
  };
  for (const root of roots) addRoot(root);
  return {
    state, addRoot,
    stats() {
      let bytes = 0;
      for (const { geometry } of cache.values()) {
        for (const attribute of Object.values(geometry.attributes)) bytes += attribute.array.byteLength;
        bytes += geometry.index?.array.byteLength ?? 0;
      }
      return { cohorts: cohorts.length, geometries: cache.size, builds, bytes };
    },
    install(renderer: WebGLRenderer, scene: Scene) {
      const original = renderer.shadowMap.render;
      renderer.shadowMap.render = function (lights, currentScene, camera) {
        if (!state.enabled || currentScene !== scene || renderer.shadowMap.type === VSMShadowMap || !renderer.shadowMap.enabled ||
            (!renderer.shadowMap.autoUpdate && !renderer.shadowMap.needsUpdate) || lights.some(light => {
              const point = light as PointLight; return point.isPointLight && (point.shadow.autoUpdate || point.shadow.needsUpdate);
            })) return original.call(this, lights, currentScene, camera);
        const applied: { first: SkinnedMesh; geometry: BufferGeometry; material: Material | Material[]; sphere?: PropertyDescriptor; sources: Source[] }[] = [];
        try {
          for (const cohort of cohorts) {
            if (!visibleWithin(cohort.root, scene)) continue;
            const anchor = cohort.sources[0].mesh;
            const active = cohort.sources.filter(source => {
              const m = source.mesh;
              return visibleWithin(m, cohort.root) && eligible(m) && unchanged(source) &&
                m.skeleton === anchor.skeleton && m.bindMode === anchor.bindMode && m.bindMatrix.equals(anchor.bindMatrix) &&
                m.bindMatrixInverse.equals(anchor.bindMatrixInverse) && m.matrixWorld.equals(anchor.matrixWorld) &&
                m.layers.mask === anchor.layers.mask && m.frustumCulled === anchor.frustumCulled &&
                m.material.side === cohort.material.side && m.material.shadowSide === cohort.material.shadowSide;
            });
            if (active.length < 2) { release(cohort); continue; }
            const entry = acquire(cohort, active), first = active[0].mesh;
            cohort.sphere.makeEmpty();
            if (first.frustumCulled) for (const { mesh } of active) {
              if (mesh.boundingSphere === null) mesh.computeBoundingSphere();
              cohort.sphere.union(mesh.boundingSphere!);
            }
            applied.push({ first, geometry: first.geometry, material: first.material, sphere: Object.getOwnPropertyDescriptor(first, 'boundingSphere'), sources: active });
            first.geometry = entry.geometry; first.material = cohort.material;
            Object.defineProperty(first, 'boundingSphere', { configurable: true, value: cohort.sphere });
            for (let i = 1; i < active.length; i++) active[i].mesh.castShadow = false;
          }
          return original.call(this, lights, currentScene, camera);
        } finally {
          for (let i = applied.length - 1; i >= 0; i--) {
            const change = applied[i]; change.first.geometry = change.geometry; change.first.material = change.material;
            if (change.sphere) Object.defineProperty(change.first, 'boundingSphere', change.sphere);
            else delete (change.first as Partial<SkinnedMesh>).boundingSphere;
            for (let j = 1; j < change.sources.length; j++) change.sources[j].mesh.castShadow = true;
          }
        }
      };
      return () => { renderer.shadowMap.render = original; };
    },
    dispose() { for (const cohort of cohorts) { release(cohort); cohort.material.dispose(); } cohorts.length = 0; },
  };
}


type Controller = ReturnType<typeof createLaraShadowBatching>;
const renderers = new WeakMap<WebGLRenderer, { scene: Scene; controller: Controller; uninstall: () => void; roots: Set<Object3D> }>();

/** One shared geometry cache and one shadow wrapper per Canvas. */
export function registerLaraShadowBatching(renderer: WebGLRenderer, scene: Scene, root: Object3D): () => void {
  let entry = renderers.get(renderer);
  if (!entry) {
    const controller = createLaraShadowBatching([]);
    entry = { scene, controller, uninstall: controller.install(renderer, scene), roots: new Set() };
    renderers.set(renderer, entry);
  }
  if (entry.scene !== scene) throw new Error('Lara shadow controller belongs to a different Canvas scene');
  if (entry.roots.has(root)) throw new Error('Lara shadow root already registered');
  root.updateWorldMatrix(true, true);
  const remove = entry.controller.addRoot(root); entry.roots.add(root);
  return () => {
    remove(); entry.roots.delete(root);
    if (!entry.roots.size) { entry.uninstall(); entry.controller.dispose(); renderers.delete(renderer); }
  };
}

/** Used by paired performance diagnostics, without installing a second controller. */
export function getLaraShadowBatching(renderer: WebGLRenderer): Controller | undefined {
  return renderers.get(renderer)?.controller;
}
