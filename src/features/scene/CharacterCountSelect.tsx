import { useId, useRef } from 'react';
import { LARA_COUNT_MODES, type LaraCountMode } from './characterConfig';
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
        <label htmlFor={`${id}-select`} className="form-label small fw-semibold mb-1">
          Nombre de personnages
        </label>
        <select
          id={`${id}-select`}
          className="form-select form-select-sm"
          value={characterVisible ? count : 0}
          onChange={event => {
            setLaraCount(Number(event.target.value) as LaraCountMode | 0);
            popoverRef.current!.hidePopover();
          }}
        >
          <option value={0}>0 — Masquer les personnages</option>
          {LARA_COUNT_MODES.map(value => (
            <option key={value} value={value}>
              {value}{value === 1 ? ' — Xbot seul' : value === 2 ? ' — Duo' : value === 10 ? ' — Éco' : value === 15 ? ' — Tous' : ''}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
