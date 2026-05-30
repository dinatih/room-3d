/**
 * Walker.tsx — Lara Croft 2026 rigged, suit le mode walk.
 * Port de js/decor/walkingMan.js + js/decor/walkers/lara2026.js.
 *
 * - Suit la caméra en mode walk (position X/Z, orienté dans la direction de marche)
 * - Animation de marche custom (clip quaternion sur les bones)
 * - Cycling de couleur des cheveux pendant la marche
 */
import { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';
import { LAYER_WALKER_DETAIL } from '@config';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';


// Three.js PropertyBinding ne supporte pas les espaces dans les noms de bones.
// Le GLB 2026 utilise des espaces → on les normalise en underscores au chargement.
function normalizeBoneNames(root: THREE.Object3D): void {
  root.traverse(c => {
    if ((c as THREE.Bone).isBone) c.name = c.name.replace(/ /g, '_');
  });
}

// ── V2 walk clip + Verlet hair physics (port de lara_debug.html) ──────────────
//
// Convention de phase (t=0 baseline) :
//   jambe gauche BACK (toe-off), jambe droite FORWARD (heel-strike),
//   bras gauche FORWARD (contre-balance).
// Keyframes à t = 0, T/4, T/2, 3T/4, T (loop).
//
// Composition de la rotation par track :
//   - space 'local'  (défaut) : q = rest * offset * delta   (multiplication droite)
//   - space 'parent'          : q = delta * offset * rest   (multiplication gauche)
// Le parent-space est nécessaire pour les épaules dont les rest matrices sont
// twistées (sinon le bras swing en latéral type "jumping-jack" au lieu d'avant-arrière).

type WalkAxis  = 'X' | 'Y' | 'Z';
type WalkSpace = 'local' | 'parent';

interface WalkTrack {
  bone:        string;
  axis:        WalkAxis;
  keys:        number[];   // 5 angles en degrés
  space?:      WalkSpace;
  offsetAxis?: WalkAxis;
  offsetDeg?:  number;
}

const WALK_PERIOD = 0.7;   // s — ~86 strides/min
const HAIR_REGEX     = /^head_hair_ponytail_/;
const HAIR_GRAVITY   = 980; // cm/s² (modèle scalé en cm, 170 unités = 170 cm)
const HAIR_STIFFNESS = 0.03;
const HAIR_DAMPING   = 0.08;

const V2_TRACKS: WalkTrack[] = [
  // Jambes — swing asymétrique (plus avant, moins arrière)
  { bone: 'leg_left_thigh_04',  axis: 'X', keys: [+24,   0, -22,   0, +24] },
  { bone: 'leg_right_thigh_08', axis: 'X', keys: [-22,   0, +24,   0, -22] },

  // Genoux — extension à heel-strike, flexion max à mid-swing
  { bone: 'leg_left_knee_05',   axis: 'X', keys: [+30, +65,  +4, +14, +30] },
  { bone: 'leg_right_knee_09',  axis: 'X', keys: [ +4, +14, +30, +65,  +4] },

  // Chevilles — dorsiflex à heel-strike, plantarflex à toe-off
  { bone: 'leg_left_ankle_06',  axis: 'X', keys: [+18,  +8, -14,  -4, +18] },
  { bone: 'leg_right_ankle_010',axis: 'X', keys: [-14,  -4, +18,  +8, -14] },

  // Bras — parent-space pour contourner les rest matrices twistées
  // Offset rotZ(±80°) parent → bras tombe le long du corps avec ~10° d'abduction
  // Swing rotX(±30°) parent → balancement avant-arrière dans le plan YZ
  { bone: 'arm_left_shoulder_2_014',  space: 'parent',
    axis: 'X', keys: [+30, 0, -30, 0, +30],
    offsetAxis: 'Z', offsetDeg: -80 },
  { bone: 'arm_right_shoulder_2_033', space: 'parent',
    axis: 'X', keys: [-30, 0, +30, 0, -30],
    offsetAxis: 'Z', offsetDeg:  80 },

  // Coudes — flex baseline 15°, oscille ±7°
  { bone: 'arm_left_elbow_015',  axis: 'X', keys: [+22, +15,  +8, +15, +22] },
  { bone: 'arm_right_elbow_034', axis: 'X', keys: [ +8, +15, +22, +15,  +8] },

  // Tronc — twist vertical contre-rotation
  { bone: 'spine_lower_012',     axis: 'Z', keys: [+4,   0, -4,   0, +4] },
  { bone: 'spine_upper_013',     axis: 'Z', keys: [-2,   0, +2,   0, -2] },
  { bone: 'head_neck_lower_051', axis: 'Z', keys: [-1,   0, +1,   0, -1] },
  // Pas de tracks ponytail : la physique Verlet pilote ces bones.
];

function quatAxisDeg(axis: WalkAxis, deg: number): THREE.Quaternion {
  const r = (deg * Math.PI) / 180 / 2;
  const s = Math.sin(r), c = Math.cos(r);
  if (axis === 'X') return new THREE.Quaternion(s, 0, 0, c);
  if (axis === 'Y') return new THREE.Quaternion(0, s, 0, c);
  return new THREE.Quaternion(0, 0, s, c);
}

function findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  root.traverse(c => { if ((c as THREE.Bone).isBone && c.name === name && !found) found = c as THREE.Bone; });
  return found;
}

