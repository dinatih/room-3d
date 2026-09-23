import { useSceneStore, getRandomGrassType } from '../../store/useSceneStore';
import { HDRI_LIST } from '@features/scene/hdriConfig';
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
  isMobile,
  lidarMode,
  onCycleLidar,
  lidarOpacity,
  onToggleLidarOpacity,
  sunInfo,
  handleRandomHdri,
}: LayersSectionProps) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);
  const setGroundType = useSceneStore(state => state.setGroundType);
  const currentGroundType = layers.groundType ?? (layers.bermudaGrass ? 'bermuda' : 'none');

  const b0 = (_color: string, label: string, onClick: () => void) => {
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark bg-transparent"
        onClick={onClick}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
        }}
      >
        {label}
      </button>
    );
  };

  const layerBtn = (
    _color: string,
    label: string,
    key: keyof LayerState
  ) => {
    const on = layers[key];
    return (
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => onToggleLayer(key)}
        style={{ 
          fontSize: isMobile ? '14px' : '11px',
          minHeight: isMobile ? '48px' : undefined,
          background: 'transparent',
          opacity: on ? 1 : 0.55,
        }}
      >
        <span>{label}</span>
        <span className={`badge ${on ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {on ? 'ON' : 'OFF'}
        </span>
      </button>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '45vh' }}>
      <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
        <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
          <div className="text-muted fw-semibold text-dark text-nowrap" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🌆 Ambiance HDRI / Ciel
          </div>
          <div className="d-flex align-items-center gap-1 text-end overflow-hidden" style={{ minWidth: 0 }}>
            {(() => {
              const activeHdri = HDRI_LIST.find((h) => h.id === currentHdri);
              const displayName = activeHdri?.name || '';
              return displayName ? (
                <span
                  className="text-dark fw-medium text-truncate flex-grow-1"
                  style={{ fontSize: '9px' }}
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
              title="HDRI aléatoire 🎲 (Touche 5)"
              style={{ fontSize: '11px', lineHeight: 1 }}
            >
              🎲
            </button>
          </div>
        </div>
        <select
          className="form-select form-select-sm bg-transparent text-dark border-secondary"
          style={{ fontSize: isMobile ? '14px' : '11px' }}
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
        {(() => {
          const activeHdri = HDRI_LIST.find((h) => h.id === currentHdri);
          const fileName = activeHdri ? activeHdri.url.split('/').pop() : '';
          return fileName ? (
            <div
              className="text-muted mt-1"
              style={{ fontSize: '10px', userSelect: 'all', wordBreak: 'break-all', whiteSpace: 'normal' }}
              title={fileName}
            >
              {fileName}
            </div>
          ) : null;
        })()}
      </div>
      {layerBtn('green',     'Structure murale 🧱',            'wallStructure')}
      {layerBtn('orange',    'Revêtements sol (+ plinthes) 🪵', 'floorCoverings')}
      {layerBtn('secondary', 'Dalle et plafond 🏛️',            'structure')}
      {layerBtn('peach',     'Portes 🚪',                      'doors')}
      {layerBtn('teal',      'Ciel & Atmosphère 🌤️',           'environment')}
      {layerBtn('green',     'Herbe & Terrain ext. 🌱',        'bermudaGrass')}
      {layers.bermudaGrass && (
        <div className="px-3 py-1 border-bottom bg-transparent d-flex align-items-center justify-content-between gap-2">
          <span className="text-muted" style={{ fontSize: '10px' }}>Type :</span>
          <div className="d-flex align-items-center gap-1">
            <select
              className="form-select form-select-sm bg-transparent text-dark border-secondary"
              style={{ fontSize: isMobile ? '13px' : '11px', maxWidth: '175px' }}
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
              title="Herbe aléatoire 🎲"
              style={{ fontSize: '11px', lineHeight: 1 }}
            >
              🎲
            </button>
          </div>
        </div>
      )}
      {layerBtn('gray',      'Piliers seuls',                  'pillarsOnly')}
      {layerBtn('peach',     'Équipements',                    'equipment')}
      {layerBtn('purple',    'Mobilier (Furniture)',           'furniture')}
      {layerBtn('purple',    'Habillage (Furnishings)',        'furnishings')}
      {layerBtn('purple',    'Décoration (Decor)',             'decor')}
      {layerBtn('blue',      'Animaux 🐕🐦',                   'animals')}
      {layerBtn('purple',    'Miroirs',                        'mirrors')}
      {layers.mirrors && layerBtn('purple', 'Miroirs HD',       'mirrorsHD')}
      {layerBtn('cyan',      'Zones IA 🤖 (A)',                'aiZones')}
      {layerBtn('blue',   'Collisions inter-PNJ 👥', 'npcCollisions')}
      {layers.npcCollisions && layerBtn('cyan', '↳ Debug PNJ (Rayon 70cm) ⭕', 'debugNpcCollisions')}
      {layerBtn('blue',   'Collisions objets/meubles 🪑', 'furnitureCollisions')}
      {layers.furnitureCollisions && layerBtn('cyan', '↳ Debug Objets/Meubles 📐', 'debugFurnitureCollisions')}
      {layerBtn('gray',   'Ombres',        'shadows')}
      {layerBtn('blue',   'Voisins',       'neighbors')}

      {layerBtn('orange', 'Grille inventaire 📦 (U)', 'inventoryGrid')}
      {layerBtn('teal',   'Grille 🌐',     'grid')}
      {layers.grid && layerBtn('teal', 'Grille Depth', 'gridDepth')}
      {layerBtn('yellow', 'Mesures réelles 📐 (N)', 'measuredDimensions')}
      {layerBtn('red',    'Aff. arêtes murs (W)', 'wallEdges')}
      {layerBtn('cyan',   'X-Ray 🩻',      'xray')}
      {layerBtn('cyan',   'Wireframe coloré 🕸', 'wireframe')}
      {layerBtn('yellow', 'Lumières ☀',    'lights')}
      {layerBtn('yellow', 'Lumières HD ✨', 'lightsHD')}
      {layerBtn('teal',   'Mur jardin : Scan 3D 🎨', 'gardenWallScan')}
      {layerBtn('cyan',   'LiDAR scan 📡', 'lidar')}
      {layers.lidar && b0('cyan', ['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →', onCycleLidar)}
      {layers.lidar && b0('cyan', `Opacité ${Math.round(lidarOpacity * 100)}%`, onToggleLidarOpacity)}
      {layerBtn('yellow', 'Soleil réel ☀', 'realSun')}

      {sunInfo && (
        <div className="p-2 border-bottom text-muted" style={{ fontSize: '9px', background: 'transparent' }}>
          ☀️ {sunInfo.time} · {sunInfo.el > 0 ? `élév. ${sunInfo.el}°` : `sous l'horizon ${-sunInfo.el}°`}
        </div>
      )}
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => { if (!layers.plan) dispatchKey('t'); onToggleLayer('plan'); }}
        style={{ fontSize: isMobile ? '14px' : '11px', background: 'transparent', opacity: layers.plan ? 1 : 0.55 }}
      >
        <span>Plan 2D</span>
        <span className={`badge ${layers.plan ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.plan ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
