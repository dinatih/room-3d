import { useId, useRef, useState } from 'react';
import { CHARACTERS, LARA_COUNT_MODES } from './characterConfig';
import { useSceneStore } from './store/useSceneStore';
import { getActiveSceneCharactersCount } from './character/characterGridUtils';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
import { NonExtraCharactersSelector } from './sidepanel/sections/NonExtraCharactersSelector';
import { ExtraCharactersSelector } from './sidepanel/sections/ExtraCharactersSelector';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const PRESETS = [
  { count: 0, label: '0', description: 'Masquer les personnages' },
  ...LARA_COUNT_MODES.map(count => ({
    count,
    label: String(count),
    description: count === 1 ? 'Xbot seul' : count === 2 ? 'Duo' : count === 4 ? 'Xbot et trois Laras' : count === 10 ? 'Éco' : 'Toutes les Laras et Xbot',
  })),
  { count: CHARACTERS.length, label: 'All', description: 'Tous les personnages, extras compris' },
];

export function CharacterCountSelect() {
  const id = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'presets' | 'laras' | 'extra'>('presets');
  const isMobile = useIsMobile();
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
          popover.style.maxWidth = `${window.innerWidth - rect.left}px`;
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
        className="view-control-bar__character-popover glass-card rounded-2 border shadow-lg"
        onKeyDown={event => event.stopPropagation()}
      >
        <div className="view-control-bar__character-panel d-flex flex-column">
          <div className="p-2 border-bottom small fw-semibold">Nombre de personnages</div>
          <div className="view-control-bar__character-content overflow-y-auto p-2 flex-grow-1">
            <div id={`${id}-presets-panel`} role="tabpanel" aria-labelledby={`${id}-presets-tab`} hidden={tab !== 'presets'}>
              <div className="d-flex flex-column gap-1">
                {PRESETS.map(preset => (
                  <button
                    key={preset.count}
                    type="button"
                    className={`btn btn-sm text-start ${preset.count === count ? 'btn-primary' : 'btn-outline-secondary'}`}
                    aria-pressed={preset.count === count}
                    onClick={() => {
                      setLaraCount(preset.count);
                      popoverRef.current!.hidePopover();
                    }}
                  >
                    <span className="fw-semibold">{preset.label}</span> — {preset.description}
                  </button>
                ))}
              </div>
            </div>
            <div id={`${id}-laras-panel`} role="tabpanel" aria-labelledby={`${id}-laras-tab`} hidden={tab !== 'laras'}>
              <NonExtraCharactersSelector isMobile={isMobile} compact />
            </div>
            <div id={`${id}-extra-panel`} role="tabpanel" aria-labelledby={`${id}-extra-tab`} hidden={tab !== 'extra'}>
              <ExtraCharactersSelector isMobile={isMobile} compact />
            </div>
          </div>
          <div className="nav nav-pills nav-fill border-top p-1 gap-1 flex-shrink-0" role="tablist" aria-label="Sélection des personnages">
            {(['presets', 'laras', 'extra'] as const).map(value => (
              <button
                key={value}
                id={`${id}-${value}-tab`}
                type="button"
                role="tab"
                className={`nav-link py-1 px-2 small ${tab === value ? 'active' : ''}`}
                aria-selected={tab === value}
                aria-controls={`${id}-${value}-panel`}
                onClick={() => setTab(value)}
              >
                {value === 'presets' ? 'Presets' : value === 'laras' ? 'Laras' : 'Extra'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
