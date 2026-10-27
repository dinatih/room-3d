const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { enableWireframe } = load('src/features/scene/utils/wireframe.ts', { three: THREE });
const mesh = (material = new THREE.MeshBasicMaterial()) => new THREE.Mesh(new THREE.BoxGeometry(), material);
const invalidate = () => {};

it('le mode local survit à l’arrêt du mode global, dans les deux ordres d’activation', () => {
  for (const globalFirst of [true, false]) {
    const scene = new THREE.Scene(), category = new THREE.Group(), wall = mesh(), furniture = mesh();
    category.add(wall); scene.add(category, furniture);
    let stopGlobal, stopLocal;
    if (globalFirst) { stopGlobal = enableWireframe(scene, invalidate); stopLocal = enableWireframe(category, invalidate); }
    else { stopLocal = enableWireframe(category, invalidate); stopGlobal = enableWireframe(scene, invalidate); }
    assert(wall.material.wireframe && furniture.material.wireframe);
    stopGlobal();
    assert.equal(wall.material.wireframe, true);
    assert.equal(furniture.material.wireframe, false);
    stopLocal();
    assert.equal(wall.material.wireframe, false);
  }
});

it('restaure les matériaux partagés et les matériaux déjà filaires sans les recompiler inutilement', () => {
  const root = new THREE.Group(), material = new THREE.MeshBasicMaterial({ wireframe: true });
  root.add(mesh(material), mesh(material));
  const version = material.version, stop = enableWireframe(root, invalidate);
  assert.equal(material.version, version);
  stop();
  assert.equal(material.wireframe, true);
});

it('exclut tout le sous-arbre du ciel et prend en charge les matériaux multiples', () => {
  const scene = new THREE.Scene(), sky = new THREE.Group(), celestial = mesh(), object = mesh([
    new THREE.MeshBasicMaterial(), new THREE.MeshStandardMaterial(), new THREE.LineBasicMaterial(),
  ]);
  sky.userData.isSky = true; sky.add(celestial); scene.add(sky, object);
  const stop = enableWireframe(scene, invalidate);
  assert.equal(celestial.material.wireframe, false);
  assert(object.material.slice(0, 2).every(material => material.wireframe));
  stop();
  assert(object.material.slice(0, 2).every(material => !material.wireframe));
});

it('observe les ajouts et retraits imbriqués sans parcours à chaque image', async () => {
  const root = new THREE.Group(), nested = new THREE.Group();
  root.add(nested);
  let updates = 0;
  const stop = enableWireframe(root, () => updates++);
  const first = mesh(), second = mesh(first.material);
  nested.add(first, second);
  await Promise.resolve();
  assert.equal(updates, 2, 'les ajouts synchrones doivent être regroupés');
  assert.equal(first.material.wireframe, true);
  nested.remove(first);
  await Promise.resolve();
  assert.equal(first.material.wireframe, true, 'le second mesh utilise encore le matériau');
  nested.remove(second);
  await Promise.resolve();
  assert.equal(first.material.wireframe, false);
  const detached = new THREE.Group();
  root.add(detached); root.remove(detached);
  await Promise.resolve();
  const before = updates;
  detached.add(mesh());
  await Promise.resolve();
  assert.equal(updates, before, 'aucun écouteur ne doit rester sur les objets retirés');
  stop();
});

it('annule une actualisation en attente au démontage et accepte un remontage', async () => {
  const root = new THREE.Group(), object = mesh();
  let updates = 0;
  const stop = enableWireframe(root, () => updates++);
  root.add(object); stop();
  await Promise.resolve();
  assert.equal(object.material.wireframe, false);
  assert.equal(updates, 2);
  const unmount = enableWireframe(root, invalidate);
  assert.equal(object.material.wireframe, true);
  unmount();
  assert.equal(object.material.wireframe, false);
});
