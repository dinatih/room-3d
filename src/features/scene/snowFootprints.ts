import { CanvasTexture, LinearFilter, Vector3, type Object3D } from 'three';
import { SPATIAL_ZONES_CONFIG } from './ai/SpatialZone';
import { EXTERIOR_GROUND } from './environmentData';
import { resolveTargetBoneName } from './retargeting/boneResolver';

const LIFETIME_MS = 15_000;
const { min, max } = SPATIAL_ZONES_CONFIG.find(zone => zone.id === 'garden')!.bounds;
const { x, z, width, depth } = EXTERIOR_GROUND;
type Mark = { x: number; z: number; angle: number; created: number };
export const snowFootprints: { add?: (mark: Mark) => void } = {};

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
    if (!walking || !snowFootprints.add || position.y !== 0 ||
        position.x < min[0] || position.x > max[0] || position.z < min[2] || position.z > max[2]) {
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
      snowFootprints.add({
        x: hasDirection ? (toe.x + heel.x) / 2 : toe.x,
        z: hasDirection ? (toe.z + heel.z) / 2 : toe.z,
        angle: hasDirection ? Math.atan2(toe.z - heel.z, toe.x - heel.x) : Math.PI / 2 - yaw,
        created: performance.now(),
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
          context.scale(6, 2.5); // 24 × 10 cm.
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
