import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useHelper } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import type { SceneItemProps } from '@shared/types';

const GLB_PATH = '/characters/inyeong/nitro_anim_inyeong.glb';

export function NitroInyeong({
  showSkeletonPreview = false,
  onSize,
}: Partial<SceneItemProps> & {
  showSkeletonPreview?: boolean;
}) {
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate } = useThree();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group>(null);

  useHelper(showSkeletonPreview ? (modelRef as any) : null, THREE.SkeletonHelper);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    // Supprime tout mesh parasite (ex: Icosphere d'importation Blender)
    const toRemove: THREE.Object3D[] = [];
    scene.traverse(child => {
      if (child.name.toLowerCase().includes('cosphere')) {
        toRemove.push(child);
      }
    });
    toRemove.forEach(c => c.removeFromParent());

    scene.updateMatrixWorld(true);
    const rawBox = glbLocalBBox(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());

    // Taille humaine standard (~165 cm)
    const targetHeight = 165;
    const scaleFactor = rawSize.y > 0 ? targetHeight / rawSize.y : 1;
    scene.scale.setScalar(scaleFactor);

    scene.updateMatrixWorld(true);
    const scaledBox = glbLocalBBox(scene);
    scene.position.set(0, -scaledBox.min.y, 0);

    const finalSize = new THREE.Vector3(
      rawSize.x * scaleFactor,
      targetHeight,
      rawSize.z * scaleFactor
    );
    onSize?.(finalSize);

    scene.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
        if (mesh.geometry.boundingSphere) {
          mesh.geometry.boundingSphere.radius = Math.max(mesh.geometry.boundingSphere.radius * 2, 100);
        }
      }

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(mat => {
        if (!mat) return;
        const name = (mat.name || '').toLowerCase();
        if (name.includes('glass')) {
          mat.transparent = true;
          mat.opacity = 0.5;
          mat.depthWrite = false;
        } else if (name.includes('hair') || name.includes('eyelash')) {
          mat.transparent = false;
          (mat as any).alphaTest = 0.5;
          mat.depthWrite = true;
        } else {
          mat.transparent = false;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      });
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      const clip = animations[0];
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
    }

    invalidate();

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
    };
  }, [scene, animations, invalidate, onSize]);

  useFrame((_, delta) => {
    if (!mixerRef.current || animations.length === 0) return;
    const clip = animations[0];
    if (clip && clip.duration > 0) {
      const store = useAnimPreviewStore.getState();
      store.setClipInfo(`Inyeong ${clip.name}`, clip.duration, false);
      const action = mixerRef.current.clipAction(clip);
      const animDelta = delta * (store.speed || 1);
      if (store.isPlaying && !store.isScrubbing) {
        action.paused = false;
        mixerRef.current.update(animDelta);
        store.setCurrentTime(action.time % clip.duration);
      } else {
        action.setEffectiveWeight(1);
        (action as any)._fadeDuration = 0;
        (action as any)._weight = 1;
        action.time = store.currentTime;
        mixerRef.current.update(0);
      }
    }
    invalidate();
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
