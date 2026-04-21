/**
 * KallaxStack.tsx — Les 4 tours Kallax telles qu'empilées dans la scène.
 * Fidèle à Furniture.tsx (mêmes positions relatives, mêmes rotations internes).
 * Coordonnées locales : Y=0 = sol. Centrage XZ laissé à CenteredItem (inventaire).
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Kallax2x1 } from './Kallax2x1';
import { Kallax2x2 } from './Kallax2x2';
import { Kallax1x1 } from './Kallax1x1';
import { NOOP_STATE, NOOP_SIZE } from '../../../utils/sceneItem';
import type { SceneItemProps } from '../../../types';

// Constantes identiques à Furniture.tsx / Kallax.tsx
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const w1 = tw(1);  // 40.5
const w2 = tw(2);  // 75.5
const h1 = th(1);  // 41
const h2 = th(2);  // 76.5

function k(id: string) { return { id } as any; }

// ── Tour NE — 2×1 bas + 2×2 haut ─────────────────────────────────────────────

function StackNE() {
  return (
    <>
      <group position={[0, h1, 0]}>
        <Kallax2x1 item={k('kallax-ne-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[0, h1 + h2, 0]}>
        <Kallax2x2 item={k('kallax-ne-2x2')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Tour SW — 2×2 + 2×2 spec + 2×1 ──────────────────────────────────────────

function StackSW() {
  return (
    <>
      <group position={[0, h2, 0]}>
        <Kallax2x2 item={k('kallax-sw-2x2')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[0, h2 + h2, 0]}>
        <Kallax2x2 item={k('kallax-sw-2x2-spec')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[0, h2 + h2 + h1, 0]}>
        <Kallax2x1 item={k('kallax-sw-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Tour SE — 2× (2×1 pivotés rotation Z) ────────────────────────────────────

function StackSE() {
  const px = -h1 / 2;
  return (
    <>
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-se-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[px, w2 / 2 + w2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-se-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Tour NW — 2×1 + 1×1 + 1×1 pivotés ───────────────────────────────────────

function StackNW() {
  const px = -h1 / 2;
  return (
    <>
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-nw-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[px, w2 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax1x1 item={k('kallax-nw-1x1-a')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[px, w2 + w1 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax1x1 item={k('kallax-nw-1x1-b')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const STACKS: Record<string, React.ComponentType> = {
  'kallax-ne-stack': StackNE,
  'kallax-sw-stack': StackSW,
  'kallax-se-stack': StackSE,
  'kallax-nw-stack': StackNW,
};

export function KallaxStack({ item: it, onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  const Stack = STACKS[it.id];
  if (!Stack) return null;

  return <group ref={ref}><Stack /></group>;
}
