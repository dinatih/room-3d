/**
 * WalkerMeshDebug.tsx — panel debug listant tous les meshes du Walker principal
 * avec checkbox visible/masqué. Pattern inspiré de lara_debug.html.
 */
import { useEffect, useState } from 'react';
import { walkerMeshList } from './Walker';
import { cameraState } from './cameraState';

export function WalkerMeshDebug() {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  // Re-render périodique pour suivre les meshes ajoutés après mount + état visible
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => force(x => x + 1), 500);
    return () => clearInterval(id);
  }, [open]);

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
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(10,10,40,0.85)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer',
        }}
      >
        🧩 Meshes ({meshes.length})
      </button>
      {open && (
        <div style={{
          marginTop: 6,
          maxHeight: '60vh',
          overflowY: 'auto',
          background: 'rgba(10,10,40,0.92)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 6,
          padding: 8,
          minWidth: 240,
        }}>
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
      )}
    </div>
  );
}
