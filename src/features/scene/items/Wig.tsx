import { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { LAYER_WALKER, LAYER_DECOR } from '@config';
import { RIGGED_WIGS_PATHS } from '@features/inventory/inventoryData';
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';

export const HAIR_COLORS: Record<string, THREE.Color> = {
  naturel:  new THREE.Color(0.4, 0.25, 0.1),
  noir:     new THREE.Color(0.05, 0.03, 0.03),
  brun:     new THREE.Color(0.25, 0.12, 0.05),
  chatain:  new THREE.Color(0.35, 0.18, 0.07),
  blond:    new THREE.Color(0.85, 0.7,  0.3),
  roux:     new THREE.Color(0.7,  0.2,  0.05),
  rouge:    new THREE.Color(0xff0000),
  blanc:    new THREE.Color(0.95, 0.95, 0.95),
  bleu:     new THREE.Color(0.05, 0.2,  0.9),
  vert:     new THREE.Color(0.05, 0.7,  0.15),
  rose:     new THREE.Color(0.95, 0.3,  0.65),
  violet:   new THREE.Color(0.5,  0.05, 0.9),
};

const wigGrayscaleTextureCache = new Map<string, THREE.Texture>();

function getWigGrayscaleTexture(originalTex: THREE.Texture): THREE.Texture | null {
  if (!originalTex || !originalTex.image) return null;
  const cacheKey = (originalTex.uuid || originalTex.name || 'wig_tex') + '_vivida';
  const cached = wigGrayscaleTextureCache.get(cacheKey);
  if (cached) return cached;

  const img = originalTex.image as HTMLImageElement | HTMLCanvasElement;
  const width = img.width || 1024;
  const height = img.height || 1024;
  if (!width || !height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.filter = 'grayscale(100%) brightness(140%) contrast(210%)';
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';

  const newTex = new THREE.CanvasTexture(canvas);
  newTex.flipY = originalTex.flipY;
  newTex.colorSpace = THREE.SRGBColorSpace;
  newTex.needsUpdate = true;
  wigGrayscaleTextureCache.set(cacheKey, newTex);
  return newTex;
}

const _tmpWindEuler = new THREE.Euler();
const _tmpWindQ = new THREE.Quaternion();
const _tmpRainbowColor = new THREE.Color();

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

export { RIGGED_WIGS_PATHS };

export function disposeOwnedWigResources(root: THREE.Object3D) {
  const disposedMaterials = new Set<THREE.Material>();

  root.traverse((node: any) => {
    if (node.isMesh) {
      // SkeletonUtils.clone shares GLTF geometry and textures with other wigs.
      // Only the material and skeleton created for this instance belong to it.
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const mat of materials) {
          if (!mat || disposedMaterials.has(mat)) continue;
          if (mat.userData.__ownedWigMaterial) {
            disposedMaterials.add(mat);
            mat.dispose();
          }
        }
      }
      if (node.userData.__ownedWigSkeleton) {
        node.skeleton.dispose();
      }
    }
  });
}

