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
  }, []);

  const releaseAll = useCallback(() => {
    activeKeys.current.forEach(key => fire('keyup', key));
    activeKeys.current.clear();
    setPressedKeys(new Set());
    document.dispatchEvent(new Event('camera-controls-release'));
  }, []);

  useEffect(() => {
    const onArrowKeys = (event: Event) => setPressedKeys(new Set((event as CustomEvent<ArrowKey[]>).detail));
    document.addEventListener('camera-arrow-keys', onArrowKeys);
    return () => document.removeEventListener('camera-arrow-keys', onArrowKeys);
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
    <div className="virtual-controls d-flex flex-column align-items-center gap-1">
      <div className="virtual-controls__modes glass-card btn-group btn-group-sm p-1 rounded-2" role="group" aria-label="Contrôle des flèches et zoom caméra">
        {choices.map(choice => (
          <button
            key={choice.label}
            type="button"
            className={`btn btn-sm py-0 px-1 ${choice.active ? 'btn-primary' : 'btn-outline-secondary'}`}
            aria-label={choice.label}
            title={choice.label}
            aria-pressed={choice.active}
            onClick={() => {
              releaseAll();
              selectControl(choice.target, choice.control);
            }}
          >
            <i className={`bi ${choice.icon}`} aria-hidden="true" />
          </button>
        ))}
        {(['in', 'out'] as const).map(direction => (
          <button
            key={direction}
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-1"
            aria-label={direction === 'in' ? 'Zoomer' : 'Dézoomer'}
            title={direction === 'in' ? 'Zoomer' : 'Dézoomer'}
            onClick={() => document.dispatchEvent(new CustomEvent('camera-zoom', {
              detail: { direction, scope: 'scene' },
            }))}
          >
            <i className={`bi bi-zoom-${direction}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="d-flex flex-column align-items-center gap-1">
        <span className="visually-hidden" role="status">{caption}</span>
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
                aria-pressed={pressedKeys.has(key)}
                title={label}
                disabled={Boolean(animal && mode === 'fpv')}
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  if (activeKeys.current.has(key)) return;
                  activeKeys.current.add(key);
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
