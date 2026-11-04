const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const THREE = require('three');

// Exécuter les fonctions de production avec une vraie scène Three, sans WebGL.
const source = fs.readFileSync('src/features/scene/HoverMenu.tsx', 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const code = `
${extract('function resolveAction(', '// ── Composant R3F')}
let interactiveCache = [], occluderCache = [], lastCacheTime = 0;
let overCameraViewMarker = false;
const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
${extract('    function refreshCaches()', '    function hideDot()')}
${extract('    const occlusionRaycaster', '    // ── Souris')}
return raycastAt;
`;
const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
const target = new THREE.Group();
target.userData.hoverAction = { label: 'Porte SDB', actions: ['door-sdb'] };
scene.add(target);
const material = new THREE.MeshBasicMaterial();
for (const z of [-10, -12]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), material);
  mesh.position.z = z;
  mesh.userData.hoverAction = target.userData.hoverAction;
  target.add(mesh);
}
const walls = new THREE.Group();
walls.name = 'walls-group';
const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), material.clone());
wall.position.z = -5;
wall.userData.brickType = 'wall';
walls.add(wall);
scene.add(walls);
scene.updateMatrixWorld(true);
camera.updateMatrixWorld(true);
let wallTests = 0, targetTests = 0;
wall.raycast = function (...args) { wallTests++; return THREE.Mesh.prototype.raycast.apply(this, args); };
for (const mesh of target.children) mesh.raycast = function (...args) { targetTests++; return THREE.Mesh.prototype.raycast.apply(this, args); };
const raycast = new Function('THREE', 'scene', 'camera', 'canvas', 'cameraState', 'getActionDef', 'LAYER_NEIGHBORS', 'LAYER_LIDAR', compiled)(THREE, scene, camera, canvas, { isDragging: false }, () => true, 10, 11);
assert.equal(raycast(50, 50), null, 'Un mur opaque doit bloquer la porte');
assert.equal(wallTests, 1, 'Un seul raycast d’occlusion malgré plusieurs hits et racines imbriquées');
assert.equal(targetTests, 2, 'Chaque maillage interactif doit être testé une seule fois');
wall.material.transparent = true;
wall.material.opacity = 0;
assert.equal(raycast(50, 50).label, 'Porte SDB', 'Un mur transparent ne doit pas bloquer la porte');
wall.material.opacity = 1;
walls.visible = false;
assert.equal(raycast(50, 50).label, 'Porte SDB', 'Un parent masqué ne doit pas occulter');
assert.equal(raycast(0, 0), null, 'Le pointeur hors des objets ne doit rien sélectionner');
console.log('Hover raycast: occlusion, transparence, visibilité et absence de doublons validées.');
