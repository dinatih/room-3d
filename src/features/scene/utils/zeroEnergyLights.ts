import { ShaderChunk } from 'three';

export const originalDirectLightShader = ShaderChunk.lights_fragment_begin;

/** Keep light counts/cache keys stable; skip zero energy and zero attenuation. */
export function optimizeDirectLightShader(source: string): string {
  let loops = 0;
  const result = source.replace(/(\t\t(\w+Light) = \2s\[ i \];)([\s\S]*?)(\n\t}\n\t#pragma unroll_loop_end)/g,
    (_, assignment, light, body, end) => {
      loops++;
      body = body.replace(/(RE_Direct\([^;]+;)/g, 'if ( directLight.visible ) { $1 }');
      return `${assignment}\n\t\tif ( any( notEqual( ${light}.color, vec3( 0.0 ) ) ) ) {${body}\n\t\t}\n${end}`;
    });
  if (loops !== 5 || result.match(/if \( directLight.visible \)/g)?.length !== 4) throw new Error(`Unexpected Three.js direct-light shader: ${loops} loops`);
  return result;
}

ShaderChunk.lights_fragment_begin = optimizeDirectLightShader(originalDirectLightShader);

if (import.meta.hot) {
  import.meta.hot.dispose(() => { ShaderChunk.lights_fragment_begin = originalDirectLightShader; });
  import.meta.hot.accept(() => window.location.reload());
}
