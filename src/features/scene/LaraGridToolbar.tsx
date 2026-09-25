/**
 * LaraGridToolbar.tsx
 *
 * Barre d'outils flottante positionnée à droite du SidePanel (desktop)
 * ou en haut (mobile) lorsque la "Vue grille lara" est active.
 *
 * Propose des raccourcis rapides pour voir la grille sous toutes les vues orthographiques :
 * - Face (Alt+1 / Num 1)
 * - Derrière (Alt+2 / Ctrl+Num 1)
 * - Côté Gauche (Alt+3 / Ctrl+Num 3)
 * - Côté Droit (Alt+4 / Num 3)
 * - Dessus (Alt+7 / Num 7)
 * - Dessous (Alt+9 / Ctrl+Num 7)
 * - Bascule Ortho / 3D Perspective (Alt+5 / Num 5)
 * - Recadrer la caméra sur la grille
 */

import { useState, useEffect } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import {
  type LaraGridOrthoViewKey,
  frameLaraGridOrtho,
  frameLaraGridCamera,
} from './character/laraGridUtils';

type ActiveView = LaraGridOrthoViewKey | 'persp' | 'custom';

export function LaraGridToolbar() {
  const isMobile = useIsMobile();
  const laraGridActive = useSceneStore(state => state.layers.laraGrid);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('front');

  // Synchronisation avec les événements caméra
  useEffect(() => {
    const handleOrtho = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key) {
        setActiveView(detail.key);
      }
    };
    const handlePersp = () => {
      setActiveView('persp');
    };

    document.addEventListener('camera-ortho-view', handleOrtho);
    document.addEventListener('camera-view', handlePersp);
    return () => {
      document.removeEventListener('camera-ortho-view', handleOrtho);
      document.removeEventListener('camera-view', handlePersp);
    };
  }, []);

  if (!laraGridActive) return null;

  const handleSelectOrtho = (key: LaraGridOrthoViewKey) => {
    setActiveView(key);
    frameLaraGridOrtho(key);
  };

  const handleSelectPersp = () => {
    setActiveView('persp');
    frameLaraGridCamera();
  };

  const isOrtho = cameraMode === 'ortho';

  return (
    <div
      className="card shadow-lg glass-card lara-grid-toolbar"
      style={{
        position: 'fixed',
        top: isMobile ? 12 : 16,
        left: isMobile ? 12 : 288, // À droite immédiate du SidePanel desktop (16px + 260px + 12px)
        maxWidth: isMobile ? 'calc(100vw - 24px)' : 340,
        zIndex: 95,
        border: '1px solid rgba(255, 255, 255, 0.4)',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(12px)',
        borderRadius: '10px',
        userSelect: 'none',
      }}
    >
      {/* ── En-tête avec titre, badges et bouton minimiser ── */}
      <div
        className="d-flex align-items-center justify-content-between px-2.5 py-1.5 border-bottom"
        style={{
          cursor: 'pointer',
          background: 'rgba(240, 244, 250, 0.75)',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
        }}
        onClick={() => setIsCollapsed(c => !c)}
        title={isCollapsed ? 'Déplier les raccourcis de vues' : 'Replier la barre'}
      >
        <div className="d-flex align-items-center gap-1.5 overflow-hidden">
          <span style={{ fontSize: '13px' }}>📐</span>
          <span className="fw-bold text-dark text-truncate" style={{ fontSize: '11px', letterSpacing: '0.02em' }}>
            Vues Grille PNJ
          </span>
          <span
            className={`badge ${isOrtho ? 'bg-success' : 'bg-primary'}`}
            style={{ fontSize: '9px', fontWeight: 600, padding: '2px 5px' }}
          >
            {isOrtho ? 'ORTHO' : '3D PERSP'}
          </span>
        </div>

        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-link text-muted p-0 border-0 text-decoration-none"
            style={{ fontSize: '12px', lineHeight: 1, width: '18px', height: '18px' }}
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(c => !c);
            }}
            title={isCollapsed ? 'Déplier' : 'Replier'}
          >
            {isCollapsed ? '➕' : '➖'}
          </button>
        </div>
      </div>

      {/* ── Contenu déplié : boutons de vue et actions ── */}
      {!isCollapsed && (
        <div className="p-2 d-flex flex-column gap-2">
          {/* Grille des 6 vues canoniques */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
            }}
          >
            {/* 1. Face */}
            <button
              type="button"
              className={`btn btn-sm py-1.5 px-1 d-flex flex-column align-items-center justify-content-center text-center ${
                activeView === 'front' && isOrtho
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px', lineHeight: 1.2, borderRadius: '6px' }}
              onClick={() => handleSelectOrtho('front')}
              title="Vue orthographique de face (Raccourci Alt+1 ou Pavé num. 1)"
            >
              <span style={{ fontSize: '14px' }}>👤</span>
              <span className="fw-bold mt-0.5">Face</span>
              <span className="text-muted" style={{ fontSize: '8px', opacity: 0.85 }}>Alt+1</span>
            </button>

            {/* 2. Côté Gauche */}
            <button
              type="button"
              className={`btn btn-sm py-1.5 px-1 d-flex flex-column align-items-center justify-content-center text-center ${
                activeView === 'left' && isOrtho
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px', lineHeight: 1.2, borderRadius: '6px' }}
              onClick={() => handleSelectOrtho('left')}
              title="Vue orthographique côté gauche (Raccourci Alt+3 ou Ctrl+Pavé num. 3)"
            >
              <span style={{ fontSize: '14px' }}>◀️</span>
              <span className="fw-bold mt-0.5">Côté G</span>
              <span className="text-muted" style={{ fontSize: '8px', opacity: 0.85 }}>Alt+3</span>
            </button>

            {/* 3. Côté Droit */}
            <button
              type="button"
              className={`btn btn-sm py-1.5 px-1 d-flex flex-column align-items-center justify-content-center text-center ${
                activeView === 'right' && isOrtho
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px', lineHeight: 1.2, borderRadius: '6px' }}
              onClick={() => handleSelectOrtho('right')}
              title="Vue orthographique côté droit (Raccourci Alt+4 ou Pavé num. 3)"
            >
              <span style={{ fontSize: '14px' }}>▶️</span>
              <span className="fw-bold mt-0.5">Côté D</span>
              <span className="text-muted" style={{ fontSize: '8px', opacity: 0.85 }}>Alt+4</span>
            </button>

            {/* 4. Dessus */}
            <button
              type="button"
              className={`btn btn-sm py-1.5 px-1 d-flex flex-column align-items-center justify-content-center text-center ${
                activeView === 'top' && isOrtho
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px', lineHeight: 1.2, borderRadius: '6px' }}
              onClick={() => handleSelectOrtho('top')}
              title="Vue orthographique du dessus (Raccourci Alt+7 ou Pavé num. 7)"
            >
              <span style={{ fontSize: '14px' }}>⬇️</span>
              <span className="fw-bold mt-0.5">Dessus</span>
              <span className="text-muted" style={{ fontSize: '8px', opacity: 0.85 }}>Alt+7</span>
            </button>

            {/* 5. Dessous */}
            <button
              type="button"
              className={`btn btn-sm py-1.5 px-1 d-flex flex-column align-items-center justify-content-center text-center ${
                activeView === 'bottom' && isOrtho
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px', lineHeight: 1.2, borderRadius: '6px' }}
              onClick={() => handleSelectOrtho('bottom')}
              title="Vue orthographique du dessous (Raccourci Alt+9 ou Ctrl+Pavé num. 7)"
            >
              <span style={{ fontSize: '14px' }}>⬆️</span>
              <span className="fw-bold mt-0.5">Dessous</span>
              <span className="text-muted" style={{ fontSize: '8px', opacity: 0.85 }}>Alt+9</span>
            </button>

            {/* 6. Derrière */}
            <button
              type="button"
              className={`btn btn-sm py-1.5 px-1 d-flex flex-column align-items-center justify-content-center text-center ${
                activeView === 'back' && isOrtho
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px', lineHeight: 1.2, borderRadius: '6px' }}
              onClick={() => handleSelectOrtho('back')}
              title="Vue orthographique de dos / derrière (Raccourci Alt+2 ou Ctrl+Pavé num. 1)"
            >
              <span style={{ fontSize: '14px' }}>🔙</span>
              <span className="fw-bold mt-0.5">Derrière</span>
              <span className="text-muted" style={{ fontSize: '8px', opacity: 0.85 }}>Alt+2</span>
            </button>
          </div>

          {/* Ligne d'actions secondaires : Bascule Ortho/Persp & Recadrer */}
          <div className="d-flex align-items-center gap-1.5 pt-1 border-top">
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-1 ${
                !isOrtho
                  ? 'btn-warning text-dark fw-bold shadow-sm'
                  : 'btn-outline-dark bg-white bg-opacity-75'
              }`}
              style={{ fontSize: '10px' }}
              onClick={isOrtho ? handleSelectPersp : () => handleSelectOrtho('front')}
              title="Basculer entre la projection orthographique et la vue perspective 3D (Raccourci Alt+5 ou Pavé num. 5)"
            >
              <span>{isOrtho ? '🔄 Passer en 3D Persp' : '📐 Passer en Ortho'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1 flex-shrink-0 bg-white bg-opacity-75"
              style={{ fontSize: '10px' }}
              onClick={() => {
                if (isOrtho && activeView !== 'persp' && activeView !== 'custom') {
                  frameLaraGridOrtho(activeView as LaraGridOrthoViewKey);
                } else {
                  frameLaraGridCamera();
                }
              }}
              title="Recentrer et recadrer le zoom caméra sur la grille entière"
            >
              <span>🎯</span>
              <span>Centrer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
