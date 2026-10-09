import { useSceneStore } from '../../store/useSceneStore';
import { WIGS_ITEMS } from '@features/inventory/inventoryData';
import type { LayerState } from '../types';

export interface CharacterSectionProps {
  layers: LayerState;
  onToggleLayer: (key: keyof LayerState) => void;
  isMobile: boolean;
  globalHairColor: string;
  setGlobalHairColor: (c: string) => void;
  globalHaircut: string;
  setGlobalHaircut: (h: string) => void;
  lastWigRef: React.MutableRefObject<string>;
  handleRandomHairColor: () => void;
  handleRandomHaircut: () => void;
}

export function CharacterSection({
  layers,
  onToggleLayer,
  isMobile: _isMobile,
  globalHairColor,
  setGlobalHairColor,
  globalHaircut,
  setGlobalHaircut,
  lastWigRef,
  handleRandomHairColor,
  handleRandomHaircut,
}: CharacterSectionProps) {
  const extraStates = useSceneStore(state => state.extraStates);

  const iconLabel = (icon: string, label: string) => (
    <span className="d-inline-flex align-items-center gap-1"><i className={`bi ${icon}`} aria-hidden="true" />{label}</span>
  );

  const layerBtn = (
    _color: string,
    label: React.ReactNode,
    key: keyof LayerState
  ) => {
    const on = layers[key];
    return (
      <button 
        className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between small"
        onClick={() => onToggleLayer(key)}
        style={{ 
          background: 'transparent',
          opacity: on ? 1 : 0.55,
        }}
      >
        <span>{label}</span>
        <span className={`badge ${on ? 'bg-danger' : 'bg-secondary'}`}>
          {on ? 'ON' : 'OFF'}
        </span>
      </button>
    );
  };

  return (
    <div className="d-flex flex-column bg-transparent">
      {layers.character && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
          <div className="d-flex flex-column gap-2">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted fw-semibold text-dark text-uppercase" style={{ fontSize: '10px' }}>
                  <i className="bi bi-palette me-1" aria-hidden="true" />Couleur des cheveux
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                  onClick={handleRandomHairColor}
                  title="Couleur aléatoire"
                  style={{ lineHeight: 1 }}
                >
                  <i className="bi bi-shuffle" aria-hidden="true" />
                </button>
              </div>
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary py-0 ps-1.5 pe-4"
                style={{ fontSize: '11px', height: '24px' }}
                onKeyDown={(e) => e.stopPropagation()}
                value={globalHairColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalHairColor(val);
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: val } }));
                }}
              >
                <option value="naturel" className="bg-light text-dark">Naturel</option>
                <option value="noir" className="bg-light text-dark">Noir</option>
                <option value="brun" className="bg-light text-dark">Brun</option>
                <option value="chatain" className="bg-light text-dark">Châtain</option>
                <option value="blond" className="bg-light text-dark">Blond</option>
                <option value="roux" className="bg-light text-dark">Roux</option>
                <option value="rouge" className="bg-light text-dark">Rouge</option>
                <option value="blanc" className="bg-light text-dark">Blanc</option>
                <option value="bleu" className="bg-light text-dark">Bleu</option>
                <option value="vert" className="bg-light text-dark">Vert</option>
                <option value="rose" className="bg-light text-dark">Rose</option>
                <option value="violet" className="bg-light text-dark">Violet</option>
                <option value="arc-en-ciel" className="bg-light text-dark">Arc-en-ciel</option>
              </select>
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted fw-semibold text-dark text-uppercase" style={{ fontSize: '10px' }}>
                  <i className="bi bi-scissors me-1" aria-hidden="true" />Coupe de cheveux
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                  onClick={handleRandomHaircut}
                  title="Coupe aléatoire"
                  style={{ lineHeight: 1 }}
                >
                  <i className="bi bi-shuffle" aria-hidden="true" />
                </button>
              </div>
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary py-0 ps-1.5 pe-4"
                style={{ fontSize: '11px', height: '24px' }}
                onKeyDown={(e) => e.stopPropagation()}
                value={globalHaircut}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalHaircut(val);
                  if (val !== 'original') lastWigRef.current = val;
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: val } }));
                }}
              >
                <option value="original" className="bg-light text-dark">Coupe d'origine</option>
                {WIGS_ITEMS.map((wig) => (
                  <option key={wig.id} value={wig.id} className="bg-light text-dark">{wig.name}</option>
                ))}
              </select>
            </div>
          </div>

            {/* ── Réglages Physique Perruques (directement sous la coupe) ── */}
            {layers.hairPhysics && (
              <div className="mt-2 pt-2 border-top border-secondary-subtle d-flex flex-column gap-2">
                <div className="text-muted fw-bold text-dark small text-uppercase" style={{ fontSize: '9px' }}>
                  <i className="bi bi-scissors me-1" aria-hidden="true" />Paramètres Physique Perruques
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-shield-check me-1" aria-hidden="true" />Rigidité & Maintien (Stiffness)
                    </span>
                    <span className="badge bg-primary text-white">
                      {(layers.wigStiffness ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={layers.wigStiffness ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigStiffness: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-shield-check me-1" aria-hidden="true" />Amortissement & Anti-vibration (Damping)
                    </span>
                    <span className="badge bg-success text-white">
                      {(layers.wigDamping ?? 0.80).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="0.50"
                    max="0.98"
                    step="0.02"
                    value={layers.wigDamping ?? 0.80}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigDamping: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-speedometer2 me-1" aria-hidden="true" />Poids aux pointes / Anti-fouet (Tip Weight)
                    </span>
                    <span className="badge bg-warning text-dark">
                      {(layers.wigTipWeight ?? 1.2).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={layers.wigTipWeight ?? 1.2}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigTipWeight: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-arrows-angle-expand me-1" aria-hidden="true" />Angle max déviation repos (Max Angle)
                    </span>
                    <span className="badge bg-danger text-white">
                      {layers.wigMaxAngle ?? 15}°
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="5"
                    max="45"
                    step="1"
                    value={layers.wigMaxAngle ?? 15}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigMaxAngle: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-globe2 me-1" aria-hidden="true" />Gravité globale (Gravity)
                    </span>
                    <span className="badge bg-danger text-white">
                      {(layers.wigGravity ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={layers.wigGravity ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigGravity: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-speedometer me-1" aria-hidden="true" />Inertie dynamique (Inertia)
                    </span>
                    <span className="badge bg-secondary text-white">
                      {(layers.wigInertia ?? 1.0).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={layers.wigInertia ?? 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigInertia: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-wind me-1" aria-hidden="true" />Vent / Brise ambiante (Wind)
                    </span>
                    <span className="badge bg-info text-dark">
                      {(layers.wigWind ?? 0.0).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={layers.wigWind ?? 0.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigWind: val }
                      }));
                    }}
                  />
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
                    <span className="text-muted fw-semibold text-dark small text-uppercase">
                      <i className="bi bi-shield me-1" aria-hidden="true" />Rayon Collision Tête (Head Collider)
                    </span>
                    <span className="badge bg-dark text-white">
                      {(layers.wigHeadCollisionRadius ?? 13.0).toFixed(1)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range form-range-sm"
                    min="8.0"
                    max="20.0"
                    step="0.5"
                    value={layers.wigHeadCollisionRadius ?? 13.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      useSceneStore.setState(st => ({
                        layers: { ...st.layers, wigHeadCollisionRadius: val }
                      }));
                    }}
                  />
                </div>
              </div>
            )}
        </div>
      )}

      {layers.character && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
          <div className="text-muted fw-semibold mb-1 text-dark small text-uppercase">
            <i className="bi bi-robot me-1" aria-hidden="true" />Visite guidée de l'appartement
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between shadow-none small"
            onClick={() => {
              useSceneStore.getState().triggerAction('aiFullTour');
            }}
            style={{ 
              background: 'transparent',
            }}
          >
            <span><i className="bi bi-person-walking me-1" aria-hidden="true" />Visite Complète (Sud ➔ Nord)</span>
            <span className={`badge ${extraStates?.aiFullTour ? 'bg-primary' : 'bg-secondary'}`}>
              {extraStates?.aiFullTour ? 'EN COURS' : 'DÉMARRER'}
            </span>
          </button>
        </div>
      )}

      <div className="text-muted fw-semibold mb-1 text-dark mt-3 small text-uppercase"><i className="bi bi-gear me-1" aria-hidden="true" />Options d'affichage</div>
      {layerBtn('pink',   iconLabel('bi-droplet-half', 'Peau & tissus réalistes (Mat)'), 'laraRealisticTextures')}
      {layerBtn('light',  iconLabel('bi-crosshair', 'Pistolets Lara'), 'laraPistols')}
      {layerBtn('light',  iconLabel('bi-handbag', 'Accessoires Lara'), 'accessories')}
      {layerBtn('pink',   iconLabel('bi-person-standing', 'Déshabiller Lara (Alt+X)'), 'laraNude')}
      {layerBtn('pink',   iconLabel('bi-person-standing-dress', 'Enlever le haut (Alt+Z)'), 'laraTopOff')}
      {layerBtn('pink',   iconLabel('bi-person-standing-dress', 'Enlever le bas (Alt+C)'), 'laraBottomOff')}
      {layerBtn('light',  iconLabel('bi-person-walking', 'Chaussures Lara'), 'laraShoes')}
      {layerBtn('pink',   iconLabel('bi-activity', 'Physique buste'), 'breastPhysics')}
      {layerBtn('pink',   iconLabel('bi-scissors', 'Physique cheveux'), 'hairPhysics')}
      {layerBtn('cyan', 'Wallhack (Silhouettes)', 'wallhack')}
      {layerBtn('cyan', iconLabel('bi-bone', 'Squelettes / Bones (K)'), 'skeleton')}
      {layerBtn('cyan', iconLabel('bi-grid-3x3', 'Fil de fer (Wireframe)'), 'characterWireframe')}


      {/* ── Réglages Physique Buste ── */}
      {layers.character && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
          <div className="text-muted fw-bold text-dark small text-uppercase" style={{ fontSize: '9px' }}>
            <i className="bi bi-activity me-1" aria-hidden="true" />Paramètres Physique Buste
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-lightning-charge me-1" aria-hidden="true" />Intensité Physique Buste
              </span>
              <span className="badge bg-danger">
                {(layers.breastIntensity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.0"
              max="10.0"
              step="0.2"
              value={layers.breastIntensity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastIntensity: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-speedometer2 me-1" aria-hidden="true" />Masse / Poids Buste (breastMass)
              </span>
              <span className="badge bg-danger text-white">
                {(layers.breastMass ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.1"
              max="4.0"
              step="0.1"
              value={layers.breastMass ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastMass: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-shield-check me-1" aria-hidden="true" />Fermeté / Maintien Buste (breastFirmness)
              </span>
              <span className="badge bg-purple text-white" style={{ backgroundColor: '#6f42c1' }}>
                {(layers.breastFirmness ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.1"
              max="3.0"
              step="0.1"
              value={layers.breastFirmness ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastFirmness: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-arrows-vertical me-1" aria-hidden="true" />Élasticité Verticale (braElasticity)
              </span>
              <span className="badge bg-primary">
                {(layers.braElasticity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.2"
              max="4.0"
              step="0.1"
              value={layers.braElasticity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, braElasticity: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-arrows me-1" aria-hidden="true" />Élasticité Horizontale XZ (braElasticityXZ)
              </span>
              <span className="badge bg-success text-dark">
                {(layers.braElasticityXZ ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.2"
              max="5.0"
              step="0.1"
              value={layers.braElasticityXZ ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, braElasticityXZ: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-stopwatch me-1" aria-hidden="true" />Retard / Déphasage Inertie (breastLagDelay)
              </span>
              <span className="badge bg-secondary text-white">
                {(layers.breastLagDelay ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.0"
              max="3.0"
              step="0.1"
              value={layers.breastLagDelay ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastLagDelay: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-arrows-vertical me-1" aria-hidden="true" />Angle Max Vertical (maxBreastAngle)
              </span>
              <span className="badge bg-info text-dark">
                {layers.maxBreastAngle ?? 25}°
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="5"
              max="60"
              step="1"
              value={layers.maxBreastAngle ?? 25}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, maxBreastAngle: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-arrows me-1" aria-hidden="true" />Angle Max Horizontal (maxBreastAngleXZ)
              </span>
              <span className="badge bg-warning text-dark">
                {layers.maxBreastAngleXZ ?? 35}°
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="5"
              max="120"
              step="1"
              value={layers.maxBreastAngleXZ ?? 35}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, maxBreastAngleXZ: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-arrows-vertical me-1" aria-hidden="true" />Rebond / Translation (breastTranslation)
              </span>
              <span className={`badge ${(layers.breastTranslation ?? 0.15) > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                {(layers.breastTranslation ?? 0.15) === 0 ? 'Désactivé' : `${(layers.breastTranslation ?? 0.15).toFixed(2)}x`}
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.0"
              max="4.0"
              step="0.05"
              value={layers.breastTranslation ?? 0.15}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastTranslation: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-rulers me-1" aria-hidden="true" />Course Max Rebond (breastMaxTravel)
              </span>
              <span className="badge bg-dark text-white">
                {(layers.breastMaxTravel ?? 0.5).toFixed(2)} cm
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.1"
              max="10.0"
              step="0.1"
              value={layers.breastMaxTravel ?? 0.5}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastMaxTravel: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-arrows-collapse-vertical me-1" aria-hidden="true" />Aplatissement / Squash & Stretch (breastSquash)
              </span>
              <span className={`badge ${(layers.breastSquash ?? 0.25) > 0 ? 'bg-info text-dark' : 'bg-secondary'}`}>
                {(layers.breastSquash ?? 0.25) === 0 ? 'Désactivé' : `${(layers.breastSquash ?? 0.25).toFixed(2)}x`}
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.0"
              max="4.0"
              step="0.05"
              value={layers.breastSquash ?? 0.25}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastSquash: val }
                }));
              }}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1 form-range-header">
              <span className="text-muted fw-semibold text-dark small text-uppercase">
                <i className="bi bi-globe2 me-1" aria-hidden="true" />Gravité Buste (breastGravity)
              </span>
              <span className={`badge ${(layers.breastGravity ?? 1.0) > 0 ? 'bg-danger text-white' : 'bg-secondary'}`}>
                {(layers.breastGravity ?? 1.0) === 0 ? 'Désactivé' : `${(layers.breastGravity ?? 1.0).toFixed(2)}x`}
              </span>
            </div>
            <input
              type="range"
              className="form-range form-range-sm"
              min="0.0"
              max="3.0"
              step="0.05"
              value={layers.breastGravity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, breastGravity: val }
                }));
              }}
            />
          </div>

          <div className="border-top pt-2 mt-2">
            <button
              type="button"
              className="btn btn-sm w-100 d-flex justify-content-between align-items-center px-2 py-1"
              style={{
                background: layers.fpvHeadBobbing ? 'rgba(255, 107, 157, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              onClick={() => {
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, fpvHeadBobbing: !st.layers.fpvHeadBobbing }
                }));
              }}
            >
              <span><i className="bi bi-camera-video me-1" aria-hidden="true" />Head Bobbing (Vue FPS)</span>
              <span className={`badge ${layers.fpvHeadBobbing ? 'bg-danger' : 'bg-secondary'}`}>
                {layers.fpvHeadBobbing ? 'ACTIF' : 'DÉSACTIVÉ'}
              </span>
            </button>

            <button
              type="button"
              className="btn btn-sm w-100 d-flex justify-content-between align-items-center px-2 py-1 mt-1.5"
              style={{
                background: layers.fpvRealisticEyes ? 'rgba(0, 204, 255, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              title="Positionne la caméra au centre exact des yeux de Lara / PNJ et suit précisément les rotations et inclinaisons de la tête"
              onClick={() => {
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, fpvRealisticEyes: !st.layers.fpvRealisticEyes }
                }));
              }}
            >
              <span><i className="bi bi-eye me-1" aria-hidden="true" />FPV Réaliste (Caméra Yeux)</span>
              <span className={`badge ${layers.fpvRealisticEyes ? 'bg-info text-dark' : 'bg-secondary'}`}>
                {layers.fpvRealisticEyes ? 'ACTIF' : 'DÉSACTIVÉ'}
              </span>
            </button>

            {layers.fpvRealisticEyes && (
              <div className="mt-2 p-1.5 rounded" style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <button
                  type="button"
                  className="btn btn-sm w-100 d-flex justify-content-between align-items-center px-1 py-1"
                  style={{
                    background: (layers.fpvStabilization ?? true) ? 'rgba(0, 204, 255, 0.12)' : 'transparent',
                    border: 'none',
                    }}
                  title="Amortit et stabilise les mouvements brusques ou violents de la tête"
                  onClick={() => {
                    useSceneStore.setState(st => ({
                      layers: { ...st.layers, fpvStabilization: !(st.layers.fpvStabilization ?? true) }
                    }));
                  }}
                >
                  <span><i className="bi bi-camera-reels me-1" aria-hidden="true" />Stabilisation Caméra</span>
                  <span className={`badge ${(layers.fpvStabilization ?? true) ? 'bg-info text-dark' : 'bg-secondary'}`}>
                    {(layers.fpvStabilization ?? true) ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                {(layers.fpvStabilization ?? true) && (
                  <div className="mt-1.5 px-1">
                    <div className="d-flex justify-content-between text-muted small form-range-header">
                      <span>Amorti des secousses</span>
                      <span className="fw-bold text-dark">{Math.round((layers.fpvStabilizationFactor ?? 0.7) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      className="form-range form-range-sm mt-0.5"
                      min="0.0"
                      max="0.95"
                      step="0.05"
                      value={layers.fpvStabilizationFactor ?? 0.7}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        useSceneStore.setState(st => ({
                          layers: { ...st.layers, fpvStabilizationFactor: val }
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
