import { Vector3, type Group } from 'three';
import { cameraState } from '../cameraState';
import { isFlyingSubject } from './cameraSubjects';
import { HornetSpace } from '../hornetTour';
import { getNavigationGraph } from '../ai/navigation/service';
import { getAgentProfile } from '../ai/navigation/obstacles';
import { limitAgentMovement } from '../ai/agent/agentAvoidance';
import { NavigationScope } from '../ai/navigation/navigationScope';
import { inflate, segmentFree } from '../ai/navigation/geometry';
import { DOOR_CONFIGS, doorCollisionState, doorPolygon } from '../doorObstacles';

export const SUBJECT_RESUME_MS = 12000;
interface SubjectInput { keys: Set<string>; until: number; action: 'jump' | 'rest' | null }
const inputs = new Map<string, SubjectInput>();
export function recordSubjectCommand(id: string, now = performance.now()): SubjectInput {
  let input = inputs.get(id);
  if (!input) { input = { keys: new Set(), until: 0, action: null }; inputs.set(id, input); }
  input.until = now + SUBJECT_RESUME_MS;
  return input;
}
export function setSubjectInput(id: string, key: string, pressed: boolean, now = performance.now()): void {
  const input = recordSubjectCommand(id, now);
  if (pressed && !input.keys.has(key) && (id === 'shiba' || id === 'ulotte')) {
    if (key === 'character:Elevate') input.action = 'jump';
    if (key === 'character:Descend') input.action = 'rest';
  }
  input.keys[pressed ? 'add' : 'delete'](key);
}
export function readSubjectInput(id: string, now = performance.now()): SubjectInput | null {
  const input = inputs.get(id);
  if (!input) return null;
  if (input.keys.size || now < input.until) return input;
  inputs.delete(id);
  return null;
}
export function releaseSubjectInputs(now = performance.now()): void {
  for (const [id, input] of inputs) if (input.keys.size) { input.keys.clear(); recordSubjectCommand(id, now); }
}

/** Shared takeover clock and collision-checked body movement; each actor keeps its own AI. */
export class SubjectDriver {
  action: 'jump' | 'rest' | null = null;
  active = false;
  started = false;
  resumed = false;
  moving = false;
  private position = new Vector3();
  private next = new Vector3();
  private direction = new Vector3();
  private up = new Vector3(0, 1, 0);
  private navigation = new NavigationScope();
  private airspace: HornetSpace | null = null;
  private heading = 0;
  constructor(readonly id: string) {}
  dispose(): void { inputs.delete(this.id); this.active = false; this.navigation.clear(); }
  step(root: Group, delta: number, speed: number, flightRadius?: number): void {
    const input = readSubjectInput(this.id);
    this.action = input?.action ?? null;
    if (input) input.action = null;
    this.started = Boolean(input) && !this.active;
    this.resumed = !input && this.active;
    this.active = Boolean(input);
    this.moving = false;
    if (!input) return;
    if (this.started) {
      const forward = cameraState.animalViews[this.id]?.forward;
      if (!forward) throw new Error(`Commande sans pose caméra : ${this.id}`);
      this.heading = Math.hypot(forward.x, forward.z) > Number.EPSILON ? Math.atan2(forward.x, forward.z) : (cameraState.positions[this.id]?.yaw ?? root.rotation.y);
    }
    const held = (key: string) => Number(input.keys.has('character:' + key));
    const turn = (held('ArrowLeft') - held('ArrowRight')) * Math.PI / 2 * delta;
    root.rotateOnWorldAxis(this.up, turn);
    this.heading += turn;
    root.getWorldPosition(this.position);
    this.next.copy(this.position);
    const travel = (held('ArrowUp') - held('ArrowDown')) * speed * delta;
    const rise = isFlyingSubject(this.id) ? (held('Elevate') - held('Descend')) * speed * delta : 0;
    if (travel || rise) {
      this.direction.set(Math.sin(this.heading), 0, Math.cos(this.heading));
      this.next.addScaledVector(this.direction, travel);
      this.next.y += rise;
      // Robin keeps its existing free-flight movement between perches.
      if (flightRadius !== undefined && this.id !== 'robin') {
        this.airspace ??= new HornetSpace(flightRadius);
        const blocked = this.airspace.blocker(this.position, this.next)
          || Object.keys(DOOR_CONFIGS).some(key => this.airspace!.doorHits(key as keyof typeof DOOR_CONFIGS, this.position, this.next, doorCollisionState[key as keyof typeof DOOR_CONFIGS].angle));
        if (blocked) this.next.copy(this.position);
      } else if (this.id !== 'robin') {
        const ready = this.navigation.poll(() => {
          const profile = getAgentProfile(this.id), start = { x: this.position.x, z: this.position.z }, goal = { x: this.next.x, z: this.next.z };
          const graph = getNavigationGraph(profile);
          const blocked = !segmentFree(start, goal, graph.obstacles) || Object.entries(DOOR_CONFIGS).some(([key, door]) =>
            this.position.y < door.yMax && this.position.y + profile.height > door.yMin
            && !segmentFree(start, goal, [[inflate(doorPolygon(key as keyof typeof DOOR_CONFIGS, doorCollisionState[key as keyof typeof DOOR_CONFIGS].angle), profile.radius + door.margin)]]));
          if (blocked) this.next.copy(this.position);
          else { const limited = limitAgentMovement(this.id, start, goal); this.next.x = limited.x; this.next.z = limited.z; }
        });
        if (!ready) this.next.copy(this.position);
      }
      this.moving = !this.next.equals(this.position);
      if (root.parent) root.position.copy(root.parent.worldToLocal(this.next));
      else root.position.copy(this.next);
    }
    root.getWorldPosition(this.position);
    cameraState.positions[this.id] = { x: this.position.x, y: this.position.y, z: this.position.z, yaw: this.heading };
  }
}
