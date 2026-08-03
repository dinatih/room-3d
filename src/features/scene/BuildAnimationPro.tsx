import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

const DROP_HEIGHT = 2000;
const FALL_MS_MIN = 400;
const FALL_MS_MAX = 800;
const STAGGER_MS  = 120;

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function getWorldToLocalYFactor(o: THREE.Object3D): number {
  const ws = new THREE.Vector3();
  o.getWorldScale(ws);
  return ws.y === 0 ? 1 : ws.y;
}

function isUtility(o: THREE.Object3D): boolean {
  return (
    o.userData?.isUtility ||
    o.name === 'GridHelper' ||
    o.name === 'AxesHelper' ||
    (o as any).isLight ||
    (o as any).isCamera
  );
}

function hasMesh(o: THREE.Object3D): boolean {
  let found = false;
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) found = true;
  });
  return found;
}

export function unmergeScene(scene: THREE.Scene) {
  const toHide: THREE.Mesh[] = [];
  const toRestore: THREE.Mesh[] = [];

  // 1. Cacher les merged statiques
  scene.traverse(m => {
    if ((m as THREE.Mesh).isMesh) {
      if (m.userData.isMergedStatic) {
        m.visible = false;
        toHide.push(m as THREE.Mesh);
      }
    }
  });

  // 2. Montrer les originaux (tous ceux dans isMergedSource)
  scene.traverse(o => {
    if (o.userData?.isMergedSource) {
      o.traverse(m => {
        if ((m as THREE.Mesh).isMesh && !m.userData.isMergedStatic) {
          m.visible = true;
          toRestore.push(m as THREE.Mesh);
        }
      });
    }
  });

  return () => {
    toHide.forEach(m => { m.visible = true; });
    toRestore.forEach(m => { m.visible = false; });
  };
}

function collectScene(scene: THREE.Scene) {
  const floor: THREE.Object3D[] = [];
  const skirting: THREE.Object3D[] = [];
  const pillars: THREE.Object3D[] = [];
  const walls: THREE.Object3D[] = [];
  const ikea: THREE.Object3D[] = [];
  const rest: THREE.Object3D[] = [];
  const ceiling: THREE.Object3D[] = [];
  
  const picked = new Set<THREE.Object3D>();

  function classify(o: THREE.Object3D): void {
    if (picked.has(o)) return;
    picked.add(o);

    let brickType = o.userData?.brickType as string | undefined;
    if (!brickType) {
      o.traverse(c => {
        if (!brickType && c.userData?.brickType) brickType = c.userData.brickType;
      });
    }
    if (!brickType && o.parent?.userData?.brickType) {
      brickType = o.parent.userData.brickType;
    }

    let isPillar = false;
    if (o.userData?.type === 'pillar') isPillar = true;
    else o.traverse(c => { if (c.userData?.type === 'pillar') isPillar = true; });

    if (brickType === 'ceiling') ceiling.push(o);
    else if (brickType === 'floor') floor.push(o);
    else if (brickType === 'wall' && isPillar) pillars.push(o);
    else if (brickType === 'wall') walls.push(o);
    else if (brickType === 'ground') { /* ignore */ }
    else if (brickType === 'skirting') skirting.push(o);
    else if (o.userData?.isIkea) ikea.push(o);
    else rest.push(o);
  }

  function visit(o: THREE.Object3D, depth: number): void {
    if (!o.visible || isUtility(o)) return;
    if (o.userData?.noAnim) return;

    if (o.userData?.isMergedSource || o.userData?.isMergedStatic || o.name?.startsWith('merged-')) {
      o.children.forEach(c => visit(c, depth + 1));
      return;
    }

    if (o.userData?.animUnit && hasMesh(o) && !picked.has(o)) {
      classify(o);
      console.log('COLLECTED animUnit:', o.userData);
      return;
    }

    const hasDirectMesh = o.children.some(c => (c as THREE.Mesh).isMesh);
    const hasAnimUnitChild = o.children.some(c => c.userData?.animUnit);
    if (depth >= 2 && hasDirectMesh && !hasAnimUnitChild && !picked.has(o)) {
      classify(o);
      console.log('COLLECTED directMesh:', o.userData);
      return;
    }

    let pureWrapper = true;
    if (!hasAnimUnitChild && ((o as THREE.Mesh).isMesh || o.children.some(c => (c as THREE.Mesh).isMesh))) {
      pureWrapper = false;
    }

    if (pureWrapper || depth < 2) {
      o.children.forEach(c => visit(c, depth + 1));
    } else if (!picked.has(o) && hasMesh(o)) {
      classify(o);
      console.log('COLLECTED wrapper:', o.userData);
    }
  }

  scene.children.forEach(child => visit(child, 0));
  return { floor, skirting, pillars, walls, ikea, rest, ceiling };
}

