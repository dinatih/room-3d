import { CanvasTexture, LinearFilter, Vector3, type Object3D } from 'three';
import { SPATIAL_ZONES_CONFIG } from './ai/SpatialZone';
import { weatherSurface } from './weatherSurface';
import { EXTERIOR_GROUND } from './environmentData';
import { resolveTargetBoneName } from './retargeting/boneResolver';

const LIFETIME_MS = 15_000;
const { min, max } = SPATIAL_ZONES_CONFIG.find(zone => zone.id === 'garden')!.bounds;
const { x, z, width, depth } = EXTERIOR_GROUND;
const shapes = {
  foot: [6, 2.5],
  robot: [4, 2],
  paw: [1.8, 1.5],
  bird: [1.5, 1],
  wheel: [4, 1.5],
} as const;
type Shape = keyof typeof shapes;
type Mark = { x: number; z: number; angle: number; created: number; shape: Shape };
export const snowFootprints: { add?: (mark: Mark) => void } = {};

function onSnowyGarden(position: Vector3) {
  return !!snowFootprints.add && weatherSurface.snow > 0 && position.y === 0
    && position.x >= min[0] && position.x <= max[0] && position.z >= min[2] && position.z <= max[2];
}

export function stampBirdTracks(model: Object3D, feet: { left: Vector3; right: Vector3 }) {
  const rotation = model.getWorldQuaternion(model.quaternion.clone());
  const position = model.getWorldPosition(new Vector3());
  const direction = new Vector3(0, 0, 1).applyQuaternion(rotation);
  for (const foot of [feet.left, feet.right]) {
    const contact = foot.clone().applyQuaternion(rotation).add(position);
    contact.y = 0; // The perch resolver has already confirmed both contacts on the garden mesh.
    if (!onSnowyGarden(contact)) continue;
    snowFootprints.add!({
      x: contact.x, z: contact.z, angle: Math.atan2(direction.z, direction.x),
      created: performance.now(), shape: 'bird',
    });
  }
}

export function createGroundTrail(shape: 'robot' | 'paw' | 'wheel', spacing: number) {
  const position = new Vector3(), previous = new Vector3();
  let grounded = false, pending = 0, side = 1;
  return (root: Object3D, maxTravel: number, halfTrack: number) => {
    root.getWorldPosition(position);
    const onGround = onSnowyGarden(position);
    const dx = position.x - previous.x, dz = position.z - previous.z;
    const travel = Math.hypot(dx, dz);
    if (!grounded || !onGround || travel > maxTravel + 1e-6) {
      pending = 0;
    } else if (travel > 0) {
      const angle = Math.atan2(dz, dx);
      for (let step = spacing - pending; step <= travel; step += spacing) {
        const fraction = step / travel;
        const centerX = previous.x + dx * fraction;
        const centerZ = previous.z + dz * fraction;
        const stamp = (offset: number) => snowFootprints.add!({
          x: centerX + dz / travel * offset, z: centerZ - dx / travel * offset,
          angle, created: performance.now(), shape,
        });
        stamp(side * halfTrack);
        if (shape === 'wheel') stamp(-side * halfTrack);
        side = -side;
      }
      pending = (pending + travel) % spacing;
    }
    grounded = onGround;
    previous.copy(position);
  };
}

export function createSnowFootprintTracker(rig: Object3D) {
  const find = (name: string) => {
    const resolved = resolveTargetBoneName(rig, name);
    return resolved ? rig.getObjectByName(resolved) : undefined;
  };
  const feet = ['Left', 'Right'].map(side => {
    const heel = find(side + 'Foot');
    return { heel, toe: find(side + 'ToeBase') ?? heel, point: new Vector3() };
  });
  const heel = new Vector3();
  let support = -1;
  return (walking: boolean, position: Vector3, yaw: number) => {
    if (!walking || !onSnowyGarden(position)) {
      support = -1;
      return;
    }
    const [left, right] = feet;
    if (!left.toe || !right.toe) return;
    left.toe.getWorldPosition(left.point);
    right.toe.getWorldPosition(right.point);
    const next = left.point.y <= right.point.y ? 0 : 1;
    if (support !== -1 && support !== next) {
      const foot = feet[next];
      const toe = foot.point;
      foot.heel?.getWorldPosition(heel);
      const hasDirection = foot.heel && foot.heel !== foot.toe;
      snowFootprints.add!({
        x: hasDirection ? (toe.x + heel.x) / 2 : toe.x,
        z: hasDirection ? (toe.z + heel.z) / 2 : toe.z,
        angle: hasDirection ? Math.atan2(toe.z - heel.z, toe.x - heel.x) : Math.PI / 2 - yaw,
        created: performance.now(), shape: 'foot',
      });
    }
    support = next;
  };
}

export function createSnowFootprintMask() {
  const canvas = document.createElement('canvas');
  // One texel per two centimetres of ground.
  canvas.width = width / 2;
  canvas.height = depth / 2;
  const context = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  const marks: Mark[] = [];
  const add = (mark: Mark) => { marks.push(mark); };
  let drawn = false;
  return {
    texture,
    add,
    update(now: number, snow: number) {
      if (snow <= 0) marks.length = 0;
      while (marks.length && now - marks[0].created >= LIFETIME_MS) marks.shift();
      if (drawn || marks.length) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (const mark of marks) {
          context.save();
          context.translate((mark.x - x + width / 2) / 2, (mark.z - z + depth / 2) / 2);
          context.rotate(mark.angle);
          const [markLength, markWidth] = shapes[mark.shape];
          context.scale(markLength, markWidth);
          const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
          gradient.addColorStop(0, 'white');
          gradient.addColorStop(1, 'transparent');
          context.fillStyle = gradient;
          context.globalAlpha = 1 - (now - mark.created) / LIFETIME_MS;
          context.fillRect(-1, -1, 2, 2);
          context.restore();
        }
        texture.needsUpdate = true;
      }
      drawn = marks.length > 0;
      return drawn;
    },
  };
}
