import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/ninja-sp101/ninja-sp101-animated.glb';
export const NINJA_DOOR_DURATION = 0.8;
const LIGHT_FADE_DURATION = 0.25;

export function NinjaSP101({ actionState, onSize, isPreview = false }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const wantRack = !!actionState['ninja-rack'];
  const wantDoor = !!actionState.ninja || wantRack;
  const lightOn = !!actionState['ninja-light'];
  const paused = isPreview && !!actionState.previewPaused;
  const { invalidate } = useThree();
  const runtime = useRef<{
    mixer: THREE.AnimationMixer;
    door: THREE.AnimationAction;
    rack: THREE.AnimationAction;
    light: THREE.PointLight;
    material: THREE.MeshStandardMaterial;
    intensity: number;
    lightTime: number;
  } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    const mixer = new THREE.AnimationMixer(scene);
    const action = (name: string) => {
      const clip = animations.find(animation => animation.name === name);
      if (!clip) throw new Error(`Ninja SP101: missing animation ${name}`);
      const result = mixer.clipAction(clip).play();
      result.paused = true;
      return result;
    };
    const door = action('door_open');
    const rack = action('rack_slide');
    mixer.update(0);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = {
      label: 'Mini four Ninja SP101EU',
      actions: [...getObjectActionIds('ninja-sp101'), ...(!isPreview ? ['smart-object:::cuisine-group:::cook-oven'] : [])],
    };
    const anchor = scene.getObjectByName('NinjaLampAnchor');
    const bulb = scene.getObjectByName('NinjaLampBulb') as THREE.Mesh;
    if (!anchor || !bulb?.isMesh) throw new Error('Ninja SP101: missing interior lamp');
    const material = bulb.material as THREE.MeshStandardMaterial;
    material.emissive.set('#ffd391');
    material.emissiveIntensity = 0;
    const light = new THREE.PointLight('#ffe0a6', 0, 0, 2);
    light.name = 'NinjaInteriorLight';
    light.castShadow = true;
    light.layers.enableAll();
    light.shadow.camera.layers.enableAll();
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = box.getSize(new THREE.Vector3()).length();
    light.shadow.mapSize.set(512, 512);
    light.shadow.normalBias = 0.05;
    anchor.add(light);
    scene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh !== bulb;
      mesh.receiveShadow = true;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        material.shadowSide = THREE.DoubleSide;
      }
    });
    runtime.current = { mixer, door, rack, light, material, intensity: anchor.userData.lumens / (4 * Math.PI) * 100 ** 2, lightTime: 0 };
    invalidate();
    onSize(box.getSize(new THREE.Vector3()));
    return () => {
      runtime.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      anchor.remove(light);
      light.dispose();
    };
  }, [scene, animations, isPreview, invalidate, onSize]);

  useEffect(() => { invalidate(); }, [wantDoor, wantRack, lightOn, paused, invalidate]);

  useFrame((_, delta) => {
    const r = runtime.current;
    if (!r || paused) return;
    const advance = (time: number, end: number) => time < end ? Math.min(end, time + delta) : Math.max(end, time - delta);
    const doorEnd = wantDoor ? r.door.getClip().duration : 0;
    const rackEnd = wantRack ? r.rack.getClip().duration : 0;
    // Retract the rack before closing; open the door fully before extending it.
    if (!wantRack && r.rack.time > 0) r.rack.time = advance(r.rack.time, 0);
    else if (r.door.time !== doorEnd) r.door.time = advance(r.door.time, doorEnd);
    else if (r.rack.time !== rackEnd) r.rack.time = advance(r.rack.time, rackEnd);
    r.mixer.update(0);
    const lightEnd = lightOn ? LIGHT_FADE_DURATION : 0;
    r.lightTime = advance(r.lightTime, lightEnd);
    const brightness = r.lightTime / LIGHT_FADE_DURATION;
    r.light.intensity = r.intensity * brightness;
    r.material.emissiveIntensity = 3 * brightness;
    if (r.door.time !== doorEnd || r.rack.time !== rackEnd || r.lightTime !== lightEnd) invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