function shuffle<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

interface AnimObj {
  obj: THREE.Object3D;
  origLocalY: number;
  worldToLocalY: number;
  startTime: number;
  duration: number;
}

interface AnimState {
  objects: AnimObj[];
  totalEnd: number;
  startTime: number | null;
  remerge: () => void;
  finished: boolean;
}

export function BuildAnimationPro({ onFinish, onDuration }: { onFinish: () => void, onDuration?: (ms: number) => void }) {
  const { scene, invalidate } = useThree();
  const stateRef = useRef<AnimState | null>(null);

  useLayoutEffect(() => {
    (window as any).isAnimProRunning = true;
    const s3 = scene as unknown as THREE.Scene;
    
    // 1. D'abord on unmerge (ça cache les merged, ça montre les originaux)
    const remerge = unmergeScene(s3);

    // 2. Ensuite on collecte
    const { floor, skirting, pillars, walls, ikea, rest, ceiling } = collectScene(s3);

    // L'ordre demandé : plinthes/sol, piliers, ikea, reste, murs, plafond
    const allOrdered = [
      ...skirting,
      ...floor,
      ...shuffle(pillars),
      ...shuffle(ikea),
      ...shuffle(rest),
      ...shuffle(walls),
      ...ceiling,
    ];

    let cursor = 0;
    const objects = allOrdered.map(obj => {
      const entry: AnimObj = {
        obj,
        origLocalY: obj.position.y,
        worldToLocalY: getWorldToLocalYFactor(obj),
        startTime: cursor,
        duration: FALL_MS_MIN + Math.random() * (FALL_MS_MAX - FALL_MS_MIN),
      };
      cursor += STAGGER_MS;
      return entry;
    });

    const totalEnd = objects.length > 0 
      ? objects[objects.length - 1].startTime + objects[objects.length - 1].duration + 200 
      : 1000;
    
    onDuration?.(totalEnd);

    // 3. Décaler tout vers le HAUT
    objects.forEach(a => {
      const localDelta = DROP_HEIGHT * a.worldToLocalY;
      a.obj.position.y = a.origLocalY + localDelta;
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
      (window as any).isAnimProRunning = false;
      if (stateRef.current) {
        stateRef.current.objects.forEach(a => { a.obj.position.y = a.origLocalY; });
        stateRef.current.remerge();
      }
    };
  }, [scene, invalidate]);

  useFrame(() => {
    const st = stateRef.current;
    if (!st || st.finished) return;

    const now = performance.now();
    if (st.startTime === null) st.startTime = now;
    const elapsed = now - st.startTime;

    st.objects.forEach(a => {
      const raw = (elapsed - a.startTime) / a.duration;
      if (raw <= 0) return;
      const t = Math.min(raw, 1);
      
      const localDelta = DROP_HEIGHT * a.worldToLocalY * (1 - easeOutCubic(t));
      a.obj.position.y = a.origLocalY + localDelta;
    });

    invalidate();

    if (elapsed >= st.totalEnd) {
      st.finished = true;
      (window as any).isAnimProRunning = false;
      st.objects.forEach(a => { a.obj.position.y = a.origLocalY; });
      st.remerge();
      invalidate();
      onFinish();
    }
  });

  return null;
}
