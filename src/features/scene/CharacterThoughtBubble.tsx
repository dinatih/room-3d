import { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { findCharacter } from './walkerConfig';
import { APP_LOG_HISTORY, type AppLogEntry } from '@features/ui/AppConsole';

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

  const handleCopy = (e: React.MouseEvent, entry: AppLogEntry) => {
    e.stopPropagation();
    const formatted = `[${formatBubbleTime(entry.timestamp)}] ${characterName}: ${entry.message}`;
    navigator.clipboard?.writeText(formatted).catch(() => {});
    setCopiedId(entry.id);
    setTimeout(() => {
      setCopiedId(prev => (prev === entry.id ? null : prev));
    }, 1500);
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
          transform: 'translate(-50%, calc(-100% - 28px))',
          willChange: 'transform',
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
          title={isExpanded ? "Cliquer pour réduire" : "Cliquer pour voir tout l'historique"}
          style={{
            position: 'relative',
            width: 'max-content',
            minWidth: '220px',
            maxWidth: isExpanded ? '540px' : '380px',
            background: 'rgba(13, 17, 23, 0.94)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1.5px solid ${themeColor}`,
            borderRadius: '12px',
            padding: '7px 12px',
            color: '#f0f6fc',
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.65), 0 0 16px ${themeColor}44`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11.5px',
            transition: 'max-width 0.2s ease-out',
          }}
        >
          {/* Header de la bulle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              paddingBottom: '4px',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <span style={{ fontSize: '14px' }}>{emoji}</span>
              <span style={{ color: themeColor }}>{characterName}</span>
              {isActive && (
                <span
                  style={{
                    fontSize: '8.5px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: '#238636',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Focus
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '9.5px',
                color: 'rgba(255, 255, 255, 0.55)',
                fontFamily: 'monospace',
              }}
            >
              {logs.length > 0 ? `${logs.length} logs` : 'en attente'}
            </span>
          </div>

          {/* Corps des logs / Pensées (1 ligne par log avec scrollbar) */}
          <div
            onClick={(e) => isExpanded && e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              maxHeight: isExpanded ? '240px' : '95px',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: isExpanded ? '6px' : '2px',
              scrollbarWidth: 'thin',
              scrollbarColor: `${themeColor} transparent`,
            }}
          >
            {logs.length === 0 ? (
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontStyle: 'italic',
                  padding: '2px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                💭 En attente d'action...
              </div>
            ) : (
              displayedLogs.map((entry, idx) => {
                const isLast = idx === displayedLogs.length - 1;
                return (
                  <div
                    key={entry.id}
                    title={entry.message}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      color: isLast ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: isLast ? 600 : 400,
                      lineHeight: '1.4',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      padding: '1px 2px',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          color: themeColor,
                          opacity: 0.85,
                          fontFamily: 'monospace',
                          flexShrink: 0,
                        }}
                      >
                        {formatBubbleTime(entry.timestamp)}
                      </span>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.message}
                      </span>
                    </div>

                    {/* Bouton Copier la ligne */}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, entry)}
                      title="Copier ce log"
                      style={{
                        background: copiedId === entry.id ? 'rgba(35, 134, 54, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                        border: copiedId === entry.id ? '1px solid #238636' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: copiedId === entry.id ? '#3fb950' : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '9px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                      }}
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
            <div
              style={{
                marginTop: '5px',
                paddingTop: '4px',
                borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.55)',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{isExpanded ? '▲ Réduire' : `▼ Déplier tous les logs (${logs.length})`}</span>
            </div>
          )}

          {/* Queue de bulle de pensée (cercles décroissants en bas) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.92)',
              border: `1.5px solid ${themeColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-15px',
              left: '47%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.92)',
              border: `1px solid ${themeColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '44%',
              transform: 'translateX(-50%)',
              width: '3.5px',
              height: '3.5px',
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
