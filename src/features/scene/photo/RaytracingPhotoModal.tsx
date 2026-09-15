/**
 * RaytracingPhotoModal.tsx
 *
 * Modale de capture photo au Raytracing / Path Tracing ultra-réaliste.
 * Utilise `three-gpu-pathtracer` pour calculer l'illumination globale physique,
 * les réflexions/réfractions réalistes et la profondeur de champ (Bokeh artistique).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WebGLPathTracer, PhysicalCamera } from 'three-gpu-pathtracer';

export interface RaytracingPhotoModalProps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  onClose: () => void;
}

type ResolutionPreset = 'fit' | '1080p' | '2k' | 'square' | 'portrait';

interface ResolutionOption {
  id: ResolutionPreset;
  label: string;
  width: number;
  height: number;
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { id: 'fit', label: 'Taille Écran', width: 0, height: 0 },
  { id: '1080p', label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
  { id: '2k', label: '2K QHD (2560×1440)', width: 2560, height: 1440 },
  { id: 'square', label: 'Carré 1:1 (1440×1440)', width: 1440, height: 1440 },
  { id: 'portrait', label: 'Portrait 9:16 (1080×1920)', width: 1080, height: 1920 },
];

export function RaytracingPhotoModal({ scene, camera, onClose }: RaytracingPhotoModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Moteur et références internes
  const pathTracerRef = useRef<WebGLPathTracer | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const physCameraRef = useRef<PhysicalCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const originalMaterialsMapRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const hiddenHelpersRef = useRef<THREE.Object3D[]>([]);

  // Paramètres de rendu
  const [resolution, setResolution] = useState<ResolutionPreset>('fit');
  const [targetSamples, setTargetSamples] = useState<number>(100);
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

  // Fermeture par touche Échap ou F10
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
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) {
        setFocusDistance(Math.round(hits[0].distance));
      }
    } catch {}
  }, [scene, camera]);

  // Préparation de la scène avant construction du BVH (remplacement des miroirs, masquage des helpers, assainissement des matériaux)
  const prepareScene = useCallback(() => {
    const hidden: THREE.Object3D[] = [];
    const matMap = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

    scene.traverse((obj) => {
      const name = (obj.name || '').toLowerCase();

      // Masquer les dômes de ciel 3D (le path-tracer utilise nativement scene.environment)
      if (name.includes('skysphere') || (obj.userData && obj.userData.isSky)) {
        if (obj.visible) {
          obj.visible = false;
          hidden.push(obj);
        }
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
        name.includes('helper') ||
        name.includes('gizmo') ||
        name.includes('grid') ||
        name.includes('landingstrip') ||
        name.includes('collision') ||
        name.includes('aizone') ||
        name.includes('hover') ||
        name.includes('measurement') ||
        name.includes('skeleton');

      if (isHelper && obj.visible) {
        obj.visible = false;
        hidden.push(obj);
        return;
      }

      // Assainir les sources de lumière (three-gpu-pathtracer lit light.color.r directement)
      if ((obj as any).isLight) {
        const light = obj as THREE.Light;
        if (!light.color || typeof (light.color as any).r !== 'number') {
          light.color = new THREE.Color(0xffffff);
        }
      }

      // Traiter et assainir les Mesh
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;

        // Miroir réflecteur raster -> surface physique PBR
        if (name.includes('reflector') || (mesh.material as any)?.isReflectorMaterial) {
          matMap.set(mesh, mesh.material);
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.02,
            metalness: 0.98,
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

        // three-gpu-pathtracer exige impérativement m.color avec des composantes .r, .g, .b valides
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        let needsReplace = false;

        for (const m of mats) {
          if (!m) {
            needsReplace = true;
            break;
          }
          // Matériau sans propriété color valide (ex: ShaderMaterial, MeshNormalMaterial, MeshDepthMaterial, etc.)
          if (!(m as any).color || typeof (m as any).color.r !== 'number') {
            needsReplace = true;
            break;
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
        }

        if (needsReplace) {
          matMap.set(mesh, mesh.material);
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xd0d0d0,
            roughness: 0.5,
            metalness: 0.1,
          });
        }
      }
    });

    hiddenHelpersRef.current = hidden;
    originalMaterialsMapRef.current = matMap;
  }, [scene]);

  // Restauration de la scène après fermeture ou rendu
  const restoreScene = useCallback(() => {
    hiddenHelpersRef.current.forEach((obj) => {
      obj.visible = true;
    });
    hiddenHelpersRef.current = [];

    originalMaterialsMapRef.current.forEach((origMat, mesh) => {
      mesh.material = origMat;
    });
    originalMaterialsMapRef.current.clear();
  }, []);

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

    const aspect = preset.width / preset.height;
    let w = maxWidth;
    let h = w / aspect;

    if (h > maxHeight) {
      h = maxHeight;
      w = h * aspect;
    }

    return {
      width: Math.round(w),
      height: Math.round(h),
      realWidth: preset.width,
      realHeight: preset.height,
    };
  }, [resolution]);

  // Initialisation et exécution du Path Tracer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    prepareScene();
    setIsBuildingScene(true);
    setErrorMessage(null);
    setCurrentSamples(0);
    setElapsedSeconds(0);

    const { width, height } = getRenderDimensions();
    canvas.width = width;
    canvas.height = height;

    // Renderer WebGL indépendant
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
    renderer.setSize(width, height, false);
    rendererRef.current = renderer;

    // Caméra physique avec support du Bokeh
    const physCamera = new PhysicalCamera(camera.fov, width / height, camera.near, camera.far);
    physCamera.position.copy(camera.position);
    physCamera.quaternion.copy(camera.quaternion);
    physCamera.focusDistance = focusDistance;
    physCamera.fStop = fStop;
    physCamera.bokehSize = dofEnabled ? physCamera.getFocalLength() / physCamera.fStop : 0;
    physCamera.updateProjectionMatrix();
    physCamera.updateMatrixWorld();
    physCameraRef.current = physCamera;

    // Path Tracer
    const pathTracer = new WebGLPathTracer(renderer);
    pathTracer.bounces = bounces;
    pathTracer.filterGlossyFactor = 0.5;
    pathTracer.renderToCanvas = true;
    pathTracer.fadeDuration = 0;
    pathTracer.minSamples = 1;
    pathTracer.renderDelay = 0;
    pathTracer.dynamicLowRes = true;
    pathTracer.lowResScale = 0.25;
    pathTracer.textureSize.set(1024, 1024);

    let isDisposed = false;

    // Laisser le temps au navigateur d'afficher le spinner avant la construction synchrone du BVH
    const timer = setTimeout(() => {
      if (isDisposed) return;
      try {
        console.log('[Raytracing] Construction du BVH pour la scène...');
        pathTracer.setScene(scene, physCamera);
        pathTracerRef.current = pathTracer;
        setIsBuildingScene(false);
        console.log('[Raytracing] Scène prête ! Démarrage de l\'accumulation.');
      } catch (err: any) {
        console.error('[Raytracing] Erreur initialisation WebGLPathTracer:', err);
        setErrorMessage(err?.message || 'Échec de la génération du maillage BVH.');
        setIsBuildingScene(false);
      }
    }, 60);

    let lastTime = performance.now();
    let frameCount = 0;
    let sampleStartTime = performance.now();

    // Boucle d'accumulation d'échantillons
    const renderLoop = () => {
      if (pathTracerRef.current && !isPaused) {
        const samples = pathTracerRef.current.samples;
        setCurrentSamples(samples);

        if (samples < targetSamples) {
          try {
            pathTracerRef.current.renderSample();
            frameCount++;
          } catch (err: any) {
            console.error('[Raytracing] Erreur renderSample:', err);
            setErrorMessage(err?.message || 'Erreur pendant le calcul du raytracing.');
            setIsPaused(true);
            return;
          }

          const now = performance.now();
          if (now - lastTime >= 1000) {
            setFps(Math.round((frameCount * 1000) / (now - lastTime)));
            frameCount = 0;
            lastTime = now;
            setElapsedSeconds(Math.round((now - sampleStartTime) / 1000));
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      restoreScene();
      try {
        pathTracer.dispose();
        renderer.dispose();
      } catch {}
      pathTracerRef.current = null;
      rendererRef.current = null;
    };
  }, [
    scene,
    camera,
    resolution,
    prepareScene,
    restoreScene,
    getRenderDimensions,
  ]);

  // Synchronisation des paramètres caméra physique (DoF, focus distance, f-stop)
  useEffect(() => {
    if (!physCameraRef.current || !pathTracerRef.current) return;
    const cam = physCameraRef.current;
    cam.focusDistance = focusDistance;
    cam.fStop = fStop;
    cam.bokehSize = dofEnabled ? cam.getFocalLength() / cam.fStop : 0;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    pathTracerRef.current.updateCamera();
    setCurrentSamples(0);
  }, [dofEnabled, focusDistance, fStop]);

  // Synchronisation de l'exposition
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = exposure;
      pathTracerRef.current?.reset();
      setCurrentSamples(0);
    }
  }, [exposure]);

  // Synchronisation du nombre de rebonds
  useEffect(() => {
    if (pathTracerRef.current) {
      pathTracerRef.current.bounces = bounces;
      pathTracerRef.current.reset();
      setCurrentSamples(0);
    }
  }, [bounces]);

  // Autofocus au clic sur le canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
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

  // Téléchargement de la photo PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
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
    }, 'image/png');
  };

  // Copie dans le presse-papier
  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }, 'image/png');
    } catch (err) {
      console.warn('Presse-papier non supporté pour les blobs:', err);
    }
  };

  // Redémarrer le calcul
  const handleRestart = () => {
    pathTracerRef.current?.reset();
    setCurrentSamples(0);
    setElapsedSeconds(0);
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
          className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-3 position-relative overflow-hidden"
          style={{ background: 'radial-gradient(circle at center, #111528 0%, #05070f 100%)' }}
        >
          <div className="position-relative shadow-lg border border-secondary border-opacity-25 rounded overflow-hidden">
            {/* Le canvas est TOUJOURS présent dans le DOM pour que canvasRef.current soit disponible */}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: 'block',
                cursor: dofEnabled ? 'crosshair' : 'default',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 180px)',
                objectFit: 'contain',
              }}
              title={dofEnabled ? 'Cliquez sur n\'importe quel point pour ajuster l\'autofocus 🎯' : undefined}
            />

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
            scrollbarWidth: 'thin',
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
                className="form-range"
                min="2"
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
                className="form-range"
                min="0.4"
                max="2.2"
                step="0.05"
                value={exposure}
                onChange={(e) => setExposure(parseFloat(e.target.value))}
              />
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
                  checked={dofEnabled}
                  onChange={(e) => setDofEnabled(e.target.checked)}
                />
              </div>
            </div>

            {dofEnabled ? (
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
                    className="form-range"
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
            Raccourci : <kbd className="bg-secondary text-white px-1 rounded">F10</kbd> pour basculer en mode photo
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
