/**
 * BuildAnimation4.tsx — "Tombée du ciel" — Effet Matrix.
 *
 * Même logique que BuildAnimation3 (sol monte, mobilier tombe un par un,
 * murs puis plafond en dernier), avec en plus :
 *
 *  • Effet Matrix : les objets en chute sont remplacés par un matériau
 *    wireframe vert (#00ff41). À 80% de leur chute ils "matérialisent" :
 *    retour aux matériaux originaux avec un flash lumineux bref.
 *  • Pluie Matrix : InstancedMesh de barres vertes tombant aléatoirement
 *    dans tout le volume de la scène pendant la durée de l'animation.
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from '@config';
// ── Constantes ────────────────────────────────────────────────────────────────

const DROP_HEIGHT      = 2000;
const STAGGER_MS       = 250;
const FALL_MS_MIN      = 1400;
const FALL_MS_MAX      = 2000;
const MATERIALIZE_T    = 0.80;
const FLASH_DURATION   = 180;

const MAT_GREEN  = new THREE.MeshBasicMaterial({ color: 0xff1100, wireframe: true });
const MAT_FLASH  = new THREE.MeshBasicMaterial({ color: 0xff8844, wireframe: false, transparent: true });

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Utilitaires scène ─────────────────────────────────────────────────────────

type MeshSave = { mesh: THREE.Mesh; orig: THREE.Material | THREE.Material[] };

type AnimObj = {
  obj:          THREE.Object3D;
  origY:        number;
  startTime:    number;
  duration:     number;
  fromBelow:    boolean;
  meshSaves:    MeshSave[];        // matériaux originaux
  materialized: boolean;           // matérialisation déjà effectuée
  flashEnd:     number;            // timestamp de fin du flash (ms absolu)
};

function collectMeshes(o: THREE.Object3D, out: MeshSave[]): void {
  if ((o as THREE.Mesh).isMesh) {
    out.push({ mesh: o as THREE.Mesh, orig: (o as THREE.Mesh).material });
  }
  o.children.forEach(c => collectMeshes(c, out));
}

function applyMatrix(saves: MeshSave[]): void {
  saves.forEach(s => { s.mesh.material = MAT_GREEN; });
}

function applyFlash(saves: MeshSave[]): void {
  saves.forEach(s => { s.mesh.material = MAT_FLASH; });
}

function restoreOriginal(saves: MeshSave[]): void {
  saves.forEach(s => { s.mesh.material = s.orig; });
}

// ── Helpers collecte ──────────────────────────────────────────────────────────

function hasDirectMesh(o: THREE.Object3D): boolean {
  return o.children.some(c => (c as THREE.Mesh).isMesh);
}
function hasMesh(o: THREE.Object3D): boolean {
  if ((o as THREE.Mesh).isMesh) return true;
  return o.children.some(hasMesh);
}
function isLeafComponent(o: THREE.Object3D): boolean {
  if ((o as THREE.Mesh).isMesh) return true;
  if (o.userData?.animUnit) return true;
  if (!hasDirectMesh(o)) return false;
  return !o.children.some(c => !(c as THREE.Mesh).isMesh && hasMesh(c));
}
function isUtility(o: THREE.Object3D): boolean {
  return !!((o as any).isLight || (o as any).isCamera || (o as any).isHelper);
}
function depthFrom(o: THREE.Object3D, root: THREE.Object3D): number {
  let d = 0, cur: THREE.Object3D | null = o.parent;
  while (cur && cur !== root) { d++; cur = cur.parent; }
  return d;
}

const _bbox = new THREE.Box3();
const _size = new THREE.Vector3();

function hasBrickType(o: THREE.Object3D, type: string): boolean {
  if (o.userData?.brickType === type) return true;
  return o.children.some(c => hasBrickType(c, type));
}
function isCeilingLike(o: THREE.Object3D): boolean { return hasBrickType(o, 'ceiling'); }
function isGroundPlane(o: THREE.Object3D): boolean  { return o.userData?.brickType === 'ground'; }
function isFloorLike(o: THREE.Object3D): boolean {
  if (hasBrickType(o, 'floor')) return true;
  _bbox.setFromObject(o); _bbox.getSize(_size);
  if (_size.y >= 30 || _size.x < 200 || _size.z < 200) return false;
  return (_bbox.min.y + _bbox.max.y) / 2 < 50;
}
function isWallLike(o: THREE.Object3D): boolean { return hasBrickType(o, 'wall'); }
/** Tout objet large et plat (sol, herbe GrassRug 200×1.5×100, terrasse…) — exclure du wireframe. */
function isLargeFlat(o: THREE.Object3D): boolean {
  _bbox.setFromObject(o); _bbox.getSize(_size);
  return _size.x > 150 && _size.z > 60 && _size.y < 40;
}

