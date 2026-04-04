/**
 * Point d'entrée de la librairie R3F pour la preview inventaire.
 * Compilé par Vite en mode library vers js/lib/inventoryPreview.js
 * importé par js/ui/inventory.js.
 *
 * `three` est externalisé — il doit être disponible via importmap dans
 * lego-room.html (même instance que la scène principale).
 */
import { useState, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { SceneContent } from './components/scene/SceneContent';
import { ACTION_LABELS } from './components/scene/registry';
import type { Item } from './types';

// ── Composant React interne ───────────────────────────────────────────────────

interface AppProps {
  item: Item | null;
  onAction?: (actionId: string) => void;
}

function InventoryPreviewApp({ item, onAction }: AppProps) {
  const [actionState, setActionState] = useState<Record<string, boolean>>({});

  // Reset l'état des actions à chaque changement d'objet
  useEffect(() => { setActionState({}); }, [item?.id]);

  const toggle = (actionId: string) => {
    setActionState(prev => ({ ...prev, [actionId]: !prev[actionId] }));
    onAction?.(actionId);  // synchronise la scène principale si callback fourni
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#111118', fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Canvas R3F */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 50, 200], fov: 45 }}
          gl={{ antialias: true }}
        >
          <SceneContent
            key={item?.id ?? '__empty__'}
            item={item}
            actionState={actionState}
          />
        </Canvas>
      </div>

      {/* Label */}
      <div style={{
        fontSize: 11, color: '#888', textAlign: 'center',
        padding: '6px 8px', minHeight: 32,
      }}>
        {item ? (
          <>
            <strong style={{ color: '#fff' }}>{item.name}</strong>
            {item.dims && (
              <span style={{ color: '#666', marginLeft: 6, fontFamily: 'monospace' }}>
                {item.dims.w} × {item.dims.d} × {item.dims.h} cm
              </span>
            )}
          </>
        ) : 'Clique sur un objet'}
      </div>

      {/* Boutons d'action */}
      {item?.actions?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 8px 8px' }}>
          {item.actions.map(actionId => {
            const [labelOff, labelOn] = ACTION_LABELS[actionId] ?? [actionId, actionId];
            const active = actionState[actionId] ?? false;
            return (
              <button
                key={actionId}
                onClick={() => toggle(actionId)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid #555',
                  borderRadius: 6, color: '#ccc', fontSize: 11,
                  padding: '4px 12px', cursor: 'pointer',
                }}
              >
                {active ? labelOn : labelOff}
              </button>
            );
          })}
        </div>
      ) : null}

    </div>
  );
}

// ── API publique ──────────────────────────────────────────────────────────────

const roots = new WeakMap<HTMLElement, Root>();

/**
 * Monte (ou met à jour) la preview R3F dans `container`.
 * Appeler avec item=null pour afficher l'état vide.
 *
 * @param container  Élément DOM dans lequel monter le canvas React
 * @param item       Objet inventaire à afficher (ou null)
 * @param onAction   Callback appelé quand l'utilisateur clique un bouton d'action
 *                   (ex. ouvrir congélateur dans la scène principale)
 */
export function mountPreview(
  container: HTMLElement,
  item: Item | null,
  onAction?: (actionId: string) => void,
): void {
  let root = roots.get(container);
  if (!root) {
    root = createRoot(container);
    roots.set(container, root);
  }
  root.render(<InventoryPreviewApp item={item} onAction={onAction} />);
}

/**
 * Démonte la preview et libère le contexte WebGL.
 * Appeler à la fermeture du modal inventaire.
 */
export function unmountPreview(container: HTMLElement): void {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
}
