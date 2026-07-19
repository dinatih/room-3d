/**
 * Inventory.tsx — port de js/ui/inventory.js
 * Styled using Bootstrap 5.3, custom red theme variables and fully responsive.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { INVENTORY, CATEGORIES, STORAGE_SPACES, type InventoryItem, type StorageSpace } from './inventoryData';
import { InventoryPreview } from './InventoryPreview';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type PreviewTarget = InventoryItem | StorageSpace | null;

// Helper to determine the category icon/emoji
function getCategoryEmoji(cat: string): string {
  switch (cat) {
    case 'storage': return '📦';
    case 'furniture': return '🛋️';
    case 'tech': return '💻';
    case 'kitchen': return '🍳';
    case 'bathroom': return '🛁';
    case 'clothing': return '👕';
    case 'decor': return '🪴';
    case 'consumable': return '🛒';
    case 'walkers': return '🚶';
    case 'doors': return '🚪';
    case 'glbs': return '🎲';
    default: return '📦';
  }
}

// ── Detail Pane Content Component ─────────────────────────────────────────────

function ItemDetailContent({ item }: { item: PreviewTarget }) {
  if (!item) return null;

  const isStorage = !('category' in item); // Storage spaces don't have a category field

  const catLabel = !isStorage 
    ? CATEGORIES.find(c => c.id === (item as InventoryItem).category)?.label ?? (item as InventoryItem).category 
    : 'Rangement';

  const dimsStr = `${item.dims.w} × ${item.dims.d} × ${item.dims.h} cm`;

  return (
    <div className="inventory-detail-wrap">
      {/* 3D Preview Canvas / Photo Gallery as Hero */}
      <div className="inventory-detail-hero">
        <InventoryPreview item={item} height={300} hideFooter={true} />
      </div>

      <div className="inventory-detail-body">
        <h2 className="inventory-detail-title">{item.name}</h2>
        <p className="inventory-detail-brand">
          {!isStorage && (item as InventoryItem).brand ? `${(item as InventoryItem).brand} — ` : ''}
          {isStorage ? 'Espace de rangement' : catLabel}
        </p>

        <div className="inventory-detail-badges">
          {isStorage ? (
            <span className="inventory-badge-tag inventory-badge-virt" style={{ fontSize: 11, padding: '3px 9px' }}>
              🗄️ Rangement
            </span>
          ) : (item as InventoryItem).category === 'walkers' ? (
            <span className="inventory-badge-tag inventory-badge-virt" style={{ fontSize: 11, padding: '3px 9px' }}>
              🔵 Virtuel
            </span>
          ) : (
            <span className="inventory-badge-tag" style={{ fontSize: 11, padding: '3px 9px', background: '#e8f5e9', color: '#2e7d32' }}>
              🟢 Physique
            </span>
          )}

          {!isStorage && (item as InventoryItem).actions && (item as InventoryItem).actions!.length > 0 && (
            <span className="inventory-badge-tag" style={{ fontSize: 11, padding: '3px 9px', background: '#fff3cd', color: '#856404' }}>
              ⚡ Actionnable
            </span>
          )}

          {!isStorage && (
            <span className="inventory-badge-tag inventory-badge-red" style={{ fontSize: 11, padding: '3px 9px' }}>
              {catLabel}
            </span>
          )}
        </div>

        <div className="inventory-spec-grid">
          <div className="inventory-spec-card">
            <div className="inventory-spec-label">
              {!isStorage && (item as InventoryItem).category === 'consumable' ? 'Stock restant' : 'Quantité'}
            </div>
            <div className="inventory-spec-value inventory-spec-value-accent" style={{ color: 'var(--red)', fontWeight: 'bold' }}>
              {!isStorage && (item as InventoryItem).category === 'consumable' 
                ? `${(item as InventoryItem).stock ?? 0} pièces` 
                : isStorage 
                  ? '1 espace' 
                  : `×${(item as InventoryItem).qty}`}
            </div>
          </div>
          <div className="inventory-spec-card">
            <div className="inventory-spec-label">Dimensions (L×P×H)</div>
            <div className="inventory-spec-value">
              {dimsStr}
            </div>
          </div>

          {!isStorage && (item as InventoryItem).category === 'consumable' && (
            <>
              <div className="inventory-spec-card">
                <div className="inventory-spec-label">Fréquence de rachat</div>
                <div className="inventory-spec-value" style={{ textTransform: 'capitalize' }}>
                  {(item as InventoryItem).frequency ?? '—'}
                </div>
              </div>
              <div className="inventory-spec-card">
                <div className="inventory-spec-label">Lieu de stockage</div>
                <div className="inventory-spec-value">
                  {(item as InventoryItem).location ?? '—'}
                </div>
              </div>
            </>
          )}

          {!isStorage && (item as InventoryItem).url && (
            <div className="inventory-spec-card" style={{ gridColumn: '1 / -1' }}>
              <div className="inventory-spec-label">Lien Produit</div>
              <div className="inventory-spec-value">
                <a 
                  href={(item as InventoryItem).url} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={e => e.stopPropagation()}
                  style={{ color: 'var(--red)', textDecoration: 'none' }}
                >
                  🔗 Ouvrir la fiche produit
                </a>
              </div>
            </div>
          )}
        </div>

        <hr className="inventory-detail-divider" />
        <div className="inventory-detail-section-label">Notes & Description</div>
        <div className="inventory-detail-notes">
          {item.notes || "Aucune note descriptive disponible pour cet élément."}
        </div>

        <div className="inventory-detail-actions mt-3">
          <button className="inventory-btn-edit" onClick={() => alert(`Modifier : ${item.name}`)}>✏️ Modifier</button>
          <button className="inventory-btn-delete" onClick={() => { if(confirm(`Supprimer ${item.name} ?`)) alert('Supprimé (démo)'); }}>🗑 Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Inventory Component ──────────────────────────────────────────────────

