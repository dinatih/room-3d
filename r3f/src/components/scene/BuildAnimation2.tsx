/**
 * BuildAnimation2.tsx — "Tombée du ciel" un par un.
 *
 * Chaque objet visible tombe lentement du ciel, l'un après l'autre.
 * Ordre : mobilier / équipement en premier (ordre aléatoire), structure
 * (murs, sol) en dernier.
 *
 * Algorithme de collecte : traversal BFS du graphe Three.js. On s'arrête
 * à la première branche ayant des meshes directs (hasMesh direct) — c'est
 * le "composant racine". On ne descend pas plus loin pour éviter la double
 * animation parent + enfant. Les groupes intermédiaires (wrappers de
 * visibilité) sont traversés transparentement.
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ── Constantes ────────────────────────────────────────────────────────────────

const DROP_HEIGHT  = 2000;  // cm au-dessus de la position finale
const STAGGER_MS   = 250;   // délai entre deux départs consécutifs (ms)
const FALL_MS_MIN  = 1400;  // durée de chute minimale par objet (ms)
const FALL_MS_MAX  = 2000;  // durée de chute maximale

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Collecte ──────────────────────────────────────────────────────────────────

type AnimObj = {
  obj:       THREE.Object3D;
  origY:     number;
  startTime: number;  // ms depuis le début
  duration:  number;
};

/** Vrai si o possède au moins un Mesh en enfant direct. */
function hasDirectMesh(o: THREE.Object3D): boolean {
  return o.children.some(c => (c as THREE.Mesh).isMesh);
}

/** Vrai si o est ou contient un Mesh (récursif). */
function hasMesh(o: THREE.Object3D): boolean {
  if ((o as THREE.Mesh).isMesh) return true;
  return o.children.some(hasMesh);
}

/**
 * Vrai si cet objet est un "composant terminal" : on peut l'animer en bloc.
 * Un groupe composite (ex: Furnishings) a des meshes directs ET des sous-groupes
 * avec géométrie — dans ce cas il faut descendre pour trouver les items individuels.
 */
function isLeafComponent(o: THREE.Object3D): boolean {
  if ((o as THREE.Mesh).isMesh) return true;
  const direct = hasDirectMesh(o);
  if (!direct) return false;
  // Si un enfant non-mesh contient lui-même des meshes → groupe composite → ne pas capturer
  const hasSubComponents = o.children.some(c => !(c as THREE.Mesh).isMesh && hasMesh(c));
  return !hasSubComponents;
}

function isUtility(o: THREE.Object3D): boolean {
  return !!((o as any).isLight || (o as any).isCamera || (o as any).isHelper);
}

function depthFrom(o: THREE.Object3D, root: THREE.Object3D): number {
  let d = 0, cur: THREE.Object3D | null = o.parent;
  while (cur && cur !== root) { d++; cur = cur.parent; }
  return d;
}

/**
 * Collecte un objet par branche visuelle.
 * Sépare structure (layer 0 pur = murs/sol) du mobilier (layer 1 = LayerGroup).
 */
function collect(scene: THREE.Scene): { furniture: THREE.Object3D[]; structure: THREE.Object3D[] } {
  const furniture: THREE.Object3D[] = [];
  const structure: THREE.Object3D[] = [];
  const picked = new Set<THREE.Object3D>();

  function visit(o: THREE.Object3D): void {
    if (!o.visible || isUtility(o)) return;

    // Ne pas redescendre sous un ancêtre déjà sélectionné
    let cur: THREE.Object3D | null = o.parent;
    while (cur && cur !== scene) {
      if (picked.has(cur)) return;
      cur = cur.parent;
    }

    const depth = depthFrom(o, scene);

    const isRoot = depth >= 2 && depth <= 7 && isLeafComponent(o);

    if (isRoot) {
      picked.add(o);
      // Les objets dans LayerGroup (layer 1 activé) = mobilier ; sinon structure
      if (o.layers.isEnabled(1)) {
        furniture.push(o);
      } else {
        structure.push(o);
      }
    } else {
      o.children.forEach(visit);
    }
  }

  scene.children.forEach(visit);
  return { furniture, structure };
}

/** Fisher-Yates shuffle in place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function BuildAnimation2({ onFinish }: { onFinish: () => void }) {
  const { scene, invalidate } = useThree();

  useEffect(() => {
    const { furniture, structure } = collect(scene as unknown as THREE.Scene);

    // Mobilier en ordre aléatoire, puis structure (murs / sol) en dernier
    const ordered = [...shuffle(furniture), ...structure];

    // Assigner les temps de départ séquentiels
    const objects: AnimObj[] = ordered.map((obj, i) => ({
      obj,
      origY:     obj.position.y,
      startTime: i * STAGGER_MS,
      duration:  FALL_MS_MIN + Math.random() * (FALL_MS_MAX - FALL_MS_MIN),
    }));

    const totalEnd = objects.length > 0
      ? objects[objects.length - 1].startTime + objects[objects.length - 1].duration + 100
      : 1000;

    // Placer tout en l'air
    objects.forEach(a => { a.obj.position.y = a.origY + DROP_HEIGHT; });
    invalidate();

    let start: number | null = null;
    let raf: number;

    function tick(now: number) {
      if (start === null) start = now;
      const elapsed = now - start;

      objects.forEach(a => {
        const raw = (elapsed - a.startTime) / a.duration;
        if (raw <= 0) return;
        const t = Math.min(raw, 1);
        a.obj.position.y = a.origY + DROP_HEIGHT * (1 - easeOutCubic(t));
      });

      invalidate();

      if (elapsed < totalEnd) {
        raf = requestAnimationFrame(tick);
      } else {
        objects.forEach(a => { a.obj.position.y = a.origY; });
        invalidate();
        onFinish();
      }
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      objects.forEach(a => { a.obj.position.y = a.origY; });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
