import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { findCharacter } from './walkerConfig';
import { APP_LOG_HISTORY, type AppLogEntry } from '@features/ui/AppConsole';
import { useSceneStore } from '@features/scene/store/useSceneStore';

interface CharacterThoughtBubbleProps {
  characterId: string;
  characterName: string;
  isActive: boolean;
  isFirstPerson?: boolean;
}

const MAX_BUBBLE_LOGS = 4;

function formatBubbleTime(ts: number): string {
  const d = new Date(ts);
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function CharacterThoughtBubble({
  characterId,
  characterName,
  isActive,
  isFirstPerson = false,
}: CharacterThoughtBubbleProps) {
  const [logs, setLogs] = useState<AppLogEntry[]>(() => {
    return APP_LOG_HISTORY.filter(l => l.tag.toLowerCase() === characterId.toLowerCase());
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const toggleLayer = useSceneStore(state => state.toggleLayer);

  const charConfig = findCharacter(characterId);
  const themeColor = charConfig?.color || '#00d2ff';
  const emoji = charConfig?.emoji || '👤';

  // Écoute des logs émis dans l'application filtrés pour ce personnage
  useEffect(() => {
    // Re-synchroniser avec l'historique quand l'id du personnage change
    setLogs(APP_LOG_HISTORY.filter(l => l.tag.toLowerCase() === characterId.toLowerCase()));

    const handleLog = (e: Event) => {
      const ev = e as CustomEvent<AppLogEntry>;
      const { tag, message, timestamp } = ev.detail;
      if (tag.toLowerCase() === characterId.toLowerCase()) {
        setLogs(prev => {
          const next = [...prev, { id: ev.detail.id || Date.now(), tag, message, timestamp }];
          if (next.length > 50) return next.slice(-50);
          return next;
        });
      }
    };

    document.addEventListener('app-log', handleLog);
    return () => {
      document.removeEventListener('app-log', handleLog);
    };
  }, [characterId]);

  // Maintien du scroll tout en bas lors du dépliage ou de l'arrivée de nouveaux logs
  const wasExpandedRef = useRef(isExpanded);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const isJustExpanded = isExpanded && !wasExpandedRef.current;
    wasExpandedRef.current = isExpanded;

    const scrollToBottom = () => {
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };

    if (isJustExpanded) {
      // Dépliage : force le scroll immédiatement tout en bas
      scrollToBottom();
      const raf1 = requestAnimationFrame(() => {
        scrollToBottom();
        requestAnimationFrame(scrollToBottom);
      });
      return () => cancelAnimationFrame(raf1);
    } else if (isExpanded) {
      // Si déjà déplié et qu'un nouveau log arrive :
      // On ne force le scroll en bas que si l'utilisateur était déjà proche du bas (à moins de 50px)
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      if (isNearBottom) {
        scrollToBottom();
      }
    } else {
      // Replié : scroll tout en bas
      scrollToBottom();
    }
  }, [isExpanded, logs]);

  const handleCopy = (e: React.MouseEvent, entry: AppLogEntry) => {
    e.stopPropagation();
    const formatted = `[${formatBubbleTime(entry.timestamp)}] ${characterName}: ${entry.message}`;
    navigator.clipboard?.writeText(formatted).catch(() => {});
    setCopiedId(entry.id);
    setTimeout(() => {
      setCopiedId(prev => (prev === entry.id ? null : prev));
    }, 1500);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLayer('thoughtBubble');
  };

  // Si on est en FPV direct sur le perso actif, on ne gêne pas sa vue
  if (isFirstPerson) return null;

  const displayedLogs = isExpanded ? logs : logs.slice(-MAX_BUBBLE_LOGS);

  return (
    <group position={[0, 195, 0]}>
      <Html
        center={false}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          cursor: 'pointer',
          transform: 'translate(-50%, calc(-100% - 56px))',
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
          onWheel={(e) => {
            // Empêche l'événement de molette d'atteindre OrbitControls et de zoomer la scène
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          title={isExpanded ? "Cliquer pour réduire" : "Cliquer pour voir tout l'historique"}
          style={{
            position: 'relative',
            width: 'max-content',
            minWidth: '240px',
            maxWidth: isExpanded ? '600px' : '380px',
            background: 'rgba(13, 17, 23, 0.96)',
            border: `1.5px solid ${themeColor}`,
            borderRadius: '12px',
            padding: '7px 12px',
            color: '#f0f6fc',
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.65), 0 0 16px ${themeColor}44`,
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: '11px',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
            backfaceVisibility: 'hidden',
            transition: 'max-width 0.2s ease-out',
          }}
        >
          {/* Header de la bulle */}
          <div className="d-flex align-items-center justify-content-between pb-1 mb-1 border-bottom border-white-subtle gap-2">
            <div className="d-flex align-items-center gap-1 fw-semibold">
              <span style={{ fontSize: '14px' }}>{emoji}</span>
              <span style={{ color: themeColor }}>{characterName}</span>
              {isActive && (
                <span
                  className="badge bg-success text-white fw-bold text-uppercase"
                  style={{
                    fontSize: '8.5px',
                    padding: '1px 5px',
                    letterSpacing: '0.5px',
                  }}
                >
                  Focus
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span
                className="font-monospace text-white-50"
                style={{ fontSize: '9.5px' }}
              >
                {logs.length > 0 ? `${logs.length} logs` : 'en attente'}
              </span>

              {/* Croix pour fermer la bulle en changeant le toggle thoughtBubble */}
              <button
                type="button"
                className="btn btn-sm p-0 rounded-circle border border-white-subtle d-flex align-items-center justify-content-center text-white-50"
                onClick={handleClose}
                title="Fermer la bulle de pensée"
                aria-label="Fermer la bulle de pensée"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  lineHeight: '1',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 80, 80, 0.3)';
                  e.currentTarget.style.color = '#ff6b6b';
                  e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Corps des logs / Pensées (1 ligne par log avec scrollbar) */}
          <div
            ref={scrollContainerRef}
            onClick={(e) => isExpanded && e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className="d-flex flex-column gap-1 overflow-x-hidden overflow-y-auto pe-1"
            style={{
              maxHeight: isExpanded ? '280px' : '95px',
              scrollbarWidth: 'thin',
              scrollbarColor: `${themeColor} transparent`,
              overscrollBehavior: 'contain',
              overflowAnchor: 'none',
            }}
          >
            {logs.length === 0 ? (
              <div className="text-white-50 fst-italic py-1 text-nowrap">
                💭 En attente d'action...
              </div>
            ) : (
              displayedLogs.map((entry, idx) => {
                const isLast = idx === displayedLogs.length - 1;
                return (
                  <div
                    key={entry.id}
                    title={entry.message}
                    className={`d-flex align-items-start justify-content-between gap-2 px-2 py-1 rounded-1 overflow-hidden flex-shrink-0 ${
                      isLast ? 'text-white fw-semibold bg-white bg-opacity-10' : 'text-light fw-normal'
                    }`}
                  >
                    <div className="d-flex align-items-start gap-2 flex-grow-1 overflow-hidden">
                      <span
                        className="badge bg-white bg-opacity-10 font-monospace flex-shrink-0 px-1 py-0 mt-1 user-select-none"
                        style={{ color: themeColor }}
                      >
                        {formatBubbleTime(entry.timestamp)}
                      </span>
                      <span className={`flex-grow-1 text-break ${isExpanded ? '' : 'text-truncate'}`}>
                        {entry.message}
                      </span>
                    </div>

                    {/* Bouton Copier la ligne */}
                    <button
                      type="button"
                      className={`btn btn-sm px-1 py-0 border-0 flex-shrink-0 align-self-start mt-1 ${
                        copiedId === entry.id ? 'btn-outline-success' : 'btn-outline-secondary text-white-50'
                      }`}
                      onClick={(e) => handleCopy(e, entry)}
                      title="Copier ce log"
                    >
                      {copiedId === entry.id ? '✓' : '📋'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Indication clic pour agrandir / réduire */}
          {logs.length > MAX_BUBBLE_LOGS && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(prev => !prev);
              }}
              className="btn btn-sm w-100 py-1 mt-1 border-0 text-white-50 d-flex justify-content-center align-items-center gap-1 user-select-none"
              style={{
                fontSize: '9.5px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              }}
            >
              <span>{isExpanded ? '▲ Réduire' : `▼ Déplier tous les logs (${logs.length})`}</span>
            </button>
          )}

          {/* Queue de bulle de pensée (cercles décroissants en bas, espacés sur la distance doublée) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.92)',
              border: `1.5px solid ${themeColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-31px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '7.5px',
              height: '7.5px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.92)',
              border: `1.2px solid ${themeColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-44px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4.5px',
              height: '4.5px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.92)',
              border: `1px solid ${themeColor}`,
            }}
          />
        </div>
      </Html>
    </group>
  );
}
