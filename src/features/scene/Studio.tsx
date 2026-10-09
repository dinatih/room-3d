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
  PerspectiveCamera, OrthographicCamera,
} from 'three';
import { CameraController } from '@features/scene/CameraController';
import { CameraViewMarkers } from './CameraViewMarkers';
import { cameraState }      from '@features/scene/cameraState';
import { SKY_START_POS }     from '@features/scene/camera';
import { parseUrlHideUI, updateUrlHideUI, parseUrlFlightMode, updateUrlFlightMode } from '@features/scene/camera/cameraUrlParams';
import { SidePanel, type LidarMode } from '@features/scene/SidePanel';
import { ShortcutsModal } from './sidepanel/modals/ShortcutsModal';
import { Walls, Floor, DoorsPlacement, MirrorFrames, MirrorReflectors } from './Building';
import { Neighbors }        from '@features/scene/Neighbors';
import { CategoryLayerGroup, SceneLayerController } from '@features/scene/sceneLayer';
import { Equipment, Furniture, Furnishings, Decor, Animals } from './Placements';
import { CharacterGroup } from './character';
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
import { AIRCRAFT_MODELS, DEFAULT_PLANE_MODEL } from './aircraftModels';
import { PlaneControls } from './PlaneControls';
import { PaperPlane, type PlaneModelKey, type PlaneViewMode } from '@features/scene/PaperPlane';
import { AutopilotPlane }             from '@features/scene/AutopilotPlane';
import { LandingStrips }              from '@features/scene/LandingStrips';
import { useSceneStore }              from '@features/scene/store/useSceneStore';
import type { LayerState } from './sidepanel/types';
import { HDRI_LIST, getHdriById }  from '@features/scene/hdriConfig';
import { useAppIdle }                  from './idleState';
import { MeasurementTool }            from './MeasurementTool';
import { RealMeasurementsLayer }      from './RealMeasurementsLayer';
import { AppConsole }                 from '@features/ui/AppConsole';
import { GlobalSkeletonHelpers } from './utils/GlobalSkeletonHelpers';
import { InventoryObjectsGrid }  from '@features/scene/InventoryObjectsGrid';
import { frameCharacterGridCamera } from './character/characterGridUtils';
import { useCharacterGridStore } from './character/useCharacterGridStore';
import { isExtraCharacter } from './characterConfig';
import { ViewControlBar }        from './ViewControlBar';
import { AnimFrameController }   from '@features/inventory/AnimFrameController';
import { useAnimPreviewStore }   from '@features/inventory/useAnimPreviewStore';
import { WALKER_ANIM_OPTIONS }   from '@features/scene/animOptions';
import { resolveAnimationId, resolveAnimationPath }    from './animations/animationResolver';
import { NPC_WALK_ANIMATIONS }   from './ai/agent/agentWalkAnimations';
import { cacheDynamicGLTF }      from './character/useCharacterAnimations';
import { duoSessionManager }     from './ai/duoSessionManager';
import { LoadingShiba } from './LoadingShiba';
import { useIsMobile } from '@shared/hooks/useIsMobile';

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
  resolveAnimationPath('idle'),
  resolveAnimationPath('pistol-kneel-to-stand'),
  resolveAnimationPath('falling'),
  resolveAnimationPath('falling-idle'),
  ...NPC_WALK_ANIMATIONS.map(animKey => resolveAnimationPath(animKey)),
].filter(Boolean);

