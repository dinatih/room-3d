import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM_W, ROOM_D, WALL_H } from './config.js';

// =============================================
// SCENE
// =============================================
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a3e);
scene.fog = new THREE.FogExp2(0x2a2a3e, 0.006);

export const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
camera.position.set(50, 35, 55);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(ROOM_W / 2, WALL_H / 3, ROOM_D / 2);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.05;
controls.update();

// Environment map (pour les surfaces réfléchissantes)
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x889ab5);
  envScene.add(new THREE.AmbientLight(0xffffff, 1));
  const envDir = new THREE.DirectionalLight(0xfff8e8, 2);
  envDir.position.set(1, 1, 0.5);
  envScene.add(envDir);
  const envFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0xc4a060 })
  );
  envFloor.rotation.x = -Math.PI / 2;
  envFloor.position.y = -1;
  envScene.add(envFloor);
  const envWall = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 30),
    new THREE.MeshStandardMaterial({ color: 0xccccbb })
  );
  envWall.position.set(0, 10, -10);
  envScene.add(envWall);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
}

// Lights
scene.add(new THREE.AmbientLight(0x8899bb, 0.6));
const dir = new THREE.DirectionalLight(0xfff5e0, 1.8);
dir.position.set(50, 70, 40);
dir.castShadow = true;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.left = -60; dir.shadow.camera.right = 60;
dir.shadow.camera.top = 60; dir.shadow.camera.bottom = -60;
dir.shadow.bias = -0.002;
scene.add(dir);
const fill = new THREE.DirectionalLight(0xaabbff, 0.4);
fill.position.set(-20, 30, -10);
scene.add(fill);
