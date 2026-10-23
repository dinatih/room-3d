import { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { LAYER_WALKER, LAYER_DECOR } from '@config';
import { RIGGED_WIGS_PATHS } from '@features/inventory/inventoryData';

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
  const disposedSkeletons = new Set<THREE.Skeleton>();

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
      if (node.userData.__ownedWigSkeleton && !disposedSkeletons.has(node.skeleton)) {
        disposedSkeletons.add(node.skeleton);
        node.skeleton.dispose();
      }
    }
  });
}

export function Wig({ id, color, offset = [0, 0, 0], scale = 1, windEnabled = false, onBonesExtracted, attachTo }: WigProps) {
  const strId = String(id);
  const cleanId = strId.replace(/^hair_/, '');
  const gltfPath = RIGGED_WIGS_PATHS[strId] || RIGGED_WIGS_PATHS[cleanId] || (typeof id === 'string' && id.endsWith('.glb') ? id : 'characters/wigs/zepeto_hair.glb');
  const { scene: clonedFullScene } = useGLTFClone(gltfPath);
  const clonedHairRef = useRef<THREE.Group>(null!);
  
  const scene = useMemo(() => {
    // Keep the imported hierarchy and skin bind matrices intact. Apply fitting
    // transforms to a separate group shared by meshes and their armatures.
    const sg = new THREE.Group();
    sg.add(clonedFullScene);
    let hairHeadBone: THREE.Bone | undefined;
    clonedFullScene.traverse(child => {
      if ((child as THREE.Mesh).isMesh) child.userData.itemName = `Perruque (${cleanId})`;
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh;
        mesh.userData.__ownedWigSkeleton = true;
        hairHeadBone ??= mesh.skeleton.bones.find(bone => /^(bip_head|head)/i.test(bone.name));
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
      // The shared Sketchfab scene faces +X; turn the pack to the +Z head frame.
      '100': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_100': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '101': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_101': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '102': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_102': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '103': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_103': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '104': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_104': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '105': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_105': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '106': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_106': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '107': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_107': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '108': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_108': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '109': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_109': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '110': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_110': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '111': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_111': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      '112': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'hair_112': { scale: 1.4, rotation: [0, -Math.PI / 2, 0], offset: [0, 0, 0] },
      'lara_native': { scale: 1.0, rotation: [0, 0, 0], offset: [0, -0.0367, 0] },
      'hair_lara_native': { scale: 1.0, rotation: [0, 0, 0], offset: [0, -0.0367, 0] },
    };
    
    const fix = wigFixes[strId] || wigFixes[cleanId] || { scale: 1.0, rotation: [0, 0, 0], offset: [0, 0, 0] };
    const s = fix.scale;

    // Converted FBX assets already store vertices/bones in metres, but retain
    // the FBX unit scale on their container. Normalize the imported head frame
    // without removing that container or changing any skin bind matrices.
    sg.updateMatrixWorld(true);
    const headScale = hairHeadBone
      ? hairHeadBone.getWorldScale(new THREE.Vector3())
      : new THREE.Vector3(1, 1, 1);
    sg.scale.set(s * scale / headScale.x, s * scale / headScale.y, s * scale / headScale.z);
    sg.rotation.set(...fix.rotation);
    sg.updateMatrixWorld(true);
    if (hairHeadBone) {
      // World position here includes every imported armature transform and the
      // fitting rotation/scale. The unattached wrapper has no transformed parent.
      const headPos = hairHeadBone.getWorldPosition(new THREE.Vector3());
      sg.position.copy(headPos).negate();
      sg.position.y += attachTo ? 0.07 : 0;
    } else {
      sg.position.y = 0.15 * scale;
    }
    sg.position.add(new THREE.Vector3(...fix.offset).multiplyScalar(scale));
    sg.userData.isWigRoot = true;
    return sg;
  }, [clonedFullScene, scale, cleanId, strId, attachTo]);

  const hairBonesRef = useRef<WigBone[]>([]);
  
  useLayoutEffect(() => {
    if (!scene) return;

    // 1. Extraire les os pour l'animation/physique et configurer les matériaux
    hairBonesRef.current.forEach(({ bone, restQ }) => bone.quaternion.copy(restQ));
    hasResetWindRef.current = false;
    const extractedBones: WigBone[] = [];
    scene.traverse((child: any) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        // Extract bones DIRECTLY from the SkinnedMesh's skeleton!
        if (extractedBones.length === 0) {
          const isFixedBone = (n: string) => {
            const lower = n.toLowerCase();
            return lower.includes('root') || lower.includes('spine') || lower.includes('neck') ||
                   lower.includes('head') || lower.includes('scalp') || lower.includes('all') ||
                   lower.includes('forehead') || lower.includes('jbone') || lower.includes('base') ||
                   lower.includes('attach');
          };
          sm.skeleton.bones.forEach(b => {
            if (!isFixedBone(b.name)) {
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
        m.renderOrder = 0;
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
          // Binary texture coverage keeps gaps between hair cards without blending.
          clonedMat.transparent = false;
          clonedMat.opacity = 1;
          clonedMat.depthWrite = true;
          clonedMat.alphaTest = 0.5;
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
                clonedMat.map = null;
                clonedMat.emissiveMap = null;
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

