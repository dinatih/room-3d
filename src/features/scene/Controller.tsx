/** Commandes communes au clavier, à la souris et au tactile. */
import { isRobotSubjectVisible, useRobotVisibility } from './store/useRobotVisibility';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { cameraState } from './cameraState';
import { useDroneControlStore } from './droneControls';
import { ORBIT_CAMERA_LERP } from './camera/cameraConstants';
import { ALL_HAIR_COLORS } from './sidepanel/types';
import { CAMERA_SUBJECTS, CHARACTER_CONTROL_ANIMATIONS, isFlyingSubject, selectAnimalCameraTarget } from './camera/cameraSubjects';
import { selectSceneSubject } from './camera/selectSceneSubject';
import { getAnimationDef } from './animations/animationResolver';
import { PanelPopover } from './sidepanel/PanelPopover';
import { CHARACTERS, npcLabel } from './characterConfig';
import './Controller.scss';

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

const DIRECTIONS: Array<{ key: ArrowKey; icon: string; label: string; position: string }> = [
  { key: 'ArrowUp', icon: 'bi-arrow-up', label: 'Avancer', position: 'up' },
  { key: 'ArrowLeft', icon: 'bi-arrow-left', label: 'Tourner à gauche', position: 'left' },
  { key: 'ArrowRight', icon: 'bi-arrow-right', label: 'Tourner à droite', position: 'right' },
  { key: 'ArrowDown', icon: 'bi-arrow-down', label: 'Reculer', position: 'down' },
];

const EXTRA_CAMERA_CONTROLS = [
  { key: 'Elevate', icon: 'bi-arrow-bar-up', label: 'Élever la caméra', position: 'elevate' },
  { key: 'Descend', icon: 'bi-arrow-bar-down', label: 'Descendre la caméra', position: 'descend' },
] as const;

function fire(key: string, pressed: boolean) {
  document.dispatchEvent(new CustomEvent('camera-direction-input', { detail: { key, pressed } }));
}