// Cache la rest quaternion sur chaque bone (lue au build du clip et de la chaîne hair).
function cacheRestQuats(root: THREE.Object3D): void {
  root.traverse(c => {
    if ((c as THREE.Bone).isBone) {
      (c as THREE.Bone).userData.restQuat = (c as THREE.Bone).quaternion.clone();
    }
  });
}

function buildWalkClip(root: THREE.Object3D): THREE.AnimationClip {
  const T = WALK_PERIOD;
  const times = [0, T * 0.25, T * 0.5, T * 0.75, T];
  const clipTracks: THREE.KeyframeTrack[] = [];

  for (const t of V2_TRACKS) {
    if (HAIR_REGEX.test(t.bone)) continue; // hair piloté par Verlet
    const bone = findBone(root, t.bone);
    if (!bone) continue;
    const rest: THREE.Quaternion = (bone.userData.restQuat as THREE.Quaternion | undefined)?.clone()
      ?? bone.quaternion.clone();
    const space  = t.space ?? 'local';
    const offset = (t.offsetAxis != null && t.offsetDeg != null)
      ? quatAxisDeg(t.offsetAxis, t.offsetDeg)
      : null;

    let base: THREE.Quaternion;
    if (space === 'parent') base = offset ? offset.clone().multiply(rest) : rest.clone();
    else                    base = offset ? rest.clone().multiply(offset) : rest.clone();

    const flat: number[] = [];
    for (const deg of t.keys) {
      const delta = quatAxisDeg(t.axis, deg);
      const q = (space === 'parent')
        ? delta.clone().multiply(base)
        : base.clone().multiply(delta);
      flat.push(q.x, q.y, q.z, q.w);
    }
    clipTracks.push(new THREE.QuaternionKeyframeTrack(t.bone + '.quaternion', times, flat));
  }
  return new THREE.AnimationClip('walk-lara2026-v2', T, clipTracks);
}

// ── Verlet hair physics (chain ponytail) ──────────────────────────────────────

interface HairNode {
  bone:        THREE.Bone;
  restQuat:    THREE.Quaternion;
  axis:        THREE.Vector3;   // axe local bone→tip (direction de l'os enfant)
  worldLength: number;          // longueur tip en unités monde (scale appliqué)
  tipWorld:    THREE.Vector3;
  tipPrev:     THREE.Vector3;
}

function initHairChain(root: THREE.Object3D): HairNode[] {
  const bones: THREE.Bone[] = [];
  root.traverse(c => {
    if ((c as THREE.Bone).isBone && HAIR_REGEX.test(c.name)) bones.push(c as THREE.Bone);
  });
  root.updateMatrixWorld(true);

  const chain: HairNode[] = [];
  for (const bone of bones) {
    let axis = new THREE.Vector3(0, 1, 0);
    let length = 0.1;
    const child = bone.children.find(x => (x as THREE.Bone).isBone && HAIR_REGEX.test(x.name)) as THREE.Bone | undefined;
    if (child && child.position.lengthSq() > 1e-8) {
      length = child.position.length();
      axis   = child.position.clone().normalize();
    }
    const jointWorld  = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
    const worldScale  = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
    const worldLength = length * worldScale.x;
    const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();
    const tipWorld    = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);
    chain.push({
      bone,
      restQuat:    (bone.userData.restQuat as THREE.Quaternion | undefined)?.clone() ?? bone.quaternion.clone(),
      axis,
      worldLength,
      tipWorld:    tipWorld.clone(),
      tipPrev:     tipWorld.clone(),
    });
  }
  return chain;
}

