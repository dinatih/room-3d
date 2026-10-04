/**
 * Studio.tsx — racine R3F : Canvas, lumières, fog, env map, état UI global.
 */
import { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { Canvas, useThree } from '@react-three/fiber';

import { useProgress, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import {
  AgXToneMapping, PCFShadowMap, Color,
  PMREMGenerator, Scene, AmbientLight, DirectionalLight,
  Mesh, PlaneGeometry, MeshStandardMaterial, WebGLRenderer,
  PerspectiveCamera,
} from 'three';
import { CameraController } from '@features/scene/CameraController';
import { cameraState }      from '@features/scene/cameraState';
import { SKY_START_POS }     from '@features/scene/camera';
import { parseUrlHideUI, updateUrlHideUI } from '@features/scene/camera/cameraUrlParams';
import { SidePanel, type LidarMode } from '@features/scene/SidePanel';
import { RightSidePanel }   from '@features/scene/RightSidePanel';
import { Minimap }          from '@features/scene/Minimap';
import { Walls, Floor, DoorsPlacement, MirrorFrames, MirrorReflectors } from './Building';
import { Neighbors }        from '@features/scene/Neighbors';
import { CategoryLayerGroup, SceneLayerController } from '@features/scene/sceneLayer';
import { Equipment, Furniture, Furnishings, Decor, Animals } from './Placements';
import { Walker } from './Walker';
import { AiZonesHelper } from './ai/AiZonesHelper';
import { ZoneAiDebugOverlay } from './ai/ZoneAiDebugOverlay';
import { CollisionDebugHelper } from './ai/CollisionDebugHelper';
import { WireframeLayer }   from '@features/scene/WireframeLayer';
import { WallEdgesLayer, EdgeHoverRaycaster, EdgeHoverOverlay } from '@features/scene/WallEdgesLayer';
import { GridLayer }        from '@features/scene/Grid';
import { LightHelpers }     from '@features/scene/LightHelpers';
import { HoverRaycaster, HoverOverlay } from '@features/scene/HoverMenu';
import { DevToolsCollector }            from '@features/scene/DevToolsCollector';
import { VRMode }                       from '@features/scene/VRMode';
import { ImmersiveMode }                from '@features/scene/ImmersiveMode';
import { FloorPlan }                    from '@features/scene/FloorPlan';
import { VirtualDPad }                  from '@features/scene/VirtualDPad';
import { LidarScan }                    from '@features/scene/LidarScan';
import { GlbReveal }                    from '@features/scene/GlbReveal';
import { SunLight, SunSphere } from '@features/scene/SunLight';
import { SkySphere } from './SkySphere';
import { BuildAnimationMatrix } from '@features/scene/BuildAnimations';
import { PaperPlane, type PlaneModelKey, type PlaneViewMode } from '@features/scene/PaperPlane';
import { AutopilotPlane }             from '@features/scene/AutopilotPlane';
import { LandingStrips }              from '@features/scene/LandingStrips';
import { useSceneStore }              from '@features/scene/store/useSceneStore';
import { HDRI_LIST, getHdriById }  from '@features/scene/hdriConfig';
import { useAppIdle }                  from './idleState';
import { MeasurementTool }            from './MeasurementTool';
import { RealMeasurementsLayer }      from './RealMeasurementsLayer';
import { AppConsole }                 from '@features/ui/AppConsole';
import { GlobalSkeletonHelpers } from './utils/GlobalSkeletonHelpers';
import { GridLayout }            from '@features/scene/GridLayout';
import { frameLaraGridCamera }   from './character/laraGridUtils';
import { LaraGridToolbar }       from './LaraGridToolbar';
import { AnimFrameController }   from '@features/inventory/AnimFrameController';
import { useAnimPreviewStore }   from '@features/inventory/useAnimPreviewStore';
import { WALKER_ANIM_OPTIONS }   from '@features/scene/animOptions';
import { resolveAnimationId, resolveAnimationPath }    from './animations/animationResolver';
import { NPC_WALK_ANIMATIONS }   from './ai/agent/agentWalkAnimations';
import { cacheDynamicGLTF }      from './character/useCharacterAnimations';
import { useIsMobile }           from '@shared/hooks/useIsMobile';
import { duoSessionManager }     from './ai/duoSessionManager';

// The inventory pulls in a second R3F canvas, its GLTF loaders and a large
// catalogue. Do not parse it until the user explicitly opens the inventory.
const Inventory = lazy(() => import('@features/inventory/Inventory').then(module => ({ default: module.Inventory })));
const RaytracingPhotoModal = lazy(() => import('./photo/RaytracingPhotoModal').then(module => ({ default: module.RaytracingPhotoModal })));


import {
  LAYER_EQUIPMENT, LAYER_FURNITURE, LAYER_FURNISHINGS, LAYER_DECOR, LAYER_NEIGHBORS, LAYER_LIDAR,
  LAYER_WALKER_DETAIL, LAYER_MIRRORS, LAYER_WALKER, LAYER_ENVIRONMENT,
  LAYER_WALL_STRUCTURE, LAYER_DOORS, LAYER_ANIMALS,
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

const WARMUP_ANIM_PATHS = [
  'animations/combat/anim_pistol_kneel_to_stand.glb',
  'animations/locomotion/anim_falling.glb',
  'animations/poses_idles/anim_falling_idle.glb',
  ...NPC_WALK_ANIMATIONS.map(animKey => resolveAnimationPath(animKey)).filter(Boolean),
];

/** Pré-compilation GPU, pré-téléchargement des animations essentielles et exécution de frames de warm-up pendant la page de préchargement. */
function GpuWarmup({ active, onReady }: { active: boolean; onReady: () => void }) {
  const { gl, scene, camera, invalidate } = useThree();
  const readyRef = useRef(false);

  useEffect(() => {
    if (!active || readyRef.current) return;

    // 1. Précharger en mémoire l'animation d'atterrissage, de chute et toutes les animations de marche aléatoires
    const animPreloads = Promise.allSettled(
      WARMUP_ANIM_PATHS.map(path => cacheDynamicGLTF(path))
    );

    // 2. Pré-compiler les shaders de la scène
    try {
      gl.compile(scene, camera);
    } catch {
      // Ignorer si compilation async non supportée
    }

    // 3. Exécuter des frames de warm-up avec rafraîchissement du shadow map
    let frames = 0;
    const interval = setInterval(() => {
      frames++;
      gl.shadowMap.needsUpdate = true;
      invalidate();
      if (frames >= 7) {
        clearInterval(interval);
        animPreloads.finally(() => {
          if (!readyRef.current) {
            readyRef.current = true;
            onReady();
          }
        });
      }
    }, 350); // ~2.4 secondes de warm-up effectif absorbé par la page de chargement

    return () => clearInterval(interval);
  }, [active, gl, scene, camera, invalidate, onReady]);

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

function FrameloopController({ isIdle, showInventory, isCvModalOpen, isPhotoModeOpen, isAnimActive }: { isIdle: boolean; showInventory: boolean; isCvModalOpen: boolean; isPhotoModeOpen: boolean; isAnimActive: boolean }) {
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    // Si on est en VR WebXR ou en mode Immersif gyro, on ne suspend jamais le frameloop
    const isXRActive = cameraState.isXR || gl.xr?.isPresenting;
    const loop = (showInventory || isCvModalOpen || isPhotoModeOpen || (isIdle && !isXRActive))
      ? 'never'
      : (isAnimActive ? 'always' : 'demand');
    setFrameloop(loop);
    if (loop !== 'never') {
      invalidate();
    }
  }, [isIdle, showInventory, isCvModalOpen, isPhotoModeOpen, isAnimActive, setFrameloop, invalidate, gl]);

  // Frameloop continu 60fps garanti pendant l'intro transition
  useEffect(() => {
    const handleIntroStart = () => {
      setFrameloop('always');
      invalidate();
    };
    const handleIntroEnd = () => {
      const isXRActive = cameraState.isXR || gl.xr?.isPresenting;
      const loop = (showInventory || isCvModalOpen || isPhotoModeOpen || (isIdle && !isXRActive))
        ? 'never'
        : (isAnimActive ? 'always' : 'demand');
      setFrameloop(loop);
      invalidate();
    };
    window.addEventListener('start-camera-intro', handleIntroStart);
    document.addEventListener('start-camera-intro', handleIntroStart);
    window.addEventListener('camera-intro-finished', handleIntroEnd);
    return () => {
      window.removeEventListener('start-camera-intro', handleIntroStart);
      document.removeEventListener('start-camera-intro', handleIntroStart);
      window.removeEventListener('camera-intro-finished', handleIntroEnd);
    };
  }, [setFrameloop, invalidate, gl, showInventory, isCvModalOpen, isPhotoModeOpen, isIdle, isAnimActive]);

  return null;
}

function ActiveCameraCapture({ onCapture }: { onCapture: (cam: PerspectiveCamera) => void }) {
  const { camera } = useThree();
  useEffect(() => {
    onCapture(camera as PerspectiveCamera);
  }, [camera, onCapture]);
  return null;
}

function LoadingProgress({
  sceneReady,
  onAssetsLoaded,
  onLaunch,
}: {
  sceneReady: boolean;
  onAssetsLoaded: () => void;
  onLaunch: () => void;
}) {
  const { progress, active, item } = useProgress();
  const assetsDoneRef = useRef(false);
  const countdownStartedRef = useRef(false);
  const hasLaunchedRef = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Suivi du téléchargement des assets
  useEffect(() => {
    const bar = document.getElementById('loading-bar');
    const itemEl = document.getElementById('loading-item');

    if (bar) bar.style.width = `${progress}%`;
    if (itemEl && item && !assetsDoneRef.current) itemEl.textContent = item;

    if (!active && progress >= 100 && !assetsDoneRef.current) {
      assetsDoneRef.current = true;
      onAssetsLoaded();
      if (itemEl && !sceneReady) {
        itemEl.textContent = '⚡ Optimisation GPU & compilation des shaders…';
      }
    }
  }, [progress, active, item, sceneReady, onAssetsLoaded]);

  // 2. Déclenchement du décompte de 5s UNIQUEMENT à la toute fin (une fois l'optimisation GPU terminée)
  useEffect(() => {
    if (!assetsDoneRef.current || !sceneReady || countdownStartedRef.current) return;
    countdownStartedRef.current = true;

    const itemEl = document.getElementById('loading-item');
    const countdownContainer = document.getElementById('loading-countdown-container');
    const timerEl = document.getElementById('loading-countdown-timer');
    const textEl = document.getElementById('loading-countdown-text');
    const btnPause = document.getElementById('btn-pause-launch');
    const btnStart = document.getElementById('btn-start-now');

    // Masquer le libellé de chargement individuel pour laisser toute la place au compte à rebours de lancement
    if (itemEl) itemEl.style.display = 'none';
    if (countdownContainer) countdownContainer.style.display = 'flex';
    if (timerEl) timerEl.textContent = '5';

    let remainingSeconds = 5;

    const launchApp = () => {
      if (hasLaunchedRef.current) return;
      hasLaunchedRef.current = true;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (btnStart) btnStart.setAttribute('disabled', 'true');
      if (btnPause) btnPause.style.display = 'none';
      if (textEl) textEl.textContent = '🚀 Lancement de la scène 3D…';
      onLaunch();
    };

    if (btnStart) btnStart.onclick = launchApp;

    if (btnPause) {
      btnPause.onclick = () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
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

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [sceneReady, onLaunch]);

  return null;
}

function SceneAmbientLight() {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const activeHdri = getHdriById(currentHdri);
  const intensity = activeHdri.ambientIntensity ?? (activeHdri.type === 'jpg' ? 0.95 : 0.6);
  const color = activeHdri.ambientColor ?? (activeHdri.type === 'jpg' ? 0xffba90 : 0x8899bb);
  return <ambientLight color={color} intensity={intensity} />;
}

function SceneDirectionalLight() {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const activeHdri = getHdriById(currentHdri);
  const color = activeHdri.directionalColor ?? 0xfff5e0;
  const intensity = activeHdri.directionalIntensity ?? 1.8;
  const position = activeHdri.directionalPosition ?? [500, 700, 400];

  return (
    <directionalLight
      color={color}
      position={position}
      intensity={intensity}
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
  );
}

export function Studio() {
  const layers = useSceneStore(state => state.layers);
  const measurementActive = useSceneStore(state => state.measurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const onToggleLayer = useSceneStore(state => state.toggleLayer);

  const [showInventory, setShowInventory] = useState(false);
  const [inventoryInitialCat, setInventoryInitialCat] = useState<string>('all');
  const [hideUI, setHideUI] = useState(() => parseUrlHideUI());

  const toggleHideUI = useCallback(() => {
    setHideUI(h => {
      const next = !h;
      updateUrlHideUI(next);
      return next;
    });
  }, []);

  const showUI = useCallback(() => {
    setHideUI(false);
    updateUrlHideUI(false);
  }, []);

  useEffect(() => {
    (window as any).isAnimProRunning = false;
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

  // Recadrage dynamique de la caméra sur la grille de comparaison (centrée sur tous les PNJ de la scène)
  const laraGridActive = useSceneStore(state => state.layers.laraGrid);
  const laraCount = useSceneStore(state => state.layers.laraCount);
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const activeMainIds = useSceneStore(state => state.activeMainIds);

  useEffect(() => {
    if (laraGridActive) {
      setLaraGridAnim('idle');
      useAnimPreviewStore.getState().reset();
      duoSessionManager.leaveAllSessions();
      frameLaraGridCamera();
    }
  }, [laraGridActive, laraCount, extraCharacters, activeExtraIds, activeMainIds]);

  const isMobile = useIsMobile();
  const [laraGridAnim, setLaraGridAnim] = useState<string>('idle');

  // Synchronisation avec les changements d'animation de Lara
  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e.detail?.key === 'walker-anim-lara' && e.detail?.value) {
        setLaraGridAnim(e.detail.value);
      }
    };
    document.addEventListener('furniture-toggle', handleToggle);
    return () => document.removeEventListener('furniture-toggle', handleToggle);
  }, []);

  const cycleLaraAnim = useCallback((direction: 'next' | 'prev') => {
    const pool = WALKER_ANIM_OPTIONS;
    if (!pool.length) return;
    const currentVal = laraGridAnim || 'idle';
    const targetId = resolveAnimationId(currentVal);
    const currIdx = pool.findIndex(a => a.value === targetId || a.value === currentVal);
    let nextIdx = 0;
    if (currIdx === -1) {
      nextIdx = direction === 'next' ? 0 : pool.length - 1;
    } else {
      nextIdx = direction === 'next'
        ? (currIdx + 1) % pool.length
        : (currIdx - 1 + pool.length) % pool.length;
    }
    const nextVal = pool[nextIdx].value;
    setLaraGridAnim(nextVal);
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: nextVal } }));
    useAnimPreviewStore.getState().play();
  }, [laraGridAnim]);

  const currentLaraAnimOpt = WALKER_ANIM_OPTIONS.find(a => a.value === laraGridAnim || a.value === resolveAnimationId(laraGridAnim));
  const currentLaraAnimLabel = laraGridAnim === 't-pose'
    ? 'T-Pose'
    : (currentLaraAnimOpt ? currentLaraAnimOpt.label : laraGridAnim);

  // G → toggle mode grille lara (ignoré quand un input/textarea est focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;

      // Alt+<key> → layer toggles
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'p') { e.preventDefault(); onToggleLayer('pillarsOnly'); cameraState.invalidate?.(); return; }
        if (k === 'm') { e.preventDefault(); onToggleLayer('measuredDimensions'); cameraState.invalidate?.(); return; }
        if (k === 'a') { e.preventDefault(); onToggleLayer('wallEdges'); cameraState.invalidate?.(); return; }
        if (k === 'i') { e.preventDefault(); onToggleLayer('inventoryGrid'); cameraState.invalidate?.(); return; }
        if (k === 'w') { e.preventDefault(); onToggleLayer('wallStructure'); cameraState.invalidate?.(); return; }
        if (k === 'q') { e.preventDefault(); onToggleLayer('structure'); cameraState.invalidate?.(); return; }
        if (k === 'f') { e.preventDefault(); onToggleLayer('furniture'); cameraState.invalidate?.(); return; }
        if (k === 'd') { e.preventDefault(); onToggleLayer('decor'); cameraState.invalidate?.(); return; }
        if (k === 'h') { e.preventDefault(); onToggleLayer('furnishings'); cameraState.invalidate?.(); return; }
        if (k === 'e') { e.preventDefault(); onToggleLayer('equipment'); cameraState.invalidate?.(); return; }
        if (k === 'g') { e.preventDefault(); onToggleLayer('mirrorsHD'); cameraState.invalidate?.(); return; }
        if (k === 'z') { e.preventDefault(); onToggleLayer('laraTopOff'); cameraState.invalidate?.(); return; }
        if (k === 'c') { e.preventDefault(); onToggleLayer('laraBottomOff'); cameraState.invalidate?.(); return; }
        if (k === 'x') { e.preventDefault(); onToggleLayer('laraNude'); cameraState.invalidate?.(); return; }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'g' || e.key === 'G') {
        onToggleLayer('laraGrid');
        cameraState.invalidate?.();
      } else if (e.key === 'w' || e.key === 'W') {
        onToggleLayer('wireframe');
        cameraState.invalidate?.();
      } else if (e.key === 'p' || e.key === 'P') {
        setInventoryInitialCat('walkers');
        setShowInventory(true);
      } else if (e.key === 'i' || e.key === 'I') {
        setInventoryInitialCat('all');
        setShowInventory(prev => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        onToggleLayer('aiZones');
        cameraState.invalidate?.();
      } else if (e.key === 'e' || e.key === 'E') {
        onToggleLayer('extraCharacters');
        cameraState.invalidate?.();
      } else if (e.key === 'k' || e.key === 'K') {
        onToggleLayer('skeleton');
        cameraState.invalidate?.();
      } else if (e.key === '5' || e.code === 'Digit5' || e.code === 'Numpad5') {
        const store = useSceneStore.getState();
        const otherHdris = HDRI_LIST.filter(h => h.id !== store.currentHdri);
        const next = otherHdris[Math.floor(Math.random() * otherHdris.length)];
        if (next) {
          store.setHdri(next.id);
        }
      } else if (e.key === '7' || e.code === 'Digit7' || e.code === 'Numpad7') {
        onToggleLayer('laraPistols');
        cameraState.invalidate?.();
      } else if (e.key === '8' || e.code === 'Digit8' || e.code === 'Numpad8') {
        onToggleLayer('accessories');
        cameraState.invalidate?.();
      } else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
        toggleHideUI();
      } else if (e.key === 'F10' || e.code === 'F10') {
        e.preventDefault();
        useSceneStore.getState().setPhotoModeOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleLayer]);


  const [buildAnimMatrix,  setBuildAnimMatrix]  = useState(false);
  const [assetsLoaded,     setAssetsLoaded]     = useState(false);
  const [sceneWarmReady,   setSceneWarmReady]   = useState(false);
  const [animDurations,    setAnimDurations]    = useState<Record<string, number>>({});

  const handleAssetsLoaded = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  const stopAll = () => {
    setBuildAnimMatrix(false);
  };

  const startMatrix = () => {
    setBuildAnimMatrix(false);
    setTimeout(() => {
      setBuildAnimMatrix(true);
    }, 50);
  };

  const setDuration = (key: string) => (ms: number) =>
    setAnimDurations(d => ({ ...d, [key]: ms }));

  const isIdle = useAppIdle();
  const isCvModalOpen = useSceneStore(state => state.isCvModalOpen);
  const isPhotoModeOpen = useSceneStore(state => state.isPhotoModeOpen);
  const activeSceneRef = useRef<Scene | null>(null);
  const activeCameraRef = useRef<PerspectiveCamera | null>(null);

  const revealScene = useCallback(() => {
    const cover = document.getElementById('loading');
    const card = document.getElementById('loading-card');
    const backdrop = document.getElementById('loading-backdrop');

    // 1. Sortie animée de la carte (léger déplacement vers le bas et flou progressif)
    if (card) {
      card.classList.add('exiting');
    }

    // 2. Déclenchement du vol caméra et fondu du fond 2D après 120ms
    const timer = setTimeout(() => {
      if (backdrop) {
        backdrop.classList.add('exiting');
      }
      window.dispatchEvent(new CustomEvent('start-camera-intro'));
      document.dispatchEvent(new CustomEvent('start-camera-intro'));
    }, 120);

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearTimeout(timer);
      cameraState.isSceneLaunched = true;
      if (cover) {
        cover.classList.add('hidden');
        setTimeout(() => cover.remove(), 400);
      }
    };

    const onIntroFinish = () => {
      window.removeEventListener('camera-intro-finished', onIntroFinish);
      cleanup();
    };

    window.addEventListener('camera-intro-finished', onIntroFinish);

    // Sécurité fallback : forcer la suppression après 2.2s si aucun événement n'est reçu
    setTimeout(cleanup, 2200);
  }, []);

  const handleReady = useCallback(() => {
    setSceneWarmReady(true);
  }, []);

  const handleLaunch = useCallback(() => {
    revealScene();
  }, [revealScene]);

  const isAnimActive = buildAnimMatrix;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadingProgress sceneReady={sceneWarmReady} onAssetsLoaded={handleAssetsLoaded} onLaunch={handleLaunch} />
      <Canvas
        style={{ width: '100%', height: '100%' }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)]}
        frameloop={showInventory || isCvModalOpen || isPhotoModeOpen || isIdle ? 'never' : (isAnimActive ? 'always' : 'demand')}
        /*
         * ── Placement & configuration initiale de la caméra 3D ───────────────
         * - fov: 50° (champ de vision vertical naturel)
         * - near: 5 cm (évite le clipping avec les objets proches)
         * - far: 10 000 cm / 100 m (couvre la pièce, l'extérieur et le ciel)
         * - position initiale calée sur le panorama Ciel de Paris pour assurer la fusion parfaite avec le fond 2D
         */
        camera={{
          fov:  50,
          near: 5,
          far:  10000,
          position: [SKY_START_POS.x, SKY_START_POS.y, SKY_START_POS.z],
        }}
        shadows={{ type: PCFShadowMap }}
        gl={{
          antialias:    true,
          alpha:        false,
          toneMapping:  AgXToneMapping,
          toneMappingExposure: 1,
        }}
        onCreated={({ scene, gl, camera }) => {
          (window as any).threeScene = scene;
          (window as any).threeCamera = camera;
          activeSceneRef.current = scene;
          activeCameraRef.current = camera as PerspectiveCamera;
          scene.background = new Color(0x02030a);
          gl.shadowMap.enabled = true;
          camera.layers.enableAll();
          // LAYER_WALKER_DETAIL réservé aux miroirs (cf. Walker FPS hide)
          camera.layers.disable(LAYER_WALKER_DETAIL);
          setupEnvironment(scene, gl);
        }}
      >
        <ActiveCameraCapture onCapture={(cam) => { activeCameraRef.current = cam; }} />
        <SkySphere />
        <SceneAmbientLight />
        {layers.realSun ? (
          <>
            <SunLight />
            <CategoryLayerGroup layer={LAYER_ENVIRONMENT}>
              <SunSphere />
            </CategoryLayerGroup>
          </>
        ) : (
          <SceneDirectionalLight />
        )}

        {/* Contrôleur unifié : synchronise camera.layers avec les toggles UI */}
        <SceneLayerController layers={layers} />

        <AdaptiveDpr pixelated />
        <PerformanceMonitor />
        <ShadowWarmup />
        <ShadowController enabled={layers.shadows} />
        <FrameloopController isIdle={isIdle} showInventory={showInventory} isCvModalOpen={isCvModalOpen} isPhotoModeOpen={isPhotoModeOpen} isAnimActive={isAnimActive} />
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
        <VRMode />
        <ImmersiveMode />
        <HoverRaycaster />
        <DevToolsCollector />
        <GlbReveal />
        {/* Overlays React (non soumis aux layers Three.js) */}
        {layers.wireframe   && <WireframeLayer />}
        <Suspense fallback={null}>
          {layers.aiZones && <AiZonesHelper />}
          {(layers.debugNpcCollisions || layers.debugFurnitureCollisions) && <CollisionDebugHelper />}
        </Suspense>
        {layers.wallEdges   && <WallEdgesLayer />}
        {layers.measuredDimensions && <RealMeasurementsLayer />}

        {layers.wallEdges   && <EdgeHoverRaycaster />}
        {layers.grid        && <GridLayer depthTest={layers.gridDepth} />}
        {layers.inventoryGrid && (
          <Suspense fallback={null}>
            <GridLayout />
          </Suspense>
        )}
        {layers.lights      && <LightHelpers />}
        {layers.plan        && <FloorPlan />}
        {cameraMode === 'top' && measurementActive && <MeasurementTool />}
        {/* Contenu 3D — masqué en mode Plan */}
        <Suspense fallback={null}>
        {/* Animations — exécutées une fois les éléments Suspense 3D résolus */}
        {buildAnimMatrix && <BuildAnimationMatrix onReady={handleReady} onFinish={() => setBuildAnimMatrix(false)} onDuration={setDuration('buildAnimMatrix')} />}
        <CameraController planeMode={planeMode} />
        <GpuWarmup active={assetsLoaded} onReady={handleReady} />
        <group visible={!layers.plan}>

          {/*
           * LAYER_WALL_STRUCTURE (24) — murs, cloisons, linteaux, piliers
           * LAYER_DOORS (26) — portes (séjour, SDB, entrée, baie vitrée)
           * LAYER_STRUCTURE (28) — dalle béton, plafonds (géré dans Floor)
           * LAYER_FLOOR_COVERINGS (25) — parquet, carrelage, pvc, plinthes (géré dans Floor)
           */}
          <CategoryLayerGroup layer={LAYER_WALL_STRUCTURE} visible={layers.wallStructure} wireframe={layers.wireframe || layers.wireframeWallStructure}>
            <Walls pillarsOnly={layers.pillarsOnly} />
          </CategoryLayerGroup>

          <CategoryLayerGroup layer={LAYER_DOORS} visible={layers.doors} wireframe={layers.wireframe || layers.wireframeDoors}>
            {!layers.pillarsOnly && <DoorsPlacement />}
          </CategoryLayerGroup>

          <Floor />
          {/* LAYER_WALKER (18) — Personnages 3D */}
          <CategoryLayerGroup layer={LAYER_WALKER} visible={layers.walker}>
            <Walker walkerAnim={laraGridActive ? laraGridAnim : undefined} />
          </CategoryLayerGroup>
          <GlobalSkeletonHelpers show={layers.skeleton} />
          {/*
           * LAYER_EQUIPMENT (1) — équipements sanitaires et cuisine.
           * GLB toggle via React visible (indépendant de camera.layers).
           */}
          <CategoryLayerGroup layer={LAYER_EQUIPMENT} visible={layers.equipment}>
            <Equipment />
          </CategoryLayerGroup>

          {/*
           * LAYER_FURNITURE (12) — Structure & gros volumes.
           */}
          <CategoryLayerGroup layer={LAYER_FURNITURE} visible={layers.furniture}>
            <Furniture />
          </CategoryLayerGroup>

          {/*
           * LAYER_FURNISHINGS (21) — Habillage & confort fonctionnel.
           */}
          <CategoryLayerGroup layer={LAYER_FURNISHINGS} visible={layers.furnishings}>
            <Furnishings />
            {/* Cadres GLB Nissedal — habillage mural */}
            <MirrorFrames />
          </CategoryLayerGroup>

          {/*
           * LAYER_DECOR (22) — Détails & habillage de surface.
           */}
          <CategoryLayerGroup layer={LAYER_DECOR} visible={layers.decor}>
            <Decor />
          </CategoryLayerGroup>

          {/* LAYER_ANIMALS (20) — Animaux autonomes (Robin Bird, Shiba Inu) */}
          <CategoryLayerGroup layer={LAYER_ANIMALS} visible={layers.animals}>
            <Animals />
          </CategoryLayerGroup>

          {/* LAYER_MIRRORS (17) — plans de réflexion Reflector uniquement (coûteux) */}
          <CategoryLayerGroup layer={LAYER_MIRRORS} visible={layers.mirrors}>
            <MirrorReflectors />
          </CategoryLayerGroup>

          {/* LAYER_NEIGHBORS (14) — appartements voisins */}
          {layers.neighbors && (
            <CategoryLayerGroup layer={LAYER_NEIGHBORS} visible={layers.neighbors}>
              <Neighbors />
            </CategoryLayerGroup>
          )}

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
      {!hideUI && (
        <>
          <SidePanel
            layers={layers} onToggleLayer={onToggleLayer}
            onOpenInventory={() => setShowInventory(true)}
            lidarMode={lidarMode} onCycleLidar={onCycleLidar}
            lidarOpacity={lidarOpacity} onToggleLidarOpacity={onToggleLidarOpacity}
            buildAnimMatrix={buildAnimMatrix}
            onStartBuildAnimMatrix={startMatrix}
            onStopBuildAnim={stopAll}
            animDurations={animDurations}
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
            onToggleHideUI={toggleHideUI}
          />
          <LaraGridToolbar />
          {laraGridActive && (
            <AnimFrameController
              animName={currentLaraAnimLabel}
              animKey={laraGridAnim}
              onCycleAnim={cycleLaraAnim}
              onSelectAnim={(nextVal) => {
                setLaraGridAnim(nextVal);
                document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: nextVal } }));
                useAnimPreviewStore.getState().play();
              }}
              bottom={16}
              style={{
                position: 'fixed',
                left: isMobile ? 12 : 288,
                right: isMobile ? 12 : 24,
                maxWidth: isMobile ? 'calc(100vw - 24px)' : 920,
                margin: '0 auto',
                zIndex: 96,
              }}
            />
          )}
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
          <RightSidePanel />
          {isMobile && <Minimap />}
          {showInventory && (
            <Suspense fallback={null}>
              <Inventory visible onClose={() => setShowInventory(false)} initialCategory={inventoryInitialCat} />
            </Suspense>
          )}
          <VirtualDPad />
          <HoverOverlay />
          {layers.aiZones && <ZoneAiDebugOverlay />}
          {layers.wallEdges && <EdgeHoverOverlay />}
          <AppConsole hidden={showInventory} />
        </>
      )}
      {isPhotoModeOpen && activeSceneRef.current && activeCameraRef.current && (
        <Suspense fallback={null}>
          <RaytracingPhotoModal
            scene={activeSceneRef.current}
            camera={activeCameraRef.current}
            onClose={() => useSceneStore.getState().setPhotoModeOpen(false)}
          />
        </Suspense>
      )}
      {hideUI && (
        <button
          onClick={showUI}
          className="btn btn-dark btn-sm position-fixed opacity-50 hover-opacity-100 shadow-sm"
          style={{ top: 12, right: 12, zIndex: 9999, fontSize: '10px' }}
          title="Réafficher l'interface (Touche 0)"
        >
          👁️ Afficher UI [0]
        </button>
      )}
    </div>
  );
}
