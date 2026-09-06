import { useSceneStore } from '../../store/useSceneStore';
import { CHARACTERS, isCharacterVisibleInMode, npcLabel } from '@features/scene/walkerConfig';
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
  handleRandomHaircutAndColor: () => void;
  handleRandomHairColor: () => void;
  handleRandomHaircut: () => void;
}

export function CharacterSection({
  layers,
  onToggleLayer,
  isMobile,
  globalHairColor,
  setGlobalHairColor,
  globalHaircut,
  setGlobalHaircut,
  lastWigRef,
  handleRandomHaircutAndColor,
  handleRandomHairColor,
  handleRandomHaircut,
}: CharacterSectionProps) {
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const extraStates = useSceneStore(state => state.extraStates);

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
    <div className="d-flex flex-column bg-transparent overflow-auto" style={{ maxHeight: '40vh' }}>
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
          <div>
            <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Choix Personnage</div>
            <select
              className="form-select form-select-sm bg-transparent text-dark border-secondary"
              style={{ fontSize: isMobile ? '14px' : '11px' }}
              value={activeWalkerId}
              onChange={(e) => {
                useSceneStore.getState().setActiveWalkerId(e.target.value);
              }}
            >
              {CHARACTERS.filter(c => isCharacterVisibleInMode(c.id, layers.laraCount ?? (isMobile ? 2 : 15), activeWalkerId) || c.id === activeWalkerId).map(c => (
                <option key={c.id} value={c.id} className="bg-light text-dark">
                  {npcLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            {/* Bouton global Coupe & Couleur Aléatoire */}
            <button
              type="button"
              className="btn btn-warning w-100 text-dark fw-bold mb-3 py-2 px-3 d-flex align-items-center justify-content-center gap-2 shadow-none"
              style={{
                fontSize: isMobile ? '13px' : '11px',
                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
              onClick={handleRandomHaircutAndColor}
              title="Changer aléatoirement la coupe et la couleur des cheveux 🎲"
            >
              <span>🎲</span>
              <span>Coupe & Couleur aléatoires</span>
            </button>

            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎨 Couleur des cheveux
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                  onClick={handleRandomHairColor}
                  title="Couleur aléatoire 🎲"
                  style={{ fontSize: '11px', lineHeight: 1 }}
                >
                  🎲
                </button>
              </div>
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary"
                style={{ fontSize: isMobile ? '14px' : '11px' }}
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
                <option value="arc-en-ciel" className="bg-light text-dark">Arc-en-ciel 🌈</option>
              </select>
            </div>

            <div className="mb-1">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💇‍♀️ Coupe de cheveux
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary p-0 px-1 border-0"
                  onClick={handleRandomHaircut}
                  title="Coupe aléatoire 🎲"
                  style={{ fontSize: '11px', lineHeight: 1 }}
                >
                  🎲
                </button>
              </div>
              <select
                className="form-select form-select-sm bg-transparent text-dark border-secondary"
                style={{ fontSize: isMobile ? '14px' : '11px' }}
                onKeyDown={(e) => e.stopPropagation()}
                value={globalHaircut}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalHaircut(val);
                  if (val !== 'original') lastWigRef.current = val;
                  document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: val } }));
                }}
              >
                <option value="original" className="bg-light text-dark">Coupe d'origine 👱‍♀️</option>
                {WIGS_ITEMS.map((wig) => (
                  <option key={wig.id} value={wig.id} className="bg-light text-dark">{wig.name}</option>
                ))}
              </select>
            </div>

            {/* ── Réglages Physique Perruques (directement sous la coupe) ── */}
            {layers.hairPhysics && (
              <div className="mt-2 pt-2 border-top border-secondary-subtle d-flex flex-column gap-2">
                <div className="text-muted fw-bold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💇‍♀️ Paramètres Physique Perruques
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🧶 Rigidité & Maintien (Stiffness)
                    </span>
                    <span className="badge bg-primary text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigStiffness ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🧯 Amortissement & Anti-vibration (Damping)
                    </span>
                    <span className="badge bg-success text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigDamping ?? 0.80).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚖️ Poids aux pointes / Anti-fouet (Tip Weight)
                    </span>
                    <span className="badge bg-warning text-dark" style={{ fontSize: '9px' }}>
                      {(layers.wigTipWeight ?? 1.2).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📐 Angle max déviation repos (Max Angle)
                    </span>
                    <span className="badge bg-danger text-white" style={{ fontSize: '9px' }}>
                      {layers.wigMaxAngle ?? 15}°
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🌍 Gravité globale (Gravity)
                    </span>
                    <span className="badge bg-danger text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigGravity ?? 1.0).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🏃 Inertie dynamique (Inertia)
                    </span>
                    <span className="badge bg-secondary text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigInertia ?? 1.0).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      💨 Vent / Brise ambiante (Wind)
                    </span>
                    <span className="badge bg-info text-dark" style={{ fontSize: '9px' }}>
                      {(layers.wigWind ?? 0.0).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🛡️ Rayon Collision Tête (Head Collider)
                    </span>
                    <span className="badge bg-dark text-white" style={{ fontSize: '9px' }}>
                      {(layers.wigHeadCollisionRadius ?? 13.0).toFixed(1)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
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
        </div>
      )}

      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
          <div className="text-muted fw-semibold mb-1 text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🤖 Visite guidée de l'appartement
          </div>
          <button
            type="button"
            className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between shadow-none"
            onClick={() => {
              useSceneStore.getState().triggerAction('aiFullTour');
            }}
            style={{ 
              fontSize: isMobile ? '14px' : '11px', 
              background: 'transparent',
              minHeight: isMobile ? '48px' : undefined 
            }}
          >
            <span>🚶‍♀️ Visite Complète (Sud ➔ Nord)</span>
            <span className={`badge ${extraStates?.aiFullTour ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
              {extraStates?.aiFullTour ? 'EN COURS' : 'DÉMARRER'}
            </span>
          </button>
        </div>
      )}

      <div className="text-muted fw-semibold mb-1 text-dark mt-3" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Options d'affichage</div>
      {layerBtn('light',  'Personnage 3D (Walker)', 'walker')}
      {layerBtn('gray',   'Ombres personnage 👤', 'characterShadows')}
      {layerBtn('light',  'Pistolets Lara 🔫', 'laraPistols')}
      {layerBtn('light',  'Accessoires Lara 🎒', 'accessories')}
      {layerBtn('pink',   'Déshabiller Lara 👙 (X)', 'laraNude')}
      {layerBtn('pink',   'Enlever le haut 👚', 'laraTopOff')}
      {layerBtn('pink',   'Enlever le bas 🩳', 'laraBottomOff')}
      {layerBtn('light',  'Bottes Lara 👢', 'laraShoes')}
      {layerBtn('pink',   'Physique buste 💃', 'breastPhysics')}
      {layerBtn('pink',   'Physique cheveux 💇‍♀️', 'hairPhysics')}
      {layerBtn('cyan', 'Wallhack (Silhouettes)', 'wallhack')}
      {layerBtn('cyan', 'Squelettes / Bones 🦴 (K)', 'skeleton')}
      {layerBtn('cyan', 'Fil de fer (Wireframe) 🕸️', 'characterWireframe')}
      {layerBtn('teal', 'Bulle de pensée 💭 (Logs)', 'thoughtBubble')}
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👥 Nombre de Personnages
            </span>
            <span className="badge bg-primary" style={{ fontSize: '9px' }}>
              {(layers.laraCount ?? (isMobile ? 2 : 15)) === 1
                ? '1 (Xbot seul)'
                : (layers.laraCount ?? (isMobile ? 2 : 15)) === 2
                ? '2 (Xbot + Lara)'
                : (layers.laraCount ?? (isMobile ? 2 : 15)) === 4
                ? '4 (Lara, Xbot, Rosanna, Cha)'
                : (layers.laraCount ?? (isMobile ? 2 : 15)) === 10
                ? '10 (Eco)'
                : '15 (Toutes)'}
            </span>
          </div>
          <div className="btn-group btn-group-sm w-100" role="group">
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 1 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 1 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(1)}
              title="1 PNJ (Xbot uniquement - léger)"
            >
              1
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 2 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 2 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(2)}
            >
              2
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 4 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 4 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(4)}
            >
              4
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 10 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 10 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(10)}
            >
              10
            </button>
            <button
              type="button"
              className={`btn btn-sm ${(layers.laraCount ?? (isMobile ? 2 : 15)) === 15 ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{ fontSize: isMobile ? '13px' : '11px', background: (layers.laraCount ?? (isMobile ? 2 : 15)) === 15 ? undefined : 'transparent' }}
              onClick={() => useSceneStore.getState().setLaraCount(15)}
            >
              15
            </button>
          </div>
        </div>
      )}
      <button 
        className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
        onClick={() => {
          onToggleLayer('laraGrid');
          if (!layers.laraGrid) {
            document.dispatchEvent(new CustomEvent('camera-view', { detail: { pos: [150, 450, 600], target: [150, 450, 200] } }));
          }
        }}
        style={{ 
          fontSize: isMobile ? '13px' : '11px', 
          backgroundColor: layers.laraGrid ? 'rgba(13, 110, 253, 0.08)' : undefined,
          fontWeight: layers.laraGrid ? 600 : 400
        }}
      >
        <span>
          <span className="me-2">🧬</span>
          Grille de comparaison (Lara)
        </span>
        <span className={`badge ${layers.laraGrid ? 'bg-primary' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
          {layers.laraGrid ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* ── Réglages Physique Buste ── */}
      {layers.walker && (
        <div className="p-2 border-bottom bg-transparent d-flex flex-column gap-2">
          <div className="text-muted fw-bold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💃 Paramètres Physique Buste
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💥 Intensité Physique Buste
              </span>
              <span className="badge bg-danger" style={{ fontSize: '9px' }}>
                {(layers.breastIntensity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚖️ Masse / Poids Buste (breastMass)
              </span>
              <span className="badge bg-danger text-white" style={{ fontSize: '9px' }}>
                {(layers.breastMass ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🧶 Fermeté / Maintien Buste (breastFirmness)
              </span>
              <span className="badge bg-purple text-white" style={{ fontSize: '9px', backgroundColor: '#6f42c1' }}>
                {(layers.breastFirmness ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                👙 Élasticité Verticale (braElasticity)
              </span>
              <span className="badge bg-primary" style={{ fontSize: '9px' }}>
                {(layers.braElasticity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ↔️ Élasticité Horizontale XZ (braElasticityXZ)
              </span>
              <span className="badge bg-success text-dark" style={{ fontSize: '9px' }}>
                {(layers.braElasticityXZ ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⏱️ Retard / Déphasage Inertie (breastLagDelay)
              </span>
              <span className="badge bg-secondary text-white" style={{ fontSize: '9px' }}>
                {(layers.breastLagDelay ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📐 Angle Max Vertical (maxBreastAngle)
              </span>
              <span className="badge bg-info text-dark" style={{ fontSize: '9px' }}>
                {layers.maxBreastAngle ?? 25}°
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted fw-semibold text-dark" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ↔️ Angle Max Horizontal (maxBreastAngleXZ)
              </span>
              <span className="badge bg-warning text-dark" style={{ fontSize: '9px' }}>
                {layers.maxBreastAngleXZ ?? 35}°
              </span>
            </div>
            <input
              type="range"
              className="form-range"
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

          <div className="border-top pt-2 mt-2">
            <button
              type="button"
              className="btn btn-sm w-100 d-flex justify-content-between align-items-center px-2 py-1"
              style={{
                background: layers.fpvHeadBobbing ? 'rgba(255, 107, 157, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                fontSize: '11px',
              }}
              onClick={() => {
                useSceneStore.setState(st => ({
                  layers: { ...st.layers, fpvHeadBobbing: !st.layers.fpvHeadBobbing }
                }));
              }}
            >
              <span>🎥 Head Bobbing (Vue FPS)</span>
              <span className={`badge ${layers.fpvHeadBobbing ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                {layers.fpvHeadBobbing ? 'ACTIF' : 'DÉSACTIVÉ'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
