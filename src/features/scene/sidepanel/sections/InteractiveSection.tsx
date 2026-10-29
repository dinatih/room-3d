import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AIR_PERFORMER_ACTION_IDS, AIR_PERFORMER_CONTROLS } from '../../../home-assistant/airPerformer';
import { AIRCRAFT_MODELS } from '../../aircraftModels';
import { useSceneStore, getSceneActionValue } from '../../store/useSceneStore';
import { positionState } from '@features/scene/positionState';
import { DOUBLE_BED_POSITIONS } from '../../furniturePositions';
import { dispatchKey, type FurnitureState } from '../types';
import type { PlaneModelKey } from '@features/scene/PaperPlane';
import { getActionLabel } from '../../objectActionRegistry';
import { HomeAssistantPanel } from '../../../home-assistant/HomeAssistant';
import { isHomeAssistantLinked, isHomeAssistantLight, isHomeAssistantControlDisabled, useHomeAssistant } from '../../../home-assistant/connection';

export interface InteractiveSectionProps {
  isMobile: boolean;
  planeModel?: PlaneModelKey;
  onSetPlaneModel?: (m: PlaneModelKey) => void;
  autopilotVisible?: boolean;
  onToggleAutopilot?: () => void;
  showLandingStrips?: boolean;
  onToggleLandingStrips?: () => void;
}