const _hG          = new THREE.Vector3();
const _hJointWorld = new THREE.Vector3();
const _hVelocity   = new THREE.Vector3();
const _hNext       = new THREE.Vector3();
const _hDir        = new THREE.Vector3();
const _hRestDir    = new THREE.Vector3();
const _hRestTip    = new THREE.Vector3();
const _hQParent    = new THREE.Quaternion();
const _hQParentInv = new THREE.Quaternion();
const _hQTarget    = new THREE.Quaternion();

function updateHairPhysics(chain: HairNode[], dtIn: number): void {
  const dt = dtIn > 0.05 ? 0.05 : dtIn; // clamp pour les frames longues (tab hidden)
  _hG.set(0, -HAIR_GRAVITY, 0);
  for (const node of chain) {
    const { bone, restQuat, axis, worldLength } = node;
    const parent = bone.parent as THREE.Object3D | null;
    if (!parent) continue;
    parent.updateMatrixWorld();
    bone.updateMatrixWorld();

    _hJointWorld.setFromMatrixPosition(bone.matrixWorld);

    // Verlet : next = tip + vel*(1-damping) + g*dt²
    _hVelocity.subVectors(node.tipWorld, node.tipPrev).multiplyScalar(1 - HAIR_DAMPING);
    _hNext.copy(node.tipWorld).add(_hVelocity).addScaledVector(_hG, dt * dt);

    // Rest tip en monde (axis tourné par restQuat puis worldQuat du parent)
    parent.getWorldQuaternion(_hQParent);
    _hRestDir.copy(axis).applyQuaternion(restQuat).applyQuaternion(_hQParent);
    _hRestTip.copy(_hJointWorld).addScaledVector(_hRestDir, worldLength);

    // Tire le tip vers le rest tip (raideur)
    _hNext.lerp(_hRestTip, HAIR_STIFFNESS);

    // Contrainte de longueur — projeter sur la sphère de rayon worldLength
    _hDir.subVectors(_hNext, _hJointWorld);
    const len = _hDir.length();
    if (len < 1e-6) continue;
    _hDir.multiplyScalar(worldLength / len);
    node.tipPrev.copy(node.tipWorld);
    node.tipWorld.copy(_hJointWorld).add(_hDir);

    // Drive bone.quaternion : en frame parent-local, rotation axis → dir
    _hQParentInv.copy(_hQParent).invert();
    _hDir.normalize().applyQuaternion(_hQParentInv);
    _hQTarget.setFromUnitVectors(axis, _hDir);
    bone.quaternion.copy(_hQTarget);
  }
}

// ── Couleurs cheveux (créées une fois) ────────────────────────────────────────

const HEAD_BONE = 'head_neck_upper_052';

// Liste partagée des meshes du Walker principal (debug : WalkerMeshDebug panel).
export const walkerMeshList: THREE.Mesh[] = [];

// Masqués depuis main caméra en FPS, mais TOUJOURS visibles dans miroirs
// (via LAYER_WALKER_DETAIL inclus dans mirror.camera.layers.mask).
// Object_95 = lunettes, Object_106 = globes oculaires + bouche interne,
// Object_107 = peau visage (lèvres, narines, paupières — contours).
const FPS_LAYER_HIDE = new Set(['Object_95', 'Object_106', 'Object_107']);

// Toujours masqués (jamais affichés, même en miroir).
// Object_117 = lentille noire devant globes, Object_118 = cils.
const ALWAYS_HIDE_NAMES = new Set(['Object_117', 'Object_118']);

function collectFpsHide(root: THREE.Object3D): THREE.Object3D[] {
  const list: THREE.Object3D[] = [];
  root.traverse(c => {
    const cleanName = c.name.startsWith('LARA_') ? c.name.substring(5) : c.name;
    if (FPS_LAYER_HIDE.has(cleanName)) list.push(c);
  });
  return list;
}

function hideAlways(root: THREE.Object3D): void {
  root.traverse(c => {
    const cleanName = c.name.startsWith('LARA_') ? c.name.substring(5) : c.name;
    if (ALWAYS_HIDE_NAMES.has(cleanName)) c.visible = false;
  });
}

