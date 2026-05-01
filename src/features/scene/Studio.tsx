/**
 * Scène principale R3F — remplace lego-room.html + js/scene.js.
 */
import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Color, PMREMGenerator, Scene, AmbientLight, DirectionalLight, Mesh, PlaneGeometry, MeshStandardMaterial } from 'three';
import { CameraController } from '@features/camera/CameraController';
import { cameraState }      from '@features/camera/cameraState';
import { Minimap }          from '@features/inventory/Minimap';
import { SidePanel, type FurnitureState, type LayerState, type LidarMode } from '@features/inventory/SidePanel';
import { AnimationsPanel }  from '@features/inventory/AnimationsPanel';
import { Walls }            from './Walls';
import { Floor }            from './Floor';
import { DoorsPlaced }      from './DoorsPlaced';
import { Neighbors }        from './Neighbors';

import { GlbContext } from './GlbContext';
import { CategoryLayerGroup, SceneLayerController }  from './layers/sceneLayer';
import {
  EquipmentProc, EquipmentGlb,
  FurnitureProc, FurnitureGlb, FurnitureComposite,
  Furnishings,
  FurniturePlacements, GlbPlacements, CompositePlacements,
  Backpacks, Garden, GardenGlb,
} from './Placements';
import { Mirrors }          from './Mirrors';
import { Walker, WalkerRed } from './Walker';
import { DronaBoxes, DronaLabels } from './DronaBoxes';
import { XRayLayer }        from './layers/XRayLayer';
import { RedWallLayer }     from './layers/RedWallLayer';
import { GridLayer }        from './layers/Grid';
import { LightHelpers }     from '@features/devtools/LightHelpers';
import { HoverRaycaster, HoverOverlay } from '@features/inventory/HoverMenu';
import { DevToolsCollector }            from '@features/devtools/DevToolsCollector';
import { Inventory }                    from '@features/inventory/Inventory';
import { VRMode }                       from '@features/camera/VRMode';
import { ImmersiveMode }                from '@features/camera/ImmersiveMode';
import { FloorPlan }                    from '@features/inventory/FloorPlan';
import { LidarScan }                    from '@features/devtools/LidarScan';
import { BuildAnimation, BuildAnimation2, BuildAnimation3, BuildAnimation4 } from './animations';

import {
  ROOM_W,
  LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NEIGHBORS, LAYER_LIDAR,
} from '@config';

/** Force le shadow map à se recalculer après le chargement initial des GLBs. */
function ShadowWarmup() {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const kick = () => { gl.shadowMap.needsUpdate = true; invalidate(); };
    const t1 = setTimeout(kick, 500);
    const t2 = setTimeout(kick, 1500);
    const t3 = setTimeout(kick, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [gl, invalidate]);
  return null;
}

/** Active/désactive les ombres en réponse au toggle UI. */
function ShadowController({ enabled }: { enabled: boolean }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = enabled;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [enabled, gl, invalidate]);
  return null;
}

