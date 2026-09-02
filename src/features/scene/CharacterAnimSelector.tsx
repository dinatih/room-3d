/**
 * CharacterAnimSelector.tsx — Composant réutilisable de listing, recherche, filtrage
 * et sélection des animations de personnages.
 * Utilisable aussi bien dans le panneau latéral (SidePanel) que dans les previews 3D de personnages.
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { WALKER_ANIM_OPTIONS } from './animOptions';
import { resetAppIdle } from './idleState';
import { useIsMobile } from '@shared/hooks/useIsMobile';

export const ANIM_CATEGORIES = [
  { key: 'combat', label: 'Combat', icon: '⚔️' },
  { key: 'dances', label: 'Danses', icon: '💃' },
  { key: 'emotes_gestures', label: 'Emotes & Gestes', icon: '👋' },
  { key: 'interactions', label: 'Interactions', icon: '🎮' },
  { key: 'locomotion', label: 'Locomotion', icon: '🏃' },
  { key: 'poses_idles', label: 'Poses & Idles', icon: '🧘' },
  { key: 'sports_fitness', label: 'Sports & Fitness', icon: '⚽' },
] as const;

export function getAnimCategory(val: string): string {
  if (val === 'idle' || val === 'tpose') return 'poses_idles';
  if (val.startsWith('animations/')) {
    const parts = val.split('/');
    if (parts.length > 1) {
      return parts[1];
    }
  }
  return 'other';
}

export interface CharacterAnimSelectorProps {
  activeAnimValue?: string;
  onSelectAnim: (animValue: string) => void;
  maxHeight?: string | number;
  listMaxHeight?: string | number;
  isMobile?: boolean;
  onClose?: () => void;
  title?: string;
  showRecent?: boolean;
  autoFocus?: boolean;
}

/** Nombre d'animations récentes affichées dans la section "Récentes" */
const MAX_RECENT = 2;

