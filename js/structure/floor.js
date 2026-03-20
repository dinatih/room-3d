import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, PLATE_H, GAP, WALL_H,
  NICHE_DEPTH, NICHE_Z_START, FLOOR_Y, GARDEN_JC_Z,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AZ, DIAG_CX, DIAG_CZ,
  BLDG_X_MIN, BLDG_X_MAX, BLDG_Z_MIN, BLDG_Z_MAX,
  DOOR_START,
  COLORS,
} from '../config.js';

// =============================================
// PARQUET — dalle texturée, lames 130×20cm
// =============================================
export function buildParquetMesh(scene) {
  // Canvas portrait : 128×512px = 40cm × 260cm
  // Colonne 1 (x=0..64) : 2 lames de 130cm. Colonne 2 : décalage 65cm.
  // Lames verticales dans le canvas → courent le long de Z dans le monde.
  const CW = 128, CH = 512, PW = CW / 2, PH = CH / 2;
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');
  // Fond bois de base : évite les pixels transparents aux bords du canvas
  ctx.fillStyle = 'rgb(122, 74, 30)';
  ctx.fillRect(0, 0, CW, CH);

  const PLANK_COLOR = 'rgb(122, 74, 30)';

  // Règle : joint uniquement en HAUT de chaque lame, jamais en bas.
  // → à la répétition du canvas, exactement 1 pixel de séparation (pas de double lame).
  function drawPlank(x0, y0, w, h, { skipTop = false } = {}) {
    ctx.fillStyle = PLANK_COLOR;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    for (let i = 0; i < 10; i++) {
      const lx = x0 + 2 + Math.random() * (w - 4);
      ctx.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.8;
      ctx.beginPath(); ctx.moveTo(lx, y0 + 1); ctx.lineTo(lx, y0 + h - 1); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x0, y0, 1, h);          // joint gauche
    ctx.fillRect(x0 + w - 1, y0, 1, h); // joint droit
    if (!skipTop) ctx.fillRect(x0, y0, w, 1); // joint haut uniquement
  }

  // Col 1 : 2 lames complètes, joint haut à chaque début de lame
  drawPlank(0, 0,  PW, PH);
  drawPlank(0, PH, PW, PH);
  // Col 2 : décalage 65cm — le fragment du haut est la CONTINUATION de la lame du bas
  //         → skipTop pour éviter un joint là où la lame continue
  drawPlank(PW, 0,           PW, PH / 2, { skipTop: true });
  drawPlank(PW, PH / 2,      PW, PH);
  drawPlank(PW, PH + PH / 2, PW, PH / 2);

  // ── Contour unique du sol parquet ──────────────────────────────────────
  // Séjour + niche + cuisine + couloir + triangle diagonal
  // shape.x = worldX, shape.y = -worldZ (rotation.x = -PI/2 restitue worldZ)
  // Ordre CCW (normales +Y = vers le haut)
  const shape = new THREE.Shape([
    new THREE.Vector2(0,             0),
    new THREE.Vector2(0,             -NICHE_Z_START),
    new THREE.Vector2(-NICHE_DEPTH,  -NICHE_Z_START),
    new THREE.Vector2(-NICHE_DEPTH,  -ROOM_D),
    new THREE.Vector2(0,             -ROOM_D),
    new THREE.Vector2(KITCHEN_X0,    -ROOM_D),
    new THREE.Vector2(KITCHEN_X0,    -KITCHEN_Z),
    new THREE.Vector2(KITCHEN_X1,    -KITCHEN_Z),
    new THREE.Vector2(KITCHEN_X1,    -ROOM_D),
    new THREE.Vector2(DOOR_START,    -ROOM_D),
    new THREE.Vector2(DOOR_START,    -SDB_Z_END),  // coin diagonal (X=190, Z=600)
    new THREE.Vector2(ROOM_W,        -DIAG_AZ),    // départ diagonal  (X=300, Z=530)
    new THREE.Vector2(ROOM_W,        0),
  ]);

  const geo = new THREE.ShapeGeometry(shape);

  // UV auto (bounding box shape) : X=-10..300 (310cm), Z=0..600 (600cm)
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // UV brut du ShapeGeometry = coordonnées world (cm), pas normalisées [0,1]
  // → repeat = 1/tailleTuile pour que la texture se répète tous les N cm
  tex.repeat.set(1 / 40, 1 / 260);

  const mat = new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.45, metalness: 0.0,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.receiveShadow = true;
  mesh.userData.brickType = 'parquet';
  scene.add(mesh);
}

