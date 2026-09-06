export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const kbd = (label: string, i = 0) => (
    <kbd key={i} className="bg-secondary text-white mx-1" style={{ fontSize: '10px' }}>{label}</kbd>
  );

  const R = ({ label, keys }: { label: string; keys: string[] }) => (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
      <span className="text-secondary small">{label}</span>
      <span className="d-flex gap-1 flex-wrap justify-content-end">{keys.map(kbd)}</span>
    </div>
  );

  const Section = ({ title }: { title: string }) => (
    <div className="text-muted fw-bold text-uppercase mt-3 mb-1" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>{title}</div>
  );

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '360px' }}>
        <div className="modal-content text-dark glass-card">
          <div className="modal-header border-bottom-0">
            <h5 className="modal-title fs-6 fw-bold">⌨️ Raccourcis clavier</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body py-1">
            <div>
              <Section title="Global" />
              <R label="Inventaire (toggle)"        keys={['I']} />
              <R label="Inventaire Personnages (direct)" keys={['P']} />
              <R label="Zones IA (toggle)"          keys={['A']} />
              <R label="Vue perspective (reset)"    keys={['O']} />
              <R label="Walk mode (cycle 3P / FPV)" keys={['M']} />
              <R label="Vue 3ème personne directe"  keys={['3']} />
              <R label="Ambiance HDRI aléatoire 🎲" keys={['5']} />
              <R label="Bulle de pensées 💭 (toggle)" keys={['6']} />
              <R label="Pistolets Lara 🔫 (toggle)" keys={['7']} />
              <R label="Accessoires Lara 🎒 (toggle)" keys={['8']} />
              <R label="Minimap 2D (toggle)"        keys={['9']} />
              <R label="Masquer toute l'UI (Vue clean)" keys={['0']} />
              <R label="Console de logs (toggle)"   keys={['B']} />
              <R label="Vue top-down (toggle)"      keys={['T']} />
              <R label="Vue top-down suivi perso (toggle)" keys={['Y']} />
              <R label="Avion en papier (toggle)"   keys={['F']} />
              <R label="Grille Lara (toggle)"       keys={['G']} />
              <R label="Enlever le haut (toggle)"   keys={['Z']} />
              <R label="Enlever le bas (toggle)"    keys={['C']} />
              <R label="Déshabiller les Lara (toggle)" keys={['X']} />
              <R label="Squelettes / Bones (toggle)" keys={['K']} />
              <R label="Arêtes des murs (toggle)"   keys={['W']} />
              <R label="Mesures réelles 📐 (toggle)" keys={['U']} />
              <R label="Quitter walk / top-down"    keys={['Échap']} />
              <R label="Changer de personnage"      keys={['L']} />
            </div>

            <div>
              <Section title="Avion (mode vol)" />
              <R label="Décoller (pré-vol)"         keys={['Espace', 'C']} />
              <R label="Changer de vue"             keys={['C']} />
              <R label="Piquer / cabrer"            keys={['↑', '↓']} />
              <R label="Roulis (vire)"              keys={['←', '→']} />
              <R label="Accélérer"                  keys={['Espace']} />
              <R label="Freiner"                    keys={['Shift']} />
              <R label="Quitter"                    keys={['F', 'Échap']} />
            </div>

            <div>
              <Section title="Orbit — style Google Earth" />
              <R label="Déplacer le walker"         keys={['↑', '↓', '←', '→']} />
              <R label="Orbiter autour"             keys={['Shift + ↑↓←→']} />
              <R label="Rotation caméra"            keys={['Ctrl + ↑↓←→']} />
              <R label="Pan"                        keys={['Alt + ↑↓←→']} />
              <R label="Pan diagonal"               keys={['Shift+Ctrl + ↑↓←→']} />
            </div>

            <div>
              <Section title="Walk mode" />
              <R label="Avancer / reculer"          keys={['↑', '↓']} />
              <R label="Pivoter gauche / droite"    keys={['←', '→']} />
              <R label="Incliner la caméra"         keys={['Ctrl + ↑↓']} />
              <R label="Monter / descendre"         keys={['Alt + ↑↓']} />
              <R label="Regarder librement"         keys={['Clic + glisser']} />
            </div>
          </div>
          <div className="modal-footer border-top-0 p-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
