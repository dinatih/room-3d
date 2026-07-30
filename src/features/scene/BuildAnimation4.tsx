/**
 * BuildAnimation4.tsx — Effet Matrix.
 *
 * Même logique que BuildAnimation3 v3 (mobilier aléatoire → murs → sol
 * remonte → plafond en dernier), avec en plus :
 *  • Wireframe vert (#00ff41) pendant la chute, matérialisation à 80 %.
 *  • Pluie Matrix : InstancedMesh de colonnes de caractères en shader GPU.
 *
 * Algorithme de collecte (v3) — identique à BuildAnimation3 :
 *   Visite depth-first, cible les groupes avec mesh direct à depth >= 2
 *   ou marqués animUnit. Travaille en coordonnées LOCALES corrigées par
 *   le facteur worldToLocalY pour que 1 unité monde = mouvement correct.
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from '@config';

// ── Constantes ────────────────────────────────────────────────────────────────

const DROP_HEIGHT      = 2000;
const STAGGER_MS       = 110;
const WALL_PHASE_MS    = 3000;
const WALL_STAGGER_MIN = 12;
const WALL_STAGGER_MAX = 110;
const FALL_MS_MIN      = 600;
const FALL_MS_MAX      = 950;
const MATERIALIZE_T    = 0.80;
const FLASH_DURATION   = 180;

const MAT_GREEN = new THREE.MeshBasicMaterial({
  color:     0x00ff41,
  wireframe: true,
});
const MAT_FLASH = new THREE.MeshBasicMaterial({
  color:       0x88ffbb,
  wireframe:   false,
  transparent: true,
  opacity:     1,
});

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MeshSave = { mesh: THREE.Mesh; orig: THREE.Material | THREE.Material[] };

type AnimObj = {
  obj:          THREE.Object3D;
  origLocalY:   number;
  worldToLocalY: number;
  startTime:    number;
  duration:     number;
  fromBelow:    boolean;
  meshSaves:    MeshSave[];
  materialized: boolean;
  flashEnd:     number;
};

// ── Matériaux ─────────────────────────────────────────────────────────────────

function collectMeshes(o: THREE.Object3D, out: MeshSave[]): void {
  if ((o as THREE.Mesh).isMesh) {
    out.push({ mesh: o as THREE.Mesh, orig: (o as THREE.Mesh).material });
  }
  o.children.forEach((c) => collectMeshes(c, out));
}
function applyMatrix(saves: MeshSave[]): void {
  saves.forEach((s) => { s.mesh.material = MAT_GREEN; });
}
function applyFlash(saves: MeshSave[]): void {
  MAT_FLASH.opacity = 1;
  saves.forEach((s) => { s.mesh.material = MAT_FLASH; });
}
function restoreOriginal(saves: MeshSave[]): void {
  saves.forEach((s) => { s.mesh.material = s.orig; });
}

// ── Utilitaires scène ─────────────────────────────────────────────────────────

function isUtility(o: THREE.Object3D): boolean {
  return !!((o as any).isLight || (o as any).isCamera || (o as any).isHelper);
}

function hasMesh(o: THREE.Object3D): boolean {
  if ((o as THREE.Mesh).isMesh) return true;
  return o.children.some(hasMesh);
}

/** Surface large et plate — on ne lui applique pas le wireframe vert. */
function isLargeFlat(o: THREE.Object3D): boolean {
  const bb = new THREE.Box3().setFromObject(o);
  const s  = new THREE.Vector3();
  bb.getSize(s);
  return s.x > 150 && s.z > 60 && s.y < 40;
}

/** Retourne le facteur de conversion monde→local sur l'axe Y pour un objet. */
function getWorldToLocalYFactor(o: THREE.Object3D): number {
  if (!o.parent) return 1;
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(0, 1, 0);
  o.parent.worldToLocal(p0);
  o.parent.worldToLocal(p1);
  const factor = Math.abs(p1.y - p0.y);
  return factor > 0.0001 ? factor : 1;
}

// ── Collecte principale ───────────────────────────────────────────────────────

// ── Helpers merge temporaire ─────────────────────────────────────────────────

function unmergeScene(scene: THREE.Scene): () => void {
  const toHide:    THREE.Mesh[] = [];
  const toRestore: THREE.Mesh[] = [];

  scene.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (m.userData.isMergedStatic) {
      m.visible = false;
      toHide.push(m);
    } else if (m.userData.wasMerged) {
      m.visible = true;
      toRestore.push(m);
    }
  });

  return () => {
    toHide.forEach(m    => { m.visible = true;  });
    toRestore.forEach(m => { m.visible = false; });
  };
}

