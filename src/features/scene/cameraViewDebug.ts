import { MathUtils, OrthographicCamera, PerspectiveCamera } from 'three';
import type { CameraViewPreset } from './sidepanel/types';

/** Pose du preset dans chaque projection, avec la convention Euler de Three.js. */
export function cameraViewDebug(preset: CameraViewPreset): string {
  const format = (values: number[]) => values.map(value => value.toFixed(2)).join(', ');
  const poses = [
    ['Ortho', new OrthographicCamera()],
    ['Persp', new PerspectiveCamera()],
  ] as const;

  return poses.map(([label, camera]) => {
    camera.position.set(...preset.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(...preset.target);
    const rotation = [camera.rotation.x, camera.rotation.y, camera.rotation.z]
      .map(MathUtils.radToDeg);
    return `${label}\nPos XYZ (cm) : ${format(camera.position.toArray())}\nRot XYZ (°, ${camera.rotation.order}) : ${format(rotation)}`;
  }).join('\n\n') + `\n\nCible XYZ (cm) : ${format(preset.target)}\nMême pose ; cadrage selon la projection.`;
}
