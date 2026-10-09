/**
 * CharacterAnimSelector.tsx — Composant réutilisable de listing, recherche, filtrage
 * et sélection des animations de personnages (Barre d'outils & Previews 3D).
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { WALKER_ANIM_OPTIONS } from './animOptions';
import { getAnimationDef } from './animations/animationResolver';
import { resetAppIdle } from './idleState';
import type { AnimationCategory } from './animations/animationRegistry';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';

type AnimationSource = 'miley' | 'mixamo' | 'npz' | 'others';

export const ANIM_CATEGORIES = [
  { key: 'combat', label: 'Combat', icon: 'bi-shield-shaded' },
  { key: 'dances', label: 'Danses', icon: 'bi-music-note-beamed' },
  { key: 'emotes_gestures', label: 'Emotes & Gestes', icon: 'bi-hand-index' },
  { key: 'interactions', label: 'Interactions', icon: 'bi-controller' },
  { key: 'locomotion', label: 'Locomotion', icon: 'bi-person-walking' },
  { key: 'poses_idles', label: 'Poses & Idles', icon: 'bi-person-standing' },
  { key: 'sports_fitness', label: 'Sports & Fitness', icon: 'bi-dribbble' },
  { key: 'yoga', label: 'Yoga & Mocap', icon: 'bi-person-arms-up' },
  { key: 'miley', label: 'Miley', icon: 'bi-folder' },
  { key: 'mixamo', label: 'Mixamo', icon: 'bi-folder' },
  { key: 'npz', label: 'NPZ', icon: 'bi-folder' },
  { key: 'others', label: 'Others', icon: 'bi-folder' },
] as const satisfies ReadonlyArray<{ key: AnimationCategory | AnimationSource; label: string; icon: string }>;

export function getAnimCategory(val: string): string {
  if (val === 'idle' || val === 't-pose') return 'poses_idles';
  return getAnimationDef(val)?.category ?? 'other';
}

/** Métadonnées pré-calculées une seule fois pour éviter les regex et lookups sur chaque render */
export const ENHANCED_ANIM_OPTIONS = WALKER_ANIM_OPTIONS.map(anim => {
  const def = getAnimationDef(anim.value);
  const animCat = getAnimCategory(anim.value);
  const catObj = ANIM_CATEGORIES.find(c => c.key === animCat);

  let duration = def?.duration;
  if (duration === undefined && anim.label) {
    const m = anim.label.match(/\/ ([\d.]+)s,/);
    if (m) duration = parseFloat(m[1]);
  }
  if (duration === undefined && anim.value === 't-pose') duration = 0.1;

  return {
    value: anim.value,
    label: anim.label,
    defId: def?.id,
    defPath: def?.path,
    category: animCat,
    source: def?.path.split('/')[1],
    catIcon: catObj?.icon,
    catLabel: catObj?.label,
    duration,
    isPose: duration !== undefined && duration <= 0.15,
    filename: (def?.path || anim.value).split('/').pop() || anim.value,
    searchIndex: `${anim.label} ${anim.value}`.toLowerCase(),
  };
});

export function getFilteredAnimOptions(search: string, categories: string[], sortByDuration = false) {
  const q = search.trim().toLowerCase();
  const filtered = ENHANCED_ANIM_OPTIONS.filter(a => {
    if (categories.length > 0 && !categories.includes(a.category) && !(a.source && categories.includes(a.source))) return false;
    return !q || a.searchIndex.includes(q);
  });
  if (sortByDuration) {
    filtered.sort((a, b) => {
      if (a.duration === undefined) return b.duration === undefined ? 0 : 1;
      if (b.duration === undefined) return -1;
      return b.duration - a.duration;
    });
  }
  return filtered;
}

const CATEGORY_COUNTS = ENHANCED_ANIM_OPTIONS.reduce<Record<string, number>>((acc, a) => {
  acc[a.category] = (acc[a.category] || 0) + 1;
  if (a.source) acc[a.source] = (acc[a.source] || 0) + 1;
  return acc;
}, {});

export interface CharacterAnimSelectorProps {
  /** Identifiant de l'animation active en kebab-case strict */
  activeAnimValue?: string;
  /** Callback de sélection d'animation */
  onSelectAnim: (animValue: string) => void;
  maxHeight?: string | number;
  listMaxHeight?: string | number;
  isMobile?: boolean;
  onClose?: () => void;
  title?: string;
  autoFocus?: boolean;
}

