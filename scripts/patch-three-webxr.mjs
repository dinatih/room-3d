import { readFileSync, writeFileSync } from 'node:fs';

// Chrome exposes XRWebGLBinding even when the session has not granted layers.
// Three r185/r186 otherwise selects an XRProjectionLayer with no color texture on Cardboard.
const original = "const supportsLayers = supportsGlBinding && 'createProjectionLayer' in XRWebGLBinding.prototype;";
const corrected = "const supportsLayers = session.enabledFeatures.includes( 'layers' ) && supportsGlBinding && 'createProjectionLayer' in XRWebGLBinding.prototype;";
for (const file of ['src/renderers/webxr/WebXRManager.js', 'build/three.module.js']) {
  const path = new URL(`../node_modules/three/${file}`, import.meta.url);
  const source = readFileSync(path, 'utf8');
  if (source.includes(original)) writeFileSync(path, source.replace(original, corrected));
  else if (!source.includes(corrected)) throw new Error(`WebXR patch incompatible with three/${file}; review the upstream layers detection.`);
}
