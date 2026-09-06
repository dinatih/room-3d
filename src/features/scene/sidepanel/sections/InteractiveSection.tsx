import { useSceneStore } from '../../store/useSceneStore';
import { positionState } from '@features/scene/positionState';
import { dispatchKey, type FurnitureState } from '../types';
import type { PlaneModelKey } from '@features/scene/PaperPlane';

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
  isMobile,
  planeModel = 'paper',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
}: InteractiveSectionProps) {
  const furniture = useSceneStore(state => state.furniture);
  const toggleFurniture = useSceneStore(state => state.toggleFurniture);

  const triggerBtn = (label: string, actionKey: string, badgeLabel = 'Action') => {
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => {
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: actionKey } }));
        }}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
        }}
      >
        <span>{label}</span>
        <span className="badge bg-secondary" style={{ fontSize: '9px' }}>
          {badgeLabel}
        </span>
      </button>
    );
  };

  const furnitureBtn = (
    label: string,
    key: keyof FurnitureState,
    txtOn = 'ON',
    txtOff = 'OFF',
    displayValue?: (val: any) => string
  ) => {
    const val = furniture[key];
    const isOn = typeof val === 'boolean' ? val : !!val;
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => toggleFurniture(key)}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
          opacity: isOn ? 1 : 0.55,
        }}
      >
        <span>{label}</span>
        <span className={`badge ${isOn ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {displayValue ? displayValue(val) : (isOn ? txtOn : txtOff)}
        </span>
      </button>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>PORTES & FENÊTRES</div>
      {furnitureBtn('Porte Entrée', 'entryDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte Séjour', 'livingDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte SDB', 'bathroomDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Baie Vitrée Est', 'eastGlassDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Baie Vitrée Ouest', 'glassDoorV2LeftOpen', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Volets', 'glassDoorV2ShutterPos', 'ON', 'OFF', v => typeof v === 'number' ? (v === 0 ? 'OUVERT' : v === 100 ? 'FERMÉ' : `${v}%`) : `${v}%`)}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>PLACARDS</div>
      {furnitureBtn('Placard Couloir', 'corrDoors', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Placard SDB Gauche', 'sdbClosetL', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Placard SDB Droite', 'sdbClosetR', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Armoire SDB Ouest', 'cbnWest', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Armoire SDB Est', 'cbnEast', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Meuble sous évier', 'cabinet', 'OUVERT', 'FERMÉ')}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>MOBILIER & ÉLECTRO</div>
      {furnitureBtn('Lit Double', 'bedDouble', 'DOUBLE', 'SÉPARÉ')}
      {furniture.bedDouble && (
        <button
          className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
          onClick={() => {
            document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-position' } }));
          }}
          style={{
            fontSize: isMobile ? '14px' : '11px',
            minHeight: isMobile ? '48px' : undefined,
            background: 'transparent',
          }}
        >
          <span>Lit Double (Position)</span>
          <span className="badge bg-primary" style={{ fontSize: '9px' }}>
            {(() => {
              const p = positionState['bed-position'];
              const labels = ['Centré', 'Mur Ouest', 'Mur Est'];
              return p ? labels[p.idx] ?? `Pos ${p.idx + 1}` : 'Centré';
            })()}
          </span>
        </button>
      )}
      {furnitureBtn('Accoudoir Canapé Gauche', 'sofaArmLeft')}
      {furnitureBtn('Accoudoir Canapé Droit', 'sofaArmRight')}
      {furnitureBtn('Congélateur', 'freezerOpen', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Réfrigérateur', 'fridge', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('TV Allumée', 'tvOn')}
      {triggerBtn('Bureau 1 (Assis/Debout)', 'desk1-toggle')}
      {triggerBtn('Bureau 1 (Position)', 'desk1-position')}
      {triggerBtn('Bureau 2 (Assis/Debout)', 'desk2-toggle')}
      {triggerBtn('Bureau 2 (Position)', 'desk2-position')}
      {triggerBtn('Smorkull (Position)', 'smorkull-position')}
      {triggerBtn('Air Performer (Power)', 'airPerformerPower')}
      {triggerBtn('Air Performer (Mode)', 'airPerformerMode')}
      {triggerBtn('Air Performer (Vitesse)', 'airPerformerSpeed')}
      {triggerBtn('Air Performer (Position)', 'airperformer-position')}
      {triggerBtn('WC Couvercle', 'wc-lid-toggle')}
      {triggerBtn('WC Siège', 'wc-seat-toggle')}
      {triggerBtn('WC Chasse d\'eau', 'wc-flush')}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>EXPÉRIENCES & AVION ✈</div>
      <button
        className="btn btn-outline-danger w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 fw-bold"
        onClick={() => dispatchKey('f')}
        style={{ fontSize: isMobile ? '13px' : '11px' }}
      >
        ✈ Lancer / Quitter Avion [F]
      </button>
      <div className="p-2 border-bottom bg-transparent">
        <div className="text-muted fw-semibold mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Modèle d'avion
        </div>
        <div className="d-flex gap-1">
          <button 
            className={`btn btn-sm flex-grow-1 p-1 ${planeModel === 'paper' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('paper')}
            style={{ fontSize: '9px' }}
          >
            Papier
          </button>
          <button 
            className={`btn btn-sm flex-grow-1 p-1 ${planeModel === 'rocket' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('rocket')}
            style={{ fontSize: '9px' }}
          >
            Fusée
          </button>
          <button 
            className={`btn btn-sm flex-grow-1 p-1 ${planeModel === 'comet' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('comet')}
            style={{ fontSize: '9px' }}
          >
            Comète
          </button>
        </div>
      </div>
      <button
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={onToggleAutopilot}
        style={{ 
          fontSize: isMobile ? '13px' : '11px', 
          background: 'transparent',
          opacity: autopilotVisible ? 1 : 0.55,
        }}
      >
        <span>Pilote auto ∞</span>
        <span className={`badge ${autopilotVisible ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {autopilotVisible ? 'ON' : 'OFF'}
        </span>
      </button>
      <button
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={onToggleLandingStrips}
        style={{ 
          fontSize: isMobile ? '13px' : '11px', 
          background: 'transparent',
          opacity: showLandingStrips ? 1 : 0.55,
        }}
      >
        <span>Pistes 🛬</span>
        <span className={`badge ${showLandingStrips ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {showLandingStrips ? 'ON' : 'OFF'}
        </span>
      </button>

      <div className="text-muted fw-bold p-2 bg-light border-bottom" style={{ fontSize: '10px' }}>LUMIÈRES</div>
      {furnitureBtn('Lampe SDB', 'lampBath')}
      {furnitureBtn('Lampe Couloir', 'lampCorridor')}
      {furnitureBtn('Lampe Ola', 'lampOn')}
    </div>
  );
}
