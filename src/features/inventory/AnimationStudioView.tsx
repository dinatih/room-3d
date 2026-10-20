import { InventoryLinkButton } from './InventoryLinkButton';
import { updateUrlInventory, type InventoryUrlTarget } from './inventoryUrlParams';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { CHARACTERS } from '@features/scene/characterConfig';
import { ANIM_CATEGORIES } from '@features/scene/CharacterAnimSelector';
import { InventoryPreview } from './InventoryPreview';
import { AnimFrameController } from './AnimFrameController';
import { DevAnnotationPanel } from './DevAnnotationPanel';
import { useItemAnnotations, updateAnnotation, exportAnnotationsJson, ANNOTATION_STATUSES } from './useItemAnnotations';
import { getAnimationOriginTransform, getDuoAnimationTransformOverride, setAnimationTransformOverride, setDuoAnimationTransformOverride } from '@features/scene/animations/animationResolver';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import { INVENTORY } from './inventoryData';
import {
  STUDIO_CATALOG, SOURCE_LABELS, EMPTY_STUDIO_FILTERS,
  filterStudioAnimations, adjacentStudioAnimation, type StudioFilters, type StudioAnimation,
} from './animationStudioCatalog';

import { consumePendingInventoryTarget, peekPendingInventoryTarget, type AppLogAnimationRef, type OpenInventoryTargetDetail } from '@features/ui/AppConsole';

