import * as THREE from 'three';

export function buildLaptop(scene) {
  const BASE_W = 2.97;   // 29.7cm
  const BASE_D = 2.28;   // 22.8cm
  const BASE_H = 0.16;   // 1.6cm
  const SCREEN_W = 2.9;  // 29cm
  const SCREEN_D = 1.95; // 19.5cm
  const SCREEN_H = 0.08; // 0.8cm
  const BEZEL = 0.06;
  const PORT_W = 0.12;
  const PORT_H = 0.06;
  const PORT_D = 0.3;

  // Materials
  const aluMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.35 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.4 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
  const kbMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const portMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.5 });

  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(22, 5.625, 17);

  // === Base ===
  const base = new THREE.Mesh(new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D), aluMat);
  base.position.y = BASE_H / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  laptopGroup.add(base);

  // Keyboard area
  const KB_W = 2.4, KB_D = 0.9;
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(KB_W, KB_D), kbMat);
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, BASE_H + 0.001, -0.25);
  laptopGroup.add(kb);

  // Trackpad
  const TP_W = 1.0, TP_D = 0.6;
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(TP_W, TP_D), kbMat);
  tp.rotation.x = -Math.PI / 2;
  tp.position.set(0, BASE_H + 0.001, 0.55);
  laptopGroup.add(tp);

  // === Screen hinge (pivot at rear edge of base) ===
  // Screen extends in +Z (over keyboard when closed), rotates open around X
  const screenHinge = new THREE.Group();
  screenHinge.position.set(0, BASE_H, -BASE_D / 2);
  screenHinge.rotation.x = -1.92; // 110° open
  laptopGroup.add(screenHinge);

  // Screen back (lid) — extends toward +Z from hinge
  const screenBack = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W, SCREEN_H, SCREEN_D), aluMat);
  screenBack.position.set(0, 0, SCREEN_D / 2);
  screenBack.castShadow = true;
  screenHinge.add(screenBack);

  // Bezel (red frame on display side = -Y face when closed)
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

  // Screen face (dark glossy display) — faces -Y (toward keyboard when closed, toward user when open)
  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W - BEZEL * 2, SCREEN_D - BEZEL * 2),
    screenMat
  );
  screenFace.rotation.x = Math.PI / 2;
  screenFace.position.set(0, -SCREEN_H / 2 - 0.001, SCREEN_D / 2);
  screenHinge.add(screenFace);

  // === USB-C ports (red) ===
  const portGeo = new THREE.BoxGeometry(PORT_W, PORT_H, PORT_D);

  const usbLeft = new THREE.Mesh(portGeo, portMat);
  usbLeft.position.set(-BASE_W / 2 - PORT_W / 2 + 0.01, BASE_H * 0.6, -BASE_D / 2 + 0.5);
  laptopGroup.add(usbLeft);

  const usbRight = new THREE.Mesh(portGeo, portMat);
  usbRight.position.set(BASE_W / 2 + PORT_W / 2 - 0.01, BASE_H * 0.6, -BASE_D / 2 + 0.5);
  laptopGroup.add(usbRight);

  scene.add(laptopGroup);

  // === OnePlus Nord 4 (coque rouge, écran vers le haut) ===
  const PHONE_W = 0.75;  // 7.5cm
  const PHONE_D = 1.62;  // 16.2cm
  const PHONE_H = 0.08;  // 8mm
  const DESK_Y = 5.625;

  const caseMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
  const phoneScrMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05, metalness: 0.3 });
  const camMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.2 });

  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(24.2, DESK_Y, 17.2);
  phoneGroup.rotation.y = 0.15; // légèrement de biais

  // Coque rouge
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(PHONE_W, PHONE_H, PHONE_D), caseMat);
  phoneBody.position.y = PHONE_H / 2;
  phoneBody.castShadow = true;
  phoneGroup.add(phoneBody);

  // Écran (face sombre sur le dessus)
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(PHONE_W - 0.06, PHONE_D - 0.08),
    phoneScrMat
  );
  phoneScreen.rotation.x = -Math.PI / 2;
  phoneScreen.position.set(0, PHONE_H + 0.001, 0);
  phoneGroup.add(phoneScreen);

  // Module caméra (bosse arrière, petit rectangle en haut)
  const camBump = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.02, 0.35),
    camMat
  );
  camBump.position.set(0, -0.001, -PHONE_D / 2 + 0.3);
  phoneGroup.add(camBump);

  scene.add(phoneGroup);

  // === Mug rouge avec chocolat au lait ===
  const MUG_R = 0.4;     // rayon 4cm
  const MUG_H = 0.95;    // 9.5cm
  const MUG_THICK = 0.04; // épaisseur paroi

  const mugMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
  const chocoMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.6 });
  const mugInnerMat = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.5 });

  const mugGroup = new THREE.Group();
  mugGroup.position.set(19.8, DESK_Y, 16.3);

  // Corps du mug (cylindre ouvert en haut pour éviter le z-fighting)
  const mugOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(MUG_R, MUG_R * 0.92, MUG_H, 24, 1, true),
    mugMat
  );
  mugOuter.position.y = MUG_H / 2;
  mugOuter.castShadow = true;
  mugGroup.add(mugOuter);

  // Fond du mug
  const mugBottom = new THREE.Mesh(
    new THREE.CircleGeometry(MUG_R * 0.92, 24),
    mugMat
  );
  mugBottom.rotation.x = Math.PI / 2;
  mugBottom.position.y = 0.001;
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

  // Chocolat au lait (disque brun à l'intérieur, bien en-dessous du bord)
  const choco = new THREE.Mesh(
    new THREE.CircleGeometry(innerR - 0.01, 24),
    chocoMat
  );
  choco.rotation.x = -Math.PI / 2;
  choco.position.y = MUG_H - 0.12;
  mugGroup.add(choco);

  // Anse du mug (demi-torus vertical, boucle vers l'extérieur)
  const handleGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 12, Math.PI);
  const handle = new THREE.Mesh(handleGeo, mugMat);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(MUG_R, MUG_H * 0.48, 0);
  handle.castShadow = true;
  mugGroup.add(handle);

  scene.add(mugGroup);
}
