/**
 * RaytracingPhotoModal.tsx
 *
 * Modale de capture photo au Raytracing / Path Tracing ultra-réaliste.
 * Utilise `three-gpu-pathtracer` pour calculer l'illumination globale physique,
 * les réflexions/réfractions réalistes et la profondeur de champ (Bokeh artistique).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GenerateMeshBVHWorker } from 'three-mesh-bvh/worker';
import { WebGLPathTracer, PhysicalCamera, DenoiseMaterial } from 'three-gpu-pathtracer';
import './RaytracingPhotoModal.css';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { getLoadedSkyTexture } from '../SkySphere';
import { getUrlParams } from '../camera/cameraUrlParams';
import { RAYTRACING_DEBUG_POS, PERSP_TARGET } from '../camera/cameraConstants';
import { packRenderArchive } from './renderArchive';
import { serializeRenderScene } from './serializeRenderScene';
import { splitMultiMaterialMeshes } from './splitMultiMaterialMeshes';
import {
  LAYER_STRUCTURE,
  LAYER_EQUIPMENT,
  LAYER_FURNITURE,
  LAYER_FURNISHINGS,
  LAYER_DECOR,
  LAYER_WALKER,
  LAYER_WALKER_DETAIL,
  LAYER_MIRRORS,
  LAYER_ANIMALS,
  LAYER_ROBOTS,
  LAYER_ENVIRONMENT,
} from '@config';

export interface RaytracingPhotoModalProps {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  onClose: () => void;
}

type ResolutionPreset = '720p' | 'fit' | '1080p' | '2k' | 'square' | 'portrait';

interface ResolutionOption {
  id: ResolutionPreset;
  label: string;
  width: number;
  height: number;
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { id: '720p', label: 'HD · 1280 × 720', width: 1280, height: 720 },
  { id: 'fit', label: 'Adapter à l’aperçu', width: 0, height: 0 },
  { id: '1080p', label: 'Full HD · 1920 × 1080', width: 1920, height: 1080 },
  { id: '2k', label: 'QHD · 2560 × 1440', width: 2560, height: 1440 },
  { id: 'square', label: 'Carré · 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait · 720 × 1280', width: 720, height: 1280 },
];

/**
 * Réduit la résolution d'une texture HDR (ex: 8K -> 1K) pour l'échantillonnage CDF de three-gpu-pathtracer.
 * Évite l'allocation de 1.5 à 2 Go de RAM JavaScript lors du pré-calcul des CDF de luminance, évitant ainsi les crashs OOM Chrome.
 */
