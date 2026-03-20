// =============================================
// DEVELOPER TOOLS PANEL
// FPS graph, renderer stats, scene stats, GLB sizes
// =============================================
import { gltfLoader, glbRegistry } from './loaders.js';
const FPS_SAMPLES = 80;
const UPDATE_MS   = 500;

const GLB_PATHS = [
  'media/potted_palm.glb',
  'media/viggja.glb',
  'media/baseball_cap.glb',
  'media/man_black_business_suit.glb',
  'media/smorkull.glb',
  'media/sunnersta_trolley_ikea.glb',
  'media/mackapar_ikea.glb',
  'media/ikea_lamp_ola.glb',
  'media/ikea_DRONA_black.glb',

  'media/ikea_Altappen_single.glb',
  'media/xiaomi_electric_scooter_4.glb',
  'media/folding-chair-generic.glb',
  'media/sneaker.glb',
  'media/mechanic_jumpsuit.glb',
  'media/salopette-noir.glb',
  'media/pizza_oven.glb',
  'media/realistic_human_cloths.glb',
];

export function buildDevtools(scene, renderer) {
  const body = document.getElementById('devtools-body');
  if (!body) return;

  // ── helpers ────────────────────────────────────────────────────
  function el(tag, css, html = '') {
    const e = document.createElement(tag);
    if (css)  e.style.cssText = css;
    if (html) e.innerHTML = html;
    body.appendChild(e);
    return e;
  }
  function hr() {
    el('div', 'border-top:1px solid rgba(255,255,255,0.06)');
  }
  function lbl(t) {
    return `<span style="color:#66cccc;font-size:9px;font-weight:600;letter-spacing:.5px">${t}</span><br>`;
  }
  function hi(v)  { return `<span style="color:#ffd700">${v.toLocaleString()}</span>`; }
  function dim(v) { return `<span style="color:#777">${v}</span>`; }
  function heatColor(v, warn, danger) {
    const c = v >= danger ? '#ff4444' : v >= warn ? '#ffcc44' : '#ffd700';
    return `<span style="color:${c}">${v.toLocaleString()}</span>`;
  }

  // ── FPS canvas ─────────────────────────────────────────────────
  const fpsCanvas = document.createElement('canvas');
  fpsCanvas.width  = 164;
  fpsCanvas.height = 46;
  fpsCanvas.style.cssText = 'display:block;margin:6px 8px 0;border-radius:3px';
  body.appendChild(fpsCanvas);
  const gfx = fpsCanvas.getContext('2d');

  const fpsRow = el('div',
    'padding:2px 10px 5px;font-size:10px;display:flex;justify-content:space-between;font-variant-numeric:tabular-nums');

  // ── Renderer stats ─────────────────────────────────────────────
  hr();
  const renderRow = el('div', 'padding:5px 10px;font-size:10px;color:#888;line-height:1.8;font-variant-numeric:tabular-nums');

  // ── Scene stats ────────────────────────────────────────────────
  hr();
  const sceneRow = el('div', 'padding:5px 10px;font-size:10px;color:#888;line-height:1.8');

  function computeSceneStats() {
    let meshes = 0, instanced = 0, lights = 0, lines = 0, groups = 0;
    scene.traverse(obj => {
      if      (obj.isInstancedMesh) instanced++;
      else if (obj.isMesh)          meshes++;
      else if (obj.isLight)         lights++;
      else if (obj.isLine)          lines++;
      else if (obj.isGroup)         groups++;
    });
    let verts = 0, tris = 0;
    scene.traverse(obj => {
      if (!obj.isMesh || obj.isInstancedMesh) return;
      if (!obj.visible) return; // skip hidden geometry
      const pos = obj.geometry?.attributes?.position;
      if (!pos) return;
      verts += pos.count;
      const idx = obj.geometry.index;
      tris  += idx ? idx.count / 3 : pos.count / 3;
    });
    const tip = meshes > 800
      ? `<br><span style="color:#ff8866;font-size:9px">⚠ ${meshes} meshes → fusionner</span>` : '';
    sceneRow.innerHTML =
      lbl('SCÈNE') +
      `Meshes: ${hi(meshes)}  Instanced: ${hi(instanced)}<br>` +
      `Lights: ${dim(lights)}  Lines: ${dim(lines)}  Groups: ${dim(groups)}<br>` +
      `Vertices: ${dim(Math.round(verts / 1000) + 'k')}  Tris: ${dim(Math.round(tris / 1000) + 'k')}` +
      tip;
  }

  // Refresh button
  const refreshBtn = el('div',
    'padding:0 10px 5px;cursor:pointer',
    '<span style="color:#444;font-size:9px">↺ Refresh</span>');
  refreshBtn.addEventListener('click', () => { computeSceneStats(); });

  // Compute after async GLBs have loaded
  setTimeout(computeSceneStats, 3500);

  // ── GLB sizes + hover stats ─────────────────────────────────────
  hr();
  const glbRow = el('div', 'padding:5px 10px 8px;font-size:10px;color:#888;line-height:1.8',
    dim('GLB : chargement…'));

  // Tooltip flottant hors du panel
  const glbTooltip = document.createElement('div');
  glbTooltip.style.cssText =
    'position:fixed;display:none;z-index:9999;pointer-events:none;' +
    'background:#080812;border:1px solid rgba(255,255,255,0.13);border-radius:4px;' +
    'padding:5px 9px;font:10px monospace;color:#888;line-height:1.7;white-space:nowrap;';
  document.body.appendChild(glbTooltip);

  // Lit le registre (objets réels en scène, chargés via gltfLoader)
  function getGlbStats(path) {
    const scenes = glbRegistry.get(path);
    if (!scenes?.length) return null;
    const s = { copies: scenes.length, meshes: 0, instanced: 0, lights: 0, lines: 0, groups: 0, verts: 0, tris: 0 };
    for (const root of scenes) {
      root.traverse(obj => {
        if      (obj.isInstancedMesh) s.instanced++;
        else if (obj.isMesh)          s.meshes++;
        else if (obj.isLight)         s.lights++;
        else if (obj.isLine)          s.lines++;
        else if (obj.isGroup)         s.groups++;
        if (obj.geometry) {
          const pos = obj.geometry.attributes?.position;
          if (pos) {
            s.verts += pos.count;
            s.tris  += obj.geometry.index ? obj.geometry.index.count / 3 : pos.count / 3;
          }
        }
      });
    }
    return s;
  }

  (async () => {
    const rows = [];
    let total = 0;
    for (const p of GLB_PATHS) {
      try {
        const r = await fetch(p, { method: 'HEAD' });
        if (!r.ok) continue;
        const bytes = parseInt(r.headers.get('content-length') || '0');
        rows.push({ path: p, name: p.split('/').pop().replace('.glb', ''), bytes });
        total += bytes;
      } catch { /* file missing, skip */ }
    }
    if (!rows.length) { glbRow.innerHTML = dim('aucun GLB'); return; }
    const fmt = b => b > 1 << 20 ? `${(b / (1 << 20)).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
    const col = b => b > 512 * 1024 ? '#ff8866' : b > 128 * 1024 ? '#ffcc66' : '#88cc88';

    glbRow.innerHTML = lbl('GLB');
    for (const { path, name, bytes } of rows.sort((a, b) => b.bytes - a.bytes)) {
      const row = document.createElement('div');
      row.innerHTML =
        `<span style="color:#888">${name}</span>` +
        `<span style="color:${col(bytes)};float:right">${fmt(bytes)}</span>`;

      row.addEventListener('mouseenter', (e) => {
        const s = getGlbStats(path);
        if (!s) { glbTooltip.innerHTML = dim('non chargé'); }
        else {
          const k = n => Math.round(n / 1000) + 'k';
          const copies = s.copies > 1 ? `  <span style="color:#ffaa44">×${s.copies}</span>` : '';
          glbTooltip.innerHTML =
            `Mesh: ${hi(s.meshes)}  Instanced: ${hi(s.instanced)}  ` +
            `Lights: ${dim(s.lights)}  Lines: ${dim(s.lines)}  Groups: ${dim(s.groups)}${copies}<br>` +
            `Vertices: ${dim(k(s.verts))}  Tris: ${dim(k(s.tris))}`;
        }
        glbTooltip.style.display = 'block';
        glbTooltip.style.left = (e.clientX + 14) + 'px';
        glbTooltip.style.top  = (e.clientY - 8)  + 'px';
      });
      row.addEventListener('mousemove', e => {
        glbTooltip.style.left = (e.clientX + 14) + 'px';
        glbTooltip.style.top  = (e.clientY - 8)  + 'px';
      });
      row.addEventListener('mouseleave', () => { glbTooltip.style.display = 'none'; });
      glbRow.appendChild(row);
    }
    const totalDiv = document.createElement('div');
    totalDiv.innerHTML = `<span style="color:#555">Total : ${fmt(total)}</span>`;
    glbRow.appendChild(totalDiv);
  })();

  // ── FPS loop ───────────────────────────────────────────────────
  const samples = new Array(FPS_SAMPLES).fill(0);
  let lastTime = performance.now(), frameCount = 0, curFps = 0;

  function tick(now) {
    requestAnimationFrame(tick);
    frameCount++;
    const dt = now - lastTime;
    if (dt < UPDATE_MS) return;

    curFps     = Math.round(frameCount * 1000 / dt);
    frameCount = 0;
    lastTime   = now;
    samples.push(curFps);
    if (samples.length > FPS_SAMPLES) samples.shift();

    // draw graph
    const W = fpsCanvas.width, H = fpsCanvas.height;
    gfx.clearRect(0, 0, W, H);
    gfx.fillStyle = '#080812';
    gfx.fillRect(0, 0, W, H);

    const maxFps = Math.max(60, ...samples);
    // reference lines
    gfx.strokeStyle = '#1a1a2e'; gfx.lineWidth = 1;
    for (const f of [30, 60]) {
      const y = H - (f / maxFps) * H;
      gfx.beginPath(); gfx.moveTo(0, y); gfx.lineTo(W, y); gfx.stroke();
    }
    gfx.fillStyle = '#222'; gfx.font = '8px monospace';
    gfx.fillText('60', 2, H - (60 / maxFps) * H - 2);
    if (maxFps > 65) gfx.fillText('30', 2, H - (30 / maxFps) * H - 2);

    // bars
    const bw = W / FPS_SAMPLES;
    for (let i = 0; i < samples.length; i++) {
      const f = samples[i]; if (!f) continue;
      gfx.fillStyle = f >= 50 ? '#44cc66' : f >= 30 ? '#ffaa00' : '#ff4444';
      gfx.fillRect(i * bw, H - (f / maxFps) * H, Math.max(1, bw - 0.5), (f / maxFps) * H);
    }

    // fps label
    const fpsColor = curFps >= 50 ? '#44cc66' : curFps >= 30 ? '#ffaa00' : '#ff4444';
    const valid = samples.filter(v => v > 0);
    const mn = valid.length ? Math.min(...valid) : 0;
    const mx = valid.length ? Math.max(...valid) : 0;
    fpsRow.innerHTML =
      `<span style="color:${fpsColor};font-weight:600">${curFps} FPS</span>` +
      `<span style="color:#444">min:${mn}  max:${mx}</span>`;

    // renderer stats (read last-frame values from Three.js info)
    const ri = renderer.info;
    const drawWarn = ri.render.calls >= 500 ? `<span style="color:#ff8866;font-size:9px"> ⚠ élevé</span>` : '';
    const triWarn  = ri.render.triangles >= 2_000_000 ? `<span style="color:#ff8866;font-size:9px"> ⚠ élevé</span>` : '';
    renderRow.innerHTML =
      lbl('RENDU') +
      `Draw calls: ${heatColor(ri.render.calls, 200, 500)}${drawWarn}<br>` +
      `Triangles: ${heatColor(ri.render.triangles, 1_000_000, 2_000_000)}${triWarn}<br>` +
      `Géométries: ${dim(ri.memory.geometries)}  Textures: ${dim(ri.memory.textures)}`;
  }

  requestAnimationFrame(tick);
}
