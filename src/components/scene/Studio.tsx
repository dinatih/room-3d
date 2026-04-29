/**
 * Scène principale R3F — remplace lego-room.html + js/scene.js.
 */
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Color, PMREMGenerator, Scene, AmbientLight, DirectionalLight, Mesh, PlaneGeometry, MeshStandardMaterial } from 'three';
import { CameraController } from './CameraController';
import { cameraState }      from './cameraState';
import { Minimap }          from './Minimap';
import { SidePanel, type FurnitureState, type LayerState, type LidarMode } from './SidePanel';
import { AnimationsPanel }  from './AnimationsPanel';
import { Walls }            from './structure/Walls';
import { Floor }            from './structure/Floor';
import { DoorsPlaced }      from './structure/DoorsPlaced';
import { Neighbors }        from './structure/Neighbors';

import { GlbContext } from './GlbContext';
import { CategoryLayerGroup, SceneLayerController }  from './sceneLayer';
import {
  EquipmentProc, EquipmentGlb,
  FurnitureProc, FurnitureGlb, FurnitureComposite,
  Furnishings,
  FurniturePlacements, GlbPlacements, CompositePlacements,
} from './Placements';
import { Mirrors }          from './Mirrors';
import { Walker, WalkerRed } from './Walker';
import { Backpacks } from './Backpacks';
import { Garden, GardenGlb } from './Garden';
import { DronaBoxes, DronaLabels } from './DronaBoxes';
import { XRayLayer }        from './XRayLayer';
import { RedWallLayer }     from './RedWallLayer';
import { GridLayer }        from './Grid';
import { LightHelpers }     from './LightHelpers';
import { HoverRaycaster, HoverOverlay } from './HoverMenu';
import { DevToolsCollector }            from './DevToolsCollector';
import { Inventory }                    from './Inventory';
import { VRMode }                       from './VRMode';
import { ImmersiveMode }                from './ImmersiveMode';
import { FloorPlan }                    from './FloorPlan';
import { LidarScan }                    from './LidarScan';
import { BuildAnimation, BuildAnimation2, BuildAnimation3, BuildAnimation4 } from './animations';

import {
  ROOM_W,
  LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NEIGHBORS, LAYER_LIDAR,
} from '@config';

export function Studio() {
  const [furniture, setFurniture] = useState<FurnitureState>({
    eastDoor: false, entryDoor: false, livingDoor: false, bathroomDoor: false,
    corrDoors: false, sdbCloset: false,
    cbnWest: false, cbnEast: false,
    freezer: false, fridge: false, cabinet: false, wcLid: false,
    bedStacked: true, bedSofa: false, bedPosition: false, smorkullPos: false, lampOn: false, laptopModel: false,
  });
  const [showInventory, setShowInventory] = useState(false);
  const [layers, setLayers] = useState<LayerState>({
    structure: true, equipment: true, furniture: true,
    glb: true, neighbors: false, xray: false, mirrorsHD: false, plan: false, grid: false, dronaLabels: false, skeleton: false, ceiling: false, redWalls: false, lidar: false, lights: false,
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
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={1}
          shadow-camera-far={3000}
          shadow-camera-left={-600}
          shadow-camera-right={600}
          shadow-camera-top={600}
          shadow-camera-bottom={-600}
          shadow-bias={-0.003}
          shadow-normalBias={0.4}
        />
        <directionalLight color={0xaabbff} position={[-200, 300, -100]} intensity={0.4} />

        {/* Contrôleur unifié : synchronise camera.layers avec les toggles UI */}
        <SceneLayerController layers={layers} />

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
