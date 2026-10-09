import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraState } from '../cameraState';
import { LAYER_WALKER_DETAIL } from '@config';

/** Publie la pose du regard après l'animation, sans intervenir dans l'IA. */
export function useAnimalCamera(
  id: string, root: RefObject<THREE.Group>, scene: THREE.Object3D, preview: boolean,
  headName: string, mouthName: string, eyeNames?: [string, string],
) {
  const rig = useRef<{ head: THREE.Object3D; mouth: THREE.Object3D; eyes: THREE.Object3D[]; radius: number } | null>(null);
  const meshes = useRef(new Map<THREE.Mesh, number>());
  const eyes = useRef(new THREE.Vector3());
  const otherEye = useRef(new THREE.Vector3());
  const head = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  useLayoutEffect(() => {
    if (preview) return;
    const bone = (name: string) => {
      const object = scene.getObjectByName(name);
      if (!object) throw new Error(`Caméra ${id} : os manquant ${name}`);
      return object;
    };
    const radius = new THREE.Box3().setFromObject(root.current!, true).getSize(new THREE.Vector3()).length() / 2;
    if (radius <= 0) throw new Error(`Caméra ${id} : dimensions invalides`);
    rig.current = { head: bone(headName), mouth: bone(mouthName), eyes: eyeNames ? eyeNames.map(bone) : [], radius };
    return () => {
      delete cameraState.animalViews[id];
      if (cameraState.animalTarget === id) cameraState.animalTarget = null;
      meshes.current.forEach((mask, mesh) => { mesh.layers.mask = mask; });
      meshes.current.clear();
    };
  }, [id, root, scene, preview, headName, mouthName]);
  useFrame(() => {
    if (preview || !rig.current || !root.current) return;
    const r = rig.current;
    r.head.getWorldPosition(head.current);
    r.mouth.getWorldPosition(forward.current);
    forward.current.sub(head.current).normalize();
    if (r.eyes.length) {
      r.eyes[0].getWorldPosition(eyes.current);
      r.eyes[1].getWorldPosition(otherEye.current);
      eyes.current.add(otherEye.current).multiplyScalar(0.5);
    } else {
      // Le chien n'a pas d'os d'yeux : point de vue attaché à sa tête animée.
      eyes.current.copy(head.current);
    }
    if (root.current.visible) {
      cameraState.animalViews[id] = { eyes: { ...eyes.current }, forward: { ...forward.current }, radius: r.radius };
    } else delete cameraState.animalViews[id];
    if (cameraState.animalTarget === id && cameraState.mode === 'fpv') {
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh || meshes.current.has(mesh)) return;
        meshes.current.set(mesh, mesh.layers.mask);
        mesh.layers.set(LAYER_WALKER_DETAIL);
      });
    } else if (meshes.current.size) {
      meshes.current.forEach((mask, mesh) => { mesh.layers.mask = mask; });
      meshes.current.clear();
    }
  });
}
