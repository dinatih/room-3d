/**
 * LayerSmokeTransition.tsx — Contrôleur de transition animé avec nuage de fumée "Poof!"
 *
 * Intercepte les basculements de calques (mobilier, équipements, décoration, animaux…)
 * et coordonne :
 *  1. Les gerbes de particules Cartoon "Poof!" centrées sur chaque meuble/objet.
 *  2. L'animation de rétrécissement (disparition) ou d'expansion élastique (apparition).
 *  3. La synchronisation de camera.layers pour un masquage net et propre.
 */
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SmokeParticles, type SmokeParticlesRef } from './SmokeParticles';
import {
  LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_FURNISHINGS, LAYER_DECOR,
  LAYER_NEIGHBORS, LAYER_LIDAR, LAYER_MIRRORS, LAYER_WALKER,
  LAYER_ANIMALS, LAYER_ENVIRONMENT,
  LAYER_WALL_STRUCTURE, LAYER_FLOOR_COVERINGS, LAYER_AI_ZONES,
  LAYER_DOORS, LAYER_GRASS,
} from '@config';
import type { LayerState } from '../sidepanel/types';

// Registre global partagé des groupes de chaque layer
export const categoryLayerRegistry = new Map<number, THREE.Group>();

interface AnimTarget {
  object: THREE.Object3D;
  origScale: THREE.Vector3;
  worldCenter: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
}

interface ActiveTransition {
  layerId: number;
  key: string;
  type: 'in' | 'out';
  startTime: number;
  targets: AnimTarget[];
}

const ANIMATABLE_LAYERS: Record<string, number> = {
  furniture:     LAYER_FURNITURE,
  equipment:     LAYER_EQUIPMENT,
  furnishings:   LAYER_FURNISHINGS,
  decor:         LAYER_DECOR,
  animals:       LAYER_ANIMALS,
  doors:         LAYER_DOORS,
  wallStructure: LAYER_WALL_STRUCTURE,
};

// Fonction pour extraire les objets clés d'un calque
function collectAnimTargets(root: THREE.Object3D): AnimTarget[] {
  const targets: AnimTarget[] = [];
  const units: THREE.Object3D[] = [];

  // Chercher en priorité les conteneurs animUnit
  root.traverse(obj => {
    if (obj.userData?.animUnit) {
      let p = obj.parent;
      let hasAncestor = false;
      while (p && p !== root) {
        if (p.userData?.animUnit) {
          hasAncestor = true;
          break;
        }
        p = p.parent;
      }
      if (!hasAncestor) {
        units.push(obj);
      }
    }
  });

  // Si aucun animUnit explicite, collecter les enfants avec meshes
  if (units.length === 0) {
    root.children.forEach(child => {
      let hasMesh = false;
      child.traverse(o => {
        if ((o as THREE.Mesh).isMesh) hasMesh = true;
      });
      if (hasMesh) units.push(child);
    });
  }

  units.forEach(unit => {
    const box = new THREE.Box3().setFromObject(unit);
    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);

      if (!unit.userData._smokeOrigScale) {
        unit.userData._smokeOrigScale = unit.scale.clone();
      }

      const radius = Math.max(14, Math.min(Math.max(size.x, size.z) * 0.45, 60));
      targets.push({
        object: unit,
        origScale: unit.userData._smokeOrigScale,
        worldCenter: center,
        size,
        radius,
      });
    }
  });

  return targets;
}

