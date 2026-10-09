import { useState, useMemo } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import {
  EXTRA_CHARACTERS,
  REDMAN_EXTRA_IDS,
  ANATOMICAL_EXTRA_IDS,
  findCharacter,
  npcLabel,
} from '@features/scene/characterConfig';

interface ExtraCharactersSelectorProps {
  isMobile: boolean;
  onToggleLayer?: (key: any) => void;
  extraCharactersEnabled?: boolean;
}

export function ExtraCharactersSelector({
  isMobile,
}: ExtraCharactersSelectorProps) {
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const toggleExtraCharacter = useSceneStore(state => state.toggleExtraCharacter);
  const toggleExtraGroup = useSceneStore(state => state.toggleExtraGroup);
  const selectAllExtraCharacters = useSceneStore(state => state.selectAllExtraCharacters);
  const clearExtraCharacters = useSceneStore(state => state.clearExtraCharacters);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return EXTRA_CHARACTERS;
    const query = searchQuery.toLowerCase().trim();
    return EXTRA_CHARACTERS.filter(
      c => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query) || c.emoji.includes(query)
    );
  }, [searchQuery]);

  const activeCount = activeExtraIds.length;
  const totalCount = EXTRA_CHARACTERS.length;

  const redmansCount = useMemo(
    () => REDMAN_EXTRA_IDS.filter(id => activeExtraIds.includes(id)).length,
    [activeExtraIds]
  );
  const allRedmansSelected = redmansCount === REDMAN_EXTRA_IDS.length;

  const anatomicalCount = useMemo(
    () => ANATOMICAL_EXTRA_IDS.filter(id => activeExtraIds.includes(id)).length,
    [activeExtraIds]
  );
  const allAnatomicalSelected = anatomicalCount === ANATOMICAL_EXTRA_IDS.length;

  return (
    <div className="p-2 border-top bg-transparent d-flex flex-column gap-2 mt-2">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted fw-semibold text-dark small text-uppercase" style={{ fontSize: '9px' }}>
          <i className="bi bi-masks-theater me-1" aria-hidden="true" />Personnages Hors-Série (Extra)
        </div>
        <span className={`badge ${activeCount > 0 ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {activeCount > 0 ? `${activeCount} / ${totalCount} actifs` : 'AUCUN'}
        </span>
      </div>

      {/* Panneau de sélection multiple */}
      <div className="p-2 rounded bg-light-subtle border border-secondary-subtle d-flex flex-column gap-2">
        {/* Actions rapides */}
        <div className="d-flex flex-wrap gap-1 justify-content-between align-items-center">
          <div className="btn-group btn-group-sm flex-grow-1" role="group">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm py-0 px-2 text-nowrap"
              style={{ fontSize: '10px' }}
              onClick={() => selectAllExtraCharacters()}
              title={`Faire spawner la totalité des ${totalCount} personnages`}
            >
              <i className="bi bi-check-all me-1" aria-hidden="true" />Tous ({totalCount})
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 text-nowrap"
              style={{ fontSize: '10px' }}
              onClick={() => clearExtraCharacters()}
              title="Désélectionner tous les personnages extra"
            >
              <i className="bi bi-x-lg me-1" aria-hidden="true" />Aucun
            </button>
          </div>
        </div>

        {/* Sélections rapides par groupe : Redmans & Anatomiques */}
        <div className="d-flex gap-1" role="group" aria-label="Sélection groupée">
          <button
            type="button"
            className={`btn btn-sm py-1 px-2 flex-fill text-nowrap d-flex align-items-center justify-content-center gap-1 ${
              allRedmansSelected
                ? 'btn-danger text-white'
                : 'btn-outline-danger'
            }`}
            style={{ fontSize: '10px', fontWeight: allRedmansSelected ? 600 : 400 }}
            onClick={() => toggleExtraGroup(REDMAN_EXTRA_IDS)}
            title={
              allRedmansSelected
                ? 'Désélectionner les 4 Redmans (Alex, David, James, Lewis)'
                : 'Sélectionner les 4 Redmans (Alex, David, James, Lewis)'
            }
          >
            <i className={`bi ${allRedmansSelected ? 'bi-check-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
            <span><i className="bi bi-circle-fill text-danger me-1" aria-hidden="true" />Redmans</span>
            <span
              className={`badge rounded-pill ${allRedmansSelected ? 'bg-white text-danger' : 'bg-danger text-white'}`}
              style={{ fontSize: '8px', padding: '1px 5px' }}
            >
              {redmansCount}/{REDMAN_EXTRA_IDS.length}
            </span>
          </button>

          <button
            type="button"
            className={`btn btn-sm py-1 px-2 flex-fill text-nowrap d-flex align-items-center justify-content-center gap-1 ${
              allAnatomicalSelected
                ? 'btn-primary text-white'
                : 'btn-outline-primary'
            }`}
            style={{ fontSize: '10px', fontWeight: allAnatomicalSelected ? 600 : 400 }}
            onClick={() => toggleExtraGroup(ANATOMICAL_EXTRA_IDS)}
            title={
              allAnatomicalSelected
                ? 'Désélectionner les 9 Anatomiques (Zoe, Sophia, Mannequin, Maynard, Beth, Dummy, Rose, 2 squelettes)'
                : 'Sélectionner les 9 Anatomiques (Zoe, Sophia, Mannequin, Maynard, Beth, Dummy, Rose, 2 squelettes)'
            }
          >
            <i className={`bi ${allAnatomicalSelected ? 'bi-check-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
            <span className="text-truncate"><i className="bi bi-bone me-1" aria-hidden="true" />Anat.</span>
            <span
              className={`badge rounded-pill ${allAnatomicalSelected ? 'bg-white text-primary' : 'bg-primary text-white'}`}
              style={{ fontSize: '8px', padding: '1px 5px' }}
            >
              {anatomicalCount}/{ANATOMICAL_EXTRA_IDS.length}
            </span>
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-transparent border-secondary-subtle px-2" style={{ fontSize: '11px' }}>
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            type="text"
            className="form-control form-control-sm bg-transparent border-secondary-subtle text-dark"
            placeholder="Filtrer (ex: Zoe, Alex, Sophia...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: isMobile ? '12px' : '11px' }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-2"
              onClick={() => setSearchQuery('')}
              style={{ fontSize: '10px' }}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Liste interactive multi-sélection avec checkboxes et tags */}
        <div 
          className="d-flex flex-column gap-1 pe-1 border rounded bg-white"
        >
            {filteredCharacters.length === 0 ? (
              <div className="p-3 text-center text-muted" style={{ fontSize: '11px' }}>
                Aucun personnage ne correspond à "{searchQuery}"
              </div>
            ) : (
              filteredCharacters.map(char => {
                const isSelected = activeExtraIds.includes(char.id);
                const isPlayer = char.id === activeCharacterId;

                return (
                  <label
                    key={char.id}
                    className={`d-flex align-items-center justify-content-between p-1 px-2 rounded cursor-pointer border-bottom border-light ${
                      isSelected ? 'bg-primary-subtle' : 'hover-bg-light'
                    }`}
                    style={{ 
                      cursor: 'pointer',
                      fontSize: isMobile ? '13px' : '11px',
                      userSelect: 'none',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={isSelected}
                        onChange={() => toggleExtraCharacter(char.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px' }}>{char.emoji}</span>
                      <span className={isSelected ? 'fw-bold text-dark' : 'text-dark'}>
                        {char.name}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      {isPlayer && (
                        <span className="badge bg-info text-dark" style={{ fontSize: '8px' }}>
                          JOUEUR
                        </span>
                      )}
                      <span 
                        className="badge rounded-pill" 
                        style={{ 
                          backgroundColor: char.color, 
                          width: '8px', 
                          height: '8px', 
                          padding: 0,
                          display: 'inline-block' 
                        }}
                        title={`Couleur: ${char.color}`}
                      />
                    </div>
                  </label>
                );
              })
            )}
          </div>

        {/* Chips / pilules des personnages actifs avec suppression rapide */}
        {activeExtraIds.length > 0 && (
          <div className="d-flex flex-column gap-1 pt-1 border-top border-secondary-subtle">
            <div className="text-muted d-flex justify-content-between align-items-center" style={{ fontSize: '9px' }}>
              <span>SÉLECTION ACTUELLE ({activeExtraIds.length}) :</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                style={{ fontSize: '9px' }}
                onClick={() => clearExtraCharacters()}
              >
                Vider
              </button>
            </div>
            <div className="d-flex flex-wrap gap-1">
              {activeExtraIds.map(id => {
                const char = findCharacter(id);
                return (
                  <span
                    key={id}
                    className="badge bg-secondary-subtle text-dark border d-flex align-items-center gap-1 py-1 px-2"
                    style={{ fontSize: '9px', fontWeight: 500 }}
                  >
                    <span>{char ? npcLabel(char) : id}</span>
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-1"
                      style={{ width: '6px', height: '6px', padding: 0, filter: 'invert(0.5)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExtraCharacter(id);
                      }}
                      title={`Retirer ${char?.name || id}`}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
