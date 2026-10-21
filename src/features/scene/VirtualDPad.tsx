/** Commandes communes au clavier, à la souris et au tactile. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { cameraState } from './cameraState';
import { ORBIT_CAMERA_LERP } from './camera/cameraConstants';
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
  const setArrowControl = useSceneStore(state => state.setArrowControl);
  const [animal, setAnimal] = useState(cameraState.animalTarget);
  const activeKeys = useRef(new Set<ArrowKey>());
  const zoomFrame = useRef<number | null>(null);
  const zoomRemaining = useRef(0);
  const [pressedKeys, setPressedKeys] = useState<Set<ArrowKey>>(new Set());

  const releaseKey = useCallback((key: ArrowKey) => {
    if (!activeKeys.current.delete(key)) return;
    fire('keyup', key);
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
    activeKeys.current.forEach(key => fire('keyup', key));
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
  const caption = animal
    ? mode === 'fpv' ? `Vue embarquée · ${animal}` : `Caméra · ${animal}`
    : mode === 'fpv' ? 'Déplacer · PNJ — FPV'
    : moving ? 'Déplacer · PNJ'
    : mode === 'top' || mode === 'iso' ? `Caméra · ${mode === 'top' ? 'Dessus' : 'Vue fixe'}`
    : mode === 'follow' || target === 'character' ? 'Caméra · PNJ'
    : target === 'studio' ? 'Caméra · Studio' : `Caméra · ${target}`;
  const targets = [
    { target: 'studio', label: 'Appartement', icon: 'bi-building' },
    { target: 'character', label: 'Personnage', icon: 'bi-person' },
  ] as const;
  const controls = [
    { control: 'camera', label: 'Déplacer la caméra', icon: 'bi-camera-video', active: !moving },
    { control: 'character', label: 'Déplacer le personnage', icon: 'bi-person-walking', active: moving },
  ] as const;

  return (
    <div className="virtual-controls d-flex flex-column align-items-center gap-1">
      <div className="glass-card d-flex align-items-center gap-1 p-1 rounded-2" role="group" aria-label="Cible de la caméra">
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
              <span className="small ms-1">{choice.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="virtual-controls__modes glass-card btn-group btn-group-sm p-1 rounded-2" role="group" aria-label="Contrôle des flèches et zoom caméra">
        {controls.map(choice => (
          <button
            key={choice.label}
            type="button"
            className={`btn btn-sm py-0 px-1 ${choice.active ? 'btn-primary' : 'btn-outline-secondary'}`}
            aria-label={choice.label}
            title={choice.label}
            aria-pressed={choice.active}
            onClick={() => {
              releaseAll();
              if (mode === 'fpv' && choice.control === 'camera') selectControl('character', 'camera');
              else setArrowControl(choice.control);
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
            onClick={() => zoom(direction)}
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
