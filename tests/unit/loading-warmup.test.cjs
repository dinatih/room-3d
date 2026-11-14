const { it } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function warmup() {
  const shaders = deferred(), animation = deferred(), sky = deferred(), timers = new Map();
  let effect, error = null, nextId = 0, ready = 0, invalidations = 0, compilations = 0, renders = 0, hook = 0;
  const elements = { 'loading-bar': { style: {}, classList: { add() {} } }, 'loading-item': {} };
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial());
  mirror.isReflector = true;
  mirror.forceUpdate = false;
  const group = new THREE.Group();
  group.userData.mirrorFrustumGroup = true;
  group.visible = false;
  group.add(mirror); scene.add(group);
  const { GpuWarmup } = load('src/features/scene/Studio.tsx', {
    react: {
      useRef: value => ({ current: value }),
      useState: initial => hook++ === 0 ? [initial, () => {}] : [error, value => { error = value; }],
      useLayoutEffect: fn => { effect = fn; },
    },
    '@react-three/fiber': { useFrame() {}, useThree: () => ({
      gl: {
        compileAsync: () => { compilations++; return shaders.promise; }, shadowMap: {}, info: { programs: [] },
        render() {
          renders++;
          assert.equal(mirror.frustumCulled, false);
          assert.equal(mirror.forceUpdate, true);
          assert.equal(group.visible, true);
        },
      }, scene, camera, invalidate: () => invalidations++,
    }) },
    './SkySphere': { preloadCurrentSkyTexture: () => sky.promise },
    './character/useCharacterAnimations': { cacheDynamicGLTF: () => animation.promise },
    'test-frame': {
      document: { hidden: false, getElementById: id => elements[id] },
      setTimeout: fn => { timers.set(++nextId, fn); return nextId; },
      clearTimeout: id => timers.delete(id),
    },
  }, source => {
    const file = ts.createSourceFile('Studio.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const component = file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'GpuWarmup');
    return `import { useLayoutEffect, useRef, useState } from 'react';
      import { useThree, useFrame } from '@react-three/fiber';
      import { preloadCurrentSkyTexture } from './SkySphere';
      import { cacheDynamicGLTF } from './character/useCharacterAnimations';
      import { document, setTimeout, clearTimeout } from 'test-frame';
      const WARMUP_ANIM_PATHS = ['/walk.glb'];
      export ${component.getText(file)}`;
  });
  const render = () => { hook = 0; return GpuWarmup({ active: true, onReady: () => ready++ }); };
  render();
  return {
    shaders, animation, sky, timers, render, elements, mirror, group, start: () => effect(),
    get compilations() { return compilations; }, get renders() { return renders; },
    get ready() { return ready; }, get invalidations() { return invalidations; },
    async timer() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); await tick(); },
  };
}

it('attend HDRI, shaders et animations puis prépare un rendu et restaure les miroirs', async () => {
  const test = warmup(), stop = test.start();
  assert.equal(test.compilations, 0);
  await test.timer();
  assert.match(test.elements['loading-item'].textContent, /HDRI/);
  test.sky.resolve(); await tick();
  assert.equal(test.compilations, 1);
  test.shaders.resolve(); await tick();
  assert.equal(test.compilations, 2);
  assert.equal(test.timers.size, 0);
  test.animation.resolve(); await tick();
  assert.match(test.elements['loading-item'].textContent, /Initialisation du rendu 3D/);
  assert.equal(test.ready, 0);
  await test.timer();
  assert.equal(test.renders, 1);
  assert.equal(test.invalidations, 1);
  assert.equal(test.ready, 1);
  assert.equal(test.mirror.frustumCulled, true);
  assert.equal(test.mirror.forceUpdate, false);
  assert.equal(test.group.visible, false);
  stop();
});

it('annule la préparation au démontage, pendant le chargement ou avant le rendu', async () => {
  for (const phase of ['pause', 'assets', 'render']) {
    const test = warmup(), stop = test.start();
    if (phase !== 'pause') await test.timer();
    if (phase === 'render') {
      test.sky.resolve(); test.shaders.resolve(); test.animation.resolve(); await tick();
      assert.equal(test.timers.size, 1);
    }
    stop();
    test.sky.resolve(); test.shaders.resolve(); test.animation.resolve(); await tick();
    assert.equal(test.timers.size, 0);
    assert.equal(test.ready, 0);
    assert.equal(test.renders, 0);
  }
});

it('remonte les erreurs de chargement au lieu de lancer une scène incomplète', async () => {
  const test = warmup(), stop = test.start(), error = new Error('animation indisponible');
  await test.timer();
  test.sky.resolve(); test.shaders.resolve(); await tick();
  test.animation.reject(error); await tick();
  assert.throws(test.render, value => value === error);
  assert.equal(test.ready, 0);
  assert.equal(test.timers.size, 0);
  stop();
});
