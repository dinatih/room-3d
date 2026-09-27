import { useState, useEffect, useRef, useMemo } from 'react';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import { getAnimationDef } from '@features/scene/animations/animationResolver';
import { ANIMATION_DEFINITIONS, type AnimationDefinition } from '@features/scene/animations/animationRegistry';
import { ANIM_CATEGORIES, getAnimCategory } from '@features/scene/CharacterAnimSelector';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

export interface AnimFrameControllerProps {
  animName?: string;
  animKey?: string;
  animDef?: AnimationDefinition;
  onCycleAnim?: (direction: 'next' | 'prev') => void;
  bottom?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimFrameController({
  animName,
  animKey,
  animDef,
  onCycleAnim,
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
    isLooping,
    isTPose,
    clipName,
    togglePlay,
    setSpeed,
    setLooping,
    setScrubbing,
    seekToFrame,
    stepFrame,
  } = useAnimPreviewStore();

  const [inputFrame, setInputFrame] = useState<string>('');
  const [isEditingFrame, setIsEditingFrame] = useState<boolean>(false);
  const [showMeta, setShowMeta] = useState<boolean>(true);
  const sliderRef = useRef<HTMLInputElement>(null);

  const totalFrames = duration > 0 ? Math.max(1, Math.round(duration * fps)) : 0;
  const currentFrame = duration > 0 ? Math.min(totalFrames, Math.round(currentTime * fps)) : 0;
  const progressPct = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  useEffect(() => {
    if (!isEditingFrame) {
      setInputFrame(currentFrame.toString());
    }
  }, [currentFrame, isEditingFrame]);

  // Raccourcis clavier : Espace (Play/Pause), Flèches Gauche/Droite (-1/+1 frame), Début (Frame 0), Flèches Haut/Bas (Cycle Anim)
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

      if (e.key === 'ArrowUp' && onCycleAnim) {
        e.preventDefault();
        e.stopPropagation();
        onCycleAnim('prev');
        return;
      }

      if (e.key === 'ArrowDown' && onCycleAnim) {
        e.preventDefault();
        e.stopPropagation();
        onCycleAnim('next');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame, seekToFrame, onCycleAnim]);

  const handleFrameCommit = () => {
    setIsEditingFrame(false);
    const parsed = parseInt(inputFrame, 10);
    if (!isNaN(parsed)) {
      seekToFrame(parsed);
    } else {
      setInputFrame(currentFrame.toString());
    }
  };

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

