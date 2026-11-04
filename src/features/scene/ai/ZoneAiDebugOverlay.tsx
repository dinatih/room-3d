import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { getAllSmartObjects } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { duoSessionManager } from './duoSessionManager';
import { resolveNavigation } from './navigation/navigationScope';
import { cameraState } from '../cameraState';
import { CHARACTERS, isCharacterVisibleInMode } from '../characterConfig';
import { useZoneAiDebugStore } from './zoneAiDebugStore';
import { appLog } from '@features/ui/AppConsole';
import { resolveSlotAnimationInfo, getAnimationDef } from '../animations/animationResolver';

export function ZoneAiDebugOverlay() {
  const visible = useSceneStore((s) => s.layers.aiZones);
  if (!visible) return null;
  return <ZoneAiDebugOverlayContent />;
}

function ZoneAiDebugOverlayContent() {
  const layers = useSceneStore((s) => s.layers);
  const activeCharacterId = useSceneStore((s) => s.activeCharacterId);
  const activeExtraIds = useSceneStore((s) => s.activeExtraIds);
  const activeMainIds = useSceneStore((s) => s.activeMainIds);

  const {
    selectedSlot,
    setSelectedSlot,
    selectedActionId,
    setSelectedActionId,
    isOpen,
    toggleOpen,
    selectedCharId,
    setSelectedCharId,
  } = useZoneAiDebugStore();

  const [tick, setTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Rafraîchir périodiquement et sur les événements pour capter l'occupation des slots
  useEffect(() => {
    const onUpdate = () => setTick((t) => t + 1);
    const interval = setInterval(onUpdate, 500);
    const unsubDuo = duoSessionManager.subscribe(onUpdate);
    document.addEventListener('furniture-toggle', onUpdate);
    document.addEventListener('agent-force-smartobject', onUpdate);
    document.addEventListener('npc-invite-duo', onUpdate);

    return () => {
      clearInterval(interval);
      unsubDuo();
      document.removeEventListener('furniture-toggle', onUpdate);
      document.removeEventListener('agent-force-smartobject', onUpdate);
      document.removeEventListener('npc-invite-duo', onUpdate);
    };
  }, []);

  // Liste des PNJs disponibles dans la scène (humains uniquement)
  const availableNpcs = useMemo(() => {
    const laraCount = layers.laraCount ?? 4;
    const extraChars = layers.extraCharacters ?? false;
    return CHARACTERS.filter(
      (c) =>
        c.id !== 'ulotte' && c.id !== 'shiba' &&
        c.id !== 'robin' &&
        (isCharacterVisibleInMode(c.id, laraCount, activeCharacterId, extraChars, activeExtraIds, activeMainIds) ||
          c.id === activeCharacterId)
    );
  }, [layers.laraCount, layers.extraCharacters, activeCharacterId, activeExtraIds, activeMainIds]);

  // Tous les SmartObjects avec leurs slots résolus
  const allObjects = useMemo(() => getAllSmartObjects(), [tick]);

  // Statistiques globales de slots
  const stats = useMemo(() => {
    let total = 0;
    let available = 0;
    let occupied = 0;
    allObjects.forEach((obj) => {
      obj.slots.forEach((s) => {
        total++;
        if (OccupancyManager.isSlotOccupied(obj.id, s.slotId)) {
          occupied++;
        } else {
          available++;
        }
      });
    });
    return { total, available, occupied };
  }, [allObjects, tick]);

  // Récupérer l'objet et slot actuellement sélectionnés
  const currentObj = allObjects.find(obj => obj.id === selectedSlot?.objectId);
  const currentSlot = currentObj?.slots.find((s) => s.slotId === selectedSlot?.slotId) ?? null;

  const currentOccupant =
    currentObj && currentSlot ? OccupancyManager.getOccupant(currentObj.id, currentSlot.slotId) : null;
  const isCurrentOccupied =
    currentObj && currentSlot ? OccupancyManager.isSlotOccupied(currentObj.id, currentSlot.slotId) : false;

  // Exécution de l'ordre d'action vers le PNJ choisi
  const handleExecuteAction = async (targetObjId?: string, targetSlotId?: string, targetAnimId?: string) => {
    const objId = targetObjId ?? selectedSlot?.objectId;
    const sId = targetSlotId ?? selectedSlot?.slotId;
    if (!objId || !sId) return;

    const obj = getAllSmartObjects().find(obj => obj.id === objId);
    const slot = obj?.slots.find((s) => s.slotId === sId);
    if (!obj || !slot) return;

    const slotAnimMeta = resolveSlotAnimationInfo(slot);
    const chosenAnim =
      targetAnimId ??
      (objId === selectedSlot?.objectId && sId === selectedSlot?.slotId
        ? selectedActionId ?? slotAnimMeta.canonicalId
        : slotAnimMeta.canonicalId);

    const targetPos = slot.offset ?? [0, 0, 0];

    // Trouver le PNJ cible
    let targetChar: string | null = null;
    const availableIds = new Set(availableNpcs.map((c) => c.id));

    if (selectedCharId !== 'closest' && availableIds.has(selectedCharId)) {
      targetChar = selectedCharId;
    } else {
      let minDistance = Infinity;
      for (const char of availableNpcs) {
        const pos = cameraState.positions[char.id];
        if (!pos) continue;
        const dist = Math.hypot(pos.x - targetPos[0], pos.z - targetPos[2]);
        if (dist < minDistance) {
          minDistance = dist;
          targetChar = char.id;
        }
      }
      if (!targetChar && availableNpcs.length > 0) {
        targetChar = availableNpcs[0].id;
      }
    }

    if (!targetChar) {
      setFeedbackMsg('⚠️ Aucun PNJ trouvé pour exécuter cette action.');
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }

    const charConfig = CHARACTERS.find((c) => c.id === targetChar);
    const charName = charConfig?.name ?? targetChar;

    if (slot.isDuo) {
      const duoResult = await resolveNavigation(() => duoSessionManager.startDuoSession(objId, sId, targetChar!, undefined, chosenAnim));
      if (duoResult) {
        document.dispatchEvent(
          new CustomEvent('npc-invite-duo', {
            detail: {
              targetId: duoResult.targetA,
              fromId: 'ZoneAiDebug',
              objectId: objId,
              slotId: sId,
              forceRole: 'roleA',
              targetPos: duoResult.posA,
              targetRotY: duoResult.rotA,
            },
          })
        );
        appLog(
          targetChar,
          `🛋️ [ZoneAI Debug] Session Duo lancée : ${charName} (Meneur) et ${duoResult.targetB} sur ${obj.name} (${slot.name})`
        );
        setFeedbackMsg(`🛋️ Duo lancé : ${charName} & ${duoResult.targetB}`);
      } else {
        setFeedbackMsg(`⚠️ Impossible de démarrer la session duo sur ${slot.name}`);
      }
    } else {
      if (OccupancyManager.isSlotOccupied(objId, sId, targetChar)) {
        const occupant = OccupancyManager.getOccupant(objId, sId);
        setFeedbackMsg(`⚠️ ${obj.name} est déjà occupé${occupant ? ` (${occupant})` : ''} !`);
        setTimeout(() => setFeedbackMsg(null), 3500);
        return;
      }

      document.dispatchEvent(
        new CustomEvent('agent-force-smartobject', {
          detail: {
            targetId: targetChar,
            objectId: objId,
            slotId: sId,
            animation: chosenAnim,
          },
        })
      );
      appLog(
        targetChar,
        `🤖 [ZoneAI Debug] Ordre envoyé : ${charName} rejoint ${obj.name} [${slot.name}] (${chosenAnim})`
      );
      setFeedbackMsg(`🏃 ${charName} se dirige vers ${obj.name} (${chosenAnim})`);
    }

    setTick((t) => t + 1);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Objets filtrés par recherche
  const filteredObjects = allObjects.filter((obj) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      obj.name.toLowerCase().includes(term) ||
      obj.id.toLowerCase().includes(term) ||
      obj.category.toLowerCase().includes(term) ||
      obj.slots.some(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.slotId.toLowerCase().includes(term) ||
          (s.animation && s.animation.toLowerCase().includes(term))
      )
    );
  });

  return (
    <div
      className={`zone-ai-panel glass-card rounded-3 text-dark small overflow-hidden user-select-text ${isOpen ? "" : "zone-ai-panel--collapsed"}`}
    >
      {/* ── En-tête ── */}
      <div
        className="d-flex align-items-center justify-content-between px-2 py-1 border-bottom zone-ai-clickable user-select-none zone-ai-surface"
        onClick={toggleOpen}
      >
        <div className="d-flex align-items-center gap-1 fw-semibold">
          <span>🤖 Smart Objects</span>
          <span
            className="badge text-bg-danger"
          >
            Zone AI
          </span>
        </div>
        <div className="d-flex align-items-center gap-1">
          <span className="text-body-secondary">
            {stats.available} dispo / {stats.total}
          </span>
          <span>{isOpen ? '▾' : '▸'}</span>
        </div>
      </div>

      {isOpen && (
        <div className="zone-ai-body overflow-y-auto">
          {/* ── Notification toast feedback ── */}
          {feedbackMsg && (
            <div
              className="px-2 py-1 border-bottom fw-semibold" role="status"
            >
              {feedbackMsg}
            </div>
          )}

          {/* ── Sélecteur de PNJ pour l'action ── */}
          <div
            className="d-flex flex-column gap-1 px-2 py-1 border-bottom zone-ai-surface"
          >
            <label htmlFor="zone-ai-npc" className="fw-semibold text-uppercase">
              👤 PNJ à envoyer :
            </label>
            <select
              value={selectedCharId}
              onChange={(e) => setSelectedCharId(e.target.value)}
              className="form-select form-select-sm" id="zone-ai-npc"
            >
              <option value="closest">🎯 Plus proche PNJ</option>
              {availableNpcs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji ?? '👤'} {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* ── Détails du Slot sélectionné ── */}
          {currentObj && currentSlot ? (
            <div
              className="d-flex flex-column gap-1 px-2 py-1 border-bottom zone-ai-surface"
            >
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="fw-semibold">
                    ✨ {currentObj.name}
                  </div>
                  <div>
                    🎯 Slot : {currentSlot.name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="btn btn-sm btn-outline-secondary border-0 p-0"
                  title="Fermer la sélection"
                >
                  ✕
                </button>
              </div>

              {/* État de disponibilité */}
              <div className="d-flex align-items-center gap-1">
                <span>Statut :</span>
                {isCurrentOccupied ? (
                  <span
                    className="fw-semibold px-2 py-1 rounded zone-ai-surface"
                  >
                    ❌ Occupé ({currentOccupant ?? 'en cours'})
                  </span>
                ) : (
                  <span
                    className="fw-semibold px-2 py-1 rounded zone-ai-surface"
                  >
                    ✅ Disponible
                  </span>
                )}
                {currentSlot.isDuo && (
                  <span
                    className="badge text-bg-secondary"
                  >
                    🛋️ Duo
                  </span>
                )}
              </div>

              {/* Smartaction sélectionnée ou en cours avec ID canonique et durée */}
              {(() => {
                const animMeta = resolveSlotAnimationInfo(currentSlot);

                // Vérifier si une session Duo est active sur ce slot
                const activeDuoSession = currentSlot.isDuo
                  ? (currentOccupant ? duoSessionManager.getSessionFor(currentOccupant) : null) ||
                    duoSessionManager.getSessionForSlot(currentObj.id, currentSlot.slotId)
                  : null;

                const currentPlayingDuoDef = activeDuoSession
                  ? (activeDuoSession.playlist[activeDuoSession.currentAnimIndex] ?? activeDuoSession.playlist[0])
                  : null;

                // Vérifier si un occupant solo joue actuellement une animation
                const occupantAnim = (!currentSlot.isDuo && currentOccupant)
                  ? cameraState.positions[currentOccupant]?.anim
                  : null;

                const activeVariant = animMeta.variants?.find((v) => v.canonicalId === selectedActionId);

                // Déterminer l'ID canonique et la durée :
                // 1. Session Duo en direct -> ID canonique du clip duo en cours (ex: 'sit-cuddle', 'cuddle_kiss')
                // 2. Occupant solo en direct -> animation active du personnage
                // 3. Variante sélectionnée
                // 4. ID canonique par défaut du slot
                const currentCanonicalId =
                  currentPlayingDuoDef?.id ??
                  occupantAnim ??
                  activeVariant?.canonicalId ??
                  selectedActionId ??
                  animMeta.canonicalId;

                const currentDuration =
                  currentPlayingDuoDef?.duration ??
                  (occupantAnim ? getAnimationDef(occupantAnim)?.duration : undefined) ??
                  currentSlot.duration ??
                  activeVariant?.duration ??
                  animMeta.duration;

                const currentClip =
                  currentPlayingDuoDef
                    ? `${currentPlayingDuoDef.animA} / ${currentPlayingDuoDef.animB}`
                    : (activeVariant?.clipName ?? animMeta.clipName);

                const isPlayingLive = !!(activeDuoSession || (occupantAnim && occupantAnim !== 'idle' && occupantAnim !== 'walk'));

                return (
                  <div
                    className="d-flex flex-column gap-1 px-2 py-1 rounded zone-ai-surface"
                  >
                    <div className="d-flex align-items-center flex-wrap gap-1">
                      <span className="text-body-secondary">
                        {isPlayingLive ? '🎬 Animation en cours : ' : 'ID Canonique : '}
                      </span>
                      <span className="font-monospace text-break fw-semibold">
                        {currentCanonicalId}
                      </span>
                      {currentDuration !== undefined && (
                        <span className="fw-semibold">
                          ({currentDuration.toFixed(1)}s)
                        </span>
                      )}
                      {isPlayingLive && (
                        <span
                          className="badge text-bg-success"
                        >
                          ▶ EN COURS
                        </span>
                      )}
                    </div>

                    {activeDuoSession && (
                      <div className="d-flex align-items-center gap-1">
                        <span>
                          🔄 Clip {activeDuoSession.currentAnimIndex + 1}/{activeDuoSession.playlist.length}
                        </span>
                        <span>•</span>
                        <span>
                          Répétition {activeDuoSession.currentRepeatIndex + 1}/{activeDuoSession.repeatsPerAnim}
                        </span>
                        {activeDuoSession.sessionTimer > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-body-secondary">
                              reste {activeDuoSession.sessionTimer.toFixed(1)}s
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div>
                      <span className="text-body-secondary">Clip GLB : </span>
                      <span className="font-monospace text-break">
                        {currentClip}
                      </span>
                    </div>

                    {animMeta.variants && animMeta.variants.length > 1 && (
                      <div className="mt-1">
                        <span className="text-body-secondary">
                          Smartactions disponibles ({animMeta.variants.length}) :
                        </span>
                        <div
                          className="zone-ai-variants d-flex flex-column gap-1 overflow-y-auto mt-1 pe-1"
                        >
                          {animMeta.variants.map((v) => {
                            const isSelectedAnim = v.canonicalId === currentCanonicalId;
                            return (
                              <div
                                key={v.canonicalId}
                                onClick={() => setSelectedActionId(v.canonicalId)}
                                className={`zone-ai-choice d-flex align-items-center justify-content-between gap-1 px-2 py-1 rounded border ${isSelectedAnim ? "border-danger bg-danger-subtle" : "border-light"}`}
                                title={`Sélectionner ${v.canonicalId} (${v.duration ? `${v.duration.toFixed(1)}s` : ''})`}
                              >
                                <span
                                  className={isSelectedAnim ? "font-monospace fw-semibold text-danger" : "font-monospace"}
                                >
                                  {isSelectedAnim ? '▶ ' : '• '}
                                  {v.canonicalId}
                                </span>
                                {v.duration !== undefined && (
                                  <span
                                    className="text-body-secondary flex-shrink-0"
                                  >
                                    {v.duration.toFixed(1)}s
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bouton d'action direct */}
              <button
                onClick={() => handleExecuteAction()}
                className="btn btn-sm btn-danger d-flex align-items-center justify-content-center gap-1"
              >
                <span>⚡ Faire venir le PNJ ici</span>
              </button>
            </div>
          ) : (
            <div
              className="fst-italic px-2 py-1 border-bottom zone-ai-surface text-body-secondary"
            >
              💡 Cliquez sur un slot au sol en 3D ou ci-dessous pour inspecter et ordonner l'action.
            </div>
          )}

          {/* ── Recherche rapide ── */}
          <div className="px-2 py-1 border-bottom">
            <input
              type="text"
              placeholder="🔍 Filtrer objets / slots / animations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control form-control-sm" aria-label="Filtrer les objets, slots et animations"
            />
          </div>

          {/* ── Liste déroulante des SmartObjects et Slots ── */}
          <div
            className="zone-ai-list d-flex flex-column gap-1 flex-grow-1 overflow-y-auto px-2 py-1"
          >
            {filteredObjects.map((obj) => (
              <div
                key={obj.id}
                className="d-flex flex-column gap-1 px-2 py-1 rounded zone-ai-surface"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold">
                    ✨ {obj.name}
                  </span>
                  <span className="text-uppercase text-body-secondary">
                    {obj.category}
                  </span>
                </div>

                <div className="d-flex flex-column gap-1 mt-1">
                  {obj.slots.map((s) => {
                    const isOccupied = OccupancyManager.isSlotOccupied(obj.id, s.slotId);
                    const occupant = OccupancyManager.getOccupant(obj.id, s.slotId);
                    const isSelected =
                      selectedSlot?.objectId === obj.id && selectedSlot?.slotId === s.slotId;

                    const sMeta = resolveSlotAnimationInfo(s);

                    // Détecter l'animation duo ou solo active en direct
                    const sDuoSession = s.isDuo
                      ? (occupant ? duoSessionManager.getSessionFor(occupant) : null) ||
                        duoSessionManager.getSessionForSlot(obj.id, s.slotId)
                      : null;
                    const sLiveDuoDef = sDuoSession
                      ? (sDuoSession.playlist[sDuoSession.currentAnimIndex] ?? sDuoSession.playlist[0])
                      : null;
                    const sOccupantAnim = (!s.isDuo && occupant)
                      ? cameraState.positions[occupant]?.anim
                      : null;
                    const isLivePlaying = !!(sDuoSession || (sOccupantAnim && sOccupantAnim !== 'idle' && sOccupantAnim !== 'walk'));

                    const sDisplayId =
                      sLiveDuoDef?.id ??
                      sOccupantAnim ??
                      sMeta.canonicalId;

                    const sDisplayDuration =
                      sLiveDuoDef?.duration ??
                      (sOccupantAnim ? getAnimationDef(sOccupantAnim)?.duration : undefined) ??
                      s.duration ??
                      sMeta.duration;

                    return (
                      <div
                        key={s.slotId}
                        onClick={() => setSelectedSlot({ objectId: obj.id, slotId: s.slotId })}
                        title={`Slot: ${s.name}\nStatut: ${isOccupied ? `Occupé (${occupant ?? 'PNJ'})` : 'Disponible'}\n${isLivePlaying ? 'Animation en cours' : 'ID Canonique'}: ${sDisplayId}${sDisplayDuration !== undefined ? ` (${sDisplayDuration.toFixed(1)}s)` : ''}`}
                        className={`zone-ai-choice d-flex align-items-center justify-content-between gap-1 px-2 py-1 rounded border ${isSelected ? "border-danger bg-danger-subtle" : "border-light"}`}
                      >
                        <div className="d-flex align-items-center gap-1 zone-ai-shrink">
                          <span
                            className={`zone-ai-status rounded-circle flex-shrink-0 ${isOccupied ? "bg-danger" : "bg-success"}`}
                          />
                          <span
                            className="overflow-hidden text-truncate"
                          >
                            {s.name}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          {isLivePlaying && (
                            <span
                              className="badge text-bg-success"
                              title="Animation en cours d'exécution"
                            >
                              ▶ LIVE
                            </span>
                          )}
                          <span
                            className="zone-ai-clip overflow-hidden text-truncate font-monospace px-2 py-1 rounded zone-ai-surface"
                            title={`${isLivePlaying ? 'Animation en cours' : 'ID Canonique'}: ${sDisplayId}${sDisplayDuration !== undefined ? ` (${sDisplayDuration.toFixed(1)}s)` : ''}`}
                          >
                            🎬 {sDisplayId}{sDisplayDuration !== undefined ? ` (${sDisplayDuration.toFixed(1)}s)` : ''}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteAction(obj.id, s.slotId);
                            }}
                            className="btn btn-sm btn-danger d-flex align-items-center justify-content-center gap-1"
                            title={`Envoyer le PNJ sélectionné sur ${s.name}`}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
