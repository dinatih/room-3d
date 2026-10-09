/** LAGAN: right-hand door, sliding crisper and automatic interior bulb. */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/lagan_anim/LAGAN_anim.glb';

export function Fridge({ actionState, onSize, isPreview = false }: SceneItemProps & { isPreview?: boolean }) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const sceneOpen = useSceneStore(s => s.furniture.fridge);
  const sceneCrisper = useSceneStore(s => s.extraStates['fridge-crisper-toggle']);
  const wantCrisper = isPreview ? !!actionState['fridge-crisper-toggle'] : sceneCrisper;
  const wantDoor = (isPreview ? !!actionState['fridge-toggle'] : sceneOpen) || wantCrisper;
  const target = useRef({ door: false, crisper: false });
  target.current = { door: wantDoor, crisper: wantCrisper };
  const runtime = useRef<{
    mixer: THREE.AnimationMixer;
    door: THREE.AnimationAction;
    crisper: THREE.AnimationAction;
    bulb: THREE.PointLight;
    lampMaterial: THREE.MeshStandardMaterial;
    intensity: number;
  } | null>(null);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    removeGlbLines(scene);
    const mixer = new THREE.AnimationMixer(scene);
    const action = (name: string) => {
      const clip = animations.find(c => c.name === name);
      if (!clip) throw new Error(`LAGAN: missing animation ${name}`);
      const result = mixer.clipAction(clip);
      result.play();
      // Sample both clips explicitly for sequencing and reversal at endpoints.
      result.paused = true;
      return result;
    };
    const door = action('door_open');
    const crisper = action('crisper_slide');
    mixer.update(0);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI;
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.skipMerge = true;
    scene.userData.hoverAction = { label: 'Réfrigérateur LAGAN', actions: ['fridge', 'fridge-crisper-toggle'] };
    const anchor = scene.getObjectByName('LampAnchor');
    const lamp = scene.getObjectByName('lamp') as THREE.Mesh | undefined;
    if (!anchor || !lamp?.isMesh) throw new Error('LAGAN: missing bulb housing or light anchor');
    const originalMaterial = lamp.material as THREE.MeshStandardMaterial;
    const lampMaterial = originalMaterial.clone();
    lampMaterial.emissive.set('#fff1d6');
    lampMaterial.emissiveIntensity = 0;
    lamp.material = lampMaterial;
    // 5 W bulb, approximately 45 lm. Convert candela from metres to centimetres.
    const intensity = anchor.userData.powerWatts * 9 / (4 * Math.PI) * 100 ** 2;
    const bulb = new THREE.PointLight('#fff1d6', 0, 0, 2);
    bulb.name = 'FridgeInteriorLight';
    bulb.castShadow = true;
    bulb.layers.enableAll();
    bulb.shadow.camera.layers.enableAll();
    bulb.shadow.camera.near = 0.1;
    bulb.shadow.camera.far = box.getSize(new THREE.Vector3()).length();
    bulb.shadow.mapSize.set(512, 512);
    bulb.shadow.normalBias = 0.05; // Half a millimetre in scene centimetres.
    bulb.shadow.bias = -0.1 / bulb.shadow.camera.far; // 1 mm depth offset prevents self-shadow acne.
    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    anchor.add(bulb);
    runtime.current = { mixer, door, crisper, bulb, lampMaterial, intensity };
    onSize(box.getSize(new THREE.Vector3()));
    invalidate();
    return () => {
      runtime.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      anchor.remove(bulb);
      bulb.dispose();
      lamp.material = originalMaterial;
      lampMaterial.dispose();
    };
  }, [scene, animations, invalidate]);

  useEffect(() => { invalidate(); }, [wantDoor, wantCrisper, invalidate]);

  useFrame((_, delta) => {
    const r = runtime.current;
    if (!r) return;
    const desired = target.current;
    const doorEnd = desired.door ? r.door.getClip().duration : 0;
    const drawerEnd = desired.crisper ? r.crisper.getClip().duration : 0;
    const move = (a: THREE.AnimationAction, end: number) => {
      a.time = a.time < end ? Math.min(end, a.time + delta) : Math.max(end, a.time - delta);
    };
    if (!desired.crisper && r.crisper.time > 0) move(r.crisper, 0);
    else if (r.door.time !== doorEnd) move(r.door, doorEnd);
    else if (r.crisper.time !== drawerEnd) move(r.crisper, drawerEnd);
    r.mixer.update(0);
    const lit = desired.door || r.door.time > 0;
    r.bulb.intensity = lit ? r.intensity : 0;
    r.lampMaterial.emissiveIntensity = lit ? 1 : 0;
    if (r.door.time !== doorEnd || r.crisper.time !== drawerEnd) invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
