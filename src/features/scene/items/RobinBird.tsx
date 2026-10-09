import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useGLTF, useHelper } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { isAppIdle } from '@features/scene/idleState';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { appLog } from '@features/ui/AppConsole';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { cameraState } from '@features/scene/cameraState';
import { chooseBirdPerch, resolveBirdPerch, RobinFootContact, ROBIN_HEIGHT, type BirdPerch, type BirdFootPose } from '../birdPerches';

const GLB_PATH = '/characters/robin/robin.glb';

const _tmpBirdDir = new THREE.Vector3();
const ANIMATION_FADE = 0.2; // secondes de transition entre les poses
const IDLE_CHANGE_RATE = 0.6; // changements par seconde, indépendant du FPS

type AIState = {
  state: 'waiting' | 'idle' | 'flying';
  perch: BirdPerch | null;
  groundedFeet: BirdFootPose | null;
  targetPos: THREE.Vector3;
  timer: number;
};

export function RobinBird({ isPreview = false, previewAnim = '', showSkeletonPreview = false, onSize }: { isPreview?: boolean, previewAnim?: string, showSkeletonPreview?: boolean, onSize?: (size: THREE.Vector3) => void }) {
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate, scene: world } = useThree();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const footContact = useRef<RobinFootContact | null>(null);
  const landingRotation = useRef(new THREE.Quaternion());
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const headRef = useRef<THREE.Object3D | null>(null);
  const beakRef = useRef<THREE.Object3D | null>(null);
  const headPos = useRef(new THREE.Vector3());
  const beakPos = useRef(new THREE.Vector3());
  const sourceBasis = useRef(new THREE.Matrix4());
  const targetBasis = useRef(new THREE.Matrix4());
  const sourceRotation = useRef(new THREE.Quaternion());
  const up = useRef(new THREE.Vector3(0, 1, 0));
  const origin = useRef(new THREE.Vector3());

  function playAnimation(name: string) {
    const clip = animations.find(a => a.name === name);
    if (!clip) throw new Error(`Animation Robin manquante : ${name}`);
    const next = mixerRef.current!.clipAction(clip);
    const previous = currentAction.current;
    if (previous === next) return;
    next.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveWeight(1).play();
    if (previous) next.crossFadeFrom(previous, ANIMATION_FADE, false);
    currentAction.current = next;
  }

  const showSkeletonGlobal = useSceneStore(s => s.layers.skeleton);
  const showSkeleton = isPreview ? showSkeletonPreview : showSkeletonGlobal;
  useHelper(showSkeleton ? modelRef as any : null, THREE.SkeletonHelper);

  // IA Autonome
  const aiStateRef = useRef<AIState>({
    state: 'waiting',
    perch: null,
    groundedFeet: null,
    targetPos: new THREE.Vector3(),
    timer: 2.0
  });

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    headRef.current = scene.getObjectByName('Head_011') ?? null;
    beakRef.current = scene.getObjectByName('Beak_012') ?? null;
    if (!headRef.current || !beakRef.current) throw new Error('Robin : os de tête/bec manquants');

    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());

    if (size.y <= 0) throw new Error('Robin : hauteur du modèle invalide');
    scene.scale.setScalar(ROBIN_HEIGHT / size.y);
    const scaledBox = glbLocalBBox(scene);
    scene.position.set(0, -scaledBox.min.y, 0);
    onSize?.(scaledBox.getSize(new THREE.Vector3()));

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.geometry) {
        m.geometry.computeBoundingBox();
        m.geometry.computeBoundingSphere();
        // The animated geometry may leave the bind-pose bounds.
        m.frustumCulled = false;
      }
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = 0;
        mat.roughness = 0.8;
        mat.transparent = false;
        mat.alphaTest = 0;
        mat.depthWrite = true;
      }
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      let targetAnimName = 'Robin_Bird_Idle';
      if (isPreview && previewAnim) {
        targetAnimName = previewAnim;
      }
      const clip = animations.find(a => a.name === targetAnimName) || animations[0];
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
      currentAction.current = action;
      mixer.update(0);
    }

    if (modelRef.current && !isPreview) {
      modelRef.current.rotation.reorder('YXZ');
      footContact.current = new RobinFootContact(scene);
      const ai = aiStateRef.current;
      ai.state = 'waiting';
      ai.perch = null;
      ai.groundedFeet = footContact.current.ground(modelRef.current, scene);
      modelRef.current.visible = false;
    }

    invalidate();

    return () => {
      if (!isPreview) delete cameraState.positions['robin'];
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
      currentAction.current = null;
    };
  }, [scene, animations, isPreview, previewAnim, invalidate, onSize]);

  // Listener événements de l'UI (Menu Hover)
  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'robin-bird-replay') {
        // Redémarre l'IA et force l'envol
        // During flight, redirect from the current position without snapping to a perch.
        if (aiStateRef.current.state === 'flying') aiStateRef.current.perch = null;
        aiStateRef.current.timer = 0; // Trigger take off immediately
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [isPreview]);

  // Boucle de jeu (IA & Animation)
  useFrame((_state, delta) => {
    if (isAppIdle() || !modelRef.current || !mixerRef.current) return;
    if (isPreview) {
      let targetAnimName = 'Robin_Bird_Idle';
      if (previewAnim) {
        targetAnimName = previewAnim;
      }
      const clip = animations.find(a => a.name === targetAnimName) || animations[0];
      if (clip && clip.duration > 0) {
        const store = useAnimPreviewStore.getState();
        store.setClipInfo(`Robin ${clip.name}`, clip.duration, false);
        const action = mixerRef.current.clipAction(clip);
        const animDelta = delta * (store.speed || 1);
        if (store.isPlaying && !store.isScrubbing) {
          if (action.paused) action.paused = false;
          if (!store.isLooping) {
            action.setLoop(THREE.LoopOnce, 0);
            action.clampWhenFinished = true;
            if (action.time >= clip.duration - 0.005) {
              action.time = 0;
            }
          } else {
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;
          }
          mixerRef.current.update(animDelta);
          if (!store.isLooping && action.time >= clip.duration) {
            action.time = clip.duration;
            action.paused = true;
            store.setCurrentTime(clip.duration);
            store.pause();
          } else {
            store.setCurrentTime(action.time % clip.duration);
          }
        } else {
          action.setEffectiveWeight(1);
          (action as any)._fadeDuration = 0;
          (action as any)._weight = 1;
          action.time = store.currentTime;
          action.paused = true;
          mixerRef.current.update(0);
        }
      }
      invalidate();
      return;
    }
    mixerRef.current.update(delta);

    invalidate();
    const ai = aiStateRef.current;
    const model = modelRef.current;
    const feet = ai.groundedFeet!;

    if (ai.state === 'waiting') {
      ai.perch = chooseBirdPerch(world, feet, null, 'feeder');
      if (!ai.perch) return; // Suspense may still be mounting the garden surfaces.
      if (!resolveBirdPerch(ai.perch, world, feet, ai.targetPos, landingRotation.current)) return;
      model.position.copy(ai.targetPos);
      model.quaternion.copy(landingRotation.current);
      model.visible = true;
      ai.timer = 2;
      playAnimation(ai.perch.descriptor.kind === 'feeder' ? 'Robin_Bird_Eat' : 'Robin_Bird_Idle');
      ai.state = 'idle';
    }

    const available = ai.perch && resolveBirdPerch(ai.perch, world, feet, ai.targetPos, landingRotation.current);
    if (!available) {
      const next = chooseBirdPerch(world, feet, ai.perch);
      if (!next) {
        model.visible = false;
        ai.state = 'waiting';
        delete cameraState.positions['robin'];
        return;
      }
      ai.perch = next;
      resolveBirdPerch(next, world, feet, ai.targetPos, landingRotation.current);
      ai.state = 'flying';
      playAnimation('Robin_Bird_Fly');
    }

    if (ai.state === 'idle') {
      model.position.copy(ai.targetPos);
      model.quaternion.copy(landingRotation.current);
      footContact.current!.ground(model, scene);
      ai.timer -= delta;
      if (ai.timer <= 0) {
        const next = chooseBirdPerch(world, feet, ai.perch);
        if (next) {
          ai.perch = next;
          resolveBirdPerch(next, world, feet, ai.targetPos, landingRotation.current);
          ai.state = 'flying';
          playAnimation('Robin_Bird_Fly');
        }
      } else if (Math.random() < 1 - Math.exp(-IDLE_CHANGE_RATE * delta)) {
        const idleAnimNames = ai.perch!.descriptor.kind === 'feeder'
          ? ['Robin_Bird_Eat', 'Robin_Bird_Eat', 'Robin_Bird_Idle', 'Robin_Bird_Call']
          : ['Robin_Bird_Idle', 'Robin_Bird_Idle2', 'Robin_Bird_Call'];
        playAnimation(idleAnimNames[Math.floor(Math.random() * idleAnimNames.length)]);
      }
    } else if (ai.state === 'flying') {
      const speed = 150 * delta;
      const dist = model.position.distanceTo(ai.targetPos);
      if (dist <= speed) {
        model.position.copy(ai.targetPos);
        model.quaternion.copy(landingRotation.current);
        ai.state = 'idle';
        const isAtFeeder = ai.perch!.descriptor.kind === 'feeder';
        ai.timer = isAtFeeder ? 5 + Math.random() * 5 : 3 + Math.random() * 5;
        playAnimation(isAtFeeder ? 'Robin_Bird_Eat' : 'Robin_Bird_Idle');
        footContact.current!.ground(model, scene);
        appLog('robin', `Se pose : ${ai.perch!.descriptor.id}`);
      } else {
        const dir = _tmpBirdDir.subVectors(ai.targetPos, model.position).normalize();
        model.position.addScaledVector(dir, speed);
        // Use the animated head-to-beak direction, including animation crossfades.
        headRef.current!.getWorldPosition(headPos.current);
        beakRef.current!.getWorldPosition(beakPos.current);
        model.worldToLocal(headPos.current);
        model.worldToLocal(beakPos.current);
        beakPos.current.sub(headPos.current).normalize();
        if (beakPos.current.lengthSq() === 0) throw new Error('Robin : direction du bec nulle');
        sourceBasis.current.lookAt(origin.current, beakPos.current.negate(), up.current);
        targetBasis.current.lookAt(origin.current, _tmpBirdDir.negate(), up.current);
        sourceRotation.current.setFromRotationMatrix(sourceBasis.current).invert();
        model.quaternion.setFromRotationMatrix(targetBasis.current).multiply(sourceRotation.current);
      }
    }

    cameraState.positions['robin'] = {
      x: model.position.x,
      y: model.position.y,
      z: model.position.z,
      yaw: model.rotation.y,
    };
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);

