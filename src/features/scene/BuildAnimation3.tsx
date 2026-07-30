/**
 * BuildAnimation3.tsx — "Tombée du ciel" variante 2.
 *
 * Chaque objet visible tombe lentement du ciel, l'un après l'autre.
 * Ordre : mobilier / équipement (aléatoire) → murs → sol (remonte d'en bas)
 *         → plafond en tout dernier.
 *
 * Algorithme de collecte (v3) :
 *   On traverse la scène et on cible les nœuds qui ont un `parent` direct
 *   dans la scène ou dans un groupe de catégorie (CategoryLayerGroup /
 *   wrapper visible), EN COORDONNÉES MONDE.
 *
 *   Principe clé : on travaille toujours en coordonnées MONDE.
 *     • origWorldY   = getWorldPosition().y  (sauvegarde)
 *     • Pour animer on écrit : obj.position.y += delta en LOCAL,
 *       en convertissant le delta via la matrice monde inverse du parent.
 *
 *   Les « groupes racines de placement » sont les groupes dont le parent
 *   immédiat est un groupe de catégorie (layer) ou la scène elle-même, et
 *   qui contiennent au moins un Mesh visible.
 */
import { useRef, useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Constantes ────────────────────────────────────────────────────────────────

const DROP_HEIGHT = 2000;  // cm (en coordonnées monde)
const STAGGER_MS  = 110;
const FALL_MS_MIN = 600;
const FALL_MS_MAX = 950;

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Type ──────────────────────────────────────────────────────────────────────

type AnimObj = {
  obj:        THREE.Object3D;
  /** Position Y locale originale (avant animation). */
  origLocalY: number;
  /** Facteur de conversion : 1 unité monde → unités locales sur Y.
   *  En pratique = 1 sauf si un ancêtre scale Y. */
  worldToLocalY: number;
  startTime:  number;
  duration:   number;
  fromBelow:  boolean;
};

// ── Utilitaires ───────────────────────────────────────────────────────────────

function isUtility(o: THREE.Object3D): boolean {
  return !!((o as any).isLight || (o as any).isCamera || (o as any).isHelper);
}

function hasMesh(o: THREE.Object3D): boolean {
  if ((o as THREE.Mesh).isMesh) return true;
  return o.children.some(hasMesh);
}

/** Retourne le facteur de conversion monde→local sur l'axe Y pour un objet.
 *  Calcule via deux points monde convertis en local. */
function getWorldToLocalYFactor(o: THREE.Object3D): number {
  if (!o.parent) return 1;
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(0, 1, 0);
  o.parent.worldToLocal(p0);
  o.parent.worldToLocal(p1);
  const factor = Math.abs(p1.y - p0.y);
  return factor > 0.0001 ? factor : 1;
}

// ── Helpers merge temporaire ─────────────────────────────────────────────────

/**
 * Annule temporairement le MergedStaticGroup pour l'animation :
 * restaure les meshes originaux et cache les meshes fusionnés.
 * Retourne une fonction de rétablissement.
 */
function unmergeScene(scene: THREE.Scene): () => void {
  const toHide:   THREE.Mesh[] = [];
  const toRestore: THREE.Mesh[] = [];

  scene.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (m.userData.isMergedStatic) {
      m.visible = false;
      toHide.push(m);
    } else if (m.userData.wasMerged) {
      m.visible = true;
      toRestore.push(m);
    }
  });

  return () => {
    // Rétablir l'état fusionné normal
    toHide.forEach(m    => { m.visible = true;  });
    toRestore.forEach(m => { m.visible = false; });
  };
}

// ── Collecte principale ───────────────────────────────────────────────────────

/**
 * Sélectionne les nœuds « unité d'animation » :
 *  - Groupes dont le parent est la scène ou un CategoryLayerGroup (wrapper sans mesh propre)
 *  - Ou nœuds marqués animUnit
 *  - Le nœud doit contenir au moins un mesh visible
 *
 * On classifie par brickType trouvé dans le sous-arbre.
 */
