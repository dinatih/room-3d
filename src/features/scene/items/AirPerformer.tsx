import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { isHomeAssistantLinked, useHomeAssistant } from '../../home-assistant/connection';
import { applianceValue } from '../../home-assistant/appliances';
import { AIR_PERFORMER_ACTION_IDS, AIR_PERFORMER_CONTROLS } from '../../home-assistant/airPerformer';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/philips-amf870/philips-amf870.glb';
// Visual sweep rate, independent of ventilation speed. HA reports the arc, not motor position.
const SWEEP_RADIANS_PER_SECOND = Math.PI / 12;

export function AirPerformer({ onSize, actionState = {}, isPreview = false, remoteDocked = true }: Partial<Omit<SceneItemProps, 'item'>> & { remoteDocked?: boolean }) {
  const { scene } = useGLTFClone(GLB);
  const { invalidate } = useThree();
  const local = useFurnitureToggles(AIR_PERFORMER_ACTION_IDS);
  const ha = useHomeAssistant();
  const remote = !isPreview && isHomeAssistantLinked(ha);
  const values = isPreview ? actionState : remote ? Object.fromEntries(AIR_PERFORMER_ACTION_IDS.map(id => [id, applianceValue(id, ha.entities[AIR_PERFORMER_CONTROLS[id].entity])])) : local;
  const value = (id: keyof typeof AIR_PERFORMER_CONTROLS) => values[id] ?? (remote ? undefined : AIR_PERFORMER_CONTROLS[id].initialValue);
  const power = value('airPerformerPower') === true;
  const arc = Number(value('airPerformerOscillation') ?? 0);
  const mode = value('airPerformerMode');
  const preset = value('airPerformerPreset');
  const speed = value('airPerformerSpeed');
  const temperature = value('airPerformerTemperature');
  const timer = value('airPerformerTimer');
  const groupRef = useRef<THREE.Group>(null!);
  const direction = useRef(1);

  useEffect(() => { invalidate(); }, [actionState, local, ha.entities, invalidate]);
  useEffect(() => {
    if (isPreview || remote || !power || timer === 'Off') return;
    const duration = timer === '30min' ? 30 * 60 : Number(String(timer).replace('h', '')) * 3600;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Minuterie Air Performer invalide : ${timer}`);
    const timeout = window.setTimeout(() => useSceneStore.getState().triggerAction('airPerformerPower', false, 'user'), duration * 1000);
    return () => window.clearTimeout(timeout);
  }, [isPreview, remote, power, timer]);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const remoteObj = scene.getObjectByName('RemoteControl');
    if (!remoteObj) throw new Error('AirPerformer: missing RemoteControl');
    remoteObj.visible = isPreview || remoteDocked;
    remoteObj.userData.hoverAction = { label: 'Télécommande Air Performer', actions: getObjectActionIds('air-performer-remote') };
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, isPreview, remoteDocked, onSize]);

  useFrame((_, dt) => {
    if (!power || arc === 0 || (isPreview && actionState.previewPaused)) return;
    const halfArc = THREE.MathUtils.degToRad(arc) / 2;
    const angle = THREE.MathUtils.clamp(groupRef.current.rotation.y, -halfArc, halfArc);
    // Triangle wave keeps a constant angular speed and handles frames crossing a turnaround.
    const phase = ((direction.current > 0 ? angle + halfArc : 3 * halfArc - angle) + dt * SWEEP_RADIANS_PER_SECOND) % (4 * halfArc);
    direction.current = phase < 2 * halfArc ? 1 : -1;
    groupRef.current.rotation.y = phase < 2 * halfArc ? phase - halfArc : 3 * halfArc - phase;
    invalidate();
  });

  const pm25 = remote ? ha.entities['sensor.living_room_pm2_5']?.state ?? '—' : '—';
  return <group userData={{ hoverAction: {
    label: `Air Performer · ${power ? `${mode ?? '—'} · ${preset ?? 'manuel'} · vitesse ${speed ?? '—'}/10 · ${arc}°${mode === 'heating' ? ` · cible ${temperature ?? '—'} °C` : ''} · PM2.5 ${pm25}` : 'Éteint'}`,
    actions: getObjectActionIds('air-performer'),
  } }}>
    <group ref={groupRef}><primitive object={scene} /></group>
  </group>;
}

useGLTF.preload(GLB);
