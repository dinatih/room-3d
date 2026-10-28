const { it } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { load } = require('../support/load-ts.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function warmup() {
  const shaders = deferred(), animation = deferred(), frames = new Map();
  let effect, error = null, nextId = 0, ready = 0, invalidations = 0;
  const { GpuWarmup } = load('src/features/scene/Studio.tsx', {
    react: { useRef: value => ({ current: value }), useState: () => [error, value => { error = value; }], useEffect: fn => { effect = fn; } },
    '@react-three/fiber': { useThree: () => ({
      gl: { compileAsync: () => shaders.promise, shadowMap: {} }, scene: {}, camera: {},
      invalidate: () => invalidations++,
    }) },
    './character/useCharacterAnimations': { cacheDynamicGLTF: () => animation.promise },
    'test-frame': {
      requestAnimationFrame: fn => { frames.set(++nextId, fn); return nextId; },
      cancelAnimationFrame: id => frames.delete(id),
    },
  }, source => {
    const file = ts.createSourceFile('Studio.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const component = file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'GpuWarmup');
    return `import { useEffect, useRef, useState } from 'react';
      import { useThree } from '@react-three/fiber';
      import { cacheDynamicGLTF } from './character/useCharacterAnimations';
      import { requestAnimationFrame, cancelAnimationFrame } from 'test-frame';
      const WARMUP_ANIM_PATHS = ['/walk.glb'];
      export ${component.getText(file)}`;
  });
  const render = () => GpuWarmup({ active: true, onReady: () => ready++ });
  render();
  return {
    shaders, animation, frames, render, start: () => effect(),
    get ready() { return ready; }, get invalidations() { return invalidations; },
    frame() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); },
  };
}

it('attend shaders et animations puis chauffe sur sept images, sans temporisation fixe', async () => {
  const test = warmup(), stop = test.start();
  test.shaders.resolve(); await tick();
  assert.equal(test.frames.size, 0);
  test.animation.resolve(); await tick();
  for (let i = 0; i < 6; i++) { test.frame(); assert.equal(test.ready, 0); }
  test.frame();
  assert.equal(test.invalidations, 7);
  assert.equal(test.ready, 1);
  assert.equal(test.frames.size, 0);
  stop();
});

it('annule le warm-up au démontage, pendant le chargement ou entre deux images', async () => {
  for (const beforeAssets of [true, false]) {
    const test = warmup(), stop = test.start();
    if (beforeAssets) stop();
    test.shaders.resolve(); test.animation.resolve(); await tick();
    if (!beforeAssets) { assert.equal(test.frames.size, 1); stop(); }
    assert.equal(test.frames.size, 0);
    test.frame();
    assert.equal(test.ready, 0);
  }
});

it('remonte les erreurs de chargement au lieu de lancer une scène incomplète', async () => {
  const test = warmup(), stop = test.start(), error = new Error('animation indisponible');
  test.animation.reject(error); await tick();
  assert.throws(test.render, value => value === error);
  assert.equal(test.ready, 0);
  assert.equal(test.frames.size, 0);
  stop();
});
