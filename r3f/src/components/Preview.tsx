import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SceneContent } from './scene/SceneContent';
import { ACTION_LABELS } from './scene/registry';
import type { Item } from '../types';

export function Preview({ selected }: { selected: Item | null }) {
  // État générique des actions interactives (actionId → boolean)
  const [actionState, setActionState] = useState<Record<string, boolean>>({});

  const toggle = (actionId: string) =>
    setActionState(prev => ({ ...prev, [actionId]: !prev[actionId] }));

  return (
    <div className="panel-right">

      {/* ── Header ── */}
      <div className="preview-header">
        {selected ? (
          <>
            <span className="preview-name">{selected.name}</span>
            <span className="preview-dims">
              {selected.dims.w} × {selected.dims.d} × {selected.dims.h} cm
            </span>
            {!selected.glbPath && !selected.actions?.length && (
              <span className="preview-noglb">— boîte de dimensions</span>
            )}

            {/* Boutons d'action (ex. Ouvrir/Fermer) */}
            {selected.actions?.map(actionId => {
              const [labelOff, labelOn] = ACTION_LABELS[actionId] ?? [actionId, actionId];
              const active = actionState[actionId] ?? false;
              return (
                <button key={actionId} className="action-btn" onClick={() => toggle(actionId)}>
                  {active ? labelOn : labelOff}
                </button>
              );
            })}
          </>
        ) : (
          <span className="preview-hint">← Sélectionne un objet</span>
        )}
      </div>

      {/* ── Canvas R3F ── */}
      <div className="canvas-wrap">
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 50, 200], fov: 45 }}
          gl={{ antialias: true }}
        >
          {/* key force le remount complet à chaque changement d'item */}
          <SceneContent
            key={selected?.id ?? '__empty__'}
            item={selected}
            actionState={actionState}
          />
        </Canvas>
        <div className="canvas-hint">drag · scroll</div>
      </div>

    </div>
  );
}
