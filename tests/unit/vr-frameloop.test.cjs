const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('reprend le rendu VR depuis une scène suspendue et rétablit la pause après la session', () => {
  const previousDocument = global.document;
  const previousWindow = global.window;
  global.document = new EventTarget();
  global.window = new EventTarget();
  const cameraState = { isXR: false, isIntroRunning: false };
  const xr = new THREE.EventDispatcher();
  xr.isPresenting = false;
  let loop;
  let cleanup;
  const state = { gl: { xr }, setFrameloop: value => { loop = value; }, invalidate() {} };
  try {
    const { FrameloopController } = load('src/features/scene/Studio.tsx', {
      react: { useEffect: effect => { cleanup = effect(); } },
      '@react-three/fiber': { useThree: select => select(state) },
      './cameraState': { cameraState },
    }, source => `import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { cameraState } from './cameraState';
export ${source.slice(source.indexOf('function FrameloopController('), source.indexOf('function ActiveCameraCapture('))}`);
    FrameloopController({ isIdle: true, showInventory: true, isCvModalOpen: false, isPhotoModeOpen: false, isOrbiting: false });
    assert.equal(loop, 'never');
    cameraState.isXR = xr.isPresenting = true;
    document.dispatchEvent(new Event('vr-state-change'));
    assert.equal(loop, 'always');
    cameraState.isXR = false;
    document.dispatchEvent(new Event('vr-state-change'));
    xr.isPresenting = false;
    xr.dispatchEvent({ type: 'sessionend' });
    assert.equal(loop, 'never');
    document.dispatchEvent(new Event('start-camera-intro'));
    assert.equal(loop, 'always');
    window.dispatchEvent(new Event('camera-intro-finished'));
    assert.equal(loop, 'never');
  } finally {
    cleanup?.();
    global.document = previousDocument;
    global.window = previousWindow;
  }
});
