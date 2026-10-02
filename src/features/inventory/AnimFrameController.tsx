import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import { getAnimationDef, resolveAnimationId } from '@features/scene/animations/animationResolver';
import { ANIMATION_DEFINITIONS, type AnimationDefinition } from '@features/scene/animations/animationRegistry';
import { CharacterAnimSelector, ANIM_CATEGORIES, getAnimCategory, getFilteredAnimOptions } from '@features/scene/CharacterAnimSelector';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

export interface AnimFrameControllerProps {
  animName?: string;
  animKey?: string;
  animDef?: AnimationDefinition;
  onCycleAnim?: (direction: 'next' | 'prev') => void;
  onSelectAnim?: (animValue: string) => void;
  bottom?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimFrameController({
  animName,
  animKey,
  animDef,
  onCycleAnim,
  onSelectAnim,
  bottom = 8,
  className = '',
  style = {},
}: AnimFrameControllerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    fps,
    speed,
    isTPose,
    clipName,
    animSearch,
    selectedCategories,
    togglePlay,
    setSpeed,
    setScrubbing,
    seekToFrame,
    stepFrame,
  } = useAnimPreviewStore();

  const [inputFrame, setInputFrame] = useState<string>('');
  const [isEditingFrame, setIsEditingFrame] = useState<boolean>(false);
  const [showMeta, setShowMeta] = useState<boolean>(false);
  const [showAnimSelector, setShowAnimSelector] = useState<boolean>(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const totalFrames = duration > 0 ? Math.max(1, Math.round(duration * fps)) : 0;
  const currentFrame = duration > 0 ? Math.min(totalFrames, Math.round(currentTime * fps)) : 0;

  useEffect(() => {
    if (!isEditingFrame) {
      setInputFrame(currentFrame.toString());
    }
  }, [currentFrame, isEditingFrame]);

  // Résolution de la définition complète de l'animation
  const targetKey = animKey || animName || clipName;
  const def = useMemo(() => {
    if (animDef) return animDef;
    if (!targetKey) return undefined;
    const direct = getAnimationDef(targetKey);
    if (direct) return direct;
    const clean = targetKey.trim().toLowerCase();
    return ANIMATION_DEFINITIONS.find(
      d =>
        d.id.toLowerCase() === clean ||
        d.label?.toLowerCase() === clean ||
        d.path.toLowerCase().includes(clean) ||
        d.aliases?.some(a => a.toLowerCase() === clean)
    );
  }, [animDef, animKey, animName, clipName, targetKey]);

  const catKey = def?.path ? getAnimCategory(def.path) : undefined;
  const catObj = catKey ? ANIM_CATEGORIES.find(c => c.key === catKey) : undefined;

  const displayName = useMemo(() => {
    if (animName && !animName.includes('/') && !animName.endsWith('.glb')) {
      return animName;
    }
    return def?.label || animName || clipName || def?.id || 'Animation';
  }, [animName, def, clipName]);

  const hasMeta = Boolean(def || isTPose);
  const activeAnimValue = animKey || def?.id || 'idle';

  const handleSelectAnim = useCallback((val: string) => {
    if (onSelectAnim) {
      onSelectAnim(val);
    } else {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: val } }));
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: val } }));
      useAnimPreviewStore.getState().play();
    }
    setShowAnimSelector(false);
  }, [onSelectAnim]);

  // Animations filtrées selon la recherche et catégories de CharacterAnimSelector
  const filteredAnims = useMemo(() => {
    return getFilteredAnimOptions(animSearch, selectedCategories);
  }, [animSearch, selectedCategories]);

  // Navigation précédente / suivante limitée strictement aux résultats filtrés
  const cycleFilteredAnim = useCallback((direction: 'next' | 'prev') => {
    if (!filteredAnims.length) return;
    const currentVal = activeAnimValue;
    const targetId = resolveAnimationId(currentVal);
    const currIdx = filteredAnims.findIndex(a => a.value === targetId || a.value === currentVal);
    let nextIdx = 0;
    if (currIdx === -1) {
      nextIdx = direction === 'next' ? 0 : filteredAnims.length - 1;
    } else {
      nextIdx = direction === 'next'
        ? (currIdx + 1) % filteredAnims.length
        : (currIdx - 1 + filteredAnims.length) % filteredAnims.length;
    }
    const nextVal = filteredAnims[nextIdx].value;
    handleSelectAnim(nextVal);
    onCycleAnim?.(direction);
  }, [filteredAnims, activeAnimValue, handleSelectAnim, onCycleAnim]);

  // Sélection aléatoire d'une animation parmi la liste filtrée
  const handleRandomAnim = useCallback(() => {
    if (!filteredAnims.length) return;
    const currentVal = activeAnimValue;
    const targetId = resolveAnimationId(currentVal);
    let pool = filteredAnims.filter(a => a.value !== targetId && a.value !== currentVal);
    if (!pool.length) pool = filteredAnims;
    const randomIndex = Math.floor(Math.random() * pool.length);
    handleSelectAnim(pool[randomIndex].value);
  }, [filteredAnims, activeAnimValue, handleSelectAnim]);

  // Raccourcis clavier : Espace (Play/Pause), Flèches Gauche/Droite (-1/+1 frame), Début (Frame 0), Flèches Haut/Bas (Cycle Anim filtré)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        stepFrame(e.shiftKey ? -5 : -1);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        stepFrame(e.shiftKey ? 5 : 1);
        return;
      }

      if (e.key === 'Home' || e.key === '0') {
        e.preventDefault();
        e.stopPropagation();
        seekToFrame(0);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        cycleFilteredAnim('prev');
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        cycleFilteredAnim('next');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame, seekToFrame, cycleFilteredAnim]);

  const handleFrameCommit = () => {
    setIsEditingFrame(false);
    const parsed = parseInt(inputFrame, 10);
    if (!isNaN(parsed)) {
      seekToFrame(parsed);
    } else {
      setInputFrame(currentFrame.toString());
    }
  };

  // Fermer le sélecteur d'animation lors d'un clic extérieur
  useEffect(() => {
    if (!showAnimSelector) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setShowAnimSelector(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showAnimSelector]);

  return (
    <div
      className={`card glass-card rounded-3 shadow-sm p-1.5 p-sm-2 text-dark user-select-none ${className}`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom,
        left: 10,
        right: 10,
        zIndex: 90,
        ...style,
      }}
    >
      {/* Popover Sélecteur d'animation CharacterAnimSelector */}
      {showAnimSelector && (
        <div
          ref={selectorRef}
          className="position-absolute bottom-100 end-0 mb-2 glass-card rounded-3 shadow-lg overflow-hidden d-flex flex-column w-100"
          style={{
            maxWidth: '440px',
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <CharacterAnimSelector
            activeAnimValue={activeAnimValue}
            onSelectAnim={handleSelectAnim}
            onClose={() => setShowAnimSelector(false)}
            title="Animations Personnage"
            autoFocus={true}
          />
        </div>
      )}

      {/* ── Ligne 1 : Timeline Slider ── */}
      <div className="d-flex align-items-center gap-1.5 w-100 mb-1">
        <span className="text-muted font-monospace small" style={{ fontSize: '0.75rem' }}>0</span>
        <input
          ref={sliderRef}
          type="range"
          className="form-range flex-grow-1"
          min={0}
          max={totalFrames}
          step={1}
          value={currentFrame}
          disabled={isTPose || totalFrames === 0}
          onPointerDown={() => setScrubbing(true)}
          onPointerUp={() => setScrubbing(false)}
          onChange={e => seekToFrame(parseInt(e.target.value, 10))}
          style={{ cursor: isTPose ? 'not-allowed' : 'pointer' }}
          title={
            isTPose
              ? 'T-Pose (Pose statique sans frame)'
              : `Frame ${currentFrame} / ${totalFrames} (${currentTime.toFixed(2)}s)`
          }
        />
        <span className="text-muted font-monospace small" style={{ fontSize: '0.75rem' }}>{totalFrames}</span>
      </div>

      {/* ── Ligne 2 : Transport, Compteurs, Sélecteur & Actions ── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1.5">
        {/* Groupe boutons de lecture */}
        <div className="btn-group btn-group-sm" role="group">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary bg-white text-dark py-0.5 px-2"
            onClick={() => seekToFrame(0)}
            disabled={isTPose}
            title="Début (Frame 0 — Début / 0)"
          >
            <i className="bi bi-skip-backward-fill" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary bg-white text-dark py-0.5 px-2"
            onClick={() => stepFrame(-1)}
            disabled={isTPose}
            title="Frame précédente (-1f — Flèche Gauche, Maj: -5f)"
          >
            <i className="bi bi-caret-left-fill" />
          </button>
          <button
            type="button"
            className={`btn btn-sm py-0.5 px-2 fw-bold d-inline-flex align-items-center gap-1 ${
              isPlaying ? 'btn-danger text-white shadow-sm' : 'btn-warning text-dark shadow-sm'
            }`}
            onClick={togglePlay}
            disabled={isTPose}
            title={isPlaying ? 'Pause (Espace)' : 'Play (Espace)'}
          >
            <i className={isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'} />
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary bg-white text-dark py-0.5 px-2"
            onClick={() => stepFrame(1)}
            disabled={isTPose}
            title="Frame suivante (+1f — Flèche Droite, Maj: +5f)"
          >
            <i className="bi bi-caret-right-fill" />
          </button>
        </div>

        {/* Compteur précis de Frame & Temps */}
        <div className="d-flex align-items-center gap-1.5">
          {isTPose ? (
            <span className="badge bg-success-subtle text-success border border-success-subtle py-1 px-2 small">
              📐 T-Pose (Rest)
            </span>
          ) : (
            <>
              <div className="input-group input-group-sm font-monospace" style={{ width: 'auto' }} title="Cliquer pour entrer une frame précise">
                <span className="input-group-text bg-white text-muted border-end-0 py-0.5 px-1.5 small" style={{ fontSize: '0.75rem' }}>
                  Frame:
                </span>
                <input
                  type="number"
                  min={0}
                  max={totalFrames}
                  value={inputFrame}
                  onFocus={() => setIsEditingFrame(true)}
                  onChange={e => setInputFrame(e.target.value)}
                  onBlur={handleFrameCommit}
                  onKeyDown={e => e.key === 'Enter' && handleFrameCommit()}
                  className="form-control form-control-sm bg-white text-dark border-start-0 border-end-0 text-center fw-bold py-0.5 px-1 small"
                  style={{ width: '52px', fontSize: '0.8rem' }}
                />
                <span className="input-group-text bg-white text-muted border-start-0 py-0.5 px-1.5 small" style={{ fontSize: '0.75rem' }}>
                  / {totalFrames}
                </span>
              </div>
              <span className="badge bg-white text-dark border shadow-sm font-monospace py-1 px-1.5 small" style={{ fontSize: '0.75rem' }}>
                {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </>
          )}
        </div>

        {/* Droite : Sélecteur d'animation, Bouton Dé aléatoire, Vitesse & Meta */}
        <div className="d-flex align-items-center gap-1.5">
          {/* Groupe Navigation Anim + Dé */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary bg-white text-dark py-0.5 px-1.5"
              onClick={() => cycleFilteredAnim('prev')}
              disabled={filteredAnims.length <= 1}
              title={`Animation précédente (${filteredAnims.length} dans le filtre / Flèche Haut)`}
            >
              <i className="bi bi-chevron-up" />
            </button>

            <button
              ref={badgeRef}
              type="button"
              className={`btn btn-sm py-0.5 px-2 d-inline-flex align-items-center gap-1 text-truncate ${
                showAnimSelector
                  ? 'btn-danger text-white shadow-sm'
                  : 'btn-outline-secondary bg-white text-dark'
              }`}
              style={{ maxWidth: '260px', fontSize: '0.8rem' }}
              onClick={() => setShowAnimSelector(v => !v)}
              title={
                showAnimSelector
                  ? "Fermer le sélecteur d'animations"
                  : `Animation : ${displayName} (${filteredAnims.length} filtrée(s) — Cliquer pour ouvrir)`
              }
            >
              <span>🎬</span>
              <span className="text-truncate">{displayName}</span>
              <span className="opacity-75 small">{showAnimSelector ? '▲' : '▼'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary bg-white text-dark py-0.5 px-1.5"
              onClick={() => cycleFilteredAnim('next')}
              disabled={filteredAnims.length <= 1}
              title={`Animation suivante (${filteredAnims.length} dans le filtre / Flèche Bas)`}
            >
              <i className="bi bi-chevron-down" />
            </button>

            <button
              type="button"
              className="btn btn-sm btn-warning text-dark fw-bold py-0.5 px-1.5"
              onClick={handleRandomAnim}
              disabled={!filteredAnims.length}
              title={`Animation aléatoire parmi les ${filteredAnims.length} filtrée(s)`}
            >
              🎲
            </button>
          </div>

          {/* Vitesse */}
          <div className="d-flex align-items-center gap-1">
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>⚡</span>
            <select
              className="form-select form-select-sm bg-white text-dark py-0.5 px-2 small"
              style={{ width: 'auto', fontSize: '0.8rem' }}
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              title="Vitesse de lecture"
            >
              {SPEED_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Toggle Métadonnées */}
          {hasMeta && (
            <button
              type="button"
              className={`btn btn-sm py-0.5 px-1.5 d-inline-flex align-items-center gap-1 ${
                showMeta
                  ? 'btn-secondary text-white shadow-sm'
                  : 'btn-outline-secondary bg-white text-dark'
              }`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => setShowMeta(v => !v)}
              title={showMeta ? 'Masquer le volet métadonnées' : 'Afficher le volet métadonnées'}
            >
              <i className="bi bi-info-circle" />
              <span className="fw-semibold">Meta</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Ligne 3 : Métadonnées ── */}
      {showMeta && hasMeta && (
        <div className="card bg-white bg-opacity-75 border-0 shadow-sm p-1.5 mt-1.5 text-dark user-select-text small" style={{ fontSize: '0.75rem' }}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div>
              <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>ID:</strong>
              <code className="text-dark bg-light px-1.5 py-0.5 rounded border">
                {def?.id || (isTPose ? 't-pose' : displayName)}
              </code>
            </div>
            {catObj && (
              <div>
                <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>Catégorie:</strong>
                <span className="badge bg-light text-dark border">
                  {catObj.icon} {catObj.label}
                </span>
              </div>
            )}
            {def?.path && (
              <div>
                <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>Fichier:</strong>
                <code className="text-muted bg-light px-1.5 py-0.5 rounded border text-truncate d-inline-block align-middle" style={{ maxWidth: '240px' }} title={def.path}>
                  📁 {def.path.split('/').pop()}
                </code>
              </div>
            )}
            {def?.defaultOffset && (
              <div>
                <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>Offset Pos:</strong>
                <span className="badge bg-warning-subtle text-dark border border-warning-subtle font-monospace">
                  [{def.defaultOffset.map(v => `${v}cm`).join(', ')}]
                </span>
              </div>
            )}
            {def?.defaultRotYOffset !== undefined && (
              <div>
                <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>Offset Rot Y:</strong>
                <span className="badge bg-warning-subtle text-dark border border-warning-subtle font-monospace">
                  {(def.defaultRotYOffset * (180 / Math.PI)).toFixed(1)}°
                </span>
              </div>
            )}
            <div>
              <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>Durée:</strong>
              <span className="text-success fw-bold font-monospace">
                {(def?.duration ?? duration).toFixed(2)}s ({totalFrames}f @ {fps}fps)
              </span>
            </div>
          </div>
          {def?.aliases && def.aliases.length > 0 && (
            <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
              <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>🏷️ Aliases ({def.aliases.length}):</strong>
              {def.aliases.map(alias => (
                <span key={alias} className="badge bg-light text-secondary border font-monospace">
                  {alias}
                </span>
              ))}
            </div>
          )}
          {def?.tags && def.tags.length > 0 && (
            <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
              <strong className="text-muted text-uppercase user-select-none me-1" style={{ fontSize: '0.7rem' }}>🔖 Tags ({def.tags.length}):</strong>
              {def.tags.map(tag => (
                <span key={tag} className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
