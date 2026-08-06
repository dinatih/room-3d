/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/glb/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 * Ajoute une perruque aléatoire depuis hair_pack_part_2.glb (même logique que Walker.tsx).
 *
 * Architecture :
 *  <group ref={ref}>        ← espace cm (1 unit = 1 cm), pas de scale
 *    <scene>                ← mannequin scalé × scaleFactor pour atteindre 45 cm
 *    <clonedHair>           ← perruque ajoutée DIRECTEMENT ici, pas dans scene
 *  </group>
 *
 * La perruque est ajoutée dans l'espace cm du group wrapper et non dans l'espace
 * GLB scalé de scene — évite l'effet de multiplication de scale.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 45; // cm

// Préfixes des 13 coiffures dans hair_pack_part_2.glb
const HAIR_NUMBERS = ['100','101','102','103','104','105','106','107','108','109','110','111','112'];

export function MannequinHead({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);
  const { scene } = useGLTFClone('media/glb/wig_mannequin.glb');
  const hairPack = useGLTF('media/hair_pack_part_2.glb');

  const randomWigNumber = useMemo(
    () => HAIR_NUMBERS[Math.floor(Math.random() * HAIR_NUMBERS.length)],
    [],
  );

  useLayoutEffect(() => {
    const group = ref.current;

    // Nettoyer les enfants précédents
    while (group.children.length > 0) group.remove(group.children[0]);

    // ── 1. Tête de mannequin ─────────────────────────────────────────────────
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / raw.y);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    group.add(scene);
    onSize(box.getSize(new THREE.Vector3()));

    // ── 2. Perruque (ajoutée au group wrapper, PAS à scene) ──────────────────
    if (!hairPack?.scene) return;

    // Trouver le nœud racine de la coiffure (ex: "Hair101_ARM_75")
    const prefix = `Hair${randomWigNumber}_ARM_`;
    let sourceGroup: THREE.Object3D | undefined;
    hairPack.scene.traverse(child => {
      if (!sourceGroup && child.name.startsWith(prefix)) sourceGroup = child;
    });
    if (!sourceGroup) return;

    // Cloner avec SkeletonUtils comme dans Walker.tsx
    const clonedHair = SkeletonUtils.clone(sourceGroup as THREE.Object3D);

    // Configurer les matériaux (identique à Walker.tsx)
    clonedHair.traverse((child: THREE.Object3D) => {
      child.frustumCulled = false;
      const m = child as THREE.Mesh;
      if (m.isMesh && m.material) {
        m.visible = true;
        m.renderOrder = 1;
        if (Array.isArray(m.material)) {
          m.material = m.material.map(mat => {
            if (!mat) return mat;
            const c = mat.clone();
            c.side = THREE.DoubleSide;
            c.alphaTest = 0.5;
            c.depthWrite = true;
            c.needsUpdate = true;
            return c;
          });
        } else if (m.material) {
          const c = m.material.clone();
          c.side = THREE.DoubleSide;
          c.alphaTest = 0.5;
          c.depthWrite = true;
          c.needsUpdate = true;
          m.material = c;
        }
      }
    });

    // ── 3. Trouver l'os bip_head de la perruque (même logique que Walker.tsx) ──
    let hairHeadBone: THREE.Object3D | null = null;
    clonedHair.traverse((c: THREE.Object3D) => {
      const nLower = c.name.toLowerCase();
      if ((nLower.startsWith('bip_head') || nLower === 'head') && !hairHeadBone) {
        hairHeadBone = c;
      }
    });

    // ── 4. Calculer bbox des meshes uniquement (pour déterminer le scale) ─────
    clonedHair.scale.set(1, 1, 1);
    clonedHair.position.set(0, 0, 0);
    clonedHair.rotation.set(0, 0, 0);
    clonedHair.updateMatrixWorld(true);

    const hairBox = new THREE.Box3();
    clonedHair.traverse((child: THREE.Object3D) => {
      const m = child as THREE.Mesh;
      if (m.isMesh && m.geometry) {
        m.geometry.computeBoundingBox();
        if (m.geometry.boundingBox) {
          hairBox.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
        }
      }
    });

    if (hairBox.isEmpty()) return;

    // Scaler pour que la hauteur = 70% de TARGET_H (espace cm du wrapper group)
    const hairNativeH = hairBox.getSize(new THREE.Vector3()).y;
    const wigScale = (TARGET_H * 0.70) / hairNativeH;
    clonedHair.scale.setScalar(wigScale);

    // ── 5. Positionner via bip_head comme Walker.tsx ──────────────────────────
    // L'os bip_head de la perruque doit coïncider avec le sommet de la tête du mannequin.
    // TARGET_H * 0.82 = environ le niveau des oreilles/sommet dans l'espace cm du wrapper.
    if (hairHeadBone) {
      clonedHair.updateMatrixWorld(true);
      // Position locale de bip_head dans l'espace du clonedHair (avant scaling world)
      const headPos = (hairHeadBone as THREE.Object3D).position.clone();
      clonedHair.position.set(
        -headPos.x * wigScale,
        TARGET_H * 0.82 - headPos.y * wigScale,
        -headPos.z * wigScale,
      );
    } else {
      // Fallback : centrer XZ sur bbox et placer à 40% de la hauteur
      clonedHair.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3();
      clonedHair.traverse((child: THREE.Object3D) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.geometry?.boundingBox) {
          scaledBox.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
        }
      });
      const hairCenter = scaledBox.getCenter(new THREE.Vector3());
      clonedHair.position.set(-hairCenter.x, TARGET_H * 0.40 - scaledBox.min.y, -hairCenter.z);
    }

    group.add(clonedHair);

  }, [scene, hairPack, randomWigNumber]);

  return <group ref={ref} />;
}

useGLTF.preload('media/glb/wig_mannequin.glb');
useGLTF.preload('media/hair_pack_part_2.glb');
