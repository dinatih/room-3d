/**
 * Studio.tsx — racine R3F : Canvas, lumières, fog, env map, état UI global.
 */
import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useProgress, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import {
  ACESFilmicToneMapping, PCFSoftShadowMap, Color,
  PMREMGenerator, Scene, AmbientLight, DirectionalLight,
  Mesh, PlaneGeometry, MeshStandardMaterial, WebGLRenderer,
} from 'three';
import { CameraController } from '@features/scene/CameraController';
import { cameraState }      from '@features/scene/cameraState';
import { Minimap }          from '@features/scene/Minimap';
import { SidePanel, type FurnitureState, type LayerState, type LidarMode } from '@features/scene/SidePanel';
import { AnimationsPanel }  from '@features/scene/AnimationsPanel';
import { WalkerMeshDebug }  from '@features/scene/WalkerMeshDebug';
import { Walls, Floor, Mirrors, DoorsPlaced } from './Building';
import { Neighbors }        from '@features/scene/Neighbors';
import { CategoryLayerGroup, SceneLayerController }  from '@features/scene/sceneLayer';
import { Equipment, Furniture, Furnishings, Decor, Backpacks, Garden, DronaBoxes } from './Placements';
import { Walker, WalkerRed } from './Walker';
import { XRayLayer }        from '@features/scene/XRayLayer';
import { RedWallLayer }     from '@features/scene/RedWallLayer';
import { WallEdgesLayer, EdgeHoverRaycaster, EdgeHoverOverlay } from '@features/scene/WallEdgesLayer';
import { GridLayer }        from '@features/scene/Grid';
import { LightHelpers }     from '@features/scene/LightHelpers';
import { HoverRaycaster, HoverOverlay } from '@features/scene/HoverMenu';
import { DevToolsCollector }            from '@features/scene/DevToolsCollector';
import { Inventory }                    from '@features/inventory/Inventory';
import { VRMode }                       from '@features/scene/VRMode';
import { ImmersiveMode }                from '@features/scene/ImmersiveMode';
import { FloorPlan }                    from '@features/scene/FloorPlan';
import { VirtualDPad }                  from '@features/scene/VirtualDPad';
import { LidarScan }                    from '@features/scene/LidarScan';
import { GlbReveal }                    from '@features/scene/GlbReveal';
import { RealWorldLayer } from '@features/scene/RealWorldLayer';
import { SunLight } from '@features/scene/SunLight';
import { BuildAnimation, BuildAnimation3, BuildAnimation4, BuildAnimation_VisiteGuidee } from '@features/scene/BuildAnimations';
import { RenderStyleLayer, type RenderStyleKey } from '@features/scene/RenderStyleLayer';
import { PaperPlane, type PlaneModelKey, type PlaneViewMode } from '@features/scene/PaperPlane';
import { AutopilotPlane }             from '@features/scene/AutopilotPlane';
import { LandingStrips }              from '@features/scene/LandingStrips';
import { useSceneStore }              from '@features/scene/store/useSceneStore';

import {
  ROOM_W,
  LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NEIGHBORS, LAYER_LIDAR,
  LAYER_WALKER_DETAIL,
} from '@config';

/**
 * Génère une env map PMREM à partir d'une scène artificielle (sol/mur/lumières)
 * et l'attache à la scène principale. Donne aux matériaux PBR un reflet ambiant
 * crédible sans avoir à charger de HDRI.
 */
