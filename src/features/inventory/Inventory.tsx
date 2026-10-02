/**
 * Inventory.tsx — port de js/ui/inventory.js
 * Styled using Bootstrap 5.3, custom red theme variables and fully responsive.
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { INVENTORY, CATEGORIES, STORAGE_SPACES, type InventoryItem, type StorageSpace } from './inventoryData';
import { InventoryPreview } from './InventoryPreview';
import { SpatialZonePreview } from './SpatialZonePreview';
import { SpatialZoneManager, SpatialZone } from '@features/scene/ai/SpatialZone';
import { DUO_ANIMATIONS, type DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import { CHARACTERS, isExtraCharacter } from '@features/scene/walkerConfig';
import { useSceneStore } from '@features/scene/store/useSceneStore';
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

  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const [selectedDuoAnim, setSelectedDuoAnim] = useState<DuoAnimationDef | undefined>(undefined);
  const [selectedDuoPartner, setSelectedDuoPartner] = useState<string | undefined>(undefined);
  const [glbStats, setGlbStats] = useState<{ fileSize?: number; triangles: number; drawCalls: number } | null>(null);

  const handleGlbStats = useCallback((s: { fileSize?: number; triangles: number; drawCalls: number } | null) => {
    setGlbStats(prev => {
      if (!s && !prev) return prev;
      if (s && prev && s.fileSize === prev.fileSize && s.triangles === prev.triangles && s.drawCalls === prev.drawCalls) {
        return prev;
      }
      return s;
    });
  }, []);

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
      <div className="d-flex flex-column w-100">
        {/* Rendu 3D isolé de la pièce / espace sans obstruction */}
        <div className="w-100 position-relative">
          <SpatialZonePreview
            zone={zone}
            height="100%"
            onStats={s => setGlbStats({ triangles: s.triangles, drawCalls: s.drawCalls })}
          />
        </div>

        <div className="p-3">
          <h3 className="fw-bold mb-1 text-dark fs-5">{zone.name}</h3>
          <p className="text-muted small mb-2">
            {zone.environment === 'indoor' ? 'Intérieur studio' : 'Espace extérieur'} — Zone Spatiale 3D
          </p>

          <div className="d-flex flex-wrap gap-1 mb-3">
            <span className="badge bg-primary text-white">
              {zone.environment === 'indoor' ? '🏠 Pièce Intérieure' : '🌳 Extérieur'}
            </span>
            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
              ✨ {smartObjects.length} Smart Object{smartObjects.length > 1 ? 's' : ''}
            </span>
            <span className="badge bg-light text-dark border">
              📍 {waypoints.length} Waypoint{waypoints.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="card bg-white bg-opacity-75 border p-2 h-100">
                <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>Volume Bounding Box (L×P×H)</div>
                <div className="fw-semibold small">{sizeStr}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="card bg-white bg-opacity-75 border p-2 h-100">
                <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>SmartObjects interactifs</div>
                <div className="fw-bold text-danger small">
                  {smartObjects.length} meuble{smartObjects.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card bg-info-subtle border border-info-subtle p-2">
                <div className="text-uppercase text-info-emphasis fw-bold small" style={{ fontSize: '0.7rem' }}>Triangles & Draw Calls</div>
                <div className="fw-semibold small">
                  {glbStats ? (
                    <>
                      <span>{glbStats.triangles.toLocaleString()} tris</span>
                      <span className="text-muted mx-1">·</span>
                      <span className={glbStats.drawCalls > 80 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                        {glbStats.drawCalls} draw call{glbStats.drawCalls > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted small">Calcul en cours…</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-3 opacity-25" />
          <div className="text-uppercase text-muted fw-bold small mb-2" style={{ fontSize: '0.7rem' }}>SmartObjects & Affordances dans cette pièce</div>
          <div className="d-flex flex-column gap-1 mb-3">
            {smartObjects.length === 0 ? (
              <div className="text-muted small">Aucun SmartObject indexé dans ce volume.</div>
            ) : (
              smartObjects.map(obj => (
                <div key={obj.id} className="card bg-light border p-2 d-flex flex-column gap-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold small">✨ {obj.name}</span>
                    <span className="badge bg-white text-secondary border text-uppercase" style={{ fontSize: '0.65rem' }}>
                      {obj.category}
                    </span>
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Slots : {obj.slots.map(s => s.name).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>

          <hr className="my-3 opacity-25" />
          <div className="text-uppercase text-muted fw-bold small mb-2" style={{ fontSize: '0.7rem' }}>Points de Passage (Waypoints)</div>
          <div className="d-flex flex-wrap gap-1">
            {waypoints.map(wp => (
              <span key={wp.id} className="badge bg-light text-dark border font-monospace">
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
    <div className="d-flex flex-column w-100">
      {/* 3D Preview Canvas / Photo Gallery as Hero (Ratio Carré) */}
      <div className="w-100 position-relative">
        <InventoryPreview
          item={item as any}
          height="100%"
          hideFooter={true}
          initialDuoAnim={selectedDuoAnim}
          initialDuoPartner={selectedDuoPartner}
          onGlbStats={handleGlbStats}
        />
      </div>

      <div className="p-3">
        <h3 className="fw-bold mb-1 text-dark fs-5">{(item as any).name}</h3>
        <p className="text-muted small mb-2">
          {!isStorage && (item as InventoryItem).brand ? `${(item as InventoryItem).brand} — ` : ''}
          {isStorage ? 'Espace de rangement' : catLabel}
        </p>

        <div className="d-flex flex-wrap gap-1 mb-3">
          {isStorage ? (
            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
              🗄️ Rangement
            </span>
          ) : (item as InventoryItem).category === 'walkers' ? (
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              🔵 Virtuel
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              🟢 Physique
            </span>
          )}

          {!isStorage && (item as InventoryItem).actions && (item as InventoryItem).actions!.length > 0 && (
            <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
              ⚡ Actionnable
            </span>
          )}

          {!isStorage && (
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              {catLabel}
            </span>
          )}

          {glbPath && (
            <span className="badge bg-primary text-white">
              🎲 Modèle GLB 3D
            </span>
          )}
        </div>

        <div className="row g-2 mb-3">
          <div className="col-6">
            <div className="card bg-white bg-opacity-75 border p-2 h-100">
              <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>
                {!isStorage && (item as InventoryItem).category === 'consumable' ? 'Stock restant' : 'Quantité'}
              </div>
              <div className="fw-bold text-danger small">
                {!isStorage && (item as InventoryItem).category === 'consumable' 
                  ? `${(item as InventoryItem).stock ?? 0} pièces` 
                  : isStorage 
                    ? '1 espace' 
                    : `×${(item as InventoryItem).qty}`}
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="card bg-white bg-opacity-75 border p-2 h-100">
              <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>Dimensions (L×P×H)</div>
              <div className="fw-semibold small">
                {dimsStr}
              </div>
            </div>
          </div>

          {!isStorage && (item as InventoryItem).price && (
            <div className="col-6">
              <div className="card bg-white bg-opacity-75 border p-2 h-100">
                <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>Prix</div>
                <div className="fw-bold small">
                  {(item as InventoryItem).price} €
                </div>
              </div>
            </div>
          )}

          {!isStorage && (item as InventoryItem).category === 'consumable' && (
            <>
              <div className="col-6">
                <div className="card bg-white bg-opacity-75 border p-2 h-100">
                  <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>Fréquence de rachat</div>
                  <div className="fw-semibold small text-capitalize">
                    {(item as InventoryItem).frequency ?? '—'}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="card bg-white bg-opacity-75 border p-2 h-100">
                  <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>Lieu de stockage</div>
                  <div className="fw-semibold small">
                    {(item as InventoryItem).location ?? '—'}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Informations GLB & Performance 3D si présent */}
          {glbPath && (
            <>
              <div className="col-6">
                <div className="card bg-primary-subtle border border-primary-subtle p-2 h-100">
                  <div className="text-uppercase text-primary fw-bold small" style={{ fontSize: '0.7rem' }}>Fichier GLB</div>
                  <div className="fw-semibold small text-truncate" title={glbPath}>
                    {glbPath.split('/').pop()}
                    {glbStats?.fileSize !== undefined ? (
                      <span className="d-block text-muted small mt-1">
                        Taille : {glbStats.fileSize > 1024 * 1024 
                          ? `${(glbStats.fileSize / (1024 * 1024)).toFixed(2)} Mo`
                          : `${(glbStats.fileSize / 1024).toFixed(1)} Ko`}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="col-6">
                <div className="card bg-primary-subtle border border-primary-subtle p-2 h-100">
                  <div className="text-uppercase text-primary fw-bold small" style={{ fontSize: '0.7rem' }}>Triangles & Draw Calls</div>
                  <div className="fw-semibold small">
                    {glbStats ? (
                      <>
                        <span>{glbStats.triangles.toLocaleString()} tris</span>
                        <span className="text-muted mx-1">·</span>
                        <span className={glbStats.drawCalls > 10 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                          {glbStats.drawCalls} draw call{glbStats.drawCalls > 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted small">Calcul en cours…</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {!isStorage && (item as InventoryItem).url && (
            <div className="col-12">
              <div className="card bg-white bg-opacity-75 border p-2">
                <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>Lien Produit</div>
                <div className="small">
                  <a 
                    href={(item as InventoryItem).url} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={e => e.stopPropagation()}
                    className="text-danger fw-semibold text-decoration-none"
                  >
                    🔗 Ouvrir la fiche produit
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <hr className="my-3 opacity-25" />
        <div className="text-uppercase text-muted fw-bold small mb-1" style={{ fontSize: '0.7rem' }}>Notes</div>
        <div className="card bg-white bg-opacity-50 border p-2 text-dark small mb-3">
          {(item as any).notes || "Aucune note descriptive disponible pour cet élément."}
        </div>

        {!isStorage && !isZone && (item as InventoryItem).category === 'walkers' && item.id !== 'ushiro' && item.id !== 'robin-bird' && (
          <>
            <hr className="my-3 opacity-25" />
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem' }}>👯‍♀️ Animations Duo (Preview 3D : {(item as any).name})</div>
              <button
                type="button"
                className="btn btn-sm btn-warning text-dark py-0 px-2 fw-bold shadow-sm"
                title="Lancer une animation de couple aléatoire dans la preview 3D 🎲"
                onClick={() => {
                  const randomAnim = DUO_ANIMATIONS[Math.floor(Math.random() * DUO_ANIMATIONS.length)];
                  const otherChars = CHARACTERS.filter(c => c.id !== item.id && (extraCharacters || !isExtraCharacter(c.id)));
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
                      const otherChars = CHARACTERS.filter(c => c.id !== item.id && (extraCharacters || !isExtraCharacter(c.id)));
                      const randPartner = selectedDuoPartner || (otherChars[0]?.id ?? 'rosanna');
                      setSelectedDuoAnim(def);
                      setSelectedDuoPartner(randPartner);
                    }
                  }
                }}
                value={selectedDuoAnim?.id || ""}
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
                      const otherChars = CHARACTERS.filter(c => c.id !== item.id && (extraCharacters || !isExtraCharacter(c.id)));
                      const partner = selectedDuoPartner || (otherChars[0]?.id ?? 'rosanna');
                      setSelectedDuoAnim(a);
                      setSelectedDuoPartner(partner);
                    }}
                    className={`btn btn-sm text-start d-flex align-items-center justify-content-between px-2 py-1 border ${
                      isSelected ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'
                    }`}
                  >
                    <span className="text-truncate me-2 small">
                      <span className="me-1">{a.icon}</span> {a.label}
                    </span>
                    <span className={`badge border ${isSelected ? 'bg-light text-dark' : 'bg-light text-secondary'}`} style={{ fontSize: '0.65rem' }}>
                      Preview 3D
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="d-flex gap-2 mt-3">
          <button type="button" className="btn btn-sm btn-danger px-3 fw-semibold shadow-sm" onClick={() => alert(`Modifier : ${(item as any).name}`)}>✏️ Modifier</button>
          <button type="button" className="btn btn-sm btn-outline-secondary bg-white text-dark px-3" onClick={() => { if(confirm(`Supprimer ${(item as any).name} ?`)) alert('Supprimé (démo)'); }}>🗑 Supprimer</button>
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
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const [activeCat, setActiveCat]         = useState(initialCategory);
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState<PreviewTarget>(null);
  const [focusedIndex, setFocusedIndex]   = useState(-1);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [listWidth, setListWidth]         = useState(() => {
    try {
      const saved = localStorage.getItem('inventory_list_width');
      return saved ? Math.max(220, Math.min(800, parseInt(saved, 10))) : 380;
    } catch {
      return 380;
    }
  });
  const [isResizing, setIsResizing]       = useState(false);
  const tableContainerRef                 = useRef<HTMLDivElement>(null);
  const searchInputRef                    = useRef<HTMLInputElement>(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = listWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.75, startWidth + delta));
      setListWidth(newWidth);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsResizing(false);
      const finalDelta = upEvent.clientX - startX;
      const finalWidth = Math.max(200, Math.min(window.innerWidth * 0.75, startWidth + finalDelta));
      try {
        localStorage.setItem('inventory_list_width', Math.round(finalWidth).toString());
      } catch {}
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    if (initialCategory) {
      setActiveCat(initialCategory);
      if (initialCategory === 'walkers') {
        const firstWalker = INVENTORY.find(i => i.category === 'walkers' && i.id !== 'ushiro' && i.id !== 'robin-bird' && (extraCharacters || !isExtraCharacter(i.id)));
        if (firstWalker) setSelected(firstWalker);
      }
    }
  }, [initialCategory, visible, extraCharacters]);

function normalizeSearchStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

  // SpatialZones list
  const spatialZones = useMemo(() => {
    const all = SpatialZoneManager.getAllZones();
    const q = normalizeSearchStr(search);
    if (!q) return all;
    return all.filter(z => normalizeSearchStr(z.name).includes(q) || normalizeSearchStr(z.id).includes(q));
  }, [search]);

  // Filter items list
  const items = useMemo(() => {
    if (activeCat === 'spaces') return [];
    const q = normalizeSearchStr(search);
    return INVENTORY.filter(i => {
      // Les ExtraCharacters ne sont visibles que si l'option extraCharacters est activée
      if (!extraCharacters && isExtraCharacter(i.id)) return false;

      if (activeCat === 'actionnable' && !i.actions?.length) return false;
      if (activeCat === 'glbs'        && !i.glbPath)         return false;
      
      // Si une recherche textuelle est saisie, chercher dans tout le catalogue pour ne pas masquer de résultats
      if (!q && activeCat !== 'all' && activeCat !== 'actionnable' && activeCat !== 'glbs') {
        if (i.category !== activeCat) return false;
      }

      if (q) {
        const itemText = normalizeSearchStr(
          `${i.id} ${i.name} ${i.brand} ${i.notes ?? ''} ${(i.tags ?? []).join(' ')}`
        );
        const qAlt = q.replace(/pendantif/g, 'pendentif').replace(/pendentif/g, 'pendantif');
        if (!itemText.includes(q) && !itemText.includes(qAlt)) return false;
      }
      return true;
    });
  }, [activeCat, search, extraCharacters]);

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

  // Auto-select first item on desktop startup or if currently selected item is hidden
  useEffect(() => {
    if (!isMobile && (!selected || !navList.some(item => (item as any).id === selected.id)) && navList.length > 0) {
      setSelected(navList[0]);
    } else if (selected && !navList.some(item => (item as any).id === selected.id)) {
      setSelected(null);
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
      const targetEl = e.target as HTMLElement | null;
      const isInsideList = !!targetEl?.closest?.('.inventory-pane-list');
      if (!isInsideList || isTyping || tag === 'BUTTON' || tag === 'SELECT') return;
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
        <div className="d-flex align-items-center justify-content-between p-2 px-3 border-bottom bg-white bg-opacity-75 sticky-top gap-2" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center gap-2 fw-bold text-dark text-nowrap">
            <span className="rounded-circle bg-danger d-inline-block" style={{ width: 8, height: 8 }} />
            <span>Inventaire</span>
          </div>
          <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: 360 }}>
            <span className="input-group-text bg-white text-muted border-end-0">
              <i className="bi bi-search" />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control border-start-0 border-end-0 bg-white"
              placeholder="Rechercher un item…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="input-group-text bg-white text-muted border-start-0 cursor-pointer"
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Effacer la recherche"
                title="Effacer la recherche"
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }} />
              </button>
            )}
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="text-muted small text-nowrap">
              {navList.length} item{navList.length > 1 ? 's' : ''}
            </span>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer" />
          </div>
        </div>

        {/* LAYOUT SPLIT */}
        <div className="d-flex flex-grow-1 overflow-hidden" style={{ userSelect: isResizing ? 'none' : undefined }}>
          {/* LIST PANE */}
          <div
            className="inventory-pane-list d-flex flex-column border-end bg-white bg-opacity-50 overflow-hidden flex-shrink-0"
            style={{ width: isMobile ? '100%' : `${listWidth}px` }}
          >
            <div className="p-2 border-bottom d-flex flex-column gap-1 bg-light bg-opacity-50">
              <span className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                Tous les items
              </span>
              <div className="d-flex gap-1 overflow-x-auto text-nowrap pb-1" style={{ scrollbarWidth: 'none' }}>
                {CATEGORIES.map(cat => {
                  const isActive = cat.id === activeCat;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn btn-sm py-0.5 px-2 rounded-pill small ${isActive ? 'btn-danger text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                      onClick={() => setActiveCat(cat.id)}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div ref={tableContainerRef} className="overflow-auto flex-grow-1">
              {navList.length === 0 ? (
                <div className="p-4 text-center text-muted small">
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
                        className={`p-2 border-bottom d-flex align-items-center gap-2 cursor-pointer ${isSelected ? 'bg-danger bg-opacity-10 border-start border-danger border-3' : 'bg-transparent'}`}
                        onClick={() => {
                          setSelected(target);
                          setFocusedIndex(navList.indexOf(target));
                          if (isMobile) {
                            setShowMobileModal(true);
                          }
                        }}
                        style={{
                          outline: isFocused ? '1px solid var(--red)' : undefined,
                          outlineOffset: '-1px',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="inventory-item-thumb">
                          <span className="fs-5">{zone.environment === 'indoor' ? '🏠' : '🌳'}</span>
                        </div>
                        <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-truncate small">{zone.name}</div>
                          <div className="text-muted small d-flex align-items-center gap-1">
                            <span>{zone.environment === 'indoor' ? 'Intérieur' : 'Extérieur'}</span>
                            <span>·</span>
                            <span>{smartObjectsCount} SmartObject{smartObjectsCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="d-flex gap-1 mt-1 flex-wrap">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              Espace 3D
                            </span>
                            <span className="badge bg-light text-dark border">
                              ✨ {smartObjectsCount} Objets
                            </span>
                          </div>
                        </div>
                        <div className="text-muted small flex-shrink-0">
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
                      className={`p-2 border-bottom d-flex align-items-center gap-2 cursor-pointer ${isSelected ? 'bg-danger bg-opacity-10 border-start border-danger border-3' : 'bg-transparent'}`}
                      onClick={() => {
                        setSelected(target);
                        setFocusedIndex(navList.indexOf(target));
                        if (isMobile) {
                          setShowMobileModal(true);
                        }
                      }}
                      style={{
                        outline: isFocused ? '1px solid var(--red)' : undefined,
                        outlineOffset: '-1px',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="inventory-item-thumb">
                        {thumbPhoto ? (
                          <img src={thumbPhoto} alt={target.name} />
                        ) : (
                          <span className="fs-5">{emoji}</span>
                        )}
                      </div>
                      <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate small">{target.name}</div>
                        <div className="text-muted small d-flex align-items-center gap-1">
                          {!isStorage && (target as InventoryItem).brand && (
                            <>
                              <span className="text-truncate">{(target as InventoryItem).brand}</span>
                              <span>·</span>
                            </>
                          )}
                          <span className="text-nowrap">{target.dims.w}×{target.dims.d}×{target.dims.h} cm</span>
                        </div>
                        <div className="d-flex gap-1 mt-1 flex-wrap">
                          {isStorage ? (
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Rangement</span>
                          ) : (target as InventoryItem).category === 'walkers' ? (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Virtuel</span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">{catLabel}</span>
                          )}
                          {!isStorage && (target as InventoryItem).actions && (target as InventoryItem).actions!.length > 0 && (
                            <span className="badge bg-warning-subtle text-dark border border-warning-subtle">⚡ Action</span>
                          )}
                        </div>
                      </div>
                      <div className="text-muted small flex-shrink-0 text-end">
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

          {/* SPLITTER DRAG HANDLE (desktop) */}
          {!isMobile && (
            <div
              onMouseDown={handleResizeStart}
              className={`bg-secondary ${isResizing ? 'bg-opacity-75' : 'bg-opacity-25'}`}
              style={{
                width: 5,
                cursor: 'col-resize',
                zIndex: 10,
                position: 'relative',
                flexShrink: 0,
              }}
              title="Glisser pour redimensionner la liste / preview 3D"
            />
          )}

          {/* DETAIL PANE (desktop) */}
          <div className="inventory-pane-detail flex-grow-1 overflow-auto bg-light bg-opacity-25">
            {!selected ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted text-center gap-2 p-4">
                <i className="bi bi-box-seam fs-1 opacity-25" />
                <p className="small mb-0">Sélectionnez un item<br />pour afficher son détail</p>
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
