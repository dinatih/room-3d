import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import * as THREE from 'three';
import { cameraState } from './cameraState';
import { planeInput } from './planeInput';
import { SPEED_MAX, type PlaneViewMode, type PlaneModelKey } from './PaperPlane';
import './PlaneControls.css';
import { AIRCRAFT_MODELS } from './aircraftModels';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const FULL_TILT = THREE.MathUtils.degToRad(30);
const screenCorrection = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const command = (detail: string) => document.dispatchEvent(new CustomEvent('plane-command', { detail }));

export function PlaneControls({
  viewMode,
  launched,
  onExit,
  model,
  onCycleModel,
}: {
  model: PlaneModelKey;
  onCycleModel: () => void;
  viewMode: PlaneViewMode;
  launched: boolean;
  onExit: () => void;
}) {
  const isMobile = useIsMobile();
  const [speed, setSpeed] = useState(0);
  const [gyro, setGyro] = useState(false);
  const [message, setMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [heldActions, setHeldActions] = useState<string[]>([]);
  const neutral = useRef<THREE.Quaternion | null>(null);
  const latest = useRef<THREE.Quaternion | null>(null);
  const held = useRef(new Map<number, string>());
  const mounted = useRef(true);
  const sensorReady = useRef(false);
  const flying = launched && viewMode !== 'landing' && viewMode !== 'landed';

  const showTouch = isMobile || (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  function release() {
    held.current.clear();
    setHeldActions([]);
    Object.assign(planeInput, { pitch: 0, roll: 0, throttle: 0 });
  }

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => {
      setSpeed(cameraState.planeSpeed * 0.036);
      setLaunching(cameraState.planeLaunching);
    }, 100);
    const visibility = () => {
      if (document.hidden) {
        release();
        neutral.current = null;
      }
    };
    const blur = () => {
      release();
      neutral.current = null;
    };
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      release();
    };
  }, []);

  useEffect(() => {
    release();
  }, [flying, gyro]);

  useEffect(() => {
    if (!gyro) return;
    sensorReady.current = false;
    neutral.current = null;
    latest.current = null;
    const orientation = new THREE.Quaternion();
    const relative = new THREE.Quaternion();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const axis = new THREE.Vector3(0, 0, 1);

    const getScreenAngle = () => {
      if (screen.orientation && typeof screen.orientation.angle === 'number') {
        return screen.orientation.angle;
      }
      if (typeof window.orientation === 'number') {
        return window.orientation;
      }
      return 0;
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null || document.hidden) return;
      sensorReady.current = true;
      euler.set(
        THREE.MathUtils.degToRad(event.beta),
        THREE.MathUtils.degToRad(event.alpha ?? 0),
        -THREE.MathUtils.degToRad(event.gamma),
        'YXZ',
      );
      orientation.setFromEuler(euler).multiply(screenCorrection);
      orientation.multiply(relative.setFromAxisAngle(axis, -THREE.MathUtils.degToRad(getScreenAngle())));
      latest.current = orientation.clone();
      if (!neutral.current) {
        neutral.current = orientation.clone();
        setMessage('Inclinez le téléphone pour piloter (croix également active).');
      }
      relative.copy(neutral.current).invert().multiply(orientation);
      euler.setFromQuaternion(relative, 'YXZ');

      const values = [...held.current.values()];
      const hasDpadPitch = values.includes('down') || values.includes('up');
      const hasDpadRoll = values.includes('left') || values.includes('right');

      if (!hasDpadPitch) {
        planeInput.pitch = THREE.MathUtils.clamp(euler.x / FULL_TILT, -1, 1);
      }
      if (!hasDpadRoll) {
        planeInput.roll = THREE.MathUtils.clamp(euler.z / FULL_TILT, -1, 1);
      }
    };

    const recalibrate = () => {
      neutral.current = null;
      planeInput.pitch = 0;
      planeInput.roll = 0;
    };

    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('orientationchange', recalibrate);
    screen.orientation?.addEventListener('change', recalibrate);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', recalibrate);
      screen.orientation?.removeEventListener('change', recalibrate);
      planeInput.pitch = 0;
      planeInput.roll = 0;
    };
  }, [gyro]);

  async function toggleGyro() {
    if (gyro) {
      setGyro(false);
      setMessage('');
      planeInput.pitch = 0;
      planeInput.roll = 0;
      return;
    }
    if (typeof DeviceOrientationEvent === 'undefined') {
      setMessage('Capteur gyroscope non supporté sur ce navigateur.');
      return;
    }
    const sensor = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    if (typeof sensor.requestPermission === 'function') {
      try {
        const state = await sensor.requestPermission();
        if (state !== 'granted') {
          setMessage('Permission refusée. Utilisez la croix pour piloter.');
          return;
        }
      } catch {
        setMessage('Permission gyroscope non accordée.');
        return;
      }
    }
    neutral.current = null;
    latest.current = null;
    sensorReady.current = false;
    setGyro(true);
    setMessage('Inclinez le téléphone pour piloter (croix également active).');
  }

  function updateButtons() {
    const values = [...held.current.values()];
    const btnPitch = Number(values.includes('down')) - Number(values.includes('up'));
    const btnRoll = Number(values.includes('left')) - Number(values.includes('right'));
    if (btnPitch !== 0 || !gyro) {
      planeInput.pitch = btnPitch;
    }
    if (btnRoll !== 0 || !gyro) {
      planeInput.roll = btnRoll;
    }
    planeInput.throttle = Number(values.includes('boost')) - Number(values.includes('brake'));
    setHeldActions(values);
  }

  function press(event: ReactPointerEvent<HTMLButtonElement>, action: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    held.current.set(event.pointerId, action);
    if (!launched && (action === 'boost' || action === 'up')) {
      command('launch');
    }
    updateButtons();
  }

  function lift(event: ReactPointerEvent<HTMLButtonElement>) {
    held.current.delete(event.pointerId);
    updateButtons();
  }

  function holdButton(action: string, label: ReactNode, title: string, extraClass = '') {
    const isPressed = heldActions.includes(action);
    return (
      <button
        type="button"
        className={`btn btn-sm plane-hold plane-${action} ${extraClass} ${isPressed ? 'is-pressed' : ''}`}
        aria-label={title}
        title={title}
        onPointerDown={e => press(e, action)}
        onPointerUp={lift}
        onPointerCancel={lift}
        onLostPointerCapture={lift}
        onContextMenu={e => e.preventDefault()}
      >
        {label}
      </button>
    );
  }

  const fraction = THREE.MathUtils.clamp(speed / (SPEED_MAX * 0.036), 0, 1);
  const low = new THREE.Color('#dc2626');
  const mid = new THREE.Color('#d97706');
  const high = new THREE.Color('#16a34a');
  const speedColor = fraction < 0.5 ? low.lerp(mid, fraction * 2) : mid.lerp(high, (fraction - 0.5) * 2);
  const viewLabels = {
    prelaunch: 'Pré-vol',
    follow: 'Suivi',
    cockpit: 'Cockpit',
    character: 'PNJ',
    landing: 'Atterrissage',
    landed: 'Au sol',
  };
  const modelLabel = AIRCRAFT_MODELS.find(entry => entry.key === model)!.label;

  return (
    <div className="plane-controls text-dark">
      <div className="plane-info d-flex align-items-center gap-1 p-1 rounded-3">
        <output className="plane-speed px-2 small" style={{ color: `#${speedColor.getHexString()}` }} aria-label="Vitesse">
          {speed.toFixed(1)} <small>km/h</small>
        </output>
        {!launched && (
          <button className="btn btn-sm btn-primary" title="Décoller (Espace / Ctrl / C)" disabled={launching} onClick={() => command('launch')}>
            {launching ? 'Pliage…' : 'Décoller'}
          </button>
        )}
        {flying && (
          <button className="btn btn-sm btn-outline-secondary" title="Changer de vue (C)" onClick={() => command('view')}>
            {viewLabels[viewMode]}
          </button>
        )}
        <button className="btn btn-sm btn-outline-secondary text-truncate plane-model" title="Changer d’avion (V)" onClick={onCycleModel}>
          {modelLabel}
        </button>
        <button className="btn btn-sm btn-outline-secondary" title="Quitter (F / Échap)" aria-label="Quitter le vol" onClick={onExit}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          title="Commandes"
          aria-label="Afficher les commandes"
          aria-expanded={showHelp}
          onClick={() => setShowHelp(value => !value)}
        >
          <i className="bi bi-question-lg" aria-hidden="true" />
        </button>
      </div>

      {(viewMode === 'landing' || viewMode === 'landed') && (
        <div className="plane-status small text-center rounded-3 p-1">
          {viewMode === 'landing' ? 'Atterrissage automatique…' : 'Atterri'}
        </div>
      )}

      {showHelp && (
        <div className="plane-help small text-center rounded-3 p-2">
          ↑↓ Tangage / looping · ←→ Virage / vrille · Espace/Ctrl Gaz · Shift Frein · C Vue · V Avion · F Quitter
        </div>
      )}

      {showTouch && (
        <div className="plane-touch">
          <div className="plane-sensor d-flex align-items-center gap-1 rounded-3 p-1">
            <button
              type="button"
              className={`btn btn-sm ${gyro ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
              aria-pressed={gyro}
              onClick={toggleGyro}
            >
              <i className="bi bi-compass me-1" aria-hidden="true" />
              Gyroscope
            </button>
            {gyro && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  neutral.current = latest.current?.clone() ?? null;
                  planeInput.pitch = 0;
                  planeInput.roll = 0;
                }}
                title="Recentrer le gyroscope"
              >
                <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
                Recentrer
              </button>
            )}
          </div>
          {message && <div role="status" className="plane-message small text-center rounded-3 p-1">{message}</div>}

          {/* Croix directionnelle (toujours disponible même avec gyroscope) */}
          <div className="plane-dpad" role="group" aria-label="Croix directionnelle">
            {holdButton('up', <i className="bi bi-arrow-up" aria-hidden="true" />, 'Piquer / descendre (↑)', 'btn-outline-secondary plane-up')}
            {holdButton('left', <i className="bi bi-arrow-left" aria-hidden="true" />, 'Virer à gauche (←)', 'btn-outline-secondary plane-left')}
            {holdButton('right', <i className="bi bi-arrow-right" aria-hidden="true" />, 'Virer à droite (→)', 'btn-outline-secondary plane-right')}
            {holdButton('down', <i className="bi bi-arrow-down" aria-hidden="true" />, 'Cabrer / monter (↓)', 'btn-outline-secondary plane-down')}
          </div>

          {/* Boutons d'accélération et de frein */}
          <div className="plane-throttle d-flex flex-column gap-2" role="group" aria-label="Commandes de gaz">
            {holdButton(
              'boost',
              <span className="d-flex align-items-center justify-content-center gap-1">
                <i className="bi bi-speedometer2" aria-hidden="true" />
                <span className="fw-bold">Gaz</span>
              </span>,
              'Accélérer (+ Gaz / Espace)',
              'btn-outline-success plane-boost',
            )}
            {holdButton(
              'brake',
              <span className="d-flex align-items-center justify-content-center gap-1">
                <i className="bi bi-dash-circle" aria-hidden="true" />
                <span className="fw-bold">Frein</span>
              </span>,
              'Freiner (− Gaz / Shift)',
              'btn-outline-danger plane-brake',
            )}
          </div>
        </div>
      )}
    </div>
  );
}
