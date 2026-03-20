// =============================================
// INVENTORY PANEL — overlay modal + 3D preview
// =============================================
import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { INVENTORY, CATEGORIES } from './inventoryData.js';

let overlay = null;

function fmt(n) { return Number.isFinite(n) ? n : '—'; }
function dimsStr(d) { return `${fmt(d.w)} × ${fmt(d.d)} × ${fmt(d.h)} cm`; }
function posStr(p)  { return `X${fmt(p.x)}  Z${fmt(p.z)}`; }

// ── Clone from main scene by bounding-box proximity ──────────────────────────

function cloneFromScene(mainScene, item) {
  const clones = [];

  // Approche 1 : ciblage par inventoryId (précis)
  const idGroups = [];
  mainScene.traverse(obj => {
    if (obj.userData.inventoryId === item.id) idGroups.push(obj);
  });

  if (idGroups.length) {
    for (const grp of idGroups) {
      grp.updateMatrixWorld(true);
      grp.traverse(obj => {
        if (!obj.isMesh) return;
        obj.updateWorldMatrix(true, false);
        const clone = obj.clone(false);
        obj.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
        clone.layers.set(0);
        clones.push(clone);
      });
    }
  } else {
    // Approche 2 : fallback bbox pour les objets sans tag inventoryId
    const cx = item.scenePos.x;
    const cz = item.scenePos.z;
    const mx = item.dims.w / 2 + 25;
    const mz = item.dims.d / 2 + 25;
    const searchBox = new THREE.Box3(
      new THREE.Vector3(cx - mx, -30, cz - mz),
      new THREE.Vector3(cx + mx, 280, cz + mz)
    );
    mainScene.traverse(obj => {
      if (!obj.isMesh) return;
      if (obj.userData.brickType) return;
      if (obj.layers.mask === 1) return;
      const objBox = new THREE.Box3().setFromObject(obj);
      if (objBox.max.y - objBox.min.y >= 240) return;
      if (!searchBox.intersectsBox(objBox)) return;
      obj.updateWorldMatrix(true, false);
      const clone = obj.clone(false);
      obj.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
      clone.layers.set(0);
      clones.push(clone);
    });
  }

  if (!clones.length) return null;

  const group = new THREE.Group();
  clones.forEach(c => group.add(c));
  group.updateMatrixWorld(true);

  // Center group at origin
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
  // Sit on Y=0
  group.position.y += (box.max.y - box.min.y) / 2;
  group.updateMatrixWorld(true);

  return group;
}

// ── Mini 3D Preview ───────────────────────────────────────────────────────────

function createPreview(canvas, mainScene) {
  const W = canvas.width;
  const H = canvas.height;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x111118, 1);

  const previewScene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 10000);
  camera.layers.enableAll();

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(1, 2, 2);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dir2.position.set(-1, 0.5, -1);
  previewScene.add(ambient, dir, dir2);


  let pivot = null;
  let rafId = null;

  function fitCamera(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const dist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.7;
    camera.position.set(center.x + dist * 0.4, center.y + size.y * 0.2, center.z + dist);
    camera.lookAt(center);
    camera.near = dist * 0.01;
    camera.far  = dist * 10;
    camera.updateProjectionMatrix();
  }

  function clearScene() {
    if (pivot) {
      previewScene.remove(pivot);
      pivot.traverse(o => { if (o.isMesh) o.geometry?.dispose(); });
      pivot = null;
    }
  }

  function loadItem(item) {
    clearScene();
    pivot = new THREE.Group();
    pivot.add(new THREE.AxesHelper(20));
    previewScene.add(pivot);

    if (item.glbPath) {
      gltfLoader.load(item.glbPath, (gltf) => {
        const obj = gltf.scene.clone(true);
        pivot.add(obj);
        obj.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);
        obj.position.y += (box.max.y - box.min.y) / 2;
        fitCamera(obj);
      });
    } else {
      const cloned = cloneFromScene(mainScene, item);
      if (cloned) {
        pivot.add(cloned);
        fitCamera(cloned);
      }
    }
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (pivot) pivot.rotation.y += 0.008;
    renderer.render(previewScene, camera);
  }

  function start() { if (!rafId) animate(); }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  return { loadItem, start, stop };
}

// ── Table rendering ───────────────────────────────────────────────────────────

