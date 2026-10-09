import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHARACTERS, findCharacter, npcLabel, isCharacterVisibleInMode } from './characterConfig';
import { useSceneStore } from './store/useSceneStore';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';

export function CharacterSelect({ hideUI = false }: { hideUI?: boolean }) {
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const activeChar = findCharacter(activeCharacterId);
  const layers = useSceneStore(state => state.layers);
  const activeMainIds = useSceneStore(state => state.activeMainIds);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const visibleCharacterIds = new Set(CHARACTERS.filter(c =>
    layers.character && layers.showAllLaraStyles && isCharacterVisibleInMode(
      c.id, layers.laraCount ?? 4, activeCharacterId, layers.extraCharacters ?? false,
      activeExtraIds, activeMainIds,
    )
  ).map(c => c.id));

  const characterPopoverId = useId();
  const characterPopoverRef = useRef<HTMLDivElement>(null);
  const [characterPopoverOpen, setCharacterPopoverOpen] = useState(false);

  useEffect(() => {
    const popover = characterPopoverRef.current;
    if (!popover) return;
    const onToggle = () => {
      const isOpen = popover.matches(':popover-open');
      setCharacterPopoverOpen(isOpen);
      if (isOpen) popover.querySelector<HTMLButtonElement>('[aria-pressed="true"]')!.focus();
    };
    const closePopover = () => popover.hidePopover();
    popover.addEventListener('toggle', onToggle);
    window.addEventListener('resize', closePopover);
    return () => {
      popover.removeEventListener('toggle', onToggle);
      window.removeEventListener('resize', closePopover);
    };
  }, []);

  useEffect(() => {
    if (hideUI) {
      characterPopoverRef.current?.hidePopover();
      setCharacterPopoverOpen(false);
    }
  }, [hideUI]);

  return (
    <>
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary view-control-bar__npc-trigger`}
        style={{ borderColor: activeChar?.color }}
        {...{ popovertarget: characterPopoverId }}
        aria-haspopup="dialog"
        aria-expanded={characterPopoverOpen}
        aria-controls={characterPopoverId}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const popover = characterPopoverRef.current!;
          const popoverWidth = parseFloat(getComputedStyle(popover).width);
          const above = rect.top > window.innerHeight / 2;
          popover.style.top = above ? 'auto' : `${rect.bottom + 8}px`;
          popover.style.bottom = above ? `${window.innerHeight - rect.top + 8}px` : 'auto';
          popover.style.right = `${Math.min(Math.max(8, window.innerWidth - rect.right), window.innerWidth - popoverWidth - 8)}px`;
          popover.style.maxHeight = `${(above ? rect.top : window.innerHeight - rect.bottom) - 16}px`;
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Changer le PNJ sélectionné"
      >
        <span>{activeChar ? npcLabel(activeChar) : activeCharacterId}</span>
        <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>
      {createPortal(
        <div
          ref={characterPopoverRef}
          id={characterPopoverId}
          {...{ popover: 'auto' }}
          role="dialog"
          aria-labelledby={`${characterPopoverId}-title`}
          className="popover view-control-bar__npc-popover glass-card shadow-lg"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <h2 id={`${characterPopoverId}-title`} className="popover-header bg-transparent small fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-people" aria-hidden="true" />
            Choisir un PNJ
          </h2>
          <div className="popover-body p-2">
            <div className="small text-body-secondary d-flex align-items-center gap-1 mb-2">
              <i className="bi bi-eye-fill text-success" aria-hidden="true" />
              Affiché dans la scène
            </div>
            <div className="row row-cols-2 g-1">
              {CHARACTERS.map(c => (
                <div key={c.id} className="col">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 d-flex align-items-center justify-content-between gap-1 text-start ${c.id === activeCharacterId ? 'btn-primary' : 'btn-light'}`}
                    aria-pressed={c.id === activeCharacterId}
                    title={visibleCharacterIds.has(c.id) ? 'Affiché dans la scène' : 'Non affiché dans la scène'}
                    onClick={() => {
                      useSceneStore.getState().setActiveCharacterId(c.id);
                      characterPopoverRef.current!.hidePopover();
                    }}
                  >
                    <span>{npcLabel(c)}</span>
                    <span className="d-flex align-items-center gap-1 flex-shrink-0">
                      {visibleCharacterIds.has(c.id) && (
                        <>
                          <i className={`bi bi-eye-fill ${c.id === activeCharacterId ? '' : 'text-success'}`} aria-hidden="true" />
                          <span className="visually-hidden">Affiché dans la scène</span>
                        </>
                      )}
                      {c.id === activeCharacterId && <i className="bi bi-check-lg" aria-hidden="true" />}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