/** Pré-compilation GPU, pré-téléchargement des animations essentielles et exécution de frames de warm-up pendant la page de préchargement. */
function GpuWarmup({ active, onReady }: { active: boolean; onReady: () => void }) {
  const { gl, scene, camera, invalidate } = useThree();
  const readyRef = useRef(false);
  const [warmupError, setWarmupError] = useState<Error | null>(null);

  useEffect(() => {
    if (!active || readyRef.current) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    // 1. Précharger en mémoire l'animation d'atterrissage, de chute et toutes les animations de marche aléatoires
    const animPreloads = Promise.allSettled(
      WARMUP_ANIM_PATHS.map(path => cacheDynamicGLTF(path))
    );

    const prepare = async () => {
      // Attendre les shaders avant de rendre les frames de warm-up : un rendu
      // anticipé pourrait forcer leur compilation synchrone et bloquer le shiba.
      await gl.compileAsync(scene, camera);
      if (cancelled) return;

      let frames = 0;
      interval = setInterval(() => {
        frames++;
        gl.shadowMap.needsUpdate = true;
        invalidate();
        if (frames >= 7) {
          clearInterval(interval);
          void animPreloads.then(() => {
            if (!cancelled && !readyRef.current) {
              readyRef.current = true;
              onReady();
            }
          });
        }
      }, 350);
    };
    void prepare().catch(error => {
      if (!cancelled) setWarmupError(error instanceof Error ? error : new Error(String(error)));
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [active, gl, scene, camera, invalidate, onReady]);

  if (warmupError) throw warmupError;
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

function ActiveCameraCapture({ onCapture }: { onCapture: (cam: PerspectiveCamera | OrthographicCamera) => void }) {
  const { camera } = useThree();
  useEffect(() => {
    onCapture(camera as PerspectiveCamera | OrthographicCamera);
  }, [camera, onCapture]);
  return null;
}

function LoadingProgress({
  sceneReady,
  onAssetsLoaded,
  onCountdownStart,
  onCountdownTick,
  onLaunch,
}: {
  sceneReady: boolean;
  onAssetsLoaded: () => void;
  onCountdownStart: () => void;
  onCountdownTick: (seconds: number) => void;
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
    onCountdownStart();

    const itemEl = document.getElementById('loading-item');
    const countdownContainer = document.getElementById('loading-countdown-container');
    const timerEl = document.getElementById('loading-countdown-timer');
    const textEl = document.getElementById('loading-countdown-text');
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
      if (textEl) textEl.textContent = '🚀 Lancement de la scène 3D…';
      onLaunch();
    };

    if (btnStart) btnStart.onclick = launchApp;

    countdownTimerRef.current = setInterval(() => {
      remainingSeconds--;
      onCountdownTick(remainingSeconds);
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
  }, [sceneReady, onLaunch, onCountdownStart, onCountdownTick]);

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
  const isMobile = useIsMobile();
  const layers = useSceneStore(state => state.layers);
  const measurementActive = useSceneStore(state => state.measurementActive);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const onToggleLayer = useSceneStore(state => state.toggleLayer);
  const toggleLayer = useCallback((key: keyof LayerState) => {
    if (key === 'inventoryGrid') {
      document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'toggle-inventory-grid' }));
    }
    onToggleLayer(key);
  }, [onToggleLayer]);

  const [showInventory, setShowInventory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const openShortcuts = () => setShowShortcuts(true);
    window.addEventListener('open-shortcuts-modal', openShortcuts);
    return () => window.removeEventListener('open-shortcuts-modal', openShortcuts);
  }, []);
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


  const [planeMode,          setPlaneMode]          = useState(parseUrlFlightMode);
  useEffect(() => { updateUrlFlightMode(planeMode); }, [planeMode]);
  const [planeModel,         setPlaneModel]         = useState<PlaneModelKey>(DEFAULT_PLANE_MODEL);
  const cyclePlaneModel = useCallback(() => {
    const models: PlaneModelKey[] = AIRCRAFT_MODELS.map(entry => entry.key);
    setPlaneModel(current => models[(models.indexOf(current) + 1) % models.length]);
    cameraState.invalidate?.();
  }, []);
  const [autopilotVisible,   setAutopilotVisible]   = useState(false);
  const [showLandingStrips,  setShowLandingStrips]  = useState(false);
  const [planeViewMode,      setPlaneViewMode]      = useState<PlaneViewMode>('prelaunch');
  const [planeLaunched,      setPlaneLaunched]      = useState(false);

  // Alt+V → toggle mode avion (ignoré quand un input/textarea est focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'v' && e.key !== 'V') return;
      if (e.repeat) return;
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
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
  const characterGridActive = useSceneStore(state => state.layers.characterGrid);
  const laraCount = useSceneStore(state => state.layers.laraCount);
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const activeMainIds = useSceneStore(state => state.activeMainIds);

  const characterGridAnim = useCharacterGridStore(state => state.animation);
  const characterGridDuo = useCharacterGridStore(state => state.duo);
  const characterGridPartner = useCharacterGridStore(state => state.partnerId);
  const firstGridFrame = useRef(true);
  const setCharacterGridAnim = useCallback((animation: string) => {
    useCharacterGridStore.setState({ animation, duo: undefined });
  }, []);

  useEffect(() => {
    if (characterGridActive) {
      useCharacterGridStore.setState({ animation: 'idle', duo: undefined });
      useAnimPreviewStore.getState().reset();
      duoSessionManager.leaveAllSessions();
    } else {
      useCharacterGridStore.setState({ duo: undefined });
    }
  }, [characterGridActive]);

  useEffect(() => {
    if (firstGridFrame.current) {
      firstGridFrame.current = false;
      if (characterGridActive) return;
    }
    if (characterGridActive && !showInventory) {
      frameCharacterGridCamera(undefined, useSceneStore.getState().cameraProjection === 'ortho' ? 'ortho' : 'persp');
    }
  }, [characterGridActive, laraCount, extraCharacters, activeExtraIds, activeMainIds, characterGridDuo, characterGridPartner, showInventory]);

  useEffect(() => {
    if (!extraCharacters && isExtraCharacter(characterGridPartner)) {
      useCharacterGridStore.setState({ partnerId: 'native' });
    }
  }, [extraCharacters, characterGridPartner]);

  // Synchronisation avec les changements d'animation de Lara
  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e.detail?.key === 'character-anim-lara' && e.detail?.value) {
        setCharacterGridAnim(e.detail.value);
      }
    };
    document.addEventListener('furniture-toggle', handleToggle);
    return () => document.removeEventListener('furniture-toggle', handleToggle);
  }, [setCharacterGridAnim]);

  const currentLaraAnimOpt = WALKER_ANIM_OPTIONS.find(a => a.value === characterGridAnim || a.value === resolveAnimationId(characterGridAnim));
  const currentLaraAnimLabel = characterGridAnim === 't-pose'
    ? 'T-Pose'
    : (currentLaraAnimOpt ? currentLaraAnimOpt.label : characterGridAnim);

  // G → toggle mode grille de personnages (ignoré quand un input/textarea est focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;

      // Alt+<key> → layer toggles
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'k') {
          e.preventDefault();
          if (e.repeat) return;
          const store = useSceneStore.getState();
          store.setLaraCount(store.layers.laraCount === 15 ? 4 : 15);
          return;
        }
        if (k === 'p') {
          e.preventDefault();
          if (e.shiftKey) {
            onToggleLayer('pillarsOnly');
            cameraState.invalidate?.();
          } else {
            setInventoryInitialCat('characters');
            setShowInventory(true);
          }
          return;
        }
        if (k === 'b' && !e.shiftKey) { e.preventDefault(); if (e.repeat) return; onToggleLayer('grid'); cameraState.invalidate?.(); return; }
        if (k === 'm') { e.preventDefault(); onToggleLayer('measuredDimensions'); cameraState.invalidate?.(); return; }
        if (k === 'a') { e.preventDefault(); onToggleLayer('wallEdges'); cameraState.invalidate?.(); return; }
        if (k === 'i') { e.preventDefault(); toggleLayer('inventoryGrid'); cameraState.invalidate?.(); return; }
        if (k === 'w') { e.preventDefault(); onToggleLayer('wallStructure'); cameraState.invalidate?.(); return; }
        if (k === 'q') { e.preventDefault(); onToggleLayer('structure'); cameraState.invalidate?.(); return; }
        if (k === 'f') { e.preventDefault(); onToggleLayer('furniture'); cameraState.invalidate?.(); return; }
        if (k === 'd') { e.preventDefault(); onToggleLayer('decor'); cameraState.invalidate?.(); return; }
        if (k === 'h') { e.preventDefault(); onToggleLayer('furnishings'); cameraState.invalidate?.(); return; }
        if (k === 'e') { e.preventDefault(); onToggleLayer('extraCharacters'); cameraState.invalidate?.(); return; }
        if (k === 'u') { e.preventDefault(); onToggleLayer('equipment'); cameraState.invalidate?.(); return; }
        if (k === 'g') { e.preventDefault(); onToggleLayer('mirrorsHD'); cameraState.invalidate?.(); return; }
        if (k === 'z') { e.preventDefault(); onToggleLayer('laraTopOff'); cameraState.invalidate?.(); return; }
        if (k === 'c') { e.preventDefault(); onToggleLayer('laraBottomOff'); cameraState.invalidate?.(); return; }
        if (k === 'x') { e.preventDefault(); onToggleLayer('laraNude'); cameraState.invalidate?.(); return; }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (cameraState.mode === 'plane' && ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) return;

      if (e.key === 'w' || e.key === 'W') {
        onToggleLayer('wireframe');
        cameraState.invalidate?.();
      } else if (e.key === 'i' || e.key === 'I') {
        setInventoryInitialCat('all');
        setShowInventory(prev => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        onToggleLayer('aiZones');
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
  }, [onToggleLayer, toggleLayer]);


  const [buildAnimMatrix,  setBuildAnimMatrix]  = useState(false);
  const [assetsLoaded,     setAssetsLoaded]     = useState(false);
  const [showLoadingShiba, setShowLoadingShiba] = useState(true);
  const [loadingCountdownStarted, setLoadingCountdownStarted] = useState(false);
  const [loadingCountdown, setLoadingCountdown] = useState(5);
  const handleCountdownStart = useCallback(() => setLoadingCountdownStarted(true), []);
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
  const activeCameraRef = useRef<PerspectiveCamera | OrthographicCamera | null>(null);
  const activeGlRef = useRef<WebGLRenderer | null>(null);

  const revealScene = useCallback(() => {
    const cover = document.getElementById('loading');
    const card = document.getElementById('loading-card');
    const envelope = document.getElementById('loading-envelope');
    const backdrop = document.getElementById('loading-backdrop');

    // Le vol caméra attend que la carte soit rentrée et la toile refermée.
    const startIntro = () => {
      envelope?.removeEventListener('animationend', onEnvelopeExit);
      if (backdrop) {
        backdrop.classList.add('exiting');
      }
      window.dispatchEvent(new CustomEvent('start-camera-intro'));
      document.dispatchEvent(new CustomEvent('start-camera-intro'));
      // Sécurité si aucun événement de fin du vol caméra n'est reçu.
      setTimeout(cleanup, 2200);
    };
    const onEnvelopeExit = (event: AnimationEvent) => {
      if (event.animationName === 'loading-canvas-close') startIntro();
    };

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      envelope?.removeEventListener('animationend', onEnvelopeExit);
      cameraState.isSceneLaunched = true;
      cover?.remove();
    };

    const onIntroFinish = () => {
      window.removeEventListener('camera-intro-finished', onIntroFinish);
      cleanup();
    };

    window.addEventListener('camera-intro-finished', onIntroFinish);

    envelope?.addEventListener('animationend', onEnvelopeExit);
    card?.classList.add('exiting');
    envelope?.classList.add('exiting');
    if (!envelope || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startIntro();
    }
  }, []);

  const handleReady = useCallback(() => {
    setSceneWarmReady(true);
  }, []);

  const handleLaunch = useCallback(() => {
    setShowLoadingShiba(false);
    revealScene();
  }, [revealScene]);

  const isAnimActive = buildAnimMatrix;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <LoadingProgress sceneReady={sceneWarmReady} onAssetsLoaded={handleAssetsLoaded} onCountdownStart={handleCountdownStart} onCountdownTick={setLoadingCountdown} onLaunch={handleLaunch} />
      {showLoadingShiba && <LoadingShiba countdownStarted={loadingCountdownStarted} countdownSeconds={loadingCountdown} />}
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
          preserveDrawingBuffer: true,
        }}
        onCreated={({ scene, gl, camera }) => {
          (window as any).threeScene = scene;
          (window as any).threeCamera = camera;
          (window as any).threeGl = gl;
          activeSceneRef.current = scene;
          activeCameraRef.current = camera as PerspectiveCamera | OrthographicCamera;
          activeGlRef.current = gl;
          scene.background = new Color(0x02030a);
          gl.shadowMap.enabled = true;
          camera.layers.enableAll();
          // LAYER_WALKER_DETAIL réservé aux miroirs (cf. Character FPS hide)
          camera.layers.disable(LAYER_WALKER_DETAIL);
          setupEnvironment(scene, gl);
        }}
      >
        <ActiveCameraCapture onCapture={(cam) => { activeCameraRef.current = cam; }} />
        <CameraViewMarkers />
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
                           onCycleModel={cyclePlaneModel}
                           onViewModeChange={(vm, launched) => {
                             setPlaneViewMode(vm);
                             setPlaneLaunched(launched);
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
            <InventoryObjectsGrid />
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
          <CategoryLayerGroup layer={LAYER_WALKER} visible={layers.character}>
            <CharacterGroup characterAnim={characterGridActive ? characterGridAnim : undefined} duoAnimDef={characterGridActive ? characterGridDuo : undefined} duoPartnerId={characterGridPartner} />
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
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      <SidePanel
        layers={layers} onToggleLayer={toggleLayer}
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
        hideUI={hideUI || planeMode || (isMobile && showInventory)}
      />
      <div className={`ui-fade-overlay ${hideUI ? 'ui-hidden' : ''}`}>
        {planeMode && <PlaneControls model={planeModel} onCycleModel={cyclePlaneModel} viewMode={planeViewMode} launched={planeLaunched} onExit={() => setPlaneMode(false)} />}
        <VirtualDPad visible={!hideUI && !planeMode && !showInventory && !characterGridActive} />
        <ViewControlBar
          hidden={planeMode || showInventory}
          showCharacterModes
          hideUI={hideUI}
          onToggleHideUI={toggleHideUI}
          onEnterFlight={() => {
            setPlaneViewMode('prelaunch');
            setPlaneLaunched(false);
            setPlaneMode(true);
          }}
        >
          {characterGridActive && (
            <AnimFrameController
              compact
              className="mw-100 scene-anim-controller"
              keyboardEnabled={!showInventory && !planeMode}
              isHumanCharacter
              allowSamePartner
              duoAnimDef={characterGridDuo}
              duoPartnerId={characterGridPartner}
              onSelectDuoAnim={(duo) => {
                useCharacterGridStore.setState({ duo });
                useAnimPreviewStore.getState().seekToTime(0);
                useAnimPreviewStore.getState().play();
              }}
              onSelectDuoPartner={(partnerId) => useCharacterGridStore.setState({ partnerId })}
              animName={characterGridDuo?.label ?? currentLaraAnimLabel}
              animKey={characterGridAnim}
              onSelectAnim={(nextVal) => {
                setCharacterGridAnim(nextVal);
                document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'character-anim-lara', value: nextVal } }));
                useAnimPreviewStore.getState().play();
              }}
              style={{
                position: 'relative',
                inset: 'auto',
                width: 'fit-content',
                margin: 0,
                zIndex: 96,
              }}
            />
          )}
        </ViewControlBar>
        <HoverOverlay />
        {layers.aiZones && <ZoneAiDebugOverlay />}
        {layers.wallEdges && <EdgeHoverOverlay />}
      </div>
      {showInventory && (
        <Suspense fallback={null}>
          <Inventory visible onClose={() => setShowInventory(false)} initialCategory={inventoryInitialCat} />
        </Suspense>
      )}
      <AppConsole hidden={showInventory || planeMode} hideUI={hideUI} />
      {isPhotoModeOpen && activeSceneRef.current && activeCameraRef.current && activeGlRef.current && (
        <Suspense fallback={null}>
          <RaytracingPhotoModal
            gl={activeGlRef.current}
            scene={activeSceneRef.current}
            camera={activeCameraRef.current}
            onClose={() => useSceneStore.getState().setPhotoModeOpen(false)}
          />
        </Suspense>
      )}
      <button
        onClick={showUI}
        className={`btn btn-dark btn-sm position-fixed opacity-50 hover-opacity-100 shadow-sm ui-fade-overlay ${!hideUI ? 'ui-hidden' : ''}`}
        style={{ top: 12, right: 12, zIndex: 9999, fontSize: '10px' }}
        title="Réafficher l'interface (Touche 0)"
      >
        👁️ Afficher UI [0]
      </button>
    </div>
  );
}