function renderTable(tbody, items, onSelect) {
  tbody.innerHTML = '';
  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.brand || '—'}</td>
      <td style="text-align:center">${item.qty}</td>
      <td style="text-align:center;font-family:monospace;font-size:11px">${dimsStr(item.dims)}</td>
      <td style="text-align:center;font-family:monospace;font-size:10px;color:#aaa">${posStr(item.scenePos)}</td>
      <td style="color:#aaa;font-size:11px">${item.notes || ''}</td>
    `;
    tr.addEventListener('click', () => {
      tbody.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      onSelect(item);
    });
    tbody.appendChild(tr);
  });
}

// ── Build ─────────────────────────────────────────────────────────────────────

export function buildInventory(mainScene) {
  const style = document.createElement('style');
  style.textContent = `
    #inv-table tbody tr { cursor:pointer; }
    #inv-table tbody tr:nth-child(even) { background:rgba(255,255,255,0.03); }
    #inv-table tbody tr:hover           { background:rgba(255,215,0,0.07); }
    #inv-table tbody tr.selected        { background:rgba(255,215,0,0.15) !important; }
    #inv-table tbody td                 { padding:5px 8px; border-bottom:1px solid rgba(255,255,255,0.05); }
    #inv-search:focus { border-color:#ffd700; outline:none; }
    #inv-preview-label { font-size:11px; color:#888; text-align:center; padding:6px 8px; min-height:32px; }
  `;
  document.head.appendChild(style);

  overlay = document.createElement('div');
  overlay.id = 'inv-overlay';
  overlay.style.cssText = `
    display:none; position:fixed; inset:0; background:rgba(0,0,0,0.72);
    z-index:300; backdrop-filter:blur(4px);
    align-items:center; justify-content:center;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background:rgba(14,14,24,0.97); border:1px solid #444; border-radius:12px;
    padding:20px 24px; width:min(97vw,1040px); max-height:88vh;
    display:flex; flex-direction:column; gap:10px; overflow:hidden;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; align-items:center; gap:12px; flex-wrap:wrap;';
  header.innerHTML = `
    <h3 style="color:#ffd700;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0;flex:1">📦 Inventaire</h3>
    <span id="inv-count" style="color:#888;font-size:12px"></span>
    <input id="inv-search" placeholder="Rechercher…" style="
      background:rgba(255,255,255,0.08);border:1px solid #555;border-radius:6px;
      color:#fff;font-size:12px;padding:4px 10px;width:160px;">
    <button id="inv-close" style="background:none;border:none;color:#888;font-size:22px;cursor:pointer;padding:2px 8px;">×</button>
  `;

  // Category filters
  const filters = document.createElement('div');
  filters.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.style.cssText = `
      background:rgba(255,255,255,0.06);border:1px solid #444;border-radius:6px;
      color:#ccc;font-size:11px;padding:3px 10px;cursor:pointer;
    `;
    if (cat.id === 'all') {
      btn.style.background = 'rgba(255,215,0,0.18)';
      btn.style.borderColor = '#ffd700';
      btn.style.color = '#ffd700';
    }
    filters.appendChild(btn);
  });

  // Body: table (left) + preview (right)
  const body = document.createElement('div');
  body.style.cssText = 'display:flex; gap:16px; overflow:hidden; flex:1; min-height:0;';

  const tableWrap = document.createElement('div');
  tableWrap.style.cssText = 'overflow-y:auto; flex:1; min-width:0;';
  tableWrap.innerHTML = `
    <table id="inv-table" style="width:100%;border-collapse:collapse;font-size:12px;color:#ddd;">
      <thead>
        <tr style="background:rgba(255,255,255,0.05);text-align:left;font-size:11px;color:#aaa;
                   text-transform:uppercase;position:sticky;top:0;z-index:1;">
          <th style="padding:6px 8px">Nom</th>
          <th style="padding:6px 8px;white-space:nowrap">Marque</th>
          <th style="padding:6px 8px;text-align:center">Qté</th>
          <th style="padding:6px 8px;text-align:center;white-space:nowrap">L × P × H</th>
          <th style="padding:6px 8px;text-align:center">Position</th>
          <th style="padding:6px 8px">Notes</th>
        </tr>
      </thead>
      <tbody id="inv-tbody"></tbody>
    </table>
  `;

  const previewPanel = document.createElement('div');
  previewPanel.style.cssText = `
    width:280px; min-width:280px; display:flex; flex-direction:column;
    background:#111118; border-radius:8px; border:1px solid #333; overflow:hidden;
  `;
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width  = 280;
  previewCanvas.height = 300;
  previewCanvas.style.cssText = 'width:280px; height:300px; display:block;';
  const previewLabel = document.createElement('div');
  previewLabel.id = 'inv-preview-label';
  previewLabel.textContent = 'Clique sur un objet';
  previewPanel.append(previewCanvas, previewLabel);

  body.append(tableWrap, previewPanel);
  modal.append(header, filters, body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Preview (lazy init after first open so canvas is in DOM)
  let preview = null;
  function getPreview() {
    if (!preview) preview = createPreview(previewCanvas, mainScene);
    return preview;
  }

  function onSelectItem(item) {
    previewLabel.innerHTML = `<strong style="color:#fff">${item.name}</strong>
      <span style="color:#666;margin-left:6px">${dimsStr(item.dims)}</span>`;
    getPreview().loadItem(item);
  }

  let activeCat = 'all';
  let searchVal  = '';

  function getFiltered() {
    const q = searchVal.trim().toLowerCase();
    return INVENTORY.filter(i => {
      if (activeCat !== 'all' && i.category !== activeCat) return false;
      if (q && !i.name.toLowerCase().includes(q) &&
               !i.brand.toLowerCase().includes(q) &&
               !(i.notes || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function refresh() {
    const items = getFiltered();
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    overlay.querySelector('#inv-count').textContent = `${items.length} objets · ${totalQty} pièces`;
    renderTable(overlay.querySelector('#inv-tbody'), items, onSelectItem);
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  modal.querySelector('#inv-close').addEventListener('click', close);
  modal.querySelector('#inv-search').addEventListener('input', e => {
    searchVal = e.target.value; refresh();
  });
  filters.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    activeCat = btn.dataset.cat;
    filters.querySelectorAll('[data-cat]').forEach(b => {
      const on = b.dataset.cat === activeCat;
      b.style.background  = on ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.06)';
      b.style.borderColor = on ? '#ffd700' : '#444';
      b.style.color       = on ? '#ffd700' : '#ccc';
    });
    refresh();
  });

  function close() { overlay.style.display = 'none'; preview?.stop(); }

  refresh();

  return function openInventory() {
    overlay.style.display = 'flex';
    getPreview().start();
  };
}
