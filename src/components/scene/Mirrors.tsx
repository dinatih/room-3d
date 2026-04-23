/**
 * Mirrors.tsx — Miroirs Nissedal avec THREE.Reflector (fidèle à mirrors.js).
 *
 * MeshReflectorMaterial (drei) double-applique le tone mapping ACESFilmic
 * sur la texture de reflet → reflets trop sombres. On utilise THREE.Reflector
 * directement, identique au vanilla.
 *
 * Mur D : 3× Nissedal 60×60cm (empilés verticalement)
 * Mur A : 3× Nissedal 40×150cm + 1× Nissedal 70×160cm
 *
 * NissedalFrame (items/NissedalMirror) est la source unique de vérité pour
 * la géométrie du cadre — pas de duplication FrameA/FrameD ici.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { cameraState } from './cameraState';
import { NissedalFrame, NissedalGlbFrame, GLB_40x150, GLB_65x65 } from './items/NissedalMirror';

import { ROOM_D, WALL_H, KITCHEN_X1, DOOR_START, KITCHEN_Z } from '@config';

const kallaxW1 = 40.5; // kallaxW(1)

// Compteur global de profondeur de réflexion.
// Empêche les miroirs perpendiculaires de se rendre mutuellement en boucle infinie :
// chaque Reflector vérifie la profondeur avant de lancer sa passe — si on est déjà
// en train de rendre un reflet (depth >= 1), on skippe.
let _reflectionDepth = 0;

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
    mir.camera.layers.mask = 1;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;
      _reflectionDepth++;
      mir.camera.layers.mask = cameraState.mirrorsHD ? camera.layers.mask : 1;
      origOnBeforeRender(renderer, scene, camera, geometry, material, group);
      _reflectionDepth--;
    };

    return mir;
  }, []);

  return <primitive object={reflector} />;
}

// ── 3× Nissedal 60×60 — Mur D ────────────────────────────────────────────────

function MirrorsD() {
  const W = 65, H = 65; // dims réelles GLB NISSEDAL 65×65
  const FT = 1.8, FD = 1.2;
  const cx  = (KITCHEN_X1 + DOOR_START) / 2;
  const fz  = ROOM_D - 0.2 - FD / 2;
  const mirZ = fz - 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const cy = (WALL_H - 3.5) - H / 2 - i * (H + 0.5);
        return (
          <group key={i}>
            <ReflectorMirror
              w={W - FT * 2} h={H - FT * 2}
              position={[cx, cy, mirZ]}
              rotationY={Math.PI}
            />
            {/* cadre GLB — Y=0=bas, centré X/Z */}
            <group position={[cx, cy - H / 2, fz]}>
              <NissedalGlbFrame glb={GLB_65x65} />
            </group>
          </group>
        );
      })}
    </>
  );
}

// ── 3× Nissedal 40×150 + 1× 70×160 — Mur A ──────────────────────────────────

function MirrorsA() {
  const MA_W = 40, MA_H = 150;
  const M4_W = 70, M4_H = 160;
  const FT = 1.8, FD = 1.2;
  const MA_START_Z  = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const fx  = 0.2 + FD / 2;
  const mirX = fx + 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const mz = MA_START_Z + MA_W / 2 + i * MA_W;
        const cy = MA_BOTTOM_Y + MA_H / 2;
        return (
          <group key={i}>
            <ReflectorMirror
              w={MA_W - FT * 2} h={MA_H - FT * 2}
              position={[mirX, cy, mz]}
              rotationY={Math.PI / 2}
            />
            {/* cadre GLB — rotation-y=-π/2 : glace locale -Z → monde +X (face pièce) */}
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={-Math.PI / 2}>
              <NissedalGlbFrame glb={GLB_40x150} />
            </group>
          </group>
        );
      })}

      {/* 4e miroir 70×160 */}
      {(() => {
        const mz = MA_START_Z + 3 * MA_W + M4_W / 2;
        const cy = MA_BOTTOM_Y + M4_H / 2;
        return (
          <group>
            <ReflectorMirror
              w={M4_W - FT * 2} h={M4_H - FT * 2}
              position={[mirX, cy, mz]}
              rotationY={Math.PI / 2}
            />
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={Math.PI / 2}>
              <NissedalFrame w={M4_W} h={M4_H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })()}
    </>
  );
}

// ── Miroir vasque SDB ─────────────────────────────────────────────────────────

function MirrorSDB() {
  const VANITY_W    = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX   = DOOR_START - 78;
  const VANITY_CZ   = KITCHEN_Z + 11 + VANITY_D / 2;
  const counterTopY = VANITY_Y0 + VANITY_H + 4;
  const mirrorW     = VANITY_W + 3;
  const mirrorH     = 90;
  const mirrorY     = counterTopY + mirrorH / 2;
  const mirrorZ     = -VANITY_D / 2 + 0.5;

  return (
    <ReflectorMirror
      w={mirrorW} h={mirrorH}
      position={[VANITY_CX, mirrorY, VANITY_CZ + mirrorZ + 0.1]}
      rotationY={0}
    />
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Mirrors() {
  return (
    <>
      <MirrorsD />
      <MirrorsA />
      <MirrorSDB />
    </>
  );
}
