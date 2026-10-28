import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import { ROOM_W, ROOM_D, WALL_H, KITCHEN_WEST_WALL, KITCHEN_EAST_WALL, KITCHEN_SOUTH_WALL, BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, BATH_SOUTH_WALL, CORRIDOR_WEST_WALL, CORRIDOR_EAST_WALL, CORRIDOR_NORTH_WALL } from './wallData';
import { CARDINAL_ANGLES } from './camera/cameraViews';
import { TV_H, TV_POSITION } from './tvData';
import { BATHTUB } from './bathtubData';
import { currentFurnitureTransforms, DESK1_POSITIONS, SINGLE_BED_POSITIONS } from './furniturePositions';
import { architectureObstacles } from './ai/navigation/architecture';
import { furnitureObstacles, getObstacleRevision, type NavigationObstacleDef } from './ai/navigation/obstacles';
import { inflate, convexHull, segmentFree, GEOMETRY_EPSILON, CLEARANCE_ERROR, type Polygon } from './ai/navigation/geometry';
import { DOOR_CONFIGS, doorPolygon, doorCollisionState, glassShutterState } from './doorObstacles';
import { requestDoor, releaseAgentDoors, type DoorKey } from './ai/navigation/doorRequests';

export type TourRoom = 'garden' | 'living' | 'kitchen' | 'bathroom' | 'corridor';
export interface HornetObservation {
  id: string;
  room: TourRoom;
  label: string;
  position: Vector3;
  target: Vector3;
  sweep?: Vector3;
  seconds: number;
}
export const HORNET_BOB_CM = 1.5;
const OBSERVATION_SECONDS = 10;
const SWEEP_SECONDS = 14;
const DOOR_WAIT_SECONDS = 8;
const CRUISE_SPEED = 100; // cm/s : visite douce, distincte du pilotage manuel.
const ACCELERATION = 80; // cm/s², également utilisée pour la distance de freinage.
const TURN_SPEED = Math.PI / 3;
const ROOMS: TourRoom[] = ['garden', 'living', 'kitchen', 'corridor', 'bathroom'];
const DOORS = Object.keys(DOOR_CONFIGS) as DoorKey[];
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Physical viewpoints, never the distant positions of the global camera presets. */
export function hornetObservations(radius: number): HornetObservation[] {
  const high = WALL_H - 2 * radius - HORNET_BOB_CM;
  const centre = v(ROOM_W / 2, 0, ROOM_D / 2);
  const inset = ROOM_W / 4;
  const result: HornetObservation[] = [];
  const add = (id: string, room: TourRoom, label: string, position: Vector3, target: Vector3, sweep?: Vector3) =>
    result.push({ id, room, label, position, target, sweep, seconds: sweep ? SWEEP_SECONDS : OBSERVATION_SECONDS });
  for (const key of ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']) {
    const angle = CARDINAL_ANGLES[key];
    const dx = Math.sin(angle), dz = Math.cos(angle);
    const scale = Math.max(Math.abs(dx), Math.abs(dz));
    const position = v(centre.x + dx / scale * (ROOM_W / 2 - inset), high, centre.z + dz / scale * (ROOM_D / 2 - inset));
    const distance = Math.hypot(position.x - centre.x, position.z - centre.z);
    const target = centre.clone().setY(high - distance); // Plongée exacte de 45°.
    const label = key.replace('north', 'nord').replace('south', 'sud').replace('east', 'est').replace('west', 'ouest');
    add(key, 'living', `Séjour ${label} — plongée 45°`, position, target);
  }
  add('north-60', 'living', 'Séjour Nord — plongée 60°', v(centre.x, high, centre.z - high / Math.tan(Math.PI / 3)), centre.clone());
  add('top', 'living', 'Séjour — vue verticale 90°', centre.clone().setY(high), centre.clone());
  const underTV = new Vector3(...TV_POSITION).add(v(-radius, -TV_H / 2 - 2 * radius, 0));
  add('under-tv', 'living', 'Sous la télévision — centre du séjour', underTV, centre.clone());
  const desk = currentFurnitureTransforms['desk1-position'] ?? DESK1_POSITIONS[0];
  add('desk', 'living', 'Bureau et écrans', v(centre.x, high, ROOM_D / 3), v(desk.x, 90, desk.z), centre.clone().setY(70));
  const bed = currentFurnitureTransforms['bed-west-position'] ?? SINGLE_BED_POSITIONS.west;
  add('alcove', 'living', 'Alcôve et canapé', v(centre.x, high, ROOM_D * 2 / 3), v(bed.x, 50, bed.z), v(ROOM_W / 4, 60, ROOM_D / 3));
  const bathCentre = v((BATH_WEST_WALL + BATH_EAST_WALL) / 2, 80, (BATH_NORTH_WALL + BATH_SOUTH_WALL) / 2);
  add('bath-mirror', 'bathroom', 'Salle de bain — miroir et vasque', v(bathCentre.x, high, BATH_NORTH_WALL + (BATH_SOUTH_WALL - BATH_NORTH_WALL) / 3), v(BATH_WEST_WALL, 120, bathCentre.z), bathCentre);
  add('bath-shower', 'bathroom', 'Salle de bain — douche', v(bathCentre.x, high, BATH_SOUTH_WALL - radius * 2), v(BATH_WEST_WALL + radius * 2, 80, BATH_SOUTH_WALL + radius * 2));
  add('kitchen', 'kitchen', 'Cuisine — plan de travail', v((KITCHEN_WEST_WALL + KITCHEN_EAST_WALL) / 2, high, (ROOM_D + KITCHEN_SOUTH_WALL) / 2), v(KITCHEN_WEST_WALL, 90, KITCHEN_SOUTH_WALL - radius * 2), v(KITCHEN_EAST_WALL, 90, KITCHEN_SOUTH_WALL - radius * 2));
  add('entry', 'corridor', 'Entrée — perspective du couloir', v((CORRIDOR_WEST_WALL + CORRIDOR_EAST_WALL) / 2, high, (CORRIDOR_NORTH_WALL + DOOR_CONFIGS.bath.pivot.z - DOOR_CONFIGS.bath.length) / 2 + radius * 2), bathCentre.clone().setX(CORRIDOR_EAST_WALL).setY(100));
  add('garden', 'garden', 'Jardin — panorama', v(ROOM_W / 2, 170, -ROOM_D / 2), new Vector3(...BATHTUB.position).setY(BATHTUB.waterHeight), v(ROOM_W / 2, 80, 0));
  add('terrace', 'garden', 'Terrasse — retour vers le studio', v(ROOM_W * 2 / 3, 175, -ROOM_D / 4), centre.clone().setY(100), v(ROOM_W / 4, 80, -ROOM_D / 4));
  add('feeder', 'garden', 'Jardin — mangeoire et végétation', v(ROOM_W / 3, 175, -ROOM_D * 2 / 3), v(95, 214, -165), new Vector3(...BATHTUB.position).setY(BATHTUB.waterHeight));
  return result;
}

