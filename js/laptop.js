import * as THREE from 'three';
import { desk2Surface } from './desks.js';
import { renderer, scene as sceneRef, camera } from './scene.js';

const screenTex = new THREE.TextureLoader().load('media/omarchy-screen.png', () => {
  renderer.render(sceneRef, camera);
});
screenTex.colorSpace = THREE.SRGBColorSpace;

export function buildLaptop(scene) {
  const BASE_W = 29.7;
  const BASE_D = 22.8;
  const BASE_H = 1.6;
  const SCREEN_W = 29;
  const SCREEN_D = 19.5;
  const SCREEN_H = 0.8;
  const BEZEL = 0.6;
  const PORT_W = 1.2;
  const PORT_H = 0.6;
  const PORT_D = 3;

  const aluMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.35 });
  const screenMat = new THREE.MeshStandardMaterial({ map: screenTex, roughness: 0.1, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const portMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.5 });

  // All items are children of desk2Surface — non-rotated anchor at desk height
  // Local coords: X/Z = horizontal on desk surface, Y = 0 is the top surface
  const parent = desk2Surface;

  parent.rotation.y = Math.PI;

  // === Laptop ===
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(0, 0, 0); // centered on desk

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D), aluMat);
  base.position.y = BASE_H / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  laptopGroup.add(base);

  // Keyboard area
  const KB_W = 24, KB_D = 9;
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(KB_W, KB_D), kbMat);
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, BASE_H + 0.01, -2.5);
  laptopGroup.add(kb);

  // Trackpad
  const TP_W = 10, TP_D = 6;
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(TP_W, TP_D), kbMat);
  tp.rotation.x = -Math.PI / 2;
  tp.position.set(0, BASE_H + 0.01, 5.5);
  laptopGroup.add(tp);

  // Screen hinge (pivot at rear edge of base)
  const screenHinge = new THREE.Group();
  screenHinge.position.set(0, BASE_H, -BASE_D / 2);
  screenHinge.rotation.x = -1.92; // 110° open
  laptopGroup.add(screenHinge);

  // Screen back (lid)
  const screenBack = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W, SCREEN_H, SCREEN_D), aluMat);
  screenBack.position.set(0, 0, SCREEN_D / 2);
  screenBack.castShadow = true;
  screenHinge.add(screenBack);

  // Bezel (red frame on display side)
  const bNear = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W, BEZEL, BEZEL), bezelMat);
  bNear.position.set(0, -SCREEN_H / 2, BEZEL / 2);
  screenHinge.add(bNear);
  const bFar = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W, BEZEL, BEZEL), bezelMat);
  bFar.position.set(0, -SCREEN_H / 2, SCREEN_D - BEZEL / 2);
  screenHinge.add(bFar);
  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(BEZEL, BEZEL, SCREEN_D), bezelMat);
  bLeft.position.set(-SCREEN_W / 2 + BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2);
  screenHinge.add(bLeft);
  const bRight = new THREE.Mesh(new THREE.BoxGeometry(BEZEL, BEZEL, SCREEN_D), bezelMat);
  bRight.position.set(SCREEN_W / 2 - BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2);
  screenHinge.add(bRight);

  // Screen face (dark glossy display)
  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W - BEZEL * 2, SCREEN_D - BEZEL * 2),
    screenMat
  );
  screenFace.rotation.x = Math.PI / 2;
  screenFace.position.set(0, -SCREEN_H / 2 - 0.01, SCREEN_D / 2);
  screenHinge.add(screenFace);

  // USB-C ports (red)
  const portGeo = new THREE.BoxGeometry(PORT_W, PORT_H, PORT_D);
  const usbLeft = new THREE.Mesh(portGeo, portMat);
  usbLeft.position.set(-BASE_W / 2 - PORT_W / 2 + 0.1, BASE_H * 0.6, -BASE_D / 2 + 5);
  laptopGroup.add(usbLeft);
  const usbRight = new THREE.Mesh(portGeo, portMat);
  usbRight.position.set(BASE_W / 2 + PORT_W / 2 - 0.1, BASE_H * 0.6, -BASE_D / 2 + 5);
  laptopGroup.add(usbRight);

  parent.add(laptopGroup);

  // === OnePlus Nord 4 (coque rouge, écran vers le haut) ===
  const PHONE_W = 7.5;   // 7.5cm
  const PHONE_D = 16.2;  // 16.2cm
  const PHONE_H = 0.8;   // 8mm

  const caseMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
  const phoneScrMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const camMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.2 });

  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(22, 0, 2); // offset from desk center
  phoneGroup.rotation.y = 0.15; // légèrement de biais

  // Coque rouge
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(PHONE_W, PHONE_H, PHONE_D), caseMat);
  phoneBody.position.y = PHONE_H / 2;
  phoneBody.castShadow = true;
  phoneGroup.add(phoneBody);

  // Écran (face sombre sur le dessus)
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(PHONE_W - 0.6, PHONE_D - 0.8),
    phoneScrMat
  );
  phoneScreen.rotation.x = -Math.PI / 2;
  phoneScreen.position.set(0, PHONE_H + 0.01, 0);
  phoneGroup.add(phoneScreen);

  // Module caméra (bosse arrière)
  const camBump = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3.5), camMat);
  camBump.position.set(0, -0.01, -PHONE_D / 2 + 3);
  phoneGroup.add(camBump);

  parent.add(phoneGroup);

  // === Mug rouge avec chocolat au lait ===
  const MUG_R = 4;       // rayon 4cm
  const MUG_H = 9.5;     // 9.5cm
  const MUG_THICK = 0.4;  // épaisseur paroi

  const mugMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
  const chocoMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.6 });
  const mugInnerMat = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.5 });

  const mugGroup = new THREE.Group();
  mugGroup.position.set(-22, 0, -7); // offset from desk center

  // Corps du mug (cylindre ouvert en haut)
  const mugOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(MUG_R, MUG_R * 0.92, MUG_H, 24, 1, true),
    mugMat
  );
  mugOuter.position.y = MUG_H / 2;
  mugOuter.castShadow = true;
  mugGroup.add(mugOuter);

  // Fond du mug
  const mugBottom = new THREE.Mesh(new THREE.CircleGeometry(MUG_R * 0.92, 24), mugMat);
  mugBottom.rotation.x = Math.PI / 2;
  mugBottom.position.y = 0.01;
  mugGroup.add(mugBottom);

  // Intérieur (cylindre ouvert, légèrement plus petit)
  const innerR = MUG_R - MUG_THICK;
  const innerH = MUG_H - MUG_THICK;
  const mugInner = new THREE.Mesh(
    new THREE.CylinderGeometry(innerR, innerR * 0.92, innerH, 24, 1, true),
    mugInnerMat
  );
  mugInner.position.y = MUG_THICK + innerH / 2;
  mugGroup.add(mugInner);

  // Chocolat au lait (disque brun à l'intérieur)
  const choco = new THREE.Mesh(new THREE.CircleGeometry(innerR - 0.1, 24), chocoMat);
  choco.rotation.x = -Math.PI / 2;
  choco.position.y = MUG_H - 1.2;
  mugGroup.add(choco);

  // Anse du mug (demi-torus vertical)
  const handleGeo = new THREE.TorusGeometry(2.2, 0.4, 8, 12, Math.PI);
  const handle = new THREE.Mesh(handleGeo, mugMat);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(MUG_R, MUG_H * 0.48, 0);
  handle.castShadow = true;
  mugGroup.add(handle);

  parent.add(mugGroup);
}