// =============================================
// CARRELAGE — dalle blanche 20×20cm
// Couvre la zone SDB + couloir entrée
// =============================================
export function buildTileMesh(scene) {
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Carreau blanc légèrement chaud
  ctx.fillStyle = '#f4f4f2';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Joints gris (3px sur 128 = ~1.5cm sur 20cm)
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, 0, SIZE, 3);
  ctx.fillRect(0, SIZE - 3, SIZE, 3);
  ctx.fillRect(0, 0, 3, SIZE);
  ctx.fillRect(SIZE - 3, 0, 3, SIZE);

  const baseTex = new THREE.CanvasTexture(canvas);
  baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;

  // Canvas marron pour le placard couloir
  const canvasBrown = document.createElement('canvas');
  canvasBrown.width = SIZE; canvasBrown.height = SIZE;
  const ctxB = canvasBrown.getContext('2d');
  ctxB.fillStyle = '#7a5030';
  ctxB.fillRect(0, 0, SIZE, SIZE);
  ctxB.fillStyle = '#4a3020';
  ctxB.fillRect(0, 0, SIZE, 3);
  ctxB.fillRect(0, SIZE - 3, SIZE, 3);
  ctxB.fillRect(0, 0, 3, SIZE);
  ctxB.fillRect(SIZE - 3, 0, 3, SIZE);
  const brownTex = new THREE.CanvasTexture(canvasBrown);
  brownTex.wrapS = brownTex.wrapT = THREE.RepeatWrapping;

  // Helper : crée un plan carrelage avec le bon repeat pour les vraies dimensions
  // Canvas = 20×20cm
  function addTile(widthCm, depthCm, cx, cz, baseTx = baseTex) {
    const t = baseTx.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(widthCm / 20, depthCm / 20);
    t.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({
      map: t, roughness: 0.25, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(widthCm, depthCm), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, 0, cz);
    mesh.receiveShadow = true;
    mesh.userData.brickType = 'tile';
    scene.add(mesh);
  }

  // SDB + couloir entrée — trapèze découpé par le mur diagonal
  // BufferGeometry explicite : vertices en XZ world, UV = worldCoord/20 (1 unit = 1 carreau 20cm)
  {
    // 4 coins du trapèze (Y=0)
    const Ax = DIAG_CX,    Az = KITCHEN_Z;  // NW (-10, 460)
    const Bx = DIAG_CX,    Bz = DIAG_CZ;   // SW (-10, 727)
    const Cx = DOOR_START, Cz = SDB_Z_END;  // SE (190, 600) — diag ∩ X=190
    const Dx = DOOR_START, Dz = KITCHEN_Z;  // NE (190, 460)
    const positions = new Float32Array([
      Ax, 0, Az,  Bx, 0, Bz,  Cx, 0, Cz,   // triangle ABC
      Ax, 0, Az,  Cx, 0, Cz,  Dx, 0, Dz,   // triangle ACD
    ]);
    // UV = worldCoord / 20 → 1 unité UV = 1 carreau de 20cm
    const uvs = new Float32Array([
      Ax/20, Az/20,  Bx/20, Bz/20,  Cx/20, Cz/20,
      Ax/20, Az/20,  Cx/20, Cz/20,  Dx/20, Dz/20,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    const t = baseTex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    t.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({
      map: t, roughness: 0.25, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.userData.brickType = 'tile';
    scene.add(mesh);
  }

  // Placard couloir (X=130..190, Z=410..460) — carrelage marron
  const CLOSET_W = DOOR_START - KITCHEN_X1; // 60 cm
  const CLOSET_D = KITCHEN_Z - ROOM_D;      // 60 cm (inclut les 10cm sous mur D)
  addTile(CLOSET_W, CLOSET_D,
    KITCHEN_X1 + CLOSET_W / 2,
    ROOM_D + CLOSET_D / 2,
    brownTex);
}

// =============================================
// DALLE BÉTON + PLAFOND
// Les deux partagent l'emprise BLDG_* définie dans config.js :
//   NW(-100, 0)  NE(400, 0)
//   SW(-100,800) SE(400,800)
// =============================================
const BLDG_W  = BLDG_X_MAX - BLDG_X_MIN;  // 500 cm
const BLDG_D  = BLDG_Z_MAX - BLDG_Z_MIN;  // 800 cm
const BLDG_CX = (BLDG_X_MIN + BLDG_X_MAX) / 2;  // 150 cm
const BLDG_CZ = (BLDG_Z_MIN + BLDG_Z_MAX) / 2;  // 400 cm

export function buildConcreteSlab(scene) {
  const SLAB_DEPTH = 10; // 10cm d'épaisseur

  const mat = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.6 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, SLAB_DEPTH, BLDG_D), mat);

  // Surface haute de la dalle = sommet des anciennes plates
  slab.position.set(BLDG_CX, FLOOR_Y + (PLATE_H - GAP) / 2 - SLAB_DEPTH / 2, BLDG_CZ);
  slab.receiveShadow = true;
  slab.userData.brickType = 'slab';
  scene.add(slab);
}

// ── Texture herbe procédurale ────────────────────────────────────────────────
function makeGrassTex() {
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Sol : vert foncé terreux
  ctx.fillStyle = '#1e4a22';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Variation de sol : taches terre sombre
  const rng = () => Math.random();
  for (let i = 0; i < 80; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const r = 5 + rng() * 15;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(10,30,10,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brins d'herbe : traits épais et contrastés
  const BLADES = 9000;
  for (let i = 0; i < BLADES; i++) {
    const x = rng() * SIZE;
    const y = rng() * SIZE;
    const len = 5 + rng() * 14;
    const angle = -Math.PI / 2 + (rng() - 0.5) * 1.0;
    // gamme : vert très foncé (#1a4a1a) à vert moyen (#4a9a40)
    const g = Math.floor(60 + rng() * 100);   // 60–160
    const r = Math.floor(10 + rng() * 30);
    ctx.strokeStyle = `rgb(${r},${g},${r})`;
    ctx.lineWidth = 0.8 + rng() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Dalle ~500×370cm → tuile ~20×20cm → 25×18 répétitions
  tex.repeat.set(25, 18);
  return tex;
}

// Dalle jardin verte — de Z = BLDG_Z_MIN jusqu'à Z=-400, même emprise X et épaisseur
export function buildGardenSlab(scene) {
  const SLAB_DEPTH = 10;
  const Z_START = BLDG_Z_MIN;
  const Z_END = -400;
  const D = Math.abs(Z_END - Z_START);
  const CZ = (Z_START + Z_END) / 2;

  const grassTex = makeGrassTex();
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.85, color: 0xffffff });
  const sideMat  = new THREE.MeshStandardMaterial({ color: 0x1e4022, roughness: 0.9 });
  // BoxGeometry face order: [+X, -X, +Y(top), -Y(bot), +Z, -Z]
  const mats = [sideMat, sideMat, grassMat, sideMat, sideMat, sideMat];

  const slab = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, SLAB_DEPTH, D), mats);
  slab.position.set(BLDG_CX, FLOOR_Y + (PLATE_H - GAP) / 2 - SLAB_DEPTH / 2, CZ);
  slab.receiveShadow = true;
  slab.userData.brickType = 'slab';
  scene.add(slab);
}

// =============================================
// PLAFOND
// Boîte 20cm d'épaisseur, même emprise que la dalle.
// Face inférieure (-Y) : opaque, même aspect que les murs.
// Face supérieure (+Y) : transparent → effet ghost depuis au-dessus.
// =============================================
const CEIL_THICK = 20;

// BoxGeometry material order: [+X, -X, +Y (top), -Y (bottom), +Z, -Z]
const _ceilBottom = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
});
const _ceilTop = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35,
  transparent: true, opacity: 0.18, depthWrite: false,
});
const _ceilSide = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.35 });
const _ceilMats = [_ceilSide, _ceilSide, _ceilTop, _ceilBottom, _ceilSide, _ceilSide];