/** Height-clipped segment test against the existing extruded scene geometry. */
export class HornetSpace {
  private footprints = new Map<number, WeakMap<Polygon, Polygon>>();
  private leaves = new Map<DoorKey, { angle: number; obstacle: NavigationObstacleDef }>();
  private closed = new Map(DOORS.map(key => [key, { ...DOOR_CONFIGS[key], id: key, polygon: doorPolygon(key, 0) }]));
  private lintels = (['glassRight', 'glassLeft', 'living', 'bath', 'entry'] as const).map(key => ({
    id: `linteau-${key}`, polygon: doorPolygon(key, 0), yMin: DOOR_CONFIGS[key].yMax, yMax: WALL_H,
  }));
  private sweeps = DOORS.map(key => {
    const d = DOOR_CONFIGS[key];
    const steps = Math.ceil(d.maxAngle / (2 * Math.acos(d.length / (d.length + CLEARANCE_ERROR))));
    const radius = d.length / Math.cos(d.maxAngle / steps / 2);
    const arc = Array.from({ length: steps + 1 }, (_, i) => {
      const angle = d.maxAngle * i / steps;
      return { x: d.pivot.x + radius * (d.closedDir.x * Math.cos(angle) + d.openNormal.x * Math.sin(angle)), z: d.pivot.z + radius * (d.closedDir.z * Math.cos(angle) + d.openNormal.z * Math.sin(angle)) };
    });
    return { id: key, yMin: d.yMin, yMax: d.yMax, polygon: inflate(convexHull([d.pivot, ...arc]), d.thickness / 2 + d.margin) };
  });
  constructor(readonly radius: number) {
    if (!Number.isFinite(radius) || radius <= 0) throw new Error('Hornet : gabarit invalide');
  }
  hits(a: Vector3, b: Vector3, obstacle: NavigationObstacleDef, margin = 0): boolean {
    const radius = this.radius + margin;
    const low = obstacle.yMin - radius, high = obstacle.yMax + radius;
    let from = 0, to = 1;
    if (a.y === b.y) { if (a.y < low || a.y > high) return false; }
    else {
      const first = (low - a.y) / (b.y - a.y), second = (high - a.y) / (b.y - a.y);
      from = Math.max(0, Math.min(first, second)); to = Math.min(1, Math.max(first, second));
      if (from > to) return false;
    }
    let cache = this.footprints.get(margin);
    if (!cache) { cache = new WeakMap(); this.footprints.set(margin, cache); }
    let polygon = cache.get(obstacle.polygon);
    if (!polygon) {
      polygon = inflate(obstacle.polygon, radius);
      cache.set(obstacle.polygon, polygon);
    }
    return !segmentFree({ x: MathUtils.lerp(a.x, b.x, from), z: MathUtils.lerp(a.z, b.z, from) }, { x: MathUtils.lerp(a.x, b.x, to), z: MathUtils.lerp(a.z, b.z, to) }, [[polygon]]);
  }
  blocker(a: Vector3, b: Vector3, margin = 0): string | undefined {
    if (Math.min(a.y, b.y) - this.radius - margin <= 0 || Math.max(a.y, b.y) + this.radius + margin >= WALL_H) return 'sol ou plafond';
    for (const obstacle of [...architectureObstacles, ...this.lintels, ...furnitureObstacles.values()]) if (this.hits(a, b, obstacle, margin)) return obstacle.id;
  }
  doorHits(key: DoorKey, a: Vector3, b: Vector3, angle: number, yMin = DOOR_CONFIGS[key].yMin, yMax = DOOR_CONFIGS[key].yMax): boolean {
    if (angle === 0) return this.hits(a, b, { ...this.closed.get(key)!, yMin, yMax }, DOOR_CONFIGS[key].margin);
    let leaf = this.leaves.get(key);
    if (leaf?.angle !== angle) {
      leaf = { angle, obstacle: { ...DOOR_CONFIGS[key], id: key, polygon: doorPolygon(key, angle) } };
      this.leaves.set(key, leaf);
    }
    return this.hits(a, b, leaf!.obstacle, DOOR_CONFIGS[key].margin);
  }
  /** Circumscribed arcs contain the complete sweep, including between sampled poses. */
  safeStop(position: Vector3, bob = 0): boolean {
    return !this.blocker(position, position, bob) && this.sweeps.every(sweep => !this.hits(position, position, sweep, bob));
  }
  doorsBetween(a: Vector3, b: Vector3): DoorKey[] {
    return this.sweeps.filter(sweep => this.hits(a, b, sweep)).map(sweep => sweep.id);
  }
}

