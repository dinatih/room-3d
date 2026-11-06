import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, Group, Mesh, MeshDepthMaterial, MeshDistanceMaterial, MeshStandardMaterial, RGBADepthPacking, Vector2 } from 'three';
import { useWeather } from './Weather';
import { simulationClock } from './ai/laraLifeStore';

/** Smooth shared gusts; the world clock also freezes vegetation during a pause. */
export function windGust(minutes: number) {
  return 0.6 + 0.25 * Math.sin(minutes * 1.7) + 0.15 * Math.sin(minutes * 0.43);
}

export function WindPlant({ children, rootHeight }: { children: ReactNode; rootHeight: number }) {
  const group = useRef<Group>(null!);
  const uniforms = useMemo(() => ({ plantWind: { value: new Vector2() }, plantRoot: { value: 0 }, plantCrown: { value: 1 } }), []);
  useLayoutEffect(() => {
    group.current.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(group.current);
    uniforms.plantRoot.value = bounds.min.y + rootHeight;
    uniforms.plantCrown.value = bounds.max.y - uniforms.plantRoot.value;
    if (uniforms.plantCrown.value <= 0) throw new Error('Wind plant crown is below its root');
    const cleanups: (() => void)[] = [];
    group.current.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const original = object.material;
      const materials = (Array.isArray(original) ? original : [original]).map(material => material.clone());
      const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
      const distance = new MeshDistanceMaterial();
      const template = materials[0] as MeshStandardMaterial;
      for (const shadow of [depth, distance]) {
        shadow.map = template.map; shadow.alphaMap = template.alphaMap;
        shadow.alphaTest = template.alphaTest; shadow.side = template.side;
      }
      const previousDepth = object.customDepthMaterial, previousDistance = object.customDistanceMaterial;
      for (const material of [...materials, depth, distance]) {
        material.onBeforeCompile = (shader: Parameters<MeshStandardMaterial['onBeforeCompile']>[0]) => {
          Object.assign(shader.uniforms, uniforms);
          shader.vertexShader = 'uniform vec2 plantWind; uniform float plantRoot; uniform float plantCrown;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
            #include <begin_vertex>
            vec3 plantWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
            float crown = clamp((plantWorld.y - plantRoot) / plantCrown, 0.0, 1.0);
            transformed += inverse(mat3(modelMatrix)) * vec3(plantWind.x, 0.0, plantWind.y) * crown * crown;
          `);
        };
      }
      object.material = Array.isArray(original) ? materials : materials[0];
      object.customDepthMaterial = depth; object.customDistanceMaterial = distance;
      cleanups.push(() => {
        object.material = original; object.customDepthMaterial = previousDepth; object.customDistanceMaterial = previousDistance;
        for (const material of [...materials, depth, distance]) material.dispose();
      });
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, [rootHeight, uniforms]);
  useFrame(() => {
    const { windSpeed, windDirection } = useWeather.getState();
    const angle = windDirection * Math.PI / 180;
    const bendCm = windSpeed * 1.5 * windGust(simulationClock.minutes);
    uniforms.plantWind.value.set(Math.cos(angle) * bendCm, Math.sin(angle) * bendCm);
  });
  return <group ref={group}>{children}</group>;
}
