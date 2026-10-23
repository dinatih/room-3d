const { it, after } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const subjects = require('../../src/features/scene/camera/cameraSubjects.ts');
const camera = load('src/features/scene/camera/cameraUrlParams.ts', { './cameraSubjects': subjects });
const characters = load('src/features/scene/characterConfig.ts', {});
const previousWindow = global.window;
after(() => { if (previousWindow === undefined) delete global.window; else global.window = previousWindow; });
function browser(query) {
  global.window = { location: new URL(`https://room.test/${query}`), history: {
    replaceState(_, __, url) { window.location = new URL(url); },
  } };
}
it('distingue le personnage actif de la cible dans les deux modes', () => {
  for (const mode of ['follow', 'fpv']) {
    browser(`?mode=${mode}&target=character&character=marissa`);
    assert.equal(camera.parseUrlCameraMode(), mode);
    assert.equal(camera.parseUrlCameraTarget(), 'character');
    assert.equal(characters.parseUrlActiveCharacter().id, 'marissa');
    camera.updateUrlCameraMode(mode === 'fpv' ? 'follow' : 'fpv');
    assert.equal(window.location.searchParams.get('target'), 'character');
    assert.equal(window.location.searchParams.get('character'), 'marissa');
  }
});
it('lit les noms publics et internes des neuf sujets', () => {
  for (const subject of subjects.CAMERA_SUBJECTS) for (const value of [subject.target, subject.id]) {
    browser(`?target=${value}&character=marissa`);
    assert.equal(camera.parseUrlCameraSubject(), subject.id);
    assert.equal(camera.parseUrlCameraTarget(), subject.id);
    assert.equal(camera.parseUrlCameraMode(), 'fpv');
    camera.updateUrlCameraMode('follow');
    assert.equal(window.location.searchParams.get('target'), subject.target);
    assert.equal(characters.parseUrlActiveCharacter().id, 'marissa');
  }
});
it('normalise les raccourcis fpv=objet, follow=objet et cameraTarget=objet sans perdre la cible', () => {
  for (const key of ['fpv', 'follow', 'cameraTarget']) for (const value of ['ushiro', 'g1', 'bird', 'hornet']) {
    browser(`?${key}=${value}&character=marissa&lightsHD=1`);
    const subject = subjects.resolveCameraSubject(value);
    assert.equal(camera.parseUrlCameraSubject(), subject);
    assert.equal(camera.parseUrlCameraMode(), key === 'follow' ? 'follow' : 'fpv');
    camera.updateUrlCameraMode('follow');
    assert.equal(window.location.searchParams.get('target'), value);
    assert.equal(window.location.searchParams.has(key), false);
    assert.equal(window.location.searchParams.get('character'), 'marissa');
    assert.equal(window.location.searchParams.get('lightsHD'), '1');
    camera.updateUrlCameraMode('fpv');
    assert.equal(camera.parseUrlCameraMode(), 'fpv');
    assert.equal(camera.parseUrlCameraSubject(), subject);
  }
});
it('donne priorité à target sur les raccourcis et traite les drapeaux booléens comme des modes', () => {
  browser('?fpv=g1&target=bird');
  assert.equal(camera.parseUrlCameraSubject(), 'robin');
  for (const query of ['?fpv', '?fpv=1', '?fpv=true']) {
    browser(query); assert.equal(camera.parseUrlCameraSubject(), null); assert.equal(camera.parseUrlCameraMode(), 'fpv');
  }
  browser('?follow=0&mode=orbit&target=studio');
  assert.equal(camera.parseUrlCameraSubject(), null);
  assert.equal(camera.parseUrlCameraMode(), 'orbit');
});
it('conserve les pivots et les angles orbitaux, y compris dans les liens hash', () => {
  for (const query of ['?target=studio&cameraPos=north-east', '#/?target=studio&cameraPos=north-east']) {
    browser(query);
    assert.equal(camera.parseUrlCameraMode(), 'orbit');
    assert.equal(camera.parseUrlCameraSubject(), null);
    assert.equal(camera.parseUrlCameraPos().posKey, 'north-east');
    camera.updateUrlCameraMode('orbit');
    assert.equal(window.location.searchParams.get('target'), 'studio');
    assert.equal(window.location.searchParams.get('cameraPos'), 'north-east');
  }
});
it('refuse les cibles inconnues au lieu de choisir silencieusement un personnage', () => {
  browser('?target=inconnu');
  assert.throws(() => camera.parseUrlCameraTarget(), /Cible caméra inconnue/);
  assert.throws(() => camera.parseUrlCameraMode(), /Cible caméra inconnue/);
  browser('?target=marissa');
  assert.equal(characters.parseUrlActiveCharacter(), undefined);
  assert.throws(() => camera.parseUrlCameraTarget(), /Cible caméra inconnue/);
});
