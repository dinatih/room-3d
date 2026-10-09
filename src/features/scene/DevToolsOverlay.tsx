/**
 * DevToolsOverlay.tsx — groupes DevTools pour le popover Perf de la barre d'outils.
 * Exporte DevToolsGroups.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { devState } from './devState';
import { useAppIdle } from './idleState';

// ── Helpers ───────────────────────────────────────────────────────────────────

function heatColor(v: number, warn: number, danger: number) {
  return v >= danger ? '#dc2626' : v >= warn ? '#d97706' : '#2563eb';
}

function fpsTextClass(fps: number) {
  return fps >= 50 ? 'text-success' : fps >= 30 ? 'text-warning' : 'text-danger';
}

// ── FPS canvas ────────────────────────────────────────────────────────────────

const FPS_W = 140, FPS_H = 46;

export function drawFps(canvas: HTMLCanvasElement, samples: number[]) {
  const gfx = canvas.getContext('2d');
  if (!gfx) return;
  const W = canvas.width || FPS_W, H = canvas.height || FPS_H;
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
  letterSpacing: '.5px', padding: '0 8px 2px',
};

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 8px', fontSize: 11 }}>
      <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
      <span style={{ color: color ?? '#111827', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

const HeaderlessGroup: React.FC<{
  icon: string;
  title: string;
  defaultOpen?: boolean;
  headerPadding?: string;
  children: React.ReactNode;
}> = ({ children }) => <>{children}</>;

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Groupes DevTools à insérer dans le SidePanel.
 * Accepte le composant Group pour partager les styles.
 */
export function DevToolsGroups({ Group, compact = false, headerless = false }: {
  Group: React.ComponentType<{ icon: string; title: string; defaultOpen?: boolean; headerPadding?: string; children: React.ReactNode }>;
  compact?: boolean;
  headerless?: boolean;
}) {
  const [, setTick] = useState(0);
  const fpsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCanvasCallback = useCallback((canvas: HTMLCanvasElement | null) => {
    fpsCanvasRef.current = canvas;
    devState.fpsCanvas = canvas;
    if (canvas && devState.fpsSamples.length > 0) {
      drawFps(canvas, devState.fpsSamples);
    }
  }, []);

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    devState.onUpdate = () => setTick(t => t + 1);
    devState.refreshScene?.();
    return () => {
      devState.onUpdate = null;
      devState.fpsCanvas = null;
    };
  }, []);

  const samples  = devState.fpsSamples;
  const curFps   = samples.length ? samples[samples.length - 1] : 0;
  const valid    = samples.filter(v => v > 0);
  const fpsMin   = valid.length ? Math.min(...valid) : 0;
  const fpsMax   = valid.length ? Math.max(...valid) : 0;

  const handleRefreshScene = useCallback(() => {
    devState.refreshScene?.();
    setTick(t => t + 1);
  }, []);

  const isIdle = useAppIdle();
  const PerfGroup = headerless ? HeaderlessGroup : Group;

  return (
    <>
      <PerfGroup icon="bi-bar-chart-fill" title="Perf" defaultOpen headerPadding={compact ? 'py-1.5 px-2' : undefined}>
        <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
          <div className="d-flex align-items-stretch justify-content-start gap-2 px-2 pb-1">
            <canvas
              ref={fpsCanvasCallback}
              width={FPS_W} height={FPS_H}
              className="d-block flex-shrink-0 rounded shadow-sm"
              style={{ width: FPS_W, height: 'auto', minHeight: FPS_H }}
            />
            <div className="perf-stats d-flex flex-column text-start text-nowrap small lh-sm">
              <span className={`fw-bold ${isIdle ? 'text-warning' : fpsTextClass(curFps)}`}>{isIdle ? 'Veille' : `${curFps} FPS`}</span>
              <span className="fw-medium text-secondary">
                min:<span className={fpsTextClass(fpsMin)}>{fpsMin}</span>{' '}
                max:<span className={fpsTextClass(fpsMax)}>{fpsMax}</span>
              </span>
              <span title="Draw calls" className={`fw-semibold ${isIdle ? 'text-secondary' : devState.drawCalls >= 500 ? 'text-danger' : devState.drawCalls >= 200 ? 'text-warning' : 'text-primary'}`}>
                DC: {isIdle ? '0' : devState.drawCalls.toLocaleString()}
              </span>
              <span title="Triangles rendus" className={`fw-semibold ${isIdle ? 'text-secondary' : devState.triangles >= 2_000_000 ? 'text-danger' : devState.triangles >= 1_000_000 ? 'text-warning' : 'text-primary'}`}>
                Tris: {isIdle ? '0k' : (devState.triangles / 1000).toFixed(1) + 'k'}
              </span>
            </div>
          </div>

          {/* Bouton pour afficher les infos supplémentaires */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none',
              color: '#1d4ed8', fontSize: 10, fontWeight: 600, padding: '4px 8px', cursor: 'pointer', marginTop: 4,
            }}
          >
            <i className={`bi ${showDetails ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`} aria-hidden="true" />{showDetails ? 'Moins' : 'Plus d\'infos'}
          </button>

          {showDetails && (
            <>
              <div style={{ paddingBottom: 4 }}>
                <StatRow label="Géométries" value={devState.geometries} color="#111827" />
                <StatRow label="Textures"   value={devState.textures}   color="#111827" />
              </div>

              {/* SCÈNE — graph total */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 4, marginTop: 4 }}>
                <div style={sectionHeaderStyle}>
                  SCÈNE <span style={{ color: '#6b7280', fontWeight: 400 }}>· total</span>
                </div>
                <StatRow label="Meshes"    value={devState.meshes.toLocaleString()} />
                <StatRow label="Instanced" value={devState.instances} />
                <StatRow label="Lights"    value={devState.lights} color="#111827" />
                <StatRow label="Vertices"  value={devState.verts > 0 ? Math.round(devState.verts / 1000) + 'k' : '—'} color="#111827" />
                <StatRow label="Triangles" value={devState.tris  > 0 ? Math.round(devState.tris  / 1000) + 'k' : '—'} color="#111827" />
                {devState.meshes > 800 && (
                  <div style={{ color: '#dc2626', fontSize: 10, fontWeight: 600, padding: '2px 10px' }}><i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />{devState.meshes} meshes → fusionner</div>
                )}

                {devState.topObjects.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 4, paddingTop: 4 }}>
                    <div style={sectionHeaderStyle}>
                      TOP TRIANGLES <span style={{ color: '#6b7280', fontWeight: 400 }}>· coupables</span>
                    </div>
                    {devState.topObjects.slice(0, 10).map((obj) => (
                      <div key={obj.name} className="d-flex align-items-center justify-content-between px-2 py-0 overflow-hidden" style={{ fontSize: 11, minWidth: 0 }}>
                        <span className="text-truncate flex-grow-1 fw-medium" style={{ color: '#111827' }} title={obj.name}>
                          {obj.name}
                        </span>
                        <span className="flex-shrink-0 ms-2 fw-semibold" style={{ color: heatColor(obj.tris, 50_000, 200_000), fontVariantNumeric: 'tabular-nums' }}>
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
                    <i className="bi bi-search me-1" aria-hidden="true" />Log Diagnostic
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </PerfGroup>
    </>
  );
}
