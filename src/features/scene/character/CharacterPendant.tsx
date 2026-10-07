import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { LAYER_WALKER } from '@config';
import { getPendantResources } from '../items/DoubleVenusPendant';

export interface CharacterPendantHandle {
  update: (delta: number, reset: boolean) => void;
}

interface Props {
  neck: THREE.Bone | null;
  scene: THREE.Object3D;
  torso: THREE.Mesh[];
  visible: boolean;
  shadows: boolean;
  resetKey: string;
}

// Lara's native mesh is in metres. Measurements at Y=1.476m:
// neck X=[-.036,.041], Z=[-.049,.029]; lower-neck bone Y=1.456m.
// Cord diameter 1mm; bail contact Y=3.86cm, centre of mass Y=1.96cm.
const CORD_RADIUS = 0.0005;
const BAIL_Y = 3.86;
const COM_Y = 1.96;
const LENGTH = BAIL_Y - COM_Y;
const DOWN = new THREE.Vector3(0, -1, 0);

export const CharacterPendant = forwardRef<CharacterPendantHandle, Props>(function CharacterPendant(
  { neck, scene, torso, visible, shadows, resetKey }, ref,
) {
  if (!neck) throw new Error('Lara pendant requires a neck bone');
  const rig = useMemo(() => {
    const root = new THREE.Group();
    root.name = 'lara_necklace';
    // Rest-world orientation is captured before animation / character scaling.
    const restWorld = (neck as THREE.Bone & { restWorldQuaternion: THREE.Quaternion }).restWorldQuaternion;
    root.quaternion.copy(restWorld).invert();
    const points = Array.from({ length: 65 }, (_, i) => {
      const angle = i / 64 * Math.PI * 2;
      return new THREE.Vector3(.0025 + .0395 * Math.sin(angle), .020,
        -.010 + .0405 * Math.cos(angle));
    });
    const cordGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 64, CORD_RADIUS, 6, true);
    const cordMaterial = new THREE.MeshStandardMaterial({ color: '#b80719', roughness: .8 });
    const cord = new THREE.Mesh(cordGeometry, cordMaterial);
    cord.name = 'lara_red_elastic_cord';
    root.add(cord);
    const pendant = new THREE.Group();
    pendant.name = 'lara_double_venus_pendant';
    pendant.scale.setScalar(.01);
    const resources = getPendantResources();
    for (const geometry of [resources.body, resources.bail]) {
      const mesh = new THREE.Mesh(geometry, resources.steel);
      mesh.userData.isPendant = true;
      mesh.position.y = -BAIL_Y;
      pendant.add(mesh);
    }
    root.add(pendant);
    root.traverse(obj => { obj.layers.set(LAYER_WALKER); });
    const anchorLocal = new THREE.Vector3(.0025, .020, .0305);
    const anchor = new THREE.Vector3();
    const centre = new THREE.Vector3();
    const velocity = new THREE.Vector3();
    const lastAnchor = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const localCentre = new THREE.Vector3();
    const frame = new THREE.Matrix4();
    const ray = new THREE.Raycaster();
    const hits: THREE.Intersection[] = [];
    const scale = new THREE.Vector3();
    let initialized = false;
    function update(delta: number, reset: boolean) {
      root.updateWorldMatrix(true, false);
      root.localToWorld(anchor.copy(anchorLocal));
      root.getWorldScale(scale);
      const worldLength = LENGTH * .01 * scale.x;
      forward.set(0, 0, 1).transformDirection(root.matrixWorld);
      side.set(1, 0, 0).transformDirection(root.matrixWorld);
      if (initialized && !reset && delta === 0 && anchor.equals(lastAnchor)) return;
      // A jump larger than the complete character is a placement discontinuity.
      const teleported = initialized && anchor.distanceTo(lastAnchor) > 1.734 * scale.x;
      if (!initialized || reset || teleported) {
        centre.copy(anchor).addScaledVector(DOWN, worldLength);
        velocity.set(0, 0, 0);
        initialized = true;
      } else if (delta > 0) {
        // Fixed substeps keep the constraint stable across playback speeds / frame rates.
        const steps = Math.ceil(delta / (1 / 120));
        const dt = delta / steps;
        for (let i = 0; i < steps; i++) {
          velocity.y -= 9.81 * scale.x * dt;
          velocity.multiplyScalar(Math.exp(-4 * dt)); // metal against an elastic cord
          centre.addScaledVector(velocity, dt);
          direction.subVectors(centre, anchor).normalize();
          centre.copy(anchor).addScaledVector(direction, worldLength);
          velocity.addScaledVector(direction, -velocity.dot(direction));
        }
      } else if (!anchor.equals(lastAnchor)) {
        // Scrubbing while paused changes pose without injecting kinetic energy.
        centre.copy(anchor).addScaledVector(DOWN, worldLength);
        velocity.set(0, 0, 0);
      }
      // Contact uses the actual animated skin/clothing, rather than a guessed torso volume.
      // Check centre and lower crossbar; lift away from the surface by metal thickness.
      for (const fraction of [1, BAIL_Y / LENGTH]) {
        direction.subVectors(centre, anchor).normalize();
        tmp.copy(anchor).addScaledVector(direction, worldLength * fraction);
        ray.ray.origin.copy(tmp).addScaledVector(forward, .10 * scale.x);
        ray.ray.direction.copy(forward).negate();
        ray.near = 0;
        ray.far = .10 * scale.x + .0021 * scale.x;
        hits.length = 0;
        for (const mesh of torso) {
          if (mesh.visible) {
            mesh.updateWorldMatrix(true, false);
            (mesh as THREE.SkinnedMesh).skeleton?.update();
            mesh.raycast(ray, hits);
          }
        }
        hits.sort((a, b) => a.distance - b.distance);
        if (hits.length) {
          const depth = .10 * scale.x - hits[0].distance + .0021 * scale.x;
          if (depth > 0) {
            direction.subVectors(centre, anchor);
            const frontDistance = direction.dot(forward) + depth / fraction;
            direction.addScaledVector(forward, -direction.dot(forward));
            const contactLength = Math.max(worldLength, frontDistance);
            direction.setLength(Math.sqrt(contactLength * contactLength - frontDistance * frontDistance));
            centre.copy(anchor).add(direction).addScaledVector(forward, frontDistance);
            const intoSkin = velocity.dot(forward);
            if (intoSkin < 0) velocity.addScaledVector(forward, -intoSkin);
          }
        }
      }
      direction.subVectors(centre, anchor).normalize();
      root.worldToLocal(localCentre.copy(anchor));
      pendant.position.copy(localCentre);
      tmp.copy(anchor).add(direction);
      root.worldToLocal(tmp).sub(localCentre).normalize().negate();
      // Keep the symbols facing forward while the body swings around its bail.
      const x = side.set(1, 0, 0).cross(tmp).cross(tmp).negate().normalize();
      const z = forward.crossVectors(x, tmp).normalize();
      frame.makeBasis(x, tmp, z);
      pendant.quaternion.setFromRotationMatrix(frame);
      lastAnchor.copy(anchor);
    }
    return { root, cordGeometry, cordMaterial, update, reset: () => { initialized = false; } };
  }, [neck, scene]);

  useImperativeHandle(ref, () => ({ update: rig.update }), [rig]);
  useLayoutEffect(() => {
    neck.add(rig.root);
    rig.reset();
    return () => { neck.remove(rig.root); };
  }, [neck, rig, resetKey]);
  useLayoutEffect(() => {
    rig.root.visible = visible;
    rig.reset();
    rig.root.traverse(obj => {
      if (obj instanceof THREE.Mesh) obj.castShadow = obj.receiveShadow = shadows;
    });
  }, [rig, visible, shadows]);
  useLayoutEffect(() => () => {
    rig.cordGeometry.dispose();
    rig.cordMaterial.dispose();
  }, [rig]);
  return null;
});
