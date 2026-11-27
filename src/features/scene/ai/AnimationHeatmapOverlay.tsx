import { useMemo, useState, useEffect } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { CHARACTERS, UNITREE_H2, isCharacterVisibleInMode } from '../characterConfig';
import { cameraState } from '../cameraState';
import { duoSessionManager } from './duoSessionManager';
import { DUO_ANIMATIONS } from '../animations/duoAnimations';
import { getDuoAnimationTransformOverride, resolveAnimationId } from '../animations/animationResolver';
import { ENHANCED_ANIM_OPTIONS } from '../CharacterAnimSelector';
import { useAnimationHeatmapStore } from './animationHeatmapStore';

export function AnimationHeatmapOverlay() {
  const visible = useSceneStore((s) => s.layers.debugAnimationHeatmap);
  if (!visible) return null;
  return <AnimationHeatmapOverlayContent />;
}

function AnimationHeatmapOverlayContent() {
  const layers = useSceneStore((s) => s.layers);
  const activeCharacterId = useSceneStore((s) => s.activeCharacterId);
  const activeExtraIds = useSceneStore((s) => s.activeExtraIds);
  const activeMainIds = useSceneStore((s) => s.activeMainIds);

  const {
    mode, liveNpcId, pinnedAnchor, customKind, customCharA, customCharB,
    customAnimId, customDuoId, customPos, customRotDeg,
    showGround, show3D, clashOnly3D, isOpen, loading, error, summary,
    setMode, setLiveNpcId, setPinnedAnchor, setCustomKind, setCustomCharA, setCustomCharB,
    setCustomAnimId, setCustomDuoId, setCustomPos, setCustomRotDeg,
    setShowGround, setShow3D, setClashOnly3D, toggleOpen,
  } = useAnimationHeatmapStore();

  const [animSearch, setAnimSearch] = useState('');
  const [, setLiveTick] = useState(0);

  useEffect(() => {
    if (mode !== 'live') return;
    const timer = setInterval(() => setLiveTick((t) => t + 1), 400);
    return () => clearInterval(timer);
  }, [mode]);

  const humanCharacters = useMemo(() => [...CHARACTERS, UNITREE_H2], []);
  const visibleNpcs = useMemo(() => {
    const extraChars = layers.extraCharacters ?? false;
    return humanCharacters.filter((c) =>
      c.id === activeCharacterId ||
      (!c.isRobot && isCharacterVisibleInMode(c.id, layers.laraCount, activeCharacterId, extraChars, activeExtraIds, activeMainIds)),
    );
  }, [humanCharacters, layers.laraCount, layers.extraCharacters, activeCharacterId, activeExtraIds, activeMainIds]);

  const filteredSoloAnims = useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    return ENHANCED_ANIM_OPTIONS.filter((a) =>
      !q || a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q) || a.searchIndex.includes(q),
    );
  }, [animSearch]);

  const filteredDuoAnims = useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    return DUO_ANIMATIONS.filter((a) =>
      !q || a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.animA.toLowerCase().includes(q) || a.animB.toLowerCase().includes(q),
    );
  }, [animSearch]);

  const handlePinCurrent = () => {
    if (pinnedAnchor) {
      setPinnedAnchor(null);
      return;
    }
    const targetId = liveNpcId === 'active' ? activeCharacterId : liveNpcId;
    const session = duoSessionManager.getSessionFor(targetId);
    if (session && session.isSessionPlaying && session.participantA && session.participantB) {
      const animState = duoSessionManager.getCurrentAnimState(targetId);
      if (animState) {
        const override = getDuoAnimationTransformOverride(animState.def.id);
        const offsetB = override?.offsetB ?? animState.def.offsetB ?? [0, 0, 0];
        const rotB = override?.rotB !== undefined ? override.rotB : (animState.def.rotB ?? 0);
        setPinnedAnchor({
          pos: [...session.location.anchorPos],
          rotY: session.location.anchorRotY,
          participants: [
            { characterId: session.participantA.characterId, animationId: animState.clipA, localPos: [0, 0, 0], localRotY: 0 },
            { characterId: session.participantB.characterId, animationId: animState.clipB, localPos: offsetB, localRotY: rotB },
          ],
          label: `Figé · Duo ${animState.def.label}`,
        });
        return;
      }
    }
    const pose = cameraState.positions[targetId];
    if (!pose) return;
    const animId = pose.anim || 'idle';
    setPinnedAnchor({
      pos: [pose.x, pose.y, pose.z],
      rotY: pose.yaw,
      participants: [{ characterId: targetId, animationId: animId, localPos: [0, 0, 0], localRotY: 0 }],
      label: `Figé · ${targetId} (${resolveAnimationId(animId)})`,
    });
  };

  const handleMoveToActiveNpc = () => {
    const pose = cameraState.positions[activeCharacterId];
    if (!pose) return;
    setCustomPos([Math.round(pose.x), Math.round(pose.y), Math.round(pose.z)]);
    setCustomRotDeg(Math.round((pose.yaw * 180) / Math.PI));
  };

  const handleCloseLayer = () => {
    useSceneStore.getState().toggleLayer('debugAnimationHeatmap');
  };

  const hasClash = Boolean(summary && (summary.clashVoxels > 0 || summary.clashCells > 0));

  return (
    <div
      className={`anim-heatmap-panel glass-card rounded-3 text-dark small overflow-hidden user-select-text shadow-lg ${isOpen ? '' : 'anim-heatmap-panel--collapsed'}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="d-flex align-items-center justify-content-between gap-2 px-2 py-1 border-bottom zone-ai-clickable user-select-none zone-ai-surface"
        onClick={toggleOpen}
      >
        <div className="d-flex align-items-center gap-1 fw-semibold">
          <i className="bi bi-thermometer-half text-danger" aria-hidden="true" />
          <span>Heatmap Espace</span>
          {summary && (
            <span className={`badge ${hasClash ? 'text-bg-danger' : 'text-bg-success'}`}>
              {hasClash ? `Clash (${summary.clashVoxels})` : 'Libre'}
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary border-0 p-0 px-1"
            onClick={(e) => { e.stopPropagation(); handleCloseLayer(); }}
            title="Désactiver la heatmap"
            aria-label="Désactiver la heatmap"
          >
            ✕
          </button>
          <span>{isOpen ? '▾' : '▸'}</span>
        </div>
      </div>

      {isOpen && (
        <div className="anim-heatmap-body overflow-y-auto p-2 d-flex flex-column gap-2">
          <div className="btn-group btn-group-sm w-100" role="group" aria-label="Source de la heatmap">
            <button
              type="button"
              className={`btn ${mode === 'live' ? 'btn-danger' : 'btn-outline-secondary'}`}
              onClick={() => setMode('live')}
            >
              PNJ en direct
            </button>
            <button
              type="button"
              className={`btn ${mode === 'custom' ? 'btn-danger' : 'btn-outline-secondary'}`}
              onClick={() => setMode('custom')}
            >
              Tester Solo / Duo
            </button>
          </div>

          <div className="d-flex flex-wrap gap-1 align-items-center">
            <button
              type="button"
              className={`btn btn-sm ${showGround ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowGround(!showGround)}
              aria-pressed={showGround}
            >
              Sol 2D
            </button>
            <button
              type="button"
              className={`btn btn-sm ${show3D ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShow3D(!show3D)}
              aria-pressed={show3D}
            >
              Volume 3D
            </button>
            {show3D && (
              <button
                type="button"
                className={`btn btn-sm ${clashOnly3D ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => setClashOnly3D(!clashOnly3D)}
                aria-pressed={clashOnly3D}
                title="Afficher uniquement les voxels en collision 3D"
              >
                Clashs 3D seuls
              </button>
            )}
          </div>

          {mode === 'live' ? (
            <div className="d-flex flex-column gap-1">
              <div className="d-flex gap-1 align-items-center">
                <select
                  aria-label="PNJ suivi"
                  className="form-select form-select-sm"
                  value={liveNpcId}
                  onChange={(e) => setLiveNpcId(e.target.value)}
                >
                  <option value="active">🎯 Personnage actif ({activeCharacterId})</option>
                  {visibleNpcs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name} ({c.id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`btn btn-sm text-nowrap ${pinnedAnchor ? 'btn-warning' : 'btn-outline-secondary'}`}
                  onClick={handlePinCurrent}
                  title="Figer ou libérer la position et l'animation capturée"
                >
                  {pinnedAnchor ? '📌 Libérer' : '📌 Figer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <div className="btn-group btn-group-sm w-100" role="group" aria-label="Mode solo ou duo">
                <button
                  type="button"
                  className={`btn ${customKind === 'solo' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setCustomKind('solo')}
                >
                  Solo
                </button>
                <button
                  type="button"
                  className={`btn ${customKind === 'duo' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setCustomKind('duo')}
                >
                  Duo ({DUO_ANIMATIONS.length})
                </button>
              </div>

              <div className="d-flex gap-1">
                <select
                  aria-label={customKind === 'duo' ? 'Personnage A' : 'Personnage'}
                  className="form-select form-select-sm"
                  value={customCharA}
                  onChange={(e) => setCustomCharA(e.target.value)}
                >
                  {humanCharacters.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                {customKind === 'duo' && (
                  <select
                    aria-label="Partenaire B"
                    className="form-select form-select-sm"
                    value={customCharB}
                    onChange={(e) => setCustomCharB(e.target.value)}
                  >
                    {humanCharacters.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="🔍 Filtrer une animation…"
                aria-label="Filtrer une animation"
                value={animSearch}
                onChange={(e) => setAnimSearch(e.target.value)}
              />

              {customKind === 'solo' ? (
                <select
                  aria-label="Animation solo"
                  className="form-select form-select-sm"
                  value={customAnimId}
                  onChange={(e) => setCustomAnimId(e.target.value)}
                >
                  {filteredSoloAnims.map((a) => (
                    <option key={a.value} value={a.value}>{a.label} ({a.value})</option>
                  ))}
                </select>
              ) : (
                <select
                  aria-label="Animation duo"
                  className="form-select form-select-sm"
                  value={customDuoId}
                  onChange={(e) => setCustomDuoId(e.target.value)}
                >
                  {filteredDuoAnims.map((d) => (
                    <option key={d.id} value={d.id}>{d.icon} {d.label} ({d.id})</option>
                  ))}
                </select>
              )}

              <div className="row g-1 align-items-center">
                {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                  <div key={axis} className="col-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text px-1">{axis}</span>
                      <input
                        type="number"
                        step="5"
                        aria-label={`Position ${axis} (cm)`}
                        className="form-control form-control-sm px-1 text-end"
                        value={customPos[idx]}
                        onChange={(e) => {
                          const next = [...customPos] as [number, number, number];
                          next[idx] = Number(e.target.value) || 0;
                          setCustomPos(next);
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="col-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text px-1">°</span>
                    <input
                      type="number"
                      step="15"
                      aria-label="Rotation Y (degrés)"
                      className="form-control form-control-sm px-1 text-end"
                      value={customRotDeg}
                      onChange={(e) => setCustomRotDeg(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={handleMoveToActiveNpc}
              >
                📍 Placer sur {activeCharacterId}
              </button>
            </div>
          )}

          <div className="border-top pt-2 d-flex flex-column gap-1">
            {loading && <div className="text-body-secondary">⏳ Échantillonnage de l’animation…</div>}
            {error && <div className="text-danger fw-semibold" role="alert">⚠️ {error}</div>}
            {summary && (
              <>
                <div className="fw-semibold text-truncate" title={summary.activeLabel}>
                  {summary.activeLabel}
                </div>
                <div className="d-flex flex-wrap gap-1">
                  <span className="badge text-bg-light border">
                    {summary.width} × {summary.depth} × {summary.height} cm
                  </span>
                  <span className="badge text-bg-light border">
                    Rayon {summary.radius} cm
                  </span>
                  <span className="badge text-bg-light border">
                    {summary.sampleCount} poses · {summary.duration.toFixed(1)}s
                  </span>
                </div>
                {hasClash ? (
                  <div className="alert alert-danger py-1 px-2 mb-0 small" role="status">
                    <div className="fw-semibold">
                      ⚠️ Clash détecté : {summary.clashVoxels} voxels / {summary.clashCells} cellules sol
                    </div>
                    <div className="font-monospace text-break">
                      {summary.collidingObstacles.join(', ')}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success py-1 px-2 mb-0 small" role="status">
                    ✅ Aucun clash avec les murs, meubles ou portes
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
