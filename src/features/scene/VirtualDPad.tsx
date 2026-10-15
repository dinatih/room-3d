/** Commandes communes au clavier, à la souris et au tactile. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { cameraState } from './cameraState';
import './VirtualDPad.scss';

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

const DIRECTIONS: Array<{ key: ArrowKey; icon: string; label: string; position: string }> = [
  { key: 'ArrowUp', icon: 'bi-arrow-up', label: 'Avancer', position: 'up' },
  { key: 'ArrowLeft', icon: 'bi-arrow-left', label: 'Tourner à gauche', position: 'left' },
  { key: 'ArrowRight', icon: 'bi-arrow-right', label: 'Tourner à droite', position: 'right' },
  { key: 'ArrowDown', icon: 'bi-arrow-down', label: 'Reculer', position: 'down' },
];

function fire(type: 'keydown' | 'keyup', key: ArrowKey) {
  window.dispatchEvent(new KeyboardEvent(type, { key, code: key, bubbles: true }));
}

export function VirtualDPad({ visible = false }: { visible?: boolean }) {
  const mode = useSceneStore(state => state.cameraMode);
  const target = useSceneStore(state => state.cameraTarget);
  const control = useSceneStore(state => state.arrowControl);
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const selectControl = useSceneStore(state => state.selectArrowControl);
  const [animal, setAnimal] = useState(cameraState.animalTarget);
  const activeKeys = useRef(new Set<ArrowKey>());
  const [pressedKeys, setPressedKeys] = useState<Set<ArrowKey>>(new Set());

  const releaseKey = useCallback((key: ArrowKey) => {
    if (!activeKeys.current.delete(key)) return;
    fire('keyup', key);
    setPressedKeys(new Set(activeKeys.current));
  }, []);

  const releaseAll = useCallback(() => {
    activeKeys.current.forEach(key => fire('keyup', key));
    activeKeys.current.clear();
    setPressedKeys(new Set());
    document.dispatchEvent(new Event('camera-controls-release'));
  }, []);

  useEffect(() => {
    const onAnimal = () => setAnimal(cameraState.animalTarget);
    document.addEventListener('animal-camera-mode', onAnimal);
    return () => document.removeEventListener('animal-camera-mode', onAnimal);
  }, []);

  useEffect(() => {
    releaseAll();
  }, [visible, mode, target, control, activeCharacterId, animal, releaseAll]);

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
  const moving = !animal && (mode === 'fpv' || control === 'character');
  const orbiting = mode === 'orbit' || mode === 'follow';
  const studioActive = mode === 'orbit' && target === 'studio' && !moving;
  const characterActive = !animal && !moving && (mode === 'follow' || (mode === 'orbit' && target === 'character'));
  const moveActive = (mode === 'follow' || mode === 'fpv') && moving;
  const caption = animal
    ? mode === 'fpv' ? `Vue embarquée · ${animal}` : `Caméra · ${animal}`
    : mode === 'fpv' ? 'Déplacer · PNJ — FPV'
    : moving ? 'Déplacer · PNJ'
    : mode === 'top' || mode === 'ortho' ? `Caméra · ${mode === 'top' ? 'Dessus' : 'Vue fixe'}`
    : mode === 'follow' || target === 'character' ? 'Caméra · PNJ'
    : target === 'studio' ? 'Caméra · Studio' : `Caméra · ${target}`;
  const choices = [
    { target: 'studio', control: 'camera', label: 'Caméra · Studio', icon: 'bi-building', active: studioActive },
    { target: 'character', control: 'camera', label: 'Caméra · PNJ', icon: 'bi-camera-video', active: characterActive },
    { target: 'character', control: 'character', label: 'Déplacer · PNJ', icon: 'bi-person-walking', active: moveActive },
  ] as const;

  return (
    <div className="virtual-controls d-flex align-items-end gap-2">
      <div className="d-flex flex-column gap-1" role="group" aria-label="Choisir le contrôle des flèches">
        {choices.map(choice => (
          <button
            key={choice.label}
            type="button"
            className={`btn btn-sm ${choice.active ? 'btn-primary' : 'btn-light'} text-nowrap text-start`}
            aria-pressed={choice.active}
            onClick={() => {
              releaseAll();
              selectControl(choice.target, choice.control);
            }}
          >
            <i className={`bi ${choice.icon} me-1`} aria-hidden="true" />{choice.label}
          </button>
        ))}
      </div>
      <div className="d-flex flex-column align-items-center gap-1">
        <span className="badge text-bg-dark" role="status">{caption}</span>
        <div className="virtual-dpad" role="group" aria-label={`Flèches : ${caption}`}>
          {DIRECTIONS.map(({ key, icon, label: movementLabel, position }) => {
            const label = moving ? movementLabel : orbiting
              ? ({ ArrowUp: 'Incliner vers le haut', ArrowDown: 'Incliner vers le bas', ArrowLeft: 'Tourner à gauche', ArrowRight: 'Tourner à droite' })[key]
              : ({ ArrowUp: 'Déplacer la vue vers le haut', ArrowDown: 'Déplacer la vue vers le bas', ArrowLeft: 'Déplacer la vue à gauche', ArrowRight: 'Déplacer la vue à droite' })[key];
            return (
              <button
                key={key}
                type="button"
                className={`btn btn-sm rounded-3 virtual-dpad__button virtual-dpad__button--${position} ${pressedKeys.has(key) ? 'is-pressed' : ''}`}
                aria-label={label}
                title={label}
                disabled={Boolean(animal && mode === 'fpv')}
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  if (activeKeys.current.has(key)) return;
                  activeKeys.current.add(key);
                  setPressedKeys(new Set(activeKeys.current));
                  fire('keydown', key);
                }}
                onPointerUp={() => releaseKey(key)}
                onPointerCancel={() => releaseKey(key)}
                onLostPointerCapture={() => releaseKey(key)}
                onContextMenu={event => event.preventDefault()}
              >
                <i className={`bi ${icon}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
