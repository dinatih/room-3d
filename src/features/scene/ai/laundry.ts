import { create } from 'zustand';
import { getAnimationDef } from '../animations/animationResolver';
import type { AgentInstruction } from './aiTypes';

export const LAUNDRY_CLOSET = { smartObjectId: 'sdb-closet', slotId: 'pick-laundry' };
export const LAUNDRY_POINT = { smartObjectId: 'building-b-garden', slotId: 'laundromat' };
const LIVING_POINT = { smartObjectId: 'laundry-living', slotId: 'sort' };
export const isLaundryAction = (id?: string, slot?: string) =>
  [LAUNDRY_CLOSET, LAUNDRY_POINT].some(point => point.smartObjectId === id && point.slotId === slot);

export type LaundryEvent = 'carry' | 'drop' | 'wash' | 'dry' | 'finish';
export type LaundryStage = 'load' | 'transfer' | 'collect';
export const useLaundry = create<{
  owner: string | null;
  bag: 'hook' | 'hand' | 'floor';
  floor: [number, number, number];
}>(() => ({ owner: null, bag: 'hook', floor: [0, 0, 0] }));

export function laundrySteps(stage: LaundryStage, closet: AgentInstruction[]): AgentInstruction[] {
  const move = (point: typeof LAUNDRY_POINT): AgentInstruction => ({ ...point, type: 'MOVE_TO' });
  const gesture = (point: typeof LAUNDRY_POINT, animation: string, laundryEvent?: LaundryEvent): AgentInstruction => {
    const duration = getAnimationDef(animation)?.duration;
    if (!duration) throw new Error(`Animation de lessive introuvable : ${animation}`);
    return { ...point, type: 'USE_OBJECT', animation, duration, laundryEvent };
  };
  const floorGesture = 'pickup-box-floor-female';
  const loadGesture = 'kit-1229-take-book-from-shelf-right-arm-01-poses';
  const hook = (event: LaundryEvent) => closet.map(step =>
    step.type === 'USE_OBJECT' ? { ...step, laundryEvent: event } : step);
  const steps: AgentInstruction[] = stage === 'load' ? [
    ...hook('carry'), move(LAUNDRY_POINT),
    gesture(LAUNDRY_POINT, floorGesture, 'drop'), gesture(LAUNDRY_POINT, loadGesture, 'wash'),
  ] : stage === 'transfer' ? [
    move(LAUNDRY_POINT), gesture(LAUNDRY_POINT, floorGesture),
    gesture(LAUNDRY_POINT, loadGesture, 'dry'),
  ] : [
    move(LAUNDRY_POINT), gesture(LAUNDRY_POINT, loadGesture),
    gesture(LAUNDRY_POINT, floorGesture, 'carry'), move(LIVING_POINT),
    gesture(LIVING_POINT, floorGesture, 'drop'),
    { ...LIVING_POINT, type: 'USE_OBJECT', animation: 'kit-1229-take-book-from-shelf-right-arm-02-poses', duration: 10 },
    gesture(LIVING_POINT, floorGesture, 'carry'), ...hook('finish'),
  ];
  return steps.map(step => ({ ...step, laundryStep: true }));
}
