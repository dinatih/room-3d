/**
 * AnimationStudioView.tsx — Environnement dédié d'analyse et test d'animations.
 * Gère à la fois les animations Solo et les animations Duo :
 * - Switcher de personnage (Lara, Bob, Malcolm, Michelle, etc.)
 * - Choix et lecture des animations Solo ou Duo
 * - Synchronisation et barre de transport avec AnimFrameController
 * - Décalage/ajustement des offsets (hauteur sol, rotation, position relative)
 * - Annotations persistantes en LocalStorage (tags, statuts, notes)
 */
import { useState, useMemo, useEffect } from 'react';
import { CHARACTERS, isExtraCharacter } from '@features/scene/characterConfig';
import { DUO_ANIMATIONS, canCharacterPerformDuo, type DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import { ENHANCED_ANIM_OPTIONS, ANIM_CATEGORIES, getFilteredAnimOptions } from '@features/scene/CharacterAnimSelector';
import { InventoryPreview } from './InventoryPreview';
import { AnimFrameController } from './AnimFrameController';
import { DevAnnotationPanel } from './DevAnnotationPanel';
import { useItemAnnotations } from './useItemAnnotations';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import { INVENTORY } from './inventoryData';

export function AnimationStudioView({ isMobile = false }: { isMobile?: boolean }) {
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);

  // Mode Solo ou Duo
  const [mode, setMode] = useState<'solo' | 'duo'>('solo');

  // Sélection Personnages
  const availableCharacters = useMemo(() => {
    return CHARACTERS.filter(c => 
      c.id !== 'ushiro' && c.id !== 'robin-bird' && c.id !== 'jikin-goldfish' && c.id !== 'tosakin-goldfish' &&
      (extraCharacters || !isExtraCharacter(c.id))
    );
  }, [extraCharacters]);

  const [activeCharId, setActiveCharId] = useState<string>(() => availableCharacters[0]?.id || 'native');
  const [duoLeaderId, setDuoLeaderId]   = useState<string>(() => availableCharacters[0]?.id || 'native');
  const [duoPartnerId, setDuoPartnerId] = useState<string>(() => availableCharacters[1]?.id || 'character-bob');

  // Animations Solo
  const [soloSearch, setSoloSearch] = useState('');
  const [selectedSoloCats, setSelectedSoloCats] = useState<string[]>([]);
  const [activeSoloAnim, setActiveSoloAnim] = useState<string>('idle');

  // Animations Duo
  const [duoSearch, setDuoSearch] = useState('');
  const [duoFilter, setDuoFilter] = useState<'all' | 'combat' | 'social'>('all');
  const [activeDuoDef, setActiveDuoDef] = useState<DuoAnimationDef | undefined>(DUO_ANIMATIONS[0]);

  // Récupération de l'item d'inventaire correspondant pour InventoryPreview
  const currentItem = useMemo(() => {
    const charId = mode === 'solo' ? activeCharId : duoLeaderId;
    return INVENTORY.find(i => i.id === charId) || INVENTORY.find(i => i.id === 'native')!;
  }, [mode, activeCharId, duoLeaderId]);

  // ID pour les annotations
  const currentAnnotationId = mode === 'solo' ? `anim:${activeSoloAnim}` : `duo:${activeDuoDef?.id || 'none'}`;
  const currentAnnotationName = mode === 'solo'
    ? (ENHANCED_ANIM_OPTIONS.find(a => a.value === activeSoloAnim)?.label || activeSoloAnim)
    : (activeDuoDef?.label || 'Duo');

  const { allAnnotations } = useItemAnnotations();

  // Filtrage Solo
  const filteredSoloAnims = useMemo(() => {
    return getFilteredAnimOptions(soloSearch, selectedSoloCats, false);
  }, [soloSearch, selectedSoloCats]);

  // Filtrage Duo
  const filteredDuoAnims = useMemo(() => {
    const q = duoSearch.trim().toLowerCase();
    return DUO_ANIMATIONS.filter(a => {
      if (duoFilter === 'combat' && !a.isCombat) return false;
      if (duoFilter === 'social' && a.isCombat) return false;
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.animA.toLowerCase().includes(q) ||
        a.animB.toLowerCase().includes(q) ||
        a.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [duoSearch, duoFilter]);

  // Partenaires compatibles pour le Duo sélectionné
  const compatiblePartners = useMemo(() => {
    if (!activeDuoDef) return availableCharacters;
    return availableCharacters.filter(c => c.id !== duoLeaderId && canCharacterPerformDuo(c.id, activeDuoDef));
  }, [availableCharacters, duoLeaderId, activeDuoDef]);

  // S'assurer que le partenaire actuel est compatible lors du changement d'anim
  useEffect(() => {
    if (mode === 'duo' && activeDuoDef) {
      if (!compatiblePartners.some(c => c.id === duoPartnerId)) {
        if (compatiblePartners.length > 0) {
          setDuoPartnerId(compatiblePartners[0].id);
        }
      }
    }
  }, [mode, activeDuoDef, compatiblePartners, duoPartnerId]);

  return (
    <div className="d-flex flex-column flex-md-row w-100 h-100 overflow-hidden">
      {/* ── COLONNE DE GAUCHE : LISTE DES ANIMATIONS (SOLO OU DUO) ── */}
      <div
        className="d-flex flex-column border-end bg-white bg-opacity-75 flex-shrink-0 overflow-hidden"
        style={{ width: isMobile ? '100%' : '380px' }}
      >
        {/* En-tête : Switcher Mode Solo / Duo */}
        <div className="p-2 border-bottom bg-light bg-opacity-50">
          <div className="btn-group btn-group-sm w-100 shadow-sm" role="group">
            <button
              type="button"
              className={`btn py-1.5 fw-semibold ${mode === 'solo' ? 'btn-danger text-white' : 'btn-outline-secondary bg-white text-dark'}`}
              onClick={() => setMode('solo')}
            >
              <i className="bi bi-person-fill me-1" aria-hidden="true" />
              Solo ({ENHANCED_ANIM_OPTIONS.length})
            </button>
            <button
              type="button"
              className={`btn py-1.5 fw-semibold ${mode === 'duo' ? 'btn-danger text-white' : 'btn-outline-secondary bg-white text-dark'}`}
              onClick={() => setMode('duo')}
            >
              <i className="bi bi-people-fill me-1" aria-hidden="true" />
              Duo ({DUO_ANIMATIONS.length})
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres de catégories */}
        <div className="p-2 border-bottom flex-shrink-0">
          {mode === 'solo' ? (
            <>
              <div className="input-group input-group-sm mb-1.5">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Rechercher une animation solo..."
                  value={soloSearch}
                  onChange={e => setSoloSearch(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                {soloSearch && (
                  <button className="btn btn-outline-secondary border-start-0" onClick={() => setSoloSearch('')}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Catégories Solo sous forme de pills scrollables */}
              <div className="d-flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  type="button"
                  className={`btn btn-sm py-0 px-2 rounded-pill small text-nowrap ${
                    selectedSoloCats.length === 0 ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'
                  }`}
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => setSelectedSoloCats([])}
                >
                  Toutes
                </button>
                {ANIM_CATEGORIES.map(cat => {
                  const isChecked = selectedSoloCats.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      className={`btn btn-sm py-0 px-2 rounded-pill small text-nowrap ${
                        isChecked ? 'btn-primary text-white' : 'btn-outline-secondary bg-white text-dark'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                      onClick={() =>
                        setSelectedSoloCats(prev =>
                          prev.includes(cat.key) ? prev.filter(k => k !== cat.key) : [...prev, cat.key]
                        )
                      }
                    >
                      <i className={`bi ${cat.icon} me-1`} aria-hidden="true" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="input-group input-group-sm mb-1.5">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Rechercher un duo/combat..."
                  value={duoSearch}
                  onChange={e => setDuoSearch(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                {duoSearch && (
                  <button className="btn btn-outline-secondary border-start-0" onClick={() => setDuoSearch('')}>
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Filtres Duo */}
              <div className="btn-group btn-group-sm w-100" role="group">
                <button
                  type="button"
                  className={`btn py-0.5 px-2 ${duoFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setDuoFilter('all')}
                >
                  Toutes ({DUO_ANIMATIONS.length})
                </button>
                <button
                  type="button"
                  className={`btn py-0.5 px-2 ${duoFilter === 'combat' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setDuoFilter('combat')}
                >
                  Combat 🥋
                </button>
                <button
                  type="button"
                  className={`btn py-0.5 px-2 ${duoFilter === 'social' ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'}`}
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setDuoFilter('social')}
                >
                  Danse & Duo 💃
                </button>
              </div>
            </>
          )}
        </div>

        {/* Liste défilante des animations */}
        <div className="overflow-auto flex-grow-1">
          {mode === 'solo' ? (
            filteredSoloAnims.length === 0 ? (
              <div className="p-3 text-center text-muted small">Aucune animation solo trouvée.</div>
            ) : (
              filteredSoloAnims.map(anim => {
                const isSelected = activeSoloAnim === anim.value;
                const annot = allAnnotations[`anim:${anim.value}`];
                const statusColor =
                  annot?.status === 'ok'
                    ? 'success'
                    : annot?.status === 'issue'
                    ? 'danger'
                    : annot?.status === 'wip'
                    ? 'warning'
                    : annot?.status === 'favorite'
                    ? 'primary'
                    : null;

                return (
                  <div
                    key={anim.value}
                    className={`d-flex align-items-center justify-content-between p-2 border-bottom cursor-pointer ${
                      isSelected ? 'bg-danger bg-opacity-10 border-start border-danger border-3 fw-bold' : 'hover-bg-light'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveSoloAnim(anim.value)}
                  >
                    <div className="d-flex align-items-center gap-1.5 overflow-hidden flex-grow-1 me-2">
                      {isSelected && <i className="bi bi-play-fill text-danger flex-shrink-0" aria-hidden="true" />}
                      <span className="text-truncate small">{anim.label}</span>
                      {anim.duration !== undefined && (
                        <span className="badge bg-light text-muted border small flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                          {anim.duration.toFixed(1)}s
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      {statusColor && (
                        <span className={`badge bg-${statusColor} p-1 rounded-circle`} title={`Statut: ${annot?.status}`} />
                      )}
                      {annot?.tags && annot.tags.length > 0 && (
                        <span className="badge bg-secondary-subtle text-dark border small" style={{ fontSize: '0.65rem' }}>
                          #{annot.tags[0]}
                          {annot.tags.length > 1 ? ` +${annot.tags.length - 1}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredDuoAnims.length === 0 ? (
              <div className="p-3 text-center text-muted small">Aucune animation duo trouvée.</div>
            ) : (
              filteredDuoAnims.map(duo => {
                const isSelected = activeDuoDef?.id === duo.id;
                const annot = allAnnotations[`duo:${duo.id}`];
                const statusColor =
                  annot?.status === 'ok'
                    ? 'success'
                    : annot?.status === 'issue'
                    ? 'danger'
                    : annot?.status === 'wip'
                    ? 'warning'
                    : annot?.status === 'favorite'
                    ? 'primary'
                    : null;

                return (
                  <div
                    key={duo.id}
                    className={`d-flex align-items-center justify-content-between p-2 border-bottom cursor-pointer ${
                      isSelected ? 'bg-primary bg-opacity-10 border-start border-primary border-3 fw-bold' : 'hover-bg-light'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveDuoDef(duo)}
                  >
                    <div className="d-flex align-items-center gap-1.5 overflow-hidden flex-grow-1 me-2">
                      <span className="fs-6 flex-shrink-0">{duo.icon}</span>
                      <div className="d-flex flex-column overflow-hidden">
                        <span className="text-truncate small">{duo.label}</span>
                        <span className="text-muted text-truncate" style={{ fontSize: '0.65rem' }}>
                          {duo.animA} ↔ {duo.animB}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      {statusColor && (
                        <span className={`badge bg-${statusColor} p-1 rounded-circle`} title={`Statut: ${annot?.status}`} />
                      )}
                      {annot?.tags && annot.tags.length > 0 && (
                        <span className="badge bg-secondary-subtle text-dark border small" style={{ fontSize: '0.65rem' }}>
                          #{annot.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* ── ZONE CENTRALE : PRÉVISUALISATION 3D ET CONTRÔLES ── */}
      <div className="d-flex flex-column flex-grow-1 overflow-auto bg-light">
        {/* Barre supérieure : Choix des Acteurs / Personnages */}
        <div className="p-2 border-bottom bg-white d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-sm">
          {mode === 'solo' ? (
            <div className="d-flex align-items-center gap-2">
              <span className="text-uppercase text-muted fw-bold small" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-person me-1" aria-hidden="true" />
                Personnage testé :
              </span>
              <select
                className="form-select form-select-sm w-auto fw-semibold"
                value={activeCharId}
                onChange={e => setActiveCharId(e.target.value)}
              >
                {availableCharacters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Leader */}
              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-primary">Leader</span>
                <select
                  className="form-select form-select-sm w-auto fw-semibold"
                  value={duoLeaderId}
                  onChange={e => setDuoLeaderId(e.target.value)}
                >
                  {availableCharacters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton Swap */}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm py-0 px-2"
                title="Échanger Leader et Partenaire"
                onClick={() => {
                  const prevL = duoLeaderId;
                  const prevP = duoPartnerId;
                  setDuoLeaderId(prevP);
                  setDuoPartnerId(prevL);
                }}
              >
                <i className="bi bi-arrow-left-right" aria-hidden="true" />
              </button>

              {/* Partenaire */}
              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-secondary">Partenaire</span>
                <select
                  className="form-select form-select-sm w-auto fw-semibold"
                  value={duoPartnerId}
                  onChange={e => setDuoPartnerId(e.target.value)}
                >
                  {compatiblePartners.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold">
              🎬 {mode === 'solo' ? activeSoloAnim : activeDuoDef?.label}
            </span>
          </div>
        </div>

        {/* 3D Canvas / InventoryPreview Container */}
        <div className="w-100 position-relative flex-grow-1" style={{ minHeight: '340px' }}>
          <InventoryPreview
            key={`${currentItem.id}-${mode}-${mode === 'solo' ? activeSoloAnim : activeDuoDef?.id}-${duoPartnerId}`}
            item={currentItem as any}
            height="100%"
            hideFooter={false}
            hideAnimFrameController={true}
            hideViewControlBar={true}
            initialAnim={mode === 'solo' ? activeSoloAnim : undefined}
            initialDuoAnim={mode === 'duo' ? activeDuoDef : undefined}
            initialDuoPartner={mode === 'duo' ? duoPartnerId : undefined}
          />
        </div>

        {/* Barre de transport AnimFrameController */}
        <div className="p-2 border-top bg-white flex-shrink-0">
          <AnimFrameController
            compact
            animName={mode === 'solo' ? currentAnnotationName : activeDuoDef?.label}
            animKey={mode === 'solo' ? activeSoloAnim : undefined}
            isHumanCharacter={true}
            characterId={currentItem.id}
            duoAnimDef={mode === 'duo' ? activeDuoDef : undefined}
            duoPartnerId={mode === 'duo' ? duoPartnerId : undefined}
            onSelectAnim={(val) => {
              setActiveSoloAnim(val);
              useAnimPreviewStore.getState().play();
            }}
            onSelectDuoAnim={(def) => {
              setActiveDuoDef(def);
              useAnimPreviewStore.getState().play();
            }}
            onSelectDuoPartner={(partnerId) => {
              setDuoPartnerId(partnerId);
            }}
            style={{
              position: 'relative',
              inset: 'auto',
              width: '100%',
              margin: 0,
            }}
          />
        </div>

        {/* Panneau inférieur : Annotations Dev en LocalStorage pour l'animation active */}
        <div className="p-2 border-top bg-light flex-shrink-0">
          <DevAnnotationPanel
            targetId={currentAnnotationId}
            targetName={currentAnnotationName}
            compact
          />
        </div>
      </div>
    </div>
  );
}