function collectScene(scene: THREE.Scene) {
  // moveable  = équipements (layer 1) + mobilier (layer 2) → arrivent en premier
  // walls     = murs (brickType 'wall')                    → arrivent en dernier (1)
  // floor     = sols (brickType 'floor' ou heuristique)    → arrivent en dernier (2)
  // ceiling   = plafond (brickType 'ceiling')              → arrivent en dernier (3)
  const moveable: THREE.Object3D[] = [], walls: THREE.Object3D[] = [];
  const floor: THREE.Object3D[] = [], ceiling: THREE.Object3D[] = [];
  const picked = new Set<THREE.Object3D>();

  function visit(o: THREE.Object3D): void {
    if (!o.visible || isUtility(o) || isGroundPlane(o)) return;
    let cur: THREE.Object3D | null = o.parent;
    while (cur && cur !== scene) { if (picked.has(cur)) return; cur = cur.parent; }

    // Detect floor/ceiling meshes by brickType BEFORE the depth check.
    // These live at depth 1 (Floor returns a fragment with no wrapper group,
    // so its meshes are direct children of the scene root group) and would be
    // skipped by the depth >= 2 filter below.
    // Walls are NOT handled here: the Walls group (brickType 'wall', depth 1)
    // must recurse so that each wall mesh animates individually. Wall meshes
    // at depth 2 are classified via parentBrick below.
    const brick = o.userData?.brickType as string | undefined;
    if (brick && hasMesh(o)) {
      if      (brick === 'floor')   { picked.add(o); floor.push(o);   return; }
      else if (brick === 'ceiling') { picked.add(o); ceiling.push(o); return; }
    }

    const depth = depthFrom(o, scene);
    if (depth >= 2 && isLeafComponent(o)) {
      picked.add(o);
      // Also check parent brickType — wall meshes (depth 2) live inside the
      // Walls group (depth 1) which carries brickType 'wall' on the group.
      const parentBrick = o.parent?.userData?.brickType as string | undefined;
      if      (o.layers.isEnabled(1) || o.layers.isEnabled(2)) moveable.push(o);
      else if (parentBrick === 'ceiling' || isCeilingLike(o))   ceiling.push(o);
      else if (parentBrick === 'floor'   || isFloorLike(o))     floor.push(o);
      else if (parentBrick === 'wall'    || isWallLike(o))      walls.push(o);
      else                                                       moveable.push(o);
    } else {
      o.children.forEach(visit);
    }
  }
  scene.children.forEach(visit);
  return { moveable, walls, floor, ceiling };
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Pluie Matrix 3D ───────────────────────────────────────────────────────────
// Technique identique à thematrix.webexpt.com :
//  • Géométrie asterisk (3 plans croisés, visible depuis tous les angles)
//  • Animation 100 % GPU via uniform uTime — zéro mise à jour CPU par instance
//  • Même jeu de caractères katakana + chiffres + latin

const CHARS =
  'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピ' +
  'ウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペ' +
  'オォコソトノホモヨョロヲゴゾドボポヴッン' +
  '01234123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const N_CHARS = CHARS.length;

// Atlas : 8 cols, chars blancs sur noir (la couleur verte est dans le shader)
const ATLAS_COLS_R = 8;
const ATLAS_ROWS_R = Math.ceil(N_CHARS / ATLAS_COLS_R);
const CHAR_PIX_R   = 32;

// Colonnes
const N_COLS_R   = 60;
const COL_SCALE  = 7.5;  // 1 unité de géo = 7.5 cm scène → char ~4.5 cm large, ~7.5 cm/cell
const MIN_HEIGHT = 14;   // cells par colonne (traîne × 2)
const MAX_HEIGHT = 30;
const MIN_SPEED  = 0.2;  // uTime/s
const MAX_SPEED  = 0.8;

// Vertex shader — même logique que le site (pas de wrapping infini, scène fixe)
const SITE_VERT = /* glsl */`
  attribute float aSpeed;
  attribute float aTimeOffset;
  attribute float aHeight;

  varying vec2  vUv;
  varying float vHeight;
  varying float vSpeed;
  varying float vTimeOffset;
  varying vec3  vPos;

  void main() {
    vec3 transformed  = position;
    transformed.y    *= aHeight;
    vec4 wp           = instanceMatrix * vec4(transformed, 1.0);
    gl_Position       = projectionMatrix * viewMatrix * wp;
    vUv         = uv;
    vHeight     = aHeight;
    vSpeed      = aSpeed;
    vTimeOffset = aTimeOffset;
    vPos        = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  }
`;

// Fragment shader — copié du site, + uniform uFadeOut pour le fondu de fin
const SITE_FRAG = /* glsl */`
  uniform float     uTime;
  uniform float     uFadeOut;
  uniform sampler2D uTexture;
  uniform vec2      uGrid;
  uniform float     uTotalMapChars;

  varying vec2  vUv;
  varying float vHeight;
  varying float vSpeed;
  varying float vTimeOffset;
  varying vec3  vPos;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    float totalCells = vHeight;
    float currentY   = vUv.y * totalCells;
    float cellIndex  = floor(currentY);

    float timeStep = floor(uTime * 6.0);
    float rndChar  = random(vec2(cellIndex + vPos.x * 0.01, vPos.z * 0.01 + timeStep * 0.01));
    float charID   = floor(rndChar * uTotalMapChars);
    float col      = mod(charID, uGrid.x);
    float row      = floor(charID / uGrid.x);

    vec2 cellUV = fract(vec2(vUv.x, currentY));
    if (random(vec2(cellIndex, vPos.z)) > 0.6) cellUV.x = 1.0 - cellUV.x;  // miroir aléatoire

    vec2 atlasUV    = (vec2(col, row) + cellUV) / uGrid;
    vec4 tex        = texture2D(uTexture, atlasUV);
    float finalAlpha = smoothstep(0.1, 0.6, tex.r);

    // Position de la tête dans la colonne (cycle 0→1)
    float fallSpeed = vSpeed * 0.5;
    float time      = uTime * fallSpeed + vTimeOffset;
    float headPos   = 1.0 - fract(time);
    float dist      = vUv.y - headPos;
    if (dist < 0.0) dist += 1.0;

    float brightness = 0.0;
    if (dist < 0.65) {
      float fade = 1.0 - (dist / 0.65);
      brightness = pow(fade, 2.0);
    }
    if (dist < 0.03) brightness = 4.0;  // étincelle de tête

    vec3 finalColor = vec3(1.0, 0.05, 0.05);            // rouge CRT
    if (dist < 0.02) finalColor = vec3(1.0, 0.75, 0.75); // tête blanc-rouge

    if (finalAlpha < 0.01) discard;
    if (brightness  < 0.01) discard;

    gl_FragColor = vec4(finalColor * brightness * finalAlpha * uFadeOut, 1.0);
  }
`;

function createRain(scene: THREE.Scene, _camera: THREE.Camera) {
  // ── Atlas ──
  const cv = document.createElement('canvas');
  cv.width  = ATLAS_COLS_R * CHAR_PIX_R;
  cv.height = ATLAS_ROWS_R * CHAR_PIX_R;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle    = '#000000';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.font         = `bold ${Math.round(CHAR_PIX_R * 0.8)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#FFFFFF';  // blanc — couleur dans le shader
  Array.from(CHARS).forEach((ch, i) => {
    const c = i % ATLAS_COLS_R, r = Math.floor(i / ATLAS_COLS_R);
    ctx.fillText(ch, (c + 0.5) * CHAR_PIX_R, (r + 0.5) * CHAR_PIX_R);
  });
  const atlas = new THREE.CanvasTexture(cv);
  atlas.minFilter      = THREE.LinearMipMapLinearFilter;
  atlas.magFilter      = THREE.NearestFilter;
  atlas.generateMipmaps = true;

  // ── Géométrie asterisk (3 plans croisés à 60°) ──
  const pGeom = new THREE.PlaneGeometry(0.6, 1);
  const geomArr: THREE.BufferGeometry[] = [];
  for (let r = 0; r < 3; r++) {
    const g = pGeom.clone();
    g.rotateY((Math.PI / 3) * r);
    geomArr.push(g);
  }
  const nv       = geomArr[0].attributes.position.count * 3;
  const totalPos = new Float32Array(nv * 3);
  const totalUv  = new Float32Array(nv * 2);
  const totalInd: number[] = [];
  let vOff = 0;
  geomArr.forEach(g => {
    totalPos.set(g.attributes.position.array as Float32Array, vOff * 3);
    totalUv.set(g.attributes.uv.array as Float32Array, vOff * 2);
    const idx = g.index!.array;
    for (let k = 0; k < idx.length; k++) totalInd.push((idx[k] as number) + vOff);
    vOff += g.attributes.position.count;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(totalPos, 3));
  geo.setAttribute('uv',       new THREE.BufferAttribute(totalUv,  2));
  geo.setIndex(totalInd);

  // ── Matériau ──
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:          { value: 0 },
      uFadeOut:       { value: 1 },
      uTexture:       { value: atlas },
      uGrid:          { value: new THREE.Vector2(ATLAS_COLS_R, ATLAS_ROWS_R) },
      uTotalMapChars: { value: N_CHARS },
    },
    vertexShader:   SITE_VERT,
    fragmentShader: SITE_FRAG,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
    side:           THREE.DoubleSide,
  });

  // ── InstancedMesh ──
  const instancedMesh = new THREE.InstancedMesh(geo, mat, N_COLS_R);
  instancedMesh.frustumCulled = false;

  const dummy     = new THREE.Object3D();
  const speedArr  = new Float32Array(N_COLS_R);
  const offsetArr = new Float32Array(N_COLS_R);
  const heightArr = new Float32Array(N_COLS_R);

  for (let i = 0; i < N_COLS_R; i++) {
    // Répartit les colonnes dans le volume de la pièce + marge extérieure
    const rangeX = ROOM_W * 5 + 600;
    const rangeZ = ROOM_D * 5 + 600;
    const x = ROOM_W / 2 - rangeX / 2 + Math.random() * rangeX;
    const z = ROOM_D / 2 - rangeZ / 2 + Math.random() * rangeZ;
    const y = WALL_H / 2 + (Math.random() - 0.5) * WALL_H;

    dummy.position.set(x, y, z);
    dummy.scale.setScalar(COL_SCALE);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);

    speedArr[i]  = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    offsetArr[i] = Math.random() * 10;
    heightArr[i] = MIN_HEIGHT + Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT + 1));
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.geometry.setAttribute('aSpeed',      new THREE.InstancedBufferAttribute(speedArr,  1));
  instancedMesh.geometry.setAttribute('aTimeOffset', new THREE.InstancedBufferAttribute(offsetArr, 1));
  instancedMesh.geometry.setAttribute('aHeight',     new THREE.InstancedBufferAttribute(heightArr, 1));

  scene.add(instancedMesh);

  let timeAcc = 0;

  function update(dt: number, fadeOut: number): void {
    timeAcc += dt;
    mat.uniforms.uTime.value    = timeAcc;
    mat.uniforms.uFadeOut.value = fadeOut;
  }

  function dispose(): void {
    scene.remove(instancedMesh);
    geo.dispose();
    mat.dispose();
    atlas.dispose();
  }

  return { update, dispose };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function BuildAnimation4({ onFinish, onDuration }: { onFinish: () => void; onDuration?: (ms: number) => void }) {
  const { scene, camera, invalidate } = useThree();

  useEffect(() => {
    const { moveable, walls, floor, ceiling } = collectScene(scene as unknown as THREE.Scene);

    // Ordre : mobilier en premier (effet "fourmilière"), puis murs, sols et plafond en dernier
    const allOrdered = [...shuffle(moveable), ...walls, ...floor, ...ceiling];
    const floorSet   = new Set(floor);

    const objects: AnimObj[] = allOrdered.map((obj, i) => {
      const meshSaves: MeshSave[] = [];
      collectMeshes(obj, meshSaves);
      if (!floorSet.has(obj) && !isLargeFlat(obj)) applyMatrix(meshSaves);  // wireframe vert — sauf sols et grandes surfaces plates
      return {
        obj,
        origY:        obj.position.y,
        startTime:    i * STAGGER_MS,
        duration:     FALL_MS_MIN + Math.random() * (FALL_MS_MAX - FALL_MS_MIN),
        fromBelow:    floorSet.has(obj),
        meshSaves,
        materialized: false,
        flashEnd:     0,
      };
    });

    const totalEnd = objects.length > 0
      ? objects[objects.length - 1].startTime + objects[objects.length - 1].duration + 100
      : 1000;

    onDuration?.(totalEnd);

    objects.forEach(a => {
      a.obj.position.y = a.fromBelow ? a.origY - DROP_HEIGHT : a.origY + DROP_HEIGHT;
    });

    // Masquer le sol extérieur (brickType: 'ground') pendant l'animation
    const groundMeshes: THREE.Object3D[] = [];
    (scene as unknown as THREE.Scene).traverse(o => {
      if (o.userData?.brickType === 'ground') groundMeshes.push(o);
    });
    groundMeshes.forEach(o => { o.visible = false; });

    // Supprime le brouillard pendant l'animation (fond bleu original conservé)
    const s3 = scene as unknown as THREE.Scene;
    const origFog = s3.fog;
    s3.fog = null;

    const rain = createRain(s3, camera);
    invalidate();

    let start: number | null = null;
    let prev:  number | null = null;
    let raf: number;

    function tick(now: number) {
      if (start === null) start = now;
      if (prev  === null) prev  = now;
      const elapsed = now - start;
      const dt = (now - prev) / 1000;
      prev = now;

      objects.forEach(a => {
        const raw = (elapsed - a.startTime) / a.duration;
        if (raw <= 0) return;
        const t = Math.min(raw, 1);

        // Position
        const offset = DROP_HEIGHT * (1 - easeOutCubic(t));
        a.obj.position.y = a.fromBelow ? a.origY - offset : a.origY + offset;

        // Matérialisation
        if (!a.materialized && t >= MATERIALIZE_T) {
          a.materialized = true;
          a.flashEnd = now + FLASH_DURATION;
          applyFlash(a.meshSaves);
        }
        if (a.materialized && now < a.flashEnd) {
          const ft = 1 - (a.flashEnd - now) / FLASH_DURATION;
          MAT_FLASH.opacity = 1 - ft;   // flash qui s'estompe
        }
        if (a.materialized && now >= a.flashEnd) {
          restoreOriginal(a.meshSaves);
        }
      });

      // Pluie — s'estompe dans les derniers 15%
      const fadeOut = elapsed < totalEnd * 0.85 ? 1 : Math.max(0, (totalEnd - elapsed) / (totalEnd * 0.15));
      rain.update(dt, fadeOut);

      invalidate();

      if (elapsed < totalEnd) {
        raf = requestAnimationFrame(tick);
      } else {
        objects.forEach(a => {
          a.obj.position.y = a.origY;
          restoreOriginal(a.meshSaves);
        });
        rain.dispose();
        s3.fog = origFog;
        groundMeshes.forEach(o => { o.visible = true; });
        invalidate();
        onFinish();
      }
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      objects.forEach(a => {
        a.obj.position.y = a.origY;
        restoreOriginal(a.meshSaves);
      });
      rain.dispose();
      s3.fog = origFog;
      groundMeshes.forEach(o => { o.visible = true; });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
