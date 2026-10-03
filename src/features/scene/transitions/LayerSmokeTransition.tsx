/**
 * LayerSmokeTransition.tsx — Transition animée de calque avec nuage de fumée "Poof!"
 */
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SmokeParticles, type SmokeParticlesRef } from './SmokeParticles';
import {
  LAYER_STRUCTURE, LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_FURNISHINGS, LAYER_DECOR,
  LAYER_ANIMALS, LAYER_DOORS, LAYER_WALL_STRUCTURE,
} from '@config';
import type { LayerState } from '../sidepanel/types';

export const categoryLayerRegistry = new Map<number, THREE.Group>();

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

interface Transition {
  group: THREE.Group;
  type: 'in' | 'out';
  startTime: number;
  items: THREE.Object3D[];
}

export function LayerSmokeTransition({ layers }: { layers: LayerState }) {
  const { camera, invalidate } = useThree();
  const smokeRef = useRef<SmokeParticlesRef>(null!);
  const prevRef = useRef<Record<string, boolean>>({});
  const isMountRef = useRef(true);
  const activeTransitions = useRef<Transition[]>([]);

  useEffect(() => {
    camera.layers.enable(0);
    const smokeEnabled = layers.smokeTransition ?? true;
    const prev = prevRef.current;

    // Premier chargement : pas d'animation, synchronisation directe
    if (isMountRef.current) {
      isMountRef.current = false;
      Object.entries(ANIMATABLE_LAYERS).forEach(([k, layerId]) => {
        const val = !!(layers as any)[k];
        prev[k] = val;
        const group = categoryLayerRegistry.get(layerId);
        if (group) {
          group.visible = val;
        }
        if (val) camera.layers.enable(layerId);
        else camera.layers.disable(layerId);
      });
      return;
    }

    Object.entries(ANIMATABLE_LAYERS).forEach(([key, layerId]) => {
      const currentVal = !!(layers as any)[key];
      if (currentVal === prev[key]) return;
      prev[key] = currentVal;

      const group = categoryLayerRegistry.get(layerId);
      if (!group) return;

      // Si effet désactivé : toggle immédiat
      if (!smokeEnabled) {
        group.visible = currentVal;
        if (currentVal) camera.layers.enable(layerId);
        else camera.layers.disable(layerId);
        return;
      }

      // Nettoyer toute transition précédente pour ce groupe
      activeTransitions.current = activeTransitions.current.filter(t => {
        if (t.group === group) {
          t.items.forEach(item => item.scale.set(1, 1, 1));
          return false;
        }
        return true;
      });

      // Prendre les enfants directs visibles du groupe
      const items = group.children.filter(c => c.visible !== false);
      const box = new THREE.Box3();
      const pos = new THREE.Vector3();

      // Émettre la fumée sur chaque élément
      items.forEach(item => {
        box.setFromObject(item);
        if (!box.isEmpty()) {
          box.getCenter(pos);
          smokeRef.current?.triggerBurst(pos);
        }
      });

      if (!currentVal) {
        // Disparition : le groupe reste visible le temps du rétrécissement
        group.visible = true;
        camera.layers.enable(layerId);
        activeTransitions.current.push({
          group,
          type: 'out',
          startTime: performance.now(),
          items,
        });
      } else {
        // Apparition : le groupe redevient visible, items démarrent à 0
        group.visible = true;
        camera.layers.enable(layerId);
        items.forEach(c => c.scale.set(0.001, 0.001, 0.001));
        activeTransitions.current.push({
          group,
          type: 'in',
          startTime: performance.now(),
          items,
        });
      }
    });

    invalidate();
  }, [layers, camera, invalidate]);

  useFrame(() => {
    const transitions = activeTransitions.current;
    if (transitions.length === 0) return;

    const now = performance.now();
    let running = false;

    activeTransitions.current = transitions.filter(t => {
      const elapsed = (now - t.startTime) / 1000;

      if (t.type === 'out') {
        // Disparition en 0.18s
        if (elapsed < 0.18) {
          const s = Math.max(0.001, 1 - elapsed / 0.18);
          t.items.forEach(c => c.scale.set(s, s, s));
          running = true;
          return true;
        }
        // Fin : cacher le groupe et restaurer l'échelle pour la prochaine fois
        t.group.visible = false;
        t.items.forEach(c => c.scale.set(1, 1, 1));
        return false;
      } else {
        // Apparition en 0.25s avec rebond cartoon
        if (elapsed < 0.25) {
          const p = elapsed / 0.25;
          const s = Math.sin(p * Math.PI * 0.5) * (1 + 0.1 * Math.sin(p * Math.PI));
          t.items.forEach(c => c.scale.set(s, s, s));
          running = true;
          return true;
        }
        // Fin : échelle normale
        t.items.forEach(c => c.scale.set(1, 1, 1));
        return false;
      }
    });

    if (running) invalidate();
  });

  return <SmokeParticles ref={smokeRef} />;
}