/** Small visibility network of authored viewpoints and clear door approaches. */
export class HornetTour {
  readonly space: HornetSpace;
  readonly observations: HornetObservation[];
  state: 'travelling' | 'observing' | 'waiting' = 'waiting';
  observation: HornetObservation | null = null;
  path: Vector3[] = [];
  roomFilter: TourRoom | null = null;
  private roomIndex = 0;
  private remaining: HornetObservation[] = [];
  private lastId = '';
  private elapsed = 0;
  private speed = 0;
  private wait = 0;
  private revision = -1;
  private nodes: Vector3[] = [];
  private edges: { to: number; cost: number }[][] = [];
  private direction = new Vector3();
  private next = new Vector3();
  private target = new Vector3();
  private rotation = new Quaternion();
  private euler = new Euler(0, 0, 0, 'YXZ');
  private waitReason = '';

  constructor(readonly radius: number, private log: (message: string) => void, private random = Math.random, private agentId = 'drone') {
    this.space = new HornetSpace(radius);
    this.observations = hornetObservations(radius);
  }
  reset(room: TourRoom | null = null): void {
    this.release();
    this.roomFilter = room;
    this.remaining = [];
    this.path = [];
    this.elapsed = this.wait = this.speed = 0;
    this.observation = null;
    this.state = 'waiting';
    this.waitReason = '';
    if (room) this.roomIndex = ROOMS.indexOf(room);
    this.revision = -1;
  }
  release(): void { releaseAgentDoors(this.agentId); }
  private network(): void {
    if (this.revision === getObstacleRevision()) return;
    this.revision = getObstacleRevision();
    const points = this.observations.map(o => o.position);
    for (const key of ['glassRight', 'living', 'bath'] as const) {
      const d = DOOR_CONFIGS[key];
      for (const sign of [-1, 1]) {
        const distance = (sign > 0 ? d.length : d.thickness) + d.margin + this.radius * 2;
        points.push(v(d.pivot.x + d.closedDir.x * d.length / 2 + sign * d.openNormal.x * distance, d.yMax - this.radius * 2, d.pivot.z + d.closedDir.z * d.length / 2 + sign * d.openNormal.z * distance));
      }
    }
    points.push(v(ROOM_W / 2, 180, ROOM_D / 2), v((KITCHEN_WEST_WALL + KITCHEN_EAST_WALL) / 2, 180, ROOM_D - DOOR_CONFIGS.living.length - this.radius * 2));
    points.push(this.observations.find(o => o.id === 'under-tv')!.position.clone().setZ(DOOR_CONFIGS.glassRight.length + this.radius * 4));
    this.nodes = points.filter(p => !this.space.blocker(p, p));
    this.edges = this.nodes.map(() => []);
    for (let i = 0; i < this.nodes.length; i++) for (let j = i + 1; j < this.nodes.length; j++) {
      if (!this.routeSegmentFree(this.nodes[i], this.nodes[j])) continue;
      const cost = this.nodes[i].distanceTo(this.nodes[j]);
      this.edges[i].push({ to: j, cost }); this.edges[j].push({ to: i, cost });
    }
  }
  private routeSegmentFree(a: Vector3, b: Vector3): boolean {
    return !this.space.blocker(a, b) && DOORS.every(key => !this.space.doorHits(key, a, b, DOOR_CONFIGS[key].maxAngle));
  }
  route(start: Vector3, target: Vector3): Vector3[] | null {
    this.network();
    const goal = this.nodes.indexOf(target);
    if (goal < 0) return null;
    const costs = this.nodes.map(p => this.routeSegmentFree(start, p) ? start.distanceTo(p) : Infinity);
    const parents = this.nodes.map(() => -1), open = new Set(this.nodes.map((_, i) => i));
    while (open.size) {
      const current = [...open].reduce((a, b) => costs[a] <= costs[b] ? a : b);
      if (!Number.isFinite(costs[current])) return null;
      if (current === goal) {
        const path: Vector3[] = [];
        for (let i = goal; i !== -1; i = parents[i]) path.unshift(this.nodes[i]);
        return path;
      }
      open.delete(current);
      for (const { to, cost } of this.edges[current]) if (open.has(to) && costs[current] + cost < costs[to]) { costs[to] = costs[current] + cost; parents[to] = current; }
    }
    return null;
  }
  private choose(position: Vector3): boolean {
    this.release();
    const previousRoom = this.observation?.room;
    for (let attempt = 0; attempt < ROOMS.length; attempt++) {
      if (!this.remaining.length) {
        if (previousRoom === ROOMS[this.roomIndex] && !this.roomFilter) this.roomIndex = (this.roomIndex + 1) % ROOMS.length;
        const room = this.roomFilter ?? ROOMS[this.roomIndex];
        this.remaining = this.observations.filter(o => o.room === room);
        for (let i = this.remaining.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
        }
        if (this.remaining.length > 1 && this.remaining[this.remaining.length - 1].id === this.lastId) [this.remaining[0], this.remaining[this.remaining.length - 1]] = [this.remaining[this.remaining.length - 1], this.remaining[0]];
      }
      while (this.remaining.length) {
        const observation = this.remaining.pop()!;
        if (!this.space.safeStop(observation.position, Math.sqrt(3) * HORNET_BOB_CM)) { this.log(`Point d’observation indisponible : ${observation.label} (obstacle ou débattement de porte).`); continue; }
        const route = this.route(position, observation.position);
        if (!route) { this.log(`Point inaccessible : ${observation.label}. Nouvel essai au prochain cycle.`); continue; }
        this.observation = observation;
        this.lastId = observation.id;
        this.path = route;
        this.state = 'travelling';
        this.elapsed = this.wait = this.speed = 0;
        this.waitReason = '';
        this.log(`Visite : en route vers ${observation.label}.`);
        return true;
      }
      if (this.roomFilter) break;
      this.roomIndex = (this.roomIndex + 1) % ROOMS.length;
    }
    this.state = 'waiting';
    this.wait = OBSERVATION_SECONDS;
    this.log('Visite suspendue : aucun point accessible. Nouvel essai au prochain cycle.');
    return false;
  }
  private face(position: Vector3, quaternion: Quaternion, target: Vector3, delta: number): void {
    this.direction.subVectors(target, position);
    const horizontal = Math.hypot(this.direction.x, this.direction.z);
    if (this.direction.lengthSq() === 0) return;
    // A vertical view retains its yaw, avoiding a singular lookAt/up-vector combination.
    const yaw = horizontal > GEOMETRY_EPSILON ? Math.atan2(this.direction.x, this.direction.z) : this.euler.setFromQuaternion(quaternion, 'YXZ').y;
    this.rotation.setFromEuler(this.euler.set(Math.atan2(-this.direction.y, horizontal), yaw, 0));
    quaternion.rotateTowards(this.rotation, TURN_SPEED * delta);
  }
  tick(position: Vector3, quaternion: Quaternion, delta: number): void {
    if (delta <= 0) return;
    if (this.state === 'waiting') {
      this.wait -= delta;
      if (this.wait <= 0) this.choose(position);
      return;
    }
    const observation = this.observation!;
    if (this.state === 'observing') {
      this.elapsed += delta;
      const progress = MathUtils.smoothstep(this.elapsed / observation.seconds, 0, 1);
      this.target.copy(observation.target);
      const anchor = observation.id === 'desk' ? currentFurnitureTransforms['desk1-position'] : observation.id === 'alcove' ? currentFurnitureTransforms['bed-west-position'] : undefined;
      if (anchor) this.target.set(anchor.x, observation.target.y, anchor.z);
      if (observation.sweep) this.target.lerp(observation.sweep, progress);
      const bob = Math.sin(Math.PI * progress); // Zero at arrival and departure.
      this.next.set(Math.sin(this.elapsed) * HORNET_BOB_CM * bob, Math.sin(this.elapsed * 1.3) * HORNET_BOB_CM * bob, Math.cos(this.elapsed) * HORNET_BOB_CM * bob).add(observation.position);
      if (this.space.blocker(position, this.next)) { this.log(`Observation interrompue : ${observation.label}, géométrie modifiée.`); this.choose(position); return; }
      position.copy(this.next);
      this.face(position, quaternion, this.target, delta);
      if (this.elapsed >= observation.seconds) this.choose(position);
      return;
    }
    const destination = this.path[0];
    // Open every door in the next uninterrupted crossing before leaving its safe approach.
    const stop = this.path.findIndex(p => this.space.safeStop(p));
    const corridor = [position, ...this.path.slice(0, stop < 0 ? this.path.length : stop + 1)];
    const doors = [...new Set(corridor.slice(1).flatMap((p, i) => this.space.doorsBetween(corridor[i], p)))];
    for (const key of doors) requestDoor(key, this.agentId);
    // Keep requests until the body has completely left every swept volume.
    if (!doors.length && this.space.safeStop(position)) this.release();
    let blocked: string | undefined;
    for (let i = 1; i < corridor.length; i++) {
      const a = corridor[i - 1], b = corridor[i];
      blocked = this.space.blocker(a, b) ?? blocked;
      for (const key of DOORS) {
        if (this.space.doorHits(key, a, b, doorCollisionState[key].angle)) blocked = `battant ${key}`;
        if (key.startsWith('glass') && this.space.doorHits(key, a, b, 0, glassShutterState.clearHeight, WALL_H)) blocked = 'volet de la baie vitrée';
      }
    }
    if (blocked) {
      this.speed = 0;
      this.wait += delta;
      if (blocked !== this.waitReason) { this.log(`Visite : attente hors passage (${blocked}).`); this.waitReason = blocked; }
      if (this.wait >= DOOR_WAIT_SECONDS && this.space.safeStop(position)) this.choose(position);
      return;
    }
    this.wait = 0;
    this.waitReason = '';
    const distance = position.distanceTo(destination);
    this.speed = Math.min(CRUISE_SPEED, this.speed + ACCELERATION * delta, Math.sqrt(2 * ACCELERATION * distance));
    const travel = Math.min(distance, this.speed * delta);
    this.next.copy(position).lerp(destination, distance === 0 ? 1 : travel / distance);
    this.face(position, quaternion, this.path.length === 1 && distance < this.radius * 4 ? observation.target : destination, delta);
    position.copy(this.next);
    if (travel === distance) {
      this.path.shift();
      if (!this.path.length) {
        this.release();
        this.state = 'observing';
        this.elapsed = this.speed = 0;
        this.log(`Observation : ${observation.label} (${observation.room}).`);
      }
    }
  }
}
