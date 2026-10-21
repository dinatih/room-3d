import * as THREE from 'three';
import { SpatialZoneManager } from '../ai/SpatialZone';
import { randomReachableTarget, getNavigationGraph, followRoute, resetRoute, createRouteState } from '../ai/navigation/service';
import { getAgentProfile } from '../ai/navigation/obstacles';
import { computeSteeringVector, computeRotYStep, reserveAgentDestination, isAgentDestinationFree } from '../ai/agent/agentAvoidance';
import { appLog } from '@features/ui/AppConsole';
import { dogFeedingStation } from './dogBowlData';
import { NavigationScope, navigationValue } from '../ai/navigation/navigationScope';

export const DOG_ACTIVITY = {
  walkChance: 0.8, localTripChance: 0.8,
  walkSpeed: 50, runSpeed: 120, turnSpeed: Math.PI,
  fadeSeconds: 0.25, minRestCycles: 2, maxRestCycles: 4,
  restWeight: 4, jumpWeight: 1,
  minMealInterval: 120, maxMealInterval: 240, mealRetrySeconds: 30, mealCycles: 3,
} as const;
export const DOG_CLIPS = {
  shiba: { idle: 'Dog|Idle', rest: 'Dog|SitDown', walk: 'Dog|Walk', run: 'Dog|Run', jump: 'Dog|Jump' },
  ulotte: { idle: 'idle-1', rest: 'idle-2', walk: 'walk', run: 'run', jump: 'jump', eat: 'eating' },
};
export type DogAction = 'idle' | 'rest' | 'walk' | 'run' | 'jump' | 'eat';
export const mealInterval = () => THREE.MathUtils.lerp(DOG_ACTIVITY.minMealInterval, DOG_ACTIVITY.maxMealInterval, Math.random());
export function createDogBehavior() {
  return {
    position: new THREE.Vector3(), target: new THREE.Vector3(), local: new THREE.Vector3(),
    navigation: new NavigationScope(),
    rotation: new THREE.Quaternion(), euler: new THREE.Euler(0, 0, 0, 'YXZ'), route: createRouteState(),
    autonomous: true, mode: 'rest' as 'rest' | 'move' | 'meal-approach' | 'meal-align' | 'eat',
    action: 'idle' as DogAction, lastPause: 'idle' as DogAction,
    remaining: 0, mealRemaining: mealInterval(), gait: 'walk' as 'walk' | 'run',
  };
}
export type DogBehavior = ReturnType<typeof createDogBehavior>;
export interface DogContext {
  id: 'shiba' | 'ulotte';
  root: THREE.Group;
  play: (action: DogAction, once?: boolean) => number;
  // Museau dans le repère du chien, mesuré à mi-parcours du clip de repas.
  eatingMuzzle?: THREE.Vector3;
}
export function releaseDogRoute(state: DogBehavior, id: string) {
  state.navigation.clear();
  resetRoute(state.route, id);
  reserveAgentDestination(id, null);
}
export function resumeDogBehavior(state: DogBehavior, context: DogContext) {
  releaseDogRoute(state, context.id);
  state.autonomous = true;
  state.mode = 'rest';
  state.action = 'idle';
  state.lastPause = 'idle';
  state.remaining = context.play('idle') * DOG_ACTIVITY.minRestCycles;
}
export function startDogPause(state: DogBehavior, context: DogContext) {
  releaseDogRoute(state, context.id);
  const choices: { action: DogAction; weight: number }[] = [
    { action: 'idle', weight: DOG_ACTIVITY.restWeight },
    { action: 'rest', weight: DOG_ACTIVITY.restWeight },
    { action: 'jump', weight: DOG_ACTIVITY.jumpWeight },
  ];
  const available = choices.filter(choice => choice.action !== state.lastPause);
  let draw = Math.random() * available.reduce((sum, choice) => sum + choice.weight, 0);
  const choice = available.find(choice => (draw -= choice.weight) < 0)!;
  state.action = state.lastPause = choice.action;
  state.mode = 'rest';
  const duration = context.play(choice.action, choice.action === 'jump' || (context.id === 'shiba' && choice.action === 'rest'));
  const cycles = choice.action === 'jump' ? 1 : THREE.MathUtils.randInt(DOG_ACTIVITY.minRestCycles, DOG_ACTIVITY.maxRestCycles);
  state.remaining = duration * cycles;
}
export function startDogTrip(state: DogBehavior, context: DogContext, target: { x: number; z: number }, gait: 'walk' | 'run', meal = false) {
  releaseDogRoute(state, context.id);
  state.target.set(target.x, state.position.y, target.z);
  reserveAgentDestination(context.id, target);
  state.mode = meal ? 'meal-approach' : 'move';
  state.gait = gait;
  state.action = gait;
  context.play(gait);
}
function pickDestination(state: DogBehavior, id: string) {
  const zone = SpatialZoneManager.getZoneAt(state.position);
  if (!zone || navigationValue('dog-local-trip', () => Math.random()) >= DOG_ACTIVITY.localTripChance) return randomReachableTarget(id, state.position);
  const target = navigationValue('dog-target', () => ({
    x: THREE.MathUtils.lerp(zone.bounds.min[0], zone.bounds.max[0], Math.random()),
    z: THREE.MathUtils.lerp(zone.bounds.min[2], zone.bounds.max[2], Math.random()),
  }));
  return isAgentDestinationFree(id, target) && getNavigationGraph(getAgentProfile(id)).canReach(state.position, target) ? target : null;
}
function postponeMeal(state: DogBehavior, context: DogContext) {
  state.mealRemaining = DOG_ACTIVITY.mealRetrySeconds;
  startDogPause(state, context);
}
export function updateDogBehavior(state: DogBehavior, context: DogContext, delta: number) {
  state.navigation.poll(() => advanceDogBehavior(state, context, delta));
}
function advanceDogBehavior(state: DogBehavior, context: DogContext, delta: number) {
  if (!state.autonomous) return;
  const { root, id } = context;
  if (context.eatingMuzzle) state.mealRemaining -= delta;
  root.getWorldQuaternion(state.rotation);
  const yaw = state.euler.setFromQuaternion(state.rotation).y;
  if (state.mode === 'rest') {
    state.remaining -= delta;
    if (state.remaining > 0) return;
    if (state.action === 'jump') { startDogPause(state, context); return; }
    const station = dogFeedingStation.position;
    if (context.eatingMuzzle && station && state.mealRemaining <= 0) {
      // Arrivée orientée vers +Z : le museau doit tomber au centre de la gamelle.
      const target = { x: station.x - context.eatingMuzzle.x, z: station.z - context.eatingMuzzle.z };
      if (!isAgentDestinationFree(id, target) || !getNavigationGraph(getAgentProfile(id)).canReach(state.position, target)) {
        postponeMeal(state, context);
        return;
      }
      startDogTrip(state, context, target, 'walk', true);
      return;
    }
    const target = pickDestination(state, id);
    if (target) startDogTrip(state, context, target, Math.random() < DOG_ACTIVITY.walkChance ? 'walk' : 'run');
    return;
  }
  if (state.mode === 'eat') {
    state.remaining -= delta;
    if (state.remaining <= 0) { state.mealRemaining = mealInterval(); startDogPause(state, context); }
    return;
  }
  if (state.mode === 'meal-align') {
    if (!dogFeedingStation.position || !isAgentDestinationFree(id, state.target)) { postponeMeal(state, context); return; }
    // Une rotation bornée termine exactement à zéro pour déclencher le repas.
    const turn = Math.atan2(Math.sin(-yaw), Math.cos(-yaw));
    const step = Math.sign(turn) * Math.min(Math.abs(turn), DOG_ACTIVITY.turnSpeed * delta);
    root.rotation.y += step;
    if (Math.abs(turn) <= DOG_ACTIVITY.turnSpeed * delta) {
      state.mode = 'eat'; state.action = 'eat';
      state.remaining = context.play('eat') * DOG_ACTIVITY.mealCycles;
    }
    return;
  }
  const meal = state.mode === 'meal-approach';
  if (meal && (!dogFeedingStation.position || !isAgentDestinationFree(id, state.target))) { postponeMeal(state, context); return; }
  const before = { x: state.position.x, z: state.position.z };
  const speed = state.gait === 'walk' ? DOG_ACTIVITY.walkSpeed : DOG_ACTIVITY.runSpeed;
  const next = followRoute(state.route, id, before, state.target, speed * delta, (direction, remaining) => {
    const steer = computeSteeringVector(id, before.x, before.z, direction.x, direction.z, remaining);
    return { x: steer.steerX, z: steer.steerZ };
  });
  // Authoritative world coordinates must never round-trip through the rotated parent.
  state.position.set(next.x, state.position.y, next.z);
  root.position.copy(root.parent!.worldToLocal(state.local.copy(state.position)));
  if (next.x !== before.x || next.z !== before.z) {
    if (state.action !== state.gait) { state.action = state.gait; context.play(state.gait); }
    root.rotation.y += computeRotYStep(yaw, Math.atan2(next.x - before.x, next.z - before.z), DOG_ACTIVITY.turnSpeed, delta) - yaw;
  }
  if (next.x === before.x && next.z === before.z && (next.x !== state.target.x || next.z !== state.target.z) && state.action !== 'idle') {
    state.action = 'idle'; context.play('idle');
  }
  if (state.route.error) {
    appLog(id, `⚠️ Navigation : ${state.route.error}`);
    if (meal) postponeMeal(state, context); else startDogPause(state, context);
    return;
  }
  if (next.x === state.target.x && next.z === state.target.z) {
    if (meal) {
      state.mode = 'meal-align'; state.action = 'idle'; context.play('idle');
    } else startDogPause(state, context);
  }
}

/** Only autonomous transitions fade; the inventory keeps its exact timeline. */
export function transitionDogAction(mixer: THREE.AnimationMixer, clip: THREE.AnimationClip, previous: THREE.AnimationAction | null, once = false) {
  if (!clip || clip.duration <= 0) throw new Error('Invalid dog animation');
  const next = mixer.clipAction(clip);
  next.reset().stopFading().setEffectiveWeight(1).setEffectiveTimeScale(1);
  next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
  next.clampWhenFinished = once;
  next.play();
  if (previous && previous !== next) {
    previous.stopFading().fadeOut(DOG_ACTIVITY.fadeSeconds);
    next.fadeIn(DOG_ACTIVITY.fadeSeconds);
  }
  return next;
}
