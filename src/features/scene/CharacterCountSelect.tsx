import { useId, useRef } from 'react';
import { LARA_COUNT_MODES } from './characterConfig';
import { useSceneStore } from './store/useSceneStore';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';

export function CharacterCountSelect() {
  const id = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const characterVisible = useSceneStore(s => s.layers.character);
  const count = useSceneStore(s => s.layers.laraCount ?? 4);
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
        <span>{characterVisible ? count : 0}</span>
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
        <div className="d-flex flex-column gap-1" role="group" aria-label="Choisir le nombre de personnages">
          {([0, ...LARA_COUNT_MODES] as const).map(value => {
            const selected = value === (characterVisible ? count : 0);
            return (
              <button
                key={value}
                type="button"
                className={`btn btn-sm text-start ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                aria-pressed={selected}
                onClick={() => {
                  setLaraCount(value);
                  popoverRef.current!.hidePopover();
                }}
              >
                {value}{value === 0 ? ' — Masquer les personnages' : value === 1 ? ' — Xbot seul' : value === 2 ? ' — Duo' : value === 10 ? ' — Éco' : value === 15 ? ' — Tous' : ''}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
