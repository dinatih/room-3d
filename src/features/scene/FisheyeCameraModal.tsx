import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LAYER_WALKER_DETAIL } from '@config';
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

  const float HALF_PI = 1.5707963267948966;

  void main() {
    // vUv.y = 0 correspond à la ligne supérieure de l'ImageData via readRenderTargetPixels + putImageData.
    vec2 p = vec2(vUv.x * 2.0 - 1.0, 1.0 - 2.0 * vUv.y);
    float r = length(p);
    if (r > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    float theta = r * HALF_PI;
    float sinTheta = sin(theta);
    vec2 dir2d = r > 1e-5 ? (p / r) : vec2(0.0);
    // Vue plongeante (-Y) : Nord (-Z) en haut (+p.y), Est (+X) à droite (+p.x).
    vec3 dir = normalize(vec3(
      dir2d.x * sinTheta,
      -cos(theta),
      -dir2d.y * sinTheta
    ));

    vec3 linearColor = textureCube(tCube, dir).rgb;
    vec3 mapped = AgXToneMapping(linearColor);
    vec4 outColor = sRGBTransferOETF(vec4(mapped, 1.0));
    float edge = 1.0 - smoothstep(0.992, 1.0, r);
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

export function FisheyeCameraModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      className="fisheye-modal glass-card col-11 col-sm-9 col-md-7 col-lg-5 m-auto p-0 rounded-4 text-dark"
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
      <div className="p-3 p-sm-4 d-flex flex-column align-items-center gap-3">
        <div className="w-100 ratio ratio-1x1 rounded-circle overflow-hidden bg-dark shadow border border-secondary border-opacity-50">
          <canvas
            ref={canvasRef}
            width={FISHEYE_CANVAS_SIZE}
            height={FISHEYE_CANVAS_SIZE}
            className="w-100 h-100 d-block"
            aria-label="Flux vidéo fisheye 360° de la caméra de plafond Reolink FE-W"
          />
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2 small text-body-secondary">
          <span>Reolink FE-W 6MP · Plafond séjour</span>
          <span>Projection hémisphérique 180° · Nord en haut</span>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
