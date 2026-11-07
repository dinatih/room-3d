import { useState, useEffect } from 'react';
import { useSceneStore, getRandomGrassType } from './store/useSceneStore';
import { HDRI_LIST, type HdriResolution } from '@features/scene/hdriConfig';
import type { GroundType, LayerState } from './sidepanel/types';
import { PanelPopover } from './sidepanel/PanelPopover';
import { WeatherControls } from './Weather';
import { solarPosition } from './SunLight';
import { advanceToTime, useLaraLifeStore } from './ai/laraLifeStore';
import { cameraState } from './cameraState';
import { isLifeCharacter, lifeClock, LIFE_SPEEDS } from './ai/laraLife';
import { HOME_ROOMS, HOME_TASKS, roomDirt, type HomeTask } from './ai/lifeHousekeeping';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

const GROUND_OPTIONS: { id: GroundType; label: string }[] = [
  { id: 'bermuda', label: 'Gazon Bermuda' },
  { id: 'medium_01', label: 'Gazon Moyen 1' },
  { id: 'medium_02', label: 'Gazon Moyen 2' },
  { id: 'celandine', label: 'Prairie Fleurie' },
];

export function EnvironmentButton({ hideUI = false }: { hideUI?: boolean }) {
  const layers = useSceneStore(state => state.layers);
  const toggleLayer = useSceneStore(state => state.toggleLayer);
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);
  const hdriResolution = useSceneStore(state => state.hdriResolution);
  const setHdriResolution = useSceneStore(state => state.setHdriResolution);
  const setGroundType = useSceneStore(state => state.setGroundType);
  const currentGroundType = layers.groundType ?? 'bermuda';

  // Système de vie : heure simulée & besoin environnement
  const { characters, speed, home } = useLaraLifeStore();
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const selectedCharacterId = isLifeCharacter(activeCharacterId) ? activeCharacterId : 'native';
  const character = characters[selectedCharacterId];
  const clock = lifeClock(character?.elapsedSeconds ?? 0);
  const hourFloat = (8 + (character?.elapsedSeconds ?? 0) / 60) % 24;
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const commitTime = (minute: number) => {
    advanceToTime(minute);
    setSelectedMinute(null);
    cameraState.invalidate?.();
  };

  const envNeed = roomDirt(home, character?.room ?? 'living');
  const cleanliness = `${HOME_ROOMS[character?.room ?? 'living']} · 0 % = propre. ` + (Object.keys(HOME_TASKS) as HomeTask[])
    .filter(key => HOME_TASKS[key].room === (character?.room ?? 'living'))
    .map(key => `${HOME_TASKS[key].label} : ${Math.round(home[key])} %`).join(' · ');

  // Soleil réel
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  useEffect(() => {
    if (!layers.realSun) { setSunInfo(null); return; }
    const update = () => {
      const now = new Date();
      const { elevation } = solarPosition(SUN_LAT, SUN_LNG, now);
      setSunInfo({
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        el: Math.round(elevation),
      });
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [layers.realSun]);

  const activeHdri = HDRI_LIST.find(h => h.id === currentHdri);
  const displayName = activeHdri?.name || '';
  const fileName = activeHdri ? activeHdri.url.split('/').pop() : '';

  const handleRandomHdri = () => {
    const otherHdris = HDRI_LIST.filter(h => h.id !== currentHdri);
    const next = otherHdris[Math.floor(Math.random() * otherHdris.length)];
    if (next) setHdri(next.id);
  };

  const toggleRow = (label: React.ReactNode, key: keyof LayerState) => {
    const on = !!layers[key];
    return (
      <div className="d-flex align-items-center justify-content-between py-1 px-3 border-bottom">
        <span className="small text-dark">{label}</span>
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 rounded-pill small ${on ? 'btn-danger' : 'btn-secondary'}`}
          style={{ fontSize: '0.75rem', lineHeight: '1.4' }}
          onClick={() => toggleLayer(key)}
        >
          {on ? 'ON' : 'OFF'}
        </button>
      </div>
    );
  };

  return (
    <PanelPopover
      icon="bi-cloud-sun-fill"
      label={clock.time}
      title="Environnement & Météo"
      triggerStyle={{ width: '5rem', fontVariantNumeric: 'tabular-nums' }}
      hideUI={hideUI}
    >
      <div className="d-flex flex-column bg-transparent">
        {/* 1. Ligne de 24h & Accélérateur */}
        <div className="p-2 border-bottom">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="fw-bold small text-dark d-flex align-items-center gap-1">
              <i className="bi bi-clock-fill text-primary" aria-hidden="true" />
              {clock.time}
              <span className="text-muted fw-normal ms-1">· Jour {clock.day} ({clock.period})</span>
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-dark py-0 px-2 text-nowrap small"
              title="Accélérer la vie de la colocation : ×1, ×3, ×10"
              onClick={() => useLaraLifeStore.setState({ speed: LIFE_SPEEDS[(LIFE_SPEEDS.indexOf(speed) + 1) % LIFE_SPEEDS.length] })}
            >
              <i className="bi bi-fast-forward-fill me-1" aria-hidden="true" />×{speed}
            </button>
          </div>

          <input type="range" className="form-range day-time-range my-1" min={0} max={24 * 60} step={1}
            aria-label="Avancer l’heure de la journée" title="Avancer à cette heure ; une heure antérieure passe au lendemain"
            value={selectedMinute ?? Math.floor(hourFloat * 60)} onChange={event => setSelectedMinute(Number(event.target.value))}
            onPointerUp={event => commitTime(Number(event.currentTarget.value))} onPointerCancel={() => setSelectedMinute(null)}
            onKeyDown={event => event.stopPropagation()} onKeyUp={event => { event.stopPropagation(); if (selectedMinute !== null) commitTime(Number(event.currentTarget.value)); }}
            onBlur={event => { if (selectedMinute !== null) commitTime(Number(event.currentTarget.value)); }} />
          <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.65rem' }}>
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
          </div>

          {/* Jauge Environnement du système de vie */}
          <div className="d-flex align-items-center justify-content-between gap-2 mt-2 pt-2 border-top" title={cleanliness}>
            <span className="small text-muted text-nowrap">Environnement :</span>
            <div className="progress flex-grow-1" style={{ height: '7px' }}>
              <div
                className={`progress-bar ${envNeed > 70 ? 'bg-danger' : envNeed > 40 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${Math.min(100, Math.max(0, envNeed))}%` }}
              />
            </div>
            <span className="small fw-semibold text-end" style={{ width: '36px' }}>{Math.round(envNeed)}%</span>
          </div>
        </div>

        {/* 2. Contrôles de météo */}
        <WeatherControls />

        {/* 3. Ciel & Atmosphère */}
        {toggleRow(
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi bi-cloud-sun" aria-hidden="true" />Ciel & Atmosphère
          </span>,
          'environment'
        )}

        {/* 4. Ambiance HDRI / Ciel */}
        <div className="p-2 border-bottom d-flex flex-column gap-1">
          <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
            <div className="text-muted fw-semibold text-dark text-nowrap small text-uppercase">
              <i className="bi bi-cloud-sun me-1" aria-hidden="true" />Ambiance HDRI / Ciel
            </div>
            <div className="d-flex align-items-center gap-1 text-end overflow-hidden" style={{ minWidth: 0 }}>
              {displayName ? (
                <span className="text-dark fw-medium text-truncate flex-grow-1 small" title={displayName}>
                  {displayName}
                </span>
              ) : null}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-0 px-1 border-0 flex-shrink-0"
                onClick={handleRandomHdri}
                title="HDRI aléatoire (Touche 5)"
              >
                <i className="bi bi-shuffle" aria-hidden="true" />
              </button>
            </div>
          </div>
          <select
            className="form-select form-select-sm bg-transparent text-dark border-secondary"
            onKeyDown={(e) => e.stopPropagation()}
            value={currentHdri}
            onChange={(e) => setHdri(e.target.value)}
          >
            {HDRI_LIST.map((h) => (
              <option key={h.id} value={h.id} className="bg-light text-dark">
                {h.name}
              </option>
            ))}
          </select>
          <div className="d-flex align-items-center gap-2 mt-1">
            <label htmlFor="env-hdri-resolution" className="text-muted small text-nowrap">
              Résolution HDRI
            </label>
            <select
              id="env-hdri-resolution"
              className="form-select form-select-sm bg-transparent text-dark border-secondary"
              value={hdriResolution}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => setHdriResolution(e.target.value as HdriResolution)}
            >
              <option value="2k">2K — Léger</option>
              <option value="4k">4K — Équilibré</option>
              <option value="8k">8K — Détaillé</option>
            </select>
          </div>
          {fileName ? (
            <div
              className="text-muted mt-1 small font-monospace"
              style={{ userSelect: 'all', wordBreak: 'break-all', whiteSpace: 'normal', fontSize: '0.75rem' }}
              title={fileName}
            >
              {fileName}
            </div>
          ) : null}
        </div>

        {/* 5. Herbe et terrain ext. + Type */}
        {toggleRow(
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi bi-tree" aria-hidden="true" />Herbe & Terrain ext.
          </span>,
          'bermudaGrass'
        )}
        {layers.bermudaGrass && (
          <div className="px-3 py-1 border-bottom bg-transparent d-flex align-items-center justify-content-between gap-2">
            <span className="text-muted small">Type :</span>
            <div className="d-flex align-items-center gap-1">
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary"
                style={{ maxWidth: '175px' }}
                value={currentGroundType}
                onChange={(e) => setGroundType(e.target.value as GroundType)}
              >
                {GROUND_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-light text-dark">
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                onClick={() => setGroundType(getRandomGrassType())}
                title="Herbe aléatoire"
              >
                <i className="bi bi-shuffle" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* 6. Soleil réel */}
        {toggleRow(
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi bi-sun" aria-hidden="true" />Soleil réel
          </span>,
          'realSun'
        )}
        {sunInfo && (
          <div className="p-2 border-bottom text-muted small bg-transparent">
            <i className="bi bi-sun me-1" aria-hidden="true" />{sunInfo.time} · {sunInfo.el > 0 ? `élév. ${sunInfo.el}°` : `sous l'horizon ${-sunInfo.el}°`}
          </div>
        )}
      </div>
    </PanelPopover>
  );
}
