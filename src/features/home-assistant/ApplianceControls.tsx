import { APPLIANCES, type ApplianceAction } from './appliances';
import { isHomeAssistantControlDisabled, requestHomeAssistantAction, useHomeAssistant } from './connection';

export function ApplianceControls() {
  const state = useHomeAssistant();
  const button = (action: ApplianceAction, label: string, value?: boolean | number) => <button
    className="btn btn-sm btn-outline-secondary" disabled={isHomeAssistantControlDisabled(action, state)}
    onClick={() => void requestHomeAssistantAction(action, value)}>{label}</button>;
  const fan = state.entities[APPLIANCES.airPerformerPower.entity];
  const mode = state.entities[APPLIANCES.airPerformerMode.entity];
  const cover = state.entities[APPLIANCES.glassDoorV2ShutterPos.entity];
  const tv = state.entities[APPLIANCES.tvOn.entity];
  return <div className="my-2 d-flex flex-column gap-2">
    <div>
      <div>{fan?.attributes.friendly_name ?? 'Purificateur'} · {fan?.state ?? 'Absent'} · {fan?.attributes.percentage ?? '—'} %</div>
      <div className="d-flex flex-wrap gap-1">
        {button('airPerformerPower', 'Marche / arrêt purificateur')}
        {button('airPerformerSpeed', 'Vitesse suivante')}
        <select aria-label="Fonction du purificateur" className="form-select form-select-sm w-auto"
          disabled={isHomeAssistantControlDisabled('airPerformerMode', state)} value={mode?.state ?? ''}
          onChange={event => void requestHomeAssistantAction('airPerformerMode', event.target.value)}>
          {!mode && <option value="">Indisponible</option>}
          {mode?.attributes.options?.map((option: string) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      <div>PM2.5 : {state.entities['sensor.living_room_pm2_5']?.state ?? '—'} µg/m³</div>
    </div>
    <div>
      <div>{cover?.attributes.friendly_name ?? 'Volet'} · ouverture {cover?.attributes.current_position ?? '—'} %</div>
      <div className="d-flex gap-1">
        {button('glassDoorV2ShutterPos', 'Ouvrir volet', 0)}
        {button('glassDoorV2ShutterPos', 'Fermer volet', 100)}
        {button('shutterStop', 'Arrêter volet')}
      </div>
    </div>
    <div>
      <div>{tv?.attributes.friendly_name ?? 'Télévision'} · {tv?.state ?? 'Absente'}</div>
      {button('tvOn', 'Marche / arrêt télévision')}
    </div>
    {Object.entries(state.applianceCommands).map(([key, command]) => <div key={key}>
      {command.pending && <span role="status">Commande en cours…</span>}
      {command.error && <span role="alert" className="text-danger">{command.error}</span>}
    </div>)}
  </div>;
}
