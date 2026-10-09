import { useState, useRef, useEffect, useMemo } from 'react';
import { type CharacterConfig } from './characterConfig';
import { resetAppIdle } from './idleState';
import { useIsMobile } from '@shared/hooks/useIsMobile';

export interface DuoPartnerSelectorProps {
  availablePartners: CharacterConfig[];
  activePartnerId?: string;
  onSelectPartner: (partnerId: string) => void;
  onClose?: () => void;
  title?: string;
  autoFocus?: boolean;
  maxHeight?: string | number;
  listMaxHeight?: string | number;
  isMobile?: boolean;
}

export function DuoPartnerSelector({
  availablePartners,
  activePartnerId,
  onSelectPartner,
  onClose,
  title = 'Partenaire Duo (Rôle B)',
  autoFocus = false,
  maxHeight = 'min(45vh, 320px)',
  listMaxHeight = 'min(24vh, 180px)',
  isMobile: isMobileProp,
}: DuoPartnerSelectorProps) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileHook;

  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredPartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availablePartners;
    return availablePartners.filter(
      p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.emoji.includes(q)
    );
  }, [availablePartners, search]);

  useEffect(() => {
    if (autoFocus && availablePartners.length > 6) {
      searchInputRef.current?.focus();
    }
  }, [autoFocus, availablePartners.length]);

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

  const handleSelect = (partnerId: string) => {
    resetAppIdle();
    onSelectPartner(partnerId);
    onClose?.();
  };

  const handleRandom = () => {
    resetAppIdle();
    const pool = availablePartners.filter(p => p.id !== activePartnerId);
    const list = pool.length > 0 ? pool : availablePartners;
    if (list.length > 0) {
      const rand = list[Math.floor(Math.random() * list.length)];
      handleSelect(rand.id);
    }
  };

  return (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden text-dark"
      style={{ maxHeight, minHeight: 0, outline: 'none' }}
      tabIndex={0}
    >
      {/* En-tête */}
      <div className="d-flex flex-shrink-0 align-items-center justify-content-between p-2 border-bottom">
        <span className="fw-semibold small text-truncate">
          <i className="bi bi-person-fill text-primary" aria-hidden="true" /> {title}
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

      {/* Barre de recherche et dé aléatoire */}
      <div className="p-2 border-bottom flex-shrink-0">
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-light text-muted border-end-0">
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Filtrer partenaire..."
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
            title="Choisir un partenaire au hasard"
            style={{ fontSize: '10px' }}
          >
            <i className="bi bi-shuffle" aria-hidden="true" /> Aléatoire
          </button>
        </div>
      </div>

      {/* Grille des partenaires */}
      <div
        className="overflow-auto flex-grow-1 p-2"
        style={{ maxHeight: listMaxHeight, minHeight: 0 }}
      >
        {filteredPartners.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            Aucun partenaire trouvé
          </div>
        ) : (
          <div className="row row-cols-2 g-1">
            {filteredPartners.map(c => {
              const isActive = c.id === activePartnerId;
              return (
                <div key={c.id} className="col">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 d-flex align-items-center justify-content-between gap-1 text-start ${
                      isActive ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'
                    }`}
                    style={{ fontSize: isMobile ? '12px' : '11px', padding: '0.35rem 0.5rem' }}
                    onClick={() => handleSelect(c.id)}
                  >
                    <span className="text-truncate">
                      <span className="me-1">{c.emoji}</span>
                      {c.name}
                    </span>
                    {isActive && <i className="bi bi-check-lg flex-shrink-0" aria-hidden="true" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
