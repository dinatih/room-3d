import { useEffect, useId, useState } from 'react';
import { cameraState } from '../scene/cameraState';
import { useSceneStore } from '../scene/store/useSceneStore';
import { connectHomeAssistant, disconnectHomeAssistant, resumeHomeAssistant, stopHomeAssistant, useHomeAssistant, LIGHTS, LIGHT_KEYS } from './connection';

export function HomeAssistantSync() {
  useEffect(() => {
    const unsubscribe = useHomeAssistant.subscribe(({ enabled, lights }) => {
      if (!enabled) return;
      const furniture = { ...useSceneStore.getState().furniture };
      let changed = false;
      for (const key of LIGHT_KEYS) {
        const on = lights[key].on;
        if (on !== null && furniture[key] !== on) { furniture[key] = on; changed = true; }
      }
      if (changed) {
        useSceneStore.setState({ furniture });
        cameraState.invalidate?.();
      }
    });
    resumeHomeAssistant();
    return () => { unsubscribe(); stopHomeAssistant(); };
  }, []);
  return null;
}

export function HomeAssistantPanel() {
  const inputId = useId();
  const { enabled, status, lights, error } = useHomeAssistant();
  const [url, setUrl] = useState(location.protocol === 'https:' ? 'https://ha.dinatih.org' : 'http://192.168.1.68:8123');
  return (
    <div className="p-2 border-bottom small">
      <div className="fw-bold mb-1">Home Assistant</div>
      {enabled ? <>
        <div role="status" className="mb-1">
          {status === 'connected' ? 'Connecté' : status === 'connecting' ? 'Connexion en cours…' : status === 'reconnecting' ? 'Reconnexion en cours…' : 'Connexion en erreur'}
        </div>
        {LIGHT_KEYS.map(key => <div key={key} className="mb-1">
          {LIGHTS[key].label} · {status !== 'connected' ? 'État périmé' : !lights[key].available ? 'Indisponible' : lights[key].on ? 'Allumée' : 'Éteinte'}
          {lights[key].pending && ' · Commande en cours…'}
          {lights[key].error && <div role="alert" className="text-danger">{lights[key].error}</div>}
        </div>)}
        <button className="btn btn-sm btn-outline-secondary" onClick={disconnectHomeAssistant}>Déconnecter Home Assistant</button>
      </> : <form onSubmit={event => { event.preventDefault(); void connectHomeAssistant(url); }}>
        <label className="form-label mb-1" htmlFor={inputId}>Adresse de Home Assistant</label>
        <input id={inputId} className="form-control form-control-sm mb-2" type="url" required value={url} onChange={event => setUrl(event.target.value)} />
        <button className="btn btn-sm btn-primary" type="submit">Connecter Home Assistant</button>
        <div className="text-muted mt-1">Sans connexion : simulation. La connexion permet de commander les vrais éclairages associés.</div>
      </form>}
      {error && <div role="alert" className="text-danger mt-2">{error}</div>}
    </div>
  );
}
