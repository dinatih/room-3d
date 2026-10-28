import { AIR_PERFORMER_ACTION_IDS, AIR_PERFORMER_CONTROLS, AIR_PERFORMER_SENSORS } from './airPerformer';
import { APPLIANCES, applianceValue, type ApplianceAction } from './appliances';
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
      <div className="d-flex flex-wrap gap-2 mt-2">
        {AIR_PERFORMER_ACTION_IDS.filter(id => !['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed'].includes(id)).map(id => {
          const config = AIR_PERFORMER_CONTROLS[id];
          const entity = state.entities[config.entity];
          const value = applianceValue(id, entity);
          const disabled = isHomeAssistantControlDisabled(id, state) || !entity;
          const domain = config.entity.split('.')[0];
          const options: string[] | undefined = id === 'airPerformerPreset' ? entity?.attributes.preset_modes : domain === 'select' ? entity?.attributes.options : undefined;
          return <label key={id} className="small d-flex flex-column gap-1">
            {config.label}
            {options ? <select className="form-select form-select-sm w-auto" aria-label={config.label} disabled={disabled} value={String(value ?? '')}
              onChange={event => void requestHomeAssistantAction(id, event.target.value)}>
              <option value="" disabled>—</option>
              {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select> : domain === 'number' || domain === 'light' ? <input type="number" className="form-control form-control-sm" aria-label={config.label}
              disabled={disabled} min={domain === 'light' ? 0 : entity?.attributes.min} max={domain === 'light' ? 100 : entity?.attributes.max}
              step={domain === 'light' ? 1 : entity?.attributes.step} key={`${id}:${value}`} defaultValue={typeof value === 'number' ? value : ''}
              onBlur={event => {
                if (event.target.value !== '' && event.target.validity.valid && event.target.valueAsNumber !== value) void requestHomeAssistantAction(id, event.target.valueAsNumber);
                else event.target.value = value === undefined ? '' : String(value);
              }} />
              : <button type="button" className="btn btn-sm btn-outline-secondary" disabled={disabled}
                onClick={() => void requestHomeAssistantAction(id)}>{value === undefined ? '—' : value ? 'Activé' : 'Désactivé'}</button>}
          </label>;
        })}
      </div>
      <div className="small mt-2">
        {Object.entries(AIR_PERFORMER_SENSORS).map(([id, label]) => {
          const entity = state.entities[id];
          return <div key={id}>{label} : {entity?.state ?? '—'} {entity?.attributes.unit_of_measurement}</div>;
        })}
      </div>
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