/** Tourne le head bone d'un walker pour matcher walkPitch (radians). Hochement avant/arrière. */
function applyHeadPitch(head: THREE.Bone | null, pitchRad: number): void {
  if (!head) return;
  const rest = head.userData.restQuat as THREE.Quaternion | undefined;
  if (!rest) return;
  const clamped = Math.max(-1.2, Math.min(1.2, pitchRad));
  const deg = (clamped * 180) / Math.PI;
  // Axe X local du head bone = inclinaison avant/arrière sur le rig lara2026.
  head.quaternion.copy(rest).multiply(quatAxisDeg('X', -deg));
}

const HAIR_NODES   = new Set(['Object_104', 'Object_111', 'Object_115', 'Object_116']);
const HAIR_COLOR_0 = new THREE.Color(0x000000);
const HAIR_COLOR_1 = new THREE.Color(0x990000);
const HAIR_COLOR_2 = new THREE.Color(0xffffff);
const HAIR_COLORS  = [HAIR_COLOR_0, HAIR_COLOR_1, HAIR_COLOR_2, HAIR_COLOR_0];

// ── Composant ─────────────────────────────────────────────────────────────────

export function Walker({ showSkeleton = false, isPreview = false }: { showSkeleton?: boolean, isPreview?: boolean }) {
  const { scene } = useGLTF('media/glb/lara_croft__2026_rigged.glb');
  const groupRef  = useRef<THREE.Group>(null!);
  const mixerRef  = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const hairMatRef   = useRef<THREE.MeshStandardMaterial | null>(null);
  const hairChainRef = useRef<HairNode[]>([]);
  const headBoneRef  = useRef<THREE.Bone | null>(null);
  const fpsHideRef   = useRef<THREE.Object3D[]>([]);
  const fpsCollapsedRef = useRef(false);
  const activeRef    = useRef(false);
  const hairTRef     = useRef(0);
  const fadeFrames   = useRef(0);
  const skelHelper   = useMemo(() => new THREE.SkeletonHelper(scene), [scene]);
  const { scene: threeScene } = useThree();

  useEffect(() => {
    if (showSkeleton) threeScene.add(skelHelper);
    else              threeScene.remove(skelHelper);
    return () => { threeScene.remove(skelHelper); };
  }, [showSkeleton, skelHelper, threeScene]);

  useLayoutEffect(() => {
    normalizeBoneNames(scene);
    // FrontSide only — évite d'afficher l'intérieur du corps en mode walk
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false; // skinned mesh: bounding box repos ≠ pose animée
      ([] as THREE.Material[]).concat(m.material as any)
        .forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.FrontSide; });
    });

    // Hair : clone material partagé pour cycling
    let hairMat: THREE.MeshStandardMaterial | null = null;
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh && HAIR_NODES.has(c.name) && !hairMat) {
        hairMat = (m.material as THREE.MeshStandardMaterial).clone();
      }
    });
    if (!hairMat) hairMat = new THREE.MeshStandardMaterial();
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh && HAIR_NODES.has(c.name)) m.material = hairMat!;
    });
    (hairMat as THREE.MeshStandardMaterial).emissiveIntensity = 1;
    hairMatRef.current = hairMat;

    // Taille et position au sol — main Lara = 181 cm (taille utilisateur)
    scene.rotation.y = 0;
    scene.scale.set(1, 1, 1);
    const box  = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const targetH = 181;
    scene.scale.setScalar(targetH / size.y);
    box.setFromObject(scene);
    scene.position.set(0, -box.min.y, 0);
    cameraState.walkerHeight0 = targetH;

    // Position initiale : centre de la pièce (si pas en preview)
    if (groupRef.current && !isPreview) {
      groupRef.current.position.set(cameraState.camX, 0, cameraState.camZ);
      cameraState.walker0X = cameraState.camX;
      cameraState.walker0Z = cameraState.camZ;
    }

    // Cache restQuat sur tous les bones AVANT build clip & init hair chain
    cacheRestQuats(scene);

    // Mixer + clip custom V2
    const mixer  = new THREE.AnimationMixer(scene);
    const action = mixer.clipAction(buildWalkClip(scene));
    action.setLoop(THREE.LoopRepeat, Infinity);
    mixerRef.current  = mixer;
    actionRef.current = action;

    // Chaîne ponytail Verlet (initialisée après pose de repos)
    hairChainRef.current = initHairChain(scene);
    headBoneRef.current  = findBone(scene, HEAD_BONE);
    fpsHideRef.current   = collectFpsHide(scene);
    hideAlways(scene);

    // Debug : exposer la liste des meshes pour WalkerMeshDebug panel
    walkerMeshList.length = 0;
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) walkerMeshList.push(c as THREE.Mesh);
    });
    walkerMeshList.sort((a, b) => a.name.localeCompare(b.name));
  }, [scene, isPreview]);

  useFrame(({ invalidate }, delta) => {
    if (!groupRef.current) return;
    const isWalking = cameraState.isWalking;
    const isMoving  = cameraState.isMoving;
    const active    = isPreview ? true : cameraState.activeWalkerIdx === 0;

    if (!isPreview) {
      if (active) {
        if (isWalking) {
          cameraState.walker0X = cameraState.camX;
          cameraState.walker0Z = cameraState.camZ;
        }
        cameraState.walkerX = cameraState.walker0X;
        cameraState.walkerZ = cameraState.walker0Z;
        groupRef.current.rotation.y = cameraState.walkYaw;
      }
      groupRef.current.position.set(cameraState.walker0X, 0, cameraState.walker0Z);
      groupRef.current.visible = !(active && cameraState.walkerHidden);
    } else {
      groupRef.current.position.set(0, 0, 0); // Center for preview
      groupRef.current.visible = true;
    }

    // FPS : masque eyes/lashes + effondre paupières/narines/lèvres
    const hideFps = active && isWalking && !isPreview;
    if (hideFps !== fpsCollapsedRef.current) {
      for (const m of fpsHideRef.current) {
        m.layers.set(hideFps ? LAYER_WALKER_DETAIL : 0);
      }
      fpsCollapsedRef.current = hideFps;
      invalidate();
    }

    // Head pitch — suit walkPitch caméra pour FPS (sans invalidate : la caméra
    // déclenche déjà un frame quand walkPitch change via la souris).
    if (active && isWalking && !isPreview) {
      applyHeadPitch(headBoneRef.current, cameraState.walkPitch);
    } else if (headBoneRef.current?.userData.restQuat) {
      applyHeadPitch(headBoneRef.current, 0);
    }

    // Animation marche (seulement si walker actif)
    const mixer  = mixerRef.current;
    const action = actionRef.current;
    const shouldMove = (isMoving && active) || isPreview;
    if (mixer && action) {
      if (shouldMove && !activeRef.current) {
        action.reset().fadeIn(0.15).play();
        activeRef.current = true;
        fadeFrames.current = 0;
      } else if (!shouldMove && activeRef.current) {
        action.fadeOut(0.2);
        activeRef.current = false;
        fadeFrames.current = 15;
      }
      if (activeRef.current || fadeFrames.current > 0) {
        mixer.update(delta);
        // Verlet hair physics — appelé après mixer.update pour que les bones tête soient à jour
        if (hairChainRef.current.length > 0) updateHairPhysics(hairChainRef.current, delta);
        if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--;
        invalidate();
      }
    }

    // Cycling couleur cheveux
    const hairMat = hairMatRef.current;
    if (hairMat) {
      if (shouldMove) {
        hairTRef.current += delta * 1.2;
        const t = hairTRef.current % 4;
        const i = Math.floor(t);
        hairMat.emissive.lerpColors(HAIR_COLORS[i], HAIR_COLORS[(i + 1) % 3], t - i);
      } else {
        hairMat.emissive.lerp(HAIR_COLOR_0, 0.05);
        if (hairMat.emissive.r < 0.002 && hairMat.emissive.g < 0.002 && hairMat.emissive.b < 0.002)
          hairMat.emissive.set(0x000000);
      }
    }
  });

  return (
    <group ref={groupRef} userData={{ hoverAction: { label: 'Lara Croft', actionId: 'walker-meshes' } }}>
      <primitive object={scene} />
    </group>
  );
}

