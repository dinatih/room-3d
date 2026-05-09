import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, HueSaturation, Pixelation, DotScreen } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  ACESFilmicToneMapping, NoToneMapping,
  MeshToonMaterial,
  DataTexture, RedFormat, NearestFilter,
  Color, Mesh, type Material,
} from 'three';

export type RenderStyleKey =
  | 'default' | 'linear'
  | 'toon'
  | 'grayscale' | 'pixelate' | 'dotscreen';

export const RENDER_STYLES: { key: RenderStyleKey; label: string }[] = [
  { key: 'default',   label: 'ACES Filmic' },
  { key: 'linear',    label: 'Linéaire'    },
  { key: 'toon',      label: 'Cel (Toon)'  },
  { key: 'grayscale', label: 'N&B'         },
  { key: 'pixelate',  label: 'Pixels'      },
  { key: 'dotscreen', label: 'Trame'       },
];

const TM: Record<RenderStyleKey, THREE.ToneMapping> = {
  default:   ACESFilmicToneMapping,
  linear:    NoToneMapping,
  toon:      ACESFilmicToneMapping,
  grayscale: ACESFilmicToneMapping,
  pixelate:  ACESFilmicToneMapping,
  dotscreen: ACESFilmicToneMapping,
};

const MAT_SWAP = new Set<RenderStyleKey>(['toon']);

// ── Tone mapping sync ─────────────────────────────────────────────────────────

function ToneMappingSync({ style }: { style: RenderStyleKey }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    gl.toneMapping = TM[style] ?? ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    invalidate();
    return () => {
      gl.toneMapping = ACESFilmicToneMapping;
      gl.toneMappingExposure = 1;
      invalidate();
    };
  }, [style, gl, invalidate]);
  return null;
}

// ── Material swap (toon / normal) ─────────────────────────────────────────────

function MaterialSwap({ style }: { style: RenderStyleKey }) {
  const { scene, invalidate } = useThree();

  const gradMap = useMemo(() => {
    const data = new Uint8Array([0, 80, 200, 255]);
    const t = new DataTexture(data, 4, 1, RedFormat);
    t.minFilter = t.magFilter = NearestFilter;
    t.needsUpdate = true;
    return t;
  }, []);

  const saved   = useRef(new Map<Mesh, Material | Material[]>());
  const created = useRef<Material[]>([]);

  useEffect(() => {
    scene.traverse(obj => {
      if (!(obj instanceof Mesh)) return;
      const orig = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!orig) return;
      if (orig.transparent && (orig as any).opacity < 0.5) return;

      saved.current.set(obj, obj.material);

      const color = (orig as any).color
        ? new Color().copy((orig as any).color)
        : new Color(0xaabbcc);
      const m = new MeshToonMaterial({ color, gradientMap: gradMap });
      created.current.push(m);
      obj.material = m;
    });

    invalidate();

    return () => {
      saved.current.forEach((mat, mesh) => {
        mesh.material = mat;
        if (!Array.isArray(mat)) mat.needsUpdate = true;
      });
      saved.current.clear();
      created.current.forEach(m => m.dispose());
      created.current = [];
      invalidate();
    };
  }, [style, scene, gradMap, invalidate]);

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RenderStyleLayer({ style }: { style: RenderStyleKey }) {
  return (
    <>
      <ToneMappingSync style={style} />
      {MAT_SWAP.has(style) && <MaterialSwap style={style} />}

      {style === 'grayscale' && (
        <EffectComposer>
          <HueSaturation saturation={-1} />
        </EffectComposer>
      )}
      {style === 'pixelate' && (
        <EffectComposer>
          <Pixelation granularity={8} />
        </EffectComposer>
      )}
      {style === 'dotscreen' && (
        <EffectComposer>
          <DotScreen scale={1.5} />
        </EffectComposer>
      )}
    </>
  );
}
