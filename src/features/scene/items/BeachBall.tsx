/**
 * BeachBall.tsx — Ballon de plage gonflable 3D (beach_ball.glb)
 * Conforme aux directives du projet (SceneItemProps, scale 1 unité = 1 cm).
 * 
 * Flotte sur l'eau dans la baignoire avec ondulation naturelle, rebondit
 * doucement sur les parois intérieures et réagit au personnage ou aux
 * smart actions de la baignoire (onde de choc / poussée aquatique).
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { BATHTUB } from '../bathtubData';
import { cameraState } from '../cameraState';
import { OccupancyManager } from '../ai/occupancyManager';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';
import { HUMAN_BODY_RADIUS } from '../doorObstacles';
import { isAppIdle } from '../idleState';

// Limites intérieures strictes de la baignoire (coordonnées locales au groupe BATHTUB)
// Longueur totale = 150 (axe Z), Largeur = 70 (axe X), Paroi = 4cm
// Rayon du ballon = 12.5 cm (diamètre 25 cm pour loger confortablement dans la baignoire de 62cm intérieur)
const BALL_RADIUS = 12.5;
const INNER_RADIUS = BATHTUB.cornerRadius - BATHTUB.wallThickness - BALL_RADIUS;
const INNER_SEGMENT = BATHTUB.length / 2 - BATHTUB.cornerRadius;
const WATER_DRAG = 0.4; // amortissement par seconde
const WAVE_SPEED = 65; // cm/s, impulsion d'entrée dans l'eau
const RESTITUTION = 0.75;
const WATER_Y = BATHTUB.waterHeight;
const MAX_BALL_SPEED = 80; // Vitesse maximale en cm/s pour éviter les emballements physiques
const MAX_PHYSICS_DT = 0.05; // Seuil max de 50ms par frame pour absorber les pauses/inventaire

export function BeachBall({ onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item' | 'actionState'>>) {
  const { invalidate } = useThree();
  const { scene } = useGLTFClone('items/beach_ball.glb');
  const groupRef = useRef<THREE.Group>(null);

  // Position, vitesse et impulsion physique sur l'eau
  const posRef = useRef(new THREE.Vector2(0, 20)); // Centré en X, légèrement décalé en Z
  const velRef = useRef(new THREE.Vector2(0.8, -0.4)); // Légère dérive initiale
  const rotRef = useRef(new THREE.Vector3(0.2, 0.4, 0.1));

  // Écoute de l'état d'interaction de la baignoire (Valby ou autre dans l'eau)
  const occupantsRef = useRef(new Map<string, string>());
  const charLocalRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector2());

  useLayoutEffect(() => {
    if (!scene) return;
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const box = glbLocalBBox(scene);
    const rawSize = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
    if (!Number.isFinite(maxDim) || maxDim <= 0) throw new Error('Invalid beach ball geometry');

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

  useFrame((state, delta) => {
    if (!groupRef.current || isAppIdle()) return;
    const dt = Math.min(delta, MAX_PHYSICS_DT);
    const t = state.clock.elapsedTime;

    const pos = posRef.current;
    const vel = velRef.current;

    const tub = groupRef.current.parent!;
    if (!isPreview) {
      // Le menu hover et les scénarios IA réservent les mêmes slots.
      for (const slot of SMART_OBJECTS['bathtub-garden'].slots) {
        const occupant = OccupancyManager.getOccupant('bathtub-garden', slot.slotId);
        if (occupant && occupantsRef.current.get(slot.slotId) !== occupant) {
          const source = slot.offset ?? SMART_OBJECTS['bathtub-garden'].position;
          if (!source) throw new Error('Bathtub slot requires a world position');
          tub.worldToLocal(charLocalRef.current.set(...source));
          const direction = directionRef.current.set(pos.x - charLocalRef.current.x, pos.y - charLocalRef.current.z);
          if (direction.lengthSq() === 0) direction.set(0, 1);
          vel.addScaledVector(direction.normalize(), WAVE_SPEED);
        }
        if (occupant) occupantsRef.current.set(slot.slotId, occupant);
        else occupantsRef.current.delete(slot.slotId);
      }
      for (const character of Object.values(cameraState.positions)) {
        if (!character.anim) continue; // les animaux ne sont pas des baigneurs
        tub.worldToLocal(charLocalRef.current.set(character.x, character.y, character.z));
        if (charLocalRef.current.y > BATHTUB.height) continue;
        const direction = directionRef.current.set(pos.x - charLocalRef.current.x, pos.y - charLocalRef.current.z);
        const distance = direction.length();
        const contactRadius = BALL_RADIUS + HUMAN_BODY_RADIUS;
        if (distance < contactRadius) {
          if (distance === 0) direction.set(0, 1);
          vel.addScaledVector(direction.normalize(), WAVE_SPEED * (1 - distance / contactRadius) * dt);
        }
      }
    }

    // 3. Mise à jour position + frottement fluide de l'eau
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    vel.multiplyScalar(Math.exp(-WATER_DRAG * dt));

    // Ambiance douce d'eau (petite ondulation automatique résiduelle)
    vel.x += Math.sin(t * 1.5 + pos.y * 0.1) * 0.8 * dt;
    vel.y += Math.cos(t * 1.2 + pos.x * 0.1) * 0.8 * dt;

    // Plafonnement de sécurité de la vitesse physique
    vel.clampLength(0, MAX_BALL_SPEED);

    // Capsule intérieure : côtés droits et extrémités arrondies, moins le rayon du ballon.
    const centerZ = THREE.MathUtils.clamp(pos.y, -INNER_SEGMENT, INNER_SEGMENT);
    const normal = directionRef.current.set(pos.x, pos.y - centerZ);
    if (normal.length() > INNER_RADIUS) {
      normal.normalize();
      pos.set(normal.x * INNER_RADIUS, centerZ + normal.y * INNER_RADIUS);
      const outwardSpeed = vel.dot(normal);
      if (outwardSpeed > 0) vel.addScaledVector(normal, -(1 + RESTITUTION) * outwardSpeed);
      vel.clampLength(0, MAX_BALL_SPEED);
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
    invalidate();
  });

  return (
    <group name="beach-ball" ref={groupRef} userData={{ skipMerge: true, sceneItemRoot: true }}>
      <primitive object={scene} />
    </group>
  );
}