// ── Walker « lara_mixamo » (rig Mixamo, modèle indépendant) ───────────────────
//
// Utilise lara_mixamo.glb (mesh Lara re-skinné sur squelette Mixamo Y Bot).
// Animation de marche chargée depuis Female Walk.fbx (Mixamo).
// Les bones utilisent les noms Mixamo (mixamorig:Hips, etc.).
// Les « : » et espaces sont remplacés par « _ » pour la compatibilité PropertyBinding.

const MIXAMO_GLB      = 'media/glb/lara_mixamo.glb';
const MIXAMO_WALK_GLB = 'media/glb-animations/walking.glb';

/** Normalise les noms de bones Mixamo : remplace espaces ET deux-points par _. */
function normalizeMixamoBoneNames(root: THREE.Object3D): void {
  root.traverse(c => {
    if ((c as THREE.Bone).isBone) c.name = c.name.replace(/[ :]/g, '_');
  });
}

const MIXAMO_HEAD_BONE = 'mixamorig_Head';

// Tenue rouge — mêmes noms de matériaux/meshes que dans lara_croft__2026_rigged.glb
// (les meshes Lara sont conservés tels quels dans lara_mixamo.glb).
const RED_MAT_NAMES  = new Set(['5_BackPack_1.0_0_0', '5_Shorts_1.0_0_0']);
const RED_NODE_NAMES = new Set(['LARA_Object_113']); // Use LARA_Object prefix for new rig
const RED_COLOR      = new THREE.Color(0xcc1111);

