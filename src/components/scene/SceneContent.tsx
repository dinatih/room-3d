import { useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { GlbModel }   from './GlbModel';
import { Spinner }    from './Spinner';
import { Controller } from './Controller';
import { SCENE_REGISTRY } from './registry';
import type { Item } from '../../types';

interface Props {
  item: Item | null;
  actionState: Record<string, boolean>;
}

export function SceneContent({ item, actionState }: Props) {
  const [glbSize, setGlbSize] = useState<THREE.Vector3 | null>(null);

  // Taille de référence depuis les dims inventaire (avant tout chargement)
  const dimSize = useMemo(() => {
    const d = item?.dims ?? { w: 50, h: 50, d: 50 };
    return new THREE.Vector3(d.w / 10, d.h / 10, d.d / 10);
  }, []); // empty deps: computed once par mount (SceneContent remonte à chaque item)

  const CustomItem = item?.id ? SCENE_REGISTRY[item.id] : undefined;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[200, 400, 300]} intensity={1.3} />
      <directionalLight position={[-150, 80, -200]} intensity={0.4} />

      <Controller size={glbSize ?? dimSize} />

      {CustomItem ? (
        // Composant TSX dédié (géométrie procédurale + interactivité)
        <CustomItem item={item!} actionState={actionState} onSize={setGlbSize} />

      ) : item?.glbPath ? (
        // Chargement GLB générique
        <Suspense fallback={<Spinner />}>
          <GlbModel path={item.glbPath} onSize={setGlbSize} />
        </Suspense>

      ) : null}
    </>
  );
}
