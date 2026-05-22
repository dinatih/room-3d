/**
 * WalkerMeshDebug.tsx — panel debug listant tous les meshes du Walker principal
 * avec checkbox visible/masqué. Pattern inspiré de lara_debug.html.
 */
import { useEffect, useState } from 'react';
import { walkerMeshList } from './Walker';
import { cameraState } from './cameraState';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from '@features/scene/store/useSceneStore';

export function WalkerMeshDebug() {
  const isMobile = useIsMobile();
  const open = useSceneStore(s => s.extraStates['walker-meshes']);
  const setOpen = (next: boolean) => {
    const cur = useSceneStore.getState().extraStates['walker-meshes'];
    if (cur !== next) useSceneStore.getState().triggerAction('walker-meshes');
  };
  const [, force] = useState(0);

  // Re-render périodique pour suivre les meshes ajoutés après mount + état visible
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => force(x => x + 1), 500);
    return () => clearInterval(id);
  }, [open]);

  if (isMobile || !open) return null;
  const meshes = walkerMeshList;

  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      left: 12,
      zIndex: 110,
      fontFamily: 'sans-serif',
      fontSize: 12,
      color: '#fff',
      maxHeight: '60vh',
      background: 'rgba(10,10,40,0.92)',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 6,
      padding: 8,
      minWidth: 240,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        paddingBottom: 4,
        fontWeight: 'bold',
      }}>
        <span>🧩 Meshes ({meshes.length})</span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#aaa',
            fontSize: 16,
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {meshes.length === 0 && <div style={{ opacity: 0.7 }}>Walker non chargé</div>}
        {meshes.map((m, i) => (
          <label key={`${m.name}-${i}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 0',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={m.visible}
              onChange={e => {
                m.visible = e.target.checked;
                cameraState.invalidate?.();
                force(x => x + 1);
              }}
            />
            <span>{m.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
