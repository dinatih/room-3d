import { useState, useMemo, ChangeEvent } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { EXTRA_CHARACTERS, findCharacter, npcLabel } from '@features/scene/walkerConfig';

interface ExtraCharactersSelectorProps {
  isMobile: boolean;
  onToggleLayer: (key: any) => void;
  extraCharactersEnabled: boolean;
}

export function ExtraCharactersSelector({
  isMobile,
  onToggleLayer,
  extraCharactersEnabled,
}: ExtraCharactersSelectorProps) {
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const toggleExtraCharacter = useSceneStore(state => state.toggleExtraCharacter);
  const selectAllExtraCharacters = useSceneStore(state => state.selectAllExtraCharacters);
  const clearExtraCharacters = useSceneStore(state => state.clearExtraCharacters);
  const randomizeExtraCharacters = useSceneStore(state => state.randomizeExtraCharacters);
  const setActiveExtraIds = useSceneStore(state => state.setActiveExtraIds);

  const [searchQuery, setSearchQuery] = useState('');
  const [useNativeSelect, setUseNativeSelect] = useState(false);

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return EXTRA_CHARACTERS;
    const query = searchQuery.toLowerCase().trim();
    return EXTRA_CHARACTERS.filter(
      c => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query) || c.emoji.includes(query)
    );
  }, [searchQuery]);

  const activeCount = activeExtraIds.length;
  const totalCount = EXTRA_CHARACTERS.length;

  const handleNativeSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setActiveExtraIds(selected);
  };

  return (
    <div className="p-2 border-top bg-transparent d-flex flex-column gap-2 mt-2">
      {/* En-tête avec switch principal */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🎭 Personnages Hors-Série (Extra)
        </div>
        <span className={`badge ${extraCharactersEnabled && activeCount > 0 ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {extraCharactersEnabled ? `${activeCount} / ${totalCount} actifs` : 'DÉSACTIVÉ'}
        </span>
      </div>

      {/* Bouton Toggle Global */}
      <button 
        type="button"
        className="btn btn-light w-100 text-start rounded border py-2 px-3 text-dark d-flex align-items-center justify-content-between shadow-none"
        onClick={() => onToggleLayer('extraCharacters')}
        title="Activer/Désactiver l'affichage des personnages extra (Raccourci: E)"
        style={{ 
          fontSize: isMobile ? '13px' : '11px',
          background: extraCharactersEnabled ? 'rgba(13, 110, 253, 0.08)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: extraCharactersEnabled ? 'rgba(13, 110, 253, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          fontWeight: extraCharactersEnabled ? 600 : 400
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span>🎭</span>
          <span>Afficher les Personnages Extra</span>
          <kbd className="bg-secondary text-white px-1 rounded" style={{ fontSize: '9px' }}>E</kbd>
        </div>
        <span className={`badge ${extraCharactersEnabled ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {extraCharactersEnabled ? 'ON' : 'OFF'}
        </span>
      </button>

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
              ✅ Tous ({totalCount})
            </button>
            <button
              type="button"
              className="btn btn-outline-warning btn-sm py-0 px-2 text-nowrap text-dark"
              style={{ fontSize: '10px' }}
              onClick={() => randomizeExtraCharacters(5)}
              title="Sélectionner 5 personnages extra au hasard"
            >
              🎲 5 au hasard
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 text-nowrap"
              style={{ fontSize: '10px' }}
              onClick={() => clearExtraCharacters()}
              title="Désélectionner tous les personnages extra"
            >
              ❌ Aucun
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm py-0 px-2"
            style={{ fontSize: '10px' }}
            onClick={() => setUseNativeSelect(prev => !prev)}
            title={useNativeSelect ? "Basculer vers la liste interactive avec cases à cocher" : "Basculer vers le select multiple HTML natif"}
          >
            {useNativeSelect ? '📋 Vue Liste' : '🔽 Select HTML'}
          </button>
        </div>

        {/* Barre de recherche (en vue liste) */}
        {!useNativeSelect && (
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-transparent border-secondary-subtle px-2" style={{ fontSize: '11px' }}>
              🔍
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
                ✕
              </button>
            )}
          </div>
        )}

        {/* Vue 1 : <select multiple> natif standard */}
        {useNativeSelect ? (
          <div>
            <div className="text-muted mb-1" style={{ fontSize: '9px' }}>
              ℹ️ Maintenez <kbd>Ctrl</kbd> (ou <kbd>Cmd</kbd>) pour sélectionner plusieurs personnages :
            </div>
            <select
              multiple
              className="form-select form-select-sm bg-white text-dark border-secondary-subtle"
              size={Math.min(8, EXTRA_CHARACTERS.length)}
              value={activeExtraIds}
              onChange={handleNativeSelectChange}
              style={{ fontSize: isMobile ? '13px' : '11px' }}
            >
              {EXTRA_CHARACTERS.map(char => (
                <option key={char.id} value={char.id} className="py-1">
                  {char.emoji} {char.name} {char.id === activeWalkerId ? '(Joueur actif)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* Vue 2 : Liste interactive multi-sélection avec checkboxes et tags */
          <div 
            className="d-flex flex-column gap-1 overflow-auto pe-1 border rounded bg-white"
            style={{ maxHeight: '180px' }}
          >
            {filteredCharacters.length === 0 ? (
              <div className="p-3 text-center text-muted" style={{ fontSize: '11px' }}>
                Aucun personnage ne correspond à "{searchQuery}"
              </div>
            ) : (
              filteredCharacters.map(char => {
                const isSelected = activeExtraIds.includes(char.id);
                const isPlayer = char.id === activeWalkerId;

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
        )}

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
            <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '60px', overflowY: 'auto' }}>
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
