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

const GLB_PATH = '/items/black-hornet/black-hornet.glb';
const TARGET_LENGTH_CM = 16.8; // Longueur réelle du nano-drone Black Hornet (environ 16,8 cm)

// Waypoints 3D (X, Y, Z en cm) pour le vol dans le studio et le jardin
export interface DroneWaypoint {
  room: 'garden' | 'living' | 'kitchen' | 'bathroom' | 'corridor';
  label: string;
  pos: THREE.Vector3;
  hoverTime: number; // temps d'observation stationnaire en secondes
}

const FLIGHT_WAYPOINTS: DroneWaypoint[] = [
  // 1. Jardin & Terrasse
  { room: 'garden', label: 'Pelouse Jardin', pos: new THREE.Vector3(120, 140, -250), hoverTime: 15 },
  { room: 'garden', label: 'Terrasse Extérieure', pos: new THREE.Vector3(220, 145, -120), hoverTime: 12.5 },
  { room: 'garden', label: 'Abords Mangeoire Oiseaux', pos: new THREE.Vector3(60, 155, -320), hoverTime: 15 },
  
  // Transit Baie vitrée
  { room: 'living', label: 'Seuil Baie Vitrée', pos: new THREE.Vector3(150, 140, -10), hoverTime: 5 },
  
  // 2. Salon / Séjour
  { room: 'living', label: 'Centre Salon', pos: new THREE.Vector3(160, 150, 150), hoverTime: 15 },
  { room: 'living', label: 'Espace Bureau & Écrans', pos: new THREE.Vector3(260, 135, 90), hoverTime: 17.5 },
  { room: 'living', label: 'Zone Canapé', pos: new THREE.Vector3(90, 140, 110), hoverTime: 12.5 },
  { room: 'living', label: 'Alcôve & Espace Lit', pos: new THREE.Vector3(70, 145, 290), hoverTime: 15 },

  // 3. Cuisine
  { room: 'kitchen', label: 'Plan de travail Cuisine', pos: new THREE.Vector3(65, 140, 420), hoverTime: 17.5 },
  { room: 'kitchen', label: 'Évier & Table de cuisson', pos: new THREE.Vector3(110, 145, 410), hoverTime: 12.5 },

  // Transit Couloir
  { room: 'corridor', label: 'Porte Couloir', pos: new THREE.Vector3(235, 150, 410), hoverTime: 7.5 },
  
  // 4. Couloir d'entrée
  { room: 'corridor', label: 'Couloir Entrée', pos: new THREE.Vector3(245, 150, 500), hoverTime: 12.5 },
  { room: 'corridor', label: 'Entrée Principale', pos: new THREE.Vector3(240, 145, 590), hoverTime: 15 },

  // 5. Salle de bain
  { room: 'bathroom', label: 'Entrée Salle de bain', pos: new THREE.Vector3(155, 145, 490), hoverTime: 10 },
  { room: 'bathroom', label: 'Miroir & Vasque', pos: new THREE.Vector3(95, 140, 530), hoverTime: 17.5 },
  { room: 'bathroom', label: 'Zone Douche', pos: new THREE.Vector3(60, 150, 620), hoverTime: 15 },
  
  // Retour Salon via couloir
  { room: 'corridor', label: 'Retour Couloir', pos: new THREE.Vector3(235, 150, 450), hoverTime: 5 },
  { room: 'living', label: 'Survol Séjour', pos: new THREE.Vector3(170, 155, 230), hoverTime: 10 },
];

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

  // État de vol autonome
  const currentWaypointIdx = useRef(0);
  const hoverTimer = useRef(0);
  const flightState = useRef<'hovering' | 'flying' | 'landed' | 'manual' | 'holding'>('flying');
  const targetRoomFilter = useRef<string | null>(null);

  // Vecteurs temporaires de vol pour zéro garbage collection
  const currentPos = useRef(new THREE.Vector3(120, 140, -250));
  const targetPos = useRef(new THREE.Vector3(120, 140, -250));
  const moveDirection = useRef(new THREE.Vector3());
  const lookQuaternion = useRef(new THREE.Quaternion());
  const targetQuaternion = useRef(new THREE.Quaternion());

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
      const startWp = FLIGHT_WAYPOINTS[0];
      currentPos.current.copy(startWp.pos);
      targetPos.current.copy(startWp.pos);
      modelRef.current.position.copy(startWp.pos);
      hoverTimer.current = startWp.hoverTime;
      flightState.current = 'hovering';
      playAnimation('Drone_Hover');
    }

    invalidate();

    return () => {
      if (!isPreview) {
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

      if (key === 'drone-patrol-all') {
        useDroneControlStore.getState().setPiloting(false);
        targetRoomFilter.current = null;
        flightState.current = 'flying';
        targetPos.current.copy(FLIGHT_WAYPOINTS[currentWaypointIdx.current].pos);
        playAnimation('Drone_Fly');
        appLog('drone', 'Mode patrouille générale activé : visite de tout le studio et du jardin.');
      } else if (key.startsWith('drone-goto-')) {
        useDroneControlStore.getState().setPiloting(false);
        const room = key.replace('drone-goto-', '');
        targetRoomFilter.current = room;
        const candidateIdx = FLIGHT_WAYPOINTS.findIndex(w => w.room === room);
        if (candidateIdx >= 0) {
          currentWaypointIdx.current = candidateIdx;
          targetPos.current.copy(FLIGHT_WAYPOINTS[candidateIdx].pos);
          flightState.current = 'flying';
          playAnimation('Drone_Fly');
          appLog('drone', `En route vers la pièce : ${FLIGHT_WAYPOINTS[candidateIdx].label}`);
        }
      } else if (key === 'drone-toggle-land') {
        useDroneControlStore.getState().setPiloting(false);
        if (flightState.current === 'landed') {
          flightState.current = 'flying';
          playAnimation('Drone_Fly');
          appLog('drone', 'Décollage du Black Hornet.');
        } else {
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
      if (keys.has('Alt')) {
        const turn = Math.PI / 2 * delta; // 90°/s, indépendamment de la répétition clavier.
        droneInput.yaw += (Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'))) * turn;
        droneInput.pitch = THREE.MathUtils.clamp(droneInput.pitch + (Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown'))) * turn, -Math.PI / 2, Math.PI / 2);
      }
      const speed = useDroneControlStore.getState().speed * (droneInput.keys.has('Shift') ? 3 : 1);
      droneMovement(droneInput.keys, droneInput.yaw, droneInput.pitch, moveDirection.current);
      model.position.addScaledVector(moveDirection.current, speed * delta);
      model.rotation.set(0, droneInput.yaw, 0);
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

    // Gestion du vol et waypoints
    const wp = FLIGHT_WAYPOINTS[currentWaypointIdx.current];

    if (flightState.current === 'hovering') {
      hoverTimer.current -= delta;
      
      // Micro-oscillations aérodynamiques stationnaires
      const time = performance.now() * 0.003;
      model.position.x = wp.pos.x + Math.sin(time * 1.5) * 1.2;
      model.position.y = wp.pos.y + Math.cos(time * 2.0) * 1.5;
      model.position.z = wp.pos.z + Math.sin(time * 1.2) * 1.2;

      if (hoverTimer.current <= 0) {
        // Sélectionner le prochain waypoint
        let nextIdx = (currentWaypointIdx.current + 1) % FLIGHT_WAYPOINTS.length;
        if (targetRoomFilter.current) {
          const roomIndices = FLIGHT_WAYPOINTS
            .map((w, i) => (w.room === targetRoomFilter.current ? i : -1))
            .filter(i => i !== -1);
          if (roomIndices.length > 0) {
            const curInRoom = roomIndices.indexOf(currentWaypointIdx.current);
            nextIdx = roomIndices[(curInRoom + 1) % roomIndices.length];
          }
        }
        currentWaypointIdx.current = nextIdx;
        targetPos.current.copy(FLIGHT_WAYPOINTS[nextIdx].pos);
        flightState.current = 'flying';
        playAnimation('Drone_Fly');
      }
    } else if (flightState.current === 'flying') {
      const flightSpeed = 160 * delta; // vitesse de vol ~1,60 m/s
      moveDirection.current.subVectors(targetPos.current, model.position);
      const dist = moveDirection.current.length();

      if (dist <= flightSpeed) {
        model.position.copy(targetPos.current);
        flightState.current = 'hovering';
        hoverTimer.current = wp.hoverTime;
        playAnimation(wp.room === 'bathroom' || wp.room === 'kitchen' ? 'Drone_Scan' : 'Drone_Hover');
        appLog('drone', `Arrivé à : ${wp.label} (${wp.room})`);
      } else {
        moveDirection.current.normalize();
        model.position.addScaledVector(moveDirection.current, flightSpeed);

        // Rotation et inclinaison dynamique vers la trajectoire
        const forwardVector = moveDirection.current.clone();
        forwardVector.y = 0;
        if (forwardVector.lengthSq() > 0.001) {
          forwardVector.normalize();
          // Orientation principale
          lookQuaternion.current.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forwardVector);

          // Inclinaison (Pitch) vers l'avant selon la vitesse verticale et horizontale
          const pitchAngle = 0.12; // légère inclinaison vers le bas en avançant
          // Roulis (Bank / Roll) lors des virages
          const currentYaw = model.rotation.y;
          const targetYaw = Math.atan2(forwardVector.x, forwardVector.z);
          let yawDiff = targetYaw - currentYaw;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          const bankAngle = THREE.MathUtils.clamp(-yawDiff * 1.5, -0.35, 0.35);

          const tiltEuler = new THREE.Euler(pitchAngle, 0, bankAngle, 'YXZ');
          targetQuaternion.current.copy(lookQuaternion.current).multiply(new THREE.Quaternion().setFromEuler(tiltEuler));
          model.quaternion.slerp(targetQuaternion.current, delta * 6);
        }
      }
    }

  }, -2);

  // Le nez animé est publié avant le calcul caméra, sans retard d'une frame.
  useFrame(() => {
    const model = modelRef.current;
    if (isPreview || !model || !cameraBone.current) return;
    cameraPosition.current.copy(cameraMount.current);
    cameraBone.current.localToWorld(cameraPosition.current);
    if (flightState.current === 'manual' || flightState.current === 'holding') {
      cameraForward.current.set(Math.sin(droneInput.yaw) * Math.cos(droneInput.pitch), Math.sin(droneInput.pitch), Math.cos(droneInput.yaw) * Math.cos(droneInput.pitch));
    } else {
      model.getWorldDirection(cameraForward.current);
    }
    const view = cameraState.animalViews.drone ??= { eyes: { x: 0, y: 0, z: 0 }, forward: { x: 0, y: 0, z: 1 }, radius: cameraRadius.current };
    Object.assign(view.eyes, cameraPosition.current);
    Object.assign(view.forward, cameraForward.current);
    const position = cameraState.positions.drone ??= { x: 0, y: 0, z: 0, yaw: 0 };
    model.getWorldPosition(cameraPosition.current);
    Object.assign(position, cameraPosition.current);
    position.yaw = model.rotation.y;
    if (!useDroneControlStore.getState().available) useDroneControlStore.setState({ available: true });
  }, -1);

  return (
    <group ref={modelRef} userData={{ itemName: 'Drone Black Hornet Nano' }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
