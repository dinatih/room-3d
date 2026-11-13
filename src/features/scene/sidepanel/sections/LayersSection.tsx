import { useSceneStore } from '../../store/useSceneStore';
import type { ScreenVideoQuality } from '../../screenVideoConfig';
import { dispatchKey, type LayerState, type LidarMode } from '../types';
import { NAVIGATION_COMFORT_CM, NAVIGATION_COMFORT_COLOR } from '../../ai/navigation/comfort';
import { DEBUG_PRESETS } from '../../store/debugPresets';
import { LAYER_DEFAULTS } from '../../store/layerUrlParams';

export interface LayersSectionProps {
  layers: LayerState;
  onToggleLayer: (key: keyof LayerState) => void;
  isMobile: boolean;
  lidarMode: LidarMode;
  onCycleLidar: () => void;
  lidarOpacity: number;
  onToggleLidarOpacity: () => void;
}

export function LayersSection({
  layers,
  onToggleLayer,
  isMobile: _isMobile,
  lidarMode,
  onCycleLidar,
  lidarOpacity,
  onToggleLidarOpacity,
}: LayersSectionProps) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const screenVideosEnabled = useSceneStore(state => state.screenVideosEnabled);
  const screenVideoQuality = useSceneStore(state => state.screenVideoQuality);
  const setScreenVideosEnabled = useSceneStore(state => state.setScreenVideosEnabled);
  const setScreenVideoQuality = useSceneStore(state => state.setScreenVideoQuality);

  function applyDebugPreset(name: string) {
    const preset = DEBUG_PRESETS[name];
    const url = new URL(window.location.href);
    url.searchParams.set('debug', name);
    window.history.replaceState(window.history.state, '', url);
    const keys = new Set(Object.values(DEBUG_PRESETS).flatMap(value => Object.keys(value.layers))) as Set<keyof LayerState>;
    for (const key of keys) {
      const enabled = preset.layers[key] ?? LAYER_DEFAULTS[key] ?? true;
      if (Boolean(layers[key]) !== enabled) onToggleLayer(key);
    }
    if (!['1', 'true'].includes(url.searchParams.get('perfGraph') ?? '')) {
      document.dispatchEvent(new CustomEvent('toggle-perf'));
    }
  }

  const iconLabel = (icon: string, label: string) => (
    <span className="d-inline-flex align-items-center gap-1"><i className={`bi ${icon}`} aria-hidden="true" />{label}</span>
  );

  const b0 = (label: string, onClick: () => void) => {
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
    label: React.ReactNode,
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
              title="Activer ou désactiver le wireframe"
            >
              <i className="bi bi-grid-3x3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent">
      <div className="d-flex flex-wrap gap-2 px-3 py-2 border-bottom" role="group" aria-label="Modes de diagnostic">
        {([['characters-only', 'Personnages seuls'], ['studio-only', 'Studio seul']] as const).map(([name, label]) => (
          <button key={name} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyDebugPreset(name)}>{label}</button>
        ))}
      </div>
      {layerBtn(iconLabel('bi-stars', 'Lumières HD'), 'lightsHD')}
      <div className="px-3 py-2 border-bottom d-flex flex-column gap-2">
        <div className="form-check form-switch small mb-0">
          <input
            id="screen-videos-enabled"
            type="checkbox"
            role="switch"
            className="form-check-input"
            checked={screenVideosEnabled}
            onChange={(e) => setScreenVideosEnabled(e.target.checked)}
          />
          <label htmlFor="screen-videos-enabled" className="form-check-label">
            Vidéos sur les écrans
          </label>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="screen-video-quality" className="text-muted small text-nowrap">Qualité vidéo</label>
          <select
            id="screen-video-quality"
            className="form-select form-select-sm bg-transparent text-dark border-secondary"
            value={screenVideoQuality}
            disabled={!screenVideosEnabled}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => setScreenVideoQuality(e.target.value as ScreenVideoQuality)}
          >
            <option value="ld">LD — 640 × 428 · 15 i/s</option>
            <option value="hd">HD — 1280 × 854 · 30 i/s</option>
          </select>
        </div>
      </div>
      {layerBtn(iconLabel('bi-bricks', 'Structure murale (Alt+W)'), 'wallStructure', 'wireframeWallStructure')}
      {layerBtn(iconLabel('bi-snow', 'Château de glace (murs et plafond)'), 'iceCastle')}
      {layerBtn(iconLabel('bi-layers', 'Revêtements sol (+ plinthes)'), 'floorCoverings')}
      {layerBtn(iconLabel('bi-building', 'Dalle et plafond (Alt+Q)'), 'structure', 'wireframeStructure')}
      {layerBtn(iconLabel('bi-door-open', 'Portes'), 'doors', 'wireframeDoors')}
      {layerBtn(iconLabel('bi-transparency', 'Portes et murs à 30 % d’opacité'), 'transparentWallsDoors')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-geo-alt', 'Repère BNF (Domicile)'), 'bnfMarker')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-stars', 'Scintillement Tour Eiffel ✨'), 'eiffelSparkle')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-building', 'Lumières Tour Montparnasse'), 'montparnasseLights')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-buildings', 'Lumières BnF'), 'bnfLights')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-bank', 'Lumières Arc de Triomphe'), 'arcLights')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-water', 'Lumières des ponts'), 'bridgeLights')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-lightbulb', 'Lampadaires des berges'), 'bankLights')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-tree', 'Lisières du bois de Boulogne'), 'boisLights')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-water', 'Péniches Seine (Nuit) 🚢'), 'seineBoats')}
      {currentHdri === 'default' && layerBtn(iconLabel('bi-bezier2', 'Tracé Seine (Debug) 🌊'), 'seineDebugPath')}
      {layerBtn('Piliers seuls (Alt+Shift+P)',     'pillarsOnly')}
      {layerBtn('Équipements (Alt+U)',             'equipment')}
      {layerBtn('Mobilier (Furniture) (Alt+F)',    'furniture')}
      {layerBtn('Habillage (Furnishings) (Alt+H)', 'furnishings')}
      {layerBtn('Décoration (Decor) (Alt+D)',      'decor')}
      {layerBtn(iconLabel('bi-webcam', 'Caméra de plafond (Fisheye)'), 'ceilingCamera')}
      {layerBtn(iconLabel('bi-people-fill', 'Personnages 3D'), 'character', 'characterWireframe')}
      {layerBtn(iconLabel('bi-arrows-move', 'Lissage origine (anti-téléportation)'), 'animOriginLerp')}
      {layerBtn(iconLabel('bi-bezier2', 'Fondu squelettique (Crossfade)'), 'animCrossfade')}
      {layerBtn(iconLabel('bi-heart-pulse', 'Animaux'), 'animals')}
      {layerBtn(iconLabel('bi-robot', 'Robots'), 'robots')}
      {layerBtn('Surfaces des miroirs',           'mirrorSurfaces')}
      {layerBtn('Miroirs MD (Moyenne déf)',       'mirrors')}
      {layerBtn('Miroirs HD (Haute déf) (Alt+G)', 'mirrorsHD')}
      {layerBtn(iconLabel('bi-robot', 'Zones IA (Shift+A)'), 'aiZones')}
      {layerBtn(iconLabel('bi-people', 'Collisions inter-PNJ'), 'npcCollisions')}
      {layers.npcCollisions && layerBtn(iconLabel('bi-circle', 'Debug gabarits PNJ'), 'debugNpcCollisions')}
      {layerBtn(iconLabel('bi-rulers', 'Debug trajets et obstacles'), 'debugFurnitureCollisions')}
      {layerBtn(iconLabel('bi-arrow-bar-up', 'Marche fenêtre agents (Y)'), 'windowStepElevation')}
      {layers.debugFurnitureCollisions && <div className="small px-3 py-1" title="Préférence de trajet, franchissable dans les passages étroits">
        <svg width="24" height="8" className="me-1" aria-hidden="true"><path d="M0 4H24" stroke={NAVIGATION_COMFORT_COLOR} strokeWidth="2" /></svg>
        Confort Native : +{NAVIGATION_COMFORT_CM} cm (préférence)
      </div>}
      {layerBtn('Ombres',        'shadows')}
      {layerBtn(iconLabel('bi-person-fill', 'Ombres personnage'), 'characterShadows')}
      {layerBtn('Voisins',       'neighbors')}

      {layerBtn(iconLabel('bi-rulers', 'Mesures réelles (Alt+M)'), 'measuredDimensions')}
      {layerBtn('Aff. arêtes murs (Alt+A)', 'wallEdges')}
      {layerBtn(iconLabel('bi-grid-3x3', 'Wireframe coloré (W)'), 'wireframe')}
      {layerBtn(iconLabel('bi-lightbulb', 'Lumières'), 'lights')}
      {layerBtn(iconLabel('bi-broadcast', 'LiDAR scan'), 'lidar')}
      {layers.lidar && b0(['Photo', 'Filaire', 'Points', 'Hauteur'][lidarMode] + ' →', onCycleLidar)}
      {layers.lidar && b0(`Opacité ${Math.round(lidarOpacity * 100)}%`, onToggleLidarOpacity)}
      <button 
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small"
        onClick={() => { if (!layers.plan) dispatchKey('t'); onToggleLayer('plan'); }}
        style={{ background: 'transparent', opacity: layers.plan ? 1 : 0.55 }}
      >
        <span>Plan</span>
        <span className={`badge ${layers.plan ? 'bg-danger' : 'bg-secondary'}`}>
          {layers.plan ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
