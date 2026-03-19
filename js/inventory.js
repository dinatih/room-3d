// =============================================
// INVENTORY PANEL — overlay modal
// =============================================
import { INVENTORY, CATEGORIES } from './inventoryData.js';

let overlay = null;

function fmt(n) { return Number.isFinite(n) ? n : '—'; }
function dimsStr(d) { return `${fmt(d.w)} × ${fmt(d.d)} × ${fmt(d.h)}`; }
function posStr(p)  { return `X${fmt(p.x)} Z${fmt(p.z)}`; }

function totalItems() {
  return INVENTORY.reduce((s, i) => s + i.qty, 0);
}

function render(filterCat, search) {
  const q = search.trim().toLowerCase();
  const items = INVENTORY.filter(i => {
    if (filterCat !== 'all' && i.category !== filterCat) return false;
    if (q && !i.name.toLowerCase().includes(q) &&
             !i.brand.toLowerCase().includes(q) &&
             !(i.notes || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const tbody = overlay.querySelector('#inv-tbody');
  tbody.innerHTML = items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.brand || '—'}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:center;font-family:monospace">${dimsStr(i.dims)}</td>
      <td style="text-align:center;font-family:monospace;font-size:10px">${posStr(i.scenePos)}</td>
      <td style="color:#aaa;font-size:11px">${i.notes || ''}</td>
    </tr>
  `).join('');

  overlay.querySelector('#inv-count').textContent =
    `${items.length} objets · ${totalQty} pièces`;
}

export function buildInventory() {
  // ── Overlay
  overlay = document.createElement('div');
  overlay.id = 'inv-overlay';
  overlay.style.cssText = `
    display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7);
    z-index:300; backdrop-filter:blur(4px);
    align-items:center; justify-content:center;
  `;

  // ── Modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background:rgba(14,14,24,0.97); border:1px solid #444; border-radius:12px;
    padding:20px 24px; width:min(96vw,900px); max-height:85vh;
    display:flex; flex-direction:column; gap:12px; overflow:hidden;
  `;

  // ── Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; align-items:center; gap:12px; flex-wrap:wrap;';
  header.innerHTML = `
    <h3 style="color:#ffd700;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0;flex:1">
      📦 Inventaire
    </h3>
    <span id="inv-count" style="color:#888;font-size:12px"></span>
    <input id="inv-search" placeholder="Rechercher…" style="
      background:rgba(255,255,255,0.08); border:1px solid #555; border-radius:6px;
      color:#fff; font-size:12px; padding:4px 10px; width:160px; outline:none;
    ">
    <button id="inv-close" style="
      background:none; border:none; color:#888; font-size:20px; cursor:pointer; padding:2px 6px;
    ">×</button>
  `;

  // ── Category filters
  const filters = document.createElement('div');
  filters.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.style.cssText = `
      background:rgba(255,255,255,0.06); border:1px solid #444; border-radius:6px;
      color:#ccc; font-size:11px; padding:3px 10px; cursor:pointer;
    `;
    if (cat.id === 'all') {
      btn.style.background = 'rgba(255,215,0,0.18)';
      btn.style.borderColor = '#ffd700';
      btn.style.color = '#ffd700';
    }
    filters.appendChild(btn);
  });

  // ── Table
  const tableWrap = document.createElement('div');
  tableWrap.style.cssText = 'overflow-y:auto; flex:1;';
  tableWrap.innerHTML = `
    <table id="inv-table" style="width:100%; border-collapse:collapse; font-size:12px; color:#ddd;">
      <thead>
        <tr style="background:rgba(255,255,255,0.05); text-align:left; font-size:11px; color:#aaa; text-transform:uppercase;">
          <th style="padding:6px 8px; white-space:nowrap">Nom</th>
          <th style="padding:6px 8px; white-space:nowrap">Marque</th>
          <th style="padding:6px 8px; white-space:nowrap; text-align:center">Qté</th>
          <th style="padding:6px 8px; white-space:nowrap; text-align:center">L × P × H (cm)</th>
          <th style="padding:6px 8px; white-space:nowrap; text-align:center">Position</th>
          <th style="padding:6px 8px">Notes</th>
        </tr>
      </thead>
      <tbody id="inv-tbody"></tbody>
    </table>
  `;

  // ── Zebra + hover via stylesheet
  const style = document.createElement('style');
  style.textContent = `
    #inv-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.03); }
    #inv-table tbody tr:hover           { background: rgba(255,215,0,0.08); }
    #inv-table tbody td                 { padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    #inv-search:focus { border-color: #ffd700; }
  `;
  document.head.appendChild(style);

  modal.append(header, filters, tableWrap);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // ── State
  let activeCat = 'all';
  let searchVal = '';

  function refresh() { render(activeCat, searchVal); }

  // ── Events
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  modal.querySelector('#inv-close').addEventListener('click', close);
  modal.querySelector('#inv-search').addEventListener('input', e => {
    searchVal = e.target.value;
    refresh();
  });
  filters.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    activeCat = btn.dataset.cat;
    filters.querySelectorAll('[data-cat]').forEach(b => {
      const active = b.dataset.cat === activeCat;
      b.style.background  = active ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.06)';
      b.style.borderColor = active ? '#ffd700' : '#444';
      b.style.color       = active ? '#ffd700' : '#ccc';
    });
    refresh();
  });

  function close() { overlay.style.display = 'none'; }

  refresh();

  // ── Public open
  return function openInventory() {
    overlay.style.display = 'flex';
  };
}
