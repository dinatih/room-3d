import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { cameraState } from './cameraState';
import { planeInput } from './planeInput';
import type { PlaneViewMode } from './PaperPlane';
import './PlaneControls.css';

const FULL_TILT = THREE.MathUtils.degToRad(30);
const screenCorrection = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const command = (detail: string) => document.dispatchEvent(new CustomEvent('plane-command', { detail }));

export function PlaneControls({ viewMode, launched, onExit }: { viewMode: PlaneViewMode; launched: boolean; onExit: () => void }) {
  const [speed, setSpeed] = useState(0);
  const [gyro, setGyro] = useState(false);
  const [message, setMessage] = useState('');
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
    const timer = window.setInterval(() => setSpeed(cameraState.planeSpeed * 0.036), 100);
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
    return <button type="button" className={`btn btn-outline-light plane-hold plane-${action}`} aria-label={title} title={title} disabled={!flying} onPointerDown={e => press(e, action)} onPointerUp={lift} onPointerCancel={lift} onLostPointerCapture={lift}>{label}</button>;
  }
  return <div className="plane-controls text-white">
    <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-2">
      <output className="plane-speed px-2" aria-label="Vitesse">{speed.toFixed(1)} <small>km/h</small></output>
      {!launched && <button className="btn btn-sm btn-light" onClick={() => command('launch')}>Décoller</button>}
      {flying && <button className="btn btn-sm btn-outline-light" onClick={() => command('view')}>Vue : {viewMode}</button>}
      <button className="btn btn-sm btn-outline-light" onClick={onExit}>Quitter</button>
    </div>
    {(viewMode === 'landing' || viewMode === 'landed') && <div className="small text-center">{viewMode === 'landing' ? 'Atterrissage automatique…' : 'Atterri'}</div>}
    <div className="plane-touch">
      <div className="d-flex justify-content-center gap-2 mb-2">
        <button className={`btn btn-sm ${gyro ? 'btn-light' : 'btn-outline-light'}`} aria-pressed={gyro} onClick={toggleGyro}>Gyroscope</button>
        {gyro && <button className="btn btn-sm btn-outline-light" onClick={() => { neutral.current = latest.current?.clone() ?? null; planeInput.pitch = planeInput.roll = 0; }}>Recentrer</button>}
      </div>
      {message && <div role="status" className="small text-center mb-2">{message}</div>}
      <div className="d-flex align-items-center justify-content-between gap-3">
        {!gyro && <div className="plane-dpad">
          {holdButton('up', '↑', 'Piquer')}{holdButton('left', '←', 'Virer à gauche')}{holdButton('right', '→', 'Virer à droite')}{holdButton('down', '↓', 'Cabrer')}
        </div>}
        <div className="d-flex flex-column gap-2 ms-auto">{holdButton('boost', '+ Gaz', 'Accélérer')}{holdButton('brake', '− Gaz', 'Freiner')}</div>
      </div>
    </div>
    <div className="plane-keyboard small text-center">↑↓ Tangage · ←→ Virage · Espace Gaz · Shift Frein · C Vue · F Quitter</div>
  </div>;
}