export function LayerSmokeTransition({ layers }: { layers: LayerState }) {
  const { camera, invalidate } = useThree();
  const smokeRef = useRef<SmokeParticlesRef>(null!);
  const prevLayersRef = useRef<Record<string, boolean>>({});
  const isInitialMountRef = useRef(true);

  // Transitions d'objets en cours
  const activeTransitionsRef = useRef<ActiveTransition[]>([]);

  // Synchronisation camera.layers
  useEffect(() => {
    camera.layers.enable(0);

    const smokeEnabled = layers.smokeTransition ?? true;
    const prev = prevLayersRef.current;

    // Détection du premier chargement : pas d'animation de fumée
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      // Enregistrer l'état initial
      Object.keys(ANIMATABLE_LAYERS).forEach(k => {
        prev[k] = !!(layers as any)[k];
      });

      // Configuration initiale standard des layers
      const toggles: [number, boolean][] = [
        [LAYER_STRUCTURE,       layers.structure],
        [LAYER_WALL_STRUCTURE,  layers.wallStructure ?? true],
        [LAYER_FLOOR_COVERINGS, layers.floorCoverings ?? true],
        [LAYER_DOORS,           layers.doors ?? true],
        [LAYER_AI_ZONES,        layers.aiZones ?? false],
        [LAYER_ENVIRONMENT,     layers.environment ?? true],
        [LAYER_GRASS,           layers.bermudaGrass ?? true],
        [LAYER_EQUIPMENT,       layers.equipment],
        [LAYER_FURNITURE,       layers.furniture],
        [LAYER_FURNISHINGS,     layers.furnishings],
        [LAYER_DECOR,           layers.decor],
        [LAYER_NEIGHBORS,       layers.neighbors],
        [LAYER_LIDAR,           layers.lidar],
        [LAYER_MIRRORS,         layers.mirrors],
        [LAYER_WALKER,          layers.walker],
        [LAYER_ANIMALS,         layers.animals ?? true],
      ];
      toggles.forEach(([l, visible]) => {
        if (visible) camera.layers.enable(l);
        else         camera.layers.disable(l);
      });
      invalidate();
      return;
    }

    // Gestion des calques non animés
    const nonAnimToggles: [number, boolean][] = [
      [LAYER_STRUCTURE,       layers.structure],
      [LAYER_FLOOR_COVERINGS, layers.floorCoverings ?? true],
      [LAYER_AI_ZONES,        layers.aiZones ?? false],
      [LAYER_ENVIRONMENT,     layers.environment ?? true],
      [LAYER_GRASS,           layers.bermudaGrass ?? true],
      [LAYER_NEIGHBORS,       layers.neighbors],
      [LAYER_LIDAR,           layers.lidar],
      [LAYER_MIRRORS,         layers.mirrors],
      [LAYER_WALKER,          layers.walker],
    ];
    nonAnimToggles.forEach(([l, visible]) => {
      if (visible) camera.layers.enable(l);
      else         camera.layers.disable(l);
    });

    // Détection des calques animables qui ont changé d'état
    Object.entries(ANIMATABLE_LAYERS).forEach(([key, layerId]) => {
      const currentVal = !!(layers as any)[key];
      const prevVal = prev[key] ?? currentVal;

      if (currentVal !== prevVal) {
        prev[key] = currentVal;

        if (!smokeEnabled) {
          // Si l'effet de fumée est désactivé : bascule instantanée
          if (currentVal) camera.layers.enable(layerId);
          else            camera.layers.disable(layerId);
          return;
        }

        const group = categoryLayerRegistry.get(layerId);
        const targets = group ? collectAnimTargets(group) : [];

        // Retirer toute transition en cours pour ce calque
        activeTransitionsRef.current = activeTransitionsRef.current.filter(t => {
          if (t.layerId === layerId) {
            // Nettoyage immédiat
            t.targets.forEach(tgt => {
              tgt.object.visible = true;
              tgt.object.scale.copy(tgt.origScale);
            });
            return false;
          }
          return true;
        });

        if (targets.length === 0) {
          // Aucun objet 3D détecté, toggle direct
          if (currentVal) camera.layers.enable(layerId);
          else            camera.layers.disable(layerId);
          return;
        }

        const now = performance.now();

        if (!currentVal) {
          // ── DISPARITION (OFF) ──
          // 1. Garder le layer visible dans la caméra pendant l'animation
          camera.layers.enable(layerId);

          // 2. Déclencher le nuage de fumée "Poof!" sur chaque meuble
          if (smokeRef.current) {
            smokeRef.current.triggerMultiBurst(
              targets.map(t => ({ pos: t.worldCenter, radius: t.radius }))
            );
          }

          // 3. Enregistrer la transition
          activeTransitionsRef.current.push({
            layerId,
            key,
            type: 'out',
            startTime: now,
            targets,
          });
        } else {
          // ── APPARITION (ON) ──
          // 1. Activer le calque dans la caméra
          camera.layers.enable(layerId);

          // 2. Initialiser tous les objets à échelle quasi-nulle (masqués)
          targets.forEach(t => {
            t.object.visible = true;
            t.object.scale.set(0.001, 0.001, 0.001);
          });

          // 3. Déclencher le nuage de fumée "Poof!"
          if (smokeRef.current) {
            smokeRef.current.triggerMultiBurst(
              targets.map(t => ({ pos: t.worldCenter, radius: t.radius }))
            );
          }

          // 4. Enregistrer la transition
          activeTransitionsRef.current.push({
            layerId,
            key,
            type: 'in',
            startTime: now,
            targets,
          });
        }
      }
    });

    invalidate();
  }, [layers, camera, invalidate]);

  // Boucle d'animation R3F pour animer les échelles des objets
  useFrame((_state) => {
    const transitions = activeTransitionsRef.current;
    if (transitions.length === 0) return;

    const now = performance.now();
    let hasRunning = false;

    activeTransitionsRef.current = transitions.filter(t => {
      const elapsed = (now - t.startTime) / 1000; // secondes

      if (t.type === 'out') {
        // DISPARITION : 
        // 0 -> 0.05s : petit anticipation pop (1.0 -> 1.08)
        // 0.05 -> 0.18s : écrasement rapide vers 0 au pic de fumée
        // >= 0.18s : masquage de l'objet
        // >= 0.55s : fin de transition et désactivation du layer Three.js
        if (elapsed < 0.05) {
          const s = 1.0 + (elapsed / 0.05) * 0.08;
          t.targets.forEach(tgt => tgt.object.scale.copy(tgt.origScale).multiplyScalar(s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.18) {
          const p = (elapsed - 0.05) / 0.13;
          const s = Math.max(0.001, 1.08 * (1 - p));
          t.targets.forEach(tgt => tgt.object.scale.copy(tgt.origScale).multiplyScalar(s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.55) {
          t.targets.forEach(tgt => {
            tgt.object.visible = false;
          });
          hasRunning = true;
          return true;
        } else {
          // Fin de la transition de disparition
          t.targets.forEach(tgt => {
            tgt.object.visible = true;
            tgt.object.scale.copy(tgt.origScale);
          });
          camera.layers.disable(t.layerId);
          return false;
        }
      } else {
        // APPARITION :
        // 0 -> 0.08s : les objets restent à scale 0 au cœur de la fumée qui jaillit
        // 0.08 -> 0.28s : pop cartoon dynamique (easeOutBack) de 0 à 1.08
        // 0.28 -> 0.35s : stabilisation à 1.00
        if (elapsed < 0.08) {
          t.targets.forEach(tgt => tgt.object.scale.set(0.001, 0.001, 0.001));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.28) {
          const p = (elapsed - 0.08) / 0.20;
          // Courbe easeOutBack pour un rebond cartoon
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const easeBack = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
          const s = Math.max(0.001, easeBack);
          t.targets.forEach(tgt => tgt.object.scale.copy(tgt.origScale).multiplyScalar(s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.35) {
          const p = (elapsed - 0.28) / 0.07;
          const s = THREE.MathUtils.lerp(1.08, 1.0, p);
          t.targets.forEach(tgt => tgt.object.scale.copy(tgt.origScale).multiplyScalar(s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.55) {
          t.targets.forEach(tgt => tgt.object.scale.copy(tgt.origScale));
          hasRunning = true;
          return true;
        } else {
          // Fin de transition d'apparition
          t.targets.forEach(tgt => tgt.object.scale.copy(tgt.origScale));
          return false;
        }
      }
    });

    if (hasRunning) {
      invalidate();
    }
  });

  return <SmokeParticles ref={smokeRef} />;
}