export function Wig({ id, color, offset = [0, 0, 0], scale = 1, windEnabled = false, onBonesExtracted, attachTo }: WigProps) {
  const strId = String(id);
  const cleanId = strId.replace(/^hair_/, '');
  const gltfPath = RIGGED_WIGS_PATHS[strId] || RIGGED_WIGS_PATHS[cleanId] || (typeof id === 'string' && id.endsWith('.glb') ? id : 'characters/wigs/zepeto_hair.glb');
  const { scene: fullScene } = useGLTF(gltfPath);
  const clonedHairRef = useRef<THREE.Group>(null!);
  
  const scene = useMemo(() => {
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
        sm.userData.itemName = `Perruque (${cleanId})`;
        // Reconstruct the skeleton using the cloned bones instead of the originals
        const newBones = sm.skeleton.bones.map(b => clonedBones[b.name] || b);
        const newSkeleton = new THREE.Skeleton(newBones, sm.skeleton.boneInverses);
        sm.bind(newSkeleton, sm.bindMatrix);
        enableAnimatedFrustumCulling(sm);
        sm.userData.__ownedWigSkeleton = true;
      } else if ((child as THREE.Mesh).isMesh) {
        child.userData.itemName = `Perruque (${cleanId})`;
        enableAnimatedFrustumCulling(child as THREE.Mesh);
      }
    });

    let sg: THREE.Object3D | null = clonedFullScene;
    
    let hairHeadBone: THREE.Object3D | null = null;
    (sg as THREE.Object3D).traverse((c: any) => {
      const nLower = c.name.toLowerCase();
      if ((nLower.startsWith('bip_head') || nLower.startsWith('head')) && !hairHeadBone) {
        hairHeadBone = c;
      }
    });

    const wigFixes: Record<string, { scale: number, rotation: [number, number, number], offset: [number, number, number] }> = {
      'pigtails': { scale: 0.3, rotation: [Math.PI / 2, 0, 0], offset: [0, 0, 0] },
      'hair_pigtails': { scale: 0.3, rotation: [Math.PI / 2, 0, 0], offset: [0, 0, 0] },
      'very_long': { scale: 0.02, rotation: [Math.PI / 2, 0, 0], offset: [0, 0, 0] },
      'hair_very_long': { scale: 0.02, rotation: [Math.PI / 2, 0, 0], offset: [0, 0, 0] },
      'two_white_ponytails': { scale: 0.3, rotation: [Math.PI / 2, 0, 0], offset: [0, 0, 0] },
      'hair_two_white_ponytails': { scale: 0.3, rotation: [Math.PI / 2, 0, 0], offset: [0, 0, 0] },
      'wavy_ponytail': { scale: 0.1, rotation: [0, 0, 0], offset: [0, -0.05, 0] },
      'hair_wavy_ponytail': { scale: 0.1, rotation: [0, 0, 0], offset: [0, -0.05, 0] },
      // Coupes 100 à 112 (issues de wig_100.glb à wig_112.glb)
      '100': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_100': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '101': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_101': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '102': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_102': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '103': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_103': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '104': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_104': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '105': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_105': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '106': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_106': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '107': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_107': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '108': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_108': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '109': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_109': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '110': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_110': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '111': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_111': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      '112': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'hair_112': { scale: 1.4, rotation: [0, 0, 0], offset: [0, 0, 0] },
      'lara_native': { scale: 1.0, rotation: [0, 0, 0], offset: [0, -0.0367, 0] },
      'hair_lara_native': { scale: 1.0, rotation: [0, 0, 0], offset: [0, -0.0367, 0] },
    };
    
    const fix = wigFixes[strId] || wigFixes[cleanId] || { scale: 1.0, rotation: [0, 0, 0], offset: [0, 0, 0] };
    const s = fix.scale;

    if (hairHeadBone) {
      (sg as THREE.Object3D).updateMatrixWorld(true);
      const headPos = (hairHeadBone as THREE.Object3D).position.clone();
      (sg as THREE.Object3D).position.set(
        -headPos.x * s * scale + fix.offset[0] * scale,
        -headPos.y * s * scale + (attachTo ? 0.07 : 0) + fix.offset[1] * scale,
        -headPos.z * s * scale + fix.offset[2] * scale
      );
    } else {
      (sg as THREE.Object3D).position.set(fix.offset[0] * scale, 0.15 * scale + fix.offset[1] * scale, fix.offset[2] * scale);
    }

    // Apply the user requested scale DIRECTLY to sg instead of the wrapper group
    (sg as THREE.Object3D).scale.set(s * scale, s * scale, s * scale);
    (sg as THREE.Object3D).rotation.set(fix.rotation[0], fix.rotation[1], fix.rotation[2]);
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
  }, [fullScene, id, scale, cleanId, strId, attachTo]);

  const hairBonesRef = useRef<WigBone[]>([]);
  
  useLayoutEffect(() => {
    if (!scene) return;

    // 1. Extraire les os pour l'animation/physique et configurer les matériaux
    const extractedBones: WigBone[] = [];
    scene.traverse((child: any) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
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
        if (attachTo) {
          m.layers.set(LAYER_WALKER);
        } else {
          m.layers.set(LAYER_DECOR);
        }
        
        const targetColor = color && HAIR_COLORS[color] ? HAIR_COLORS[color] : null;
        const isLaraNativeWig = cleanId === 'lara_native';
        const isColored = !!targetColor || color === 'arc-en-ciel';

        const configureWigMat = (baseMat: any, prevMat?: any) => {
          if (!baseMat) return baseMat;
          if (prevMat && prevMat !== baseMat && prevMat.userData?.__ownedWigMaterial) {
            prevMat.dispose();
          }
          const clonedMat = baseMat.clone();
          clonedMat.userData.__ownedWigMaterial = true;
          clonedMat.side = THREE.DoubleSide;
          clonedMat.transparent = false;
          clonedMat.opacity = 1;
          clonedMat.alphaTest = 0.5;
          clonedMat.depthWrite = true;
          if (isLaraNativeWig && isColored) {
            const bwMap = baseMat.map ? getWigGrayscaleTexture(baseMat.map) : null;
            clonedMat.map = bwMap;
          }
          if (isColored) {
            clonedMat.roughness = 0.4;
            clonedMat.metalness = 0.0;
          }
          if (targetColor && 'color' in clonedMat) {
            clonedMat.color.copy(targetColor);
            if ('emissive' in clonedMat) {
              if (color === 'rouge') {
                clonedMat.emissive.copy(targetColor);
                clonedMat.emissiveIntensity = 0.18;
                clonedMat.toneMapped = false;
              } else if (isLaraNativeWig) {
                clonedMat.emissive.copy(targetColor);
                clonedMat.emissiveIntensity = 0.12;
              }
            }
          }
          clonedMat.needsUpdate = true;
          return clonedMat;
        };

        if (!m.userData.__baseWigMaterial) {
          m.userData.__baseWigMaterial = m.material;
        }

        if (Array.isArray(m.userData.__baseWigMaterial)) {
          const prevMats = Array.isArray(m.material) ? m.material : [];
          m.material = m.userData.__baseWigMaterial.map((baseMat: any, idx: number) =>
            configureWigMat(baseMat, prevMats[idx])
          );
        } else if (m.userData.__baseWigMaterial) {
          m.material = configureWigMat(m.userData.__baseWigMaterial, m.material);
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
    
    hairBonesRef.current = extractedBones;
    if (onBonesExtracted) {
      onBonesExtracted(hairBonesRef.current);
    }
  }, [scene, color, scale, id]);

  useLayoutEffect(() => {
    if (attachTo && scene) {
      // Remove any previously attached hair armatures to prevent duplicate wigs
      const existingWigs = attachTo.children.filter((c: any) => c.userData.isWigRoot || /^[0-9]+$/.test(c.name) || c.name.toLowerCase().includes('hair') || c.name.includes('_ARM_'));
      
      if (existingWigs.length > 0) {
        existingWigs.forEach((w: any) => {
          disposeOwnedWigResources(w);
          attachTo.remove(w);
        });
      }

      attachTo.add(scene);
    }
    return () => {
      if (scene) {
        attachTo?.remove(scene);
        disposeOwnedWigResources(scene);
      }
    };
  }, [attachTo, scene]);

  const hasResetWindRef = useRef(false);

  // 3. Animation du vent (Mannequin) et couleur arc-en-ciel
  useFrame((state) => {
    if (attachTo && color !== 'arc-en-ciel') return;

    if (color === 'arc-en-ciel' && scene) {
      const hue = (state.clock.elapsedTime * 0.2) % 1;
      _tmpRainbowColor.setHSL(hue, 0.8, 0.5);
      scene.traverse((child: any) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => {
              if (mat && 'color' in mat) (mat as THREE.MeshStandardMaterial).color.copy(_tmpRainbowColor);
            });
          } else if ('color' in m.material) {
            (m.material as THREE.MeshStandardMaterial).color.copy(_tmpRainbowColor);
          }
        }
      });
    }

    if (!attachTo) {
      if (windEnabled && hairBonesRef.current.length > 0) {
        hasResetWindRef.current = false;
        const t = state.clock.elapsedTime * 3;
        hairBonesRef.current.forEach(({ bone, restQ, index }) => {
          const windX = Math.sin(t + index * 0.5) * 0.15;
          const windZ = Math.cos(t * 0.8 + index * 0.5) * 0.15;
          _tmpWindEuler.set(windX, 0, windZ);
          _tmpWindQ.setFromEuler(_tmpWindEuler);
          bone.quaternion.copy(restQ).multiply(_tmpWindQ);
        });
      } else if (!windEnabled && hairBonesRef.current.length > 0 && !hasResetWindRef.current) {
        // Remise à zéro une seule fois s'il n'y a pas de vent
        hairBonesRef.current.forEach(({ bone, restQ }) => {
          bone.quaternion.copy(restQ);
        });
        hasResetWindRef.current = true;
      }
    }
  });

  return attachTo ? null : (
    <group ref={clonedHairRef} position={offset} name="lara_custom_hair_attachment">
      <primitive object={scene} dispose={null} />
    </group>
  );
}

