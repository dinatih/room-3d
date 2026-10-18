/**
 * Mirrors.tsx — Miroirs Nissedal et plans de réflexion Three.js Reflector.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cameraState } from '@features/scene/cameraState';
import { getLoadedSkyTexture } from '../SkySphere';
import { NissedalFrame, NissedalGlbFrame, GLB_40x150, GLB_65x65 } from '../items/NissedalMirror';
import { MergedStaticGroup } from './MergedStaticGroup';
import { PARTITION_THICKNESS } from '../wallData';
import {
  ROOM_D, WALL_H, KITCHEN_EAST_WALL, DOOR_START, KITCHEN_SOUTH_WALL,
} from '../wallData';
import {
  LAYER_STRUCTURE, LAYER_WALL_STRUCTURE, LAYER_FLOOR_COVERINGS, LAYER_DOORS, LAYER_GRASS,
  LAYER_WALKER_DETAIL, LAYER_WALKER, LAYER_AI_ZONES, LAYER_LIDAR, LAYER_NEIGHBORS, LAYER_ANIMALS,
  LAYER_ENVIRONMENT, LAYER_AIRCRAFT, LAYER_EQUIPMENT, LAYER_FURNITURE,
  LAYER_FURNISHINGS, LAYER_DECOR,
} from '@config';

const kallaxW1 = 40.5;

// Mid-low : Miroir basse qualité (128px) : calques mur, structure, sol, portes, herbe seulement (sans perso, sans mobilier)
export const MIRROR_MID_LOW_MASK =
  (1 << LAYER_STRUCTURE) |
  (1 << LAYER_WALL_STRUCTURE) |
  (1 << LAYER_FLOOR_COVERINGS) |
  (1 << LAYER_DOORS) |
  (1 << LAYER_GRASS) |
  (1 << LAYER_ENVIRONMENT) |
  (1 << LAYER_AIRCRAFT);

// Mid : Structure, Murs, Sols, Portes, Végetation, Personnages, Animaux, Ciel + Equipements & Furniture (256px)
export const MIRROR_BASE_MASK =
  MIRROR_MID_LOW_MASK |
  (1 << LAYER_EQUIPMENT) |
  (1 << LAYER_FURNITURE) |
  (1 << LAYER_WALKER_DETAIL) |
  (1 << LAYER_WALKER) |
  (1 << LAYER_ANIMALS);

// High : Full miroir (inclut en plus Furnishings tapis/rideaux et Decor bibelots/plantes/props) (512px)
export const MIRROR_HD_MASK =
  MIRROR_BASE_MASK |
  (1 << LAYER_FURNISHINGS) |
  (1 << LAYER_DECOR);

const MIRROR_EXCLUDED_MASK = (1 << LAYER_AI_ZONES) | (1 << LAYER_LIDAR) | (1 << LAYER_NEIGHBORS);

function getMirrorTargetConfig(): { res: number; mask: number } {
  if (cameraState.mirrorsHD || cameraState.mirrorQuality === 'high') {
    return { res: 512, mask: MIRROR_HD_MASK & ~MIRROR_EXCLUDED_MASK };
  }
  if (cameraState.mirrorQuality === 'mid-low') {
    return { res: 128, mask: MIRROR_MID_LOW_MASK & ~MIRROR_EXCLUDED_MASK };
  }
  return { res: 256, mask: MIRROR_BASE_MASK & ~MIRROR_EXCLUDED_MASK };
}

let _reflectionDepth = 0;

function ReflectorMirror({ w, h, position, rotationY }: {
  w: number; h: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const { res } = getMirrorTargetConfig();
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

      const { res: targetRes, mask: mirrorMask } = getMirrorTargetConfig();
      const renderTarget = (mir as any).getRenderTarget();
      if (renderTarget && renderTarget.width !== targetRes) {
        renderTarget.setSize(targetRes, targetRes);
      }

      const reflectionCamera = (mir as any).getReflectionCamera(renderCam);
      if (reflectionCamera) {
        reflectionCamera.layers.mask = mirrorMask;
      }

      const oldMask = renderCam.layers.mask;
      renderCam.layers.mask = mirrorMask;

      const oldBackground = scene.background;
      const worldAutoUpdate = scene.matrixWorldAutoUpdate;
      scene.background = getLoadedSkyTexture() ?? oldBackground;
      // The main render has already updated all world matrices for this frame.
      scene.matrixWorldAutoUpdate = false;
      try {
        origOnBeforeRender(renderer, scene, renderCam, geometry, material, group);
      } finally {
        scene.background = oldBackground;
        scene.matrixWorldAutoUpdate = worldAutoUpdate;
        renderCam.projectionMatrix.copy(savedProj);
        renderCam.layers.mask = oldMask;
        _reflectionDepth--;
      }
    };

    return mir;
  }, []);

  useEffect(() => () => { reflector.dispose(); reflector.geometry.dispose(); }, [reflector]);
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

    const { res } = getMirrorTargetConfig();
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

      const { res: targetRes, mask: mirrorMask } = getMirrorTargetConfig();
      const renderTarget = (mir as any).getRenderTarget();
      if (renderTarget && renderTarget.width !== targetRes) {
        renderTarget.setSize(targetRes, targetRes);
      }

      const reflectionCamera = (mir as any).getReflectionCamera(renderCam);
      if (reflectionCamera) {
        reflectionCamera.layers.mask = mirrorMask;
      }

      const oldMask = renderCam.layers.mask;
      renderCam.layers.mask = mirrorMask;

      const oldBackground = scene.background;
      const worldAutoUpdate = scene.matrixWorldAutoUpdate;
      scene.background = getLoadedSkyTexture() ?? oldBackground;
      scene.matrixWorldAutoUpdate = false;
      try {
        origOnBeforeRender(renderer, scene, renderCam, geometry, material, group);
      } finally {
        scene.background = oldBackground;
        scene.matrixWorldAutoUpdate = worldAutoUpdate;
        renderCam.projectionMatrix.copy(savedProj);
        renderCam.layers.mask = oldMask;
        _reflectionDepth--;
      }
    };

    return mir;
  }, [planes]);

  useEffect(() => () => { reflector.dispose(); reflector.geometry.dispose(); }, [reflector]);
  return <primitive object={reflector} />;
}

export function MirrorsD({ showReflection, reflectorOnly = false }: { showReflection: boolean; reflectorOnly?: boolean }) {
  const W_M = 65, H_M = 65;
  const FT = 1.8;
  const cx  = (KITCHEN_EAST_WALL + DOOR_START) / 2;
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

const silverMirrorMat = new THREE.MeshStandardMaterial({
  color: 0xd0d8e0,
  roughness: 0.05,
  metalness: 0.95,
  envMapIntensity: 1.5,
});

export function MirrorBath({ showReflection }: { showReflection: boolean }) {
  const VANITY_W    = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX   = DOOR_START - 84;
  const VANITY_CZ   = KITCHEN_SOUTH_WALL + PARTITION_THICKNESS + 1 + VANITY_D / 2;
  const counterTopY = VANITY_Y0 + VANITY_H + 4;
  const mirrorW     = VANITY_W + 3;
  const mirrorH     = 90;
  const mirrorY     = counterTopY + mirrorH / 2;
  const mirrorZ     = -VANITY_D / 2 + 0.5;
  const pos: [number, number, number] = [VANITY_CX, mirrorY, VANITY_CZ + mirrorZ + 0.3];

  const reflectorRef = useRef<THREE.Group | null>(null);
  const ambientRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ camera }) => {
    if (!showReflection) return;
    // La passe de rendu Reflector n'est active que si la caméra est dans la salle de bain ou devant la porte
    const isNearBath =
      camera.position.x >= -30 &&
      camera.position.x <= 255 &&
      camera.position.z >= 450 &&
      camera.position.z <= 750 &&
      camera.position.y >= 0 &&
      camera.position.y <= 270;

    if (reflectorRef.current && reflectorRef.current.visible !== isNearBath) {
      reflectorRef.current.visible = isNearBath;
    }
    if (ambientRef.current && ambientRef.current.visible !== !isNearBath) {
      ambientRef.current.visible = !isNearBath;
    }
  });

  if (!showReflection) return null;

  return (
    <>
      <group ref={reflectorRef} visible={false}>
        <ReflectorMirror
          w={mirrorW} h={mirrorH}
          position={pos}
          rotationY={0}
        />
      </group>
      <mesh ref={ambientRef} position={pos} material={silverMirrorMat} visible={true}>
        <planeGeometry args={[mirrorW, mirrorH]} />
      </mesh>
    </>
  );
}

function MergedAmbientMirror({ planes, position, rotationY }: {
  planes: { w: number; h: number; x: number; y: number }[];
  position: [number, number, number];
  rotationY: number;
}) {
  const geo = useMemo(() => {
    const geos = planes.map(p => {
      const g = new THREE.PlaneGeometry(p.w, p.h);
      g.translate(p.x, p.y, 0);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    merged.computeBoundingBox();
    return merged;
  }, [planes]);

  return (
    <mesh geometry={geo} material={silverMirrorMat} position={position} rotation-y={rotationY} />
  );
}

function AmbientReflectorMirror({ w, h, position, rotationY }: {
  w: number; h: number;
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <mesh position={position} rotation-y={rotationY} material={silverMirrorMat}>
      <planeGeometry args={[w, h]} />
    </mesh>
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

/** Glace de miroir PBR passive sans Reflector (reflet de l'environnement HDRI) */
export function AmbientMirrorPlanes() {
  const W_M = 65, H_M = 65;
  const FT = 1.8;
  const cx = (KITCHEN_EAST_WALL + DOOR_START) / 2;
  const mirZ = ROOM_D - 5.5;

  const planesD = useMemo(() => [0, 1, 2].map(i => {
    const cy = (WALL_H - 3.5) - H_M / 2 - i * (H_M + 0.5);
    return { w: W_M - FT * 2, h: H_M - FT * 2, x: -cx, y: cy };
  }), [cx]);

  const MA_W = 40, MA_H = 150;
  const M4_W = 70, M4_H = 160;
  const MA_START_Z = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const mirX = 5.5;

  const planesA = useMemo(() => {
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

  const VANITY_W = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX = DOOR_START - 84;
  const VANITY_CZ = KITCHEN_SOUTH_WALL + PARTITION_THICKNESS + 1 + VANITY_D / 2;
  const counterTopY = VANITY_Y0 + VANITY_H + 4;
  const mirrorW = VANITY_W + 3;
  const mirrorH = 90;
  const mirrorY = counterTopY + mirrorH / 2;
  const mirrorZ = -VANITY_D / 2 + 0.5;

  return (
    <>
      <MergedAmbientMirror planes={planesD} position={[0, 0, mirZ]} rotationY={Math.PI} />
      <MergedAmbientMirror planes={planesA} position={[mirX, 0, 0]} rotationY={Math.PI / 2} />
      <AmbientReflectorMirror
        w={mirrorW} h={mirrorH}
        position={[VANITY_CX, mirrorY, VANITY_CZ + mirrorZ + 0.3]}
        rotationY={0}
      />
    </>
  );
}

/** Plans de réflexion Reflector uniquement — pas de cadres GLB (déjà dans MirrorFrames).
 * Si showReflection est false, affiche la glace de miroir PBR passive (reflet ambiance HDRI).
 */
export function MirrorReflectors({ showReflection = true }: { showReflection?: boolean }) {
  if (!showReflection) {
    return <AmbientMirrorPlanes />;
  }
  return (
    <>
      <MirrorsD showReflection={true} reflectorOnly={true} />
      <MirrorsA showReflection={true} reflectorOnly={true} />
      <MirrorBath showReflection={true} />
    </>
  );
}
