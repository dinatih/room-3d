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

export function Wig({ id, color, offset = [0, 0, 0], scale = 1, windEnabled = false, onBonesExtracted, attachTo }: WigProps) {
  const { scene: fullScene } = useGLTF('media/hair_pack_part_2.glb');
  const clonedHairRef = useRef<THREE.Group>(null!);
  
  const scene = useMemo(() => {
    let sourceGroup: THREE.Object3D | null = null;
    fullScene.traverse(child => {
      if (!sourceGroup && child.name.startsWith(`Hair${id}_ARM_`)) sourceGroup = child;
    });
    if (!sourceGroup) return new THREE.Group();
    
    const sg = SkeletonUtils.clone(sourceGroup as THREE.Object3D);
    let hairHeadBone: THREE.Object3D | null = null;
    sg.traverse((c: any) => {
      const nLower = c.name.toLowerCase();
      if ((nLower.startsWith('bip_head') || nLower === 'head') && !hairHeadBone) {
        hairHeadBone = c;
      }
    });

    const s = 1.4;
    
    if (hairHeadBone) {
      sg.updateMatrixWorld(true);
      const headPos = (hairHeadBone as THREE.Object3D).position.clone();
      sg.position.set(
        -headPos.x * s * scale,
        -headPos.y * s * scale + (attachTo ? 0.07 : 0),
        -headPos.z * s * scale
      );
    } else {
      sg.position.set(0, 0.15 * scale, 0);
    }

    // Apply the user requested scale DIRECTLY to sg instead of the wrapper group
    // This prevents position offset multiplication bugs
    sg.scale.set(s * scale, s * scale, s * scale);

    return sg;
  }, [fullScene, id, scale]);

  const hairBonesRef = useRef<WigBone[]>([]);

  useLayoutEffect(() => {
    if (!scene) return;

    // 1. Extraire les os pour l'animation/physique et configurer les matériaux
    const extractedBones: WigBone[] = [];
    scene.traverse((child: any) => {
      child.frustumCulled = false;
      
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.visible = true;
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
      attachTo.add(scene);
    }
    return () => {
      if (attachTo && scene) {
        attachTo.remove(scene);
      }
    };
  }, [attachTo, scene]);

  // 3. Animation du vent (Mannequin) et couleur arc-en-ciel
  useFrame((state) => {
    if (color === 'arc-en-ciel' && clonedHairRef.current) {
      const hue = (state.clock.elapsedTime * 0.2) % 1;
      const rainbow = new THREE.Color().setHSL(hue, 0.8, 0.5);
      clonedHairRef.current.traverse((child: any) => {
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
  });

  return attachTo ? null : (
    <group ref={clonedHairRef} position={offset} name="lara_custom_hair_attachment">
      <primitive object={scene} dispose={null} />
    </group>
  );
}

// Removed invalid preloads
