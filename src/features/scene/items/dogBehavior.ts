import * as THREE from 'three';
import { PITBULL_LIFE_CLIPS, DOG_PAUSES, DOG_ONE_SHOTS, DOG_LYING_ACTIONS, type DogAction } from './dogLifeClips';
export type { DogAction } from './dogLifeClips';
import { SpatialZoneManager } from '../ai/SpatialZone';
import { randomReachableTarget, getNavigationGraph, followRoute, resetRoute, createRouteState } from '../ai/navigation/service';
import { getWalkableGroundY } from '../ai/navigation/groundElevation';
import { getAgentProfile } from '../ai/navigation/obstacles';
import { computeSteeringVector, computeRotYStep, reserveAgentDestination, isAgentDestinationFree } from '../ai/agent/agentAvoidance';
import { appLog } from '@features/ui/AppConsole';
import { dogFeedingStation } from './dogBowlData';
import { NavigationScope, navigationValue } from '../ai/navigation/navigationScope';
import { SubjectDriver } from '../camera/subjectControls';

export const DOG_ACTIVITY = {
  walkChance: 0.8, localTripChance: 0.8,
  runSpeed: 120, turnSpeed: Math.PI,
  fadeSeconds: 0.25, minRestCycles: 2, maxRestCycles: 4, minStaticPoseSeconds: 3,
  restWeight: 4, oneOffWeight: 1, sniffChance: 0.5,
  minMealInterval: 120, maxMealInterval: 240, mealRetrySeconds: 30, mealCycles: 3,
} as const;
export const DOG_WALK_SPEED = { shiba: 50 } as const;
export const DOG_CLIPS = { shiba: PITBULL_LIFE_CLIPS };
export const mealInterval = () => THREE.MathUtils.lerp(DOG_ACTIVITY.minMealInterval, DOG_ACTIVITY.maxMealInterval, Math.random());
export function createDogBehavior() {
  return {
    position: new THREE.Vector3(), target: new THREE.Vector3(), local: new THREE.Vector3(),
    navigation: new NavigationScope(),
    rotation: new THREE.Quaternion(), euler: new THREE.Euler(0, 0, 0, 'YXZ'), route: createRouteState(),
    autonomous: true, mode: 'rest' as 'rest' | 'move' | 'meal-approach' | 'meal-align' | 'eat',
    action: 'idle' as DogAction, lastPause: 'idle' as DogAction,
    remaining: 0, mealRemaining: mealInterval(), gait: 'walk' as 'walk' | 'run' | 'sniff',
    driver: null as SubjectDriver | null, controlAction: null as 'jump' | 'rest' | null, controlRemaining: 0,
  };
}
export type DogBehavior = ReturnType<typeof createDogBehavior>;
export interface DogContext {
  id: string;
  walkSpeed?: number;
  canWalk?: boolean;
  canSniff?: boolean;
  lieTransitions?: boolean;
  pauses?: DogAction[];
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
export function updateDogControl(state: DogBehavior, context: DogContext, delta: number): boolean {
  const driver = state.driver ??= new SubjectDriver(context.id);
  driver.step(context.root, delta, (context.walkSpeed ?? DOG_WALK_SPEED[context.id as keyof typeof DOG_WALK_SPEED]));
  if (driver.started) { releaseDogRoute(state, context.id); state.autonomous = false; state.controlAction = null; }
  if (driver.active) {
    if (driver.action) {
      state.controlAction = state.action = driver.action;
      state.controlRemaining = context.play(driver.action, true);
    } else {
      if (state.controlAction === 'jump') {
        state.controlRemaining -= delta;
        if (state.controlRemaining <= 0) state.controlAction = null;
      }
      if (driver.moving) state.controlAction = null;
      const action = state.controlAction ?? (driver.moving ? 'walk' : 'idle');
      if (state.action !== action || driver.started) { state.action = action; context.play(action); }
    }
    context.root.getWorldPosition(state.position);
    return true;
  }
  if (driver.resumed) { context.root.getWorldPosition(state.position); resumeDogBehavior(state, context); }
  return false;
}
export function startDogPause(state: DogBehavior, context: DogContext) {
  releaseDogRoute(state, context.id);
  const choices = DOG_PAUSES.map(action => ({ action, weight: action === 'idle' || action === 'rest' ? DOG_ACTIVITY.restWeight : DOG_ACTIVITY.oneOffWeight }));
  const available = choices.filter(choice => (!context.pauses || context.pauses.includes(choice.action)) && (context.pauses?.length === 1 || choice.action !== state.lastPause));
  if (!available.length) throw new Error(`No available pause for ${context.id}`);
  let draw = Math.random() * available.reduce((sum, choice) => sum + choice.weight, 0);
  const choice = available.find(choice => (draw -= choice.weight) < 0)!;
  state.action = state.lastPause = choice.action;
  state.mode = 'rest';
  if (DOG_LYING_ACTIONS.includes(choice.action) && context.lieTransitions) state.action = 'layDown';
  const once = DOG_ONE_SHOTS.includes(state.action) || state.action === 'rest' || (DOG_LYING_ACTIONS.includes(state.action) && !context.lieTransitions);
  const duration = context.play(state.action, once);
  const cycles = DOG_ONE_SHOTS.includes(state.action) || state.action === 'bedLay' || state.action === 'sleep'
    ? 1
    : THREE.MathUtils.randInt(DOG_ACTIVITY.minRestCycles, DOG_ACTIVITY.maxRestCycles);
  state.remaining = state.action === 'rest' ? Math.max(duration * cycles, DOG_ACTIVITY.minStaticPoseSeconds) : duration * cycles;
}
export function startDogTrip(state: DogBehavior, context: DogContext, target: { x: number; z: number }, gait: 'walk' | 'run' | 'sniff', meal = false) {
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
    state.position.y = getWalkableGroundY(state.position.x, state.position.z);
    root.position.copy(root.parent!.worldToLocal(state.local.copy(state.position)));
    state.remaining -= delta;
    if (state.remaining > 0) return;
    if (state.action === 'layDown') {
      const lyingAction: DogAction = DOG_LYING_ACTIONS.includes(state.lastPause) ? state.lastPause : 'lie';
      state.action = lyingAction;
      const duration = context.play(lyingAction);
      const cycles = lyingAction === 'lie' ? THREE.MathUtils.randInt(DOG_ACTIVITY.minRestCycles, DOG_ACTIVITY.maxRestCycles) : 1;
      state.remaining = lyingAction === 'lie' ? Math.max(duration * cycles, DOG_ACTIVITY.minStaticPoseSeconds) : duration * cycles;
      return;
    }
    if (DOG_LYING_ACTIONS.includes(state.action) && context.lieTransitions) {
      state.action = 'getUp'; state.remaining = context.play('getUp', true); return;
    }
    if (DOG_ONE_SHOTS.includes(state.action)) { startDogPause(state, context); return; }
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
    if (target) startDogTrip(state, context, target, context.canWalk !== false && Math.random() < DOG_ACTIVITY.walkChance ? context.canSniff && Math.random() < DOG_ACTIVITY.sniffChance ? 'sniff' : 'walk' : 'run');
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
  const speed = state.gait !== 'run' ? (context.walkSpeed ?? DOG_WALK_SPEED[id as keyof typeof DOG_WALK_SPEED]) : DOG_ACTIVITY.runSpeed;
  const next = followRoute(state.route, id, before, state.target, speed * delta, (direction, remaining) => {
    const steer = computeSteeringVector(id, before.x, before.z, direction.x, direction.z, remaining);
    return { x: steer.steerX, z: steer.steerZ };
  });
  // Authoritative world coordinates must never round-trip through the rotated parent.
  state.position.set(next.x, getWalkableGroundY(next.x, next.z), next.z);
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