export function Controller({ visible = false }: { visible?: boolean }) {
  const visibleRobots = useRobotVisibility(state => state.visible);
  const piloting = useDroneControlStore(state => state.piloting);
  const mode = useSceneStore(state => state.cameraMode);
  const target = useSceneStore(state => state.cameraTarget);
  const control = useSceneStore(state => state.arrowControl);
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const wigGrid = useSceneStore(state => state.layers.wigGrid);
  const wigGridHairColor = useSceneStore(state => state.wigGridHairColor);
  const selectControl = useSceneStore(state => state.selectArrowControl);
  const animal = useSceneStore(selectAnimalCameraTarget);
  const [availableSubjects, setAvailableSubjects] = useState(() => Object.keys(cameraState.animalViews));
  const activeKeys = useRef(new Set<string>());
  const zoomFrame = useRef<number | null>(null);
  const zoomRemaining = useRef(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [pointerZoom, setPointerZoom] = useState<'in' | 'out' | null>(null);

  const releaseKey = useCallback((key: string) => {
    if (!activeKeys.current.delete(key)) return;
    fire(key, false);
  }, []);

  const cancelZoom = useCallback(() => {
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current);
    zoomFrame.current = null;
    zoomRemaining.current = 0;
  }, []);

  const zoom = useCallback((direction: 'in' | 'out') => {
    zoomRemaining.current += direction === 'in' ? 1 : -1;
    if (zoomFrame.current !== null) return;
    let previousTime = performance.now();
    const step = () => {
      const time = performance.now();
      const remaining = zoomRemaining.current;
      const amount = Math.abs(remaining) <= Number.EPSILON
        ? remaining : remaining * (1 - Math.pow(1 - ORBIT_CAMERA_LERP, (time - previousTime) * 60 / 1000));
      previousTime = time;
      zoomRemaining.current -= amount;
      if (amount !== 0) document.dispatchEvent(new CustomEvent('camera-zoom', {
        detail: { direction: amount > 0 ? 'in' : 'out', scope: 'scene', amount: Math.abs(amount) },
      }));
      zoomFrame.current = zoomRemaining.current === 0 ? null : requestAnimationFrame(step);
    };
    zoomFrame.current = requestAnimationFrame(step);
  }, []);

  const releaseAll = useCallback(() => {
    cancelZoom();
    setPointerZoom(null);
    activeKeys.current.forEach(key => fire(key, false));
    activeKeys.current.clear();
    setPressedKeys(new Set());
    document.dispatchEvent(new Event('camera-controls-release'));
  }, [cancelZoom]);

  useEffect(() => {
    const onZoom = (event: Event) => {
      if ((event as CustomEvent<{ amount?: number }>).detail.amount === undefined) cancelZoom();
    };
    document.addEventListener('camera-zoom', onZoom);
    window.addEventListener('wheel', cancelZoom, { passive: true });
    return () => {
      document.removeEventListener('camera-zoom', onZoom);
      window.removeEventListener('wheel', cancelZoom);
      cancelZoom();
    };
  }, [cancelZoom]);

  useEffect(() => {
    const onArrowKeys = (event: Event) => setPressedKeys(new Set((event as CustomEvent<string[]>).detail));
    const eventName = piloting ? 'drone-arrow-keys' : 'camera-arrow-keys';
    document.addEventListener(eventName, onArrowKeys);
    return () => document.removeEventListener(eventName, onArrowKeys);
  }, [piloting]);

  useEffect(() => {
    releaseAll();
  }, [visible, mode, target, control, activeCharacterId, animal, piloting, releaseAll]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) releaseAll(); };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', onVisibility);
      releaseAll();
    };
  }, [releaseAll]);

  if (!visible) return null;
  const moving = control === 'character';
  const orbiting = mode === 'orbit' || mode === 'follow' || Boolean(animal);
  const targets = [
    { target: 'character', label: 'Personnage', icon: 'bi-person' },
    { target: 'studio', label: 'Appartement', icon: 'bi-building' },
  ] as const;
  const subjectId = animal ?? (mode === 'follow' || mode === 'fpv' ? 'character' : '');
  const subjects = [
    ...CHARACTERS.map(character => ({ id: character.id, label: npcLabel(character), icon: 'bi-person-bounding-box', cameraSubject: 'character' })),
    ...CAMERA_SUBJECTS.filter(choice => choice.id !== 'character' && isRobotSubjectVisible(choice.id, visibleRobots)).map(choice => ({ ...choice, cameraSubject: choice.id })),
  ];
  const selectedSubjectId = subjectId === 'character' ? activeCharacterId : subjectId;
  const subject = subjects.find(choice => choice.id === (animal ?? activeCharacterId)) ?? CAMERA_SUBJECTS[0];
  const refreshSubjects = () => setAvailableSubjects(Object.keys(cameraState.animalViews));
  const pickSubject = (choice: typeof subjects[number], button: HTMLButtonElement) => {
    releaseAll();
    selectSceneSubject(choice.id, choice.cameraSubject);
    (button.closest('[popover]') as HTMLDivElement).hidePopover();
  };

  return (
    <div className="game-controller d-flex flex-column align-items-center gap-1">
      {wigGrid && (
        <div className="glass-card d-flex align-items-center gap-2 p-2 mb-4 rounded-2" role="toolbar" aria-label="Perruques">
          <label htmlFor="wig-grid-color" className="small text-nowrap">Couleur</label>
          <select
            id="wig-grid-color"
            className="form-select form-select-sm w-auto"
            value={wigGridHairColor}
            onChange={event => {
              useSceneStore.setState({ wigGridHairColor: event.target.value });
              cameraState.invalidate?.();
            }}
          >
            <option value="">Couleur d’origine</option>
            {ALL_HAIR_COLORS.map(color => <option key={color} value={color}>{color}</option>)}
          </select>
        </div>
      )}
      <div className="position-relative d-flex justify-content-between align-items-start gap-3 w-100">
        <div className="position-absolute top-0 start-50 translate-middle-x game-controller__modes glass-card btn-group btn-group-sm p-1 rounded-2" role="group" aria-label="Zoom caméra">
          {(['in', 'out'] as const).map(direction => {
            const isPressed = (direction === 'in'
              ? pressedKeys.has('CtrlArrowUp') || pressedKeys.has('PageUp')
              : pressedKeys.has('CtrlArrowDown') || pressedKeys.has('PageDown')) || pointerZoom === direction;
            return (
              <button
                key={direction}
                type="button"
                className={`btn btn-sm btn-outline-dark py-0 px-1 ${isPressed ? 'is-pressed' : ''}`}
                aria-pressed={isPressed}
                aria-label={direction === 'in' ? 'Zoomer' : 'Dézoomer'}
                title={direction === 'in' ? 'Zoomer' : 'Dézoomer'}
                onPointerDown={() => setPointerZoom(direction)}
                onPointerUp={() => setPointerZoom(null)}
                onPointerCancel={() => setPointerZoom(null)}
                onClick={() => zoom(direction)}
              >
                <i className={`bi bi-zoom-${direction}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="position-absolute bottom-0 start-50 translate-middle-x glass-card d-flex align-items-center gap-1 p-1 rounded-2" role="group" aria-label="Cible de la caméra">
          {targets.map(choice => (
            <Fragment key={choice.target}>
              {choice.target === 'studio' && <span className="small px-1" title="Cible de la caméra"><i className="bi bi-bullseye" aria-hidden="true" /><span className="visually-hidden">Cible caméra</span></span>}
              <button
                type="button"
                className={`btn btn-sm py-0 px-1 ${!animal && target === choice.target ? 'btn-primary' : 'btn-outline-dark'}`}
                aria-label={`Cibler : ${choice.label}`}
                title={`Cibler : ${choice.label}`}
                aria-pressed={!animal && target === choice.target}
                onClick={() => {
                  releaseAll();
                  selectControl(choice.target, control);
                }}
              >
                <i className={`bi ${choice.icon}`} aria-hidden="true" />
              </button>
            </Fragment>
          ))}
        </div>
        {(['character', 'camera'] as const).map(inputControl => {
          const isCamera = inputControl === 'camera';
          const extras = !isCamera
            ? EXTRA_CAMERA_CONTROLS.map(button => ({ ...button, label: !piloting && !animal
              ? getAnimationDef(CHARACTER_CONTROL_ANIMATIONS[button.key])!.label
              : animal === 'shiba' || animal === 'ulotte' ? `${button.key === 'Elevate' ? 'Sauter' : 'Assis'} : ${subject.label}`
              : `${piloting || isFlyingSubject(animal) ? button.key === 'Elevate' ? 'Monter' : 'Descendre' : button.key === 'Elevate' ? 'Action haute' : 'Action basse'} : ${piloting ? 'Hornet' : subject.label}` }))
            : [];
          const buttons = [...DIRECTIONS, ...extras];
          return (
            <div key={inputControl} className="d-flex flex-column align-items-center gap-1">
              <button type="button" className={`btn btn-sm ${control === inputControl ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={control === inputControl} title={isCamera ? 'Clavier : caméra' : 'Clavier : sujet'} aria-label={isCamera ? 'Clavier : caméra' : 'Clavier : sujet'} onClick={() => {
                releaseAll();
                useSceneStore.getState().setArrowControl(inputControl);
              }}><i className={`bi ${isCamera ? 'bi-camera-video' : 'bi-controller'}`} aria-hidden="true" /></button>
              <div className={`virtual-dpad ${!isCamera ? 'virtual-dpad--subject' : ''}`} role="group" aria-label={isCamera ? 'Déplacement de la caméra' : `Déplacement : ${piloting ? 'Hornet' : subject.label}`}>
                {!isCamera && <div className="virtual-dpad__subject">
                  <PanelPopover icon={subject.icon} title="Objet de position de la caméra" compactMode className="view-control-bar__subject-picker" triggerClassName="virtual-dpad__button rounded-3" onOpen={popover => {
                    refreshSubjects();
                    requestAnimationFrame(() => (popover.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)') ?? popover.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)'))?.focus());
                  }}>
                    <button type="button" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 w-100 mb-2 flex-shrink-0 text-wrap"
                      onClick={event => {
                        const choices = subjects.filter(choice => choice.cameraSubject === 'character' || availableSubjects.includes(choice.id));
                        pickSubject(choices[Math.floor(Math.random() * choices.length)], event.currentTarget);
                      }}>
                      <i className="bi bi-shuffle" aria-hidden="true" />Choisir un sujet aléatoire (personnages, robots, animaux)
                    </button>
                    <div role="listbox" aria-label="Position caméra" className="d-flex flex-column gap-1 overflow-y-auto" onKeyDown={event => {
                      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                      event.preventDefault();
                      const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
                      const index = options.indexOf(document.activeElement as HTMLButtonElement);
                      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : index < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
                      options[next].focus();
                    }}>
                      {subjects.map(choice => <button key={choice.id} type="button" role="option" aria-selected={choice.id === selectedSubjectId}
                        className={`btn btn-sm d-flex align-items-center gap-2 text-start flex-shrink-0 ${choice.id === selectedSubjectId ? 'btn-primary' : 'btn-outline-secondary border-0'}`}
                        disabled={choice.cameraSubject !== 'character' && !availableSubjects.includes(choice.id)}
                        onClick={event => pickSubject(choice, event.currentTarget)}>
                        <i className={`bi ${choice.icon}`} aria-hidden="true" /><span>{choice.label}</span>
                        {choice.id === selectedSubjectId && <i className="bi bi-check2 ms-auto" aria-hidden="true" />}
                      </button>)}
                    </div>
                  </PanelPopover>
                </div>}
                {isCamera && <span className="virtual-dpad__center d-flex align-items-center justify-content-center" title={piloting ? 'Orienter le Hornet' : 'Déplacer la caméra'}>
                  <i className="bi bi-camera-video" aria-hidden="true" />
                </span>}
                {buttons.map(({ key, icon, label: defaultLabel, position }) => {
                  const inputKey = `${inputControl}:${key}`;
                  const isAlt = pressedKeys.has('Alt' + key);
                  const pressed = pressedKeys.has(inputKey) ||
                    (isAlt ? isCamera : (pressedKeys.has(key) && (moving ? inputControl === 'character' : isCamera)));
                  const movementLabel = piloting && (key === 'ArrowLeft' || key === 'ArrowRight') ? key === 'ArrowLeft' ? 'Déplacer le Hornet à gauche' : 'Déplacer le Hornet à droite' : defaultLabel;
                  const label = key === 'Elevate' || key === 'Descend' ? defaultLabel : inputControl === 'character' ? movementLabel : (piloting || orbiting)
                    ? ({ ArrowUp: 'Incliner vers le haut', ArrowDown: 'Incliner vers le bas', ArrowLeft: 'Tourner à gauche', ArrowRight: 'Tourner à droite' } as Record<string, string>)[key]
                    : ({ ArrowUp: 'Déplacer la vue vers le haut', ArrowDown: 'Déplacer la vue vers le bas', ArrowLeft: 'Déplacer la vue à gauche', ArrowRight: 'Déplacer la vue à droite' } as Record<string, string>)[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`btn btn-sm rounded-3 virtual-dpad__button virtual-dpad__button--${position} ${pressed ? 'is-pressed' : ''}`}
                      aria-label={label}
                      aria-pressed={pressed}
                      title={label}
                      disabled={!isCamera && Boolean(animal && !CAMERA_SUBJECTS.some(choice => choice.id === animal))}
                      onPointerDown={event => {
                        event.preventDefault();
                        event.currentTarget.setPointerCapture(event.pointerId);
                        if (activeKeys.current.has(inputKey)) return;
                        activeKeys.current.add(inputKey);
                        fire(inputKey, true);
                      }}
                      onPointerUp={() => releaseKey(inputKey)}
                      onPointerCancel={() => releaseKey(inputKey)}
                      onLostPointerCapture={() => releaseKey(inputKey)}
                      onContextMenu={event => event.preventDefault()}
                    >
                      <i className={`bi ${icon}`} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
