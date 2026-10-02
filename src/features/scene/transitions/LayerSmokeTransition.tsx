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
  origPos: THREE.Vector3;
  localCenter: THREE.Vector3;
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
  structure:     LAYER_STRUCTURE,
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
      if (!unit.userData._smokeOrigPos) {
        unit.userData._smokeOrigPos = unit.position.clone();
      }

      let localCenter: THREE.Vector3;
      if (unit.parent) {
        unit.parent.updateWorldMatrix(true, false);
        localCenter = unit.parent.worldToLocal(center.clone());
      } else {
        localCenter = center.clone();
      }

      const radius = Math.max(14, Math.min(Math.max(size.x, size.z) * 0.45, 60));
      targets.push({
        object: unit,
        origScale: unit.userData._smokeOrigScale,
        origPos: unit.userData._smokeOrigPos,
        localCenter,
        worldCenter: center,
        size,
        radius,
      });
    }
  });

  return targets;
}

// Calcule les points d'émission de fumée (points multiples si grande surface comme dalle/plafond)
function getSmokeBurstPoints(targets: AnimTarget[]): { pos: THREE.Vector3; radius: number }[] {
  const points: { pos: THREE.Vector3; radius: number }[] = [];

  targets.forEach(tgt => {
    const { worldCenter, size, radius } = tgt;
    const isLarge = size.x > 180 || size.z > 180;

    if (!isLarge) {
      points.push({ pos: worldCenter, radius });
      return;
    }

    // Répartition multi-poof sur la zone couverte par la dalle ou le plafond
    const xCoords = [60, 150, 240];
    const zCoords = [60, 180, 300];
    xCoords.forEach(x => {
      zCoords.forEach(z => {
        points.push({
          pos: new THREE.Vector3(x, worldCenter.y, z),
          radius: 45,
        });
      });
    });
  });

  return points;
}

function applyScaleToTarget(tgt: AnimTarget, s: number) {
  tgt.object.scale.copy(tgt.origScale).multiplyScalar(s);
  // Scaling centré sur le centre géométrique de l'objet
  tgt.object.position.copy(tgt.localCenter).addScaledVector(
    tgt.origPos.clone().sub(tgt.localCenter),
    s
  );
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
          const grp = categoryLayerRegistry.get(layerId);
          if (grp) grp.visible = currentVal;
          return;
        }

        const group = categoryLayerRegistry.get(layerId);
        const targets = group ? collectAnimTargets(group) : [];

        // Retirer toute transition en cours pour ce calque
        activeTransitionsRef.current = activeTransitionsRef.current.filter(t => {
          if (t.layerId === layerId) {
            // Nettoyage immédiat
            t.targets.forEach(tgt => {
              tgt.object.visible = currentVal;
              tgt.object.scale.copy(tgt.origScale);
              tgt.object.position.copy(tgt.origPos);
            });
            return false;
          }
          return true;
        });

        if (targets.length === 0) {
          // Aucun objet 3D détecté, toggle direct
          if (currentVal) camera.layers.enable(layerId);
          else            camera.layers.disable(layerId);
          if (group) group.visible = currentVal;
          return;
        }

        const now = performance.now();
        const burstPoints = getSmokeBurstPoints(targets);

        if (!currentVal) {
          // ── DISPARITION (OFF) ──
          // 1. Garder le layer visible dans la caméra pendant l'animation
          camera.layers.enable(layerId);
          if (group) group.visible = true;

          // 2. Déclencher le nuage de fumée "Poof!"
          if (smokeRef.current) {
            smokeRef.current.triggerMultiBurst(burstPoints);
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
          if (group) group.visible = true;

          // 2. Initialiser tous les objets à échelle quasi-nulle (masqués)
          targets.forEach(t => {
            t.object.visible = true;
            applyScaleToTarget(t, 0.001);
          });

          // 3. Déclencher le nuage de fumée "Poof!"
          if (smokeRef.current) {
            smokeRef.current.triggerMultiBurst(burstPoints);
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
          t.targets.forEach(tgt => applyScaleToTarget(tgt, s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.18) {
          const p = (elapsed - 0.05) / 0.13;
          const s = Math.max(0.001, 1.08 * (1 - p));
          t.targets.forEach(tgt => applyScaleToTarget(tgt, s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.55) {
          t.targets.forEach(tgt => {
            tgt.object.visible = false;
          });
          hasRunning = true;
          return true;
        } else {
          // Fin de la transition de disparition : on laisse invisible !
          t.targets.forEach(tgt => {
            tgt.object.visible = false;
            tgt.object.scale.copy(tgt.origScale);
            tgt.object.position.copy(tgt.origPos);
          });
          const grp = categoryLayerRegistry.get(t.layerId);
          if (grp) grp.visible = false;
          camera.layers.disable(t.layerId);
          return false;
        }
      } else {
        // APPARITION :
        // 0 -> 0.08s : les objets restent à scale 0 au cœur de la fumée qui jaillit
        // 0.08 -> 0.28s : pop cartoon dynamique (easeOutBack) de 0 à 1.08
        // 0.28 -> 0.35s : stabilisation à 1.00
        if (elapsed < 0.08) {
          t.targets.forEach(tgt => applyScaleToTarget(tgt, 0.001));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.28) {
          const p = (elapsed - 0.08) / 0.20;
          // Courbe easeOutBack pour un rebond cartoon
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const easeBack = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
          const s = Math.max(0.001, easeBack);
          t.targets.forEach(tgt => applyScaleToTarget(tgt, s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.35) {
          const p = (elapsed - 0.28) / 0.07;
          const s = THREE.MathUtils.lerp(1.08, 1.0, p);
          t.targets.forEach(tgt => applyScaleToTarget(tgt, s));
          hasRunning = true;
          return true;
        } else if (elapsed < 0.55) {
          t.targets.forEach(tgt => {
            tgt.object.scale.copy(tgt.origScale);
            tgt.object.position.copy(tgt.origPos);
          });
          hasRunning = true;
          return true;
        } else {
          // Fin de transition d'apparition
          t.targets.forEach(tgt => {
            tgt.object.scale.copy(tgt.origScale);
            tgt.object.position.copy(tgt.origPos);
          });
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