export function Inventory({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile();
  const [activeCat, setActiveCat]         = useState('all');
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState<PreviewTarget>(null);
  const [focusedIndex, setFocusedIndex]   = useState(-1);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const tableContainerRef                 = useRef<HTMLDivElement>(null);

  // Filter items list
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

  const showSpaces = activeCat === 'storage' || activeCat === 'actionnable';
  const spaces = activeCat === 'actionnable'
    ? STORAGE_SPACES.filter(sp => sp.actions?.length)
    : STORAGE_SPACES;

  // Unified list: storage spaces first, then items
  const navList = useMemo<PreviewTarget[]>(() => [
    ...(showSpaces ? spaces : []),
    ...items,
  ], [showSpaces, spaces, items]);

  // Reset focus on list update
  useEffect(() => { setFocusedIndex(-1); }, [navList]);

  // Auto-select first item on desktop startup
  useEffect(() => {
    if (!isMobile && !selected && navList.length > 0) {
      setSelected(navList[0]);
    }
  }, [isMobile, navList, selected]);

  // Scroll focused row into view
  const focusedId = focusedIndex >= 0 ? (navList[focusedIndex] as any)?.id ?? null : null;
  useEffect(() => {
    if (!focusedId || !tableContainerRef.current) return;
    const rowEl = tableContainerRef.current.querySelector(`div[data-item-id="${focusedId}"]`);
    rowEl?.scrollIntoView({ block: 'nearest' });
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
        if (target) {
          setSelected(target);
          if (isMobile) {
            setShowMobileModal(true);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navList, focusedIndex, isMobile]);

  return (
    <div
      className="inventory-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="inventory-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* TOPBAR */}
        <div className="inventory-topbar">
          <div className="inventory-topbar-brand">
            <div className="inventory-brand-dot"></div>
            Inventaire
          </div>
          <div className="inventory-topbar-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un item…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="inventory-topbar-actions">
            <span className="inventory-topbar-count">
              {navList.length} item{navList.length > 1 ? 's' : ''}
            </span>
            <button className="inventory-btn-close" onClick={onClose} aria-label="Fermer">
              ×
            </button>
          </div>
        </div>

        {/* LAYOUT SPLIT */}
        <div className="inventory-layout">
          {/* LIST PANE */}
          <div className="inventory-pane-list">
            <div className="inventory-list-header">
              <span className="inventory-list-header-title">Tous les items</span>
              <div className="inventory-filter-tabs">
                {CATEGORIES.map(cat => {
                  const isActive = cat.id === activeCat;
                  return (
                    <button
                      key={cat.id}
                      className={`inventory-ftab${isActive ? ' active' : ''}`}
                      onClick={() => setActiveCat(cat.id)}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div ref={tableContainerRef} className="inventory-list-content">
              {navList.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Aucun item trouvé.
                </div>
              ) : (
                navList.map(target => {
                  if (!target) return null;
                  const isStorage = !('category' in target);
                  const id = target.id;
                  const isSelected = selected && selected.id === id;
                  const isFocused  = focusedId === id;

                  const catLabel = !isStorage 
                    ? CATEGORIES.find(c => c.id === (target as InventoryItem).category)?.label ?? (target as InventoryItem).category 
                    : 'Rangement';

                  const thumbPhoto = !isStorage ? (target as InventoryItem).photos?.[0] : undefined;
                  const emoji = getCategoryEmoji(isStorage ? 'storage' : (target as InventoryItem).category);

                  return (
                    <div
                      key={id}
                      data-item-id={id}
                      className={`inventory-item-row${isSelected ? ' active' : ''}`}
                      onClick={() => {
                        setSelected(target);
                        if (isMobile) {
                          setShowMobileModal(true);
                        }
                      }}
                      style={{
                        outline: isFocused ? '1px solid var(--red)' : undefined,
                        outlineOffset: '-1px',
                      }}
                    >
                      <div className="inventory-item-thumb">
                        {thumbPhoto ? (
                          <img src={thumbPhoto} alt={target.name} />
                        ) : (
                          <span className="thumb-icon">{emoji}</span>
                        )}
                      </div>
                      <div className="inventory-item-meta">
                        <div className="inventory-item-name">{target.name}</div>
                        <div className="inventory-item-sub">
                          {!isStorage && (target as InventoryItem).brand && (
                            <>
                              <span>{(target as InventoryItem).brand}</span>
                              <span style={{ color: 'var(--border)' }}>·</span>
                            </>
                          )}
                          <span>{target.dims.w}×{target.dims.d}×{target.dims.h} cm</span>
                        </div>
                        <div className="inventory-item-badges">
                          {isStorage ? (
                            <span className="inventory-badge-tag inventory-badge-virt">Rangement</span>
                          ) : (target as InventoryItem).category === 'walkers' ? (
                            <span className="inventory-badge-tag inventory-badge-virt">Virtuel</span>
                          ) : (
                            <span className="inventory-badge-tag inventory-badge-red">{catLabel}</span>
                          )}
                          {!isStorage && (target as InventoryItem).actions && (target as InventoryItem).actions!.length > 0 && (
                            <span className="inventory-badge-tag" style={{ background: '#fff3cd', color: '#856404' }}>⚡ Action</span>
                          )}
                        </div>
                      </div>
                      <div className="inventory-item-qty">
                        {!isStorage && (target as InventoryItem).category === 'consumable' ? (
                          `×${(target as InventoryItem).stock ?? 0}`
                        ) : isStorage ? (
                          ''
                        ) : (
                          `×${(target as InventoryItem).qty}`
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DETAIL PANE (desktop) */}
          <div className="inventory-pane-detail">
            {!selected ? (
              <div className="inventory-detail-empty">
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                <p>Sélectionnez un item<br />pour afficher son détail</p>
              </div>
            ) : (
              <ItemDetailContent item={selected} />
            )}
          </div>
        </div>
      </div>

      {/* MODAL DETAIL (mobile) */}
      {showMobileModal && selected && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-fullscreen-sm-down modal-dialog-scrollable" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selected.name}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowMobileModal(false)}></button>
              </div>
              <div className="modal-body p-0" style={{ overflowY: 'auto' }}>
                <ItemDetailContent item={selected} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMobileModal(false)}>Fermer</button>
                <button type="button" className="btn btn-danger" onClick={() => alert(`Modifier : ${selected.name}`)}>✏️ Modifier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