function collectScene(scene: THREE.Scene): {
  furniture: THREE.Object3D[];
  walls:     THREE.Object3D[];
  floor:     THREE.Object3D[];
  ceiling:   THREE.Object3D[];
} {
  const furniture: THREE.Object3D[] = [];
  const walls:     THREE.Object3D[] = [];
  const floor:     THREE.Object3D[] = [];
  const ceiling:   THREE.Object3D[] = [];
  const picked = new Set<THREE.Object3D>();

  /** Vrai si le nœud est un pur wrapper (pas de mesh direct) —
   *  CategoryLayerGroup, group visible plan, etc. */
  function isPureWrapper(o: THREE.Object3D): boolean {
    if ((o as THREE.Mesh).isMesh) return false;
    return !o.children.some((c) => (c as THREE.Mesh).isMesh);
  }

  function visit(o: THREE.Object3D, depth: number): void {
    if (!o.visible || isUtility(o)) return;
    if (o.userData?.noAnim) return;

    // Si on croise un MergedStaticGroup (ou source/destination), toujours descendre dans les enfants
    if (o.userData?.isMergedSource || o.userData?.isMergedStatic || o.name?.startsWith('merged-')) {
      o.children.forEach((c) => visit(c, depth + 1));
      return;
    }

    // Nœud explicitement marqué comme unité d'animation
    if (o.userData?.animUnit && hasMesh(o) && !picked.has(o)) {
      classify(o);
      return;
    }

    // Groupe conteneur / unité de placement (depth >= 2) qui contient un mesh direct
    const hasDirectMesh = o.children.some((c) => (c as THREE.Mesh).isMesh);
    if (depth >= 2 && hasDirectMesh && !picked.has(o)) {
      classify(o);
      return;
    }

    // Descendre dans tous les wrappers et groupes conteneurs
    if (isPureWrapper(o) || depth < 2) {
      o.children.forEach((c) => visit(c, depth + 1));
    } else if (!picked.has(o) && hasMesh(o)) {
      classify(o);
    }
  }

  function classify(o: THREE.Object3D): void {
    if (picked.has(o)) return;
    picked.add(o);

    // Chercher brickType dans le nœud et ses ancêtres proches
    let brickType: string | undefined = o.userData?.brickType as string | undefined;
    if (!brickType) {
      o.traverse((c) => {
        if (!brickType && c.userData?.brickType) brickType = c.userData.brickType as string;
      });
    }
    if (!brickType && o.parent?.userData?.brickType) {
      brickType = o.parent.userData.brickType as string;
    }

    if      (brickType === 'ceiling') ceiling.push(o);
    else if (brickType === 'floor')   floor.push(o);
    else if (brickType === 'wall')    walls.push(o);
    else if (brickType === 'ground')  { /* sol extérieur — ignorer */ }
    else if (brickType === 'skirting') { /* plinthes — ignorer */ }
    else                              furniture.push(o);
  }

  scene.children.forEach((child) => visit(child, 0));
  return { furniture, walls, floor, ceiling };
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function BuildAnimation3({
  onFinish,
  onDuration,
}: {
  onFinish: () => void;
  onDuration?: (ms: number) => void;
}) {
  const { scene, invalidate } = useThree();
  const stateRef = useRef<{
    objects: AnimObj[];
    totalEnd: number;
    startTime: number | null;
    remerge: () => void;
    finished: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    const s3 = scene as unknown as THREE.Scene;
    const remerge = unmergeScene(s3);
    s3.updateMatrixWorld(true);

    const { furniture, walls, floor, ceiling } = collectScene(s3);
    const floorSet = new Set(floor);
    const allOrdered = [
      ...walls,
      ...shuffle(furniture),
      ...floor,
      ...ceiling,
    ];

    let cursor = 0;
    const objects: AnimObj[] = allOrdered.map((obj) => {
      const worldToLocalY = getWorldToLocalYFactor(obj);
      const entry: AnimObj = {
        obj,
        origLocalY:    obj.position.y,
        worldToLocalY,
        startTime:     cursor,
        duration:      FALL_MS_MIN + Math.random() * (FALL_MS_MAX - FALL_MS_MIN),
        fromBelow:     floorSet.has(obj),
      };
      cursor += STAGGER_MS;
      return entry;
    });

    const totalEnd =
      objects.length > 0
        ? objects[objects.length - 1].startTime +
          objects[objects.length - 1].duration +
          200
        : 1000;

    onDuration?.(totalEnd);

    // Décaler tous les objets au départ
    objects.forEach((a) => {
      const localDelta = DROP_HEIGHT * a.worldToLocalY;
      a.obj.position.y = a.fromBelow
        ? a.origLocalY - localDelta
        : a.origLocalY + localDelta;
    });

    stateRef.current = {
      objects,
      totalEnd,
      startTime: null,
      remerge,
      finished: false,
    };
    invalidate();

    return () => {
      if (stateRef.current) {
        stateRef.current.objects.forEach((a) => { a.obj.position.y = a.origLocalY; });
        stateRef.current.remerge();
      }
    };
  }, [scene, invalidate, onDuration]);

  useFrame(() => {
    const st = stateRef.current;
    if (!st || st.finished) return;

    const now = performance.now();
    if (st.startTime === null) st.startTime = now;
    const elapsed = now - st.startTime;

    st.objects.forEach((a) => {
      const raw = (elapsed - a.startTime) / a.duration;
      if (raw <= 0) return;
      const t           = Math.min(raw, 1);
      const localDelta  = DROP_HEIGHT * a.worldToLocalY * (1 - easeOutCubic(t));
      a.obj.position.y  = a.fromBelow
        ? a.origLocalY - localDelta
        : a.origLocalY + localDelta;
    });

    invalidate();

    if (elapsed >= st.totalEnd) {
      st.finished = true;
      st.objects.forEach((a) => { a.obj.position.y = a.origLocalY; });
      st.remerge();
      invalidate();
      onFinish();
    }
  });

  return null;
}
