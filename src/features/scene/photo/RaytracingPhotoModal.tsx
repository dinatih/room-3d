/**
 * RaytracingPhotoModal.tsx
 *
 * Modale de capture photo au Raytracing / Path Tracing ultra-réaliste.
 * Utilise `three-gpu-pathtracer` pour calculer l'illumination globale physique,
 * les réflexions/réfractions réalistes et la profondeur de champ (Bokeh artistique).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WebGLPathTracer, PhysicalCamera, DenoiseMaterial } from 'three-gpu-pathtracer';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { getLoadedSkyTexture } from '../SkySphere';
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
  { id: '720p', label: 'HD 720p (1280×720) - Rapide ⚡', width: 1280, height: 720 },
  { id: 'fit', label: 'Taille Écran', width: 0, height: 0 },
  { id: '1080p', label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
  { id: '2k', label: '2K QHD (2560×1440)', width: 2560, height: 1440 },
  { id: 'square', label: 'Carré 1:1 (1080×1080)', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait 9:16 (720×1280)', width: 720, height: 1280 },
];

export type ComparisonMode = 'split' | 'raytracing' | 'raster';

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

  // Mode de comparaison 3D Standard vs Raytracing
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('split');
  const [rasterSnapshot, setRasterSnapshot] = useState<string | null>(null);

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
  const [isBuildingScene, setIsBuildingScene] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Anneau visuel autofocus
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  // Fermeture par touche Échap/F10 et raccourci Espace pour basculer la comparaison
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F10') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
          e.preventDefault();
          setComparisonMode((prev) => (prev === 'split' ? 'raster' : prev === 'raster' ? 'raytracing' : 'split'));
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Synchronisation de la hauteur max du canvas selon le mode de comparaison
  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas) return;
    canvas.style.maxHeight = comparisonMode === 'split' ? 'calc(50vh - 100px)' : 'calc(100vh - 180px)';
  }, [comparisonMode, gl]);

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
      const isAnimal = (obj.layers.mask & (1 << LAYER_ANIMALS)) !== 0;
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

    // Déplacer temporairement le canvas unique dans le wrapper du mode photo
    if (canvasWrapperRef.current && originalParent) {
      canvasWrapperRef.current.insertBefore(canvas, canvasWrapperRef.current.firstChild);
      canvas.style.display = 'block';
      canvas.style.position = 'relative';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = 'calc(100vh - 180px)';
      canvas.style.objectFit = 'contain';
      canvas.style.cursor = dofEnabled ? 'crosshair' : 'default';
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
    renderCamera.layers.enable(LAYER_ENVIRONMENT);
    renderCameraRef.current = renderCamera;

    // Masquer les personnages avant le snapshot 3D Standard si désactivés
    if (!showCharacters) {
      scene.traverse((obj) => {
        const isChar =
          (obj.layers.mask & (1 << LAYER_WALKER)) !== 0 ||
          (obj.layers.mask & (1 << LAYER_WALKER_DETAIL)) !== 0 ||
          (obj.userData?.itemName && (obj.userData.itemName.startsWith('Personnage') || obj.userData.itemName.startsWith('PNJ'))) ||
          (obj.name || '').toLowerCase().includes('personnage') ||
          (obj.name || '').toLowerCase().includes('pnj') ||
          (obj.name || '').toLowerCase().includes('walker');
        if (isChar && obj.visible) {
          obj.visible = false;
          hiddenHelpersRef.current.push(obj);
        }
      });
    }

    // 1. Capture instantanée du rendu 3D Standard dans un canvas indépendant.
    // Le renderer partagé sera ensuite redimensionné et utilisé par le path tracer.
    scene.updateMatrixWorld(true);
    try {
      const snapshotCanvas = document.createElement('canvas');
      const snapshotRenderer = new THREE.WebGLRenderer({
        canvas: snapshotCanvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      snapshotRenderer.setPixelRatio(1);
      snapshotRenderer.setSize(width, height, false);
      snapshotRenderer.outputColorSpace = gl.outputColorSpace;
      snapshotRenderer.toneMapping = gl.toneMapping;
      snapshotRenderer.toneMappingExposure = gl.toneMappingExposure;
      snapshotRenderer.shadowMap.enabled = gl.shadowMap.enabled;
      snapshotRenderer.shadowMap.type = gl.shadowMap.type;
      snapshotRenderer.render(scene, renderCamera);
      setRasterSnapshot(snapshotCanvas.toDataURL('image/png'));
      snapshotRenderer.dispose();
    } catch (err) {
      console.warn('[Raytracing] Impossible de capturer le snapshot 3D standard:', err);
      setRasterSnapshot(null);
    }

    // 2. Préparation de la scène pour le path-tracer (conversion miroir PBR, conversion matériaux, assainissement)
    setIsBuildingScene(true);
    setErrorMessage(null);
    setCurrentSamples(0);
    setElapsedSeconds(0);

    // Path Tracer
    const pathTracer = new WebGLPathTracer(gl);
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
    let frameCount = 0;
    let sampleStartTime = performance.now();
    let lastSampleUpdate = 0;

    const renderStep = () => {
      if (!pathTracerRef.current || isPausedRef.current || isDisposed) {
        isRunning = false;
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
            // Le GPU est encore en train de calculer le tracé précédent :
            // Ne SURTOUT PAS envoyer de nouvelle commande, attendre 15ms
            timeoutId = setTimeout(() => {
              animFrameId = requestAnimationFrame(renderStep);
            }, 15);
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
          timeoutId = setTimeout(() => {
            animFrameId = requestAnimationFrame(renderStep);
          }, waitTime);
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
          frameCount++;
        } catch (err: any) {
          console.error('[Raytracing] Erreur renderSample:', err);
          setErrorMessage(err?.message || 'Erreur pendant le calcul du raytracing.');
          setIsPaused(true);
          isRunning = false;
          return;
        }

        // Throttling du setState React : màj toutes les 120ms au lieu de re-render React 60x par seconde
        if (now - lastSampleUpdate >= 120) {
          setCurrentSamples(samples);
          lastSampleUpdate = now;
        }

        if (now - lastTime >= 1000) {
          setFps(Math.round((frameCount * 1000) / (now - lastTime)));
          frameCount = 0;
          lastTime = now;
          setElapsedSeconds(Math.round((now - sampleStartTime) / 1000));
        }

        // Programmer la vérification de la prochaine tuile après le délai de repos
        timeoutId = setTimeout(() => {
          animFrameId = requestAnimationFrame(renderStep);
        }, GPU_COOLDOWN_MS);
      } else {
        // Cible atteinte : nettoyer tout sync résiduel
        if (currentSync && glCtx?.deleteSync) {
          glCtx.deleteSync(currentSync);
          currentSync = null;
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
        setFps(0);
        // ARRET COMPLET : pas de nouvel appel rAF ni de setTimeout quand le rendu est terminé !
        isRunning = false;
      }
    };

    const wakeRenderLoop = () => {
      if (isDisposed || isPausedRef.current || isRunning) return;
      if (pathTracerRef.current && pathTracerRef.current.samples < targetSamplesRef.current) {
        isRunning = true;
        animFrameId = requestAnimationFrame(renderStep);
      }
    };
    wakeRenderLoopRef.current = wakeRenderLoop;

    // Laisser le temps au navigateur d'afficher le spinner avant la construction synchrone du BVH
    const timer = setTimeout(() => {
      if (isDisposed) return;
      try {
        prepareScene();
        console.log('[Raytracing] Construction du BVH pour la scène...');
        pathTracer.setScene(scene, renderCamera);
        pathTracerRef.current = pathTracer;
        setIsBuildingScene(false);
        console.log('[Raytracing] Scène prête ! Démarrage de l\'accumulation.');
        wakeRenderLoop();
      } catch (err: any) {
        restoreScene();
        console.error('[Raytracing] Erreur initialisation WebGLPathTracer:', err);
        setErrorMessage(err?.message || 'Échec de la génération du maillage BVH.');
        setIsBuildingScene(false);
      }
    }, 60);

    return () => {
      isDisposed = true;
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
      gl.setPixelRatio(originalPixelRatio);
      gl.setSize(originalSize.x, originalSize.y);
      gl.toneMappingExposure = originalExposure;
    };
  }, [
    gl,
    scene,
    camera,
    resolution,
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
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
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
      setFocusRing({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
      setTimeout(() => {
        setFocusRing((prev) => ({ ...prev, visible: false }));
      }, 700);
    }
  };

  // Génération du blob selon le mode de comparaison actif
  const getExportBlob = (callback: (blob: Blob | null) => void) => {
    const canvas = gl.domElement;
    if (!canvas) return;

    // S'assurer que le rendu raytracing est débruité avant export si l'option est active
    if (enableDenoiseRef.current && denoiseMatRef.current && denoiseQuadRef.current && rendererRef.current && pathTracerRef.current) {
      denoiseMatRef.current.uniforms.map.value = pathTracerRef.current.target.texture;
      rendererRef.current.setRenderTarget(null);
      denoiseQuadRef.current.render(rendererRef.current);
    }

    if (comparisonMode === 'raster' && rasterSnapshot) {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = canvas.height;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(callback, 'image/png');
      };
      img.src = rasterSnapshot;
      return;
    }

    if (comparisonMode === 'split' && rasterSnapshot) {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = canvas.height * 2;
        const ctx = c.getContext('2d');
        if (ctx) {
          // Vue 1 : 3D Standard en haut
          ctx.drawImage(img, 0, 0, c.width, canvas.height);
          // Ligne blanche de séparation
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, canvas.height - 2, c.width, 4);
          // Vue 2 : Raytracing en bas
          ctx.drawImage(canvas, 0, canvas.height, c.width, canvas.height);
        }
        c.toBlob(callback, 'image/png');
      };
      img.src = rasterSnapshot;
      return;
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
      const prefix = comparisonMode === 'raster' ? 'photo-3d-standard' : comparisonMode === 'split' ? 'photo-comparatif' : 'photo-raytracing';
      const filename = `${prefix}-${timestamp}.png`;

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

  // Basculer le débruiteur et rafraîchir immédiatement le canvas
  const handleToggleDenoise = (active: boolean) => {
    setEnableDenoise(active);
    if (!pathTracerRef.current || !rendererRef.current || pathTracerRef.current.samples === 0) return;
    const pt = pathTracerRef.current;
    const rend = rendererRef.current;
    if (active && denoiseMatRef.current && denoiseQuadRef.current) {
      denoiseMatRef.current.uniforms.map.value = pt.target.texture;
      rend.setRenderTarget(null);
      denoiseQuadRef.current.render(rend);
    } else {
      (pt as any)._quad?.render(rend);
    }
  };

  const progressPercent = Math.min(100, Math.round((currentSamples / targetSamples) * 100));
  const isFinished = currentSamples >= targetSamples;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column text-white"
      style={{
        zIndex: 10000,
        backgroundColor: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* ── Barre d'en-tête supérieure ─────────────────────────── */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
        style={{ borderColor: 'rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.4)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="fs-5">📸</span>
          <div>
            <h6 className="mb-0 fw-bold text-uppercase d-flex align-items-center gap-2" style={{ letterSpacing: '0.08em' }}>
              Mode Photo Raytracing Ultra-Réaliste
              <span className="badge bg-warning text-dark font-monospace fw-bold" style={{ fontSize: '10px' }}>
                GPU Path Tracing
              </span>
            </h6>
            <small className="text-white-50" style={{ fontSize: '11px' }}>
              Illumination globale physique • Rebonds de lumière • Profondeur de champ Bokeh
            </small>
          </div>
        </div>

        {/* Sélecteur de comparaison Rendu 3D vs Raytracing */}
        <div className="btn-group btn-group-sm shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setComparisonMode('raster')}
            className={`btn ${comparisonMode === 'raster' ? 'btn-primary fw-bold' : 'btn-outline-light text-white-50'}`}
            style={{ fontSize: '11px' }}
            title="Afficher le rendu 3D standard temps réel (Touche Espace pour basculer)"
          >
            🎮 3D Standard
          </button>
          <button
            type="button"
            onClick={() => setComparisonMode('split')}
            className={`btn ${comparisonMode === 'split' ? 'btn-warning text-dark fw-bold' : 'btn-outline-light text-white-50'}`}
            style={{ fontSize: '11px' }}
            title="Comparer les 2 rendus l'un au-dessus de l'autre (Touche Espace)"
          >
            ⬍ Comparer (2 Vues)
          </button>
          <button
            type="button"
            onClick={() => setComparisonMode('raytracing')}
            className={`btn ${comparisonMode === 'raytracing' ? 'btn-info text-dark fw-bold' : 'btn-outline-light text-white-50'}`}
            style={{ fontSize: '11px' }}
            title="Afficher uniquement le rendu Raytracing physique (Touche Espace)"
          >
            📸 Raytracing
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleRestart}
            className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5"
            title="Réinitialiser l'accumulation des rayons"
          >
            🔄 <span>Relancer</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-sm btn-danger px-3 fw-bold d-flex align-items-center gap-1"
            title="Fermer (Échap)"
          >
            ✕ <span>Quitter</span>
          </button>
        </div>
      </div>

      {/* ── Zone Centrale : Prévisualisation Canvas & Commandes ── */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Zone Canvas avec centrage et cadrage */}
        <div
          ref={containerRef}
          className={`flex-grow-1 d-flex flex-column align-items-center ${
            comparisonMode === 'split'
              ? 'justify-content-start overflow-y-auto p-3 gap-3'
              : 'justify-content-center p-3 overflow-hidden'
          } position-relative`}
          style={{ background: 'radial-gradient(circle at center, #111528 0%, #05070f 100%)' }}
        >
          {/* Vue 1 : Rendu 3D Standard (affiché en haut en mode Comparer, ou plein écran en mode 3D Standard) */}
          {rasterSnapshot && comparisonMode !== 'raytracing' && (
            <div
              className="position-relative shadow-lg border border-primary border-opacity-50 rounded overflow-hidden bg-black flex-shrink-0"
              style={{
                userSelect: 'none',
                maxWidth: '100%',
              }}
            >
              <div
                className="position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-primary border-opacity-50 text-white pointer-events-none"
                style={{ fontSize: '11px', zIndex: 6 }}
              >
                🎮 {comparisonMode === 'split' ? '1. Rendu 3D Standard' : 'Rendu 3D Standard'}
              </div>
              <img
                src={rasterSnapshot}
                alt="Rendu 3D Standard"
                style={{
                  maxWidth: '100%',
                  maxHeight: comparisonMode === 'split' ? 'calc(50vh - 100px)' : 'calc(100vh - 180px)',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Vue 2 : Rendu Raytracing (affiché en bas en mode Comparer, ou plein écran en mode Raytracing) */}
          <div
            ref={canvasWrapperRef}
            className={`position-relative shadow-lg border border-warning border-opacity-50 rounded overflow-hidden bg-black flex-shrink-0 ${
              comparisonMode === 'raster' ? 'd-none' : ''
            }`}
            style={{
              userSelect: 'none',
              cursor: dofEnabled ? 'crosshair' : 'default',
              maxWidth: '100%',
            }}
            onClick={handleCanvasClick}
            title={dofEnabled ? "Cliquez sur n'importe quel point pour ajuster l'autofocus 🎯" : undefined}
          >
            {/* Badge Raytracing en mode comparaison */}
            {comparisonMode === 'split' && (
              <div
                className="position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-warning border-opacity-50 text-warning pointer-events-none"
                style={{ fontSize: '11px', zIndex: 6 }}
              >
                📸 2. Rendu Raytracing
              </div>
            )}

            {/* Spinner overlay pendant la génération initiale du BVH */}
            {isBuildingScene && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
                style={{ background: 'rgba(5, 7, 15, 0.94)', zIndex: 10 }}
              >
                <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }} />
                <h5 className="fw-bold">Génération du maillage BVH spatial…</h5>
                <p className="text-white-50 small mb-0">Préparation des géométries et des textures physiques</p>
              </div>
            )}

            {/* Erreur éventuelle */}
            {errorMessage && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
                style={{ background: 'rgba(25, 5, 5, 0.95)', zIndex: 11 }}
              >
                <div className="fs-1 mb-2">⚠️</div>
                <h5 className="fw-bold text-danger">Erreur Raytracing</h5>
                <p className="text-white-50 small mb-3">{errorMessage}</p>
                <button onClick={handleRestart} className="btn btn-warning btn-sm">Réessayer</button>
              </div>
            )}

            {/* Réticule autofocus animé au clic */}
            {focusRing.visible && (
              <div
                className="position-absolute border border-warning rounded-circle"
                style={{
                  left: focusRing.x - 20,
                  top: focusRing.y - 20,
                  width: 40,
                  height: 40,
                  pointerEvents: 'none',
                  animation: 'pulse 0.6s ease-out',
                  boxShadow: '0 0 10px rgba(255, 193, 7, 0.8)',
                  zIndex: 10,
                }}
              />
            )}

            {/* Overlay statut de convergence */}
            {!isBuildingScene && !errorMessage && (
              <div
                className="position-absolute bottom-0 start-0 w-100 p-2 d-flex align-items-center justify-content-between text-white"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  fontSize: '12px',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${isFinished ? 'bg-success' : 'bg-primary'}`}>
                    {isFinished ? '✓ Rendu terminé' : '⚡ Calcul en cours…'}
                  </span>
                  <span>
                    Échantillon : <strong>{currentSamples}</strong> / {targetSamples} ({progressPercent}%)
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 text-white-50">
                  <span>Temps : {elapsedSeconds}s</span>
                  <span>Cadence : {fps} éch/s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Panneau de réglages latéral ────────────────────────── */}
        <div
          className="border-start p-3 d-flex flex-column gap-3 overflow-auto"
          style={{
            width: '320px',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            background: 'rgba(10, 14, 25, 0.75)',
          }}
        >
          {/* Section 1 : Qualité & Échantillons */}
          <div className="card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded">
            <h6 className="fw-bold mb-2 text-warning d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
              <span>⚙️</span> Qualité du Raytracing
            </h6>

            <div className="mb-2">
              <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '11px' }}>
                <span>Échantillons cibles (Samples)</span>
                <span className="fw-bold text-info">{targetSamples}</span>
              </label>
              <div className="btn-group btn-group-sm w-100 mb-2">
                {[40, 100, 250, 500].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setTargetSamples(s);
                      if (currentSamples >= s) handleRestart();
                    }}
                    className={`btn ${targetSamples === s ? 'btn-primary' : 'btn-outline-secondary text-white'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '11px' }}>
                <span>Rebonds de lumière (Bounces)</span>
                <span className="fw-bold text-info">{bounces}</span>
              </label>
              <input
                type="range"
                className="form-range form-range-sm"
                min="1"
                max="12"
                step="1"
                value={bounces}
                onChange={(e) => setBounces(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="mb-1">
              <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '11px' }}>
                <span>Exposition lumineuse</span>
                <span className="fw-bold text-info">{exposure.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className="form-range form-range-sm"
                min="0.4"
                max="2.2"
                step="0.05"
                value={exposure}
                onChange={(e) => setExposure(parseFloat(e.target.value))}
              />
            </div>

            {/* Débruiteur Intelligent */}
            <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10">
              <label className="form-check-label d-flex align-items-center gap-1.5 mb-0" style={{ fontSize: '11px' }}>
                <span>✨</span>
                <span>Débruiteur Intelligent</span>
              </label>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={enableDenoise}
                  onChange={(e) => handleToggleDenoise(e.target.checked)}
                />
              </div>
            </div>

            {/* Calque Personnages */}
            <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10">
              <label className="form-check-label d-flex align-items-center gap-1.5 mb-0" style={{ fontSize: '11px' }}>
                <span>👤</span>
                <span>Calque Personnages</span>
              </label>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={showCharacters}
                  onChange={(e) => setShowCharacters(e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Profondeur de champ (Bokeh & Autofocus) */}
          <div className="card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0 text-warning d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                <span>🎯</span> Flou Bokeh / Profondeur
              </h6>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={dofEnabled && !(camera as any).isOrthographicCamera}
                  disabled={(camera as any).isOrthographicCamera}
                  onChange={(e) => setDofEnabled(e.target.checked)}
                />
              </div>
            </div>

            {(camera as any).isOrthographicCamera ? (
              <small className="text-white-50" style={{ fontSize: '10px' }}>
                Indisponible en vue isométrique / orthographique (l'effet Bokeh optique nécessite une projection perspective).
              </small>
            ) : dofEnabled ? (
              <>
                <p className="text-white-50 mb-2" style={{ fontSize: '10px' }}>
                  💡 <em>Cliquez sur le modèle ou un objet dans l'image pour régler l'autofocus instantanément !</em>
                </p>

                <div className="mb-2">
                  <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '11px' }}>
                    <span>Distance de mise au point</span>
                    <span className="fw-bold text-info">{focusDistance} cm</span>
                  </label>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="50"
                    max="1500"
                    step="5"
                    value={focusDistance}
                    onChange={(e) => setFocusDistance(parseInt(e.target.value, 10))}
                  />
                </div>

                <div className="mb-1">
                  <label className="form-label d-flex justify-content-between mb-1" style={{ fontSize: '11px' }}>
                    <span>Ouverture optique (f-stop)</span>
                    <span className="fw-bold text-info">f/{fStop}</span>
                  </label>
                  <div className="btn-group btn-group-sm w-100">
                    {[1.4, 2.0, 2.8, 5.6].map((stop) => (
                      <button
                        key={stop}
                        type="button"
                        onClick={() => setFStop(stop)}
                        className={`btn ${fStop === stop ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-white'}`}
                        style={{ fontSize: '10px' }}
                      >
                        f/{stop}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <small className="text-white-50" style={{ fontSize: '10px' }}>
                Activez l'effet pour créer un arrière-plan flou d'appareil photo professionnel reflex.
              </small>
            )}
          </div>

          {/* Section 3 : Format & Résolution */}
          <div className="card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded">
            <h6 className="fw-bold mb-2 text-warning d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
              <span>📐</span> Format & Résolution
            </h6>
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary"
              style={{ fontSize: '11px' }}
              value={resolution}
              onChange={(e) => setResolution(e.target.value as ResolutionPreset)}
            >
              {RESOLUTION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Section 4 : Export & Téléchargement */}
          <div className="mt-auto d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25">
            <button
              onClick={handleDownload}
              className="btn btn-success fw-bold py-2 shadow d-flex align-items-center justify-content-center gap-2"
              title="Télécharger l'image PNG"
            >
              <span>💾</span>
              <span>Télécharger la photo PNG</span>
            </button>

            <button
              onClick={handleCopyClipboard}
              className={`btn btn-sm ${copySuccess ? 'btn-info text-dark' : 'btn-outline-light'} py-1.5 d-flex align-items-center justify-content-center gap-2`}
              title="Copier l'image dans le presse-papier"
            >
              <span>{copySuccess ? '✓' : '📋'}</span>
              <span>{copySuccess ? 'Copié dans le presse-papier !' : 'Copier l\'image'}</span>
            </button>

            <button
              onClick={() => setIsPaused((p) => !p)}
              className="btn btn-sm btn-outline-secondary text-white py-1"
            >
              {isPaused ? '▶ Reprendre le rendu' : '⏸ Suspendre le rendu'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Barre d'information inférieure ─────────────────────── */}
      <div
        className="px-3 py-1.5 border-top d-flex align-items-center justify-content-between"
        style={{ borderColor: 'rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.5)', fontSize: '11px' }}
      >
        <div className="d-flex align-items-center gap-3">
          <span>
            <kbd className="bg-secondary text-white px-1 rounded">Espace</kbd> Alterner 3D / Comparer (2 vues) / Raytracing
          </span>
          <span className="text-white-50">•</span>
          <span>
            <kbd className="bg-secondary text-white px-1 rounded">F10</kbd> Basculer mode photo
          </span>
          <span className="text-white-50">•</span>
          <span className="text-white-50">
            Fermer avec <kbd className="bg-secondary text-white px-1 rounded">Échap</kbd>
          </span>
        </div>
        <div className="text-white-50">
          Moteur : <strong>three-gpu-pathtracer</strong> (GGX / PBR / MIS / BVH)
        </div>
      </div>
    </div>
  );
}
