/**
 * Studio.tsx — racine R3F : Canvas, lumières, fog, env map, état UI global.
 */
import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';

import { useProgress, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import {
  ACESFilmicToneMapping, PCFSoftShadowMap, Color,
  PMREMGenerator, Scene, AmbientLight, DirectionalLight,
  Mesh, PlaneGeometry, MeshStandardMaterial, WebGLRenderer,
} from 'three';
import { CameraController } from '@features/scene/CameraController';
import { cameraState }      from '@features/scene/cameraState';
import { SidePanel, type LidarMode } from '@features/scene/SidePanel';
import { AnimationsPanel }  from '@features/scene/AnimationsPanel';
import { Walls, Floor, Mirrors } from './Building';
import { Neighbors }        from '@features/scene/Neighbors';
import { CategoryLayerGroup, SceneLayerController }  from '@features/scene/sceneLayer';
import { Equipment, Furniture, Furnishings, Decor, Backpacks, Garden, DronaBoxes } from './Placements';
import { Walker } from './Walker';
import { AiZonesHelper } from './ai/AiZonesHelper';
import { XRayLayer }        from '@features/scene/XRayLayer';
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
import { SunLight, SunSphere } from '@features/scene/SunLight';
import { SkySphere } from './SkySphere';
import { BuildAnimation, BuildAnimationMatrix } from '@features/scene/BuildAnimations';
import { PaperPlane, type PlaneModelKey, type PlaneViewMode } from '@features/scene/PaperPlane';
import { AutopilotPlane }             from '@features/scene/AutopilotPlane';
import { LandingStrips }              from '@features/scene/LandingStrips';
import { useSceneStore }              from '@features/scene/store/useSceneStore';
import { MeasurementTool }            from './MeasurementTool';
import { AppConsole }                 from '@features/ui/AppConsole';


import {
  ROOM_W,
  LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_NEIGHBORS, LAYER_LIDAR,
  LAYER_WALKER_DETAIL, LAYER_MIRRORS, LAYER_WALKER,
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
  const { gl, scene, invalidate } = useThree();
  
  useEffect(() => {
    (window as any).__THREE_SCENE__ = scene;
  }, [scene]);

  useEffect(() => {
    gl.shadowMap.enabled = enabled;
    scene.traverse(obj => {
      if ((obj as any).isLight || (obj as any).isMesh) {
        if (obj.userData?.skipShadowToggle) return;
        // On ne touche qu'aux objets qui ont déjà un réglage d'ombre,
        // pour ne pas activer des ombres là où il n'y en avait pas.
        if (enabled) {
          if (obj.userData?.wasCastingShadow) obj.castShadow = true;
        } else {
          if (obj.castShadow) {
            obj.userData.wasCastingShadow = true;
            obj.castShadow = false;
          }
        }
      }
    });
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [enabled, gl, scene, invalidate]);
  return null;
}

function LoadingProgress() {
  const { progress, active, item } = useProgress();
  const doneRef = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const bar = document.getElementById('loading-bar');
    const cover = document.getElementById('loading');
    const itemEl = document.getElementById('loading-item');
    const countdownContainer = document.getElementById('loading-countdown-container');
    const timerEl = document.getElementById('loading-countdown-timer');
    const textEl = document.getElementById('loading-countdown-text');
    const btnPause = document.getElementById('btn-pause-launch');
    const btnStart = document.getElementById('btn-start-now');

    if (bar) bar.style.width = `${progress}%`;
    if (itemEl && item) itemEl.textContent = item;

    if (!active && progress >= 100 && !doneRef.current) {
      doneRef.current = true;

      if (countdownContainer) countdownContainer.style.display = 'flex';
      let remainingSeconds = 5;

      const launchApp = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        if (cover) {
          cover.classList.add('hidden');
          setTimeout(() => cover.remove(), 450);
        }
      };

      if (btnStart) btnStart.onclick = launchApp;

      if (btnPause) {
        btnPause.onclick = () => {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          if (textEl) textEl.textContent = '⏸ Lancement automatique suspendu. Prenez le temps de lire !';
          btnPause.style.display = 'none';
        };
      }

      countdownTimerRef.current = setInterval(() => {
        remainingSeconds--;
        if (timerEl) timerEl.textContent = remainingSeconds.toString();
        if (remainingSeconds <= 0) {
          launchApp();
        }
      }, 1000);
    }
  }, [progress, active, item]);

  return null;
}

