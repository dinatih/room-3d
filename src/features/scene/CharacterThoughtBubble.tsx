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
          if (next.length > 30) return next.slice(-30);
          return next;
        });
      }
    };

    document.addEventListener('app-log', handleLog);
    return () => {
      document.removeEventListener('app-log', handleLog);
    };
  }, [characterId]);

  // Si on est en FPV direct sur le perso actif, on ne gêne pas sa vue
  if (isFirstPerson) return null;

  const displayedLogs = isExpanded ? logs.slice(-8) : logs.slice(-MAX_BUBBLE_LOGS);

  return (
    <group position={[0, 205, 0]}>
      <Html
        center
        distanceFactor={180}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          cursor: 'pointer',
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
          style={{
            position: 'relative',
            minWidth: '180px',
            maxWidth: isExpanded ? '340px' : '260px',
            background: 'rgba(13, 17, 23, 0.90)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1.5px solid ${themeColor}`,
            borderRadius: '14px',
            padding: '8px 12px',
            color: '#f0f6fc',
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px ${themeColor}44`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            transition: 'all 0.2s ease-out',
            transform: 'translateY(-10px)',
          }}
        >
          {/* Header de la bulle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              paddingBottom: '4px',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <span style={{ fontSize: '13px' }}>{emoji}</span>
              <span style={{ color: themeColor }}>{characterName}</span>
              {isActive && (
                <span
                  style={{
                    fontSize: '8px',
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
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'monospace',
              }}
            >
              {logs.length > 0 ? `${logs.length} logs` : 'en attente'}
            </span>
          </div>

          {/* Corps des logs / Pensées */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: isExpanded ? '160px' : '90px',
              overflowY: 'auto',
            }}
          >
            {logs.length === 0 ? (
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontStyle: 'italic',
                  padding: '2px 0',
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
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '5px',
                      color: isLast ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                      fontWeight: isLast ? 600 : 400,
                      lineHeight: '1.3',
                      fontSize: '10.5px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        color: themeColor,
                        opacity: 0.8,
                        fontFamily: 'monospace',
                        flexShrink: 0,
                      }}
                    >
                      {formatBubbleTime(entry.timestamp)}
                    </span>
                    <span
                      style={{
                        wordBreak: 'break-word',
                      }}
                    >
                      {entry.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Indication clic pour agrandir */}
          {logs.length > MAX_BUBBLE_LOGS && (
            <div
              style={{
                marginTop: '4px',
                paddingTop: '3px',
                borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                fontSize: '8.5px',
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
              }}
            >
              {isExpanded ? '▲ Réduire' : '▼ Déplier l\'historique'}
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
              background: 'rgba(13, 17, 23, 0.90)',
              border: `1.5px solid ${themeColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-15px',
              left: '46%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.90)',
              border: `1px solid ${themeColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '43%',
              transform: 'translateX(-50%)',
              width: '3.5px',
              height: '3.5px',
              borderRadius: '50%',
              background: 'rgba(13, 17, 23, 0.90)',
              border: `1px solid ${themeColor}`,
            }}
          />
        </div>
      </Html>
    </group>
  );
}