export function AnimationStudioView({ initialTarget, isMobile = false, listWidth = 380, onResizeStart }: {
  initialTarget?: InventoryUrlTarget;
  isMobile?: boolean;
  listWidth?: number;
  onResizeStart?: (event: MouseEvent) => void;
}) {
  const [mode, setMode] = useState<'solo' | 'duo'>(initialTarget?.type === 'animation' ? initialTarget.mode : 'solo');
  const [filtersByMode, setFiltersByMode] = useState({ solo: { ...EMPTY_STUDIO_FILTERS }, duo: { ...EMPTY_STUDIO_FILTERS } });
  const [selection, setSelection] = useState({ solo: initialTarget?.type === 'animation' && initialTarget.mode === 'solo' ? initialTarget.id : 'idle', duo: initialTarget?.type === 'animation' && initialTarget.mode === 'duo' ? initialTarget.id : STUDIO_CATALOG.duo[0].id });
  const [actorId, setActorId] = useState('native');
  const [partnerId, setPartnerId] = useState('rosanna');
  const [moreFilters, setMoreFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { allAnnotations } = useItemAnnotations();
  const filters = filtersByMode[mode];
  const catalog = STUDIO_CATALOG[mode];
  const results = useMemo(() => filterStudioAnimations(catalog, filters, allAnnotations), [catalog, filters, allAnnotations]);
  const [missingTarget, setMissingTarget] = useState(initialTarget?.type === 'animation' && !STUDIO_CATALOG[initialTarget.mode].some(a => a.id === initialTarget.id));
  const active = missingTarget ? undefined : results.find(a => a.id === selection[mode]) ?? results[0];
  const activeIndex = active ? results.indexOf(active) : -1;
  const characters = useMemo(() => CHARACTERS.filter(c =>
    INVENTORY.some(item => item.id === c.id && item.category === 'characters') &&
    !['ushiro', 'shiba-inu', 'ulotte', 'robin-bird', 'jikin-goldfish', 'tosakin-goldfish', 'black-hornet-drone', 'unitree-g1', 'unitree-go2', 'jumper-robot'].includes(c.id)
  ), []);
  const leader = characters.find(c => c.id === actorId) ?? characters[0];
  const partners = characters.filter(c => c.id !== leader?.id);
  const partner = partners.find(c => c.id === partnerId) ?? partners[0];
  const currentItem = INVENTORY.find(i => i.id === leader?.id);
  const sources = [...new Set(catalog.flatMap(a => a.sources))].sort();
  const categories = mode === 'solo'
    ? [...new Set(catalog.map(a => a.category))].map(key => ({ key, label: ANIM_CATEGORIES.find(c => c.key === key)?.label ?? key }))
    : [{ key: 'combat', label: 'Combat' }, { key: 'social', label: 'Danse & Social' }];
  const tags = [...new Set(catalog.flatMap(a => allAnnotations[a.annotationId]?.tags ?? []))].sort();
  const advancedCount = [filters.status, filters.tag, filters.minDuration, filters.maxDuration].filter(Boolean).length;
  const isFiltered = Object.entries(filters).some(([key, value]) => value !== EMPTY_STUDIO_FILTERS[key as keyof StudioFilters]);

  function applyExternalAnimationTarget(target: AppLogAnimationRef) {
    const resolvedMode: 'solo' | 'duo' = target.mode
      ?? (STUDIO_CATALOG.duo.some(a => a.id === target.id) ? 'duo' : 'solo');
    const targetCatalog = STUDIO_CATALOG[resolvedMode];
    const match = targetCatalog.find(a => a.id === target.id);
    if (!match) return;
    setMissingTarget(false);
    setMode(resolvedMode);
    updateUrlInventory(true, 'animations', { type: 'animation', id: match.id, mode: resolvedMode });
    setFiltersByMode(previous => ({ ...previous, [resolvedMode]: { ...EMPTY_STUDIO_FILTERS } }));
    setSelection(previous => ({ ...previous, [resolvedMode]: match.id }));
    if (target.actorId && characters.some(c => c.id === target.actorId)) {
      setActorId(target.actorId);
    }
    if (target.partnerId && characters.some(c => c.id === target.partnerId && c.id !== target.actorId)) {
      setPartnerId(target.partnerId);
    }
    const transport = useAnimPreviewStore.getState();
    transport.seekToTime(0);
    transport.play();
  }

  useEffect(() => {
    const pending = peekPendingInventoryTarget();
    if (pending?.type === 'animation') {
      consumePendingInventoryTarget();
      applyExternalAnimationTarget(pending.animation);
    }
    const onOpenTarget = (e: Event) => {
      const detail = (e as CustomEvent<OpenInventoryTargetDetail>).detail;
      if (detail.type === 'animation') {
        consumePendingInventoryTarget();
        applyExternalAnimationTarget(detail.animation);
      }
    };
    document.addEventListener('open-inventory-target', onOpenTarget);
    return () => document.removeEventListener('open-inventory-target', onOpenTarget);
  }, [characters]);

  useEffect(() => {
    if (!missingTarget) updateUrlInventory(true, 'animations', active ? { type: 'animation', id: active.id, mode } : undefined, 'replace');
  }, [active?.id, mode, missingTarget]);

  function updateFilters(patch: Partial<StudioFilters>) {
    setFiltersByMode(previous => ({ ...previous, [mode]: { ...previous[mode], ...patch } }));
  }
  function selectAnimation(animation: StudioAnimation | undefined) {
    if (!animation) return;
    setSelection(previous => ({ ...previous, [mode]: animation.id }));
    updateUrlInventory(true, 'animations', { type: 'animation', id: animation.id, mode });
    const transport = useAnimPreviewStore.getState();
    transport.seekToTime(0);
    transport.play();
  }
  function navigate(direction: 1 | -1) {
    selectAnimation(adjacentStudioAnimation(results, active?.id, direction));
  }
  function random() {
    const pool = results.filter(a => a.id !== active?.id);
    selectAnimation(pool.length ? pool[Math.floor(Math.random() * pool.length)] : active);
  }
  function saveAlignment() {
    if (!active) return;
    const override = active.duo ? getDuoAnimationTransformOverride(active.id) : undefined;
    const solo = getAnimationOriginTransform(active.id);
    const offset = active.duo ? override?.offsetB ?? active.duo.offsetB ?? [0, 0, 0] : solo.offset;
    const rotation = active.duo ? override?.rotB ?? active.duo.rotB ?? 0 : solo.rotY;
    updateAnnotation(active.annotationId, {
      customOffsets: { x: offset[0], y: offset[1], z: offset[2], rotY: rotation },
      ...(active.duo ? { duoPartner: partner?.id } : {}),
    });
  }
  function applyAlignment() {
    if (!active) return;
    const saved = allAnnotations[active.annotationId];
    const offsets = saved?.customOffsets;
    if (!offsets) return;
    const offset: [number, number, number] = [offsets.x ?? 0, offsets.y ?? 0, offsets.z ?? 0];
    if (active.duo) {
      setDuoAnimationTransformOverride(active.id, { offsetB: offset, rotB: offsets.rotY ?? 0 });
      if (saved.duoPartner) setPartnerId(saved.duoPartner);
    } else setAnimationTransformOverride(active.id, { offset, rotY: offsets.rotY ?? 0 });
  }
  function exportAnnotations() {
    const url = URL.createObjectURL(new Blob([exportAnnotationsJson()], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'room3d-annotations.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  function handleKeys(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    const element = event.target as HTMLElement;
    const typing = element.matches('input, textarea, select') || element.isContentEditable;
    // Search remains editable; up/down browses its results without losing focus.
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && (!typing || element === searchRef.current)) {
      event.preventDefault(); event.stopPropagation();
      navigate(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (typing) return;
    const transport = useAnimPreviewStore.getState();
    if (event.code === 'Space') transport.togglePlay();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') transport.stepFrame((event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 5 : 1));
    else if (event.key === 'Home') transport.seekToFrame(0);
    else if (event.key.toLowerCase() === 'd') random();
    else return;
    event.preventDefault(); event.stopPropagation();
  }

  useEffect(() => {
    const transport = useAnimPreviewStore.getState();
    transport.seekToTime(0);
    if (active) transport.play();
    else transport.pause();
  }, [active?.id, mode]);
  useEffect(() => {
    if (active && selection[mode] !== active.id) setSelection(previous => ({ ...previous, [mode]: active.id }));
  }, [active, mode, selection]);
  useEffect(() => {
    // Only scroll the list, never the surrounding tool panel or modal.
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !row) return;
    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    if (rowBox.top < listBox.top) list.scrollTop += rowBox.top - listBox.top;
    else if (rowBox.bottom > listBox.bottom) list.scrollTop += rowBox.bottom - listBox.bottom;
  }, [active?.id, results]);

  if (missingTarget) return <div className="p-4" role="alert">Fiche introuvable. <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { updateUrlInventory(true, 'animations'); setMissingTarget(false); setSelection({ solo: 'idle', duo: STUDIO_CATALOG.duo[0].id }); }}>Revenir à la catégorie</button></div>;

  return (
    <div className={`animation-studio w-100 h-100 overflow-hidden ${isMobile ? 'animation-studio--mobile' : ''}`}
      style={isMobile ? undefined : { gridTemplateColumns: `${listWidth}px 5px minmax(0, 1fr)` }}
      onKeyDown={handleKeys}>
      <div className="animation-studio__list d-flex flex-column border-end bg-white overflow-hidden">
        <div className="p-2 border-bottom flex-shrink-0">
          <div className="btn-group btn-group-sm w-100 mb-2" role="group" aria-label="Type d’animation">
            {(['solo', 'duo'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value}
              className={`btn ${mode === value ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => { setMissingTarget(false); setMode(value); updateUrlInventory(true, 'animations', { type: 'animation', id: selection[value], mode: value }); }}>
              {value === 'solo' ? 'Solo' : 'Duo'} ({STUDIO_CATALOG[value].length})
            </button>)}
          </div>
          <div className="input-group input-group-sm mb-2">
            <input ref={searchRef} type="text" className="form-control" aria-label="Rechercher une animation"
              placeholder="Nom, identifiant, tags, notes…" value={filters.search} onChange={e => updateFilters({ search: e.target.value })} />
            {filters.search && <button type="button" className="btn btn-outline-secondary px-3"
              aria-label="Effacer la recherche d’animation" title="Effacer la recherche"
              onClick={() => { updateFilters({ search: '' }); searchRef.current?.focus(); }}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>}
          </div>
          <div className="d-flex gap-2 mb-2">
            <select aria-label="Catégorie d’animation" className="form-select form-select-sm" value={filters.category} onChange={e => updateFilters({ category: e.target.value })}>
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select aria-label="Source d’animation" className="form-select form-select-sm" value={filters.source} onChange={e => updateFilters({ source: e.target.value })}>
              <option value="">Toutes les sources</option>
              {sources.map(source => <option key={source} value={source}>{SOURCE_LABELS[source] ?? source}</option>)}
            </select>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <select aria-label="Trier les animations" className="form-select form-select-sm" value={filters.sort} onChange={e => updateFilters({ sort: e.target.value as StudioFilters['sort'] })}>
              <option value="catalog">Ordre du catalogue</option><option value="name">Nom A → Z</option>
              <option value="shortest">Durée croissante</option><option value="longest">Durée décroissante</option>
            </select>
            <button type="button" className="btn btn-sm btn-outline-secondary text-nowrap" aria-expanded={moreFilters} onClick={() => setMoreFilters(v => !v)}>
              Filtres{advancedCount > 0 ? ` (${advancedCount})` : ''}
            </button>
          </div>
          {moreFilters && <div className="d-flex flex-column gap-2 mt-2">
            <div className="d-flex gap-2">
              <select aria-label="Statut d’annotation" className="form-select form-select-sm" value={filters.status} onChange={e => updateFilters({ status: e.target.value as StudioFilters['status'] })}>
                <option value="">Tous les statuts</option><option value="unannotated">Sans annotation</option>
                {Object.entries(ANNOTATION_STATUSES).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}
              </select>
              <select aria-label="Tag d’annotation" className="form-select form-select-sm" value={filters.tag} onChange={e => updateFilters({ tag: e.target.value })}>
                <option value="">Tous les tags</option>{tags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
              </select>
            </div>
            <div className="d-flex gap-2 align-items-center small">
              <span>Durée (s)</span>
              <input aria-label="Durée minimale" type="number" min="0" step="any" className="form-control form-control-sm" placeholder="Min" value={filters.minDuration} onChange={e => updateFilters({ minDuration: e.target.value })} />
              <input aria-label="Durée maximale" type="number" min="0" step="any" className="form-control form-control-sm" placeholder="Max" value={filters.maxDuration} onChange={e => updateFilters({ maxDuration: e.target.value })} />
            </div>
          </div>}
          <div className="d-flex justify-content-between align-items-center mt-2 small text-muted">
            <span aria-live="polite">{results.length} / {catalog.length} animations</span>
            <button type="button" className="btn btn-sm btn-outline-primary text-nowrap" aria-label="Lancer une animation aléatoire parmi les résultats filtrés"
              title="Lancer une animation au hasard parmi les résultats filtrés" disabled={!results.length} onClick={random}>
              <i className="bi bi-shuffle me-1" aria-hidden="true" />Au hasard
            </button>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={exportAnnotations} title="Exporter toutes les annotations locales en JSON">Exporter</button>
            <button type="button" className="btn btn-link btn-sm p-0" disabled={!isFiltered} onClick={() => updateFilters(EMPTY_STUDIO_FILTERS)}>Réinitialiser</button>
          </div>
        </div>
        <div ref={listRef} className="animation-studio__results overflow-auto flex-grow-1" role="listbox" aria-label="Animations filtrées">
          {!results.length && <p className="p-3 small text-muted">Aucune animation ne correspond aux filtres.</p>}
          {results.map(a => {
            const annotation = allAnnotations[a.annotationId];
            return <button key={a.id} type="button" role="option" aria-selected={a.id === active?.id} tabIndex={a.id === active?.id ? 0 : -1} data-animation-id={a.id}
              className={`animation-studio__row w-100 text-start border-0 border-bottom p-2 ${a.id === active?.id ? 'bg-danger-subtle fw-semibold' : 'bg-transparent'}`}
              onClick={() => selectAnimation(a)}>
              <span className="d-flex gap-2 align-items-start justify-content-between">
                <span className="text-break small">{a.label}</span>
                {a.duration !== undefined && <span className="badge bg-light text-secondary border flex-shrink-0">{a.duration.toFixed(1)}s</span>}
              </span>
              <span className="d-flex flex-wrap align-items-center gap-1 mt-1 small text-muted">
                {a.sources.map(source => <span key={source}>{SOURCE_LABELS[source] ?? source}</span>)}
                {annotation?.status && <span className={`badge text-bg-${ANNOTATION_STATUSES[annotation.status].color}`}>{ANNOTATION_STATUSES[annotation.status].label}</span>}
                {annotation?.tags.map(tag => <span key={tag} className="badge bg-secondary-subtle text-dark">#{tag}</span>)}
                {annotation?.notes && <i className="bi bi-chat-left-text" title={annotation.notes} aria-label="Note enregistrée" />}
              </span>
            </button>;
          })}
        </div>
      </div>
      {!isMobile && <div className="animation-studio__splitter bg-secondary bg-opacity-25" role="separator" aria-orientation="vertical"
        aria-label="Redimensionner la liste des animations" onMouseDown={onResizeStart} title="Glisser pour redimensionner la liste" />}
      <div className="animation-studio__workspace bg-light">
        <div className="py-1 px-2 border-bottom bg-white d-flex flex-wrap align-items-center gap-2">
          {active && <InventoryLinkButton key={`${mode}:${active.id}`} state={{ open: true, category: 'animations', target: { type: 'animation', id: active.id, mode } }} />}
          <label className="d-flex align-items-center gap-1 small text-muted text-nowrap mb-0">{mode === 'solo' ? 'Personnage' : 'Leader A'}
            <select aria-label="Personnage testé" className="form-select form-select-sm py-0.5 ps-2 pe-4 w-auto small" value={leader?.id ?? ''} onChange={e => setActorId(e.target.value)}>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          {mode === 'duo' && <>
            <button type="button" className="btn btn-sm py-0.5 px-2 btn-outline-secondary" aria-label="Échanger les personnages" disabled={!partner}
              onClick={() => { setActorId(partner!.id); setPartnerId(leader.id); }}><i className="bi bi-arrow-left-right" /></button>
            <label className="d-flex align-items-center gap-1 small text-muted text-nowrap mb-0">Partenaire B
              <select aria-label="Partenaire du duo" className="form-select form-select-sm py-0.5 ps-2 pe-4 w-auto small" value={partner?.id ?? ''} onChange={e => setPartnerId(e.target.value)}>
                {partners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </>}
        </div>
        <div className="animation-studio__preview w-100 position-relative">
          {active && currentItem ? <InventoryPreview key={mode} item={currentItem} height="100%" hideFooter showPhotoGallery={false} defaultShowGrid neutralLighting defaultAutoRotate={false} hideAnimFrameController preserveStateOnItemChange
            initialAnim={mode === 'solo' ? active.id : undefined} initialDuoAnim={active.duo} initialDuoPartner={partner?.id} />
            : <div className="h-100 d-flex align-items-center justify-content-center text-muted p-3">Modifiez les filtres pour sélectionner une animation.</div>}
        </div>
        <div className="animation-studio__tools">
          <div className="animation-studio__transport p-2 border-top bg-white">
            <div className="d-flex gap-2 align-items-center mb-2">
              <div className="btn-group btn-group-sm flex-shrink-0" role="group" aria-label="Parcourir les résultats filtrés">
                <button type="button" className="btn btn-outline-secondary" aria-label="Animation précédente" title="Précédente (↑)" disabled={!active} onClick={() => navigate(-1)}><i className="bi bi-chevron-up" /></button>
                <button type="button" className="btn btn-outline-secondary" aria-label="Animation suivante" title="Suivante (↓)" disabled={!active} onClick={() => navigate(1)}><i className="bi bi-chevron-down" /></button>
                <button type="button" className="btn btn-outline-secondary" aria-label="Animation aléatoire filtrée" title="Aléatoire dans les résultats (D)" disabled={!active} onClick={random}><i className="bi bi-shuffle" /></button>
              </div>
              <span className="small text-muted text-nowrap">{activeIndex + 1} / {results.length}</span>
              <span className="small text-truncate" title={active?.label}>{active?.label ?? 'Aucune sélection'}</span>
            </div>
            {active && currentItem && <AnimFrameController key={mode} compact keyboardEnabled={false} showAnimationSelectors={false}
              animName={active.label} animKey={mode === 'solo' ? active.id : undefined} isHumanCharacter characterId={currentItem.id}
              duoAnimDef={active.duo} duoPartnerId={partner?.id}
              style={{ position: 'relative', zIndex: 'auto', inset: 'auto', width: '100%', margin: 0 }} />}
          </div>
          {active && <div className="animation-studio__annotations p-2 border-top bg-light">
            <div className="d-flex flex-wrap gap-2 mb-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={saveAlignment}>Mémoriser le calage{active.duo ? ' B' : ''}</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!allAnnotations[active.annotationId]?.customOffsets} onClick={applyAlignment}>Appliquer le calage mémorisé</button>
            </div>
            <DevAnnotationPanel key={active.annotationId} targetId={active.annotationId} targetName={active.label} />
          </div>}
        </div>
      </div>
    </div>
  );
}
