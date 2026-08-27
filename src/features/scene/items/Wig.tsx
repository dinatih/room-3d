import { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { LAYER_WALKER } from '@config';

export const HAIR_COLORS: Record<string, THREE.Color> = {
  naturel:  new THREE.Color(0.4, 0.25, 0.1),
  noir:     new THREE.Color(0.05, 0.03, 0.03),
  brun:     new THREE.Color(0.25, 0.12, 0.05),
  chatain:  new THREE.Color(0.35, 0.18, 0.07),
  blond:    new THREE.Color(0.85, 0.7,  0.3),
  roux:     new THREE.Color(0.7,  0.2,  0.05),
  rouge:    new THREE.Color(0.8,  0.05, 0.05),
  blanc:    new THREE.Color(0.95, 0.95, 0.95),
  bleu:     new THREE.Color(0.05, 0.2,  0.9),
  vert:     new THREE.Color(0.05, 0.7,  0.15),
  rose:     new THREE.Color(0.95, 0.3,  0.65),
  violet:   new THREE.Color(0.5,  0.05, 0.9),
};

export interface WigBone {
  bone: THREE.Bone;
  restQ: THREE.Quaternion;
  index: number;
}

export interface WigProps {
  id: string | number;
  color?: string; // e.g. "brun", "arc-en-ciel", ou undefined
  offset?: [number, number, number];
  scale?: number;
  windEnabled?: boolean;
  onBonesExtracted?: (bones: { bone: THREE.Bone; restQ: THREE.Quaternion; index: number }[]) => void;
  attachTo?: THREE.Object3D | null;
}

function disposeOwnedWigMaterials(root: THREE.Object3D) {
  root.traverse((node: any) => {
    if (!node.isMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material: THREE.Material) => {
      if (material.userData.__ownedWigMaterial) material.dispose();
    });
  });
}

