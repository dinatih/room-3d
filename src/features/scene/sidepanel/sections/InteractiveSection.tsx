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
  buildAnimMatrix?: boolean;
  onStartBuildAnimMatrix?: () => void;
  onStopBuildAnim?: () => void;
  animDurations?: Record<string, number>;
}

export function InteractiveSection({
  isMobile,
  planeModel = 'paper',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
  buildAnimMatrix = false,
  onStartBuildAnimMatrix,
  onStopBuildAnim,
  animDurations = {},
}: InteractiveSectionProps) {
  const furniture = useSceneStore(state => state.furniture);
  const toggleFurniture = useSceneStore(state => state.toggleFurniture);
  const gardenWallScan = useSceneStore(state => state.layers.gardenWallScan);

  const triggerBtn = (label: string, actionKey: string, badgeLabel = 'Action') => {
    return (
      <button 
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small bg-transparent"
        onClick={() => {
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: actionKey } }));
        }}
        style={{ 
          minHeight: isMobile ? '44px' : undefined,
        }}
      >
        <span>{label}</span>
        <span className="badge bg-secondary">
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
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small bg-transparent"
        onClick={() => toggleFurniture(key)}
        style={{ 
          minHeight: isMobile ? '44px' : undefined,
          opacity: isOn ? 1 : 0.55,
        }}
      >
        <span>{label}</span>
        <span className={`badge ${isOn ? 'bg-danger' : 'bg-secondary'}`}>
          {displayValue ? displayValue(val) : (isOn ? txtOn : txtOff)}
        </span>
      </button>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">PORTES & FENÊTRES</div>
      {furnitureBtn('Porte Entrée', 'entryDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte Séjour', 'livingDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte SDB', 'bathroomDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Porte Douche', 'showerDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Baie Vitrée Est', 'eastGlassDoor', 'OUVERT', 'FERMÉ')}
      {furnitureBtn('Baie Vitrée Ouest', 'glassDoorV2LeftOpen', 'OUVERT', 'FERMÉ')}
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
        <button
          className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small bg-transparent"
          onClick={() => {
            document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-position' } }));
          }}
          style={{
            minHeight: isMobile ? '44px' : undefined,
          }}
        >
          <span>Lit Double (Position)</span>
          <span className="badge bg-primary">
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
      {furnitureBtn('Boîtes DRÖNA', 'dronaMode', 'HIGH', 'LOW', v => v === 'high' ? 'High (45k)' : v === 'low' ? 'Low (1.6k)' : v === 'hidden' ? 'Caché (0t)' : 'Procédural (12t)')}
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
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">JARDIN & EXTÉRIEUR</div>
      {triggerBtn('Mur diagonal jardin', 'garden-wall-scan', gardenWallScan ? 'SCAN 3D' : 'CLASSIQUE')}
      
      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">EXPÉRIENCES & AVION ✈</div>
      <button
        className="btn btn-sm btn-outline-danger w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 fw-bold small"
        onClick={() => dispatchKey('f')}
      >
        ✈ Lancer / Quitter Avion [F]
      </button>
      <div className="p-2 border-bottom bg-transparent">
        <div className="text-muted fw-semibold mb-1 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
          Modèle d'avion
        </div>
        <div className="d-flex gap-1">
          <button 
            className={`btn btn-sm flex-grow-1 p-1 small ${planeModel === 'paper' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('paper')}
          >
            Papier
          </button>
          <button 
            className={`btn btn-sm flex-grow-1 p-1 small ${planeModel === 'rocket' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('rocket')}
          >
            Fusée
          </button>
          <button 
            className={`btn btn-sm flex-grow-1 p-1 small ${planeModel === 'comet' ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => onSetPlaneModel?.('comet')}
          >
            Comète
          </button>
        </div>
      </div>
      <button
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small bg-transparent"
        onClick={onToggleAutopilot}
        style={{ 
          opacity: autopilotVisible ? 1 : 0.55,
        }}
      >
        <span>Pilote auto ∞</span>
        <span className={`badge ${autopilotVisible ? 'bg-danger' : 'bg-secondary'}`}>
          {autopilotVisible ? 'ON' : 'OFF'}
        </span>
      </button>
      <button
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small bg-transparent"
        onClick={onToggleLandingStrips}
        style={{ 
          opacity: showLandingStrips ? 1 : 0.55,
        }}
      >
        <span>Pistes 🛬</span>
        <span className={`badge ${showLandingStrips ? 'bg-danger' : 'bg-secondary'}`}>
          {showLandingStrips ? 'ON' : 'OFF'}
        </span>
      </button>

      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">LUMIÈRES</div>
      {furnitureBtn('Lampe SDB', 'lampBath')}
      {furnitureBtn('Lampe Couloir', 'lampCorridor')}
      {furnitureBtn('Lampe Ola', 'lampOn')}

      <div className="text-muted fw-bold p-2 bg-light border-bottom small text-uppercase">DÉMO & ASSEMBLAGE 3D</div>
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
        <button
          onClick={onStartBuildAnimMatrix}
          className={`btn btn-sm w-100 text-start rounded-2 py-1 px-2 fw-bold d-flex justify-content-between align-items-center small ${buildAnimMatrix ? 'btn-success text-white' : 'btn-outline-secondary text-dark'}`}
          style={{ background: buildAnimMatrix ? undefined : 'rgba(255, 255, 255, 0.7)' }}
        >
          <span>▶ Matrix</span>
          <span className="small opacity-75">{animDurations['buildAnimMatrix'] ? `~${Math.round(animDurations['buildAnimMatrix'] / 1000)}s` : ''}</span>
        </button>
        {buildAnimMatrix && (
          <button
            onClick={onStopBuildAnim}
            className="btn btn-danger btn-sm w-100 fw-bold py-1 border-0 shadow-sm small"
            style={{ letterSpacing: '0.04em' }}
          >
            ■ Arrêter l'animation en cours
          </button>
        )}
      </div>
    </div>
  );
}
