/**
 * DevToolsOverlay.tsx — groupes DevTools pour le SidePanel.
 * Exporte DevToolsGroups (pas de wrapper fixe — SidePanel gère le positionnement).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { devState } from './devState';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  return b > 1 << 20 ? `${(b / (1 << 20)).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}
function heatColor(v: number, warn: number, danger: number) {
  return v >= danger ? '#ff4444' : v >= warn ? '#ffcc44' : '#ffd700';
}

// ── FPS canvas ────────────────────────────────────────────────────────────────

const FPS_W = 164, FPS_H = 46;

function drawFps(canvas: HTMLCanvasElement, samples: number[]) {
  const gfx = canvas.getContext('2d')!;
  const W = FPS_W, H = FPS_H;
  gfx.clearRect(0, 0, W, H);
  gfx.fillStyle = '#080812';
  gfx.fillRect(0, 0, W, H);

  const maxFps = Math.max(60, ...samples);
  gfx.strokeStyle = '#1a1a2e'; gfx.lineWidth = 1;
  for (const f of [30, 60]) {
    const y = H - (f / maxFps) * H;
    gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(W, y); gfx.stroke();
  }
  gfx.fillStyle = '#333'; gfx.font = '8px monospace';
  gfx.fillText('60', 2, H - (60 / maxFps) * H - 2);
  if (maxFps > 65) gfx.fillText('30', 2, H - (30 / maxFps) * H - 2);

  const bw = W / 80;
  for (let i = 0; i < samples.length; i++) {
    const f = samples[i]; if (!f) continue;
    gfx.fillStyle = f >= 50 ? '#44cc66' : f >= 30 ? '#ffaa00' : '#ff4444';
    gfx.fillRect(i * bw, H - (f / maxFps) * H, Math.max(1, bw - 0.5), (f / maxFps) * H);
  }
}

// ── Ligne de stat ─────────────────────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  color: '#66cccc', fontSize: 9, fontWeight: 600,
  letterSpacing: '.5px', padding: '0 10px 2px',
};

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 10px', fontSize: 10 }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: color ?? '#ffd700', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
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
  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    devState.onUpdate = () => setTick(t => t + 1);
    return () => { devState.onUpdate = null; };
  }, []);

  useEffect(() => {
    if (fpsCanvasRef.current && devState.fpsSamples.length > 0) {
      drawFps(fpsCanvasRef.current, devState.fpsSamples);
    }
  });

  const samples  = devState.fpsSamples;
  const curFps   = samples.length ? samples[samples.length - 1] : 0;
  const valid    = samples.filter(v => v > 0);
  const fpsMin   = valid.length ? Math.min(...valid) : 0;
  const fpsMax   = valid.length ? Math.max(...valid) : 0;
  const fpsColor = curFps >= 50 ? '#44cc66' : curFps >= 30 ? '#ffaa00' : '#ff4444';

  const handleRefreshScene = useCallback(() => {
    devState.refreshScene?.();
    setTick(t => t + 1);
  }, []);

  return (
    <>
      <Group emoji="📊" title="Perf" defaultOpen>
        <canvas
          ref={fpsCanvasRef}
          width={FPS_W} height={FPS_H}
          style={{ display: 'block', margin: '0 8px 4px', borderRadius: 3 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px 6px', fontSize: 10 }}>
          <span style={{ color: fpsColor, fontWeight: 700 }}>{curFps} FPS</span>
          <span style={{ color: '#444' }}>min:{fpsMin} max:{fpsMax}</span>
        </div>

        {/* RENDU — stats GPU, mises à jour chaque frame */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4 }}>
          <div style={sectionHeaderStyle}>RENDU <span style={{ color: '#444', fontWeight: 400 }}>· live</span></div>
          <StatRow label="Draw calls" value={devState.drawCalls.toLocaleString()} color={heatColor(devState.drawCalls, 200, 500)} />
          <StatRow label="Triangles"  value={(devState.triangles / 1000).toFixed(1) + 'k'} color={heatColor(devState.triangles, 1_000_000, 2_000_000)} />
          <StatRow label="Géométries" value={devState.geometries} color="#777" />
          <StatRow label="Textures"   value={devState.textures}   color="#777" />
        </div>

        {/* SCÈNE — graph total, sur demande (refresh) */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4, marginTop: 4 }}>
          <div style={sectionHeaderStyle}>SCÈNE <span style={{ color: '#444', fontWeight: 400 }}>· total</span></div>
          <StatRow label="Meshes"    value={devState.meshes.toLocaleString()} />
          <StatRow label="Instanced" value={devState.instances} />
          <StatRow label="Lights"    value={devState.lights} color="#777" />
          <StatRow label="Vertices"  value={devState.verts > 0 ? Math.round(devState.verts / 1000) + 'k' : '—'} color="#777" />
          <StatRow label="Triangles" value={devState.tris  > 0 ? Math.round(devState.tris  / 1000) + 'k' : '—'} color="#777" />
          {devState.meshes > 800 && (
            <div style={{ color: '#ff8866', fontSize: 9, padding: '2px 10px' }}>⚠ {devState.meshes} meshes → fusionner</div>
          )}

          {devState.topMeshes.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 4 }}>
              <div style={sectionHeaderStyle}>TOP <span style={{ color: '#444', fontWeight: 400 }}>· par groupe</span></div>
              {devState.topMeshes.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 10px', fontSize: 10 }}>
                  <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{name}</span>
                  <span style={{ color: '#777', flexShrink: 0, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleRefreshScene}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              color: '#444', fontSize: 9, padding: '4px 10px', cursor: 'pointer', marginTop: 4,
            }}
          >
            ↺ Refresh
          </button>
        </div>
      </Group>
    </>
  );
}
