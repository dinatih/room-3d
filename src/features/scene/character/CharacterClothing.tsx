/**
 * CharacterClothing.tsx — Charge un vêtement GLB sur mesure pour Lara
 * et lie chaque SkinnedMesh aux os vivants de son squelette Three.js.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { LAYER_WALKER } from '@config';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';
import {
  type LaraClothing,
  type LaraExtraClothingId,
  type LaraHoodieZip,
  resolveLaraGarmentGlbPath,
} from './laraOutfits';

export type CustomLaraClothingId = LaraClothing | LaraExtraClothingId;

interface CharacterClothingProps {
  clothingId: CustomLaraClothingId;
  hoodieZip?: LaraHoodieZip;
  laraScene: THREE.Object3D;
  shadows: boolean;
  showWallhack: boolean;
  wireframe: boolean;
  visible?: boolean;
  bottomId?: LaraClothing;
}

export function CharacterClothing({
  clothingId,
  hoodieZip = 'closed',
  laraScene,
  shadows,
  showWallhack,
  wireframe,
  visible = true,
  bottomId,
}: CharacterClothingProps) {
  const modelPath = resolveLaraGarmentGlbPath(clothingId, hoodieZip);
  if (!modelPath) {
    throw new Error(`No GLB path registered for Lara clothing "${clothingId}"`);
  }
  const { scene: garmentScene } = useGLTFClone(modelPath, true);
  const containerName = `lara_custom_clothing_${clothingId}`;

  useLayoutEffect(() => {
    if (!garmentScene || !laraScene) return;

    const laraBonesByName = new Map<string, THREE.Bone>();
    laraScene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone && obj.name) {
        laraBonesByName.set(obj.name, obj as THREE.Bone);
        const originalName = obj.userData?.originalBoneName;
        if (typeof originalName === 'string' && originalName) {
          laraBonesByName.set(originalName, obj as THREE.Bone);
        }
      }
    });

    const targetParent = laraScene.getObjectByName('Armature') ?? laraScene;
    const container = new THREE.Group();
    container.name = containerName;
    container.userData.isCustomClothingRoot = true;
    container.visible = visible;

    const garmentArmature = garmentScene.getObjectByName('Armature') ?? garmentScene;
    const attachments = garmentArmature.children.filter(
      (child) => !(child as THREE.Bone).isBone,
    );

    const boundSkeletons = new Map<THREE.Skeleton, THREE.Skeleton>();
    const createdSkeletons: THREE.Skeleton[] = [];

    for (const attachment of attachments) {
      attachment.traverse((node) => {
        if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
          const skinned = node as THREE.SkinnedMesh;
          const oldSkeleton = skinned.skeleton;
          let bound = boundSkeletons.get(oldSkeleton);
          if (!bound) {
            const mappedBones = oldSkeleton.bones.map((bone) => {
              const target = laraBonesByName.get(bone.name);
              if (!target) {
                throw new Error(`Missing bone "${bone.name}" on Lara armature for clothing "${clothingId}"`);
              }
              return target;
            });
            bound = new THREE.Skeleton(
              mappedBones,
              oldSkeleton.boneInverses.map((inv) => inv.clone()),
            );
            boundSkeletons.set(oldSkeleton, bound);
            createdSkeletons.push(bound);
          }
          skinned.bind(bound, skinned.bindMatrix.clone());
          skinned.frustumCulled = true;
          enableAnimatedFrustumCulling(skinned);
        }

        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.userData.isCustomClothing = true;
          mesh.layers.set(LAYER_WALKER);
          mesh.castShadow = shadows;
          mesh.receiveShadow = shadows;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            if (!mat) continue;
            mat.depthTest = !showWallhack;
            mat.depthWrite = showWallhack ? false : !mat.transparent;
            if ('wireframe' in mat) {
              (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
            }
          }
        }
      });

      container.add(attachment);
    }

    targetParent.add(container);

    return () => {
      targetParent.remove(container);
      for (const attachment of attachments) {
        container.remove(attachment);
        garmentArmature.add(attachment);
      }
      for (const skel of createdSkeletons) {
        skel.dispose();
      }
    };
  }, [garmentScene, laraScene, clothingId, containerName, visible]);

  // Mettre à jour les propriétés de rendu (ombres, wallhack, wireframe) sans ré-attacher le squelette
  useLayoutEffect(() => {
    const container = laraScene.getObjectByName(containerName);
    if (!container) return;
    container.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          if (!mat) continue;
          mat.depthTest = !showWallhack;
          mat.depthWrite = showWallhack ? false : !mat.transparent;
          if ('wireframe' in mat) {
            (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
          }
        }
      }
    });
  }, [laraScene, containerName, shadows, showWallhack, wireframe]);

  // Covered fabric is omitted under the native short, whose source surface
  // intersects the reconstructed body underneath the waistband.
  useLayoutEffect(() => {
    if (clothingId !== 'body-native-green') return;
    const gusset = laraScene.getObjectByName(containerName)?.getObjectByName('native_body_gusset');
    if (!gusset) throw new Error('Native green body is missing its gusset section');
    gusset.visible = bottomId !== 'native';
  }, [laraScene, garmentScene, containerName, clothingId, bottomId, visible]);

  // Libérer uniquement les matériaux clonés par ownMaterials=true au démontage
  useLayoutEffect(() => {
    return () => {
      if (!garmentScene) return;
      garmentScene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) mat?.dispose();
      });
    };
  }, [garmentScene]);

  return null;
}
