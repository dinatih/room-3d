/**
 * BuildAnimation3.tsx — "Tombée du ciel" variante 2.
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
  fromBelow: boolean; // sol : monte d'en bas ; sinon tombe d'en haut
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

const _bbox = new THREE.Box3();
const _size = new THREE.Vector3();

/** Vérifie récursivement le userData.brickType. */
function hasBrickType(o: THREE.Object3D, type: string): boolean {
  if (o.userData?.brickType === type) return true;
  return o.children.some(c => hasBrickType(c, type));
}

/**
 * Détecte le plafond via userData.brickType === 'ceiling'.
 */
function isCeilingLike(o: THREE.Object3D): boolean {
  return hasBrickType(o, 'ceiling');
}

/**
 * Détecte le sol : bounding box large (> 200 en X et Z), plate (Y < 30) et basse (centerY < 50).
 */
function isFloorLike(o: THREE.Object3D): boolean {
  _bbox.setFromObject(o);
  _bbox.getSize(_size);
  if (_size.y >= 30 || _size.x < 200 || _size.z < 200) return false;
  const centerY = (_bbox.min.y + _bbox.max.y) / 2;
  return centerY < 50;
}

/**
 * Collecte un objet par branche visuelle.
 * Sépare : sol (monte d'en bas), mobilier (tombe d'en haut), structure/murs (tombe en dernier).
 */
function collect(scene: THREE.Scene): {
  floor:     THREE.Object3D[];
  furniture: THREE.Object3D[];
  structure: THREE.Object3D[];
  ceiling:   THREE.Object3D[];
} {
  const floor:     THREE.Object3D[] = [];
  const furniture: THREE.Object3D[] = [];
  const structure: THREE.Object3D[] = [];
  const ceiling:   THREE.Object3D[] = [];
  const picked = new Set<THREE.Object3D>();

  function visit(o: THREE.Object3D): void {
    if (!o.visible || isUtility(o)) return;

    let cur: THREE.Object3D | null = o.parent;
    while (cur && cur !== scene) {
      if (picked.has(cur)) return;
      cur = cur.parent;
    }

    const depth = depthFrom(o, scene);
    const isRoot = depth >= 2 && depth <= 7 && isLeafComponent(o);

    if (isRoot) {
      picked.add(o);
      if (o.layers.isEnabled(1)) {
        furniture.push(o);
      } else if (isCeilingLike(o)) {
        ceiling.push(o);
      } else if (isFloorLike(o)) {
        floor.push(o);
      } else {
        structure.push(o);
      }
    } else {
      o.children.forEach(visit);
    }
  }

  scene.children.forEach(visit);
  return { floor, furniture, structure, ceiling };
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

export function BuildAnimation3({ onFinish, onDuration }: { onFinish: () => void; onDuration?: (ms: number) => void }) {
  const { scene, invalidate } = useThree();

  useEffect(() => {
    const { floor, furniture, structure, ceiling } = collect(scene as unknown as THREE.Scene);

    // Ordre : sol (monte d'en bas) → mobilier aléatoire → murs → plafond en tout dernier (tombe d'en haut)
    const allOrdered = [
      ...floor,
      ...shuffle(furniture),
      ...structure,
      ...ceiling,
    ];

    const floorSet   = new Set(floor);
    const objects: AnimObj[] = allOrdered.map((obj, i) => ({
      obj,
      origY:     obj.position.y,
      startTime: i * STAGGER_MS,
      duration:  FALL_MS_MIN + Math.random() * (FALL_MS_MAX - FALL_MS_MIN),
      fromBelow: floorSet.has(obj),
    }));

    const totalEnd = objects.length > 0
      ? objects[objects.length - 1].startTime + objects[objects.length - 1].duration + 100
      : 1000;

    onDuration?.(totalEnd);

    // Positionner : sol en bas, tout le reste en l'air
    objects.forEach(a => {
      a.obj.position.y = a.fromBelow
        ? a.origY - DROP_HEIGHT
        : a.origY + DROP_HEIGHT;
    });
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
        const offset = DROP_HEIGHT * (1 - easeOutCubic(t));
        a.obj.position.y = a.fromBelow
          ? a.origY - offset
          : a.origY + offset;
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
