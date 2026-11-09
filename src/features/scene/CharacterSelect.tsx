import { isRobotSubjectVisible, useRobotVisibility } from './store/useRobotVisibility';
import { CAMERA_SUBJECTS, selectAnimalCameraTarget, selectSceneSubject } from './camera/cameraSubjects';
import { cameraState } from './cameraState';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHARACTERS, findCharacter, npcLabel, isCharacterVisibleInMode } from './characterConfig';
import { useSceneStore } from './store/useSceneStore';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';

export function CharacterSelect({ hideUI = false, value, onChange, characters = CHARACTERS, label = 'Choisir un sujet' }: {
  hideUI?: boolean;
  value?: string;
  onChange?: (id: string) => void;
  characters?: typeof CHARACTERS;
  label?: string;
}) {
  const visibleRobots = useRobotVisibility(state => state.visible);
  const sceneCharacterId = useSceneStore(state => state.activeCharacterId);
  const animalTarget = useSceneStore(selectAnimalCameraTarget);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const activeCharacterId = value ?? (onChange ? sceneCharacterId : animalTarget ?? sceneCharacterId);
  const activeChar = findCharacter(activeCharacterId);
  const activeSubject = CAMERA_SUBJECTS.find(c => c.id === activeCharacterId);
  const groups = [
    { label: 'Personnages', choices: characters.map(c => ({ id: c.id, label: npcLabel(c), cameraSubject: 'character', available: true })) },
    ...(onChange ? [] : ['Robots', 'Animaux'].map(category => ({ label: category, choices: CAMERA_SUBJECTS.filter(c => c.category === category && isRobotSubjectVisible(c.id, visibleRobots)).map(c => ({ ...c, label: c.label, cameraSubject: c.id, available: availableSubjects.includes(c.id) })) }))),
  ];
  const layers = useSceneStore(state => state.layers);
  const activeMainIds = useSceneStore(state => state.activeMainIds);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const visibleCharacterIds = new Set(CHARACTERS.filter(c =>
    layers.character && layers.showAllLaraStyles && isCharacterVisibleInMode(
      c.id, layers.laraCount, activeCharacterId, layers.extraCharacters ?? false,
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
      if (isOpen) popover.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not(:disabled)')?.focus();
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
        popoverTarget={characterPopoverId}
        aria-haspopup="dialog"
        aria-expanded={characterPopoverOpen}
        aria-controls={characterPopoverId}
        onClick={(e) => {
          e.stopPropagation();
          setAvailableSubjects(Object.keys(cameraState.animalViews));
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
        title={label}
        aria-label={label}
      >
        <span>{!activeChar && activeSubject && <i className={`bi ${activeSubject.icon} me-1`} aria-hidden="true" />}{activeChar ? npcLabel(activeChar) : activeSubject?.label ?? activeCharacterId}</span>
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
            <i className="bi bi-people text-primary" aria-hidden="true" />
            Choisir un sujet
          </h2>
          <div className="popover-body p-2">
            <div className="small text-body-secondary d-flex align-items-center gap-1 mb-2">
              <i className="bi bi-eye-fill text-success" aria-hidden="true" />
              Affiché dans la scène
            </div>
            {groups.map(group => <div key={group.label}>
              <h3 className="small fw-semibold mt-2">{group.label}</h3>
              <div className="row row-cols-2 g-1">
              {group.choices.map(c => (
                <div key={c.id} className="col">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 d-flex align-items-center justify-content-between gap-1 text-start ${c.id === activeCharacterId ? 'btn-primary' : 'btn-light'}`}
                    aria-pressed={c.id === activeCharacterId}
                    disabled={!c.available}
                    title={!c.available ? 'Non disponible dans la scène' : visibleCharacterIds.has(c.id) || availableSubjects.includes(c.id) ? 'Affiché dans la scène' : 'Non affiché dans la scène'}
                    onClick={() => {
                      if (onChange) onChange(c.id);
                      else selectSceneSubject(c.id, c.cameraSubject);
                      characterPopoverRef.current!.hidePopover();
                    }}
                  >
                    <span>{c.label}</span>
                    <span className="d-flex align-items-center gap-1 flex-shrink-0">
                      {(visibleCharacterIds.has(c.id) || availableSubjects.includes(c.id)) && (
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
            </div>)}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
