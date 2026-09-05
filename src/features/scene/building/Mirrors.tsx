/**
 * Mirrors.tsx — Miroirs Nissedal et plans de réflexion Three.js Reflector.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cameraState } from '@features/scene/cameraState';
import { NissedalFrame, NissedalGlbFrame, GLB_40x150, GLB_65x65 } from '../items/NissedalMirror';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from './MergedStaticGroup';
import { PARTITION_THICKNESS } from '../wallData';
import {
  ROOM_D, WALL_H, KITCHEN_X1, DOOR_START, KITCHEN_Z,
  LAYER_WALKER_DETAIL, LAYER_WALKER, LAYER_AI_ZONES, LAYER_LIDAR, LAYER_NEIGHBORS, LAYER_ANIMALS,
} from '@config';

const kallaxW1 = 40.5;

const MIRROR_BASE_MASK = (1 << 0) | (1 << LAYER_WALKER_DETAIL) | (1 << LAYER_WALKER) | (1 << LAYER_ANIMALS);
const MIRROR_EXCLUDED_MASK = (1 << LAYER_AI_ZONES) | (1 << LAYER_LIDAR) | (1 << LAYER_NEIGHBORS);

let _reflectionDepth = 0;

function ReflectorMirror({ w, h, position, rotationY }: {
  w: number; h: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const res = cameraState.mirrorsHD ? 512 : 256;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.computeBoundingBox();
    const mir = new Reflector(geo, {
      textureWidth:  res,
      textureHeight: res,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;

      const renderCam = (camera as any).isArrayCamera && (camera as any).cameras?.[0]
        ? (camera as any).cameras[0]
        : camera;

      const savedProj = renderCam.projectionMatrix.clone();

      _reflectionDepth++;

      const targetRes = cameraState.mirrorsHD ? 512 : 256;
      const renderTarget = (mir as any).getRenderTarget();
      if (renderTarget && renderTarget.width !== targetRes) {
        renderTarget.setSize(targetRes, targetRes);
      }

      const mirrorMask = (cameraState.mirrorsHD ? (camera.layers.mask | MIRROR_BASE_MASK) : MIRROR_BASE_MASK) & ~MIRROR_EXCLUDED_MASK;

      const reflectionCamera = (mir as any).getReflectionCamera(renderCam);
      if (reflectionCamera) {
        reflectionCamera.layers.mask = mirrorMask;
      }

      const oldMask = renderCam.layers.mask;
      renderCam.layers.mask = mirrorMask;

      origOnBeforeRender(renderer, scene, renderCam, geometry, material, group);

      renderCam.projectionMatrix.copy(savedProj);
      renderCam.layers.mask = oldMask;
      _reflectionDepth--;
    };

    return mir;
  }, []);

  return <primitive object={reflector} />;
}

function MergedReflector({ planes, position, rotationY }: {
  planes: { w: number; h: number; x: number; y: number }[];
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const geos = planes.map(p => {
      const geo = new THREE.PlaneGeometry(p.w, p.h);
      geo.translate(p.x, p.y, 0);
      return geo;
    });
    const mergedGeo = mergeGeometries(geos, false);
    mergedGeo.computeBoundingBox();

    const res = cameraState.mirrorsHD ? 512 : 256;
    const mir = new Reflector(mergedGeo, {
      textureWidth:  res,
      textureHeight: res,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;

      const renderCam = (camera as any).isArrayCamera && (camera as any).cameras?.[0]
        ? (camera as any).cameras[0]
        : camera;

      const savedProj = renderCam.projectionMatrix.clone();

      _reflectionDepth++;

      const targetRes = cameraState.mirrorsHD ? 512 : 256;
      const renderTarget = (mir as any).getRenderTarget();
      if (renderTarget && renderTarget.width !== targetRes) {
        renderTarget.setSize(targetRes, targetRes);
      }

      const mirrorMask = (cameraState.mirrorsHD ? (camera.layers.mask | MIRROR_BASE_MASK) : MIRROR_BASE_MASK) & ~MIRROR_EXCLUDED_MASK;

      const reflectionCamera = (mir as any).getReflectionCamera(renderCam);
      if (reflectionCamera) {
        reflectionCamera.layers.mask = mirrorMask;
      }

      const oldMask = renderCam.layers.mask;
      renderCam.layers.mask = mirrorMask;

      origOnBeforeRender(renderer, scene, renderCam, geometry, material, group);

      renderCam.projectionMatrix.copy(savedProj);
      renderCam.layers.mask = oldMask;
      _reflectionDepth--;
    };

    return mir;
  }, [planes]);

  return <primitive object={reflector} />;
}

export function MirrorsD({ showReflection, reflectorOnly = false }: { showReflection: boolean; reflectorOnly?: boolean }) {
  const W_M = 65, H_M = 65;
  const FT = 1.8;
  const cx  = (KITCHEN_X1 + DOOR_START) / 2;
  const fz  = ROOM_D - 3.5;
  const mirZ = ROOM_D - 5.5;

  const planes = useMemo(() => [0, 1, 2].map(i => {
    const cy = (WALL_H - 3.5) - H_M / 2 - i * (H_M + 0.5);
    return { w: W_M - FT * 2, h: H_M - FT * 2, x: -cx, y: cy };
  }), []);

  return (
    <>
      {showReflection && <MergedReflector planes={planes} position={[0, 0, mirZ]} rotationY={Math.PI} />}
      {!reflectorOnly && ([0, 1, 2] as const).map((i) => {
        const cy = (WALL_H - 3.5) - H_M / 2 - i * (H_M + 0.5);
        return (
          <group key={i} userData={{ animUnit: true }}>
            <group position={[cx, cy - H_M / 2, fz]}>
              <NissedalGlbFrame glb={GLB_65x65} />
            </group>
          </group>
        );
      })}
    </>
  );
}

export function MirrorsA({ showReflection, reflectorOnly = false }: { showReflection: boolean; reflectorOnly?: boolean }) {
  const MA_W = 40, MA_H = 150;
  const M4_W = 70, M4_H = 160;
  const FT = 1.8, FD = 5.0;
  const MA_START_Z  = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const fx  = 3.5;
  const mirX = 5.5;

  const planes = useMemo(() => {
    const p: { w: number; h: number; x: number; y: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const mz = MA_START_Z + MA_W / 2 + i * MA_W;
      const cy = MA_BOTTOM_Y + MA_H / 2;
      p.push({ w: MA_W - FT * 2, h: MA_H - FT * 2, x: -mz, y: cy });
    }
    const mz4 = MA_START_Z + 3 * MA_W + M4_W / 2;
    const cy4 = MA_BOTTOM_Y + M4_H / 2;
    p.push({ w: M4_W - FT * 2, h: M4_H - FT * 2, x: -mz4, y: cy4 });
    return p;
  }, []);

  return (
    <>
      {showReflection && <MergedReflector planes={planes} position={[mirX, 0, 0]} rotationY={Math.PI / 2} />}

      {!reflectorOnly && ([0, 1, 2] as const).map((i) => {
        const mz = MA_START_Z + MA_W / 2 + i * MA_W;
        return (
          <group key={i} userData={{ animUnit: true }}>
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={-Math.PI / 2}>
              <NissedalGlbFrame glb={GLB_40x150} />
            </group>
          </group>
        );
      })}

      {!reflectorOnly && (() => {
        const mz = MA_START_Z + 3 * MA_W + M4_W / 2;
        return (
          <group userData={{ animUnit: true }}>
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={Math.PI / 2}>
              <NissedalFrame w={M4_W} h={M4_H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })()}
    </>
  );
}

export function MirrorBath({ showReflection }: { showReflection: boolean }) {
  const VANITY_W    = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX   = DOOR_START - 84;
  const VANITY_CZ   = KITCHEN_Z + PARTITION_THICKNESS + 1 + VANITY_D / 2;
  const counterTopY = VANITY_Y0 + VANITY_H + 4;
  const mirrorW     = VANITY_W + 3;
  const mirrorH     = 90;
  const mirrorY     = counterTopY + mirrorH / 2;
  const mirrorZ     = -VANITY_D / 2 + 0.5;

  if (!showReflection) return null;

  return (
    <ReflectorMirror
      w={mirrorW} h={mirrorH}
      position={[VANITY_CX, mirrorY, VANITY_CZ + mirrorZ + 0.3]}
      rotationY={0}
    />
  );
}

/** Cadres GLB/procéduraux des miroirs — toujours visibles (LAYER_FURNITURE). */
export function MirrorFrames() {
  return (
    <MergedStaticGroup name="merged-mirror-frames">
      <MirrorsD showReflection={false} />
      <MirrorsA showReflection={false} />
    </MergedStaticGroup>
  );
}

/** Plans de réflexion Reflector uniquement — pas de cadres GLB (déjà dans MirrorFrames). */
export function MirrorReflectors() {
  return (
    <>
      <MirrorsD showReflection={true} reflectorOnly={true} />
      <MirrorsA showReflection={true} reflectorOnly={true} />
      <MirrorBath showReflection={true} />
    </>
  );
}

/** @deprecated Utiliser MirrorFrames + MirrorReflectors dans Studio.tsx */
export function Mirrors() {
  const showMirrors = useSceneStore(state => state.layers.mirrors);
  return (
    <MergedStaticGroup name="merged-mirror-frames">
      <MirrorsD showReflection={showMirrors} />
      <MirrorsA showReflection={showMirrors} />
      <MirrorBath showReflection={showMirrors} />
    </MergedStaticGroup>
  );
}
