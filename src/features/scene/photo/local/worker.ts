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
window.renderJob = async inputUrl => {
  const response = await fetch(inputUrl);
  if (!response.ok) throw new Error(await response.text());
  const p = await unpackRenderArchive<RenderPayload>(await response.blob());
  const loader = new THREE.ObjectLoader();
  const scene = await loader.parseAsync(p.scene) as THREE.Scene;
  const original = await loader.parseAsync(p.camera) as THREE.Camera;
  const camera = original instanceof THREE.PerspectiveCamera ? new PhysicalCamera().copy(original) : original;
  if (camera instanceof PhysicalCamera) Object.assign(camera, { focusDistance: p.focusDistance, fStop: p.fStop, bokehSize: p.bokehSize });
  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  renderer.setSize(p.width, p.height); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = p.exposure;
  const context = renderer.getContext();
  const debug = context.getExtension('WEBGL_debug_renderer_info');
  if (!debug || /swiftshader|llvmpipe|software/i.test(context.getParameter(debug.UNMASKED_RENDERER_WEBGL))) throw new Error('Accélération GPU matérielle indisponible');
  const tracer = new WebGLPathTracer(renderer);
  const bvhWorker = new GenerateMeshBVHWorker();
  tracer.setBVHWorker(bvhWorker);
  tracer.bounces = p.bounces; tracer.transmissiveBounces = p.bounces;
  tracer.tiles.set(Math.max(4, Math.ceil(p.width / 200)), Math.max(4, Math.ceil(p.height / 150)));
  tracer.textureSize.set(512, 512); tracer.renderDelay = 0; tracer.fadeDuration = 0;
  try {
    await tracer.setSceneAsync(scene, camera);
    while (tracer.samples < p.samples) {
      if (window.renderPaused) { await new Promise(resolve => setTimeout(resolve, 100)); continue; }
      tracer.renderSample(); context.finish();
      await window.progress(tracer.samples);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    if (p.denoise) {
      const material = new DenoiseMaterial(); material.uniforms.map.value = tracer.target.texture;
      const quad = new FullScreenQuad(material); renderer.setRenderTarget(null); quad.render(renderer); quad.dispose(); material.dispose();
    }
    return renderer.domElement.toDataURL('image/png').split(',')[1];
  } finally { bvhWorker.dispose(); tracer.dispose(); renderer.dispose(); }
};