export function Wig({ id, color, offset = [0, 0, 0], scale = 1, windEnabled = false, onBonesExtracted, attachTo }: WigProps) {
  const { scene: fullScene } = useGLTF('characters/wigs/hair_pack_part_2.glb');
  const clonedHairRef = useRef<THREE.Group>(null!);
  
  const scene = useMemo(() => {
    // Parse ID and map to 100 series (e.g. "2" -> "102")
    const numId = typeof id === 'string' ? parseInt(id.replace('hair_', ''), 10) : id;
    const gltfId = isNaN(numId) ? id : (numId < 100 ? 100 + numId : numId);

    // Clone the ENTIRE scene to ensure SkinnedMesh binds perfectly to the bones
    const clonedFullScene = SkeletonUtils.clone(fullScene) as THREE.Group;
    
    // FIX: SkeletonUtils.clone often fails to bind the skeleton correctly when portaling.
    // We must manually re-bind all SkinnedMeshes to their cloned bones.
    const clonedBones: { [name: string]: THREE.Bone } = {};
    clonedFullScene.traverse(child => {
      if ((child as THREE.Bone).isBone) {
        clonedBones[child.name] = child as THREE.Bone;
      }
    });

    clonedFullScene.traverse(child => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        sm.userData.itemName = `Perruque (${gltfId})`;
        // Reconstruct the skeleton using the cloned bones instead of the originals
        const newBones = sm.skeleton.bones.map(b => clonedBones[b.name] || b);
        const newSkeleton = new THREE.Skeleton(newBones, sm.skeleton.boneInverses);
        sm.bind(newSkeleton, sm.bindMatrix);
      } else if ((child as THREE.Mesh).isMesh) {
        child.userData.itemName = `Perruque (${gltfId})`;
      }
    });


    
    let sg: THREE.Object3D | null = null;
    clonedFullScene.traverse(child => {
      if (!sg && child.name.startsWith(`Hair${gltfId}_ARM_`)) sg = child as THREE.Object3D;
    });

    if (!sg) return new THREE.Group();
    
    let hairHeadBone: THREE.Object3D | null = null;
    (sg as THREE.Object3D).traverse((c: any) => {
      const nLower = c.name.toLowerCase();
      if ((nLower.startsWith('bip_head') || nLower === 'head') && !hairHeadBone) {
        hairHeadBone = c;
      }
    });

    const s = 1.4;
    
    if (hairHeadBone) {
      (sg as THREE.Object3D).updateMatrixWorld(true);
      const headPos = (hairHeadBone as THREE.Object3D).position.clone();
      (sg as THREE.Object3D).position.set(
        -headPos.x * s * scale,
        -headPos.y * s * scale + (attachTo ? 0.07 : 0),
        -headPos.z * s * scale
      );
    } else {
      (sg as THREE.Object3D).position.set(0, 0.15 * scale, 0);
    }

    // Apply the user requested scale DIRECTLY to sg instead of the wrapper group
    (sg as THREE.Object3D).scale.set(s * scale, s * scale, s * scale);
    (sg as THREE.Object3D).userData.isWigRoot = true;

    // Fix SkeletonHelper by reparenting the root bone to sg so it inherits the correct world transform
    let rootBone: THREE.Bone | null = null;
    clonedFullScene.traverse(child => {
      if ((child as THREE.Bone).isBone && !rootBone) {
        let p = child;
        while (p.parent && (p.parent as THREE.Bone).isBone) {
          p = p.parent as THREE.Bone;
        }
        rootBone = p as THREE.Bone;
      }
    });

    if (rootBone && (rootBone as THREE.Bone).parent !== sg) {
      (sg as THREE.Object3D).add(rootBone as THREE.Bone);
    }

    return (sg as THREE.Object3D);
  }, [fullScene, id, scale]);

  const hairBonesRef = useRef<WigBone[]>([]);
  
  useLayoutEffect(() => {
    if (!scene) return;

    // 1. Extraire les os pour l'animation/physique et configurer les matériaux
    const extractedBones: WigBone[] = [];
    scene.traverse((child: any) => {
      child.frustumCulled = true;
      if (child.geometry) {
        child.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
      }
      
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        if (!(window as any)._skinLogged2) {
          console.log("[Wig] SkinnedMesh found:", sm.name, "with", sm.skeleton.bones.length, "bones.");
          (window as any)._skinLogged2 = true;
        }
        // Extract bones DIRECTLY from the SkinnedMesh's skeleton!
        if (extractedBones.length === 0) {
          const isRootOrScalp = (n: string) => n.toLowerCase().includes('root') || n.toLowerCase().includes('spine') || n.toLowerCase().includes('neck') || n.toLowerCase().includes('head');
          sm.skeleton.bones.forEach(b => {
            if (!isRootOrScalp(b.name)) {
              extractedBones.push({
                bone: b,
                restQ: b.quaternion.clone(),
                index: extractedBones.length
              });
            }
          });
        }
      }
      
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        m.renderOrder = 1;
        m.userData.isCustomHair = true;
        m.userData.isHeadPart = true;
        m.layers.set(LAYER_WALKER);
        
        const targetColor = color && HAIR_COLORS[color] ? HAIR_COLORS[color] : null;

        if (Array.isArray(m.material)) {
          m.material = m.material.map((_mat: any) => {
            if (!_mat) return _mat;
            const clonedMat = _mat.clone();
            clonedMat.userData.__ownedWigMaterial = true;
            clonedMat.side = THREE.DoubleSide;
            clonedMat.transparent = false;
            clonedMat.opacity = 1;
            clonedMat.alphaTest = 0.5;
            clonedMat.depthWrite = true;
            if (targetColor && 'color' in clonedMat) (clonedMat as any).color.copy(targetColor);
            clonedMat.needsUpdate = true;
            return clonedMat;
          });
        } else if (m.material) {
          const clonedMat = (m.material as THREE.Material).clone();
          clonedMat.userData.__ownedWigMaterial = true;
          clonedMat.side = THREE.DoubleSide;
          clonedMat.transparent = false;
          clonedMat.opacity = 1;
          clonedMat.alphaTest = 0.5;
          clonedMat.depthWrite = true;
          if (targetColor && 'color' in clonedMat) (clonedMat as any).color.copy(targetColor);
          clonedMat.needsUpdate = true;
          m.material = clonedMat;
        }
      }

      if ((child as any).isBone) {
        const b = child as THREE.Bone;
        if (!(b as any).restLocalQuaternion) {
          (b as any).restLocalQuaternion = b.quaternion.clone();
        }
        const nLower = (b.name || '').toLowerCase();
        // Filtrer les os racines (bip_head, spine...) pour ne garder que les mèches
        const isRootOrScalp = nLower.includes('bip_head') || nLower.includes('bip_neck') || 
                              nLower.includes('bip_spine') || nLower.startsWith('head') || 
                              nLower.includes('root') || nLower.includes('scalp') || 
                              nLower.startsWith('bone3_') || nLower.startsWith('bone4_') || 
                              b.parent === scene;

        if (!isRootOrScalp && nLower.startsWith('bone')) {
          const index = parseInt(nLower.replace(/\D/g, ''), 10) || 1;
          extractedBones.push({
            bone: b,
            restQ: (b as any).restLocalQuaternion,
            index,
          });
        }
      }
    });
    
    console.log("Wig extracted bones directly from skeleton:", extractedBones.length); hairBonesRef.current = extractedBones;
    if (onBonesExtracted) {
      onBonesExtracted(hairBonesRef.current);
    }
  }, [scene, color, scale, id]);

  useLayoutEffect(() => {
    if (attachTo && scene) {
      // Remove any previously attached hair armatures to prevent duplicate wigs
      const existingWigs = attachTo.children.filter((c: any) => c.userData.isWigRoot || /^[0-9]+$/.test(c.name) || c.name.toLowerCase().includes('hair') || c.name.includes('_ARM_'));
      
      console.log(`[Wig Setup] attaching scene ${scene.name} (uuid: ${scene.uuid}). headBone currently has ${attachTo.children.length} children:`, attachTo.children.map((c: any) => c.name));
      if (existingWigs.length > 0) {
        console.log(`[Wig Setup] removing ${existingWigs.length} old wigs:`, existingWigs.map((w: any) => w.name));
        existingWigs.forEach((w: any) => {
          disposeOwnedWigMaterials(w);
          attachTo.remove(w);
        });
      }

      attachTo.add(scene);
    }
    return () => {
      if (attachTo && scene) {
        console.log(`[Wig Cleanup] removing scene ${scene.name} (uuid: ${scene.uuid})`);
        attachTo.remove(scene);
        disposeOwnedWigMaterials(scene);
      }
    };
  }, [attachTo, scene]);

  // 3. Animation du vent (Mannequin) et couleur arc-en-ciel
  useFrame((state) => {
    if (color === 'arc-en-ciel' && scene) {
      const hue = (state.clock.elapsedTime * 0.2) % 1;
      const rainbow = new THREE.Color().setHSL(hue, 0.8, 0.5);
      scene.traverse((child: any) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => {
              if (mat && 'color' in mat) (mat as THREE.MeshStandardMaterial).color.copy(rainbow);
            });
          } else if ('color' in m.material) {
            (m.material as THREE.MeshStandardMaterial).color.copy(rainbow);
          }
        }
      });
    }

    if (!attachTo) {
      if (windEnabled && hairBonesRef.current.length > 0) {
        const t = state.clock.elapsedTime * 3;
        hairBonesRef.current.forEach(({ bone, restQ, index }) => {
          const windX = Math.sin(t + index * 0.5) * 0.15;
          const windZ = Math.cos(t * 0.8 + index * 0.5) * 0.15;
          const windQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(windX, 0, windZ));
          bone.quaternion.copy(restQ).multiply(windQ);
        });
      } else if (!windEnabled && hairBonesRef.current.length > 0) {
        // Remise à zéro s'il n'y a pas de vent
        hairBonesRef.current.forEach(({ bone, restQ }) => {
          bone.quaternion.copy(restQ);
        });
      }
    }
  });

  return attachTo ? null : (
    <group ref={clonedHairRef} position={offset} name="lara_custom_hair_attachment">
      <primitive object={scene} dispose={null} />
    </group>
  );
}
