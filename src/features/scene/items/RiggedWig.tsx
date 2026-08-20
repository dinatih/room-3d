import { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

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

export const RIGGED_WIGS_PATHS: Record<string, string> = {
  zepeto: 'media/zepeto_hair.glb',
  // pigtails: 'media/white_long_pigtails.glb', // #15
  buns: 'media/long_hair_with_buns.glb',
  short_layers: 'media/short_hair_cut_in_layers.glb',
  nmixx_hat_braids: 'media/nmixx_long_hair_with_hat_and_braids.glb',
  // very_long: 'media/very_long_hair.glb', // #19
  two_braids_bangs: 'media/two_braids_with_bangs.glb',
  aespa_short: 'media/aespa_short_hair.glb',
  // wavy_ponytail: 'media/wavy_white_ponytail.glb', // #22
  nimxx_short: 'media/nimxx_short_hair.glb',
  short_combed: 'media/short_hair_combed_back.glb',
  low_bun: 'media/low_bun_with_bangs.glb',
  high_bun: 'media/high_bun_with_bangs.glb',
  high_ponytail: 'media/high_short_ponytail.glb',
  nmixx_short: 'media/nmixx_short_hair.glb',
  long_braids: 'media/long_braids_with_bangs.glb',
  nmixx_16: 'media/nmixx_hair_n16.glb',
  zepeto_nmixx: 'media/zepeto_nmixx_hair.glb',
  bob_buns: 'media/bob_haircut_with_buns.glb',
  wavy_ponytails: 'media/white_long_wavy_ponytails.glb',
  two_long_ponytails: 'media/two_long_ponytails.glb',
  cyber_two_long_ponytails: 'media/cyber_two_long_ponytails.glb',
  white_hair_with_bun: 'media/white_hair_with_bun.glb',
  short_hair: 'media/short_hair.glb',
  white_ponytail: 'media/white_ponytail.glb',
  nmixx_hair_with_bangs: 'media/nmixx_hair_with_bangs.glb',
  // two_white_ponytails: 'media/two_white_ponytails.glb', // #40
  wolf_haircut: 'media/wolf_haircut.glb',
  white_bob_hairct: 'media/white_bob_hairct.glb',
  scbe_hair_combed_to_one_side: 'media/scbe_hair_combed_to_one_side.glb',
  wavy_wet_white_hair: 'media/wavy_wet_white_hair.glb',
  nyyd_wavy_hair: 'media/nyyd_wavy_hair.glb',
  short_wavy_hair_with_bangs: 'media/short_wavy_hair_with_bangs.glb',
  nmixxhair_whith_bangs: 'media/nmixxhair_whith_bangs.glb',
  long_hair_styled_to_the_sides: 'media/long_hair_styled_to_the_sides.glb',
  wavy_long_hair_with_bangs: 'media/wavy_long_hair_with_bangs.glb',
  wavy_white_hair_to_one_side: 'media/wavy_white_hair_to_one_side.glb',
  high_white_bunponytail: 'media/high_white_bunponytail.glb',
  white_hair_arraged_to_one_side: 'media/white_hair_arraged_to_one_side.glb',
  // black_long_hair: 'media/black_long_hair.glb', // #53
  // blonde_ponytail_with_bangs: 'media/blonde_ponytail_with_bangs.glb', // #54
  bratz_curly_hair: 'media/bratz_curly_hair.glb',
  bratz_long_hair: 'media/bratz_long_hair.glb',
  // chinook_wind_ponytail: 'media/chinook_wind_ponytail.glb', // #57
  // hair_bitten: 'media/hair_bitten.glb', // #58
  kcon_long_hair: 'media/kcon_long_hair.glb',
  // long_down_ponytail: 'media/long_down_ponytail.glb', // #60
  // long_hair_cut_in_layers: 'media/long_hair_cut_in_layers.glb', // #61
  long_hair_with_bow: 'media/long_hair_with_bow.glb',
  // medium_short_hair_combed_to_the_sides: 'media/medium_short_hair_combed_to_the_sides.glb', // #63
  nmixx_white_hair: 'media/nmixx_white_hair.glb',
  nmixx_white_longshort_hair: 'media/nmixx_white_longshort_hair.glb',
  // noicepotatonp_osanahair: 'media/noicepotatonp_osanahair.glb', // #66
  side_swept_curls: 'media/side_swept_curls.glb',
  straight_long_white_hair: 'media/straight_long_white_hair.glb',
  two_braids_with_red_ties: 'media/two_braids_with_red_ties.glb',
  vcha_long_white_hair: 'media/vcha_long_white_hair.glb',
  wavy_hair_arranged_to_one_side: 'media/wavy_hair_arranged_to_one_side.glb',
  wavy_hair_with_bangs_02: 'media/wavy_hair_with_bangs_02.glb',
  white_long_wavy_hair: 'media/white_long_wavy_hair.glb'
};

export function RiggedWig({ id, color, offset = [0, 0, 0], scale = 1, windEnabled = false, onBonesExtracted, attachTo }: WigProps) {
  const gltfPath = RIGGED_WIGS_PATHS[id as string] || 'media/zepeto_hair.glb';
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
        // Reconstruct the skeleton using the cloned bones instead of the originals
        const newBones = sm.skeleton.bones.map(b => clonedBones[b.name] || b);
        const newSkeleton = new THREE.Skeleton(newBones, sm.skeleton.boneInverses);
        sm.bind(newSkeleton, sm.bindMatrix);
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
      'hair_wavy_ponytail': { scale: 0.1, rotation: [0, 0, 0], offset: [0, -0.05, 0] }
    };
    
    const fix = wigFixes[id as string] || { scale: 1.0, rotation: [0, 0, 0], offset: [0, 0, 0] };
    const s = fix.scale;

    if (hairHeadBone) {
      (sg as THREE.Object3D).updateMatrixWorld(true);
      const headPos = (hairHeadBone as THREE.Object3D).position.clone();
      (sg as THREE.Object3D).position.set(
        -headPos.x * s * scale + fix.offset[0],
        -headPos.y * s * scale + (attachTo ? 0.07 : 0) + fix.offset[1],
        -headPos.z * s * scale + fix.offset[2]
      );
    } else {
      (sg as THREE.Object3D).position.set(fix.offset[0], 0.15 * scale + fix.offset[1], fix.offset[2]);
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
  }, [fullScene, id, scale]);

  const hairBonesRef = useRef<WigBone[]>([]);
  
  useLayoutEffect(() => {
    if (!scene) return;

    // 1. Extraire les os pour l'animation/physique et configurer les matériaux
    const extractedBones: WigBone[] = [];
    scene.traverse((child: any) => {
      child.frustumCulled = false;
      
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        if (!(window as any)._skinLogged2) {
          console.log("[Wig] SkinnedMesh found:", sm.name, "with", sm.skeleton.bones.length, "bones.");
          (window as any)._skinLogged2 = true;
        }
        // Extract bones DIRECTLY from the SkinnedMesh's skeleton!
        if (extractedBones.length === 0) {
          const isRootOrScalp = (n: string) => {
            const nl = n.toLowerCase();
            return nl.includes('root') || nl.includes('spine') || nl.includes('neck') || 
                   nl.includes('head') || nl.includes('hairall') || nl.includes('jbone') || 
                   nl.includes('forehead') || nl.includes('scalp');
          };
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
        m.layers.enable(0);
        m.layers.enable(1);
        m.layers.enable(2);
        m.layers.enable(3);
        
        const targetColor = color && HAIR_COLORS[color] ? HAIR_COLORS[color] : null;

        if (Array.isArray(m.material)) {
          m.material = m.material.map((_mat: any) => {
            if (!_mat) return _mat;
            const clonedMat = _mat.clone();
            clonedMat.side = THREE.DoubleSide;
            clonedMat.alphaTest = 0.5;
            clonedMat.depthWrite = true;
            if (targetColor && 'color' in clonedMat) (clonedMat as any).color.copy(targetColor);
            clonedMat.needsUpdate = true;
            return clonedMat;
          });
        } else if (m.material) {
          const clonedMat = (m.material as THREE.Material).clone();
          clonedMat.side = THREE.DoubleSide;
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
                              nLower.includes('hairall') || nLower.includes('jbone') ||
                              nLower.includes('forehead') ||
                              b.parent === scene;

        if (!isRootOrScalp) {
          const index = extractedBones.length;
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
        existingWigs.forEach((w: any) => attachTo.remove(w));
      }

      attachTo.add(scene);
    }
    return () => {
      if (attachTo && scene) {
        console.log(`[Wig Cleanup] removing scene ${scene.name} (uuid: ${scene.uuid})`);
        attachTo.remove(scene);
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
// useGLTF.preload('media/white_long_pigtails.glb'); // #15
useGLTF.preload('media/zepeto_hair.glb');
useGLTF.preload('media/long_hair_with_buns.glb');
useGLTF.preload('media/short_hair_cut_in_layers.glb');
useGLTF.preload('media/nmixx_long_hair_with_hat_and_braids.glb');
// useGLTF.preload('media/very_long_hair.glb'); // #19
useGLTF.preload('media/two_braids_with_bangs.glb');
useGLTF.preload('media/aespa_short_hair.glb');
// useGLTF.preload('media/wavy_white_ponytail.glb'); // #22
useGLTF.preload('media/nimxx_short_hair.glb');
useGLTF.preload('media/short_hair_combed_back.glb');
useGLTF.preload('media/low_bun_with_bangs.glb');
useGLTF.preload('media/high_bun_with_bangs.glb');
useGLTF.preload('media/high_short_ponytail.glb');
useGLTF.preload('media/nmixx_short_hair.glb');
useGLTF.preload('media/long_braids_with_bangs.glb');
useGLTF.preload('media/nmixx_hair_n16.glb');
useGLTF.preload('media/zepeto_nmixx_hair.glb');
useGLTF.preload('media/bob_haircut_with_buns.glb');
useGLTF.preload('media/white_long_wavy_ponytails.glb');
useGLTF.preload('media/two_long_ponytails.glb');
useGLTF.preload('media/cyber_two_long_ponytails.glb');
useGLTF.preload('media/white_hair_with_bun.glb');
useGLTF.preload('media/short_hair.glb');
useGLTF.preload('media/white_ponytail.glb');
useGLTF.preload('media/nmixx_hair_with_bangs.glb');
// useGLTF.preload('media/two_white_ponytails.glb'); // #40
useGLTF.preload('media/wolf_haircut.glb');
useGLTF.preload('media/white_bob_hairct.glb');
useGLTF.preload('media/scbe_hair_combed_to_one_side.glb');
useGLTF.preload('media/wavy_wet_white_hair.glb');
useGLTF.preload('media/nyyd_wavy_hair.glb');
useGLTF.preload('media/short_wavy_hair_with_bangs.glb');
useGLTF.preload('media/nmixxhair_whith_bangs.glb');
useGLTF.preload('media/long_hair_styled_to_the_sides.glb');
useGLTF.preload('media/wavy_long_hair_with_bangs.glb');
useGLTF.preload('media/wavy_white_hair_to_one_side.glb');
useGLTF.preload('media/high_white_bunponytail.glb');
useGLTF.preload('media/white_hair_arraged_to_one_side.glb');
// useGLTF.preload('media/black_long_hair.glb'); // #53
// useGLTF.preload('media/blonde_ponytail_with_bangs.glb'); // #54
useGLTF.preload('media/bratz_curly_hair.glb');
useGLTF.preload('media/bratz_long_hair.glb');
// useGLTF.preload('media/chinook_wind_ponytail.glb'); // #57
// useGLTF.preload('media/hair_bitten.glb'); // #58
useGLTF.preload('media/kcon_long_hair.glb');
// useGLTF.preload('media/long_down_ponytail.glb'); // #60
// useGLTF.preload('media/long_hair_cut_in_layers.glb'); // #61
useGLTF.preload('media/long_hair_with_bow.glb');
// useGLTF.preload('media/medium_short_hair_combed_to_the_sides.glb'); // #63
useGLTF.preload('media/nmixx_white_hair.glb');
useGLTF.preload('media/nmixx_white_longshort_hair.glb');
// useGLTF.preload('media/noicepotatonp_osanahair.glb'); // #66
useGLTF.preload('media/side_swept_curls.glb');
useGLTF.preload('media/straight_long_white_hair.glb');
useGLTF.preload('media/two_braids_with_red_ties.glb');
useGLTF.preload('media/vcha_long_white_hair.glb');
useGLTF.preload('media/wavy_hair_arranged_to_one_side.glb');
useGLTF.preload('media/wavy_hair_with_bangs_02.glb');
useGLTF.preload('media/white_long_wavy_hair.glb');
