import { useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CharacterGroup } from '@features/scene/character';
import type { PreviewPlayback } from '@features/scene/character/characterTypes';
import { SMART_OBJECTS, getSmartObject, buildSmartObjectInstructionSequence } from '@features/scene/ai/smartObjectRegistry';
import { getAnimationDef, getAnimationsByTags } from '@features/scene/animations/animationResolver';
import { toggleObjectAction } from '@features/scene/objectActionRegistry';
import { getObjectTransform } from '@features/scene/objectTransforms';
import type { AgentInstruction } from '@features/scene/ai/aiTypes';
import type { SceneItemProps } from '@shared/types';
import type { SmartActionPreviewRequest } from './InventorySmartActions';
import { PREVIEW_ROTATION_Y } from './previewRegistry';

/** USE_OBJECT instructions inherit defaults from their target slot, like the scene controller. */
export function resolvePreviewInstruction(step: AgentInstruction): AgentInstruction {
  if (step.type !== 'USE_OBJECT') return step;
  const slot = getSmartObject(step.smartObjectId!)?.slots.find(slot => slot.slotId === step.slotId);
  if (!slot) throw new Error(`Slot preview introuvable : ${step.smartObjectId}:${step.slotId}`);
  return {
    animation: slot.animation, duration: slot.duration, repeatCount: slot.repeatCount,
    triggerEventKey: slot.triggerEventKey, triggerEventValue: slot.triggerEventValue,
    ...step,
  };
}

/** Plays interaction steps at the object's local slot, without apartment navigation or events. */
export function SmartActionPreview({ Component, item, actionState, onSize, request }: SceneItemProps & {
  Component: ComponentType<SceneItemProps>;
  request: SmartActionPreviewRequest;
}) {
  const sequence = useMemo(() => {
    const steps = buildSmartObjectInstructionSequence(request.objectId, request.slotId, SMART_OBJECTS[request.objectId].ownerCharacterId ?? request.characterId)
      .filter(step => step.type !== 'MOVE_TO' && step.type !== 'PREPARE_OBJECT')
      .map(resolvePreviewInstruction);
    if (!steps.length) throw new Error(`Aucune séquence preview : ${request.objectId}:${request.slotId}`);
    return steps;
  }, [request.objectId, request.slotId, request.characterId, request.runId]);
  const [index, setIndex] = useState(0);
  const [readyIndex, setReadyIndex] = useState(-1);
  const [objectState, setObjectState] = useState<Record<string, any>>({});
  const step = sequence[index];
  const object = getSmartObject(step.smartObjectId ?? request.objectId)!;
  const slot = object.slots.find(candidate => candidate.slotId === (step.slotId ?? request.slotId))!;
  const origin = getObjectTransform(item.id) ?? getSmartObject(request.objectId)!;
  const rotationY = (PREVIEW_ROTATION_Y[item.id] ?? 0) - (origin.rotationY ?? 0);
  const position = new Vector3(...slot.offset!).sub(new Vector3(...origin.position)).applyAxisAngle(new Vector3(0, 1, 0), rotationY).toArray() as [number, number, number];
  const animation = useMemo(() => {
    if (step.animation) return step.animation;
    const keys = slot.animationsRandom;
    const candidates = (Array.isArray(keys) ? keys : keys ? [keys] : []).flatMap(key => getAnimationDef(key) ?? getAnimationsByTags(key));
    if (keys && !candidates.length) throw new Error(`Animations introuvables : ${keys}`);
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)].id : 'idle';
  }, [step, slot.animationsRandom]);
  const playback = useMemo<PreviewPlayback>(() => ({ time: 0, duration: 0, ready: false, playing: request.playing }), [step]);
  playback.playing = request.playing;
  const elapsed = useRef(0);
  useLayoutEffect(() => {
    elapsed.current = 0;
    if (readyIndex !== index) return;
    if (step.triggerEventKey) setObjectState(state => toggleObjectAction(step.triggerEventKey!, state, step.triggerEventValue ?? !state[step.triggerEventKey!]));
  }, [step, readyIndex, index]);
  const framed = useRef(false);
  useFrame((_, delta) => {
    if (!playback.ready) return;
    if (readyIndex !== index) { setReadyIndex(index); return; }
    if (!framed.current) { framed.current = true; onSize(new Vector3()); }
    if (!request.playing) return;
    const duration = step.waitForAnimation ? playback.duration : step.duration ?? playback.duration * (step.repeatCount ?? 1);
    elapsed.current = Math.min(duration, elapsed.current + delta);
    playback.time = elapsed.current >= duration ? Math.min(duration, playback.duration) : elapsed.current % playback.duration;
    if (elapsed.current >= duration && index < sequence.length - 1) setIndex(index + 1);
  });
  return <group name="SmartActionPreview" userData={{ step: index, animation, characterId: request.characterId, playback }}>
    <Component item={item} isPreview actionState={{ ...actionState, ...objectState, previewPaused: !request.playing }} onSize={onSize} />
    <CharacterGroup isPreview previewCharacterId={request.characterId} characterAnim={animation}
      previewPosition={position} previewRotationY={(step.rotY ?? slot.rotY ?? 0) + rotationY} previewPlayback={playback} />
  </group>;
}
