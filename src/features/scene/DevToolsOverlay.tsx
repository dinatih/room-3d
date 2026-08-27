/**
 * DevToolsOverlay.tsx — groupes DevTools pour le SidePanel.
 * Exporte DevToolsGroups (pas de wrapper fixe — SidePanel gère le positionnement).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { devState } from './devState';
import { APP_IDLE_TIMEOUT_SECONDS, useAppIdle } from './idleState';

// ── Helpers ───────────────────────────────────────────────────────────────────

function heatColor(v: number, warn: number, danger: number) {
  return v >= danger ? '#dc2626' : v >= warn ? '#d97706' : '#2563eb';
}

// ── FPS canvas ────────────────────────────────────────────────────────────────

const FPS_W = 164, FPS_H = 46;

export function drawFps(canvas: HTMLCanvasElement, samples: number[]) {
  const gfx = canvas.getContext('2d');
  if (!gfx) return;
  const W = FPS_W, H = FPS_H;
  gfx.clearRect(0, 0, W, H);
  gfx.fillStyle = '#0f172a';
  gfx.fillRect(0, 0, W, H);

  const maxFps = Math.max(60, ...samples);
  gfx.strokeStyle = '#334155'; gfx.lineWidth = 1;
  for (const f of [30, 60]) {
    const y = H - (f / maxFps) * H;
    gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(W, y); gfx.stroke();
  }
  gfx.fillStyle = '#94a3b8'; gfx.font = '8px monospace';
  gfx.fillText('60', 2, H - (60 / maxFps) * H - 2);
  if (maxFps > 65) gfx.fillText('30', 2, H - (30 / maxFps) * H - 2);

  const bw = W / 80;
  for (let i = 0; i < samples.length; i++) {
    const f = samples[i]; if (!f) continue;
    gfx.fillStyle = f >= 50 ? '#22c55e' : f >= 30 ? '#f59e0b' : '#ef4444';
    gfx.fillRect(i * bw, H - (f / maxFps) * H, Math.max(1, bw - 0.5), (f / maxFps) * H);
  }
}

// ── Ligne de stat ─────────────────────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  color: '#0284c7', fontSize: 10, fontWeight: 700,
  letterSpacing: '.5px', padding: '0 10px 2px',
};

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 10px', fontSize: 11 }}>
      <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
      <span style={{ color: color ?? '#111827', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Groupes DevTools à insérer dans SidePanel.
 * Accepte le composant Group de SidePanel pour partager les styles.
 */