/**
 * Retarget un AnimationClip Mixamo sur le squelette lara_mixamo :
 * - Normalise les « : » et espaces en « _ » pour matcher les noms normalisés du GLB
 * - Supprime les tracks de position (on ne veut que les rotations pour éviter le root motion)
 *   sauf pour Hips (position de base).
 */
function retargetMixamoClip(clip: THREE.AnimationClip): THREE.AnimationClip {
  const retargeted: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    let name = track.name;

    // Normalise les deux-points et espaces → underscores
    // Mais préserve le « .property » final (quaternion, position, scale)
    const dotIdx = name.lastIndexOf('.');
    if (dotIdx < 0) continue;
    
    const bonePart = name.substring(0, dotIdx).replace(/[ :]/g, '_');
    const propPart = name.substring(dotIdx); // ".quaternion" etc.
    name = bonePart + propPart;

    // Remove position tracks for everything except Hips.
    if (propPart === '.position' && !bonePart.includes('Hips')) continue;
    // Remove scale tracks.
    if (propPart === '.scale') continue;

    const cloned = track.clone();
    cloned.name = name;

    // Force absolute horizontal centering for Hips to prevent any side-to-side drift/swing
    if (name === 'mixamorig_Hips.position') {
      const vals = cloned.values;
      for (let i = 0; i < vals.length; i += 3) {
        vals[i]     = 0; // Force X to center
        // vals[i+1] is vertical Y (keep bounce)
        vals[i+2]   = 0; // Force Z to center
      }
    }

    // Dampen/Remove Hips side-sway rotation (Roll around Z and Yaw around Y in Mixamo)
    if (name === 'mixamorig_Hips.quaternion') {
      const vals = cloned.values;
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      for (let i = 0; i < vals.length; i += 4) {
        q.set(vals[i], vals[i+1], vals[i+2], vals[i+3]);
        e.setFromQuaternion(q, 'YXZ'); // Mixamo Hips: Y is Up, Z is Forward
        
        // Zero out Roll (Z) and heavily dampen Yaw (Y)
        e.z = 0;
        e.y *= 0.1; // Keep just a hint of twist for natural feel
        
        q.setFromEuler(e);
        vals[i]   = q.x;
        vals[i+1] = q.y;
        vals[i+2] = q.z;
        vals[i+3] = q.w;
      }
    }

    retargeted.push(cloned);
  }
  return new THREE.AnimationClip(clip.name || 'walk-mixamo', clip.duration, retargeted);
}

