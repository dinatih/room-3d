import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '../glbUtils';

export interface HeartParachuteHandle {
  update: (delta: number) => void;
}

interface HeartParachuteProps {
  visible: boolean;
  attachTo: THREE.Bone | null;
  paused: boolean;
}

const UP = new THREE.Vector3(0, 1, 0);
const SUSPENSION_HEIGHT = 120; // cm au-dessus du torse
const DEPLOYMENT_SECONDS = 0.65;
const SWAY_PERIOD_SECONDS = 3;
const SWAY_ANGLE = THREE.MathUtils.degToRad(6);

export const HeartParachute = forwardRef<HeartParachuteHandle, HeartParachuteProps>(
  function HeartParachute({ visible, attachTo, paused }, ref) {
    const rootRef = useRef<THREE.Group>(null!);
    const canopyRef = useRef<THREE.Group>(null!);
    const ropesRef = useRef<THREE.Mesh[]>([]);
    const elapsed = useRef(0);
    const { scene } = useGLTFClone('/items/famnig27470460/Famnig27470460.glb');
    const anchors = useMemo(() => Array.from({ length: 1 }, () => new THREE.Vector3()), []);
    const scratch = useMemo(() => ({
      attachment: new THREE.Vector3(),
      start: new THREE.Vector3(), end: new THREE.Vector3(), direction: new THREE.Vector3(),
    }), []);

    useLayoutEffect(() => {
      removeGlbLines(scene);
      scene.scale.setScalar(100);
      mergeGlbByMaterial(scene);
      const box = glbLocalBBox(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      scene.position.copy(center).negate();
      const attachmentSurface = scene.clone(true);
      attachmentSurface.updateMatrixWorld(true);
      // Intersection avec le tissu réel : la boîte seule inclurait les vides du cœur.
      const ray = new THREE.Raycaster();
      anchors.forEach((anchor, index) => {
        ray.set(
          new THREE.Vector3(0, 0, size.z),
          new THREE.Vector3(0, 0, -1),
        );
        const hit = ray.intersectObject(attachmentSurface, true)[0];
        if (!hit) throw new Error(`Point d'attache ${index} absent du coussin cœur`);
        anchor.copy(hit.point);
      });
    }, [scene, anchors]);

    useLayoutEffect(() => {
      elapsed.current = 0;
    }, [visible]);

    useImperativeHandle(ref, () => ({
      update(delta) {
        if (!visible) return;
        if (!attachTo) throw new Error('Os du torse absent pour attacher le parachute');
        if (!paused) elapsed.current += delta;
        const root = rootRef.current;
        const canopy = canopyRef.current;
        // Appelé après le mixer du personnage pour éviter un retard d'une image.
        attachTo.getWorldPosition(scratch.attachment);
        root.worldToLocal(scratch.attachment);
        const deployment = THREE.MathUtils.smoothstep(elapsed.current, 0, DEPLOYMENT_SECONDS);
        const phase = elapsed.current * Math.PI * 2 / SWAY_PERIOD_SECONDS;
        const roll = Math.sin(phase) * SWAY_ANGLE * deployment;
        const pitch = Math.sin(phase * 0.5) * SWAY_ANGLE * 0.5 * deployment;
        canopy.position.copy(scratch.attachment);
        canopy.position.x += Math.sin(roll) * SUSPENSION_HEIGHT;
        canopy.position.y += SUSPENSION_HEIGHT * (0.6 + 0.4 * deployment);
        canopy.position.z += Math.sin(pitch) * SUSPENSION_HEIGHT;
        canopy.rotation.set(Math.PI / 2 + pitch, 0, roll);
        canopy.scale.setScalar(0.3 + 0.7 * deployment);
        canopy.updateWorldMatrix(true, false);
        anchors.forEach((anchor, index) => {
          const rope = ropesRef.current[index];
          scratch.start.copy(scratch.attachment);
          scratch.end.copy(anchor);
          canopy.localToWorld(scratch.end);
          root.worldToLocal(scratch.end);
          scratch.direction.subVectors(scratch.end, scratch.start);
          rope.position.addVectors(scratch.start, scratch.end).multiplyScalar(0.5);
          rope.scale.y = scratch.direction.length();
          rope.quaternion.setFromUnitVectors(UP, scratch.direction.normalize());
        });
      },
    }), [visible, paused, attachTo, anchors, scratch]);

    return (
      <group ref={rootRef} visible={visible} name="Parachute Coeur" userData={{ itemName: 'Parachute Coeur' }}>
        {anchors.map((_, index) => (
          <mesh key={index} ref={mesh => { if (mesh) ropesRef.current[index] = mesh; }} frustumCulled={false}>
            <cylinderGeometry args={[0.25, 0.25, 1, 8]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.9} />
          </mesh>
        ))}
        <group ref={canopyRef} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={scene} />
        </group>
      </group>
    );
  },
);