export function DevToolsGroups({ Group }: {
  Group: React.ComponentType<{ emoji: string; title: string; defaultOpen?: boolean; children: React.ReactNode }>;
}) {
  const [, setTick] = useState(0);
  const [showScene, setShowScene] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    devState.onUpdate = () => setTick(t => t + 1);
    if (fpsCanvasRef.current) devState.fpsCanvas = fpsCanvasRef.current;
    return () => { devState.onUpdate = null; devState.fpsCanvas = null; };
  }, []);

  const samples  = devState.fpsSamples;
  const curFps   = samples.length ? samples[samples.length - 1] : 0;
  const valid    = samples.filter(v => v > 0);
  const fpsMin   = valid.length ? Math.min(...valid) : 0;
  const fpsMax   = valid.length ? Math.max(...valid) : 0;
  const fpsColor = curFps >= 50 ? '#16a34a' : curFps >= 30 ? '#d97706' : '#dc2626';

  const handleRefreshScene = useCallback(() => {
    devState.refreshScene?.();
    setTick(t => t + 1);
  }, []);

  const isIdle = useAppIdle();

  return (
    <>
      <Group emoji="📊" title="Perf" defaultOpen>
        <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
          <canvas
            ref={fpsCanvasRef}
            width={FPS_W} height={FPS_H}
            style={{ display: 'block', margin: '0 8px 4px', borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px 6px', fontSize: 11 }}>
            <span style={{ color: isIdle ? '#d97706' : fpsColor, fontWeight: 700 }}>{isIdle ? '0 FPS (veille)' : `${curFps} FPS`}</span>
            <span style={{ color: '#4b5563', fontWeight: 500 }}>min:{fpsMin} max:{fpsMax}</span>
          </div>

          {/* RENDU — stats GPU principales */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 4 }}>
            <div style={sectionHeaderStyle}>
              RENDU <span style={{ color: isIdle ? '#d97706' : '#6b7280', fontWeight: isIdle ? 600 : 400 }}>{isIdle ? `· veille (${APP_IDLE_TIMEOUT_SECONDS}s inactif)` : '· live'}</span>
            </div>
            <StatRow label="Draw calls" value={isIdle ? '0' : devState.drawCalls.toLocaleString()} color={isIdle ? '#6b7280' : heatColor(devState.drawCalls, 200, 500)} />
            <StatRow label="Triangles"  value={isIdle ? '0k' : (devState.triangles / 1000).toFixed(1) + 'k'} color={isIdle ? '#6b7280' : heatColor(devState.triangles, 1_000_000, 2_000_000)} />
          </div>

          {/* Bouton pour afficher les infos supplémentaires */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none',
              color: '#1d4ed8', fontSize: 10, fontWeight: 600, padding: '4px 10px', cursor: 'pointer', marginTop: 4,
            }}
          >
            {showDetails ? '▼ Moins d\'infos' : '▶ Plus d\'infos'}
          </button>

          {showDetails && (
            <>
              <div style={{ paddingBottom: 4 }}>
                <StatRow label="Géométries" value={devState.geometries} color="#111827" />
                <StatRow label="Textures"   value={devState.textures}   color="#111827" />
              </div>

              {/* SCÈNE — graph total, sur demande (refresh) */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 4, marginTop: 4 }}>
                <div
                  onClick={() => setShowScene(!showScene)}
                  style={{ ...sectionHeaderStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>SCÈNE <span style={{ color: '#6b7280', fontWeight: 400 }}>· total</span></span>
                  <span style={{ fontSize: 9 }}>{showScene ? '▼' : '▶'}</span>
                </div>
                {showScene && (
                  <>
                    <StatRow label="Meshes"    value={devState.meshes.toLocaleString()} />
                    <StatRow label="Instanced" value={devState.instances} />
                    <StatRow label="Lights"    value={devState.lights} color="#111827" />
                    <StatRow label="Vertices"  value={devState.verts > 0 ? Math.round(devState.verts / 1000) + 'k' : '—'} color="#111827" />
                    <StatRow label="Triangles" value={devState.tris  > 0 ? Math.round(devState.tris  / 1000) + 'k' : '—'} color="#111827" />
                    {devState.meshes > 800 && (
                      <div style={{ color: '#dc2626', fontSize: 10, fontWeight: 600, padding: '2px 10px' }}>⚠ {devState.meshes} meshes → fusionner</div>
                    )}
                  </>
                )}

                {devState.topObjects.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 4, paddingTop: 4 }}>
                    <div
                      onClick={() => setShowTop(!showTop)}
                      style={{ ...sectionHeaderStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>TOP TRIANGLES <span style={{ color: '#6b7280', fontWeight: 400 }}>· coupables</span></span>
                      <span style={{ fontSize: 9 }}>{showTop ? '▼' : '▶'}</span>
                    </div>
                    {showTop && devState.topObjects.slice(0, 10).map((obj) => (
                      <div key={obj.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px', fontSize: 11 }}>
                        <span style={{ color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }} title={obj.name}>
                          {obj.name}
                        </span>
                        <span style={{ color: heatColor(obj.tris, 50_000, 200_000), fontWeight: 600, flexShrink: 0, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                          {(obj.tris / 1000).toFixed(1)}k
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 4, padding: '6px 8px 2px', borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 4 }}>
                  <button
                    onClick={handleRefreshScene}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.18)',
                      borderRadius: 4, color: '#111827', fontSize: 10, fontWeight: 600, padding: '4px 6px', cursor: 'pointer',
                    }}
                  >
                    ↺ Refresh
                  </button>
                  <button
                    onClick={() => devState.logDiagnostics?.()}
                    style={{
                      flex: 1.5,
                      background: 'rgba(217,119,6,0.12)', border: '1px solid #d97706',
                      borderRadius: 4, color: '#9a3412', fontSize: 10, padding: '4px 6px', cursor: 'pointer',
                      fontWeight: 700,
                    }}
                    title="Envoie un rapport détaillé dans APP LOGS et la console F12"
                  >
                    🔍 Log Diagnostic
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Group>
    </>
  );
}