export function CharacterAnimSelector({
  activeAnimValue = 'idle',
  onSelectAnim,
  maxHeight = '55vh',
  listMaxHeight = '40vh',
  isMobile: isMobileProp,
  onClose,
  title,
  showRecent = true,
  autoFocus = false,
}: CharacterAnimSelectorProps) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileHook;

  const [animSearch, setAnimSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [copiedAnim, setCopiedAnim] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [recentAnims, setRecentAnims] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent_animations');
      if (!saved) return [];
      const parsed = JSON.parse(saved).slice(0, MAX_RECENT);
      return parsed.filter((v: string) => WALKER_ANIM_OPTIONS.some(a => a.value === v));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    WALKER_ANIM_OPTIONS.forEach(a => {
      const cat = getAnimCategory(a.value);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, []);

  const handleSelect = useCallback((val: string) => {
    resetAppIdle();
    onSelectAnim(val);
    if (val && val !== 'idle') {
      setRecentAnims(prev => {
        const next = [val, ...prev.filter(v => v !== val)].slice(0, MAX_RECENT);
        try {
          localStorage.setItem('recent_animations', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [onSelectAnim]);

  const handleCopyAnim = (anim: { value: string; label: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Supprime uniquement le premier segment ("animations/") pour conserver le sous-dossier de catégorie
    const parts = anim.value.split('/');
    const filename = parts.length > 1 ? parts.slice(1).join('/') : anim.value;
    navigator.clipboard.writeText(filename);
    setCopiedAnim(anim.value);
    setTimeout(() => setCopiedAnim(null), 2000);
  };

  const filteredAnims = useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    return WALKER_ANIM_OPTIONS.filter(a => {
      if (selectedCategories.length > 0) {
        const cat = getAnimCategory(a.value);
        if (!selectedCategories.includes(cat)) {
          return false;
        }
      }
      if (q) {
        return a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q);
      }
      return true;
    });
  }, [animSearch, selectedCategories]);

  const animsContainerRef = useRef<HTMLDivElement>(null);

  const selectNextAnim = (direction: 'next' | 'prev') => {
    resetAppIdle();
    if (!filteredAnims.length) return;
    const currentIndex = filteredAnims.findIndex(a => a.value === activeAnimValue);
    let nextIndex = 0;
    if (currentIndex === -1) {
      nextIndex = direction === 'next' ? 0 : filteredAnims.length - 1;
    } else {
      if (direction === 'next') {
        nextIndex = (currentIndex + 1) % filteredAnims.length;
      } else {
        nextIndex = (currentIndex - 1 + filteredAnims.length) % filteredAnims.length;
      }
    }
    const targetAnim = filteredAnims[nextIndex];
    if (targetAnim) {
      handleSelect(targetAnim.value);
    }
  };

  const playRandomAnim = () => {
    resetAppIdle();
    const pool = filteredAnims.filter(a => a.value !== 'idle');
    if (!pool.length) return;
    const randomAnim = pool[Math.floor(Math.random() * pool.length)];
    if (randomAnim) {
      handleSelect(randomAnim.value);
    }
  };

  const handleKeyDownAnims = (e: React.KeyboardEvent | KeyboardEvent) => {
    resetAppIdle();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      selectNextAnim(e.key === 'ArrowDown' ? 'next' : 'prev');
    }
  };

  useEffect(() => {
    if (activeAnimValue && animsContainerRef.current) {
      const container = animsContainerRef.current;
      const frameId = requestAnimationFrame(() => {
        const activeEl = container.querySelector('.active-anim-item') as HTMLElement | null;
        if (activeEl) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeEl.getBoundingClientRect();

          if (activeRect.top < containerRect.top) {
            container.scrollTop -= (containerRect.top - activeRect.top + 6);
          } else if (activeRect.bottom > containerRect.bottom) {
            container.scrollTop += (activeRect.bottom - containerRect.bottom + 6);
          }
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [activeAnimValue, filteredAnims]);

  const activeAnimOpt = WALKER_ANIM_OPTIONS.find(a => a.value === activeAnimValue);

  return (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden text-dark"
      style={{ maxHeight, outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDownAnims}
    >
      {/* En-tête avec titre ou bouton fermer si fourni */}
      {(title || onClose) && (
        <div className="d-flex align-items-center justify-content-between px-2 py-1.5 border-bottom bg-light">
          {title && <span className="fw-bold small text-truncate">🎬 {title}</span>}
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
      )}

      {/* Barre de contrôles et filtres */}
      <div className="p-2 border-bottom shadow-sm sticky-top" style={{ zIndex: 5, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
        {/* Barre de recherche textuelle */}
        <div className="input-group input-group-sm mb-1.5">
          <span className="input-group-text bg-light text-muted border-end-0">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Filtrer texte ou ↕ flèches..."
            value={animSearch}
            onChange={e => setAnimSearch(e.target.value)}
            onKeyDown={handleKeyDownAnims}
            style={{ fontSize: isMobile ? '13px' : '11px' }}
          />
          {animSearch && (
            <button
              className="btn btn-outline-secondary border-start-0"
              type="button"
              onClick={() => setAnimSearch('')}
              style={{ fontSize: '10px' }}
            >
              ✕
            </button>
          )}
          <button
            className="btn btn-warning text-dark fw-bold border-start-0 px-2"
            type="button"
            onClick={playRandomAnim}
            title="Jouer une animation au hasard parmi la sélection"
            style={{ fontSize: '10px' }}
          >
            🎲 Aléatoire
          </button>
        </div>

        {/* Filtre catégorie à choix multiples */}
        <div ref={categoryDropdownRef} className="position-relative mb-1.5">
          <div className="d-flex gap-1">
            <button
              type="button"
              className={`btn btn-sm w-100 text-start d-flex justify-content-between align-items-center py-1 px-2 ${
                selectedCategories.length > 0
                  ? 'btn-danger bg-danger text-white border-danger shadow-sm'
                  : 'btn-outline-secondary bg-white text-dark border'
              }`}
              style={{ fontSize: isMobile ? '12px' : '11px', borderRadius: '4px' }}
              onClick={() => setCategoryDropdownOpen(prev => !prev)}
            >
              <span className="text-truncate">
                📁 <strong>Catégories :</strong> {selectedCategories.length === 0
                  ? `Toutes (${ANIM_CATEGORIES.length})`
                  : `${selectedCategories.map(k => ANIM_CATEGORIES.find(c => c.key === k)?.label).join(', ')} (${selectedCategories.length})`
                }
              </span>
              <span className="ms-1 opacity-75" style={{ fontSize: '9px' }}>{categoryDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {selectedCategories.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger px-2 shrink-0"
                style={{ fontSize: '10px' }}
                onClick={() => setSelectedCategories([])}
                title="Réinitialiser toutes les catégories"
              >
                ✕
              </button>
            )}
          </div>

          {categoryDropdownOpen && (
            <div
              className="position-absolute start-0 end-0 mt-1 p-2 bg-white border rounded shadow-lg"
              style={{
                zIndex: 1050,
                backdropFilter: 'blur(12px)',
                background: 'rgba(255, 255, 255, 0.98)',
                maxHeight: '230px',
                overflowY: 'auto'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '10.5px' }}
                  onClick={() => setSelectedCategories(ANIM_CATEGORIES.map(c => c.key))}
                >
                  ✓ Tout cocher
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none text-danger fw-semibold"
                  style={{ fontSize: '10.5px' }}
                  onClick={() => setSelectedCategories([])}
                >
                  ✕ Tout décocher (Toutes)
                </button>
              </div>

              <div className="d-flex flex-column gap-1">
                {ANIM_CATEGORIES.map(cat => {
                  const isChecked = selectedCategories.includes(cat.key);
                  const count = categoryCounts[cat.key] || 0;
                  return (
                    <label
                      key={cat.key}
                      className={`d-flex align-items-center justify-content-between px-2 py-1 rounded cursor-pointer mb-0 ${
                        isChecked ? 'bg-danger-subtle text-danger-emphasis fw-semibold' : 'hover-bg-light text-dark'
                      }`}
                      style={{ fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <span className="d-flex align-items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0 me-1.5"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedCategories(prev =>
                              prev.includes(cat.key)
                                ? prev.filter(k => k !== cat.key)
                                : [...prev, cat.key]
                            );
                          }}
                        />
                        <span>{cat.icon} {cat.label}</span>
                      </span>
                      <span className={`badge ${isChecked ? 'bg-danger text-white' : 'bg-secondary-subtle text-secondary-emphasis'}`} style={{ fontSize: '9px' }}>
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Animations récentes */}
        {showRecent && recentAnims.slice(0, MAX_RECENT).length > 0 && !animSearch && selectedCategories.length === 0 && (
          <div className="mb-2 p-1.5 bg-light rounded border">
            <div className="text-muted fw-bold mb-1 px-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🕒 Récentes ({recentAnims.slice(0, MAX_RECENT).length})
            </div>
            <div className="d-flex flex-wrap gap-1">
              {recentAnims.slice(0, MAX_RECENT).map(val => {
                const opt = WALKER_ANIM_OPTIONS.find(a => a.value === val);
                const isAct = activeAnimValue === val;
                const label = opt ? opt.label : val.split('/').pop() || val;
                return (
                  <button
                    key={val}
                    className={`btn btn-xs ${isAct ? 'btn-danger fw-bold' : 'btn-outline-dark'} py-0 px-2 text-truncate`}
                    style={{ fontSize: '10px', maxWidth: '100%' }}
                    onClick={() => handleSelect(val)}
                    title={label}
                  >
                    {isAct ? '▶ ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Animation en cours d'exécution */}
        {activeAnimOpt && activeAnimValue !== 'idle' && (
          <div className="p-2 mb-1 rounded border border-danger-subtle bg-danger-subtle bg-opacity-25 d-flex flex-column gap-1">
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-danger text-truncate me-1" style={{ fontSize: '11px' }}>
                ▶ En cours : {activeAnimOpt.label}
              </span>
              <button
                className="btn btn-sm btn-outline-danger py-0 px-2 fw-semibold shrink-0"
                style={{ fontSize: '9px' }}
                onClick={(e) => handleCopyAnim(activeAnimOpt, e)}
                title="Copier le nom du fichier GLB"
              >
                {copiedAnim === activeAnimOpt.value ? '✓ Copié !' : '📋 Copier nom'}
              </button>
            </div>
            <div className="font-monospace text-muted text-truncate" style={{ fontSize: '9px' }}>
              📁 {activeAnimOpt.value.split('/').pop()}
            </div>
          </div>
        )}

        <div className="text-muted small px-1 d-flex justify-content-between" style={{ fontSize: '9px' }}>
          <span>{filteredAnims.length} animation{filteredAnims.length > 1 ? 's' : ''}</span>
          <span className="text-muted">↕ Flèches Clavier</span>
        </div>
      </div>

      {/* Liste des animations */}
      <div ref={animsContainerRef} className="overflow-auto flex-grow-1" style={{ maxHeight: listMaxHeight, position: 'relative', scrollBehavior: 'smooth' }}>
        {filteredAnims.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            Aucune animation ne correspond aux filtres actuels
          </div>
        ) : (
          filteredAnims.map(anim => {
            const isActive = activeAnimValue === anim.value;
            const isPose = anim.label.toLowerCase().includes('pose') || anim.value.toLowerCase().includes('pose');
            const filename = anim.value.split('/').pop() || anim.value;
            const animCat = getAnimCategory(anim.value);
            const catObj = ANIM_CATEGORIES.find(c => c.key === animCat);

            return (
              <div
                key={anim.value}
                className={`d-flex align-items-center justify-content-between border-bottom px-2 py-2 ${
                  isActive ? 'active-anim-item bg-danger text-white fw-bold shadow-sm' : 'bg-transparent hover-bg-light text-dark'
                }`}
                style={{
                  fontSize: isMobile ? '13px' : '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleSelect(anim.value)}
              >
                <div className="d-flex align-items-center gap-1 overflow-hidden me-2" style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px' }}>{isActive ? '▶' : ''}</span>
                  <span className="text-truncate" title={anim.label}>{anim.label}</span>
                  {catObj && (
                    <span
                      className={`badge ${isActive ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary-subtle text-secondary-emphasis'} ms-1 fw-normal`}
                      style={{ fontSize: '8px', letterSpacing: '0.02em', flexShrink: 0 }}
                      title={`Sous-dossier: ${catObj.label}`}
                    >
                      {catObj.icon}
                    </span>
                  )}
                  {isPose && (
                    <span
                      className={`badge ${isActive ? 'bg-light text-danger' : 'bg-warning text-dark'} ms-1 fw-normal`}
                      style={{ fontSize: '8px', letterSpacing: '0.02em', flexShrink: 0 }}
                    >
                      POSE 10s
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-light text-danger border-0' : 'btn-outline-secondary border-0'} p-1 shrink-0`}
                  style={{ fontSize: '10px', lineHeight: 1 }}
                  onClick={(e) => handleCopyAnim(anim, e)}
                  title={`Copier "${filename}"`}
                >
                  {copiedAnim === anim.value ? '✓' : '📋'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