function setupEnvironment(scene: Scene, gl: WebGLRenderer) {
  const pmrem    = new PMREMGenerator(gl);
  const envScene = new Scene();
  envScene.background = new Color(0x889ab5);
  envScene.add(new AmbientLight(0xffffff, 1));

  const dir = new DirectionalLight(0xfff8e8, 2);
  dir.position.set(10, 10, 5);
  envScene.add(dir);

  const floor = new Mesh(
    new PlaneGeometry(1000, 1000),
    new MeshStandardMaterial({ color: 0xc4a060 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -10;
  envScene.add(floor);

  const wall = new Mesh(
    new PlaneGeometry(1000, 300),
    new MeshStandardMaterial({ color: 0xccccbb }),
  );
  wall.position.set(0, 100, -100);
  envScene.add(wall);

  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
}

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

function LoadingProgress() {
  const { progress, active } = useProgress();
  const doneRef = useRef(false);

  useEffect(() => {
    const bar   = document.getElementById('loading-bar');
    const cover = document.getElementById('loading');
    if (bar) bar.style.width = `${progress}%`;
    if (!active && progress >= 100 && !doneRef.current) {
      doneRef.current = true;
      if (cover) {
        cover.classList.add('hidden');
        setTimeout(() => cover.remove(), 450);
      }
    }
  }, [progress, active]);

  return null;
}

export function Studio() {
  const furniture = useSceneStore(state => state.furniture);
  const layers = useSceneStore(state => state.layers);
  const onToggleFurniture = useSceneStore(state => state.toggleFurniture);
  const onToggleLayer = useSceneStore(state => state.toggleLayer);

  const [showInventory, setShowInventory] = useState(false);

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

  const [renderStyle, setRenderStyle] = useState<RenderStyleKey>('default');

  const [planeMode,          setPlaneMode]          = useState(false);
  const [planeModel,         setPlaneModel]         = useState<PlaneModelKey>('paper');
  const [autopilotVisible,   setAutopilotVisible]   = useState(false);
  const [showLandingStrips,  setShowLandingStrips]  = useState(false);
  const [planeViewMode,      setPlaneViewMode]      = useState<PlaneViewMode>('prelaunch');
  const [planeLaunched,      setPlaneLaunched]      = useState(false);

  // F → toggle mode avion (ignoré quand un input/textarea est focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
      setPlaneMode(p => {
        if (!p) { setPlaneViewMode('prelaunch'); setPlaneLaunched(false); }
        return !p;
      });
      cameraState.invalidate?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [buildAnim,    setBuildAnim]    = useState(false);
  const [buildAnim3,   setBuildAnim3]   = useState(false);
  const [buildAnim4,   setBuildAnim4]   = useState(false);
  const [visiteGuidee, setVisiteGuidee] = useState(false);
  const [animDurations, setAnimDurations] = useState<Record<string, number>>({
    buildAnim: 6000,
  });

  const stopAll = () => {
    setBuildAnim(false); setBuildAnim3(false); setBuildAnim4(false); setVisiteGuidee(false);
  };

  const start = (set: React.Dispatch<React.SetStateAction<boolean>>) => () => {
    stopAll();
    setTimeout(() => set(true), 50);
  };

  const setDuration = (key: string) => (ms: number) =>
    setAnimDurations(d => ({ ...d, [key]: ms }));

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadingProgress />
      <Canvas
        style={{ width: '100%', height: '100%' }}
        frameloop={layers.physics ? 'always' : 'demand'}
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
          gl.shadowMap.enabled = true;
          camera.layers.enableAll();
          // LAYER_WALKER_DETAIL réservé aux miroirs (cf. Walker FPS hide)
          camera.layers.disable(LAYER_WALKER_DETAIL);
          setupEnvironment(scene, gl);
        }}
      >
        <ambientLight color={0x8899bb} intensity={0.6} />
        {layers.realSun ? <SunLight /> : (
          <directionalLight
            color={0xfff5e0}
            position={[500, 700, 400]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={1}
            shadow-camera-far={2000}
            shadow-camera-left={-600}
            shadow-camera-right={600}
            shadow-camera-top={600}
            shadow-camera-bottom={-600}
            shadow-bias={-0.0002}
            shadow-normalBias={0.04}
          />
        )}

        {/* Contrôleur unifié : synchronise camera.layers avec les toggles UI */}
        <SceneLayerController layers={layers} />

        <AdaptiveDpr pixelated />
        <PerformanceMonitor />
        <ShadowWarmup />
        <ShadowController enabled={layers.shadows} />
        {planeMode    && <PaperPlane
                           onExit={() => setPlaneMode(false)}
                           model={planeModel}
                           onViewModeChange={(vm, launched) => {
                             setPlaneViewMode(vm);
                             if (launched) setPlaneLaunched(true);
                           }}
                         />}
        {autopilotVisible && <AutopilotPlane model={planeModel} />}
        {showLandingStrips && <LandingStrips />}
        {buildAnim    && <BuildAnimation              onFinish={() => setBuildAnim(false)} />}
        {buildAnim3   && <BuildAnimation3             onFinish={() => setBuildAnim3(false)}   onDuration={setDuration('buildAnim3')}   />}
        {buildAnim4   && <BuildAnimation4             onFinish={() => setBuildAnim4(false)}   onDuration={setDuration('buildAnim4')}   />}
        {visiteGuidee && <BuildAnimation_VisiteGuidee onFinish={() => setVisiteGuidee(false)} onDuration={setDuration('visiteGuidee')} />}
        <VRMode />
        <ImmersiveMode />
        <HoverRaycaster />
        <DevToolsCollector />
        <GlbReveal />
        {renderStyle !== 'default' && <RenderStyleLayer style={renderStyle} />}
        {layers.realWorld && <RealWorldLayer />}

        {/* Overlays React (non soumis aux layers Three.js) */}
        {layers.xray        && <XRayLayer />}
        {layers.redWalls    && <RedWallLayer />}
        {layers.wallEdges   && <WallEdgesLayer />}
        {layers.wallEdges   && <EdgeHoverRaycaster />}
        {layers.grid        && <GridLayer depthTest={layers.gridDepth} />}
        {layers.lights      && <LightHelpers />}
        {layers.plan        && <FloorPlan />}

        {/* Contenu 3D — masqué en mode Plan */}
        <Suspense fallback={null}>
        <Physics gravity={[0, -980, 0]} timeStep="vary">
        <CameraController planeMode={planeMode} />
        <group visible={!layers.plan}>

          {/*
           * LAYER_STRUCTURE (0) — défaut Three.js, reflété dans les miroirs.
           * Pas de CategoryLayerGroup : les objets sont sur le layer 0 par défaut.
           * Walker inclus ici → reflété dans les miroirs.
           */}
          <Walls pillarsOnly={layers.pillarsOnly} wallsOnly={layers.wallsOnly} />
          <Floor showCeiling={layers.ceiling} />
          <group visible={layers.doors}><DoorsPlaced /></group>
          <Walker    showSkeleton={layers.skeleton} />
          <WalkerRed showSkeleton={layers.skeleton} />

          {/*
           * LAYER_EQUIPMENT (1) — équipements sanitaires et cuisine.
           * GLB toggle via React visible (indépendant de camera.layers).
           */}
          <CategoryLayerGroup layer={LAYER_EQUIPMENT}>
            <Equipment />
          </CategoryLayerGroup>

          <CategoryLayerGroup layer={LAYER_FURNITURE}>
            <Mirrors />
            <Furniture />
            <Furnishings />
            <Decor />
            <Backpacks />
            <Garden />
            <DronaBoxes />
          </CategoryLayerGroup>

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
        </Physics>
        </Suspense>
      </Canvas>

      {/* HTML overlays */}
      <SidePanel
        furniture={furniture} onToggleFurniture={onToggleFurniture}
        layers={layers} onToggleLayer={onToggleLayer}
        onOpenInventory={() => setShowInventory(true)}
        lidarMode={lidarMode} onCycleLidar={onCycleLidar}
        lidarOpacity={lidarOpacity} onToggleLidarOpacity={onToggleLidarOpacity}
        renderStyle={renderStyle} onSetRenderStyle={setRenderStyle}
        planeModel={planeModel} onSetPlaneModel={setPlaneModel}
        autopilotVisible={autopilotVisible} onToggleAutopilot={() => setAutopilotVisible(v => !v)}
        showLandingStrips={showLandingStrips} onToggleLandingStrips={() => {
          setShowLandingStrips(v => {
            cameraState.landingStripsVisible = !v;
            return !v;
          });
        }}
      />
      {planeMode && (
        <div style={{
          position: 'absolute', bottom: 72, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', borderRadius: 8,
          padding: '6px 16px', color: '#ddd', fontSize: 12,
          pointerEvents: 'none', textAlign: 'center', whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {!planeLaunched
            ? '✈ Espace / C → décoller   |   F / Échap → quitter'
            : planeViewMode === 'landing'
              ? '⬇ Atterrissage automatique…'
              : planeViewMode === 'landed'
                ? '🛬 Atterri — orbite   |   F / Échap = quitter'
                : `Vue: ${planeViewMode}   |   C = changer vue   |   F / Échap = quitter`
          }
        </div>
      )}
      <AnimationsPanel
        buildAnim={buildAnim}       onStartBuildAnim={start(setBuildAnim)}
        buildAnim3={buildAnim3}     onStartBuildAnim3={start(setBuildAnim3)}
        buildAnim4={buildAnim4}     onStartBuildAnim4={start(setBuildAnim4)}
        visiteGuidee={visiteGuidee} onStartVisiteGuidee={start(setVisiteGuidee)}
        onStop={stopAll}
        durations={animDurations}
      />
      <WalkerMeshDebug />
      {showInventory && <Inventory onClose={() => setShowInventory(false)} />}
      <Minimap />
      <VirtualDPad />
      <HoverOverlay />
      {layers.wallEdges && <EdgeHoverOverlay />}
    </div>
  );
}
