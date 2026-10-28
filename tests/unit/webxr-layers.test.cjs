const { it } = require('node:test');
const assert = require('node:assert/strict');

for (const layersGranted of [false, true]) {
  it(`WebXR utilise ${layersGranted ? 'les layers autorisés' : 'le framebuffer standard sans layers autorisés'}`, async () => {
    const { WebXRManager } = await import('three/src/renderers/webxr/WebXRManager.js');
    const saved = Object.fromEntries(['XRWebGLBinding', 'XRWebGLLayer'].map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
    let projectionLayers = 0;
    let baseLayers = 0;
    global.XRWebGLBinding = class {
      createProjectionLayer() { projectionLayers++; return { textureWidth: 800, textureHeight: 600 }; }
    };
    global.XRWebGLLayer = class {
      constructor() { baseLayers++; this.framebufferWidth = 800; this.framebufferHeight = 600; }
    };
    const renderer = { getRenderTarget: () => null, getPixelRatio: () => 1, getSize: size => size.set(800, 600), setRenderTarget() {}, setPixelRatio() {}, setSize() {} };
    const gl = { getContextAttributes: () => ({ xrCompatible: true, depth: true, stencil: false, antialias: true }) };
    const renderState = {};
    const session = { enabledFeatures: layersGranted ? ['layers'] : ['viewer', 'local-floor'], addEventListener() {}, requestReferenceSpace: async () => ({}), requestAnimationFrame: () => 1, updateRenderState: update => Object.assign(renderState, update) };
    try {
      const xr = new WebXRManager(renderer, gl);
      await xr.setSession(session);
      assert.equal(xr.isPresenting, true);
      assert.equal(projectionLayers, Number(layersGranted));
      assert.equal(baseLayers, Number(!layersGranted));
      assert.equal(Boolean(renderState.layers), layersGranted);
      assert.equal(Boolean(renderState.baseLayer), !layersGranted);
    } finally {
      for (const [key, descriptor] of Object.entries(saved)) {
        if (descriptor) Object.defineProperty(global, key, descriptor);
        else delete global[key];
      }
    }
  });
}
