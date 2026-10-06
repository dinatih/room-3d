import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { cameraState } from './cameraState';
import { planeInput } from './planeInput';
import { SPEED_MAX, type PlaneViewMode, type PlaneModelKey } from './PaperPlane';
import './PlaneControls.css';
import { AIRCRAFT_MODELS } from './aircraftModels';

const FULL_TILT = THREE.MathUtils.degToRad(30);
const screenCorrection = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const command = (detail: string) => document.dispatchEvent(new CustomEvent('plane-command', { detail }));

export function PlaneControls({ viewMode, launched, onExit, model, onCycleModel }: { model: PlaneModelKey; onCycleModel: () => void; viewMode: PlaneViewMode; launched: boolean; onExit: () => void }) {
  const [speed, setSpeed] = useState(0);
  const [gyro, setGyro] = useState(false);
  const [message, setMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [launching, setLaunching] = useState(false);
  const neutral = useRef<THREE.Quaternion | null>(null);
  const latest = useRef<THREE.Quaternion | null>(null);
  const held = useRef(new Map<number, string>());
  const mounted = useRef(true);
  const sensorReady = useRef(false);
  const flying = launched && viewMode !== 'landing' && viewMode !== 'landed';

  function release() {
    held.current.clear();
    Object.assign(planeInput, { pitch: 0, roll: 0, throttle: 0 });
  }
  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => { setSpeed(cameraState.planeSpeed * 0.036); setLaunching(cameraState.planeLaunching); }, 100);
    const visibility = () => { if (document.hidden) { release(); neutral.current = null; } };
    const blur = () => { release(); neutral.current = null; };
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
  useEffect(() => { release(); }, [flying, gyro]);

  useEffect(() => {
    if (!gyro) return;
    sensorReady.current = false;
    neutral.current = null;
    latest.current = null;
    const orientation = new THREE.Quaternion();
    const relative = new THREE.Quaternion();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const axis = new THREE.Vector3(0, 0, 1);
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null || document.hidden) return;
      sensorReady.current = true;
      euler.set(THREE.MathUtils.degToRad(event.beta), THREE.MathUtils.degToRad(event.alpha ?? 0), -THREE.MathUtils.degToRad(event.gamma), 'YXZ');
      orientation.setFromEuler(euler).multiply(screenCorrection);
      orientation.multiply(relative.setFromAxisAngle(axis, -THREE.MathUtils.degToRad(screen.orientation?.angle ?? 0)));
      latest.current = orientation.clone();
      if (!neutral.current) {
        neutral.current = orientation.clone();
        setMessage('Inclinez le téléphone pour piloter.');
      }
      relative.copy(neutral.current).invert().multiply(orientation);
      euler.setFromQuaternion(relative, 'YXZ');
      if (flying) {
        planeInput.pitch = THREE.MathUtils.clamp(euler.x / FULL_TILT, -1, 1);
        planeInput.roll = THREE.MathUtils.clamp(euler.z / FULL_TILT, -1, 1);
      }
    };
    const recalibrate = () => { neutral.current = null; planeInput.pitch = planeInput.roll = 0; };
    window.addEventListener('deviceorientation', onOrientation);
    screen.orientation?.addEventListener('change', recalibrate);
    const timeout = window.setTimeout(() => {
      if (!sensorReady.current) { setGyro(false); setMessage('Capteur indisponible : utilisez la croix.'); }
    }, 3000);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('deviceorientation', onOrientation);
      screen.orientation?.removeEventListener('change', recalibrate);
      planeInput.pitch = planeInput.roll = 0;
    };
  }, [gyro, flying]);

  async function toggleGyro() {
    if (gyro) { setGyro(false); setMessage(''); return; }
    if (!window.isSecureContext || typeof DeviceOrientationEvent === 'undefined') {
      setMessage('Le gyroscope nécessite HTTPS et un téléphone compatible.'); return;
    }
    const sensor = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    try {
      if (sensor.requestPermission && await sensor.requestPermission() !== 'granted') {
        if (mounted.current) setMessage('Permission refusée : utilisez la croix.'); return;
      }
      if (mounted.current) { setMessage('Gardez le téléphone dans votre position de pilotage…'); setGyro(true); }
    } catch (error) {
      if (mounted.current) setMessage(`Gyroscope : ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function updateButtons() {
    const values = [...held.current.values()];
    if (!gyro) {
      planeInput.pitch = Number(values.includes('down')) - Number(values.includes('up'));
      planeInput.roll = Number(values.includes('left')) - Number(values.includes('right'));
    }
    planeInput.throttle = Number(values.includes('boost')) - Number(values.includes('brake'));
  }
  function press(event: ReactPointerEvent<HTMLButtonElement>, action: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    held.current.set(event.pointerId, action);
    updateButtons();
  }
  function lift(event: ReactPointerEvent<HTMLButtonElement>) {
    held.current.delete(event.pointerId);
    updateButtons();
  }
  function holdButton(action: string, label: string, title: string) {
    return <button type="button" className={`btn btn-outline-secondary btn-sm plane-hold plane-${action}`} aria-label={title} title={title} disabled={!flying} onPointerDown={e => press(e, action)} onPointerUp={lift} onPointerCancel={lift} onLostPointerCapture={lift}>{label}</button>;
  }
  const fraction = THREE.MathUtils.clamp(speed / (SPEED_MAX * 0.036), 0, 1);
  // Même palette rouge → ambre → vert que le compteur FPS, interpolée.
  const low = new THREE.Color('#dc2626');
  const mid = new THREE.Color('#d97706');
  const high = new THREE.Color('#16a34a');
  const speedColor = fraction < 0.5 ? low.lerp(mid, fraction * 2) : mid.lerp(high, (fraction - 0.5) * 2);
  const viewLabels = { prelaunch: 'Pré-vol', follow: 'Suivi', cockpit: 'Cockpit', character: 'PNJ', landing: 'Atterrissage', landed: 'Au sol' };
  const modelLabel = AIRCRAFT_MODELS.find(entry => entry.key === model)!.label;
  return <div className="plane-controls text-dark">
    <div className="plane-info d-flex align-items-center gap-1 p-1 rounded-3">
      <output className="plane-speed px-2 small" style={{ color: `#${speedColor.getHexString()}` }} aria-label="Vitesse">{speed.toFixed(1)} <small>km/h</small></output>
      {!launched && <button className="btn btn-sm btn-primary" title="Décoller (Espace / Ctrl / C)" disabled={launching} onClick={() => command('launch')}>{launching ? 'Pliage…' : 'Décoller'}</button>}
      {flying && <button className="btn btn-sm btn-outline-secondary" title="Changer de vue (C)" onClick={() => command('view')}>{viewLabels[viewMode]}</button>}
      <button className="btn btn-sm btn-outline-secondary text-truncate plane-model" title="Changer d’avion (V)" onClick={onCycleModel}>{modelLabel}</button>
      <button className="btn btn-sm btn-outline-secondary" title="Quitter (F / Échap)" aria-label="Quitter le vol" onClick={onExit}><i className="bi bi-x-lg" aria-hidden="true" /></button>
      <button className="btn btn-sm btn-outline-secondary" title="Commandes" aria-label="Afficher les commandes" aria-expanded={showHelp} onClick={() => setShowHelp(value => !value)}><i className="bi bi-question-lg" aria-hidden="true" /></button>
    </div>
    {(viewMode === 'landing' || viewMode === 'landed') && <div className="plane-status small text-center rounded-3 p-1">{viewMode === 'landing' ? 'Atterrissage automatique…' : 'Atterri'}</div>}
    {showHelp && <div className="plane-help small text-center rounded-3 p-2">↑↓ Tangage / looping · ←→ Virage / vrille · Espace/Ctrl Gaz · Shift Frein · C Vue · V Avion · F Quitter</div>}
    <div className="plane-touch">
      <div className="plane-sensor d-flex align-items-center gap-1 rounded-3 p-1">
        <button className={`btn btn-sm ${gyro ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={gyro} onClick={toggleGyro}>Gyroscope</button>
        {gyro && <button className="btn btn-sm btn-outline-secondary" onClick={() => { neutral.current = latest.current?.clone() ?? null; planeInput.pitch = planeInput.roll = 0; }}>Recentrer</button>}
      </div>
      {message && <div role="status" className="plane-message small text-center rounded-3 p-1">{message}</div>}
      {flying && <>
        {!gyro && <div className="plane-dpad">
          {holdButton('up', '↑', 'Piquer / looping avant')}{holdButton('left', '←', 'Virer à gauche')}{holdButton('right', '→', 'Virer à droite')}{holdButton('down', '↓', 'Cabrer / looping arrière')}
        </div>}
        <div className="plane-throttle d-flex flex-column gap-1">{holdButton('boost', '+ Gaz', 'Accélérer')}{holdButton('brake', '− Gaz', 'Freiner')}</div>
      </>}
    </div>
  </div>;
}