// ── Collecte principale ───────────────────────────────────────────────────────

function collectScene(scene: THREE.Scene): {
  moveable: THREE.Object3D[];
  walls:    THREE.Object3D[];
  floor:    THREE.Object3D[];
  ceiling:  THREE.Object3D[];
} {
  const moveable: THREE.Object3D[] = [];
  const walls:    THREE.Object3D[] = [];
  const floor:    THREE.Object3D[] = [];
  const ceiling:  THREE.Object3D[] = [];
  const picked = new Set<THREE.Object3D>();

  function isPureWrapper(o: THREE.Object3D): boolean {
    if ((o as THREE.Mesh).isMesh) return false;
    return !o.children.some((c) => (c as THREE.Mesh).isMesh);
  }

  function visit(o: THREE.Object3D, depth: number): void {
    if (!o.visible || isUtility(o)) return;
    if (o.userData?.noAnim) return;

    // Si on croise un MergedStaticGroup (ou source/destination), toujours descendre dans les enfants
    if (o.userData?.isMergedSource || o.userData?.isMergedStatic || o.name?.startsWith('merged-')) {
      o.children.forEach((c) => visit(c, depth + 1));
      return;
    }

    // Nœud explicitement marqué comme unité d'animation
    if (o.userData?.animUnit && hasMesh(o) && !picked.has(o)) {
      classify(o);
      return;
    }

    // Chaque mesh individuel est une unité d'animation distincte
    if ((o as THREE.Mesh).isMesh && !picked.has(o)) {
      classify(o);
      return;
    }

    // Descendre dans tous les wrappers et groupes conteneurs
    if (isPureWrapper(o) || depth < 2 || o.children.length > 0) {
      o.children.forEach((c) => visit(c, depth + 1));
    }
  }

  function classify(o: THREE.Object3D): void {
    if (picked.has(o)) return;
    picked.add(o);

    let brickType: string | undefined = o.userData?.brickType as string | undefined;
    if (!brickType) {
      o.traverse((c) => {
        if (!brickType && c.userData?.brickType) brickType = c.userData.brickType as string;
      });
    }
    if (!brickType && o.parent?.userData?.brickType) {
      brickType = o.parent.userData.brickType as string;
    }

    if      (brickType === 'ceiling')  ceiling.push(o);
    else if (brickType === 'floor')    floor.push(o);
    else if (brickType === 'wall')     walls.push(o);
    else if (brickType === 'ground')   { /* sol extérieur — ignorer */ }
    else if (brickType === 'skirting') { /* plinthes — ignorer */ }
    else                               moveable.push(o);
  }

  scene.children.forEach((child) => visit(child, 0));
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

const CHARS =
  'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピ' +
  'ウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペ' +
  'オォコソトノホモヨョロヲゴゾドボポヴッン' +
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const N_CHARS = CHARS.length;

const ATLAS_COLS = 8;
const ATLAS_ROWS = Math.ceil(N_CHARS / ATLAS_COLS);
const CHAR_PIX   = 32;

const N_COLS    = 60;
const COL_SCALE = 7.5;
const MIN_H     = 14;
const MAX_H     = 30;
const MIN_SPD   = 0.2;
const MAX_SPD   = 0.8;

const VERT = /* glsl */`
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

const FRAG = /* glsl */`
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
    if (random(vec2(cellIndex, vPos.z)) > 0.6) cellUV.x = 1.0 - cellUV.x;

    vec2 atlasUV     = (vec2(col, row) + cellUV) / uGrid;
    vec4 tex         = texture2D(uTexture, atlasUV);
    float finalAlpha = smoothstep(0.1, 0.6, tex.r);

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
    if (dist < 0.03) brightness = 4.0;

    vec3 finalColor = vec3(0.0, 1.0, 0.25);
    if (dist < 0.02) finalColor = vec3(0.75, 1.0, 0.85);

    if (finalAlpha < 0.01) discard;
    if (brightness  < 0.01) discard;

    gl_FragColor = vec4(finalColor * brightness * finalAlpha * uFadeOut, 1.0);
  }
