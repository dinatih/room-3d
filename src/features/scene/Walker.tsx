/**
 * Walker.tsx — Lara Croft 2026 rigged, suit le mode walk.
 * Port de js/decor/walkingMan.js + js/decor/walkers/lara2026.js.
 *
 * - Suit la caméra en mode walk (position X/Z, orienté dans la direction de marche)
 * - Animation de marche custom (clip quaternion sur les bones)
 * - Cycling de couleur des cheveux pendant la marche
 */
import { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { cameraState } from '@features/scene/cameraState';

import { ROOM_W, ROOM_D } from '@config';

// Three.js PropertyBinding ne supporte pas les espaces dans les noms de bones.
// Le GLB 2026 utilise des espaces → on les normalise en underscores au chargement.
function normalizeBoneNames(root: THREE.Object3D): void {
  root.traverse(c => {
    if ((c as THREE.Bone).isBone) c.name = c.name.replace(/ /g, '_');
  });
}

// ── Animation de marche (port de buildWalkClip dans lara2026.js) ───────────────

function buildWalkClip(root: THREE.Object3D): THREE.AnimationClip {
  const T = 0.8;
  const times = [0, T * 0.25, T * 0.5, T * 0.75, T];

  function findBone(name: string): THREE.Bone | null {
    let b: THREE.Bone | null = null;
    root.traverse(c => { if ((c as THREE.Bone).isBone && c.name === name && !b) b = c as THREE.Bone; });
    return b;
  }
  function qx(deg: number) {
    const r = (deg * Math.PI) / 180 / 2;
    return new THREE.Quaternion(Math.sin(r), 0, 0, Math.cos(r));
  }
  function qz(deg: number) {
    const r = (deg * Math.PI) / 180 / 2;
    return new THREE.Quaternion(0, 0, Math.sin(r), Math.cos(r));
  }
  function qt(boneName: string, ...deltas: THREE.Quaternion[]) {
    const rest = findBone(boneName)?.quaternion.clone() ?? new THREE.Quaternion();
    const flat = deltas.flatMap(d => {
      const q = rest.clone().multiply(d);
      return [q.x, q.y, q.z, q.w];
    });
    return new THREE.QuaternionKeyframeTrack(boneName + '.quaternion', times, flat);
  }

  const N  = new THREE.Quaternion();
  const lad = (deg: number) => qz(-90 + deg);
  const rad = (deg: number) => qz( 90 - deg);

  return new THREE.AnimationClip('walk-lara2026', T, [
    qt('leg_left_thigh_04',        qx(30),    N,         qx(-30),   N,         qx(30)),
    qt('leg_right_thigh_08',       qx(-30),   N,         qx(30),    N,         qx(-30)),
    qt('leg_left_knee_05',         qx(8),     qx(30),    qx(60),    qx(30),    qx(8)),
    qt('leg_right_knee_09',        qx(60),    qx(30),    qx(8),     qx(30),    qx(60)),
    qt('arm_left_shoulder_2_014',  lad(20),   lad(0),    lad(-20),  lad(0),    lad(20)),
    qt('arm_right_shoulder_2_033', rad(-20),  rad(0),    rad(20),   rad(0),    rad(-20)),
    qt('spine_lower_012',
      new THREE.Quaternion(0, 0,  0.012, 0.99993), N,
      new THREE.Quaternion(0, 0, -0.012, 0.99993), N,
      new THREE.Quaternion(0, 0,  0.012, 0.99993),
    ),
  ]);
}

// ── Couleurs cheveux (créées une fois) ────────────────────────────────────────

const HAIR_NODES   = new Set(['Object_104', 'Object_111', 'Object_115', 'Object_116']);
const HAIR_COLOR_0 = new THREE.Color(0x000000);
const HAIR_COLOR_1 = new THREE.Color(0x990000);
const HAIR_COLOR_2 = new THREE.Color(0xffffff);
const HAIR_COLORS  = [HAIR_COLOR_0, HAIR_COLOR_1, HAIR_COLOR_2, HAIR_COLOR_0];

// ── Composant ─────────────────────────────────────────────────────────────────

export function Walker({ showSkeleton = false }: { showSkeleton?: boolean }) {
  const { scene } = useGLTF('media/lara_croft__2026_rigged.glb');
  const groupRef  = useRef<THREE.Group>(null!);
  const mixerRef  = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const hairMatRef   = useRef<THREE.MeshStandardMaterial | null>(null);
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

    // Taille et position au sol
    scene.rotation.y = 0;
    const box  = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    scene.scale.setScalar(170 / size.y);
    box.setFromObject(scene);
    scene.position.set(0, -box.min.y, 0);

    // Position initiale : centre de la pièce
    if (groupRef.current) {
      groupRef.current.position.set(cameraState.camX, 0, cameraState.camZ);
      cameraState.walker0X = cameraState.camX;
      cameraState.walker0Z = cameraState.camZ;
    }

    // Mixer + clip custom
    const mixer  = new THREE.AnimationMixer(scene);
    const action = mixer.clipAction(buildWalkClip(scene));
    action.setLoop(THREE.LoopRepeat, Infinity);
    mixerRef.current  = mixer;
    actionRef.current = action;
  }, [scene]);

  useFrame(({ invalidate }, delta) => {
    if (!groupRef.current) return;
    const isWalking = cameraState.isWalking;
    const isMoving  = cameraState.isMoving;
    const active    = cameraState.activeWalkerIdx === 0;

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

    // Animation marche (seulement si walker actif)
    const mixer  = mixerRef.current;
    const action = actionRef.current;
    const shouldMove = isMoving && active;
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
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// ── Walker rouge (clone indépendant, position fixe) ───────────────────────────

const RED_MAT_NAMES  = new Set(['5_BackPack_1.0_0_0', '5_Shorts_1.0_0_0']);
const RED_NODE_NAMES = new Set(['Object_113']);
const RED_COLOR      = new THREE.Color(0xcc1111);

export function WalkerRed({ showSkeleton = false }: { showSkeleton?: boolean }) {
  const { scene: origScene } = useGLTF('media/lara_croft__2026_rigged.glb');
  const clone = useMemo(() => SkeletonUtils.clone(origScene), [origScene]);

  const groupRef    = useRef<THREE.Group>(null!);
  const mixerRef    = useRef<THREE.AnimationMixer | null>(null);
  const actionRef   = useRef<THREE.AnimationAction | null>(null);
  const activeRef   = useRef(false);
  const fadeFrames  = useRef(0);
  const skelHelper  = useMemo(() => new THREE.SkeletonHelper(clone), [clone]);
  const { scene: threeScene } = useThree();

  useEffect(() => {
    if (showSkeleton) threeScene.add(skelHelper);
    else              threeScene.remove(skelHelper);
    return () => { threeScene.remove(skelHelper); };
  }, [showSkeleton, skelHelper, threeScene]);

  useLayoutEffect(() => {
    normalizeBoneNames(clone);
    // Walker (sibling précédent) a déjà mis à l'échelle origScene — on copie
    clone.scale.copy(origScene.scale);
    clone.position.copy(origScene.position);

    // FrontSide only sur le clone (matériaux propres au clone)
    clone.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      ([] as THREE.Material[]).concat(m.material as any)
        .forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.FrontSide; });
    });

    // Tenue rouge
    clone.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (RED_MAT_NAMES.has(mat.name) || RED_NODE_NAMES.has(c.name)) {
        m.material = mat.clone();
        (m.material as THREE.MeshStandardMaterial).color.copy(RED_COLOR);
        (m.material as THREE.MeshStandardMaterial).map = null;
      }
    });

    // Animation de marche
    const mixer  = new THREE.AnimationMixer(clone);
    const action = mixer.clipAction(buildWalkClip(clone));
    action.setLoop(THREE.LoopRepeat, Infinity);
    mixerRef.current  = mixer;
    actionRef.current = action;
  }, [clone]);

  useFrame(({ invalidate }, delta) => {
    if (!groupRef.current) return;
    const isMoving = cameraState.isMoving;
    const active   = cameraState.activeWalkerIdx === 1;
    const mixer    = mixerRef.current;
    const action   = actionRef.current;

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

    const shouldMove = isMoving && active;
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
      if (!activeRef.current && fadeFrames.current > 0) fadeFrames.current--;
      invalidate();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clone} />
    </group>
  );
}

useGLTF.preload('media/lara_croft__2026_rigged.glb');