  return (
    <div
      className={`anim-mixamo-controller ${className}`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom,
        left: 10,
        right: 10,
        zIndex: 90,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 8,
        padding: '6px 12px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        userSelect: 'none',
        color: '#f1f5f9',
        fontSize: 11,
        ...style,
      }}
    >
      {/* ── Ligne 1 : Timeline Slider (Scrubber comme dans Mixamo) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#94a3b8',
            minWidth: 28,
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          0
        </span>

        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={totalFrames}
            step={1}
            value={currentFrame}
            disabled={isTPose || totalFrames === 0}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            onChange={e => {
              seekToFrame(parseInt(e.target.value, 10));
            }}
            style={{
              width: '100%',
              height: 6,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #0284c7 ${progressPct}%, #334155 ${progressPct}%)`,
              borderRadius: 3,
              outline: 'none',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title={
              isTPose
                ? 'T-Pose (Pose statique sans frame)'
                : `Frame ${currentFrame} / ${totalFrames} (${currentTime.toFixed(2)}s)`
            }
          />
        </div>

        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#94a3b8',
            minWidth: 28,
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          {totalFrames}
        </span>
      </div>

      {/* ── Ligne 2 : Transport, Compteurs Frames/Temps, Animation & Vitesse ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {/* Groupe boutons de lecture */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Revenir au début (Frame 0) */}
          <button
            type="button"
            onClick={() => seekToFrame(0)}
            disabled={isTPose}
            style={{
              padding: '3px 6px',
              fontSize: 10,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title="Revenir au début (Frame 0 / Raccourci: 0 ou Home)"
          >
            ⏮
          </button>

          {/* Reculer d'une frame (-1f) */}
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            disabled={isTPose}
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title="Frame précédente (-1 frame / Raccourci: Flèche Gauche, Maj+Gauche: -5f)"
          >
            ◀
          </button>

          {/* Play / Pause Toggle principal */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isTPose}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 'bold',
              background: isPlaying
                ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: isPlaying ? '0 0 10px rgba(2, 132, 199, 0.5)' : 'none',
              opacity: isTPose ? 0.4 : 1,
            }}
            title={isPlaying ? 'Pause (Raccourci: Espace)' : 'Play (Raccourci: Espace)'}
          >
            <span>{isPlaying ? '⏸' : '▶'}</span>
            <span style={{ fontSize: 10 }}>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Avancer d'une frame (+1f) */}
          <button
            type="button"
            onClick={() => stepFrame(1)}
            disabled={isTPose}
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              color: '#fff',
              cursor: isTPose ? 'not-allowed' : 'pointer',
              opacity: isTPose ? 0.4 : 1,
            }}
            title="Frame suivante (+1 frame / Raccourci: Flèche Droite, Maj+Droite: +5f)"
          >
            ▶
          </button>

          {/* Boucle (Loop) */}
          <button
            type="button"
            onClick={() => setLooping(!isLooping)}
            style={{
              padding: '3px 6px',
              fontSize: 10,
              background: isLooping ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isLooping ? '#0284c7' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: 4,
              color: isLooping ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
            }}
            title={isLooping ? 'Boucle activée (cliquer pour désactiver)' : 'Boucle désactivée (cliquer pour activer)'}
          >
            🔁
          </button>
        </div>

        {/* Compteur précis de Frame & Temps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isTPose ? (
            <span
              style={{
                background: 'rgba(42, 157, 58, 0.25)',
                border: '1px solid #2a9d3a',
                borderRadius: 4,
                padding: '2px 6px',
                color: '#86efac',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              📐 T-Pose (Rest)
            </span>
          ) : (
            <>
              {/* Badge Frame modifiable au clic / saisie directe */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontFamily: 'monospace',
                }}
                title="Cliquer pour entrer directement un numéro de frame précis"
              >
                <span style={{ color: '#94a3b8', fontSize: 10, marginRight: 4 }}>Frame:</span>
                <input
                  type="number"
                  min={0}
                  max={totalFrames}
                  value={inputFrame}
                  onFocus={() => setIsEditingFrame(true)}
                  onChange={e => setInputFrame(e.target.value)}
                  onBlur={handleFrameCommit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFrameCommit();
                  }}
                  style={{
                    width: 38,
                    background: isEditingFrame ? '#1e293b' : 'transparent',
                    border: isEditingFrame ? '1px solid #38bdf8' : 'none',
                    borderRadius: 2,
                    color: '#38bdf8',
                    fontWeight: 700,
                    fontSize: 11,
                    textAlign: 'center',
                    outline: 'none',
                    padding: 0,
                  }}
                />
                <span style={{ color: '#64748b', fontSize: 10 }}>/ {totalFrames}</span>
              </div>

              {/* Badge Temps (secondes) */}
              <span
                style={{
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 5px',
                  borderRadius: 3,
                }}
              >
                {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </>
          )}
        </div>

        {/* Sélecteur de Vitesse, Nom de l'animation en entier & Bouton Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
          {/* Badge animation en cours (nom complet affiché) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            {onCycleAnim && (
              <button
                type="button"
                onClick={() => onCycleAnim('prev')}
                style={{
                  padding: '2px 4px',
                  fontSize: 8,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Animation précédente (Flèche Haut)"
              >
                ▲
              </button>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#38bdf8',
                background: 'rgba(2, 132, 199, 0.15)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(56, 189, 248, 0.3)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                maxWidth: 'min(450px, 45vw)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                cursor: 'text',
              }}
              title={`Animation active : ${displayName}`}
            >
              <span style={{ fontSize: 11, userSelect: 'none' }}>🎬</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'text', WebkitUserSelect: 'text' }}>{displayName}</span>
            </span>
            {onCycleAnim && (
              <button
                type="button"
                onClick={() => onCycleAnim('next')}
                style={{
                  padding: '2px 4px',
                  fontSize: 8,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 3,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Animation suivante (Flèche Bas)"
              >
                ▼
              </button>
            )}
          </div>

          {/* Vitesse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <span style={{ color: '#94a3b8', fontSize: 9 }}>⚡</span>
            <select
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              style={{
                padding: '2px 4px',
                fontSize: 10,
                fontWeight: speed !== 1 ? 'bold' : 'normal',
                background: speed !== 1 ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${speed !== 1 ? '#0284c7' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: 4,
                color: speed !== 1 ? '#38bdf8' : '#cbd5e1',
                outline: 'none',
                cursor: 'pointer',
              }}
              title="Vitesse de lecture de l'animation"
            >
              {SPEED_OPTIONS.map(s => (
                <option key={s} value={s} style={{ background: '#0f172a', color: '#fff' }}>
                  {s}x {s < 1 ? '(Ralenti)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Toggle Métadonnées */}
          {hasMeta && (
            <button
              type="button"
              onClick={() => setShowMeta(v => !v)}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                background: showMeta ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${showMeta ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: 4,
                color: showMeta ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                flexShrink: 0,
              }}
              title={showMeta ? 'Masquer le volet métadonnées' : 'Afficher le volet complet des métadonnées (ID, tags, aliases, offsets)'}
            >
              <span>ℹ️</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>Meta</span>
              <span style={{ fontSize: 8 }}>{showMeta ? '▼' : '▲'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Ligne 3 : Volet détaillé de toutes les Métadonnées AnimationDefinition ── */}
      {showMeta && hasMeta && (
        <div
          className="anim-meta-panel"
          style={{
            marginTop: 2,
            padding: '6px 10px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 10,
            userSelect: 'text',
            WebkitUserSelect: 'text',
            cursor: 'text',
          }}
        >
          {/* Ligne A : Identifiant, Catégorie, Fichier GLB, Offsets et Durée */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', userSelect: 'text' }}>
            {/* ID Canonique */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'text' }}>
              <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', userSelect: 'none' }}>ID :</span>
              <code
                style={{
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontSize: 10,
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  cursor: 'text',
                }}
              >
                {def?.id || (isTPose ? 't-pose' : displayName)}
              </code>
            </div>

            {/* Catégorie sémantique */}
            {catObj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'text' }}>
                <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', userSelect: 'none' }}>Catégorie :</span>
                <span
                  style={{
                    color: '#f8fafc',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: 10,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                >
                  <span style={{ userSelect: 'none' }}>{catObj.icon} </span>
                  {catObj.label}
                </span>
              </div>
            )}

            {/* Fichier GLB */}
            {def?.path && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'text' }} title={def.path}>
                <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', userSelect: 'none' }}>Fichier :</span>
                <code
                  style={{
                    color: '#cbd5e1',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontSize: 10,
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                >
                  📁 {def.path.split('/').pop()}
                </code>
              </div>
            )}

            {/* Décalage Position si présent */}
            {def?.defaultOffset && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'text' }}
                title="Décalage natif de position [X, Y, Z] en centimètres"
              >
                <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', userSelect: 'none' }}>Offset Pos :</span>
                <span
                  style={{
                    color: '#fbbf24',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    background: 'rgba(251, 191, 36, 0.12)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                >
                  [{def.defaultOffset.map(v => `${v}cm`).join(', ')}]
                </span>
              </div>
            )}

            {/* Décalage Rotation Y si présent */}
            {def?.defaultRotYOffset !== undefined && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'text' }}
                title="Décalage natif de rotation autour de l'axe vertical Y"
              >
                <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', userSelect: 'none' }}>Offset Rot Y :</span>
                <span
                  style={{
                    color: '#fbbf24',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    background: 'rgba(251, 191, 36, 0.12)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                >
                  {(def.defaultRotYOffset * (180 / Math.PI)).toFixed(1)}°
                </span>
              </div>
            )}

            {/* Durée définie */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'text' }}>
              <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', userSelect: 'none' }}>Durée :</span>
              <span style={{ color: '#a7f3d0', fontFamily: 'monospace', fontSize: 10, userSelect: 'text', WebkitUserSelect: 'text', cursor: 'text' }}>
                {(def?.duration ?? duration).toFixed(2)}s ({totalFrames} frames @ {fps}fps)
              </span>
            </div>
          </div>

          {/* Ligne B : Tous les Alias de la définition */}
          {def?.aliases && def.aliases.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 1, userSelect: 'text' }}>
              <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', marginRight: 2, userSelect: 'none' }}>
                🏷️ Aliases ({def.aliases.length}) :
              </span>
              {def.aliases.map(alias => (
                <span
                  key={alias}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 9,
                    color: '#e2e8f0',
                    fontFamily: 'monospace',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                >
                  {alias}
                </span>
              ))}
            </div>
          )}

          {/* Ligne C : Tous les Tags sémantiques de la définition */}
          {def?.tags && def.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 1, userSelect: 'text' }}>
              <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', marginRight: 2, userSelect: 'none' }}>
                🔖 Tags ({def.tags.length}) :
              </span>
              {def.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(14, 165, 233, 0.15)',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 9,
                    color: '#7dd3fc',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                >
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
