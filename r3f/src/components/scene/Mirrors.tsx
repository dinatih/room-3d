/**
 * Mirrors.tsx — Miroirs Nissedal avec THREE.Reflector (fidèle à mirrors.js).
 *
 * MeshReflectorMaterial (drei) double-applique le tone mapping ACESFilmic
 * sur la texture de reflet → reflets trop sombres. On utilise THREE.Reflector
 * directement, identique au vanilla.
 *
 * Mur D : 3× Nissedal 60×60cm (empilés verticalement)
 * Mur A : 3× Nissedal 40×150cm + 1× Nissedal 70×160cm
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

// @ts-ignore
import { ROOM_D, WALL_H, KITCHEN_X1, DOOR_START } from '@config';

const kallaxW1 = 40.5; // kallaxW(1)

const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });

// ── Cadre autour d'un miroir sur mur D (plan YZ) ─────────────────────────────

function FrameD({
  cx, cy, cz, w, h, ft, fd,
}: { cx: number; cy: number; cz: number; w: number; h: number; ft: number; fd: number }) {
  return (
    <>
      <mesh position={[cx, cy + h / 2 - ft / 2, cz]} material={frameMat}>
        <boxGeometry args={[w, ft, fd]} />
      </mesh>
      <mesh position={[cx, cy - h / 2 + ft / 2, cz]} material={frameMat}>
        <boxGeometry args={[w, ft, fd]} />
      </mesh>
      <mesh position={[cx - w / 2 + ft / 2, cy, cz]} material={frameMat}>
        <boxGeometry args={[ft, h, fd]} />
      </mesh>
      <mesh position={[cx + w / 2 - ft / 2, cy, cz]} material={frameMat}>
        <boxGeometry args={[ft, h, fd]} />
      </mesh>
    </>
  );
}

// ── Cadre autour d'un miroir sur mur A (plan XZ) ─────────────────────────────

function FrameA({
  cx, cy, cz, w, h, ft, fd,
}: { cx: number; cy: number; cz: number; w: number; h: number; ft: number; fd: number }) {
  return (
    <>
      <mesh position={[cx, cy + h / 2 - ft / 2, cz]} material={frameMat}>
        <boxGeometry args={[fd, ft, w]} />
      </mesh>
      <mesh position={[cx, cy - h / 2 + ft / 2, cz]} material={frameMat}>
        <boxGeometry args={[fd, ft, w]} />
      </mesh>
      <mesh position={[cx, cy, cz - w / 2 + ft / 2]} material={frameMat}>
        <boxGeometry args={[fd, h, ft]} />
      </mesh>
      <mesh position={[cx, cy, cz + w / 2 - ft / 2]} material={frameMat}>
        <boxGeometry args={[fd, h, ft]} />
      </mesh>
    </>
  );
}

// ── Composant miroir Reflector ────────────────────────────────────────────────

function ReflectorMirror({ w, h, position, rotationY }: {
  w: number; h: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const mir = new Reflector(new THREE.PlaneGeometry(w, h), {
      textureWidth:  512,
      textureHeight: 512,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;
    // Fidèle au vanilla : la caméra miroir ne voit que le layer 0 (structure).
    // Tout le reste (meubles, GLBs) est sur layer 1+ → exclu des reflets.
    mir.camera.layers.mask = 1;
    return mir;
  }, []);

  return <primitive object={reflector} />;
}

// ── 3× Nissedal 60×60 — Mur D ────────────────────────────────────────────────

function MirrorsD() {
  const MIRROR_SIZE = 60;
  const MIRROR_CX   = (KITCHEN_X1 + DOOR_START) / 2;
  const FRAME_T = 2;
  const FRAME_D = 1.5;
  const fz  = ROOM_D - 0.2 - FRAME_D / 2;
  const mirZ = fz - 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const mirrorY = (WALL_H - 3.5) - MIRROR_SIZE / 2 - i * (MIRROR_SIZE + 0.5);
        const innerW = MIRROR_SIZE - FRAME_T * 2;
        const innerH = MIRROR_SIZE - FRAME_T * 2;
        return (
          <group key={i}>
            <ReflectorMirror
              w={innerW} h={innerH}
              position={[MIRROR_CX, mirrorY, mirZ]}
              rotationY={Math.PI}
            />
            <FrameD
              cx={MIRROR_CX} cy={mirrorY} cz={fz}
              w={MIRROR_SIZE} h={MIRROR_SIZE} ft={FRAME_T} fd={FRAME_D}
            />
          </group>
        );
      })}
    </>
  );
}

// ── 3× Nissedal 40×150 + 1× 70×160 — Mur A ──────────────────────────────────

function MirrorsA() {
  const MA_W  = 40,  MA_H  = 150;
  const M4_W  = 70,  M4_H  = 160;
  const FRAME_T = 1.8, FRAME_D = 1.2;
  const MA_START_Z  = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const fx = 0.2 + FRAME_D / 2;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const mz = MA_START_Z + MA_W / 2 + i * MA_W;
        const my = MA_BOTTOM_Y + MA_H / 2;
        const innerW = MA_W - FRAME_T * 2;
        const innerH = MA_H - FRAME_T * 2;
        return (
          <group key={i}>
            <ReflectorMirror
              w={innerW} h={innerH}
              position={[fx + 0.1, my, mz]}
              rotationY={Math.PI / 2}
            />
            <FrameA
              cx={fx} cy={my} cz={mz}
              w={MA_W} h={MA_H} ft={FRAME_T} fd={FRAME_D}
            />
          </group>
        );
      })}

      {/* 4e miroir 70×160 */}
      {(() => {
        const m4z = MA_START_Z + 3 * MA_W + M4_W / 2;
        const m4y = MA_BOTTOM_Y + M4_H / 2;
        const innerW = M4_W - FRAME_T * 2;
        const innerH = M4_H - FRAME_T * 2;
        return (
          <>
            <ReflectorMirror
              w={innerW} h={innerH}
              position={[fx + 0.1, m4y, m4z]}
              rotationY={Math.PI / 2}
            />
            <FrameA
              cx={fx} cy={m4y} cz={m4z}
              w={M4_W} h={M4_H} ft={FRAME_T} fd={FRAME_D}
            />
          </>
        );
      })()}
    </>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Mirrors() {
  return (
    <>
      <MirrorsD />
      <MirrorsA />
    </>
  );
}
