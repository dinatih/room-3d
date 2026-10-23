import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { isAppIdle } from '@features/scene/idleState';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { appLog } from '@features/ui/AppConsole';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { cameraState } from '@features/scene/cameraState';
import { droneInput, droneMovement, useDroneControlStore } from '../droneControls';
import { useDroneControls } from '../camera/useDroneControls';
import { HornetTour, type TourRoom } from '../hornetTour';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';

const GLB_PATH = '/items/black-hornet/black-hornet.glb';
const TARGET_LENGTH_CM = 16.8; // Longueur réelle du nano-drone Black Hornet (environ 16,8 cm)

export function BlackHornetDrone({
  isPreview = false,
  previewAnim = '',
  onSize,
}: {
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}) {
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate } = useThree();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const piloting = useDroneControlStore(state => state.piloting);
  useDroneControls(isPreview);
  const cameraMount = useRef(new THREE.Vector3());
  const cameraBone = useRef<THREE.Bone | null>(null);
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const cameraRadius = useRef(0);

  const tourRef = useRef<HornetTour | null>(null);
  const flightState = useRef<'tour' | 'landed' | 'manual' | 'holding'>('tour');
  const moveDirection = useRef(new THREE.Vector3());

  function playAnimation(name: string, loop = true) {
    if (!mixerRef.current) return;
    const clip = animations.find(a => a.name === name) || animations.find(a => a.name.toLowerCase().includes(name.toLowerCase()));
    if (!clip) return;
    const action = mixerRef.current.clipAction(clip);
    if (currentAction.current === action) return;
    action.reset();
    if (currentAction.current && name !== 'Drone_Landed' && currentAction.current.getClip().name !== 'Drone_Landed') {
      action.time = currentAction.current.time % clip.duration;
    }
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.play();
    if (currentAction.current) {
      action.crossFadeFrom(currentAction.current, 0.3, false);
    }
    currentAction.current = action;
  }

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const length = Math.max(size.x, size.y, size.z);

    if (length > 0) {
      const scaleFactor = TARGET_LENGTH_CM / length;
      scene.scale.setScalar(scaleFactor);
      const scaledBox = glbLocalBBox(scene);
      // Centrer en X/Z et poser à Y=0 si posé au sol
      scene.position.set(-scaledBox.getCenter(new THREE.Vector3()).x, -scaledBox.min.y, -scaledBox.getCenter(new THREE.Vector3()).z);
      const dimensions = scaledBox.getSize(new THREE.Vector3());
      cameraRadius.current = dimensions.length() / 2;
      onSize?.(scaledBox.getSize(new THREE.Vector3()));
    }

    const nose = scene.getObjectByName('Hornet002_low001') as THREE.SkinnedMesh;
    const hull = scene.getObjectByName('Hornet001_low001') as THREE.SkinnedMesh;
    const body = scene.getObjectByName('Bone001') as THREE.Bone;
    if (!nose?.isSkinnedMesh || !hull?.isSkinnedMesh || !body?.isBone) throw new Error('Hornet : nez ou os de fuselage absent');
    const joint = nose.skeleton.bones.indexOf(body);
    if (joint < 0) throw new Error('Hornet : fuselage absent du squelette du nez');
    nose.geometry.computeBoundingBox();
    hull.geometry.computeBoundingBox();
    nose.geometry.boundingBox!.getCenter(cameraMount.current);
    cameraMount.current.z = hull.geometry.boundingBox!.max.z;
    cameraMount.current.applyMatrix4(nose.bindMatrix).applyMatrix4(nose.skeleton.boneInverses[joint]);
    cameraBone.current = body;

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = 0.35;
        mat.roughness = 0.55;
      }
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      const initialAnim = isPreview && previewAnim ? previewAnim : 'Drone_Hover';
      playAnimation(initialAnim);
      mixer.update(0);
    }

    if (modelRef.current && !isPreview) {
      // Sphere about the model origin remains conservative even in a vertical view.
      const dimensions = glbLocalBBox(scene).getSize(new THREE.Vector3());
      const radius = Math.hypot(dimensions.x / 2, dimensions.y, dimensions.z / 2);
      setAgentProfile('drone', { radius, height: radius * 2 });
      const tour = new HornetTour(radius, message => appLog('drone', message));
      tourRef.current = tour;
      modelRef.current.userData.hornetTour = tour;
      modelRef.current.position.copy(tour.observations.find(o => o.id === 'garden')!.position);
      flightState.current = 'tour';
      playAnimation('Drone_Hover');
    }

    invalidate();

    return () => {
      if (!isPreview) {
        tourRef.current?.release();
        tourRef.current = null;
        removeAgentProfile('drone');
        delete cameraState.positions['drone'];
        delete cameraState.animalViews.drone;
        if (cameraState.animalTarget === 'drone') {
          cameraState.animalTarget = null;
          document.dispatchEvent(new CustomEvent('animal-camera-mode', { detail: false }));
        }
        useDroneControlStore.setState({ available: false });
        useDroneControlStore.getState().setPiloting(false);
      }
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
      currentAction.current = null;
    };
  }, [scene, animations, isPreview, previewAnim, invalidate, onSize]);

  useEffect(() => {
    if (isPreview) return;
    if (piloting) {
      tourRef.current?.release();
      flightState.current = 'manual';
      playAnimation('Drone_Hover');
    } else if (flightState.current === 'manual') {
      flightState.current = 'holding';
    }
    invalidate();
  }, [piloting, isPreview, invalidate]);

  // Commandes via les actions UI (HoverMenu ou événements)
  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (!key) return;

      if (key === 'drone-patrol-all' || key.startsWith('drone-goto-')) {
        const room = key === 'drone-patrol-all' ? null : key.replace('drone-goto-', '') as TourRoom;
        if (room && !tourRef.current?.observations.some(o => o.room === room)) throw new Error(`Hornet : pièce inconnue ${room}`);
        useDroneControlStore.getState().setPiloting(false);
        tourRef.current?.reset(room);
        flightState.current = 'tour';
        playAnimation('Drone_Fly');
      } else if (key === 'drone-toggle-land') {
        useDroneControlStore.getState().setPiloting(false);
        if (flightState.current === 'landed') {
          tourRef.current?.reset(tourRef.current.roomFilter);
          flightState.current = 'tour';
          playAnimation('Drone_Fly');
          appLog('drone', 'Décollage du Black Hornet.');
        } else {
          tourRef.current?.release();
          flightState.current = 'landed';
          playAnimation('Drone_Landed');
          appLog('drone', 'Atterrissage du Black Hornet.');
        }
      }
    };

    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [isPreview]);

  // Boucle de mise à jour Frame
  useFrame((_, delta) => {
    if (isAppIdle() || !modelRef.current || !mixerRef.current) return;

    // Mode Preview Inventaire
    if (isPreview) {
      const targetAnimName = previewAnim || 'Drone_Hover';
      const clip = animations.find(a => a.name === targetAnimName) || animations[0];
      if (clip && clip.duration > 0) {
        const store = useAnimPreviewStore.getState();
        store.setClipInfo(`Black Hornet ${clip.name}`, clip.duration, false);
        const action = mixerRef.current.clipAction(clip);
        const animDelta = delta * (store.speed || 1);
        if (store.isPlaying && !store.isScrubbing) {
          if (action.paused) action.paused = false;
          action.setLoop(store.isLooping ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
          mixerRef.current.update(animDelta);
          store.setCurrentTime(action.time % clip.duration);
        } else {
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

    const model = modelRef.current;

    if (flightState.current === 'manual') {
      const keys = droneInput.keys;
      const turn = Math.PI / 2 * delta; // 90°/s, indépendamment de la répétition clavier.
      const rotating = (key: string) => keys.has('camera:' + key) || keys.has('Alt') && keys.has(key);
      droneInput.yaw += (Number(rotating('ArrowLeft')) - Number(rotating('ArrowRight'))) * turn;
      droneInput.pitch = THREE.MathUtils.clamp(droneInput.pitch + (Number(rotating('ArrowUp')) - Number(rotating('ArrowDown'))) * turn, -Math.PI / 2, Math.PI / 2);
      const speed = useDroneControlStore.getState().speed * (droneInput.keys.has('Shift') ? 3 : 1);
      droneMovement(droneInput.keys, droneInput.yaw, droneInput.pitch, moveDirection.current);
      model.position.addScaledVector(moveDirection.current, speed * delta);
      model.rotation.set(-droneInput.pitch, droneInput.yaw, 0, 'YXZ');
      return;
    }
    if (flightState.current === 'holding') return;

    // Si le drone est posé
    if (flightState.current === 'landed') {
      // Descendre doucement vers le sol le plus proche (par ex. Y=12 cm ou sur une table)
      if (model.position.y > 10) {
        model.position.y = THREE.MathUtils.lerp(model.position.y, 8, delta * 2);
      }
      return;
    }

    const tour = tourRef.current;
    if (tour) {
      tour.tick(model.position, model.quaternion, delta);
      playAnimation(tour.state === 'travelling' ? 'Drone_Fly' : tour.observation?.sweep ? 'Drone_Scan' : 'Drone_Hover');
    }

  }, -2);

  // Le nez animé est publié avant le calcul caméra, sans retard d'une frame.
  useFrame(() => {
    const model = modelRef.current;
    if (isPreview || !model || !cameraBone.current) return;
    cameraPosition.current.copy(cameraMount.current);
    cameraBone.current.localToWorld(cameraPosition.current);
    model.getWorldDirection(cameraForward.current);
    const view = cameraState.animalViews.drone ??= { eyes: { x: 0, y: 0, z: 0 }, forward: { x: 0, y: 0, z: 1 }, radius: cameraRadius.current };
    Object.assign(view.eyes, cameraPosition.current);
    Object.assign(view.forward, cameraForward.current);
    const position = cameraState.positions.drone ??= { x: 0, y: 0, z: 0, yaw: 0 };
    model.getWorldPosition(cameraPosition.current);
    Object.assign(position, cameraPosition.current);
    position.yaw = model.rotation.y;
    const pitch = Math.asin(cameraForward.current.y);
    const store = useDroneControlStore.getState();
    if (!store.available || store.pitch !== pitch) useDroneControlStore.setState({ available: true, pitch });
  }, -1);

  return (
    <group ref={modelRef} userData={{ itemName: 'Drone Black Hornet Nano', hornetTour: tourRef.current }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
