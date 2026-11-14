import * as THREE from 'three';
import { unpackRenderArchive } from '../renderArchive';
import { GenerateMeshBVHWorker } from 'three-mesh-bvh/worker';
import { WebGLPathTracer, PhysicalCamera, DenoiseMaterial } from 'three-gpu-pathtracer';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

export interface RenderPayload {
  scene: ReturnType<THREE.Scene['toJSON']>;
  camera: ReturnType<THREE.Camera['toJSON']>;
  width: number; height: number; samples: number; bounces: number; exposure: number;
  focusDistance: number; fStop: number; bokehSize: number; denoise: boolean;
}

declare global { interface Window { renderPaused: boolean; renderJob: (inputUrl: string) => Promise<string>; progress: (samples: number) => Promise<void>; } }

async function loadSceneFromInput(inputUrl: string) {
  const response = await fetch(inputUrl);
  if (!response.ok) throw new Error(await response.text());
  const payload = await unpackRenderArchive<RenderPayload>(response.body!);
  const loader = new THREE.ObjectLoader();
  const scene = await loader.parseAsync(payload.scene) as THREE.Scene;
  const original = await loader.parseAsync(payload.camera) as THREE.Camera;
  const { width, height, samples, bounces, exposure, focusDistance, fStop, bokehSize, denoise } = payload;
  return { scene, original, width, height, samples, bounces, exposure, focusDistance, fStop, bokehSize, denoise };
}

async function waitForGpu(gl: WebGLRenderingContext | WebGL2RenderingContext): Promise<void> {
  const gl2 = 'fenceSync' in gl ? gl : null;
  if (!gl2) {
    gl.finish();
    return;
  }
  const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) {
    gl.finish();
    return;
  }
  gl2.flush();
  try {
    while (true) {
      const status = gl2.clientWaitSync(sync, 0, 0);
      if (status === gl2.ALREADY_SIGNALED || status === gl2.CONDITION_SATISFIED) return;
      if (status === gl2.WAIT_FAILED) throw new Error('Échec de synchronisation WebGL (WAIT_FAILED)');
      await new Promise(resolve => setTimeout(resolve, 12));
    }
  } finally {
    gl2.deleteSync(sync);
  }
}

window.renderJob = async inputUrl => {
  const { scene, original, width, height, samples, bounces, exposure, focusDistance, fStop, bokehSize, denoise } = await loadSceneFromInput(inputUrl);
  const camera = original instanceof THREE.PerspectiveCamera ? new PhysicalCamera().copy(original) : original;
  if (camera instanceof PhysicalCamera) Object.assign(camera, { focusDistance, fStop, bokehSize });
  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  renderer.setSize(width, height); renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = exposure;
  const context = renderer.getContext();
  const debug = context.getExtension('WEBGL_debug_renderer_info');
  if (!debug || /swiftshader|llvmpipe|software/i.test(context.getParameter(debug.UNMASKED_RENDERER_WEBGL))) throw new Error('Accélération GPU matérielle indisponible');
  const tracer = new WebGLPathTracer(renderer);
  const bvhWorker = new GenerateMeshBVHWorker();
  tracer.setBVHWorker(bvhWorker);
  tracer.filterGlossyFactor = 1.0;
  tracer.minSamples = 1;
  tracer.bounces = bounces; tracer.transmissiveBounces = bounces;
  tracer.tiles.set(Math.max(4, Math.ceil(width / 160)), Math.max(4, Math.ceil(height / 120)));
  tracer.textureSize.set(512, 512); tracer.renderDelay = 0; tracer.fadeDuration = 0;
  tracer.renderToCanvas = !denoise;
  tracer.renderToCanvasCallback = (_target, r, quad) => {
    if (tracer.samples >= samples) quad.render(r);
  };
  try {
    await tracer.setSceneAsync(scene, camera);
    let lastReportedSample = -1;
    let lastProgressAt = 0;
    while (tracer.samples < samples) {
      if (window.renderPaused) { await new Promise(resolve => setTimeout(resolve, 100)); continue; }
      const tileStart = performance.now();
      tracer.renderSample();
      await waitForGpu(context);
      const tileGpuMs = performance.now() - tileStart;
      const now = performance.now();
      if (Math.floor(tracer.samples) > lastReportedSample || now - lastProgressAt >= 500 || tracer.samples >= samples) {
        lastReportedSample = Math.floor(tracer.samples);
        lastProgressAt = now;
        await window.progress(tracer.samples);
      }
      // Laisser respirer le GPU et le compositeur système entre deux tuiles.
      const cooldownMs = Math.max(40, Math.min(500, Math.round(tileGpuMs * 0.75)));
      await new Promise(resolve => setTimeout(resolve, cooldownMs));
    }
    if (denoise) {
      const material = new DenoiseMaterial(); material.uniforms.sigma.value = 3.5; material.uniforms.threshold.value = 0.12; material.uniforms.kSigma.value = 1.0; material.uniforms.map.value = tracer.target.texture;
      const quad = new FullScreenQuad(material); renderer.setRenderTarget(null); quad.render(renderer); quad.dispose(); material.dispose();
    }
    return renderer.domElement.toDataURL('image/png').split(',')[1];
  } finally { bvhWorker.dispose(); tracer.dispose(); renderer.dispose(); }
};
