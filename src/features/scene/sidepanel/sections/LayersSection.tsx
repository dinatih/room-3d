import { useSceneStore, getRandomGrassType } from '../../store/useSceneStore';
import { HDRI_LIST, type HdriResolution } from '@features/scene/hdriConfig';
import { dispatchKey, type LayerState, type LidarMode, type GroundType } from '../types';

export interface LayersSectionProps {
  layers: LayerState;
  onToggleLayer: (key: keyof LayerState) => void;
  isMobile: boolean;
  lidarMode: LidarMode;
  onCycleLidar: () => void;
  lidarOpacity: number;
  onToggleLidarOpacity: () => void;
  sunInfo: { time: string; el: number } | null;
  handleRandomHdri: () => void;
}

const GROUND_OPTIONS: { id: GroundType; label: string }[] = [
  { id: 'bermuda',    label: 'Gazon Bermuda 🌱' },
  { id: 'medium_01',  label: 'Gazon Moyen 1 🌿' },
  { id: 'medium_02',  label: 'Gazon Moyen 2 🌾' },
  { id: 'celandine',  label: 'Prairie Fleurie 🌼' },
  { id: 'mud_leaves', label: 'Terre & Feuilles 🍂' },
  { id: 'none',       label: 'Vert uni 🟩' },
];

