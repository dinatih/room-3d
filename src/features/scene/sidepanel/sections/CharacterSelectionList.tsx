import { useState, useMemo } from 'react';
import type { CharacterConfig } from '@features/scene/characterConfig';
import { useSceneStore } from '../../store/useSceneStore';

interface CharacterSelectionListProps {
  characters: readonly CharacterConfig[];
  activeIds: readonly string[];
  onToggle: (id: string) => void;
  isMobile: boolean;
  placeholder: string;
}

export function CharacterSelectionList({ characters, activeIds, onToggle, isMobile, placeholder }: CharacterSelectionListProps) {
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const setActiveCharacterId = useSceneStore(state => state.setActiveCharacterId);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCharacters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query ? characters.filter(c => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query) || c.emoji.includes(query)) : characters;
  }, [characters, searchQuery]);

  return (
    <>
      {/* Barre de recherche */}
      <div className="input-group input-group-sm">
        <span className="input-group-text bg-transparent border-secondary-subtle px-2" style={{ fontSize: '11px' }}>
          <i className="bi bi-search" aria-hidden="true" />
        </span>
        <input
          type="text"
          className="form-control form-control-sm bg-transparent border-secondary-subtle text-dark"
          placeholder={placeholder}
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
            const isSelected = activeIds.includes(char.id);
            const isPlayer = char.id === activeCharacterId;

            return (
              <div
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
                <label className="d-flex align-items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={isSelected}
                    onChange={() => onToggle(char.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px' }}>{char.emoji}</span>
                  <span className={isSelected ? 'fw-bold text-dark' : 'text-dark'}>
                    {char.name}
                  </span>
                </label>

                <div className="d-flex align-items-center gap-1">
                  {char.id === 'xbot' && (
                    <span className="badge bg-secondary" style={{ fontSize: '8px' }}>
                      ROBOT
                    </span>
                  )}
                  <button
                    type="button"
                    className={`btn btn-sm py-0 px-2 ${isPlayer ? 'btn-info' : 'btn-outline-info'}`}
                    aria-label={`Contrôler ${char.name}`}
                    aria-pressed={isPlayer}
                    onClick={() => setActiveCharacterId(char.id)}
                  >
                    {isPlayer ? 'JOUEUR' : 'Contrôler'}
                  </button>
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
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