function downsampleHdr(hdrTexture: THREE.Texture, targetWidth = 1024, targetHeight = 512): THREE.Texture {
  if (!hdrTexture || !(hdrTexture as any).image) return hdrTexture;
  const { width, height, data } = (hdrTexture as any).image;
  if (!width || !height || !data) return hdrTexture;
  if (width <= targetWidth && height <= targetHeight) return hdrTexture;

  const stepX = width / targetWidth;
  const stepY = height / targetHeight;
  const newLength = targetWidth * targetHeight * 4;
  const newData = new (data.constructor as any)(newLength);

  for (let y = 0; y < targetHeight; y++) {
    const srcY = Math.min(height - 1, Math.floor(y * stepY));
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.min(width - 1, Math.floor(x * stepX));
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      newData[dstIdx] = data[srcIdx];
      newData[dstIdx + 1] = data[srcIdx + 1];
      newData[dstIdx + 2] = data[srcIdx + 2];
      newData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  const downsampled = new THREE.DataTexture(
    newData,
    targetWidth,
    targetHeight,
    hdrTexture.format as any,
    hdrTexture.type
  );
  downsampled.minFilter = THREE.LinearFilter;
  downsampled.magFilter = THREE.LinearFilter;
  downsampled.wrapS = THREE.RepeatWrapping;
  downsampled.wrapT = THREE.ClampToEdgeWrapping;
  downsampled.mapping = THREE.EquirectangularReflectionMapping;
  downsampled.needsUpdate = true;
  return downsampled;
}

export function RaytracingPhotoModal({ gl, scene, camera, onClose }: RaytracingPhotoModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  // Moteur et références internes
  const pathTracerRef = useRef<WebGLPathTracer | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const renderCameraRef = useRef<PhysicalCamera | THREE.OrthographicCamera | null>(null);
  const wakeRenderLoopRef = useRef<(() => void) | null>(null);
  const originalMaterialsMapRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const restoreSplitMeshesRef = useRef<(() => void) | null>(null);
  const hiddenHelpersRef = useRef<THREE.Object3D[]>([]);
  const denoiseQuadRef = useRef<FullScreenQuad | null>(null);
  const denoiseMatRef = useRef<DenoiseMaterial | null>(null);
  const enableDenoiseRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(false);
  const targetSamplesRef = useRef<number>(40);
  const denoisedAppliedRef = useRef<boolean>(false);
  const savedBackgroundRef = useRef<THREE.Color | THREE.Texture | null | undefined>(undefined);
  const savedEnvironmentRef = useRef<THREE.Texture | null | undefined>(undefined);
  const downsampledEnvRef = useRef<THREE.Texture | null>(null);
  const tempLightsRef = useRef<THREE.Object3D[]>([]);

  const [renderLocally, setRenderLocally] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paramètres de rendu
  const [resolution, setResolution] = useState<ResolutionPreset>('720p');
  const [enableDenoise, setEnableDenoise] = useState<boolean>(true);
  const [showCharacters, setShowCharacters] = useState<boolean>(false);
  const [targetSamples, setTargetSamples] = useState<number>(40);
  const [bounces, setBounces] = useState<number>(6);
  const [exposure, setExposure] = useState<number>(1.0);

  // Profondeur de champ (Depth of Field / Bokeh)
  const [dofEnabled, setDofEnabled] = useState<boolean>(false);
  const [focusDistance, setFocusDistance] = useState<number>(350); // cm
  const [fStop, setFStop] = useState<number>(2.8);

  // État de l'accumulation
  const [currentSamples, setCurrentSamples] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [bvhProgress, setBvhProgress] = useState<number | null>(null);
  const [isBuildingScene, setIsBuildingScene] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [samplesPerSecond, setSamplesPerSecond] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Anneau visuel autofocus
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  // Fermeture du mode photo.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F10') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Initialisation de la distance de focus initiale au point d'impact central de la caméra
  useEffect(() => {
    try {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.layers.mask = camera.layers.mask;
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) {
        setFocusDistance(Math.round(hits[0].distance));
      }
    } catch {}
  }, [scene, camera]);

  // Préparation de la scène avant construction du BVH (remplacement des miroirs, masquage des helpers, assainissement des matériaux)
  const prepareScene = useCallback(() => {
    const hidden = hiddenHelpersRef.current;
    const matMap = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    originalMaterialsMapRef.current = matMap;

    // Mettre à jour toutes les matrices mondiales (notamment les os des SkinnedMeshes)
    scene.updateMatrixWorld(true);

    const isCharacterObj = (obj: THREE.Object3D) => {
      return (
        (obj.layers.mask & (1 << LAYER_WALKER)) !== 0 ||
        (obj.layers.mask & (1 << LAYER_WALKER_DETAIL)) !== 0 ||
        (obj.userData?.itemName && (obj.userData.itemName.startsWith('Personnage') || obj.userData.itemName.startsWith('PNJ'))) ||
        (obj.name || '').toLowerCase().includes('personnage') ||
        (obj.name || '').toLowerCase().includes('pnj') ||
        (obj.name || '').toLowerCase().includes('walker') ||
        (obj.name || '').toLowerCase().includes('laracroft')
      );
    };

    if (showCharacters) {
      scene.traverse((obj) => {
        if (isCharacterObj(obj)) {
          obj.visible = true;
        }
      });
    } else {
      scene.traverse((obj) => {
        if (isCharacterObj(obj) && obj.visible) {
          obj.visible = false;
          hidden.push(obj);
        }
      });
    }

    scene.traverse((obj) => {
      const name = (obj.name || '').toLowerCase();

      // Masquer les colliders et proxies de survol invisibles (ex: cylindres de sélection des personnages)
      if (
        obj.userData?.isHoverProxy ||
        name.includes('hoverproxy') ||
        name.includes('hitbox')
      ) {
        if (obj.visible) {
          obj.visible = false;
          hidden.push(obj);
        }
        return;
      }

      // Personnages : gérés selon l'option showCharacters
      if (isCharacterObj(obj)) {
        return;
      }

      // Animaux : ne pas masquer
      const isAnimal = (obj.layers.mask & ((1 << LAYER_ANIMALS) | (1 << LAYER_ROBOTS))) !== 0;
      if (isAnimal) {
        return;
      }

      // Masquer les dômes de ciel 3D et backdrops (le path-tracer utilise nativement scene.environment)
      if (
        name.includes('skysphere') ||
        name.includes('skydome') ||
        name.includes('spacebackdrop') ||
        name.includes('sunsphere') ||
        (obj.userData && obj.userData.isSky)
      ) {
        obj.traverse((child) => {
          if (child.visible) {
            child.visible = false;
            hidden.push(child);
          }
        });
        return;
      }

      // Masquer nuages de points (Lidar), lignes et sprites (non supportés par le raytracing surfacique)
      if ((obj as any).isPoints || (obj as any).isLine || (obj as any).isLineSegments || (obj as any).isSprite) {
        if (obj.visible) {
          obj.visible = false;
          hidden.push(obj);
        }
        return;
      }

      // Masquer les helpers, grilles, repères et gizmos visuels de dev
      const isHelper =
        obj.type.includes('Helper') ||
        (obj as any).isSkeletonHelper ||
        name.includes('helper') ||
        name.includes('gizmo') ||
        name.includes('grid') ||
        name.includes('landingstrip') ||
        name.includes('collision') ||
        name.includes('aizone') ||
        name.includes('hoveroverlay') ||
        name.includes('edgehover') ||
        name.includes('measurement') ||
        name.includes('skeletonhelper');

      if (isHelper && obj.visible) {
        obj.traverse((child) => {
          if (child.visible) {
            child.visible = false;
            hidden.push(child);
          }
        });
        return;
      }

      // Assainir les sources de lumière (three-gpu-pathtracer lit light.color.r directement) et actualiser matrices
      if ((obj as any).isLight) {
        const light = obj as THREE.Light;
        if (!light.color || typeof (light.color as any).r !== 'number') {
          light.color = new THREE.Color(0xffffff);
        }
        if ((obj as any).isDirectionalLight) {
          const dir = obj as THREE.DirectionalLight;
          dir.updateMatrixWorld(true);
          if (dir.target) {
            dir.target.updateMatrixWorld(true);
          }
        }
        // Masquer les sources éteintes pour ne pas polluer l'échantillonnage de lumière
        if (light.intensity === 0 && light.visible) {
          light.visible = false;
          hidden.push(light);
        }
      }

      // Traiter et assainir les Mesh
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;

        // Troika génère les glyphes par shader ; son setter material attend un matériau de base unique.
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (materials.some(material => (material as THREE.Material & { isTroikaTextMaterial?: boolean })?.isTroikaTextMaterial)) {
          if (mesh.visible) {
            mesh.visible = false;
            hidden.push(mesh);
          }
          return;
        }

        // Détecter un miroir réflecteur (Reflector Three.js uniquement, jamais les cadres)
        const isFrame =
          name.includes('frame') ||
          name.includes('cadre') ||
          (obj.parent && ((obj.parent.name || '').toLowerCase().includes('frame') || (obj.parent.name || '').toLowerCase().includes('cadre')));

        const isReflector =
          !isFrame &&
          ((obj as any).type === 'Reflector' ||
            typeof (obj as any).getRenderTarget === 'function' ||
            (obj as any).isReflector ||
            (mesh.material as any)?.name === 'ReflectorShader' ||
            ((mesh.material as any)?.uniforms && 'textureMatrix' in (mesh.material as any).uniforms));

        if (isReflector) {
          matMap.set(mesh, mesh.material);
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.0,
            metalness: 1.0,
            side: THREE.DoubleSide,
          });
          return;
        }

        // Géométrie invalide ou vide -> masquer
        if (!mesh.geometry || !mesh.geometry.attributes?.position || mesh.geometry.attributes.position.count === 0) {
          if (mesh.visible) {
            obj.visible = false;
            hidden.push(obj);
          }
          return;
        }

        // Matériau manquant -> matériau standard par défaut
        if (!mesh.material) {
          matMap.set(mesh, mesh.material);
          mesh.material = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
          return;
        }
        const isChar = (mesh.layers.mask & (1 << LAYER_WALKER)) !== 0;

        const isArray = Array.isArray(mesh.material);
        const mats = isArray ? (mesh.material as THREE.Material[]) : [mesh.material as THREE.Material];
        let modified = false;

        const newMats = mats.map((m) => {
          if (!m) {
            throw new Error(`[Raytracing] Missing material on mesh "${mesh.name || mesh.uuid}".`);
          }

          // Personnages : s'assurer que les maillages ont DoubleSide pour éviter les faces arrière transparentes
          if (isChar) {
            if (m.side !== THREE.DoubleSide) {
              modified = true;
              const cloned = m.clone();
              cloned.side = THREE.DoubleSide;
              cloned.depthWrite = true;
              return cloned;
            }
          }

          // Matériaux invisibles (ex: noCapMat sur découpes de murs sans embouts)
          // Remplacer par un matériau complètement transparent pour que les rayons le traversent sans créer de bloc noir
          if (m.visible === false || m.opacity === 0) {
            modified = true;
            return new THREE.MeshStandardMaterial({
              transparent: true,
              opacity: 0,
              roughness: 1,
              depthWrite: false,
            });
          }

          // Matériau sans propriété color valide
          if (!(m as any).color || typeof (m as any).color.r !== 'number') {
            modified = true;
            return new THREE.MeshStandardMaterial({
              color: 0xd0d0d0,
              roughness: 0.5,
              metalness: 0.1,
            });
          }

          // Matériaux Basic (non PBR) -> conversion en Standard pour réagir correctement aux rebonds de lumière
          if (m.type === 'MeshBasicMaterial' && !(m as any).isMeshStandardMaterial) {
            modified = true;
            return new THREE.MeshStandardMaterial({
              color: (m as any).color,
              map: (m as any).map ?? null,
              transparent: m.transparent,
              opacity: m.opacity,
              roughness: 0.8,
              metalness: 0.1,
            });
          }

          // Sécuriser les propriétés physiques optionnelles que three-gpu-pathtracer inspecte via 'prop' in m
          if ('emissive' in m && (!(m as any).emissive || typeof (m as any).emissive.r !== 'number')) {
            (m as any).emissive = new THREE.Color(0x000000);
          }
          if ('sheenColor' in m && (!(m as any).sheenColor || typeof (m as any).sheenColor.r !== 'number')) {
            (m as any).sheenColor = new THREE.Color(0x000000);
          }
          if ('specularColor' in m && (!(m as any).specularColor || typeof (m as any).specularColor.r !== 'number')) {
            (m as any).specularColor = new THREE.Color(0xffffff);
          }
          if ('attenuationColor' in m && (!(m as any).attenuationColor || typeof (m as any).attenuationColor.r !== 'number')) {
            (m as any).attenuationColor = new THREE.Color(0xffffff);
          }

          return m;
        });

        if (modified) {
          matMap.set(mesh, mesh.material);
          mesh.material = isArray ? newMats : newMats[0];
        }
      }
    });

    restoreSplitMeshesRef.current = splitMultiMaterialMeshes(scene);

    // Détecter l'ambiance lumineuse et créer une douce lumière de remplissage physique zénithale
    let ambColor = new THREE.Color(0xfff5e0);
    let ambIntensity = 0.6;
    scene.traverse((obj) => {
      if ((obj as any).isAmbientLight) {
        const a = obj as THREE.AmbientLight;
        ambColor = a.color;
        ambIntensity = a.intensity;
      }
    });

    const fillLight = new THREE.DirectionalLight(ambColor, ambIntensity * 2.2);
    fillLight.position.set(300, 500, 300);
    fillLight.target.position.set(150, 0, 150);
    scene.add(fillLight);
    scene.add(fillLight.target);
    fillLight.updateMatrixWorld(true);
    fillLight.target.updateMatrixWorld(true);
    tempLightsRef.current.push(fillLight, fillLight.target);

    // Sauvegarder le background d'origine et connecter le ciel HDRI pour illuminer et habiller le fond
    savedBackgroundRef.current = scene.background;
    savedEnvironmentRef.current = scene.environment;
    const skyTex = getLoadedSkyTexture() || (scene.environment && (scene.environment as any).isDataTexture ? scene.environment : null);
    if (skyTex) {
      scene.background = skyTex;
      // Allègement drastique de la RAM : downsample 1K (1024x512) pour l'échantillonnage CDF de three-gpu-pathtracer
      // Évite l'allocation de 1.5 Go de FloatArrays par l'environnement 8K d'origine
      const smallEnv = downsampleHdr(skyTex, 1024, 512);
      if (smallEnv !== skyTex) {
        downsampledEnvRef.current = smallEnv;
      }
      scene.environment = smallEnv;
      if ('backgroundIntensity' in scene && 'environmentIntensity' in scene) {
        scene.backgroundIntensity = scene.environmentIntensity;
      }
    }

    hiddenHelpersRef.current = hidden;
    originalMaterialsMapRef.current = matMap;
  }, [scene, showCharacters]);

  // Restauration de la scène après fermeture ou rendu
  const restoreScene = useCallback(() => {
    restoreSplitMeshesRef.current?.();
    restoreSplitMeshesRef.current = null;

    tempLightsRef.current.forEach((obj) => {
      scene.remove(obj);
    });
    tempLightsRef.current = [];

    hiddenHelpersRef.current.forEach((obj) => {
      obj.visible = true;
    });
    hiddenHelpersRef.current = [];

    originalMaterialsMapRef.current.forEach((origMat, mesh) => {
      const original = Array.isArray(origMat) ? origMat : [origMat];
      const temporary = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of temporary) {
        if (!original.includes(material)) material.dispose();
      }
      mesh.material = origMat;
    });
    originalMaterialsMapRef.current.clear();

    if (savedBackgroundRef.current !== undefined) {
      scene.background = savedBackgroundRef.current;
      savedBackgroundRef.current = undefined;
    }
    if (savedEnvironmentRef.current !== undefined) {
      scene.environment = savedEnvironmentRef.current;
      savedEnvironmentRef.current = undefined;
    }
    if (downsampledEnvRef.current) {
      downsampledEnvRef.current.dispose();
      downsampledEnvRef.current = null;
    }

    // Nettoyer les structures BVH (boundsTree) construites par three-mesh-bvh sur les géométries
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const geom = (obj as THREE.Mesh).geometry;
        if (geom && (geom as any).boundsTree) {
          try {
            (geom as any).disposeBoundsTree?.();
          } catch {}
          delete (geom as any).boundsTree;
        }
      }
    });
  }, [scene]);

  // Calcul des dimensions du canvas selon le preset de résolution
  const getRenderDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 1280, height: 720 };
    const rect = containerRef.current.getBoundingClientRect();
    const maxWidth = Math.max(300, rect.width - 40);
    const maxHeight = Math.max(200, rect.height - 40);

    const preset = RESOLUTION_OPTIONS.find((p) => p.id === resolution);
    if (!preset || preset.id === 'fit') {
      return { width: Math.round(maxWidth), height: Math.round(maxHeight) };
    }

    return {
      width: preset.width,
      height: preset.height,
      realWidth: preset.width,
      realHeight: preset.height,
    };
  }, [resolution]);

  // Initialisation et exécution du Path Tracer avec le renderer unique de la scène
  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    // Sauvegarde des propriétés d'origine du canvas et du renderer
    const originalParent = canvas.parentElement;
    const originalStyle = {
      width: canvas.style.width,
      height: canvas.style.height,
      position: canvas.style.position,
      top: canvas.style.top,
      left: canvas.style.left,
      display: canvas.style.display,
      maxWidth: canvas.style.maxWidth,
      maxHeight: canvas.style.maxHeight,
      objectFit: canvas.style.objectFit,
      cursor: canvas.style.cursor,
      pointerEvents: canvas.style.pointerEvents,
    };
    const originalSize = new THREE.Vector2();
    gl.getSize(originalSize);
    const originalPixelRatio = gl.getPixelRatio();
    const originalExposure = gl.toneMappingExposure;
    const originalToneMapping = gl.toneMapping;
    const originalViewport = gl.getViewport(new THREE.Vector4());
    const originalScissor = gl.getScissor(new THREE.Vector4());
    const originalScissorTest = gl.getScissorTest();
    const originalTarget = gl.getRenderTarget();
    const originalAutoClear = gl.autoClear;

    // Déplacer temporairement le canvas unique dans le wrapper du mode photo
    if (canvasWrapperRef.current && originalParent) {
      canvasWrapperRef.current.insertBefore(canvas, canvasWrapperRef.current.firstChild);
      canvas.style.display = 'block';
      canvas.style.width = 'auto';
      canvas.style.height = 'auto';
      canvas.style.position = 'relative';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.objectFit = 'contain';
      canvas.style.cursor = 'inherit';
      canvas.style.pointerEvents = 'none';
    }

    const { width, height } = getRenderDimensions();
    gl.setPixelRatio(1);
    gl.setSize(width, height, false);
    gl.toneMapping = THREE.AgXToneMapping;
    gl.toneMappingExposure = exposure;
    rendererRef.current = gl;

    const isOrtho = (camera as any).isOrthographicCamera === true;

    let renderCamera: PhysicalCamera | THREE.OrthographicCamera;

    if (isOrtho) {
      const ortho = camera as THREE.OrthographicCamera;
      const origH = ortho.top - ortho.bottom;
      const origCenterY = (ortho.top + ortho.bottom) / 2;
      const origCenterX = (ortho.right + ortho.left) / 2;
      const renderAspect = width / height;
      const halfH = origH / 2;
      const halfW = halfH * renderAspect;

      const orthoCamera = new THREE.OrthographicCamera(
        origCenterX - halfW,
        origCenterX + halfW,
        origCenterY + halfH,
        origCenterY - halfH,
        ortho.near,
        ortho.far
      );
      orthoCamera.position.copy(ortho.position);
      orthoCamera.quaternion.copy(ortho.quaternion);
      orthoCamera.scale.copy(ortho.scale);
      orthoCamera.zoom = ortho.zoom;
      orthoCamera.updateProjectionMatrix();
      orthoCamera.updateMatrixWorld(true);
      renderCamera = orthoCamera;
    } else {
      const persp = camera as THREE.PerspectiveCamera;
      const physCamera = new PhysicalCamera(persp.fov || 50, width / height, persp.near, persp.far);
      physCamera.position.copy(persp.position);
      physCamera.quaternion.copy(persp.quaternion);
      physCamera.scale.copy(persp.scale);
      physCamera.zoom = persp.zoom || 1;
      physCamera.focusDistance = focusDistance;
      physCamera.fStop = fStop;
      physCamera.bokehSize = dofEnabled ? physCamera.getFocalLength() / physCamera.fStop : 0;
      physCamera.updateProjectionMatrix();
      physCamera.updateMatrixWorld(true);
      renderCamera = physCamera;
    }

    if (getUrlParams().get('raytracing') === 'debug') {
      renderCamera.position.fromArray(RAYTRACING_DEBUG_POS);
      renderCamera.lookAt(...PERSP_TARGET);
      renderCamera.updateMatrixWorld(true);
    }

    // Synchronisation complète des layers Three.js avec la caméra active de la scène
    renderCamera.layers.mask = camera.layers.mask;
    // S'assurer que les calques essentiels du studio sont activés
    renderCamera.layers.enable(LAYER_STRUCTURE);
    renderCamera.layers.enable(LAYER_EQUIPMENT);
    renderCamera.layers.enable(LAYER_FURNITURE);
    renderCamera.layers.enable(LAYER_FURNISHINGS);
    renderCamera.layers.enable(LAYER_DECOR);
    if (showCharacters) {
      renderCamera.layers.enable(LAYER_WALKER);
      renderCamera.layers.enable(LAYER_WALKER_DETAIL);
    } else {
      renderCamera.layers.disable(LAYER_WALKER);
      renderCamera.layers.disable(LAYER_WALKER_DETAIL);
    }
    renderCamera.layers.enable(LAYER_MIRRORS);
    renderCamera.layers.enable(LAYER_ANIMALS);
    renderCamera.layers.enable(LAYER_ROBOTS);
    renderCamera.layers.enable(LAYER_ENVIRONMENT);
    renderCameraRef.current = renderCamera;

    // Préparation de la scène pour le path-tracer (conversion miroir PBR, conversion matériaux, assainissement)
    setIsBuildingScene(true);
    setBvhProgress(null);
    setErrorMessage(null);
    setCurrentSamples(0);
    setElapsedSeconds(0);

    // Path Tracer
    const pathTracer = new WebGLPathTracer(gl);
    const bvhWorker = new GenerateMeshBVHWorker();
    pathTracer.setBVHWorker(bvhWorker);
    pathTracer.bounces = bounces;
    pathTracer.transmissiveBounces = bounces;
    pathTracer.filterGlossyFactor = 0.5;
    pathTracer.renderToCanvas = true;
    pathTracer.fadeDuration = 0;
    pathTracer.minSamples = 1;
    pathTracer.renderDelay = 0;
    pathTracer.dynamicLowRes = false;
    // Découpage fin en tuiles (ex: 7x5 = 35 tuiles en 720p, 10x7 = 70 tuiles en 1080p)
    // Chaque tuile fait ~25 000 pixels, ce qui prend ~10ms sur le GPU
    const tilesX = Math.max(4, Math.ceil(width / 200));
    const tilesY = Math.max(4, Math.ceil(height / 150));
    pathTracer.tiles.set(tilesX, tilesY);
    // Limiter la taille max de l'atlas de textures à 512x512 (réduit de 75% l'empreinte mémoire VRAM/RAM)
    pathTracer.textureSize.set(512, 512);

    // Débruiteur Intelligent (DenoiseMaterial)
    const denoiseMat = new DenoiseMaterial();
    denoiseMat.uniforms.sigma.value = 3.5;
    denoiseMat.uniforms.threshold.value = 0.12;
    denoiseMat.uniforms.kSigma.value = 1.0;
    const denoiseQuad = new FullScreenQuad(denoiseMat);
    denoiseMatRef.current = denoiseMat;
    denoiseQuadRef.current = denoiseQuad;

    // Throttling du blit écran : ne réafficher sur le canvas principal que 5x par seconde (toutes les 200ms)
    // Évite de forcer un redraw plein écran à chaque micro-tuile, divisant par 50 la charge du compositeur d'affichage !
    let lastCanvasBlit = 0;
    (pathTracer as any).renderToCanvasCallback = (_target: any, renderer: THREE.WebGLRenderer, quad: FullScreenQuad) => {
      const now = performance.now();
      if (now - lastCanvasBlit >= 200 || (pathTracerRef.current && pathTracerRef.current.samples >= targetSamplesRef.current)) {
        lastCanvasBlit = now;
        quad.render(renderer);
      }
    };

    let isDisposed = false;
    let isRunning = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let animFrameId: number | null = null;

    // Synchronisation matérielle WebGL2 (FenceSync) : empêche l'accumulation de commandes GPU
    // et garantit que le pilote graphique ne sature jamais le gestionnaire de fenêtres du système
    const glCtx = (gl as any).getContext?.() as WebGL2RenderingContext | undefined;
    let currentSync: WebGLSync | null = null;
    let lastFinishTime = performance.now();
    const GPU_COOLDOWN_MS = 25; // 25ms de repos absolu pour le GPU entre deux tuiles

    let lastTime = performance.now();
    let lastSampleCount = 0;
    let sampleStartTime = performance.now();
    let lastSampleUpdate = 0;

    // Ticker d'arrière-plan pour continuer le calcul quand l'onglet ou la fenêtre n'est plus actif (document.hidden)
    const workerBlob = new Blob([
      'let timer = null; self.onmessage = e => { if (e.data.action === "start") { clearInterval(timer); timer = setInterval(() => postMessage(0), e.data.ms || 25); } else { clearInterval(timer); } };'
    ], { type: 'application/javascript' });
    const bgWorker = new Worker(URL.createObjectURL(workerBlob));
    let bgActive = false;

    const scheduleStep = (delay = 0) => {
      if (document.hidden) {
        if (!bgActive) {
          bgWorker.postMessage({ action: 'start', ms: Math.max(10, delay || GPU_COOLDOWN_MS) });
          bgActive = true;
        }
      } else {
        if (bgActive) {
          bgWorker.postMessage({ action: 'stop' });
          bgActive = false;
        }
        if (delay > 0) {
          timeoutId = setTimeout(() => {
            animFrameId = requestAnimationFrame(renderStep);
          }, delay);
        } else {
          animFrameId = requestAnimationFrame(renderStep);
        }
      }
    };

    bgWorker.onmessage = () => {
      if (document.hidden && isRunning) {
        renderStep();
      }
    };

    const onVisibilityChange = () => {
      if (!isRunning) return;
      if (!document.hidden && bgActive) {
        bgWorker.postMessage({ action: 'stop' });
        bgActive = false;
        animFrameId = requestAnimationFrame(renderStep);
      } else if (document.hidden && !bgActive) {
        scheduleStep(GPU_COOLDOWN_MS);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const renderStep = () => {
      if (!pathTracerRef.current || isPausedRef.current || isDisposed) {
        isRunning = false;
        if (bgActive) {
          bgWorker.postMessage({ action: 'stop' });
          bgActive = false;
        }
        return;
      }

      const samples = pathTracerRef.current.samples;
      const currentTarget = targetSamplesRef.current;

      if (samples < currentTarget) {
        const now = performance.now();

        // 1. Si une tuile précédente a été soumise au GPU, vérifier si le GPU l'a terminée
        if (currentSync && glCtx?.clientWaitSync) {
          const status = glCtx.clientWaitSync(currentSync, 0, 0);
          if (status === glCtx.TIMEOUT_EXPIRED) {
            // Le GPU est encore en train de calculer le tracé précédent : attendre 15ms
            scheduleStep(15);
            return;
          }
          // Le GPU a terminé la tuile précédente
          if (glCtx?.deleteSync) {
            glCtx.deleteSync(currentSync);
          }
          currentSync = null;
          lastFinishTime = performance.now();
        }

        // 2. Cooldown GPU : garantir au moins GPU_COOLDOWN_MS de repos complet pour le GPU et l'OS
        if (now - lastFinishTime < GPU_COOLDOWN_MS) {
          const waitTime = Math.max(5, GPU_COOLDOWN_MS - (now - lastFinishTime));
          scheduleStep(waitTime);
          return;
        }

        // 3. Le GPU est prêt et a eu son temps de repos -> exécuter UNE tuile
        denoisedAppliedRef.current = false;
        try {
          pathTracerRef.current.renderSample();
          if (glCtx?.fenceSync) {
            currentSync = glCtx.fenceSync(glCtx.SYNC_GPU_COMMANDS_COMPLETE, 0);
            glCtx.flush();
          } else {
            lastFinishTime = performance.now();
          }
        } catch (err: any) {
          console.error('[Raytracing] Erreur renderSample:', err);
          setErrorMessage(err?.message || 'Erreur pendant le calcul du raytracing.');
          setIsPaused(true);
          isRunning = false;
          if (bgActive) {
            bgWorker.postMessage({ action: 'stop' });
            bgActive = false;
          }
          return;
        }

        // Throttling du setState React : màj toutes les 120ms au lieu de re-render React 60x par seconde
        if (now - lastSampleUpdate >= 120) {
          setCurrentSamples(samples);
          lastSampleUpdate = now;
        }

        if (now - lastTime >= 1000) {
          setSamplesPerSecond(Number(((pathTracerRef.current.samples - lastSampleCount) * 1000 / (now - lastTime)).toFixed(2)));
          lastSampleCount = pathTracerRef.current.samples;
          lastTime = now;
          setElapsedSeconds(Math.round((now - sampleStartTime) / 1000));
        }

        // Programmer la vérification de la prochaine tuile après le délai de repos
        scheduleStep(GPU_COOLDOWN_MS);
      } else {
        // Cible atteinte : nettoyer tout sync résiduel
        if (currentSync && glCtx?.deleteSync) {
          glCtx.deleteSync(currentSync);
          currentSync = null;
        }

        if (bgActive) {
          bgWorker.postMessage({ action: 'stop' });
          bgActive = false;
        }

        // Échantillonnage cible atteint : appliquer la passe finale de débruitage si activée
        if (!denoisedAppliedRef.current) {
          if (enableDenoiseRef.current && denoiseMatRef.current && denoiseQuadRef.current && rendererRef.current) {
            denoiseMatRef.current.uniforms.map.value = pathTracerRef.current.target.texture;
            rendererRef.current.setRenderTarget(null);
            denoiseQuadRef.current.render(rendererRef.current);
          }
          denoisedAppliedRef.current = true;
        }

        setCurrentSamples(currentTarget);
        setSamplesPerSecond(0);
        isRunning = false;
      }
    };

    const wakeRenderLoop = () => {
      if (isDisposed || isPausedRef.current || isRunning) return;
      if (pathTracerRef.current && pathTracerRef.current.samples < targetSamplesRef.current) {
        isRunning = true;
        scheduleStep(0);
      }
    };
    wakeRenderLoopRef.current = wakeRenderLoop;

    // Afficher le spinner avant la préparation, puis construire le BVH dans un Worker.
    const timer = setTimeout(async () => {
      if (isDisposed) return;
      try {
        prepareScene();
        gl.setRenderTarget(null);
        gl.setViewport(0, 0, width, height);
        gl.setScissorTest(false);
        gl.render(scene, renderCamera);
        setBvhProgress(0);
        if (!renderLocally) {
          setIsBuildingScene(false);
          return;
        }
        console.log('[Raytracing] Construction du BVH pour la scène...');
        await pathTracer.setSceneAsync(scene, renderCamera, {
          onProgress: progress => { if (!isDisposed) setBvhProgress(progress); },
        });
        if (isDisposed) return;
        pathTracerRef.current = pathTracer;
        setIsBuildingScene(false);
        console.log('[Raytracing] Scène prête ! Démarrage de l\'accumulation.');
        wakeRenderLoop();
      } catch (err: any) {
        if (isDisposed) return;
        restoreScene();
        console.error('[Raytracing] Erreur initialisation WebGLPathTracer:', err);
        setErrorMessage(err?.message || 'Échec de la génération du maillage BVH.');
        setIsBuildingScene(false);
      }
    }, 60);

    return () => {
      isDisposed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      bgWorker.terminate();
      bvhWorker.dispose();
      clearTimeout(timer);
      if (timeoutId) clearTimeout(timeoutId);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (currentSync && glCtx?.deleteSync) {
        glCtx.deleteSync(currentSync);
        currentSync = null;
      }
      wakeRenderLoopRef.current = null;
      restoreScene();
      denoiseQuad.dispose();
      denoiseMat.dispose();
      const ptInternal = (pathTracer as any)._pathTracer;
      const disposePathTracer = () => {
        try {
          if (ptInternal?.material) {
            ptInternal.material.textures?.dispose?.();
            ptInternal.material.envMapInfo?.dispose?.();
            ptInternal.material.dispose();
          }
          pathTracer.dispose();
        } catch (error) {
          console.error('[Raytracing] Erreur de libération des ressources:', error);
        }
      };
      // Three.js compileAsync still polls this material's program. Disposing it
      // before compilation completes removes currentProgram from the renderer.
      const pendingCompilation = ptInternal?._compilePromise as Promise<unknown> | null;
      if (pendingCompilation) {
        void pendingCompilation.then(disposePathTracer, error => {
          console.error('[Raytracing] Erreur de compilation du shader:', error);
          disposePathTracer();
        });
      } else {
        disposePathTracer();
      }
      denoiseQuadRef.current = null;
      denoiseMatRef.current = null;
      pathTracerRef.current = null;
      rendererRef.current = null;

      // Restauration du canvas dans le conteneur R3F d'origine
      if (originalParent) {
        originalParent.appendChild(canvas);
        canvas.style.width = originalStyle.width;
        canvas.style.height = originalStyle.height;
        canvas.style.position = originalStyle.position;
        canvas.style.top = originalStyle.top;
        canvas.style.left = originalStyle.left;
        canvas.style.display = originalStyle.display;
        canvas.style.maxWidth = originalStyle.maxWidth;
        canvas.style.maxHeight = originalStyle.maxHeight;
        canvas.style.objectFit = originalStyle.objectFit;
        canvas.style.cursor = originalStyle.cursor;
        canvas.style.pointerEvents = originalStyle.pointerEvents;
      }
      gl.setRenderTarget(originalTarget);
      gl.setPixelRatio(originalPixelRatio);
      gl.setSize(originalSize.x, originalSize.y, false);
      gl.setViewport(originalViewport);
      gl.setScissor(originalScissor);
      gl.setScissorTest(originalScissorTest);
      gl.autoClear = originalAutoClear;
      gl.toneMapping = originalToneMapping;
      gl.toneMappingExposure = originalExposure;
    };
  }, [
    gl,
    scene,
    camera,
    resolution,
    renderLocally,
    showCharacters,
    prepareScene,
    restoreScene,
    getRenderDimensions,
  ]);

  // Bascule instantanée du débruiteur sans réinitialiser le calcul de raytracing
  useEffect(() => {
    enableDenoiseRef.current = enableDenoise;
    if (pathTracerRef.current && rendererRef.current && pathTracerRef.current.samples > 0) {
      const pt = pathTracerRef.current;
      const r = rendererRef.current;
      if (enableDenoise && denoiseMatRef.current && denoiseQuadRef.current) {
        denoiseMatRef.current.uniforms.map.value = pt.target.texture;
        r.setRenderTarget(null);
        denoiseQuadRef.current.render(r);
      } else {
        r.setRenderTarget(null);
        (pt as any)._quad.material.map = pt.target.texture;
        (pt as any)._quad.render(r);
      }
    }
  }, [enableDenoise]);

  // Synchronisation de l'état de pause
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      if (enableDenoiseRef.current && denoiseMatRef.current && denoiseQuadRef.current && rendererRef.current && pathTracerRef.current) {
        denoiseMatRef.current.uniforms.map.value = pathTracerRef.current.target.texture;
        rendererRef.current.setRenderTarget(null);
        denoiseQuadRef.current.render(rendererRef.current);
      }
    } else {
      wakeRenderLoopRef.current?.();
    }
  }, [isPaused]);

  // Synchronisation du nombre cible d'échantillons
  useEffect(() => {
    targetSamplesRef.current = targetSamples;
    wakeRenderLoopRef.current?.();
  }, [targetSamples]);

  // Synchronisation des paramètres caméra physique (DoF, focus distance, f-stop)
  useEffect(() => {
    if (!renderCameraRef.current || !pathTracerRef.current) return;
    if (typeof (renderCameraRef.current as any).getFocalLength === 'function') {
      const cam = renderCameraRef.current as PhysicalCamera;
      cam.focusDistance = focusDistance;
      cam.fStop = fStop;
      cam.bokehSize = dofEnabled ? cam.getFocalLength() / cam.fStop : 0;
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
      pathTracerRef.current.updateCamera();
      denoisedAppliedRef.current = false;
      setCurrentSamples(0);
      wakeRenderLoopRef.current?.();
    }
  }, [dofEnabled, focusDistance, fStop]);

  // Synchronisation de l'exposition
  useEffect(() => {
    if (rendererRef.current) {
      denoisedAppliedRef.current = false;
      rendererRef.current.toneMappingExposure = exposure;
      pathTracerRef.current?.reset();
      setCurrentSamples(0);
      wakeRenderLoopRef.current?.();
    }
  }, [exposure]);

  // Synchronisation du nombre de rebonds
  useEffect(() => {
    if (pathTracerRef.current) {
      denoisedAppliedRef.current = false;
      pathTracerRef.current.bounces = bounces;
      pathTracerRef.current.transmissiveBounces = bounces;
      pathTracerRef.current.reset();
      setCurrentSamples(0);
      wakeRenderLoopRef.current?.();
    }
  }, [bounces]);

  // Autofocus au clic sur le canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLElement>) => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const raycaster = new THREE.Raycaster();
    const activeCam = renderCameraRef.current || camera;
    raycaster.setFromCamera(new THREE.Vector2(x, y), activeCam);
    if (renderCameraRef.current) {
      raycaster.layers.mask = renderCameraRef.current.layers.mask;
    }
    const hits = raycaster.intersectObjects(scene.children, true);

    if (hits.length > 0) {
      const dist = Math.round(hits[0].distance);
      setFocusDistance(dist);
      setDofEnabled(true);

      // Afficher l'anneau autofocus
      const wrapper = e.currentTarget.getBoundingClientRect();
      setFocusRing({ x: e.clientX - wrapper.left, y: e.clientY - wrapper.top, visible: true });
      setTimeout(() => {
        setFocusRing((prev) => ({ ...prev, visible: false }));
      }, 700);
    }
  };

  // Export du rendu raytracé.
  const getExportBlob = (callback: (blob: Blob | null) => void) => {
    const canvas = gl.domElement;
    if (!canvas) return;

    // S'assurer que le rendu raytracing est débruité avant export si l'option est active
    if (enableDenoiseRef.current && denoiseMatRef.current && denoiseQuadRef.current && rendererRef.current && pathTracerRef.current) {
      denoiseMatRef.current.uniforms.map.value = pathTracerRef.current.target.texture;
      rendererRef.current.setRenderTarget(null);
      denoiseQuadRef.current.render(rendererRef.current);
    }

    canvas.toBlob(callback, 'image/png');
  };

  // Téléchargement de la photo PNG
  const handleDownload = () => {
    getExportBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `photo-raytracing-${timestamp}.png`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Copie dans le presse-papier
  const handleCopyClipboard = async () => {
    getExportBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      } catch (err) {
        console.warn('Presse-papier non supporté pour les blobs:', err);
      }
    });
  };

  // Redémarrer le calcul
  const handleRestart = () => {
    denoisedAppliedRef.current = false;
    pathTracerRef.current?.reset();
    setCurrentSamples(0);
    setElapsedSeconds(0);
    wakeRenderLoopRef.current?.();
  };

  const sendBackgroundRender = async () => {
    setIsSubmitting(true);
    try {
      // Laisser React afficher l'état d'envoi avant de préparer le snapshot.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (!renderCameraRef.current || !rendererRef.current) throw new Error('Attendre la préparation de la scène.');
      const c = renderCameraRef.current;
      const size = rendererRef.current.getSize(new THREE.Vector2());
      const cameraJson = c.toJSON();
      cameraJson.object.type = c instanceof PhysicalCamera ? 'PerspectiveCamera' : 'OrthographicCamera';
      const response = await fetch('http://127.0.0.1:5174/api/render-jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' },
        body: packRenderArchive({ scene: serializeRenderScene(scene), camera: cameraJson, width: size.x, height: size.y,
          samples: targetSamples, bounces, exposure, focusDistance, fStop,
          bokehSize: c instanceof PhysicalCamera ? c.bokehSize : 0, denoise: enableDenoise }),
      });
      if (!response.ok) throw new Error(await response.text());
      const job = await response.json();
      alert(`Rendu ${job.id} envoyé. Résultat dans renders/. Suivi : http://127.0.0.1:5174/render-jobs.html`);
      onClose();
    } catch (error) { setErrorMessage(`Envoi impossible. Lancer npm run render:service. ${String(error)}`); }
    finally { setIsSubmitting(false); }
  };

  const progressPercent = Math.min(100, Math.round((currentSamples / targetSamples) * 100));
  const isFinished = currentSamples >= targetSamples;

  const isOrthographic = (camera as THREE.OrthographicCamera).isOrthographicCamera === true;
  const status = isSubmitting ? 'Envoi au service local…' : isBuildingScene
    ? bvhProgress === null ? 'Préparation de la scène…' : `Construction du BVH : ${Math.round(bvhProgress * 100)} %`
    : !renderLocally ? 'Prêt — choisissez où calculer' : isFinished ? 'Rendu terminé' : isPaused ? 'Rendu en pause' : 'Calcul en cours…';

  return (
    <div className="raytracing-photo position-fixed top-0 start-0 w-100 h-100 d-flex flex-column" role="dialog" aria-modal="true" aria-labelledby="raytracing-title">
      <header className="glass-card d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-camera fs-3 text-primary" aria-hidden="true" />
          <div><h1 id="raytracing-title" className="fs-5 fw-semibold mb-1">Photo · Raytracing</h1><p className="small text-body-secondary mb-0">Cadrage, lumière et rendu physique du studio</p></div>
        </div>
        <div className="d-flex gap-2">
          <a className="btn btn-sm btn-outline-primary" href="http://127.0.0.1:5174/render-jobs.html" target="_blank" rel="noopener noreferrer"><i className="bi bi-images me-2" aria-hidden="true" />Mes rendus</a>
          <button className="btn btn-sm btn-outline-dark" onClick={onClose} title="Fermer (Échap)"><i className="bi bi-x-lg me-2" aria-hidden="true" />Retour au studio</button>
        </div>
      </header>
      <div className="raytracing-photo__workspace">
        <main className="raytracing-photo__preview d-flex flex-column">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 border-bottom small">
            <span className="d-flex align-items-center gap-2"><span className="badge rounded-pill text-bg-primary">{currentSamples > 0 ? 'Raytracing' : 'Cadrage'}</span><span role="status">{status}</span></span>
            <span className="text-body-secondary">{RESOLUTION_OPTIONS.find(option => option.id === resolution)?.label}</span>
          </div>
          <div ref={containerRef} className="raytracing-photo__stage p-3 p-lg-4">
            <div ref={canvasWrapperRef} className={`raytracing-photo__canvas shadow-sm ${dofEnabled && !isOrthographic ? 'raytracing-photo__canvas--focus' : ''}`} onClick={dofEnabled && !isOrthographic && !isBuildingScene && !isSubmitting ? handleCanvasClick : undefined} title={dofEnabled ? 'Cliquez dans l’image pour choisir la mise au point' : undefined}>
              {(isBuildingScene || isSubmitting) && <div className="raytracing-photo__overlay position-absolute d-flex flex-column align-items-center justify-content-center gap-3 p-4 text-center"><span className="spinner-border text-primary" aria-hidden="true" /><span>{status}</span></div>}
              {focusRing.visible && <div className="raytracing-photo__focus position-absolute rounded-circle" style={{ left: focusRing.x, top: focusRing.y }} />}
            </div>
          </div>
          {errorMessage && <div className="alert alert-danger mx-3 mb-3" role="alert"><strong className="d-block mb-1">Le rendu n’a pas pu aboutir</strong><span className="small text-break">{errorMessage}</span><button className="btn btn-sm btn-outline-danger d-block mt-2" onClick={() => { setRenderLocally(false); setErrorMessage(null); }}>Revenir aux réglages</button></div>}
          <footer className="border-top p-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 small mb-2">
              <span><strong>{currentSamples.toFixed(0)}</strong> / {targetSamples} échantillons <span className="text-body-secondary ms-2">{elapsedSeconds}s · {samplesPerSecond} éch./s</span></span>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-dark" disabled={!renderLocally || isBuildingScene || isSubmitting || isFinished} onClick={() => setIsPaused(value => !value)}>{isPaused ? 'Reprendre' : 'Pause'}</button>
                <button className="btn btn-sm btn-outline-dark" disabled={!renderLocally || isBuildingScene || isSubmitting} onClick={handleRestart}>Relancer</button>
              </div>
            </div>
            <div className="progress" role="progressbar" aria-label="Progression du rendu" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar bg-primary" style={{ width: `${progressPercent}%` }} /></div>
          </footer>
        </main>
        <aside className="raytracing-photo__sidebar glass-card p-3 d-flex flex-column gap-4" aria-label="Réglages du raytracing">
          <section>
            <h2 className="fs-6 fw-semibold mb-2">Lancer le rendu</h2>
            <p className="small text-body-secondary mb-3">Le service local continue de calculer si vous fermez cet onglet.</p>
            <div className="d-grid gap-2">
              <button className={`btn btn-sm ${renderLocally ? 'btn-outline-dark' : 'btn-primary'}`} disabled={isSubmitting || (isBuildingScene && !renderLocally)} onClick={() => setRenderLocally(value => !value)}>{renderLocally ? 'Arrêter le calcul ici' : 'Calculer ici'}</button>
              <button className="btn btn-sm btn-outline-primary" disabled={bvhProgress === null || renderLocally || isSubmitting} onClick={() => void sendBackgroundRender()}>{isSubmitting ? 'Envoi en cours…' : 'Lancer en arrière-plan'}</button>
            </div>
            {renderLocally && <p className="small text-body-secondary mt-2 mb-0">Arrêtez le calcul ici pour passer au service local.</p>}
          </section>
          <section className="border-top pt-3">
            <h2 className="fs-6 fw-semibold mb-3">Qualité de l’image</h2>
            <label className="form-label small" htmlFor="ray-resolution">Format et résolution</label>
            <select id="ray-resolution" className="form-select form-select-sm mb-3" value={resolution} disabled={isSubmitting} onChange={event => setResolution(event.target.value as ResolutionPreset)}>{RESOLUTION_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
            <div className="small mb-2">Échantillons</div>
            <div className="btn-group btn-group-sm w-100 mb-3" role="group" aria-label="Échantillons">{[40, 100, 250, 500].map(samples => <button key={samples} className={`btn ${targetSamples === samples ? 'btn-primary' : 'btn-outline-dark'}`} aria-pressed={targetSamples === samples} onClick={() => { setTargetSamples(samples); if (currentSamples >= samples) handleRestart(); }}>{samples}</button>)}</div>
            {[
              { id: 'bounces', label: 'Rebonds de lumière', value: bounces, min: 1, max: 12, step: 1, change: setBounces },
              { id: 'exposure', label: 'Exposition', value: exposure, min: 0.4, max: 2.2, step: 0.05, change: setExposure },
            ].map(control => <div key={control.id} className="mb-3"><label htmlFor={`ray-${control.id}`} className="form-label small d-flex justify-content-between mb-1">{control.label}<output>{control.value}</output></label><input id={`ray-${control.id}`} className="form-range" type="range" min={control.min} max={control.max} step={control.step} value={control.value} onChange={event => control.change(Number(event.target.value))} /></div>)}
            {[
              { id: 'denoise', label: 'Réduire le bruit', checked: enableDenoise, change: setEnableDenoise },
              { id: 'characters', label: 'Inclure les personnages', checked: showCharacters, change: setShowCharacters },
            ].map(control => <div key={control.id} className="form-check form-switch mb-2"><input id={`ray-${control.id}`} className="form-check-input" type="checkbox" role="switch" checked={control.checked} onChange={event => control.change(event.target.checked)} /><label className="form-check-label small" htmlFor={`ray-${control.id}`}>{control.label}</label></div>)}
          </section>
          <section className="border-top pt-3">
            <h2 className="fs-6 fw-semibold mb-3">Mise au point</h2>
            <div className="form-check form-switch"><input id="ray-dof" className="form-check-input" type="checkbox" role="switch" checked={dofEnabled && !isOrthographic} disabled={isOrthographic} onChange={event => setDofEnabled(event.target.checked)} /><label htmlFor="ray-dof" className="form-check-label small">Profondeur de champ</label></div>
            <p className="small text-body-secondary mt-2 mb-0">{isOrthographic ? 'Disponible avec une caméra perspective.' : dofEnabled ? 'Cliquez dans l’aperçu pour choisir le point net.' : 'Activez-la pour flouter l’arrière-plan.'}</p>
            {dofEnabled && !isOrthographic && <div className="mt-3"><label htmlFor="ray-focus" className="form-label small d-flex justify-content-between">Distance<output>{focusDistance} cm</output></label><input id="ray-focus" className="form-range mb-2" type="range" min="50" max="1500" step="5" value={focusDistance} onChange={event => setFocusDistance(Number(event.target.value))} /><div className="small mb-2">Ouverture</div><div className="btn-group btn-group-sm w-100" role="group" aria-label="Ouverture">{[1.4, 2, 2.8, 5.6].map(stop => <button key={stop} className={`btn ${fStop === stop ? 'btn-primary' : 'btn-outline-dark'}`} aria-pressed={fStop === stop} onClick={() => setFStop(stop)}>f/{stop}</button>)}</div></div>}
          </section>
          <section className="border-top pt-3 mt-auto">
            <h2 className="fs-6 fw-semibold mb-3">Votre image</h2>
            <div className="d-grid gap-2"><button className="btn btn-sm btn-primary" onClick={handleDownload} disabled={currentSamples === 0 || isBuildingScene || isSubmitting}><i className="bi bi-download me-2" aria-hidden="true" />Enregistrer le PNG</button><button className="btn btn-sm btn-outline-dark" onClick={() => void handleCopyClipboard()} disabled={currentSamples === 0 || isBuildingScene || isSubmitting}>{copySuccess ? 'Image copiée' : 'Copier l’image'}</button></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
