import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LAYER_WALKER_DETAIL } from '@config';
import {
  findLivingRoom360Camera,
  homeAssistantCameraStreamUrl,
} from '../home-assistant/camera';
import {
  loadHomeAssistantRegistries,
  useHomeAssistant,
  type HomeAssistantRegistries,
} from '../home-assistant/connection';
import { ceilingCameraFeed, FISHEYE_CANVAS_SIZE } from './ceilingCameraFeed';
import { cameraState } from './cameraState';

const CUBE_RESOLUTION = 512;
const CAPTURE_INTERVAL_MS = 50; // ~20 ips

const FISHEYE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FISHEYE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform samplerCube tCube;
  #include <tonemapping_pars_fragment>

  void main() {
    // vUv.y = 0 correspond à la ligne supérieure de l'ImageData via readRenderTargetPixels + putImageData.
    vec2 p = vec2(vUv.x * 2.0 - 1.0, 1.0 - 2.0 * vUv.y);
    float rSq = dot(p, p);
    if (rSq > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Projection fisheye orthographique 180° (r = sin(theta)) : reproduit le grossissement central de la Reolink FE-W (f = 1,98 mm sur capteur 1/2,5").
    // Vue plongeante (-Y) tournée 90° anti-horaire : porte-fenêtre (-Z) à gauche (-p.x), Est (+X) en haut (+p.y).
    vec3 dir = vec3(p.y, -sqrt(1.0 - rSq), p.x);

    vec3 linearColor = textureCube(tCube, dir).rgb;
    vec3 mapped = AgXToneMapping(linearColor);
    vec4 outColor = sRGBTransferOETF(vec4(mapped, 1.0));
    float edge = 1.0 - smoothstep(0.992, 1.0, sqrt(rSq));
    gl_FragColor = vec4(outColor.rgb * edge, 1.0);
  }
`;

export function FisheyeCameraCapture({ position }: { position: [number, number, number] }) {
  const { gl, scene, camera, invalidate } = useThree();
  const lastCaptureRef = useRef(-Infinity);

  const resources = useMemo(() => {
    const cubeTarget = new THREE.WebGLCubeRenderTarget(CUBE_RESOLUTION, {
      type: THREE.HalfFloatType,
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(5, 50000, cubeTarget);
    const fisheyeTarget = new THREE.WebGLRenderTarget(FISHEYE_CANVAS_SIZE, FISHEYE_CANVAS_SIZE, {
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tCube: { value: cubeTarget.texture },
        toneMappingExposure: { value: 1.0 },
      },
      vertexShader: FISHEYE_VERTEX,
      fragmentShader: FISHEYE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const fisheyeScene = new THREE.Scene();
    fisheyeScene.add(new THREE.Mesh(quadGeo, material));
    const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pixelBuffer = new Uint8Array(FISHEYE_CANVAS_SIZE * FISHEYE_CANVAS_SIZE * 4);
    const imageData = new ImageData(FISHEYE_CANVAS_SIZE, FISHEYE_CANVAS_SIZE);

    return { cubeTarget, cubeCamera, fisheyeTarget, material, quadGeo, fisheyeScene, orthoCam, pixelBuffer, imageData };
  }, []);

  useEffect(() => {
    resources.cubeCamera.position.set(position[0], position[1], position[2]);
    resources.cubeCamera.updateMatrixWorld();
    lastCaptureRef.current = -Infinity;
    invalidate();
  }, [resources, position, invalidate]);

  useEffect(() => () => {
    resources.cubeTarget.dispose();
    resources.fisheyeTarget.dispose();
    resources.material.dispose();
    resources.quadGeo.dispose();
  }, [resources]);

  useFrame(() => {
    const canvas = ceilingCameraFeed.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    if (now - lastCaptureRef.current < CAPTURE_INTERVAL_MS) return;
    lastCaptureRef.current = now;

    const { cubeCamera, fisheyeTarget, material, fisheyeScene, orthoCam, pixelBuffer, imageData } = resources;
    cubeCamera.layers.mask = camera.layers.mask;
    cubeCamera.layers.enable(LAYER_WALKER_DETAIL);
    material.uniforms.toneMappingExposure.value = gl.toneMappingExposure;

    const camGroup = ceilingCameraFeed.cameraGroup;
    const prevVisible = camGroup ? camGroup.visible : true;
    if (camGroup) camGroup.visible = false;

    const prevTarget = gl.getRenderTarget();
    try {
      cubeCamera.update(gl, scene);
      gl.setRenderTarget(fisheyeTarget);
      gl.render(fisheyeScene, orthoCam);
      gl.readRenderTargetPixels(fisheyeTarget, 0, 0, FISHEYE_CANVAS_SIZE, FISHEYE_CANVAS_SIZE, pixelBuffer);
    } finally {
      gl.setRenderTarget(prevTarget);
      if (camGroup) camGroup.visible = prevVisible;
    }

    imageData.data.set(pixelBuffer);
    ctx.putImageData(imageData, 0, 0);
  });

  return null;
}

function HomeAssistantCameraPanel() {
  const status = useHomeAssistant(state => state.status);
  const hassUrl = useHomeAssistant(state => state.hassUrl);
  const entities = useHomeAssistant(state => state.entities);
  const [registries, setRegistries] = useState<HomeAssistantRegistries | null>(null);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [streamNonce, setStreamNonce] = useState(0);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);

  const directLookup = useMemo(() => findLivingRoom360Camera(entities, registries), [entities, registries]);

  useEffect(() => {
    if (status !== 'connected') {
      setRegistries(null);
      setRegistryError(null);
      return;
    }
    if (!directLookup.needsRegistry || registries || registryError) return;
    let active = true;
    loadHomeAssistantRegistries()
      .then(result => {
        if (active) setRegistries(result);
      })
      .catch(error => {
        if (active) setRegistryError(error instanceof Error ? error.message : 'Lecture des registres HA impossible.');
      });
    return () => {
      active = false;
    };
  }, [status, directLookup.needsRegistry, registries, registryError]);

  const entity = directLookup.entity;
  const cameraLabel = String(entity?.attributes.friendly_name ?? 'Caméra 360 Séjour');
  const streamBaseUrl = useMemo(() => homeAssistantCameraStreamUrl(hassUrl, entity), [hassUrl, entity]);
  const streamUrl = streamBaseUrl ? (streamNonce > 0 ? `${streamBaseUrl}&v=${streamNonce}` : streamBaseUrl) : null;
  const isAvailable = !!entity && entity.state !== 'unavailable' && entity.state !== 'unknown';
  const isResolving = directLookup.needsRegistry && !registries && !registryError;
  const isLoaded = !!streamUrl && loadedUrl === streamUrl;
  const hasStreamError = !!streamUrl && erroredUrl === streamUrl;

  let errorMessage: string | null = null;
  if (registryError) {
    errorMessage = registryError;
  } else if (!entity && !isResolving) {
    const found = directLookup.cameras
      .map(cam => cam.attributes.friendly_name ? `${String(cam.attributes.friendly_name)} (${cam.entity_id})` : cam.entity_id)
      .join(', ');
    errorMessage = directLookup.cameras.length > 0
      ? `Caméra 360 Séjour introuvable dans Home Assistant. Entités détectées : ${found}.`
      : 'Aucune entité camera.* trouvée dans Home Assistant.';
  } else if (entity && !isAvailable) {
    errorMessage = `Caméra indisponible dans Home Assistant (état : ${entity.state}).`;
  } else if (entity && !streamUrl) {
    errorMessage = `Flux caméra indisponible pour ${entity.entity_id} : adresse HA ou jeton absent.`;
  }

  return (
    <div className="col d-flex flex-column gap-2" data-testid="fisheye-ha-panel">
      <div className="d-flex align-items-center justify-content-between gap-2 small">
        <span className="fw-semibold text-truncate">{cameraLabel}</span>
        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {streamUrl && isAvailable && (
            <button
              type="button"
              className="btn btn-sm btn-outline-dark py-0 px-1"
              title="Actualiser le flux Home Assistant"
              aria-label="Actualiser le flux Home Assistant"
              onClick={() => setStreamNonce(n => n + 1)}
            >
              <i className="bi bi-arrow-clockwise" aria-hidden="true" />
            </button>
          )}
          <span className={`badge rounded-pill ${isLoaded ? 'bg-danger' : 'text-bg-secondary'}`}>
            {isLoaded ? 'HA LIVE' : 'HA'}
          </span>
        </div>
      </div>

      <div className="w-100 ratio ratio-1x1 rounded-4 overflow-hidden bg-dark shadow border border-secondary border-opacity-50 position-relative">
        {streamUrl && isAvailable && !errorMessage ? (
          <>
            <img
              key={streamUrl}
              src={streamUrl}
              alt={`Flux caméra Home Assistant : ${cameraLabel}`}
              className="w-100 h-100 object-fit-contain d-block"
              onLoad={() => setLoadedUrl(streamUrl)}
              onError={() => setErroredUrl(streamUrl)}
            />
            {!isLoaded && !hasStreamError && (
              <div className="d-flex flex-column align-items-center justify-content-center gap-2 text-light bg-dark bg-opacity-75 p-3 text-center small">
                <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Connexion au flux Home Assistant…</span>
              </div>
            )}
            {hasStreamError && (
              <div role="alert" className="d-flex flex-column align-items-center justify-content-center gap-2 text-light bg-dark p-3 text-center small">
                <i className="bi bi-exclamation-triangle text-warning fs-4" aria-hidden="true" />
                <span>Impossible de lire le flux de {entity?.entity_id}.</span>
                <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setStreamNonce(n => n + 1)}>
                  Réessayer
                </button>
              </div>
            )}
          </>
        ) : isResolving ? (
          <div className="d-flex flex-column align-items-center justify-content-center gap-2 text-light p-3 text-center small">
            <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span>Recherche de la caméra 360 séjour…</span>
          </div>
        ) : (
          <div role="alert" className="d-flex flex-column align-items-center justify-content-center gap-2 text-light p-3 text-center small">
            <i className="bi bi-camera-video-off text-warning fs-4" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 small text-body-secondary">
        <span>Home Assistant · Séjour</span>
        {entity && <span className="text-truncate">{entity.entity_id}</span>}
      </div>
    </div>
  );
}

export function FisheyeCameraModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHomeAssistantConnected = useHomeAssistant(state => state.status === 'connected');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (event: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (event: PointerEvent) => { pressedOutside = isOutside(event); };
      const onPointerUp = (event: PointerEvent) => {
        if (pressedOutside && isOutside(event)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }
  }, []);

  useEffect(() => {
    ceilingCameraFeed.canvas = canvasRef.current;
    cameraState.invalidate?.();
    return () => {
      ceilingCameraFeed.canvas = null;
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      {...{ closedby: 'any' }}
      className={`fisheye-modal glass-card ${isHomeAssistantConnected ? 'col-11 col-lg-10 col-xl-9' : 'col-11 col-sm-9 col-md-7 col-lg-5'} m-auto p-0 rounded-4 text-dark`}
      aria-labelledby="fisheye-modal-title"
      onClose={onClose}
      onKeyDown={event => event.stopPropagation()}
      onWheel={event => event.stopPropagation()}
    >
      <div className="modal-header d-flex align-items-center justify-content-between gap-3 px-4 py-3 border-bottom border-white border-opacity-50">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-webcam text-danger" aria-hidden="true" />
          <h5 id="fisheye-modal-title" className="modal-title fs-6 fw-semibold mb-0">
            Caméra de plafond — Vue Fisheye 360°
          </h5>
          <span className="badge bg-danger rounded-pill">LIVE</span>
        </div>
        <button type="button" className="btn-close flex-shrink-0" aria-label="Fermer" autoFocus onClick={onClose} />
      </div>
      <div className="container-fluid p-3 p-sm-4">
        <div className={`row g-3 g-sm-4 align-items-start ${isHomeAssistantConnected ? 'row-cols-1 row-cols-md-2' : 'row-cols-1'}`}>
          <div className="col d-flex flex-column gap-2" data-testid="fisheye-3d-panel">
            {isHomeAssistantConnected && (
              <div className="d-flex align-items-center justify-content-between gap-2 small">
                <span className="fw-semibold text-truncate">Simulation 3D · Porte-fenêtre à gauche</span>
                <span className="badge text-bg-secondary rounded-pill flex-shrink-0">3D</span>
              </div>
            )}
            <div className="w-100 ratio ratio-1x1 rounded-circle overflow-hidden bg-dark shadow border border-secondary border-opacity-50">
              <canvas
                ref={canvasRef}
                width={FISHEYE_CANVAS_SIZE}
                height={FISHEYE_CANVAS_SIZE}
                className="w-100 h-100 d-block"
                aria-label="Flux vidéo fisheye 360° de la caméra de plafond Reolink FE-W"
              />
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 small text-body-secondary">
              <span>Reolink FE-W 6MP · Plafond séjour</span>
              <span>Projection hémisphérique 180° · Porte-fenêtre à gauche</span>
            </div>
          </div>
          {isHomeAssistantConnected && <HomeAssistantCameraPanel />}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
