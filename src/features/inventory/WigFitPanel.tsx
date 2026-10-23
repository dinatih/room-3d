import { useState } from 'react';
import { DEFAULT_WIG_FIT, useWigFitStore, type WigFit } from './useWigFitStore';

const FIELDS: { key: keyof WigFit; label: string; step: number }[] = [
  { key: 'scale', label: 'Taille (%)', step: 1 },
  { key: 'x', label: 'X · Gauche / droite (cm)', step: 0.1 },
  { key: 'y', label: 'Y · Bas / haut (cm)', step: 0.1 },
  { key: 'z', label: 'Z · Arrière / avant (cm)', step: 0.1 },
  { key: 'rx', label: 'Inclinaison X (°)', step: 1 },
  { key: 'ry', label: 'Rotation Y (°)', step: 1 },
  { key: 'rz', label: 'Inclinaison Z (°)', step: 1 },
];

export function WigFitPanel({ wigId }: { wigId: string }) {
  const fit = useWigFitStore(state => state.fits[wigId] ?? DEFAULT_WIG_FIT);
  const update = useWigFitStore(state => state.update);
  const reset = useWigFitStore(state => state.reset);
  const [message, setMessage] = useState('');
  return (
    <details open className="border rounded bg-light p-2 m-2" onKeyDown={event => event.stopPropagation()}>
      <summary className="fw-semibold small">Ajustement temporaire de la perruque sur Lara</summary>
      <div className="small text-muted my-2">Réglages par coupe, conservés dans ce navigateur. 100 % = taille de base{wigId === 'hair_lara_native' ? ' native inchangée' : ', déjà réduite de 10 %'}.</div>
      <div className="row g-2">
        {FIELDS.map(({ key, label, step }) => (
          <label key={key} className="col-6 col-lg-3 small">
            {label}
            <input type="number" className="form-control form-control-sm" aria-label={label} step={step}
              min={key === 'scale' ? step : undefined} value={Number((fit[key] * (key === 'scale' ? 100 : 1)).toFixed(3))}
              onChange={event => {
                const value = event.currentTarget.valueAsNumber;
                if (Number.isFinite(value) && (key !== 'scale' || value > 0)) update(wigId, { [key]: value / (key === 'scale' ? 100 : 1) });
              }} />
          </label>
        ))}
      </div>
      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => reset(wigId)}>Réinitialiser cette coupe</button>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={async () => {
          try {
            await navigator.clipboard.writeText(JSON.stringify(useWigFitStore.getState().fits, null, 2));
            setMessage('Réglages copiés');
          } catch (error) { setMessage(`Copie impossible : ${String(error)}`); }
        }}>Copier tous les réglages</button>
        <span className="small" role="status">{message}</span>
      </div>
    </details>
  );
}