export function Studio() {
  const [furniture, setFurniture] = useState<FurnitureState>({
    eastDoor: false, entryDoor: false, livingDoor: false, bathroomDoor: false,
    corrDoors: false, sdbCloset: false,
    cbnWest: false, cbnEast: false,
    freezer: false, fridge: false, cabinet: false, wcLid: false,
    bedStacked: true, bedSofa: false, bedPosition: false, smorkullPos: false, lampOn: false, laptopModel: true,
  });
  const [showInventory, setShowInventory] = useState(false);
  const [layers, setLayers] = useState<LayerState>({
    structure: true, equipment: true, furniture: true,
    glb: true, neighbors: false, xray: false, mirrorsHD: false, plan: false, grid: false, dronaLabels: false, skeleton: false, ceiling: false, redWalls: false, lidar: false, lights: false, shadows: true,
  });

  const onToggleFurniture = useCallback((key: keyof FurnitureState) => {
    setFurniture(s => ({ ...s, [key]: !s[key] }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key } }));
    cameraState.invalidate?.();
  }, []);

  const onToggleLayer = useCallback((key: keyof LayerState) => {
    setLayers(s => {
      const next = { ...s, [key]: !s[key] };
      if (key === 'mirrorsHD') cameraState.mirrorsHD = next.mirrorsHD;
      return next;
    });
    cameraState.invalidate?.();
  }, []);

  const [lidarMode, setLidarMode] = useState<LidarMode>(0);
  const onCycleLidar = useCallback(() => {
    setLidarMode(m => ((m + 1) % 4) as LidarMode);
    cameraState.invalidate?.();
  }, []);

  const [lidarOpacity, setLidarOpacity] = useState(0.55);
  const onToggleLidarOpacity = useCallback(() => {
    setLidarOpacity(o => o < 1 ? 1 : 0.55);
    cameraState.invalidate?.();
  }, []);

  const [buildAnim,  setBuildAnim]  = useState(false);
  const [buildAnim3, setBuildAnim3] = useState(false);
  const [buildAnim4, setBuildAnim4] = useState(false);
  const [animDurations, setAnimDurations] = useState<Record<string, number>>({
    buildAnim: 6000,
  });

  const stopAll = () => {
    setBuildAnim(false); setBuildAnim3(false); setBuildAnim4(false);
  };

  const start = (set: React.Dispatch<React.SetStateAction<boolean>>) => () => {
    stopAll();
    setTimeout(() => set(true), 50);
  };

  const setDuration = (key: string) => (ms: number) =>
    setAnimDurations(d => ({ ...d, [key]: ms }));

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        frameloop="demand"
        camera={{
          fov:  50,
          near: 1,
          far:  5000,
          position: [ROOM_W / 2, 1000, -150],
        }}
        shadows={{ type: PCFSoftShadowMap }}
        gl={{
          antialias:    true,
          alpha:        false,
          toneMapping:  ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        onCreated={({ scene, gl, camera }) => {
          scene.background = new Color(0x2a2a3e);
          scene.fog = new FogExp2(0x2a2a3e, 0.0006);
          gl.shadowMap.enabled = true;
          camera.layers.enableAll();

          const pmrem = new PMREMGenerator(gl);
          const envScene = new Scene();
          envScene.background = new Color(0x889ab5);
          envScene.add(new AmbientLight(0xffffff, 1));
          const envDir = new DirectionalLight(0xfff8e8, 2);
          envDir.position.set(10, 10, 5);
          envScene.add(envDir);
          const envFloor = new Mesh(
            new PlaneGeometry(1000, 1000),
            new MeshStandardMaterial({ color: 0xc4a060 }),
          );
          envFloor.rotation.x = -Math.PI / 2;
          envFloor.position.y = -10;
          envScene.add(envFloor);
          const envWall = new Mesh(
            new PlaneGeometry(1000, 300),
            new MeshStandardMaterial({ color: 0xccccbb }),
          );
          envWall.position.set(0, 100, -100);
          envScene.add(envWall);
          scene.environment = pmrem.fromScene(envScene, 0.04).texture;
          pmrem.dispose();
        }}
      >
        <ambientLight color={0x8899bb} intensity={0.6} />
        <directionalLight
          color={0xfff5e0}
          position={[500, 700, 400]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={3000}
          shadow-camera-left={-1000}
          shadow-camera-right={1000}
          shadow-camera-top={1000}
          shadow-camera-bottom={-1000}
          shadow-bias={-0.001}
        />
        <directionalLight color={0xaabbff} position={[-200, 300, -100]} intensity={0.1} />

        {/* Contrôleur unifié : synchronise camera.layers avec les toggles UI */}
        <SceneLayerController layers={layers} />

        <ShadowWarmup />
        <ShadowController enabled={layers.shadows} />
        <CameraController />
        {buildAnim  && <BuildAnimation  onFinish={() => setBuildAnim(false)}  />}
        {buildAnim3 && <BuildAnimation3 onFinish={() => setBuildAnim3(false)} onDuration={setDuration('buildAnim3')} />}
        {buildAnim4 && <BuildAnimation4 onFinish={() => setBuildAnim4(false)} onDuration={setDuration('buildAnim4')} />}
        <VRMode />
        <ImmersiveMode />
        <HoverRaycaster />
        <DevToolsCollector />

        {/* Overlays React (non soumis aux layers Three.js) */}
        {layers.xray        && <XRayLayer />}
        {layers.redWalls    && <RedWallLayer />}
        {layers.grid        && <GridLayer />}
        {layers.lights      && <LightHelpers />}
        {layers.dronaLabels && <DronaLabels />}
        {layers.plan        && <FloorPlan />}

        {/* Contenu 3D — masqué en mode Plan */}
        <group visible={!layers.plan}>

          {/*
           * LAYER_STRUCTURE (0) — défaut Three.js, reflété dans les miroirs.
           * Pas de CategoryLayerGroup : les objets sont sur le layer 0 par défaut.
           * Walker inclus ici → reflété dans les miroirs.
           */}
          <Walls />
          <Floor showCeiling={layers.ceiling} />
          <DoorsPlaced />
          <Walker    showSkeleton={layers.skeleton} />
          <WalkerRed showSkeleton={layers.skeleton} />

          {/*
           * LAYER_EQUIPMENT (1) — équipements sanitaires et cuisine.
           * GLB toggle via React visible (indépendant de camera.layers).
           */}
          <CategoryLayerGroup layer={LAYER_EQUIPMENT}>
            <EquipmentProc />
            <group visible={layers.glb}>
              <EquipmentGlb />
            </group>
          </CategoryLayerGroup>

          {/*
           * LAYER_FURNITURE (2) — mobilier, décoration, miroirs.
           * GLB toggle via React visible (indépendant de camera.layers).
           */}
          <GlbContext.Provider value={layers.glb}>
            <CategoryLayerGroup layer={LAYER_FURNITURE}>
              <Mirrors />
              <FurnitureProc />
              <Furnishings />
              <FurniturePlacements />
              <Backpacks />
              <Garden />
              {/* Composites : GLB + enfants procéduraux — gèrent la visibilité GLB via GlbContext */}
              <FurnitureComposite />
              <CompositePlacements />
              <group visible={layers.glb}>
                <FurnitureGlb />
                <GlbPlacements />
                <GardenGlb />
                <DronaBoxes />
              </group>
            </CategoryLayerGroup>
          </GlbContext.Provider>

          {/* LAYER_NEIGHBORS (5) — appartements voisins */}
          <CategoryLayerGroup layer={LAYER_NEIGHBORS}>
            <Neighbors />
          </CategoryLayerGroup>

          {/* LAYER_LIDAR (6) — monté conditionnellement (point cloud lourd) */}
          {layers.lidar && (
            <CategoryLayerGroup layer={LAYER_LIDAR}>
              <LidarScan mode={lidarMode} opacity={lidarOpacity} />
            </CategoryLayerGroup>
          )}

        </group>
      </Canvas>

      {/* HTML overlays */}
      <SidePanel
        furniture={furniture} onToggleFurniture={onToggleFurniture}
        layers={layers} onToggleLayer={onToggleLayer}
        onOpenInventory={() => setShowInventory(true)}
        lidarMode={lidarMode} onCycleLidar={onCycleLidar}
        lidarOpacity={lidarOpacity} onToggleLidarOpacity={onToggleLidarOpacity}
      />
      <AnimationsPanel
        buildAnim={buildAnim}   onStartBuildAnim={start(setBuildAnim)}
        buildAnim3={buildAnim3} onStartBuildAnim3={start(setBuildAnim3)}
        buildAnim4={buildAnim4} onStartBuildAnim4={start(setBuildAnim4)}
        onStop={stopAll}
        durations={animDurations}
      />
      {showInventory && <Inventory onClose={() => setShowInventory(false)} />}
      <Minimap />
      <HoverOverlay />
    </div>
  );
}
