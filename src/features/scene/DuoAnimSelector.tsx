import { useState, useRef, useEffect, useMemo } from 'react';
import { DUO_ANIMATIONS, type DuoAnimationDef } from './animations/duoAnimations';
import { resetAppIdle } from './idleState';
import { useIsMobile } from '@shared/hooks/useIsMobile';

export interface DuoAnimSelectorProps {
  activeDuoId?: string;
  onSelectDuoAnim: (animDef: DuoAnimationDef | undefined) => void;
  onClose?: () => void;
  title?: string;
  autoFocus?: boolean;
  maxHeight?: string | number;
  listMaxHeight?: string | number;
  isMobile?: boolean;
}

export function DuoAnimSelector({
  activeDuoId,
  onSelectDuoAnim,
  onClose,
  title = 'Animations Duo',
  autoFocus = false,
  maxHeight = 'min(45vh, 320px)',
  listMaxHeight = 'min(24vh, 160px)',
  isMobile: isMobileProp,
}: DuoAnimSelectorProps) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileHook;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'combat' | 'social'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const combatCount = useMemo(() => DUO_ANIMATIONS.filter(a => a.isCombat).length, []);
  const socialCount = useMemo(() => DUO_ANIMATIONS.filter(a => !a.isCombat).length, []);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DUO_ANIMATIONS.filter(a => {
      if (filter === 'combat' && !a.isCombat) return false;
      if (filter === 'social' && a.isCombat) return false;
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.animA.toLowerCase().includes(q) ||
        a.animB.toLowerCase().includes(q)
      );
    });
  }, [search, filter]);

  // Focus automatique
  useEffect(() => {
    if (autoFocus) searchInputRef.current?.focus();
  }, [autoFocus]);

  // Échap pour fermer
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Défilement automatique vers l'élément sélectionné
  useEffect(() => {
    if (activeDuoId && containerRef.current) {
      containerRef.current.querySelector('.active-anim-item')?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeDuoId]);

  const handleSelect = (anim: DuoAnimationDef) => {
    resetAppIdle();
    onSelectDuoAnim(anim);
    onClose?.();
  };

  const handleClearDuo = () => {
    resetAppIdle();
    onSelectDuoAnim(undefined);
    onClose?.();
  };

  const handleRandom = () => {
    resetAppIdle();
    const pool = filteredList.filter(a => a.id !== activeDuoId);
    const list = pool.length > 0 ? pool : filteredList;
    if (list.length > 0) {
      const rand = list[Math.floor(Math.random() * list.length)];
      handleSelect(rand);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (!filteredList.length) return;
      const idx = filteredList.findIndex(a => a.id === activeDuoId);
      const nextIdx = e.key === 'ArrowDown'
        ? (idx + 1) % filteredList.length
        : (idx - 1 + filteredList.length) % filteredList.length;
      handleSelect(filteredList[nextIdx]);
    }
  };

  return (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden text-dark"
      style={{ maxHeight, minHeight: 0, outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* En-tête */}
      <div className="d-flex flex-shrink-0 align-items-center justify-content-between p-2 border-bottom">
        <span className="fw-semibold small text-truncate">
          <i className="bi bi-people-fill text-primary" aria-hidden="true" /> {title}
        </span>
        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-close ms-auto"
            onClick={onClose}
            aria-label="Fermer"
            style={{ fontSize: '10px' }}
          />
        )}
      </div>

      {/* Barre de recherche et actions rapides */}
      <div className="p-2 border-bottom flex-shrink-0">
        <div className="input-group input-group-sm mb-1.5">
          <span className="input-group-text bg-light text-muted border-end-0">
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Filtrer animation duo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: isMobile ? '13px' : '11px' }}
          />
          {search && (
            <button
              className="btn btn-outline-secondary border-start-0"
              type="button"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
              style={{ fontSize: '10px' }}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
          <button
            className="btn btn-warning text-dark fw-bold border-start-0 px-2"
            type="button"
            onClick={handleRandom}
            title="Choisir une animation duo au hasard"
            style={{ fontSize: '10px' }}
          >
            <i className="bi bi-shuffle" aria-hidden="true" /> Aléatoire
          </button>
        </div>

        {/* Filtres Catégories */}
        <div className="btn-group btn-group-sm w-100 mb-1" role="group" aria-label="Filtres duo">
          <button
            type="button"
            className={`btn py-1 px-2 ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
            style={{ fontSize: isMobile ? '12px' : '10.5px' }}
            onClick={() => setFilter('all')}
          >
            Toutes ({DUO_ANIMATIONS.length})
          </button>
          <button
            type="button"
            className={`btn py-1 px-2 ${filter === 'combat' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
            style={{ fontSize: isMobile ? '12px' : '10.5px' }}
            onClick={() => setFilter('combat')}
          >
            Combat 🥋 ({combatCount})
          </button>
          <button
            type="button"
            className={`btn py-1 px-2 ${filter === 'social' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
            style={{ fontSize: isMobile ? '12px' : '10.5px' }}
            onClick={() => setFilter('social')}
          >
            Danse & Duo 💃 ({socialCount})
          </button>
        </div>

        {/* Info & action Quitter */}
        <div className="d-flex align-items-center justify-content-between px-1 text-muted small" style={{ fontSize: '10px' }}>
          <span>{filteredList.length} animation{filteredList.length > 1 ? 's' : ''} duo</span>
          {activeDuoId && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-semibold"
              style={{ fontSize: '10px' }}
              onClick={handleClearDuo}
            >
              <i className="bi bi-x-circle me-1" aria-hidden="true" />Quitter le duo
            </button>
          )}
        </div>
      </div>

      {/* Liste des animations */}
      <div
        ref={containerRef}
        className="overflow-auto flex-grow-1"
        style={{ maxHeight: listMaxHeight, minHeight: 0, scrollBehavior: 'smooth' }}
      >
        {filteredList.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            Aucune animation duo ne correspond au filtre
          </div>
        ) : (
          filteredList.map(anim => {
            const isActive = activeDuoId === anim.id;

            return (
              <div
                key={anim.id}
                className={`d-flex align-items-center justify-content-between border-bottom px-2 py-2 ${
                  isActive
                    ? 'active-anim-item bg-primary text-white fw-bold shadow-sm'
                    : 'bg-transparent hover-bg-light text-dark'
                }`}
                style={{ fontSize: isMobile ? '13px' : '11px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => handleSelect(anim)}
              >
                <div className="d-flex align-items-center gap-1.5 overflow-hidden me-2" style={{ flex: 1 }}>
                  {isActive && <i className="bi bi-play-fill" aria-hidden="true" />}
                  <span className="fs-6 me-1 flex-shrink-0" role="img" aria-label={anim.label}>
                    {anim.icon}
                  </span>
                  <span className="text-truncate" title={anim.label}>
                    {anim.label}
                  </span>
                  <span
                    className={`badge ${
                      isActive ? 'bg-light text-dark' : 'bg-secondary-subtle text-secondary-emphasis'
                    } flex-shrink-0 ms-1`}
                    style={{ fontSize: '8.5px' }}
                  >
                    <i className="bi bi-stopwatch" aria-hidden="true" /> {anim.duration.toFixed(1)}s
                  </span>
                  <span
                    className={`badge ${
                      isActive
                        ? 'bg-white bg-opacity-25 text-white'
                        : anim.isCombat
                        ? 'bg-warning-subtle text-dark'
                        : 'bg-info-subtle text-dark'
                    } flex-shrink-0 ms-1`}
                    style={{ fontSize: '8.5px' }}
                  >
                    {anim.isCombat ? 'Combat' : 'Danse'}
                  </span>
                </div>

                {isActive && (
                  <i className="bi bi-check-lg fs-6 text-white flex-shrink-0 ms-2" aria-hidden="true" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