export function CharacterAnimSelector({
  activeAnimValue = 'idle',
  onSelectAnim,
  maxHeight = 'min(45vh, 320px)',
  listMaxHeight = 'min(24vh, 150px)',
  isMobile: isMobileProp,
  onClose,
  title,
  autoFocus = false,
}: CharacterAnimSelectorProps) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileHook;

  const { animSearch, selectedCategories, sortByDuration, setAnimSearch, setSelectedCategories, setSortByDuration } = useAnimPreviewStore();

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [copiedAnim, setCopiedAnim] = useState<string | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const animsContainerRef = useRef<HTMLDivElement>(null);

  const updateSearch = (val: string) => {
    setAnimSearch(val);
  };

  const updateCategories = (cats: string[]) => {
    setSelectedCategories(cats);
  };

  const handleSelect = (val: string) => {
    resetAppIdle();
    onSelectAnim(val);
  };

  const handleCopy = (val: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const path = getAnimationDef(val)?.path || val;
    navigator.clipboard.writeText(path.split('/').pop() || path);
    setCopiedAnim(val);
    setTimeout(() => setCopiedAnim(null), 2000);
  };

  // Fermeture du dropdown lors d'un clic extérieur
  useEffect(() => {
    if (!categoryDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [categoryDropdownOpen]);

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
    if (activeAnimValue && animsContainerRef.current) {
      animsContainerRef.current.querySelector('.active-anim-item')?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeAnimValue]);

  const filteredAnims = useMemo(() => {
    return getFilteredAnimOptions(animSearch, selectedCategories, sortByDuration);
  }, [animSearch, selectedCategories, sortByDuration]);

  const selectNextAnim = (dir: 1 | -1) => {
    resetAppIdle();
    if (!filteredAnims.length) return;
    const idx = filteredAnims.findIndex(a => a.value === activeAnimValue);
    const nextIdx = idx === -1 ? 0 : (idx + dir + filteredAnims.length) % filteredAnims.length;
    handleSelect(filteredAnims[nextIdx].value);
  };

  const playRandomAnim = () => {
    resetAppIdle();
    const pool = filteredAnims.filter(a => a.value !== 'idle');
    if (pool.length) handleSelect(pool[Math.floor(Math.random() * pool.length)].value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      selectNextAnim(e.key === 'ArrowDown' ? 1 : -1);
    }
  };

  return (
    <div
      ref={categoryDropdownRef}
      className="d-flex flex-column bg-transparent overflow-hidden text-dark"
      style={{ maxHeight, minHeight: 0, outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* En-tête */}
      {(title || onClose) && (
        <div className="d-flex flex-shrink-0 align-items-center justify-content-between p-2 border-bottom">
          {title && <span className="fw-semibold small text-truncate"><i className="bi bi-film" aria-hidden="true" /> {title}</span>}
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

      {/* Contrôles et filtres */}
      <div className="p-2 border-bottom flex-shrink-0">
        {/* Recherche + Bouton Aléatoire */}
        <div className="input-group input-group-sm mb-1.5">
          <span className="input-group-text bg-light text-muted border-end-0"><i className="bi bi-search" aria-hidden="true" /></span>
          <input
            ref={searchInputRef}
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Filtrer texte ou flèches..."
            value={animSearch}
            onChange={e => updateSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ fontSize: isMobile ? '13px' : '11px' }}
          />
          {animSearch && (
            <button className="btn btn-outline-secondary border-start-0" type="button" onClick={() => updateSearch('')} aria-label="Effacer la recherche" style={{ fontSize: '10px' }}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
          <button
            className="btn btn-warning text-dark fw-bold border-start-0 px-2"
            type="button"
            onClick={playRandomAnim}
            title="Jouer une animation au hasard parmi la sélection"
            style={{ fontSize: '10px' }}
          >
            <i className="bi bi-shuffle" aria-hidden="true" /> Aléatoire
          </button>
        </div>

        {/* Filtre de catégories */}
        <div className="mb-1.5">
          <div className="btn-group btn-group-sm w-100" role="group" aria-label="Filtres de catégories">
            <button
              type="button"
              className={`btn flex-grow-1 overflow-hidden text-start d-flex justify-content-between align-items-center py-1 px-2 ${
                selectedCategories.length > 0 ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'
              }`}
              style={{ fontSize: isMobile ? '12px' : '11px' }}
              onClick={() => setCategoryDropdownOpen(v => !v)}
              aria-expanded={categoryDropdownOpen}
            >
              <span className="text-truncate">
                <i className="bi bi-folder" aria-hidden="true" /> <strong>Catégories :</strong> {selectedCategories.length === 0
                  ? `Toutes (${ANIM_CATEGORIES.length})`
                  : `${selectedCategories.map(k => ANIM_CATEGORIES.find(c => c.key === k)?.label).join(', ')} (${selectedCategories.length})`
                }
              </span>
              <i className={`bi ${categoryDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1 opacity-75`} aria-hidden="true" />
            </button>

            {selectedCategories.length > 0 && (
              <button
                type="button"
                className="btn btn-primary px-2 flex-shrink-0"
                style={{ fontSize: '10px' }}
                onClick={() => updateCategories([])}
                title="Réinitialiser toutes les catégories"
                aria-label="Tout désélectionner"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="text-muted small px-1 d-flex align-items-center justify-content-between gap-1" style={{ fontSize: '9px' }}>
          <span>{filteredAnims.length} animation{filteredAnims.length > 1 ? 's' : ''}</span>
          <button
            type="button"
            className={`btn btn-sm py-0 px-1 ${sortByDuration ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
            aria-pressed={sortByDuration}
            title="Trier par durée : de la plus longue à la plus courte"
            onClick={() => setSortByDuration(!sortByDuration)}
          >
            <i className="bi bi-sort-numeric-down-alt" aria-hidden="true" /> Durée
          </button>
          <span className="text-muted"><i className="bi bi-arrow-down-up" aria-hidden="true" /> Flèches Clavier</span>
        </div>
      </div>

      {categoryDropdownOpen && (
        <div
          className="p-2 overflow-auto flex-grow-1"
          style={{ maxHeight: listMaxHeight, minHeight: 0 }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom">
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
              style={{ fontSize: '10.5px' }}
              onClick={() => updateCategories(ANIM_CATEGORIES.map(c => c.key))}
            >
              <i className="bi bi-check-all" aria-hidden="true" /> Tout cocher
            </button>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none text-secondary fw-semibold"
              style={{ fontSize: '10.5px' }}
              onClick={() => updateCategories([])}
            >
              <i className="bi bi-x-lg" aria-hidden="true" /> Tout décocher
            </button>
          </div>

          <div className="d-flex flex-column gap-1">
            {ANIM_CATEGORIES.map(cat => {
              const isChecked = selectedCategories.includes(cat.key);
              return (
                <label
                  key={cat.key}
                  className={`d-flex align-items-center justify-content-between px-2 py-1 rounded cursor-pointer mb-0 ${
                    isChecked ? 'bg-primary-subtle text-primary-emphasis fw-semibold' : 'hover-bg-light text-dark'
                  }`}
                  style={{ fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span className="d-flex align-items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="form-check-input mt-0 me-1.5"
                      checked={isChecked}
                      onChange={() => updateCategories(
                        isChecked ? selectedCategories.filter(k => k !== cat.key) : [...selectedCategories, cat.key]
                      )}
                    />
                    <span><i className={`bi ${cat.icon}`} aria-hidden="true" /> {cat.label}</span>
                  </span>
                  <span className={`badge ${isChecked ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary-emphasis'}`} style={{ fontSize: '9px' }}>
                    {CATEGORY_COUNTS[cat.key] || 0}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des animations */}
      <div ref={animsContainerRef} className={categoryDropdownOpen ? 'd-none' : 'overflow-auto flex-grow-1'} style={{ maxHeight: listMaxHeight, minHeight: 0, position: 'relative', scrollBehavior: 'smooth' }}>
        {filteredAnims.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            Aucune animation ne correspond aux filtres actuels
          </div>
        ) : (
          filteredAnims.map(anim => {
            const isActive = activeAnimValue === anim.value || anim.defId === activeAnimValue || anim.defPath === activeAnimValue;

            return (
              <div
                key={anim.value}
                className={`d-flex align-items-center justify-content-between border-bottom px-2 py-2 ${
                  isActive ? 'active-anim-item bg-danger text-white fw-bold shadow-sm' : 'bg-transparent hover-bg-light text-dark'
                }`}
                style={{ fontSize: isMobile ? '13px' : '11px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => handleSelect(anim.value)}
              >
                <div className="d-flex align-items-center gap-1 overflow-hidden me-2" style={{ flex: 1 }}>
                  {isActive && <i className="bi bi-play-fill" aria-hidden="true" />}
                  <span className="text-truncate" title={anim.label}>{anim.label}</span>
                  {sortByDuration && anim.duration !== undefined && (
                    <span className="badge bg-light text-dark flex-shrink-0">
                      <i className="bi bi-stopwatch" aria-hidden="true" /> {anim.duration.toFixed(1)}s
                    </span>
                  )}
                  {anim.catIcon && (
                    <span
                      className={`badge ${isActive ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary-subtle text-secondary-emphasis'} ms-1 fw-normal`}
                      style={{ fontSize: '8px', letterSpacing: '0.02em', flexShrink: 0 }}
                      title={`Catégorie: ${anim.catLabel}`}
                    >
                      <i className={`bi ${anim.catIcon}`} aria-hidden="true" />
                    </span>
                  )}
                  {anim.isPose && (
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
                  onClick={(e) => handleCopy(anim.value, e)}
                  title={`Copier "${anim.filename}"`}
                >
                  <i className={`bi ${copiedAnim === anim.value ? 'bi-check-lg' : 'bi-clipboard'}`} aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
