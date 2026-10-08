import { useId, useRef } from 'react';
import { CHARACTERS } from './characterConfig';
import { useSceneStore } from './store/useSceneStore';
import { getActiveSceneCharactersCount } from './character/laraGridUtils';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';

export function CharacterCountSelect() {
  const id = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const count = useSceneStore(s => s.layers.character && s.layers.showAllLaraStyles ? getActiveSceneCharactersCount(s) : 0);
  const setLaraCount = useSceneStore(s => s.setLaraCount);

  return (
    <>
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
        {...{ popovertarget: id }}
        title="Choisir le nombre de personnages"
        aria-label="Choisir le nombre de personnages"
        onClick={event => {
          const rect = event.currentTarget.getBoundingClientRect();
          const popover = popoverRef.current!;
          popover.style.left = `${rect.left}px`;
          popover.style.bottom = `${window.innerHeight - rect.top}px`;
        }}
      >
        <i className="bi bi-people-fill" aria-hidden="true" />
        <span>{count === CHARACTERS.length ? 'All' : count}</span>
        <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>
      <div
        ref={popoverRef}
        id={id}
        {...{ popover: 'auto' }}
        role="dialog"
        aria-label="Nombre de personnages"
        className="view-control-bar__character-popover glass-card rounded-2 border shadow-lg p-2"
        onKeyDown={event => event.stopPropagation()}
      >
        <div className="small fw-semibold mb-1">
          Nombre de personnages
        </div>
        <div className="view-control-bar__character-options d-grid gap-1" role="group" aria-label="Choisir le nombre de personnages">
          {Array.from({ length: CHARACTERS.length + 1 }, (_, index) => index).map(value => {
            const selected = value === count;
            return (
              <button
                key={value}
                type="button"
                className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                aria-pressed={selected}
                onClick={() => {
                  setLaraCount(value);
                  popoverRef.current!.hidePopover();
                }}
              >
                {value === CHARACTERS.length ? 'All' : value}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
