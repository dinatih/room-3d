/**
 * Inventory.tsx — port de js/ui/inventory.js
 * Styled using Bootstrap 5.3, custom red theme variables and fully responsive.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { INVENTORY, CATEGORIES, STORAGE_SPACES, type InventoryItem, type StorageSpace } from './inventoryData';
import { InventoryPreview } from './InventoryPreview';
import { SpatialZonePreview } from './SpatialZonePreview';
import { SpatialZoneManager, SpatialZone } from '@features/scene/ai/SpatialZone';
import { DUO_ANIMATIONS, type DuoAnimationDef } from '@features/scene/ai/duoAnimations';
import { CHARACTERS } from '@features/scene/walkerConfig';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type PreviewTarget = InventoryItem | StorageSpace | SpatialZone | null;

// Helper to determine the category icon/emoji
function getCategoryEmoji(cat: string): string {
  switch (cat) {
    case 'spaces': return '🏠';
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

  const [selectedDuoAnim, setSelectedDuoAnim] = useState<DuoAnimationDef | undefined>(undefined);
  const [selectedDuoPartner, setSelectedDuoPartner] = useState<string | undefined>(undefined);
  const [glbStats, setGlbStats] = useState<{ fileSize?: number; triangles: number; drawCalls: number } | null>(null);

  useEffect(() => {
    setSelectedDuoAnim(undefined);
    setSelectedDuoPartner(undefined);
    setGlbStats(null);
  }, [item?.id]);

  const isZone = item instanceof SpatialZone;
  const isStorage = !isZone && !('category' in item);

  if (isZone) {
    const zone = item as SpatialZone;
    const smartObjects = zone.getSmartObjects();
    const waypoints = zone.getWaypoints();
    const min = zone.bounds.min;
    const max = zone.bounds.max;
    const sizeStr = `${(max[0] - min[0]).toFixed(0)} × ${(max[2] - min[2]).toFixed(0)} × ${(max[1] - min[1]).toFixed(0)} cm`;

    return (
      <div className="inventory-detail-wrap">
        {/* Rendu 3D isolé de la pièce / espace sans obstruction */}
        <div className="inventory-detail-hero">
          <SpatialZonePreview zone={zone} height="100%" />
        </div>

        <div className="inventory-detail-body">
          <h2 className="inventory-detail-title">{zone.name}</h2>
          <p className="inventory-detail-brand">
            {zone.environment === 'indoor' ? 'Intérieur studio' : 'Espace extérieur'} — Zone Spatiale 3D
          </p>

          <div className="inventory-detail-badges">
            <span className="inventory-badge-tag inventory-badge-virt" style={{ fontSize: 11, padding: '3px 9px', background: '#0284c7', color: '#fff' }}>
              {zone.environment === 'indoor' ? '🏠 Pièce Intérieure' : '🌳 Extérieur'}
            </span>
            <span className="inventory-badge-tag" style={{ fontSize: 11, padding: '3px 9px', background: '#e0f2fe', color: '#0369a1' }}>
              ✨ {smartObjects.length} Smart Object{smartObjects.length > 1 ? 's' : ''}
            </span>
            <span className="inventory-badge-tag" style={{ fontSize: 11, padding: '3px 9px', background: '#f1f5f9', color: '#475569' }}>
              📍 {waypoints.length} Waypoint{waypoints.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="inventory-spec-grid">
            <div className="inventory-spec-card">
              <div className="inventory-spec-label">Volume Bounding Box (L×P×H)</div>
              <div className="inventory-spec-value">{sizeStr}</div>
            </div>
            <div className="inventory-spec-card">
              <div className="inventory-spec-label">SmartObjects interactifs</div>
              <div className="inventory-spec-value" style={{ color: 'var(--red)', fontWeight: 'bold' }}>
                {smartObjects.length} meuble{smartObjects.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <hr className="inventory-detail-divider" />
          <div className="inventory-detail-section-label">SmartObjects & Affordances dans cette pièce</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {smartObjects.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Aucun SmartObject indexé dans ce volume.</div>
            ) : (
              smartObjects.map(obj => (
                <div
                  key={obj.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>✨ {obj.name}</span>
                    <span style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                      {obj.category}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Slots : {obj.slots.map(s => s.name).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>

          <hr className="inventory-detail-divider" />
          <div className="inventory-detail-section-label">Points de Passage (Waypoints)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {waypoints.map(wp => (
              <span
                key={wp.id}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: '#334155'
                }}
              >
                📍 {wp.name || wp.id} ({wp.x.toFixed(0)}, {wp.z.toFixed(0)})
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const catLabel = !isStorage 
    ? CATEGORIES.find(c => c.id === (item as InventoryItem).category)?.label ?? (item as InventoryItem).category 
    : 'Rangement';

  const dimsStr = `${(item as any).dims.w} × ${(item as any).dims.d} × ${(item as any).dims.h} cm`;
  const glbPath = !isStorage ? (item as InventoryItem).glbPath : undefined;

  return (
    <div className="inventory-detail-wrap">
      {/* 3D Preview Canvas / Photo Gallery as Hero (Ratio Carré) */}
      <div className="inventory-detail-hero">
        <InventoryPreview
          item={item as any}
          height="100%"
          hideFooter={true}
          initialDuoAnim={selectedDuoAnim}
          initialDuoPartner={selectedDuoPartner}
          onGlbStats={setGlbStats}
        />
      </div>

      <div className="inventory-detail-body">
        <h2 className="inventory-detail-title">{(item as any).name}</h2>
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

          {glbPath && (
            <span className="inventory-badge-tag" style={{ fontSize: 11, padding: '3px 9px', background: '#f3e8ff', color: '#6b21a8' }}>
              🎲 Modèle GLB 3D
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

          {!isStorage && (item as InventoryItem).price && (
            <div className="inventory-spec-card">
              <div className="inventory-spec-label">Prix</div>
              <div className="inventory-spec-value" style={{ fontWeight: 'bold' }}>
                {(item as InventoryItem).price} €
              </div>
            </div>
          )}

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

          {/* Informations GLB & Performance 3D si présent */}
          {glbPath && (
            <>
              <div className="inventory-spec-card" style={{ borderLeft: '3px solid #7c3aed', background: '#faf5ff' }}>
                <div className="inventory-spec-label" style={{ color: '#7c3aed' }}>Fichier GLB</div>
                <div className="inventory-spec-value" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                  {glbPath.split('/').pop()}
                  {glbStats?.fileSize !== undefined ? (
                    <span style={{ display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      Taille : {glbStats.fileSize > 1024 * 1024 
                        ? `${(glbStats.fileSize / (1024 * 1024)).toFixed(2)} Mo`
                        : `${(glbStats.fileSize / 1024).toFixed(1)} Ko`}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="inventory-spec-card" style={{ borderLeft: '3px solid #7c3aed', background: '#faf5ff' }}>
                <div className="inventory-spec-label" style={{ color: '#7c3aed' }}>Triangles & Draw Calls</div>
                <div className="inventory-spec-value" style={{ fontSize: 13, fontWeight: 600 }}>
                  {glbStats ? (
                    <>
                      <span>{glbStats.triangles.toLocaleString()} tris</span>
                      <span style={{ color: '#9ca3af', margin: '0 5px' }}>·</span>
                      <span style={{ color: glbStats.drawCalls > 10 ? '#dc2626' : '#16a34a' }}>
                        {glbStats.drawCalls} draw call{glbStats.drawCalls > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>Calcul en cours…</span>
                  )}
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
        <div className="inventory-detail-section-label">Notes</div>
        <div className="inventory-detail-notes">
          {(item as any).notes || "Aucune note descriptive disponible pour cet élément."}
        </div>

        {!isStorage && !isZone && (item as InventoryItem).category === 'walkers' && item.id !== 'ushiro' && item.id !== 'robin-bird' && (
          <>
            <hr className="inventory-detail-divider" />
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="inventory-detail-section-label mb-0">👯‍♀️ Animations Duo (Preview 3D : {(item as any).name})</div>
              <button
                type="button"
                className="btn btn-sm btn-warning text-dark px-2 py-0 fw-bold shadow-sm"
                style={{ fontSize: '11px', borderRadius: '4px' }}
                title="Lancer une animation de couple aléatoire dans la preview 3D 🎲"
                onClick={() => {
                  const randomAnim = DUO_ANIMATIONS[Math.floor(Math.random() * DUO_ANIMATIONS.length)];
                  const otherChars = CHARACTERS.filter(c => c.id !== item.id);
                  const randPartner = otherChars[Math.floor(Math.random() * otherChars.length)]?.id;
                  if (randomAnim) {
                    setSelectedDuoAnim(randomAnim);
                    setSelectedDuoPartner(randPartner);
                  }
                }}
              >
                🎲 Aléatoire
              </button>
            </div>

            <div className="mb-2">
              <select
                className="form-select form-select-sm"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedDuoAnim(undefined);
                  } else {
                    const def = DUO_ANIMATIONS.find(a => a.id === val);
                    if (def) {
                      const otherChars = CHARACTERS.filter(c => c.id !== item.id);
                      const randPartner = selectedDuoPartner || (otherChars[0]?.id ?? 'rosanna');
                      setSelectedDuoAnim(def);
                      setSelectedDuoPartner(randPartner);
                    }
                  }
                }}
                value={selectedDuoAnim?.id || ""}
                style={{ fontSize: '12px' }}
              >
                <option value="">Sélectionner une animation de couple...</option>
                {DUO_ANIMATIONS.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex flex-column gap-1 overflow-auto" style={{ maxHeight: '180px', paddingRight: '4px' }}>
              {DUO_ANIMATIONS.map(a => {
                const isSelected = selectedDuoAnim?.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      const otherChars = CHARACTERS.filter(c => c.id !== item.id);
                      const partner = selectedDuoPartner || (otherChars[0]?.id ?? 'rosanna');
                      setSelectedDuoAnim(a);
                      setSelectedDuoPartner(partner);
                    }}
                    className={`btn btn-sm text-start d-flex align-items-center justify-content-between px-2 py-1 border ${
                      isSelected ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'
                    }`}
                    style={{ fontSize: '11px', borderRadius: '6px' }}
                  >
                    <span className="text-truncate me-2">
                      <span className="me-1">{a.icon}</span> {a.label}
                    </span>
                    <span className={`badge border ${isSelected ? 'bg-light text-dark' : 'bg-light text-secondary'}`} style={{ fontSize: '9px' }}>
                      Preview 3D
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="inventory-detail-actions mt-3">
          <button className="inventory-btn-edit" onClick={() => alert(`Modifier : ${(item as any).name}`)}>✏️ Modifier</button>
          <button className="inventory-btn-delete" onClick={() => { if(confirm(`Supprimer ${(item as any).name} ?`)) alert('Supprimé (démo)'); }}>🗑 Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Inventory Component ──────────────────────────────────────────────────

export function Inventory({
  visible = true,
  onClose,
  initialCategory = 'all'
}: {
  visible?: boolean;
  onClose: () => void;
  initialCategory?: string;
}) {
  const isMobile = useIsMobile();
  const [activeCat, setActiveCat]         = useState(initialCategory);
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState<PreviewTarget>(null);
  const [focusedIndex, setFocusedIndex]   = useState(-1);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const tableContainerRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategory) {
      setActiveCat(initialCategory);
      if (initialCategory === 'walkers') {
        const firstWalker = INVENTORY.find(i => i.category === 'walkers' && i.id !== 'ushiro' && i.id !== 'robin-bird');
        if (firstWalker) setSelected(firstWalker);
      }
    }
  }, [initialCategory, visible]);

  // SpatialZones list
  const spatialZones = useMemo(() => {
    const all = SpatialZoneManager.getAllZones();
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(z => z.name.toLowerCase().includes(q) || z.id.toLowerCase().includes(q));
  }, [search]);

  // Filter items list
  const items = useMemo(() => {
    if (activeCat === 'spaces') return [];
    const q = search.trim().toLowerCase();
    return INVENTORY.filter(i => {
      if (activeCat === 'actionnable' && !i.actions?.length) return false;
      if (activeCat === 'glbs'        && !i.glbPath)         return false;
      
      if (activeCat !== 'all' && activeCat !== 'actionnable' && activeCat !== 'glbs') {
        if (i.category !== activeCat) return false;
      }

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

  // Unified list: Spatial zones (if category 'spaces' or 'all'), storage spaces, then items
  const navList = useMemo<PreviewTarget[]>(() => {
    if (activeCat === 'spaces') {
      return spatialZones;
    }
    return [
      ...(activeCat === 'all' ? spatialZones : []),
      ...(showSpaces ? spaces : []),
      ...items,
    ];
  }, [activeCat, spatialZones, showSpaces, spaces, items]);

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
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!isTyping && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        onClose();
        return;
      }
      if (isTyping || tag === 'BUTTON') return;
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
  }, [navList, focusedIndex, isMobile, onClose, visible]);

  return (
    <div
      className="inventory-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      style={{ display: visible ? undefined : 'none' }}
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
                  const isZone = target instanceof SpatialZone;
                  const isStorage = !isZone && !('category' in target);
                  const id = target.id;
                  const isSelected = selected && selected.id === id;
                  const isFocused  = focusedId === id;

                  if (isZone) {
                    const zone = target as SpatialZone;
                    const smartObjectsCount = zone.getSmartObjects().length;
                    return (
                      <div
                        key={zone.id}
                        data-item-id={zone.id}
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
                          <span className="thumb-icon">{zone.environment === 'indoor' ? '🏠' : '🌳'}</span>
                        </div>
                        <div className="inventory-item-meta">
                          <div className="inventory-item-name">{zone.name}</div>
                          <div className="inventory-item-sub">
                            <span>{zone.environment === 'indoor' ? 'Intérieur' : 'Extérieur'}</span>
                            <span style={{ color: 'var(--border)' }}>·</span>
                            <span>{smartObjectsCount} SmartObject{smartObjectsCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="inventory-item-badges">
                            <span className="inventory-badge-tag inventory-badge-virt" style={{ background: '#0284c7', color: '#fff' }}>
                              Espace 3D
                            </span>
                            <span className="inventory-badge-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                              ✨ {smartObjectsCount} Objets
                            </span>
                          </div>
                        </div>
                        <div className="inventory-item-qty" style={{ fontSize: 11, color: '#64748b' }}>
                          Zone
                        </div>
                      </div>
                    );
                  }

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
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => { e.stopPropagation(); setShowMobileModal(false); }}>
          <div className="modal-dialog modal-fullscreen-sm-down modal-dialog-scrollable" role="document">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
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
