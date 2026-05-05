/**
 * Inventory.tsx — port de js/ui/inventory.js
 */
import React, { useState, useMemo } from 'react';
import { INVENTORY, CATEGORIES, STORAGE_SPACES, type InventoryItem, type StorageSpace } from './inventoryData';
import { InventoryPreview } from './InventoryPreview';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | undefined) { return Number.isFinite(n) ? n : '—'; }
function dimsStr(d: { w: number; d: number; h: number }) { return `${fmt(d.w)} × ${fmt(d.d)} × ${fmt(d.h)}`; }

type PreviewTarget = InventoryItem | StorageSpace | null;

// ── Styles ────────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.72)',
  zIndex: 500,
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const modalStyle: React.CSSProperties = {
  background: 'rgba(14,14,24,0.97)',
  border: '1px solid #444',
  borderRadius: 12,
  padding: '20px 24px',
  width: 'min(97vw, 1100px)',
  maxHeight: '88vh',
  display: 'flex', flexDirection: 'column', gap: 10,
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: 'rgba(255,255,255,0.05)',
  textAlign: 'left',
  fontSize: 11, color: '#aaa',
  textTransform: 'uppercase',
  position: 'sticky', top: 0, zIndex: 1,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

// ── Storage table ─────────────────────────────────────────────────────────────

function StorageTable({ spaces, selected, onSelect }: {
  spaces: StorageSpace[];
  selected: PreviewTarget;
  onSelect: (sp: StorageSpace) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 11, color: '#ffd700', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 0 6px', fontWeight: 'bold' }}>
        Espaces de rangement
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#ddd', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={thStyle}>Nom</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          {spaces.map(sp => (
            <tr
              key={sp.id}
              onClick={() => onSelect(sp)}
              style={{ cursor: 'pointer', background: selected && 'id' in selected && selected.id === sp.id ? 'rgba(255,215,0,0.15)' : undefined }}
            >
              <td style={tdStyle}><strong>{sp.name}</strong></td>
              <td style={{ ...tdStyle, color: '#aaa', fontSize: 11 }}>{sp.notes ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: '#ffd700', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 0 6px', fontWeight: 'bold' }}>
        Objets
      </div>
    </>
  );
}

// ── Item table ────────────────────────────────────────────────────────────────

function ItemTable({ items, selected, onSelect }: {
  items: InventoryItem[];
  selected: PreviewTarget;
  onSelect: (item: InventoryItem) => void;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#ddd' }}>
      <thead>
        <tr>
          <th style={thStyle}>Nom</th>
          <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>Marque</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Qté</th>
          <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>L × P × H</th>
          <th style={thStyle}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => {
          const isSelected = selected && 'id' in selected && selected.id === item.id;
          return (
            <tr
              key={item.id}
              onClick={() => onSelect(item)}
              style={{
                cursor: 'pointer',
                background: isSelected
                  ? 'rgba(255,215,0,0.15)'
                  : i % 2 === 1 ? 'rgba(255,255,255,0.03)' : undefined,
              }}
            >
              <td style={tdStyle}>{item.name}</td>
              <td style={tdStyle}>{item.brand || '—'}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}</td>
              <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{dimsStr(item.dims)}</td>
              <td style={{ ...tdStyle, color: '#aaa', fontSize: 11 }}>{item.notes ?? ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Inventory({ onClose }: { onClose: () => void }) {
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<PreviewTarget>(null);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INVENTORY.filter(i => {
      if (activeCat === 'actionnable' && !i.actions?.length) return false;
      if (activeCat === 'glbs'        && !i.glbPath)         return false;
      if (activeCat !== 'all' && activeCat !== 'actionnable' && activeCat !== 'glbs' && i.category !== activeCat) return false;
      if (q && !i.name.toLowerCase().includes(q) &&
               !i.brand.toLowerCase().includes(q) &&
               !(i.notes ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCat, search]);

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const showSpaces = activeCat === 'storage' || activeCat === 'actionnable';
  const spaces = activeCat === 'actionnable'
    ? STORAGE_SPACES.filter(sp => sp.actions?.length)
    : STORAGE_SPACES;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ color: '#ffd700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, margin: 0, flex: 1 }}>
            📦 Inventaire
          </h3>
          <span style={{ color: '#888', fontSize: 12 }}>{items.length} objets · {totalQty} pièces</span>
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid #555', borderRadius: 6,
              color: '#fff', fontSize: 12, padding: '4px 10px', width: 160,
            }}
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: 22, cursor: 'pointer', padding: '2px 8px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const on = cat.id === activeCat;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                style={{
                  background: on ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${on ? '#ffd700' : '#444'}`,
                  borderRadius: 6,
                  color: on ? '#ffd700' : '#ccc',
                  fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Body: table (left) + preview (right) */}
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden', flex: 1, minHeight: 0 }}>

          {/* Table */}
          <div style={{ overflowY: 'auto', flex: 1, minWidth: 0 }}>
            {showSpaces && spaces.length > 0 && (
              <StorageTable spaces={spaces} selected={selected} onSelect={setSelected} />
            )}
            <ItemTable items={items} selected={selected} onSelect={setSelected} />
          </div>

          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
            <InventoryPreview item={selected} />
          </div>

        </div>
      </div>
    </div>
  );
}
