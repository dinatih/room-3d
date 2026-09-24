import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { SMART_OBJECTS, getSmartObject } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { duoSessionManager } from './duoSessionManager';
import { cameraState } from '../cameraState';
import { CHARACTERS, isCharacterVisibleInMode } from '../walkerConfig';
import { useZoneAiDebugStore } from './zoneAiDebugStore';
import { appLog } from '@features/ui/AppConsole';
import { resolveSlotAnimationInfo } from '../animations/animationResolver';

export function ZoneAiDebugOverlay() {
  const visible = useSceneStore((s) => s.layers.aiZones);
  const layers = useSceneStore((s) => s.layers);
  const activeWalkerId = useSceneStore((s) => s.activeWalkerId);
  const activeExtraIds = useSceneStore((s) => s.activeExtraIds);

  const { selectedSlot, setSelectedSlot, isOpen, toggleOpen, selectedCharId, setSelectedCharId } =
    useZoneAiDebugStore();

  const [tick, setTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Rafraîchir périodiquement et sur les événements pour capter l'occupation des slots
  useEffect(() => {
    const onUpdate = () => setTick((t) => t + 1);
    const interval = setInterval(onUpdate, 1000);
    document.addEventListener('furniture-toggle', onUpdate);
    document.addEventListener('agent-force-smartobject', onUpdate);
    document.addEventListener('npc-invite-duo', onUpdate);

    return () => {
      clearInterval(interval);
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
        c.id !== 'shiba' &&
        c.id !== 'robin' &&
        (isCharacterVisibleInMode(c.id, laraCount, activeWalkerId, extraChars, activeExtraIds) ||
          c.id === activeWalkerId)
    );
  }, [layers.laraCount, layers.extraCharacters, activeWalkerId, activeExtraIds]);

  // Tous les SmartObjects avec leurs slots résolus
  const allObjects = useMemo(() => {
    return Object.keys(SMART_OBJECTS).map((id) => {
      const obj = getSmartObject(id) || SMART_OBJECTS[id];
      return obj;
    });
  }, [tick]);

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

  if (!visible) return null;

  // Récupérer l'objet et slot actuellement sélectionnés
  const currentObj = selectedSlot ? getSmartObject(selectedSlot.objectId) || SMART_OBJECTS[selectedSlot.objectId] : null;
  const currentSlot = currentObj?.slots.find((s) => s.slotId === selectedSlot?.slotId) ?? null;

  const currentOccupant =
    currentObj && currentSlot ? OccupancyManager.getOccupant(currentObj.id, currentSlot.slotId) : null;
  const isCurrentOccupied =
    currentObj && currentSlot ? OccupancyManager.isSlotOccupied(currentObj.id, currentSlot.slotId) : false;

  // Exécution de l'ordre d'action vers le PNJ choisi
  const handleExecuteAction = (targetObjId?: string, targetSlotId?: string) => {
    const objId = targetObjId ?? selectedSlot?.objectId;
    const sId = targetSlotId ?? selectedSlot?.slotId;
    if (!objId || !sId) return;

    const obj = getSmartObject(objId) || SMART_OBJECTS[objId];
    const slot = obj?.slots.find((s) => s.slotId === sId);
    if (!obj || !slot) return;

    const targetPos = slot.offset ?? obj.position ?? [0, 0, 0];

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
      const duoResult = duoSessionManager.startDuoSession(objId, sId, targetChar);
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
          },
        })
      );
      appLog(
        targetChar,
        `🤖 [ZoneAI Debug] Ordre envoyé : ${charName} rejoint ${obj.name} [${slot.name}]`
      );
      setFeedbackMsg(`🏃 ${charName} se dirige vers ${obj.name} (${slot.name})`);
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
      style={{
        position: 'fixed',
        top: 72,
        right: 16,
        zIndex: 250,
        width: isOpen ? 360 : 'auto',
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'text',
      }}
    >
      {/* ── En-tête ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.25)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={toggleOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
          <span>🤖 Smart Objects</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 10,
              backgroundColor: '#00e5ff',
              color: '#0f172a',
              fontWeight: 800,
            }}
          >
            Zone AI
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {stats.available} dispo / {stats.total}
          </span>
          <span style={{ fontSize: 14 }}>{isOpen ? '▾' : '▸'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          {/* ── Notification toast feedback ── */}
          {feedbackMsg && (
            <div
              style={{
                backgroundColor: '#065f46',
                color: '#34d399',
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                borderBottom: '1px solid #10b981',
              }}
            >
              {feedbackMsg}
            </div>
          )}

          {/* ── Sélecteur de PNJ pour l'action ── */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>
              👤 PNJ à envoyer :
            </div>
            <select
              value={selectedCharId}
              onChange={(e) => setSelectedCharId(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                outline: 'none',
              }}
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
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(14, 116, 144, 0.15)',
                borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#38bdf8' }}>
                    ✨ {currentObj.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>
                    🎯 Slot : {currentSlot.name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                  }}
                  title="Fermer la sélection"
                >
                  ✕
                </button>
              </div>

              {/* État de disponibilité */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span>Statut :</span>
                {isCurrentOccupied ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontWeight: 700,
                    }}
                  >
                    ❌ Occupé ({currentOccupant ?? 'en cours'})
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontWeight: 700,
                    }}
                  >
                    ✅ Disponible
                  </span>
                )}
                {currentSlot.isDuo && (
                  <span
                    style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.2)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontWeight: 700,
                    }}
                  >
                    🛋️ Duo
                  </span>
                )}
              </div>

              {/* Animations associées avec ID canonique, alias, pack et tags */}
              {(() => {
                const animMeta = resolveSlotAnimationInfo(currentSlot);
                return (
                  <div
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8' }}>ID Canonique : </span>
                      <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                        {animMeta.canonicalId}
                      </span>
                    </div>

                    {animMeta.aliasUsed && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Alias utilisé : </span>
                        <span style={{ color: '#fef08a', fontFamily: 'monospace', fontWeight: 600 }}>
                          {animMeta.aliasUsed}
                        </span>
                      </div>
                    )}

                    {animMeta.pack && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Pack : </span>
                        <span style={{ color: '#a7f3d0', fontWeight: 600 }}>
                          [{animMeta.pack}]
                        </span>
                      </div>
                    )}

                    {animMeta.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Tags : </span>
                        {animMeta.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              color: '#7dd3fc',
                              padding: '1px 5px',
                              borderRadius: 3,
                              fontSize: 9,
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div>
                      <span style={{ color: '#94a3b8' }}>Clip GLB : </span>
                      <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: 9 }}>
                        {animMeta.clipName}
                      </span>
                    </div>

                    {animMeta.variants && animMeta.variants.length > 0 && (
                      <div style={{ marginTop: 2 }}>
                        <span style={{ color: '#94a3b8' }}>Variantes ({animMeta.variants.length}) : </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2, paddingLeft: 4 }}>
                          {animMeta.variants.map((v, idx) => (
                            <div key={idx} style={{ color: '#cbd5e1', fontSize: 9 }}>
                              • <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{v.canonicalId}</span>
                              {v.aliasUsed && <span style={{ color: '#fef08a' }}> (alias: {v.aliasUsed})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentSlot.duration && (
                      <div>
                        <span style={{ color: '#94a3b8' }}>Durée : </span>
                        <span style={{ color: '#cbd5e1' }}>{currentSlot.duration}s</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bouton d'action direct */}
              <button
                onClick={() => handleExecuteAction()}
                style={{
                  marginTop: 4,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                }}
              >
                <span>⚡ Faire venir le PNJ ici</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                fontSize: 11,
                fontStyle: 'italic',
              }}
            >
              💡 Cliquez sur un slot au sol en 3D ou ci-dessous pour inspecter et ordonner l'action.
            </div>
          )}

          {/* ── Recherche rapide ── */}
          <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <input
              type="text"
              placeholder="🔍 Filtrer objets / slots / animations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: '4px 8px',
                color: '#fff',
                fontSize: 11,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* ── Liste déroulante des SmartObjects et Slots ── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: '340px',
            }}
          >
            {filteredObjects.map((obj) => (
              <div
                key={obj.id}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 11 }}>
                    ✨ {obj.name}
                  </span>
                  <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>
                    {obj.category}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
                  {obj.slots.map((s) => {
                    const isOccupied = OccupancyManager.isSlotOccupied(obj.id, s.slotId);
                    const occupant = OccupancyManager.getOccupant(obj.id, s.slotId);
                    const isSelected =
                      selectedSlot?.objectId === obj.id && selectedSlot?.slotId === s.slotId;

                    const sMeta = resolveSlotAnimationInfo(s);

                    return (
                      <div
                        key={s.slotId}
                        onClick={() => setSelectedSlot({ objectId: obj.id, slotId: s.slotId })}
                        title={`Slot: ${s.name}\nStatut: ${isOccupied ? `Occupé (${occupant ?? 'PNJ'})` : 'Disponible'}\nID Canonique: ${sMeta.canonicalId}${sMeta.aliasUsed ? `\nAlias: ${sMeta.aliasUsed}` : ''}${sMeta.pack ? `\nPack: ${sMeta.pack}` : ''}${sMeta.tags.length ? `\nTags: ${sMeta.tags.join(', ')}` : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '3px 6px',
                          borderRadius: 4,
                          backgroundColor: isSelected
                            ? 'rgba(0, 229, 255, 0.2)'
                            : 'rgba(15, 23, 42, 0.4)',
                          border: isSelected
                            ? '1px solid rgba(0, 229, 255, 0.6)'
                            : '1px solid transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: isOccupied ? '#ef4444' : '#22c55e',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              color: isSelected ? '#38bdf8' : '#cbd5e1',
                              fontSize: 10,
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {s.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: 'monospace',
                              color: '#94a3b8',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              padding: '1px 4px',
                              borderRadius: 3,
                            }}
                          >
                            🎬 {sMeta.aliasUsed ?? sMeta.canonicalId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteAction(obj.id, s.slotId);
                            }}
                            style={{
                              backgroundColor: 'rgba(2, 132, 199, 0.8)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: 3,
                              padding: '2px 5px',
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
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