`;

function createRain(scene: THREE.Scene) {
  const cv = document.createElement('canvas');
  cv.width  = ATLAS_COLS * CHAR_PIX;
  cv.height = ATLAS_ROWS * CHAR_PIX;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle    = '#000000';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.font         = `bold ${Math.round(CHAR_PIX * 0.8)}px monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#FFFFFF';
  Array.from(CHARS).forEach((ch, i) => {
    const c = i % ATLAS_COLS, r = Math.floor(i / ATLAS_COLS);
    ctx.fillText(ch, (c + 0.5) * CHAR_PIX, (r + 0.5) * CHAR_PIX);
  });
  const atlas = new THREE.CanvasTexture(cv);
  atlas.minFilter       = THREE.LinearMipMapLinearFilter;
  atlas.magFilter       = THREE.NearestFilter;
  atlas.generateMipmaps = true;

  // Géométrie asterisk (3 plans croisés à 60°)
  const pGeom = new THREE.PlaneGeometry(0.6, 1);
  const geomArr = [0, 1, 2].map((r) => {
    const g = pGeom.clone();
    g.rotateY((Math.PI / 3) * r);
    return g;
  });
  const nvPerPlan  = geomArr[0].attributes.position.count;
  const totalVerts = nvPerPlan * 3;
  const totalPos   = new Float32Array(totalVerts * 3);
  const totalUv    = new Float32Array(totalVerts * 2);
  const totalInd: number[] = [];
  let vOff = 0;
  geomArr.forEach((g) => {
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

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:          { value: 0 },
      uFadeOut:       { value: 1 },
      uTexture:       { value: atlas },
      uGrid:          { value: new THREE.Vector2(ATLAS_COLS, ATLAS_ROWS) },
      uTotalMapChars: { value: N_CHARS },
    },
    vertexShader:   VERT,
    fragmentShader: FRAG,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
    side:           THREE.DoubleSide,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, N_COLS);
  mesh.frustumCulled = false;

  const dummy     = new THREE.Object3D();
  const speedArr  = new Float32Array(N_COLS);
  const offsetArr = new Float32Array(N_COLS);
  const heightArr = new Float32Array(N_COLS);

  for (let i = 0; i < N_COLS; i++) {
    const rangeX = ROOM_W * 5 + 600;
    const rangeZ = ROOM_D * 5 + 600;
    const x = ROOM_W / 2 - rangeX / 2 + Math.random() * rangeX;
    const z = ROOM_D / 2 - rangeZ / 2 + Math.random() * rangeZ;
    const y = WALL_H / 2 + (Math.random() - 0.5) * WALL_H;

    dummy.position.set(x, y, z);
    dummy.scale.setScalar(COL_SCALE);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    speedArr[i]  = MIN_SPD + Math.random() * (MAX_SPD - MIN_SPD);
    offsetArr[i] = Math.random() * 10;
    heightArr[i] = MIN_H + Math.floor(Math.random() * (MAX_H - MIN_H + 1));
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.geometry.setAttribute('aSpeed',      new THREE.InstancedBufferAttribute(speedArr,  1));
  mesh.geometry.setAttribute('aTimeOffset', new THREE.InstancedBufferAttribute(offsetArr, 1));
  mesh.geometry.setAttribute('aHeight',     new THREE.InstancedBufferAttribute(heightArr, 1));

  scene.add(mesh);

  let timeAcc = 0;

  function update(dt: number, fadeOut: number): void {
    timeAcc += dt;
    mat.uniforms.uTime.value    = timeAcc;
    mat.uniforms.uFadeOut.value = fadeOut;
  }

  function dispose(): void {
    scene.remove(mesh);
    geo.dispose();
    mat.dispose();
    atlas.dispose();
  }

  return { update, dispose };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function BuildAnimation4({
  onFinish,
  onDuration,
}: {
  onFinish: () => void;
  onDuration?: (ms: number) => void;
}) {
  const { scene, invalidate } = useThree();

  useEffect(() => {
    const s3 = scene as unknown as THREE.Scene;

    // UNMERGE : restaurer les meshes originaux pour l'animation individuelle
    const remerge = unmergeScene(s3);

    // Mettre à jour toutes les matrices monde avant la collecte
    s3.updateMatrixWorld(true);

    const { moveable, walls, floor, ceiling } = collectScene(s3);

    const wallStagger =
      walls.length > 0
        ? Math.min(WALL_STAGGER_MAX, Math.max(WALL_STAGGER_MIN, WALL_PHASE_MS / walls.length))
        : STAGGER_MS;

    const floorSet = new Set(floor);
    let cursor = 0;

    const scheduled: Array<{ obj: THREE.Object3D; startTime: number }> = [];
    walls.forEach((obj)           => { scheduled.push({ obj, startTime: cursor }); cursor += wallStagger; });
    shuffle(moveable).forEach((obj) => { scheduled.push({ obj, startTime: cursor }); cursor += STAGGER_MS; });
    floor.forEach((obj)           => { scheduled.push({ obj, startTime: cursor }); cursor += STAGGER_MS; });
    ceiling.forEach((obj)         => { scheduled.push({ obj, startTime: cursor }); cursor += STAGGER_MS; });

    const objects: AnimObj[] = scheduled.map(({ obj, startTime }) => {
      const meshSaves: MeshSave[] = [];
      collectMeshes(obj, meshSaves);
      if (!floorSet.has(obj) && !isLargeFlat(obj)) {
        applyMatrix(meshSaves);
      }

      const worldToLocalY = getWorldToLocalYFactor(obj);
      return {
        obj,
        origLocalY:   obj.position.y,
        worldToLocalY,
        startTime,
        duration:     FALL_MS_MIN + Math.random() * (FALL_MS_MAX - FALL_MS_MIN),
        fromBelow:    floorSet.has(obj),
        meshSaves,
        materialized: false,
        flashEnd:     0,
      };
    });

    const totalEnd =
      objects.length > 0
        ? objects[objects.length - 1].startTime +
          objects[objects.length - 1].duration +
          200
        : 1000;

    onDuration?.(totalEnd);

    // Déplacement initial
    objects.forEach((a) => {
      const localDelta = DROP_HEIGHT * a.worldToLocalY;
      a.obj.position.y = a.fromBelow
        ? a.origLocalY - localDelta
        : a.origLocalY + localDelta;
    });

    // Masquer le sol extérieur
    const groundMeshes: THREE.Object3D[] = [];
    s3.traverse((o) => {
      if (o.userData?.brickType === 'ground') groundMeshes.push(o);
    });
    groundMeshes.forEach((o) => { o.visible = false; });

    // Retirer le brouillard
    const origFog = s3.fog;
    s3.fog = null;

    const rain = createRain(s3);
    invalidate();

    let start: number | null = null;
    let prev:  number | null = null;
    let raf: number;

    function tick(now: number) {
      if (start === null) start = now;
      if (prev  === null) prev  = now;
      const elapsed = now - start;
      const dt      = (now - prev) / 1000;
      prev = now;

      objects.forEach((a) => {
        const raw = (elapsed - a.startTime) / a.duration;
        if (raw <= 0) return;
        const t          = Math.min(raw, 1);
        const localDelta = DROP_HEIGHT * a.worldToLocalY * (1 - easeOutCubic(t));
        a.obj.position.y = a.fromBelow
          ? a.origLocalY - localDelta
          : a.origLocalY + localDelta;

        // Matérialisation
        if (!a.materialized && t >= MATERIALIZE_T) {
          a.materialized = true;
          a.flashEnd     = now + FLASH_DURATION;
          applyFlash(a.meshSaves);
        }
        if (a.materialized && now < a.flashEnd) {
          const ft = 1 - (a.flashEnd - now) / FLASH_DURATION;
          MAT_FLASH.opacity = 1 - ft;
        }
        if (a.materialized && now >= a.flashEnd) {
          restoreOriginal(a.meshSaves);
        }
      });

      // Pluie — fondu dans les 15 % finaux
      const fadeOut =
        elapsed < totalEnd * 0.85
          ? 1
          : Math.max(0, (totalEnd - elapsed) / (totalEnd * 0.15));
      rain.update(dt, fadeOut);

      invalidate();

      if (elapsed < totalEnd) {
        raf = requestAnimationFrame(tick);
      } else {
        objects.forEach((a) => {
          a.obj.position.y = a.origLocalY;
          restoreOriginal(a.meshSaves);
        });
        rain.dispose();
        remerge();
        s3.fog = origFog;
        groundMeshes.forEach((o) => { o.visible = true; });
        invalidate();
        onFinish();
      }
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      objects.forEach((a) => {
        a.obj.position.y = a.origLocalY;
        restoreOriginal(a.meshSaves);
      });
      rain.dispose();
      remerge();
      s3.fog = origFog;
      groundMeshes.forEach((o) => { o.visible = true; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