export function Studio() {
  const layers = useSceneStore(state => state.layers);
  const measurementActive = useSceneStore(state => state.measurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const onToggleLayer = useSceneStore(state => state.toggleLayer);

  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    // Analytics tracking (disabled in dev to prevent 404s)
    /*
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
    */
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

  // G → toggle mode grille lara (ignoré quand un input/textarea est focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'g' && e.key !== 'G') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
      const currentGrid = useSceneStore.getState().layers.laraGrid;
      onToggleLayer('laraGrid');
      if (!currentGrid) {
        document.dispatchEvent(new CustomEvent('camera-view', { detail: { pos: [150, 450, 600], target: [150, 450, 200] } }));
      }
      cameraState.invalidate?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleLayer]);

  const [buildAnim,       setBuildAnim]       = useState(false);
  const [buildAnimMatrix, setBuildAnimMatrix] = useState(false);
  const [animDurations, setAnimDurations] = useState<Record<string, number>>({});

  const stopAll = () => {
    setBuildAnim(false); setBuildAnimMatrix(false);
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
        frameloop={showInventory ? 'never' : 'demand'}
        camera={{
          fov:  50,
          near: 5,
          far:  10000,
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
          (window as any).threeScene = scene;
          scene.background = new Color(0x02030a);
          gl.shadowMap.enabled = true;
          camera.layers.enableAll();
          // LAYER_WALKER_DETAIL réservé aux miroirs (cf. Walker FPS hide)
          camera.layers.disable(LAYER_WALKER_DETAIL);
          setupEnvironment(scene, gl);
        }}
      >
        <SkySphere />
        <ambientLight color={0x8899bb} intensity={0.6} />
        {layers.realSun ? <><SunLight /><SunSphere /></> : (
          <directionalLight
            color={0xfff5e0}
            position={[500, 700, 400]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={1}
            shadow-camera-far={3000}
            shadow-camera-left={-1200}
            shadow-camera-right={1200}
            shadow-camera-top={1200}
            shadow-camera-bottom={-1200}
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
        {/* Animations */}
        {buildAnim       && <BuildAnimation       onFinish={() => setBuildAnim(false)}       onDuration={setDuration('buildAnim')} />}
        {buildAnimMatrix && <BuildAnimationMatrix onFinish={() => setBuildAnimMatrix(false)} onDuration={setDuration('buildAnimMatrix')} />}
        <VRMode />
        <ImmersiveMode />
        <HoverRaycaster />
        <DevToolsCollector />
        <GlbReveal />
        {/* Overlays React (non soumis aux layers Three.js) */}
        {layers.xray        && <XRayLayer />}
        <AiZonesHelper />
        {layers.wallEdges   && <WallEdgesLayer />}
        {layers.wallEdges   && <EdgeHoverRaycaster />}
        {layers.grid        && <GridLayer depthTest={layers.gridDepth} />}
        {layers.lights      && <LightHelpers />}
        {layers.plan        && <FloorPlan />}
        {cameraMode === 'top' && measurementActive && <MeasurementTool />}
        {/* Contenu 3D — masqué en mode Plan */}
        <Suspense fallback={null}>
        <CameraController planeMode={planeMode} />
        <group visible={!layers.plan}>

          {/*
           * LAYER_STRUCTURE (0) — défaut Three.js, reflété dans les miroirs.
           * Pas de CategoryLayerGroup : les objets sont sur le layer 0 par défaut.
           * Walker inclus ici → reflété dans les miroirs.
           */}
          <Walls pillarsOnly={layers.pillarsOnly} />
          <Floor />
          {/* LAYER_WALKER (8) — Personnages 3D */}
          <CategoryLayerGroup layer={LAYER_WALKER}>
            <Walker showSkeleton={layers.skeleton} />
          </CategoryLayerGroup>
          {/*
           * LAYER_EQUIPMENT (1) — équipements sanitaires et cuisine.
           * GLB toggle via React visible (indépendant de camera.layers).
           */}
          <CategoryLayerGroup layer={LAYER_EQUIPMENT}>
            <Equipment />
          </CategoryLayerGroup>

          <CategoryLayerGroup layer={LAYER_FURNITURE}>
            <Furniture />
            <Furnishings />
            <Decor />
            <Backpacks />
            <Garden />
            <DronaBoxes />
          </CategoryLayerGroup>

          {/* LAYER_MIRRORS (7) — miroirs Reflector */}
          <CategoryLayerGroup layer={LAYER_MIRRORS}>
            <Mirrors />
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
        </Suspense>
      </Canvas>

      {/* HTML overlays */}
      <SidePanel
        layers={layers} onToggleLayer={onToggleLayer}
        onOpenInventory={() => setShowInventory(true)}
        lidarMode={lidarMode} onCycleLidar={onCycleLidar}
        lidarOpacity={lidarOpacity} onToggleLidarOpacity={onToggleLidarOpacity}
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
        buildAnim={buildAnim}             onStartBuildAnim={start(setBuildAnim)}
        buildAnimMatrix={buildAnimMatrix} onStartBuildAnimMatrix={start(setBuildAnimMatrix)}
        onStop={stopAll}
        durations={animDurations}
        planeModel={planeModel}
        onSetPlaneModel={setPlaneModel}
        autopilotVisible={autopilotVisible}
        onToggleAutopilot={() => setAutopilotVisible(v => !v)}
        showLandingStrips={showLandingStrips}
        onToggleLandingStrips={() => {
          setShowLandingStrips(v => {
            cameraState.landingStripsVisible = !v;
            return !v;
          });
        }}
      />
      {showInventory && <Inventory onClose={() => setShowInventory(false)} />}
      <VirtualDPad />
      <HoverOverlay />
      {layers.wallEdges && <EdgeHoverOverlay />}
      <AppConsole />
    </div>
  );
}
