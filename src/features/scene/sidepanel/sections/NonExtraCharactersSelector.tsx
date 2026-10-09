import { useState, useMemo } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import {
  NON_EXTRA_CHARACTERS,
  type LaraCountMode,
  findCharacter,
} from '@features/scene/characterConfig';

interface NonExtraCharactersSelectorProps {
  isMobile: boolean;
  compact?: boolean;
}

export function NonExtraCharactersSelector({
  isMobile,
  compact = false,
}: NonExtraCharactersSelectorProps) {
  const activeMainIds = useSceneStore(state => state.activeMainIds);
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const toggleMainCharacter = useSceneStore(state => state.toggleMainCharacter);
  const selectAllMainCharacters = useSceneStore(state => state.selectAllMainCharacters);
  const clearMainCharacters = useSceneStore(state => state.clearMainCharacters);
  const setLaraCount = useSceneStore(state => state.setLaraCount);
  const currentLaraCount = useSceneStore(state => state.layers.laraCount ?? (isMobile ? 2 : 15));

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return NON_EXTRA_CHARACTERS;
    const query = searchQuery.toLowerCase().trim();
    return NON_EXTRA_CHARACTERS.filter(
      c => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query) || c.emoji.includes(query)
    );
  }, [searchQuery]);

  const activeCount = activeMainIds.length;
  const totalCount = NON_EXTRA_CHARACTERS.length;

  return (
    <div className={`${compact ? '' : 'p-2 border-top mt-2'} bg-transparent d-flex flex-column gap-2`}>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted fw-semibold text-dark small text-uppercase" style={{ fontSize: '9px' }}>
          <i className="bi bi-people-fill me-1" aria-hidden="true" />Personnages Principaux (Laras & Xbot)
        </div>
        <span className={`badge ${activeCount > 0 ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {activeCount} / {totalCount} actifs
        </span>
      </div>

      {/* Panneau de sélection multiple */}
      <div className="p-2 rounded bg-light-subtle border border-secondary-subtle d-flex flex-column gap-2">
        {/* Presets par défaut (1, 2, 4, 10, 15) */}
        {!compact && <div>
          <div className="text-muted mb-1" style={{ fontSize: '9px' }}>
            PRÉRÉGLAGES RAPIDES :
          </div>
          <div className="btn-group btn-group-sm w-100" role="group">
            {([1, 2, 4, 10, 15] as LaraCountMode[]).map(count => (
              <button
                key={count}
                type="button"
                className={`btn btn-sm ${currentLaraCount === count && activeCount === count ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
                style={{ fontSize: '10px', background: currentLaraCount === count && activeCount === count ? undefined : 'transparent' }}
                onClick={() => setLaraCount(count)}
                title={`Charger le preset par défaut de ${count} personnage(s)`}
              >
                {count === 1 ? '1 (Xbot)' : count === 2 ? '2 (Duo)' : count === 15 ? '15 (Tous)' : count}
              </button>
            ))}
          </div>
        </div>}

        {/* Actions rapides Tous / Aucun */}
        <div className="d-flex flex-wrap gap-1 justify-content-between align-items-center">
          <div className="btn-group btn-group-sm flex-grow-1" role="group">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm py-0 px-2 text-nowrap"
              style={{ fontSize: '10px' }}
              onClick={() => selectAllMainCharacters()}
              title={`Afficher la totalité des ${totalCount} personnages principaux`}
            >
              <i className="bi bi-check-all me-1" aria-hidden="true" />Toutes ({totalCount})
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 text-nowrap"
              style={{ fontSize: '10px' }}
              onClick={() => clearMainCharacters()}
              title="Désélectionner tous les personnages principaux"
            >
              <i className="bi bi-x-lg me-1" aria-hidden="true" />Aucune
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-transparent border-secondary-subtle px-2" style={{ fontSize: '11px' }}>
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            type="text"
            className="form-control form-control-sm bg-transparent border-secondary-subtle text-dark"
            placeholder="Filtrer (ex: Native, Rosanna, Delphina, Xbot...)"
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
              const isSelected = activeMainIds.includes(char.id);
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
                      onChange={() => toggleMainCharacter(char.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px' }}>{char.emoji}</span>
                    <span className={isSelected ? 'fw-bold text-dark' : 'text-dark'}>
                      {char.name}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    {char.id === 'xbot' && (
                      <span className="badge bg-secondary" style={{ fontSize: '8px' }}>
                        ROBOT
                      </span>
                    )}
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
        {!compact && activeMainIds.length > 0 && (
          <div className="d-flex flex-column gap-1 pt-1 border-top border-secondary-subtle">
            <div className="text-muted d-flex justify-content-between align-items-center" style={{ fontSize: '9px' }}>
              <span>SÉLECTION ACTUELLE ({activeMainIds.length}) :</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                style={{ fontSize: '9px' }}
                onClick={() => clearMainCharacters()}
              >
                Vider
              </button>
            </div>
            <div className="d-flex flex-wrap gap-1">
              {activeMainIds.map(id => {
                const char = findCharacter(id);
                return (
                  <span
                    key={id}
                    className="badge bg-secondary-subtle text-dark border d-flex align-items-center gap-1 py-1 px-2"
                    style={{ fontSize: '9px', fontWeight: 500 }}
                  >
                    <span>{char ? char.emoji : <i className="bi bi-person-fill" aria-hidden="true" />}</span>
                    <span>{char ? char.name : id}</span>
                    <button
                      type="button"
                      className="btn-close ms-1"
                      style={{ fontSize: '6px' }}
                      aria-label="Retirer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMainCharacter(id);
                      }}
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
