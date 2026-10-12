/**
 * BeachBall.tsx — Ballon de plage gonflable 3D (beach_ball.glb)
 * Conforme aux directives du projet (SceneItemProps, scale 1 unité = 1 cm).
 * 
 * Flotte sur l'eau dans la baignoire avec ondulation naturelle, rebondit
 * doucement sur les parois intérieures et réagit au personnage ou aux
 * smart actions de la baignoire (onde de choc / poussée aquatique).
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { BATHTUB } from '../bathtubData';
import { cameraState } from '../cameraState';
import { useSceneStore } from '../store/useSceneStore';

// Limites intérieures strictes de la baignoire (coordonnées locales au groupe BATHTUB)
// Longueur totale = 150 (axe Z), Largeur = 70 (axe X), Paroi = 4cm
// Rayon du ballon = 12.5 cm (diamètre 25 cm pour loger confortablement dans la baignoire de 62cm intérieur)
const BALL_RADIUS = 12.5;
const INNER_HALF_X = (BATHTUB.width / 2) - BATHTUB.wallThickness - BALL_RADIUS - 1.5; // ~17 cm max
const INNER_HALF_Z = (BATHTUB.length / 2) - BATHTUB.wallThickness - BALL_RADIUS - 2.0; // ~53 cm max
const WATER_Y = BATHTUB.waterHeight;

export function BeachBall({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/beach_ball.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Position, vitesse et impulsion physique sur l'eau
  const posRef = useRef(new THREE.Vector2(0, 20)); // Centré en X, légèrement décalé en Z
  const velRef = useRef(new THREE.Vector2(0.8, -0.4)); // Légère dérive initiale
  const rotRef = useRef(new THREE.Vector3(0.2, 0.4, 0.1));

  // Écoute de l'état d'interaction de la baignoire (Valby ou autre dans l'eau)
  const isTubActive = useSceneStore(s => (s.furniture as Record<string, any>).aiBathtub ?? false);
  const wasTubActiveRef = useRef(false);

  useLayoutEffect(() => {
    if (!scene) return;
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const box = glbLocalBBox(scene);
    const rawSize = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 2.0;

    // Échelle : diamètre 25 cm (parfaitement proportionné au bassin)
    const targetDiameter = BALL_RADIUS * 2;
    scene.scale.setScalar(targetDiameter / maxDim);

    // Centrage géométrique exact (pivot au centre de la sphère)
    const scaledBox = glbLocalBBox(scene);
    scene.position.set(
      -(scaledBox.min.x + scaledBox.max.x) / 2,
      -(scaledBox.min.y + scaledBox.max.y) / 2,
      -(scaledBox.min.z + scaledBox.max.z) / 2
    );

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    onSize?.(new THREE.Vector3(targetDiameter, targetDiameter, targetDiameter));
  }, [scene, onSize]);

  // Transform matrice monde de la baignoire pour projeter les personnages en local
  const tubWorldPos = useRef(new THREE.Vector3(...BATHTUB.position));

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    const pos = posRef.current;
    const vel = velRef.current;

    // 1. Détection impulsion quand quelqu'un entre dans la baignoire
    if (isTubActive && !wasTubActiveRef.current) {
      vel.x += (Math.random() - 0.5) * 25;
      vel.y += (Math.random() - 0.5) * 35;
    }
    wasTubActiveRef.current = isTubActive;

    // 2. Interaction de poussée par les personnages à proximité
    // Repère monde de la baignoire : position BATHTUB.position
    const charPos = cameraState.positions['native'] ?? { x: cameraState.characterX, z: cameraState.characterZ, y: 0 };
    // Coordonnées relatives du personnage par rapport à la baignoire
    const relCharX = charPos.x - tubWorldPos.current.x;
    const relCharZ = charPos.z - tubWorldPos.current.z;
    const distToChar = Math.hypot(relCharX - pos.x, relCharZ - pos.y);

    if (distToChar < BALL_RADIUS + 28 && charPos.y < 45) {
      // Poussée du personnage vers le ballon
      const pushDirX = (pos.x - relCharX) / (distToChar || 1);
      const pushDirZ = (pos.y - relCharZ) / (distToChar || 1);
      vel.x += pushDirX * 18 * dt;
      vel.y += pushDirZ * 18 * dt;
    }

    // 3. Mise à jour position + frottement fluide de l'eau
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    vel.x *= Math.pow(0.88, dt * 60);
    vel.y *= Math.pow(0.88, dt * 60);

    // Ambiance douce d'eau (petite ondulation automatique résiduelle)
    vel.x += Math.sin(t * 1.5 + pos.y * 0.1) * 0.8 * dt;
    vel.y += Math.cos(t * 1.2 + pos.x * 0.1) * 0.8 * dt;

    // 4. Collision avec les rebords intérieurs (rebond élastique sans jamais traverser)
    if (pos.x < -INNER_HALF_X) {
      pos.x = -INNER_HALF_X;
      vel.x = Math.abs(vel.x) * 0.75;
    } else if (pos.x > INNER_HALF_X) {
      pos.x = INNER_HALF_X;
      vel.x = -Math.abs(vel.x) * 0.75;
    }

    if (pos.y < -INNER_HALF_Z) {
      pos.y = -INNER_HALF_Z;
      vel.y = Math.abs(vel.y) * 0.75;
    } else if (pos.y > INNER_HALF_Z) {
      pos.y = INNER_HALF_Z;
      vel.y = -Math.abs(vel.y) * 0.75;
    }

    // 5. Flottaison et roulis (clapotis sur l'eau)
    const bobbing = Math.sin(t * 2.2 + pos.x * 0.2) * 0.8;
    groupRef.current.position.set(pos.x, WATER_Y + bobbing, pos.y);

    // Rotation synchronisée au roulement sur l'eau
    rotRef.current.x += vel.y * dt * 0.1;
    rotRef.current.z -= vel.x * dt * 0.1;
    rotRef.current.y += (vel.x + vel.y) * dt * 0.05;
    groupRef.current.rotation.set(
      rotRef.current.x + Math.sin(t * 1.8) * 0.05,
      rotRef.current.y,
      rotRef.current.z + Math.cos(t * 2.0) * 0.05
    );
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}
