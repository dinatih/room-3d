// =============================================
// INVENTORY PANEL — overlay modal + 3D preview (R3F)
// =============================================
import { INVENTORY, CATEGORIES, STORAGE_SPACES } from './inventoryData.js';
import { getHoverAction } from './hoverMenu.js';
import { mountPreview, unmountPreview } from '../lib/inventoryPreview.js';

let overlay = null;

function fmt(n) { return Number.isFinite(n) ? n : '—'; }
function dimsStr(d) { return `${fmt(d.w)} × ${fmt(d.d)} × ${fmt(d.h)} cm`; }
function posStr(p)  { return `X${fmt(p.x)}  Z${fmt(p.z)}`; }

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

export function buildInventory(_mainScene) {
  const style = document.createElement('style');
  style.textContent = `
    #inv-table tbody tr, #inv-spaces-table tbody tr { cursor:pointer; }
    #inv-table tbody tr:nth-child(even), #inv-spaces-table tbody tr:nth-child(even) { background:rgba(255,255,255,0.03); }
    #inv-table tbody tr:hover, #inv-spaces-table tbody tr:hover                     { background:rgba(255,215,0,0.07); }
    #inv-table tbody tr.selected, #inv-spaces-table tbody tr.selected               { background:rgba(255,215,0,0.15) !important; }
    #inv-table tbody td, #inv-spaces-table tbody td { padding:5px 8px; border-bottom:1px solid rgba(255,255,255,0.05); }
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
    <div id="inv-spaces-section" style="display:none;">
      <div style="font-size:11px;color:#ffd700;text-transform:uppercase;letter-spacing:1px;
                  padding:8px 0 6px;font-weight:bold">Espaces de rangement</div>
      <table id="inv-spaces-table" style="width:100%;border-collapse:collapse;font-size:12px;color:#ddd;margin-bottom:16px;">
        <thead>
          <tr style="background:rgba(255,255,255,0.05);text-align:left;font-size:11px;color:#aaa;
                     text-transform:uppercase;position:sticky;top:0;z-index:1;">
            <th style="padding:6px 8px">Nom</th>
            <th style="padding:6px 8px;text-align:center">Position</th>
            <th style="padding:6px 8px">Description</th>
          </tr>
        </thead>
        <tbody id="inv-spaces-tbody"></tbody>
      </table>
      <div style="font-size:11px;color:#ffd700;text-transform:uppercase;letter-spacing:1px;
                  padding:4px 0 6px;font-weight:bold">Objets</div>
    </div>
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
    width:280px; min-width:280px; height:370px;
    background:#111118; border-radius:8px; border:1px solid #333; overflow:hidden;
  `;

  body.append(tableWrap, previewPanel);
  modal.append(header, filters, body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function onSelectItem(item) {
    // Callback : synchronise aussi la scène principale quand un bouton est cliqué
    const onAction = (actionId) => getHoverAction(actionId)?.execute();
    mountPreview(previewPanel, item, onAction);
  }

  let activeCat = 'all';
  let searchVal  = '';

  function getFiltered() {
    const q = searchVal.trim().toLowerCase();
    return INVENTORY.filter(i => {
      if (activeCat === 'actionnable' && !i.actions?.length) return false;
      if (activeCat !== 'all' && activeCat !== 'actionnable' && i.category !== activeCat) return false;
      if (q && !i.name.toLowerCase().includes(q) &&
               !i.brand.toLowerCase().includes(q) &&
               !(i.notes || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderSpacesTable(tbody, spaces, onSelect) {
    tbody.innerHTML = '';
    spaces.forEach(sp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:500">${sp.name}</td>
        <td style="text-align:center;font-family:monospace;font-size:10px;color:#aaa">${posStr(sp.scenePos)}</td>
        <td style="color:#aaa;font-size:11px">${sp.notes || ''}</td>
      `;
      tr.addEventListener('click', () => {
        tbody.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        onSelect(sp);
      });
      tbody.appendChild(tr);
    });
  }

  function refresh() {
    const items = getFiltered();
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    overlay.querySelector('#inv-count').textContent = `${items.length} objets · ${totalQty} pièces`;
    renderTable(overlay.querySelector('#inv-tbody'), items, onSelectItem);

    const spacesSection = overlay.querySelector('#inv-spaces-section');
    const actionSpaces = STORAGE_SPACES.filter(sp => sp.actions?.length);
    if (activeCat === 'storage') {
      spacesSection.style.display = '';
      renderSpacesTable(overlay.querySelector('#inv-spaces-tbody'), STORAGE_SPACES, onSelectItem);
    } else if (activeCat === 'actionnable' && actionSpaces.length) {
      spacesSection.style.display = '';
      renderSpacesTable(overlay.querySelector('#inv-spaces-tbody'), actionSpaces, onSelectItem);
    } else {
      spacesSection.style.display = 'none';
    }
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
    tableWrap.scrollTop = 0;
    refresh();
  });

  function close() {
    overlay.style.display = 'none';
    unmountPreview(previewPanel);
  }

  refresh();

  return function openInventory() {
    overlay.style.display = 'flex';
    mountPreview(previewPanel, null);  // initialise le canvas R3F à l'état vide
  };
}