export function InteractiveSection({
  isMobile: _isMobile,
  planeModel = 'origami',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
}: InteractiveSectionProps) {
  const furniture = useSceneStore(state => state.furniture);
  const ha = useHomeAssistant();
  const toggleFurniture = useSceneStore(state => state.toggleFurniture);
  const triggerAction = useSceneStore(state => state.triggerAction);
  useSceneStore(state => state.extraStates);
  useSceneStore(state => state.desk2ScreenActive);

  const actionButton = (label: ReactNode, badge: ReactNode, props: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small bg-transparent"
      {...props}
    >
      <span>{label}</span>{badge}
    </button>
  );

  const doorBtn = (label: string, key: string) => (
    actionButton(label, <span className="badge bg-secondary">{getActionLabel(key, getSceneActionValue(key))}</span>, { onClick: () => triggerAction(key) })
  );

  const triggerBtn = (label: string, actionKey: string, badgeLabel = 'Action') => (
    actionButton(label, <span className="badge bg-secondary">{badgeLabel}</span>, {
      disabled: isHomeAssistantControlDisabled(actionKey, ha),
      onClick: () => triggerAction(actionKey, undefined, 'user'),
    })
  );

  const furnitureBtn = (
    label: string,
    key: keyof FurnitureState,
    txtOn = 'ON',
    txtOff = 'OFF',
    displayValue?: (val: any) => string
  ) => {
    const val = furniture[key];
    const isOn = typeof val === 'boolean' ? val : !!val;
    const unavailable = isHomeAssistantLight(key) && isHomeAssistantLinked(ha) && (ha.status !== 'connected' || !ha.lights[key].available);
    return actionButton(
      isHomeAssistantLight(key) && isHomeAssistantLinked(ha) ? ha.lights[key].name ?? label : label,
      <span className={`badge ${isOn ? 'bg-danger' : 'bg-secondary'}`}>
          {unavailable ? 'INDISPONIBLE' : displayValue ? displayValue(val) : (isOn ? txtOn : txtOff)}
      </span>,
      { disabled: isHomeAssistantControlDisabled(key, ha), onClick: () => toggleFurniture(key), style: { opacity: isOn ? 1 : 0.55 } }
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent">
      <HomeAssistantPanel />
      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">PORTES & FENÊTRES</div>
      {doorBtn('Porte Entrée', 'entryDoor')}
      {doorBtn('Porte Séjour', 'livingDoor')}
      {doorBtn('Porte SDB', 'bathroomDoor')}
      {doorBtn('Porte Douche', 'showerDoor')}
      {doorBtn('Baie Vitrée Est', 'eastGlassDoor')}
      {doorBtn('Baie Vitrée Ouest', 'glassDoorV2LeftOpen')}
      {furnitureBtn('Volets', 'glassDoorV2ShutterPos', 'ON', 'OFF', v => typeof v === 'number' ? (v === 0 ? 'OUVERT' : v === 100 ? 'FERMÉ' : `${v}%`) : `${v}%`)}

      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">PLACARDS</div>
      {furnitureBtn('Placard Couloir', 'corrDoors', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Placard SDB Gauche', 'sdbClosetL', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Placard SDB Droite', 'sdbClosetR', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Armoire SDB Ouest', 'cbnWest', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Armoire SDB Est', 'cbnEast', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Meuble sous évier', 'cabinet', 'OUVERT', 'FERMÉ')}

      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">MOBILIER & ÉLECTRO</div>
      {furnitureBtn('Lit Double', 'bedDouble', 'DOUBLE', 'SÉPARÉ')}
      {furniture.bedDouble && (
        actionButton('Lit Double (Position)', <span className="badge bg-primary">
            {(() => {
              const p = positionState['bed-position'];
              return DOUBLE_BED_POSITIONS[p?.idx ?? 0]?.label ?? `Pos ${(p?.idx ?? 0) + 1}`;
            })()}
          </span>, { onClick: () => {
            document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-position' } }));
          } })
      )}
      {furnitureBtn('Accoudoir Canapé Gauche', 'sofaArmLeft')}
      {furnitureBtn('Accoudoir Canapé Droit', 'sofaArmRight')}
      {furnitureBtn('Congélateur', 'freezerOpen', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Réfrigérateur', 'fridge', 'OUVERT', 'FERMÉ')}
      <button className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 small"
        onClick={() => triggerAction('fridge-crisper-toggle')}>
        Bac à légumes — Sortir / Rentrer
      </button>
      {furnitureBtn('TV Allumée', 'tvOn')}
      <button
        type="button"
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 small bg-transparent"
        onClick={() => triggerAction('desk2-screen-toggle')}
      >
        {getActionLabel('desk2-screen-toggle', getSceneActionValue('desk2-screen-toggle'))}
      </button>
      {triggerBtn('Bureau 1 (Assis/Debout)', 'desk1-toggle')}
      {triggerBtn('Bureau 1 (Position)', 'desk1-position')}
      {triggerBtn('Bureau 2 (Assis/Debout)', 'desk2-toggle')}
      {triggerBtn('Bureau 2 (Position)', 'desk2-position')}
      {triggerBtn('Smorkull (Position)', 'smorkull-position')}
      {AIR_PERFORMER_ACTION_IDS.map(id => <div key={id}>{triggerBtn(`Air Performer · ${AIR_PERFORMER_CONTROLS[id].label}`, id, getActionLabel(id, getSceneActionValue(id)))}</div>)}
      {triggerBtn('Air Performer (Position)', 'airperformer-position')}
      {triggerBtn('WC Couvercle', 'wc-lid-toggle')}
      {triggerBtn('WC Siège', 'wc-seat-toggle')}
      {triggerBtn('WC Chasse d\'eau', 'wc-flush')}

      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase"><i className="bi bi-airplane me-1" aria-hidden="true" />Expériences & avion</div>
      <button
        className="btn btn-sm btn-outline-danger w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 fw-bold small"
        onClick={() => dispatchKey('f')}
      >
        <i className="bi bi-airplane-fill me-2" aria-hidden="true" />Lancer / Quitter Avion [F]
      </button>
      <div className="p-2 border-bottom bg-transparent">
        <div className="text-muted fw-semibold mb-1 small text-uppercase">
          Modèle d'avion
        </div>
        <select className="form-select form-select-sm" aria-label="Modèle d'avion" value={planeModel} onChange={event => onSetPlaneModel?.(event.target.value as PlaneModelKey)}>
                  {AIRCRAFT_MODELS.map(entry => <option key={entry.key} value={entry.key}>{entry.label}</option>)}
                </select>
      </div>
      {actionButton('Pilote auto ∞', <span className={`badge ${autopilotVisible ? 'bg-danger' : 'bg-secondary'}`}>
          {autopilotVisible ? 'ON' : 'OFF'}
        </span>, { onClick: onToggleAutopilot, style: { opacity: autopilotVisible ? 1 : 0.55 } })}
      {actionButton(<><i className="bi bi-sign-turn-right me-1" aria-hidden="true" />Pistes</>, <span className={`badge ${showLandingStrips ? 'bg-danger' : 'bg-secondary'}`}>
          {showLandingStrips ? 'ON' : 'OFF'}
        </span>, { onClick: onToggleLandingStrips, style: { opacity: showLandingStrips ? 1 : 0.55 } })}

      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">LUMIÈRES</div>
      {furnitureBtn('Lampe SDB', 'lampBath')}
      {furnitureBtn('Lampe Couloir', 'lampCorridor')}
      {furnitureBtn('Barre · Cuisine', 'lampKitchen')}
      {furnitureBtn('Lumière Séjour (OLA)', 'lampOn')}
    </div>
  );
}