export function buildCeiling(scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, CEIL_THICK, BLDG_D), _ceilMats);
  // Base à WALL_H - 1 : légèrement sous le sommet des murs (évite le z-fighting)
  mesh.position.set(BLDG_CX, WALL_H - 1 + CEIL_THICK / 2, BLDG_CZ);
  mesh.userData.brickType = 'ceiling';
  scene.add(mesh);

  // Plafond-terrasse 235cm (X, côté Est) × 150cm (Z, extension Nord)
  // Collé au bord Nord du plafond principal (Z = BLDG_Z_MIN)
  const TER_X = 235;
  const TER_Z = 150;
  const terCX = 300 - TER_X / 2;                // de X=65 à X=300 (vers l'Ouest, côté jardin)
  const terCZ = BLDG_Z_MIN - TER_Z / 2;         // extension vers le Nord
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(TER_X, CEIL_THICK, TER_Z), _ceilMats);
  terrace.position.set(terCX, WALL_H - 1 + CEIL_THICK / 2, terCZ);
  terrace.userData.brickType = 'ceiling';
  scene.add(terrace);
}

// =============================================
// GROUND PLANE
// =============================================
export function buildGroundPlane(scene) {
  const gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = -10;
  gnd.receiveShadow = true;
  gnd.userData.brickType = 'ground';
  scene.add(gnd);
}
