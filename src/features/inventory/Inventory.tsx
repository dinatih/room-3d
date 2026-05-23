/**
 * Inventory.tsx — port de js/ui/inventory.js
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { INVENTORY, CATEGORIES, STORAGE_SPACES, type InventoryItem, type StorageSpace } from './inventoryData';
import { InventoryPreview } from './InventoryPreview';
import { useIsMobile } from '@shared/hooks/useIsMobile';

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

function modalStyleFor(mobile: boolean): React.CSSProperties {
  return {
    background: 'rgba(14,14,24,0.97)',
    border: '1px solid #444',
    borderRadius: mobile ? 0 : 12,
    padding: mobile ? '10px 10px' : '20px 24px',
    width: mobile ? '100vw' : 'min(97vw, 1100px)',
    height: mobile ? '100vh' : undefined,
    maxHeight: mobile ? '100vh' : '88vh',
    display: 'flex', flexDirection: 'column', gap: 10,
    overflow: 'hidden',
  };
}

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

function StorageTable({ spaces, selected, onSelect, focusedId }: {
  spaces: StorageSpace[];
  selected: PreviewTarget;
  onSelect: (sp: StorageSpace) => void;
  focusedId: string | null;
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
          {spaces.map(sp => {
            const isSelected = selected && 'id' in selected && selected.id === sp.id;
            const isFocused  = focusedId === sp.id;
            return (
              <tr
                key={sp.id}
                data-item-id={sp.id}
                onClick={() => onSelect(sp)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255,215,0,0.15)' : undefined,
                  outline: isFocused ? '1px solid rgba(255,215,0,0.6)' : undefined,
                  outlineOffset: isFocused ? '-1px' : undefined,
                }}
              >
                <td style={tdStyle}><strong>{sp.name}</strong></td>
                <td style={{ ...tdStyle, color: '#aaa', fontSize: 11 }}>{sp.notes ?? ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: '#ffd700', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 0 6px', fontWeight: 'bold' }}>
        Objets
      </div>
    </>
  );
}

// ── Item table ────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  hebdo: '📅 Hebdo',
  mensuel: '📅 Mensuel',
  trimestriel: '📅 Trimestre',
  annuel: '📅 Annuel',
};

function ItemTable({ items, selected, onSelect, consumableView, focusedId }: {
  items: InventoryItem[];
  selected: PreviewTarget;
  onSelect: (item: InventoryItem) => void;
  consumableView?: boolean;
  focusedId: string | null;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#ddd' }}>
      <thead>
        <tr>
          <th style={thStyle}>Nom</th>
          {consumableView ? (
            <>
              <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>Stock</th>
              <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>Fréquence</th>
              <th style={thStyle}>Stockage</th>
              <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>L × P × H</th>
              <th style={thStyle}>Notes</th>
            </>
          ) : (
            <>
              <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>Marque</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Qté</th>
              <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>L × P × H</th>
              <th style={thStyle}>Notes</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => {
          const isSelected = selected && 'id' in selected && selected.id === item.id;
          const isFocused  = focusedId === item.id;
          return (
            <tr
              key={item.id}
              data-item-id={item.id}
              onClick={() => onSelect(item)}
              style={{
                cursor: 'pointer',
                background: isSelected
                  ? 'rgba(255,215,0,0.15)'
                  : i % 2 === 1 ? 'rgba(255,255,255,0.03)' : undefined,
                outline: isFocused ? '1px solid rgba(255,215,0,0.6)' : undefined,
                outlineOffset: isFocused ? '-1px' : undefined,
              }}
            >
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.photos?.[0] && (
                    <img src={item.photos[0]} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0, background: '#eee' }} />
                  )}
                  {item.name}
                </div>
              </td>
              {consumableView ? (
                <>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{item.stock ?? '—'}</td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>{item.frequency ? FREQ_LABEL[item.frequency] : '—'}</td>
                  <td style={{ ...tdStyle, color: '#aaa', fontSize: 11 }}>{item.location ?? '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{dimsStr(item.dims)}</td>
                  <td style={{ ...tdStyle, color: '#aaa', fontSize: 11 }}>{item.notes ?? ''}</td>
                </>
              ) : (
                <>
                  <td style={tdStyle}>{item.brand || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{dimsStr(item.dims)}</td>
                  <td style={{ ...tdStyle, color: '#aaa', fontSize: 11 }}>{item.notes ?? ''}</td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Inventory({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile();
  const [activeCat, setActiveCat]     = useState('all');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<PreviewTarget>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const tableContainerRef             = useRef<HTMLDivElement>(null);

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

  // Unified nav list: spaces first, then items
  const navList = useMemo<PreviewTarget[]>(() => [
    ...(showSpaces ? spaces : []),
    ...items,
  ], [showSpaces, spaces, items]);

  // Reset focus when list changes
  useEffect(() => { setFocusedIndex(-1); }, [navList]);

  // Scroll focused row into view
  const focusedId = focusedIndex >= 0 ? (navList[focusedIndex] as any)?.id ?? null : null;
  useEffect(() => {
    if (!focusedId || !tableContainerRef.current) return;
    const tr = tableContainerRef.current.querySelector(`tr[data-item-id="${focusedId}"]`);
    tr?.scrollIntoView({ block: 'nearest' });
  }, [focusedId]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, navList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const target = navList[focusedIndex];
        if (target) setSelected(target);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navList, focusedIndex]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyleFor(isMobile), position: 'relative' }} onClick={e => e.stopPropagation()}>

        {/* Bouton fermer — toujours en haut à droite, surtout pour mobile plein-écran */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: isMobile ? 6 : 10,
            right: isMobile ? 6 : 12,
            background: isMobile ? 'rgba(255,255,255,0.10)' : 'transparent',
            border: isMobile ? '1px solid rgba(255,255,255,0.20)' : 'none',
            borderRadius: isMobile ? '50%' : 4,
            color: '#ddd',
            fontSize: isMobile ? 26 : 22,
            width: isMobile ? 44 : 32,
            height: isMobile ? 44 : 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', lineHeight: 1, padding: 0,
            zIndex: 10,
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: isMobile ? 8 : 12,
          flexWrap: 'wrap',
          paddingRight: isMobile ? 56 : 40,
        }}>
          <h3 style={{ color: '#ffd700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, margin: 0, flex: '0 0 auto' }}>
            📦 Inventaire
          </h3>
          {!isMobile && (
            <span style={{ color: '#888', fontSize: 12 }}>{items.length} objets · {totalQty} pièces</span>
          )}
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid #555', borderRadius: 6,
              color: '#fff',
              fontSize: isMobile ? 14 : 12,
              padding: isMobile ? '8px 12px' : '4px 10px',
              minHeight: isMobile ? 40 : undefined,
              width: isMobile ? '100%' : 160,
              flex: isMobile ? '1 1 100%' : '0 0 auto',
            }}
          />
          {isMobile && (
            <span style={{ color: '#888', fontSize: 11 }}>{items.length} objets · {totalQty} pièces</span>
          )}
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
                  fontSize: isMobile ? 13 : 11,
                  padding: isMobile ? '8px 14px' : '3px 10px',
                  minHeight: isMobile ? 36 : undefined,
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Body: table (left) + preview (right) — empilé verticalement sur mobile */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 8 : 16,
          overflow: 'hidden', flex: 1, minHeight: 0,
        }}>

          {/* Preview — affichée en haut sur mobile, à droite sur desktop, seulement si sélection */}
          {isMobile && selected && (
            <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <InventoryPreview item={selected} />
            </div>
          )}

          {/* Table */}
          <div ref={tableContainerRef} style={{ overflowY: 'auto', flex: 1, minWidth: 0 }}>
            {showSpaces && spaces.length > 0 && (
              <StorageTable spaces={spaces} selected={selected} onSelect={setSelected} focusedId={focusedId} />
            )}
            <ItemTable items={items} selected={selected} onSelect={setSelected} consumableView={activeCat === 'consumable'} focusedId={focusedId} />
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
              <InventoryPreview item={selected} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
