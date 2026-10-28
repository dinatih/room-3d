/**
 * AirPerformer.tsx — Philips Air Performer AMF870/15 (32.5×32.5×106.4cm).
 * Modèle GLB avec oscillation et télécommande séparable.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import { getNextActionValue } from '../objectActionRegistry';
import { isHomeAssistantLinked, useHomeAssistant } from '../../home-assistant/connection';
import { entityAvailable } from '../../home-assistant/appliances';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/philips-amf870/philips-amf870.glb';

export function AirPerformer({ onSize, actionState = {}, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene } = useGLTFClone(GLB);
  const { invalidate } = useThree();

  const [scenePower, setPower] = useState(false);
  const [sceneOscillating, setOscillating] = useState(true);
  const [sceneMode, setMode] = useState<string>('auto');
  const [sceneSpeed, setSpeed] = useState(5);
  const [pm25, setPm25] = useState(8);
  const power = isPreview ? !!actionState.airPerformerPower : scenePower;
  const oscillating = isPreview ? !!(actionState.airPerformerOscillation ?? true) : sceneOscillating;
  const mode = isPreview ? actionState.airPerformerMode ?? 'auto' : sceneMode;
  const speed = isPreview ? actionState.airPerformerSpeed ?? 5 : sceneSpeed;

  const groupRef = useRef<THREE.Group>(null!);
  const oscAngleRef = useRef(0);

  const remote = useHomeAssistant(state => isHomeAssistantLinked(state) && !isPreview);
  const entities = useHomeAssistant(state => state.entities);

  useEffect(() => {
    if (!remote) return;
    const fan = entities['fan.living_room'];
    if (entityAvailable(fan)) {
      setPower(fan.state === 'on');
      if (typeof fan.attributes.percentage === 'number') setSpeed(fan.attributes.percentage / 10);
    }
    const fn = entities['select.living_room_function'];
    if (entityAvailable(fn)) setMode(fn.state);
    const pm = entities['sensor.living_room_pm2_5'];
    if (entityAvailable(pm) && Number.isFinite(Number(pm.state))) setPm25(Number(pm.state));
    invalidate();
  }, [remote, entities, invalidate]);

  useEffect(() => {
    if (isPreview || remote) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key === 'airPerformerPower') {
        setPower(p => !p);
      } else if (key === 'airPerformerOscillation') {
        setOscillating(o => !o);
      } else if (key === 'airPerformerMode') {
        setMode(m => getNextActionValue(key, m));
      } else if (key === 'airPerformerSpeed') {
        setSpeed(s => getNextActionValue(key, s));
      } else return;
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate, isPreview, remote]);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);

    const remoteObj = scene.getObjectByName('RemoteControl');
    if (remoteObj) {
      remoteObj.visible = !!isPreview;
    }

    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;

    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, isPreview, onSize]);

  useFrame((_, dt) => {
    if (!oscillating || !power) return;
    const oscSpeed = 0.5 + (speed / 10) * 1.5;
    oscAngleRef.current += dt * oscSpeed;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(oscAngleRef.current) * 0.7; // ~40 deg oscillation
      invalidate();
    }
  });

  return (
    <group
      userData={{
        hoverAction: {
          label: power
            ? `Air Performer (ON - Mode ${mode.toUpperCase()}${oscillating ? ' - Oscillant' : ''} - PM2.5: ${Math.round(pm25)} µg/m³)`
            : 'Air Performer (Éteint)',
          actions: getObjectActionIds('air-performer')
        }
      }}
    >
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(GLB);
