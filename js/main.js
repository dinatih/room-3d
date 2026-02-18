import { ROOM_W, ROOM_D, WALL_H, DOOR_START, DOOR_END } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { allBricks } from './brickHelpers.js';
import { loadFont } from './labels.js';
import { buildWalls } from './walls.js';
import { buildKitchen } from './kitchen.js';
import { buildKallax } from './kallax.js';
import { buildBed } from './bed.js';
import { buildMirrors } from './mirrors.js';
import { buildChair } from './chair.js';
import { buildDesks } from './desks.js';
import { buildMackapar } from './mackapar.js';
import { buildDecor } from './decor.js';
import { buildCorridor } from './corridor.js';
import { buildFloor } from './floor.js';
import { buildInstancedMeshes } from './instancedMeshes.js';
import { buildGrid } from './grid.js';

// Charger la font avant de construire les labels
await loadFont();

buildWalls(scene);
buildKitchen(scene);
buildKallax(scene);
buildBed(scene);
buildMirrors(scene);
buildChair(scene);
buildDesks(scene);
buildMackapar(scene);
buildDecor(scene);
buildCorridor(scene);
buildFloor(allBricks);
buildInstancedMeshes(scene, allBricks);
buildGrid(scene);

// =============================================
// ANIMATE
// =============================================
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// =============================================
// VUES CAMERA
// =============================================
const CX = ROOM_W / 2, CY = WALL_H / 2, CZ = ROOM_D / 2;
const DIST = 60;

const VIEWS = {
  perspective: { pos: [50, 35, 55],       target: [CX, WALL_H / 3, CZ] },
  top:         { pos: [CX, DIST + 20, CZ], target: [CX, 0, CZ] },
  bottom:      { pos: [CX, -DIST, CZ],     target: [CX, 0, CZ] },
  front:       { pos: [CX, CY, CZ + DIST], target: [CX, CY, CZ] },
  back:        { pos: [CX, CY, CZ - DIST], target: [CX, CY, CZ] },
  left:        { pos: [CX - DIST, CY, CZ], target: [CX, CY, CZ] },
  right:       { pos: [CX + DIST, CY, CZ], target: [CX, CY, CZ] },
};

document.querySelectorAll('#views button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = VIEWS[btn.dataset.view];
    if (!v) return;
    camera.position.set(...v.pos);
    controls.target.set(...v.target);
    controls.update();
  });
});

console.log(`LEGO Room: ${ROOM_W}x${ROOM_D}, ${allBricks.length} briques`);
console.log(`Porte: studs ${DOOR_START}-${DOOR_END} (80cm), 30cm du mur gauche`);
