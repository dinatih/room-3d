/** Commandes communes au clavier, à la souris et au tactile. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { cameraState } from './cameraState';
import { useDroneControlStore } from './droneControls';
import { ORBIT_CAMERA_LERP } from './camera/cameraConstants';
import { ALL_HAIR_COLORS } from './sidepanel/types';
import { CAMERA_SUBJECTS, selectAnimalCameraTarget } from './camera/cameraSubjects';
import { PanelPopover } from './sidepanel/PanelPopover';
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
  const moving = piloting || !animal && (mode === 'fpv' || control === 'character');
  const orbiting = mode === 'orbit' || mode === 'follow' || Boolean(animal);
  const targets = [
    { target: 'studio', label: 'Appartement', icon: 'bi-building' },
    { target: 'character', label: 'Personnage', icon: 'bi-person' },
  ] as const;
  const subjectId = animal ?? (mode === 'follow' || mode === 'fpv' ? 'character' : '');
  const subject = CAMERA_SUBJECTS.find(choice => choice.id === subjectId) ?? CAMERA_SUBJECTS[0];
  const refreshSubjects = () => setAvailableSubjects(Object.keys(cameraState.animalViews));

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
                className={`btn btn-sm btn-outline-secondary py-0 px-1 ${isPressed ? 'is-pressed' : ''}`}
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
          <span className="small px-1" title="Cible de la caméra"><i className="bi bi-bullseye" aria-hidden="true" /><span className="visually-hidden">Cible caméra</span></span>
          <div className="btn-group btn-group-sm">
            {targets.map(choice => (
              <button
                key={choice.target}
                type="button"
                className={`btn btn-sm py-0 px-1 ${!animal && target === choice.target ? 'btn-primary' : 'btn-outline-secondary'}`}
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
            ))}
          </div>
        </div>
        {(['character', 'camera'] as const).map(inputControl => {
          const isCamera = inputControl === 'camera';
          const extras = piloting
            ? EXTRA_CAMERA_CONTROLS.map(button => ({ ...button, label: button.key === 'Elevate' ? 'Monter le Hornet (Espace)' : 'Descendre le Hornet (C)' }))
            : EXTRA_CAMERA_CONTROLS;
          const buttons = isCamera ? [...DIRECTIONS, ...extras] : DIRECTIONS;
          return (
            <div key={inputControl} className="d-flex flex-column align-items-center gap-1">
              <div className="virtual-dpad" role="group" aria-label={piloting ? isCamera ? 'Rotation du Hornet' : 'Déplacement du Hornet' : inputControl === 'character' ? 'Déplacement du PNJ' : 'Déplacement de la caméra'}>
                {!isCamera && <div className="virtual-dpad__subject">
                  <PanelPopover icon={subject.icon} title="Objet de position de la caméra" compactMode triggerClassName="virtual-dpad__button rounded-3" onOpen={popover => {
                    refreshSubjects();
                    requestAnimationFrame(() => (popover.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)') ?? popover.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)'))?.focus());
                  }}>
                    <div role="listbox" aria-label="Position caméra" className="d-flex flex-column gap-1" onKeyDown={event => {
                      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                      event.preventDefault();
                      const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
                      const index = options.indexOf(document.activeElement as HTMLButtonElement);
                      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : index < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
                      options[next].focus();
                    }}>
                      {CAMERA_SUBJECTS.map(choice => <button key={choice.id} type="button" role="option" aria-selected={choice.id === subjectId}
                        className={`btn btn-sm d-flex align-items-center gap-2 text-start ${choice.id === subjectId ? 'btn-primary' : 'btn-outline-secondary border-0'}`}
                        disabled={choice.id !== 'character' && !availableSubjects.includes(choice.id)}
                        onClick={event => {
                          releaseAll();
                          document.dispatchEvent(new CustomEvent('camera-subject', { detail: choice.id }));
                          (event.currentTarget.closest('[popover]') as HTMLDivElement).hidePopover();
                        }}>
                        <i className={`bi ${choice.icon}`} aria-hidden="true" /><span>{choice.label}</span>
                        {choice.id === subjectId && <i className="bi bi-check2 ms-auto" aria-hidden="true" />}
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