export function LayersSection({
  layers,
  onToggleLayer,
  isMobile: _isMobile,
  lidarMode,
  onCycleLidar,
  lidarOpacity,
  onToggleLidarOpacity,
  sunInfo,
  handleRandomHdri,
}: LayersSectionProps) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);
  const hdriResolution = useSceneStore(state => state.hdriResolution);
  const setHdriResolution = useSceneStore(state => state.setHdriResolution);
  const setGroundType = useSceneStore(state => state.setGroundType);
  const bnfAzimuth = useSceneStore(state => state.bnfAzimuth ?? 154.3);
  const bnfElevation = useSceneStore(state => state.bnfElevation ?? -2.2);
  const bnfRadius = useSceneStore(state => state.bnfRadius ?? 45);
  const setBnfCoords = useSceneStore(state => state.setBnfCoords);
  const currentGroundType = layers.groundType ?? (layers.bermudaGrass ? 'bermuda' : 'none');

  const b0 = (_color: string, label: string, onClick: () => void) => {
    return (
      <button 
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark bg-transparent small"
        onClick={onClick}
      >
        {label}
      </button>
    );
  };

  const layerBtn = (
    _color: string,
    label: string,
    key: keyof LayerState,
    wireframeKey?: keyof LayerState,
  ) => {
    const on = layers[key];
    const wfOn = wireframeKey ? !!layers[wireframeKey] : false;
    return (
      <div 
        className="w-100 border-0 border-bottom py-1 px-3 d-flex align-items-center justify-content-between gap-2"
        style={{ 
          background: 'transparent',
          opacity: on ? 1 : 0.55,
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-link p-0 text-start text-dark text-decoration-none flex-grow-1 text-truncate small"
          onClick={() => onToggleLayer(key)}
        >
          {label}
        </button>
        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className={`btn btn-sm py-0 px-2 rounded-pill small ${on ? 'btn-danger' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', lineHeight: '1.4' }}
            onClick={() => onToggleLayer(key)}
          >
            {on ? 'ON' : 'OFF'}
          </button>
          {wireframeKey && (
            <button
              type="button"
              className={`btn btn-sm py-0 px-1 rounded border-0 ${wfOn ? 'btn-info text-white shadow-sm' : 'btn-outline-secondary text-muted'}`}
              style={{ fontSize: '0.85rem', lineHeight: '1.4', background: wfOn ? undefined : 'transparent' }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLayer(wireframeKey);
              }}
              title={`Activer/désactiver wireframe filaire 🕸 sur ${label}`}
            >
              🕸
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent">
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
        <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
          <div className="text-muted fw-semibold text-dark text-nowrap small text-uppercase">
            🌆 Ambiance HDRI / Ciel
          </div>
          <div className="d-flex align-items-center gap-1 text-end overflow-hidden" style={{ minWidth: 0 }}>
            {(() => {
              const activeHdri = HDRI_LIST.find((h) => h.id === currentHdri);
              const displayName = activeHdri?.name || '';
              return displayName ? (
                <span
                  className="text-dark fw-medium text-truncate flex-grow-1 small"
                  title={displayName}
                >
                  {displayName}
                </span>
              ) : null;
            })()}
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
          {HDRI_LIST.map((h: any) => (
            <option key={h.id} value={h.id} className="bg-light text-dark">
              {h.name}
            </option>
          ))}
        </select>
        <div className="d-flex align-items-center gap-2 mt-1">
          <label htmlFor="hdri-resolution" className="text-muted small text-nowrap">
            Résolution HDRI
          </label>
          <select
            id="hdri-resolution"
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
        {(() => {
          const activeHdri = HDRI_LIST.find((h) => h.id === currentHdri);
          const fileName = activeHdri ? activeHdri.url.split('/').pop() : '';
          return fileName ? (
            <div
              className="text-muted mt-1 small font-monospace"
              style={{ userSelect: 'all', wordBreak: 'break-all', whiteSpace: 'normal', fontSize: '0.75rem' }}
              title={fileName}
            >
              {fileName}
            </div>
          ) : null;
        })()}
      </div>
      {layerBtn('purple',    'Effet fumée (Poof!) 💨',                 'smokeTransition')}
      {layerBtn('red',       'Points de vue caméra rouges 📹',       'cameraViewMarkers')}
      {layerBtn('green',     'Structure murale 🧱 (Alt+W)',            'wallStructure', 'wireframeWallStructure')}
      {layerBtn('orange',    'Revêtements sol (+ plinthes) 🪵', 'floorCoverings')}
      {layerBtn('secondary', 'Dalle et plafond 🏛️ (Alt+Q)',            'structure', 'wireframeStructure')}
      {layerBtn('peach',     'Portes 🚪',                      'doors', 'wireframeDoors')}
      {layerBtn('teal',      'Ciel & Atmosphère 🌤️',           'environment')}
      {currentHdri === 'default' && layerBtn('danger', 'Repère BNF (Domicile) 📍', 'bnfMarker')}
      {currentHdri === 'default' && (layers.bnfMarker ?? true) && (
        <div className="px-3 py-2 border-bottom bg-transparent d-flex flex-column gap-2 small">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Azimut ({bnfAzimuth.toFixed(1)}°)</span>
            <input
              type="range"
              className="form-range w-50"
              min="0"
              max="360"
              step="0.5"
              value={bnfAzimuth}
              onChange={(e) => setBnfCoords({ azimuth: parseFloat(e.target.value) })}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Élévation ({bnfElevation.toFixed(1)}°)</span>
            <input
              type="range"
              className="form-range w-50"
              min="-25"
              max="25"
              step="0.5"
              value={bnfElevation}
              onChange={(e) => setBnfCoords({ elevation: parseFloat(e.target.value) })}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Rayon ({bnfRadius} px)</span>
            <input
              type="range"
              className="form-range w-50"
              min="20"
              max="200"
              step="5"
              value={bnfRadius}
              onChange={(e) => setBnfCoords({ radius: parseFloat(e.target.value) })}
            />
          </div>
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 text-decoration-none small"
              onClick={() => setBnfCoords({ azimuth: 154.3, elevation: -2.2, radius: 45 })}
            >
              ↺ Réinitialiser
            </button>
          </div>
        </div>
      )}
      {layerBtn('green',     'Herbe & Terrain ext. 🌱',        'bermudaGrass')}
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
      {layerBtn('gray',      'Piliers seuls (Alt+Shift+P)',     'pillarsOnly')}
      {layerBtn('peach',     'Équipements (Alt+U)',             'equipment')}
      {layerBtn('purple',    'Mobilier (Furniture) (Alt+F)',    'furniture')}
      {layerBtn('purple',    'Habillage (Furnishings) (Alt+H)', 'furnishings')}
      {layerBtn('purple',    'Décoration (Decor) (Alt+D)',      'decor')}
      {layerBtn('light',     'Personnages 3D 👤',              'character', 'characterWireframe')}
      {layerBtn('blue',      'Animaux 🐕🐦',                   'animals')}
      {layerBtn('purple',    'Miroirs',                        'mirrors')}
      {layers.mirrors && layerBtn('purple', 'Miroirs HD (Alt+G)',       'mirrorsHD')}
      {layerBtn('cyan',      'Zones IA 🤖 (A)',                'aiZones')}
      {layerBtn('blue',   'Collisions inter-PNJ 👥', 'npcCollisions')}
      {layers.npcCollisions && layerBtn('cyan', '↳ Debug PNJ (Rayon 70cm) ⭕', 'debugNpcCollisions')}
      {layerBtn('blue',   'Collisions objets/meubles 🪑', 'furnitureCollisions')}
      {layers.furnitureCollisions && layerBtn('cyan', '↳ Debug Objets/Meubles 📐', 'debugFurnitureCollisions')}
      {layerBtn('gray',   'Ombres',        'shadows')}
      {layerBtn('gray',   'Ombres personnage 👤', 'characterShadows')}
      {layerBtn('blue',   'Voisins',       'neighbors')}

      {layerBtn('orange', "Grille des objets d’inventaire 📦 (Alt+I)", 'inventoryGrid')}
      {layerBtn('teal',   'Grille 🌐 (Alt+B)',     'grid')}
      {layers.grid && layerBtn('teal', 'Grille Depth', 'gridDepth')}
      {layerBtn('yellow', 'Mesures réelles 📐 (Alt+M)', 'measuredDimensions')}
      {layerBtn('red',    'Aff. arêtes murs (Alt+A)', 'wallEdges')}
      {layerBtn('cyan',   'Wireframe coloré 🕸 (W)', 'wireframe')}
      {layerBtn('yellow', 'Lumières ☀',    'lights')}
      {layerBtn('yellow', 'Lumières HD ✨', 'lightsHD')}
      {layerBtn('cyan',   'LiDAR scan 📡', 'lidar')}
      {layers.lidar && b0('cyan', ['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →', onCycleLidar)}
      {layers.lidar && b0('cyan', `Opacité ${Math.round(lidarOpacity * 100)}%`, onToggleLidarOpacity)}
      {layerBtn('yellow', 'Soleil réel ☀', 'realSun')}

      {sunInfo && (
        <div className="p-2 border-bottom text-muted small bg-transparent">
          ☀️ {sunInfo.time} · {sunInfo.el > 0 ? `élév. ${sunInfo.el}°` : `sous l'horizon ${-sunInfo.el}°`}
        </div>
      )}
      <button 
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small"
        onClick={() => { if (!layers.plan) dispatchKey('t'); onToggleLayer('plan'); }}
        style={{ background: 'transparent', opacity: layers.plan ? 1 : 0.55 }}
      >
        <span>Plan 2D</span>
        <span className={`badge ${layers.plan ? 'bg-danger' : 'bg-secondary'}`}>
          {layers.plan ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
