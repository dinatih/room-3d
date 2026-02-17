import { ROOM_W, ROOM_D, DOOR_START, DOOR_END } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { allBricks } from './brickHelpers.js';
import { buildWalls } from './walls.js';
import { buildKitchen } from './kitchen.js';
import { buildKallax } from './kallax.js';
import { buildBed } from './bed.js';
import { buildMirrors } from './mirrors.js';
import { buildChair } from './chair.js';
import { buildDesks } from './desks.js';
import { buildMackapar } from './mackapar.js';
import { buildDecor } from './decor.js';
import { buildFloor } from './floor.js';
import { buildInstancedMeshes } from './instancedMeshes.js';
import { buildGrid } from './grid.js';

buildWalls(scene);
buildKitchen(scene);
buildKallax(scene);
buildBed(scene);
buildMirrors(scene);
buildChair(scene);
buildDesks(scene);
buildMackapar(scene);
buildDecor(scene);
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

console.log(`LEGO Room: ${ROOM_W}x${ROOM_D}, ${allBricks.length} briques`);
console.log(`Porte: studs ${DOOR_START}-${DOOR_END} (80cm), 30cm du mur gauche`);
