/**
 * DevToolsOverlay.tsx — panneau DevTools HTML (hors Canvas).
 * Affiche : graphe FPS, stats renderer, stats scène, tailles GLB.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { devState } from './devState';

// ── GLBs déclarés dans la scène ───────────────────────────────────────────────

const GLB_PATHS = [
  'media/xiaomi_electric_scooter_4.glb',
  'media/smorkull.glb',
  'media/ikea_lamp_ola.glb',
  'media/sunnersta_trolley_ikea.glb',
  'media/mackapar_ikea.glb',
  'media/mechanic_jumpsuit.glb',
  'media/salopette-noir.glb',
  'media/baseball_cap.glb',
  'media/sneaker.glb',
  'media/ikea_Altappen_single.glb',
  'media/ikea_DRONA_black.glb',
  'media/viggja.glb',
  'media/potted_palm.glb',
  'media/realistic_human_cloths.glb',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  return b > 1 << 20 ? `${(b / (1 << 20)).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}
function glbColor(b: number) {
  return b > 512 * 1024 ? '#ff8866' : b > 128 * 1024 ? '#ffcc66' : '#88cc88';
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

// ── Styles ────────────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 16, right: 16,
  width: 188,
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  scrollbarWidth: 'thin',
};

const grpStyle: React.CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
};

const grpHeaderStyle: React.CSSProperties = {
  background: 'rgba(10,10,20,0.92)',
  color: '#ddd',
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  userSelect: 'none',
  backdropFilter: 'blur(8px)',
};

const grpBodyStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(8px)',
  padding: '6px 0 4px',
};

function Group({ emoji, title, children }: {
  emoji: string; title: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={grpStyle}>
      <div style={grpHeaderStyle} onClick={() => setOpen(o => !o)}>
        <span>{emoji} {title}</span>
        <span style={{ fontSize: 9, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }}>▶</span>
      </div>
      {open && <div style={grpBodyStyle}>{children}</div>}
    </div>
  );
}

// ── Ligne de stat ─────────────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 10px', fontSize: 10 }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: color ?? '#ffd700', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function DevToolsOverlay() {
  const [tick, setTick] = useState(0);
  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);

  // Subscribe to devState updates
  useEffect(() => {
    devState.onUpdate = () => setTick(t => t + 1);
    return () => { devState.onUpdate = null; };
  }, []);

  // Redraw FPS canvas on every tick
  useEffect(() => {
    if (fpsCanvasRef.current && devState.fpsSamples.length > 0) {
      drawFps(fpsCanvasRef.current, devState.fpsSamples);
    }
  });

  // Current FPS from last sample
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
    <div style={panelStyle} onWheel={e => e.stopPropagation()}>

      {/* ── FPS + Renderer ── */}
      <Group emoji="📊" title="Perf">
        <canvas
          ref={fpsCanvasRef}
          width={FPS_W} height={FPS_H}
          style={{ display: 'block', margin: '4px 8px', borderRadius: 3 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px 6px', fontSize: 10 }}>
          <span style={{ color: fpsColor, fontWeight: 700 }}>{curFps} FPS</span>
          <span style={{ color: '#444' }}>min:{fpsMin} max:{fpsMax}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4 }}>
          <div style={{ color: '#66cccc', fontSize: 9, fontWeight: 600, letterSpacing: '.5px', padding: '0 10px 2px' }}>RENDU</div>
          <StatRow
            label="Draw calls"
            value={devState.drawCalls.toLocaleString()}
            color={heatColor(devState.drawCalls, 200, 500)}
          />
          <StatRow
            label="Triangles"
            value={(devState.triangles / 1000).toFixed(1) + 'k'}
            color={heatColor(devState.triangles, 1_000_000, 2_000_000)}
          />
          <StatRow label="Géométries" value={devState.geometries} color="#777" />
          <StatRow label="Textures"   value={devState.textures}   color="#777" />
        </div>
      </Group>

      {/* ── Stats scène ── */}
      <Group emoji="🔷" title="Scène">
        <div style={{ color: '#66cccc', fontSize: 9, fontWeight: 600, letterSpacing: '.5px', padding: '0 10px 2px' }}>OBJETS</div>
        <StatRow label="Meshes"    value={devState.meshes.toLocaleString()} />
        <StatRow label="Instanced" value={devState.instances} />
        <StatRow label="Lights"    value={devState.lights} color="#777" />
        <StatRow
          label="Vertices"
          value={devState.verts > 0 ? Math.round(devState.verts / 1000) + 'k' : '—'}
          color="#777"
        />
        <StatRow
          label="Triangles"
          value={devState.tris > 0 ? Math.round(devState.tris / 1000) + 'k' : '—'}
          color="#777"
        />
        {devState.meshes > 800 && (
          <div style={{ color: '#ff8866', fontSize: 9, padding: '2px 10px' }}>
            ⚠ {devState.meshes} meshes → fusionner
          </div>
        )}
        <button
          onClick={handleRefreshScene}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: 'transparent', border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            color: '#444', fontSize: 9, padding: '4px 10px', cursor: 'pointer',
            marginTop: 4,
          }}
        >
          ↺ Refresh
        </button>
      </Group>

      {/* ── GLB ── */}
      <GlbSizes />

    </div>
  );
}

// ── Tailles des fichiers GLB ──────────────────────────────────────────────────

type GlbEntry = { name: string; path: string; bytes: number };

function GlbSizes() {
  const [entries, setEntries] = useState<GlbEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows: GlbEntry[] = [];
      await Promise.all(GLB_PATHS.map(async path => {
        try {
          const r = await fetch(path, { method: 'HEAD' });
          if (!r.ok) return;
          const bytes = parseInt(r.headers.get('content-length') ?? '0');
          if (bytes > 0) rows.push({ path, name: path.split('/').pop()!.replace('.glb', ''), bytes });
        } catch { /* absent */ }
      }));
      if (!cancelled) setEntries(rows.sort((a, b) => b.bytes - a.bytes));
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Group emoji="📦" title="GLB">
      {entries === null && (
        <div style={{ color: '#555', fontSize: 10, padding: '4px 10px' }}>chargement…</div>
      )}
      {entries?.length === 0 && (
        <div style={{ color: '#555', fontSize: 10, padding: '4px 10px' }}>aucun GLB</div>
      )}
      {entries?.map(({ name, bytes }) => (
        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 10px', fontSize: 10 }}>
          <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{name}</span>
          <span style={{ color: glbColor(bytes), flexShrink: 0, marginLeft: 4 }}>{fmtBytes(bytes)}</span>
        </div>
      ))}
      {entries && entries.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '3px 10px', fontSize: 10, color: '#555' }}>
          Total : {fmtBytes(entries.reduce((s, e) => s + e.bytes, 0))}
        </div>
      )}
    </Group>
  );
}