export function WalkerRed({ showSkeleton = false, isPreview = false }: { showSkeleton?: boolean, isPreview?: boolean }) {
  const { scene } = useGLTF(MIXAMO_GLB);
  const animGltf = useGLTF(MIXAMO_WALK_GLB);

  const groupRef        = useRef<THREE.Group>(null!);
  const mixerRef        = useRef<THREE.AnimationMixer | null>(null);
  const actionRef       = useRef<THREE.AnimationAction | null>(null);
  const hairChainRef    = useRef<HairNode[]>([]);
  const headBoneRef     = useRef<THREE.Bone | null>(null);
  const fpsHideRef      = useRef<THREE.Object3D[]>([]);
  const fpsCollapsedRef = useRef(false);
  const activeRef       = useRef(false);
  const fadeFrames      = useRef(0);
  const skelHelper      = useMemo(() => new THREE.SkeletonHelper(scene), [scene]);
  const { scene: threeScene } = useThree();

  useEffect(() => {
    if (showSkeleton) threeScene.add(skelHelper);
    else              threeScene.remove(skelHelper);
    return () => { threeScene.remove(skelHelper); };
  }, [showSkeleton, skelHelper, threeScene]);

  useLayoutEffect(() => {
    // Normalise les noms Mixamo : « : » et espaces → « _ »
    normalizeMixamoBoneNames(scene);

    // FrontSide only, ombres, frustumCulled off pour skinned meshes
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      ([] as THREE.Material[]).concat(m.material as any)
        .forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.FrontSide; });
    });

    // Tenue rouge
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (RED_MAT_NAMES.has(mat?.name) || RED_NODE_NAMES.has(c.name)) {
        m.material = mat.clone();
        (m.material as THREE.MeshStandardMaterial).color.copy(RED_COLOR);
        (m.material as THREE.MeshStandardMaterial).map = null;
      }
    });

    // Taille — WalkerRed = 173.4 cm (match studios)
    const redH = 173.4;
    scene.rotation.y = 0;
    scene.scale.set(1, 1, 1);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    scene.scale.setScalar(redH / size.y);
    box.setFromObject(scene);
    scene.position.set(0, -box.min.y, 0);
    cameraState.walkerHeight1 = redH;

    // Cache restQuat AVANT build clip + chaîne hair
    cacheRestQuats(scene);

    // Animation de marche Mixamo depuis GLB
    const mixer = new THREE.AnimationMixer(scene);
    const rawClip = animGltf.animations?.[0];
    if (rawClip) {
      const clip   = retargetMixamoClip(rawClip);
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      actionRef.current = action;
    }
    mixerRef.current = mixer;

    // Chaîne ponytail Verlet (les bones auxiliaires head_hair_ponytail_* existent)
    hairChainRef.current = initHairChain(scene);
    headBoneRef.current  = findBone(scene, MIXAMO_HEAD_BONE);
    fpsHideRef.current   = collectFpsHide(scene);
    hideAlways(scene);
  }, [scene, animGltf]);

  useFrame(({ invalidate }, delta) => {
    if (!groupRef.current) return;
    const isMoving = cameraState.isMoving;
    const active   = isPreview ? true : cameraState.activeWalkerIdx === 1;
    const mixer    = mixerRef.current;
    const action   = actionRef.current;

    if (!isPreview) {
      if (active) {
        if (cameraState.isWalking) {
          cameraState.walker1X = cameraState.camX;
          cameraState.walker1Z = cameraState.camZ;
        }
        cameraState.walkerX = cameraState.walker1X;
        cameraState.walkerZ = cameraState.walker1Z;
        groupRef.current.rotation.y = cameraState.walkYaw;
      }
      groupRef.current.position.set(cameraState.walker1X, 0, cameraState.walker1Z);
    } else {
      groupRef.current.position.set(0, 0, 0);
    }

    // FPS : masque eyes/lashes + effondre paupières/narines/lèvres
    const hideFps = active && cameraState.isWalking && !isPreview;
    if (hideFps !== fpsCollapsedRef.current) {
      for (const m of fpsHideRef.current) {
        m.layers.set(hideFps ? LAYER_WALKER_DETAIL : 0);
      }
      fpsCollapsedRef.current = hideFps;
      invalidate();
    }

    // Head pitch — suit walkPitch (pas d'invalidate : caméra l'appelle déjà)
    if (active && cameraState.isWalking && !isPreview) {
      applyHeadPitch(headBoneRef.current, cameraState.walkPitch);
    } else if (headBoneRef.current?.userData.restQuat) {
      applyHeadPitch(headBoneRef.current, 0);
    }

    const shouldMove = (isMoving && active) || isPreview;
    if (!mixer || !action) return;
    if (shouldMove && !activeRef.current) {
      action.reset().fadeIn(0.15).play();
      activeRef.current  = true;
      fadeFrames.current = 0;
    } else if (!shouldMove && activeRef.current) {
      action.fadeOut(0.2);
      activeRef.current  = false;
      fadeFrames.current = 15;
    }
    if (activeRef.current || fadeFrames.current > 0) {
      mixer.update(delta);
      // Verlet hair physics — appelé après mixer.update pour que les bones tête soient à jour
      if (hairChainRef.current.length > 0) updateHairPhysics(hairChainRef.current, delta);
      if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--;
      invalidate();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('media/glb/lara_croft__2026_rigged.glb');
useGLTF.preload(MIXAMO_GLB);
