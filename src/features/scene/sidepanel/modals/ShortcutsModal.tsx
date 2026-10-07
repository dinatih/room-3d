import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', closeOnEscape, true);
    return () => window.removeEventListener('keydown', closeOnEscape, true);
  }, [onClose]);

  const kbd = (label: string, i = 0) => (
    <kbd key={i} className="bg-dark text-white px-2 py-1 rounded text-nowrap">{label}</kbd>
  );

  const R = ({ label, keys }: { label: string; keys: string[] }) => (
    <div className="d-flex justify-content-between align-items-center gap-3 py-2 border-bottom">
      <span className="text-body">{label}</span>
      <span className="d-flex gap-1 flex-wrap justify-content-end">{keys.map(kbd)}</span>
    </div>
  );

  const Section = ({ title }: { title: string }) => (
    <h6 className="text-primary fw-bold text-uppercase mt-3 mb-1">{title}</h6>
  );

  return createPortal(
    <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      onWheel={event => event.stopPropagation()}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content bg-body text-body shadow">
          <div className="modal-header border-bottom-0">
            <h5 id="shortcuts-title" className="modal-title fs-6 fw-bold">⌨️ Raccourcis clavier</h5>
            <button type="button" className="btn-close" aria-label="Fermer" autoFocus onClick={onClose}></button>
          </div>
          <div className="modal-body py-1">
            <div>
              <Section title="Global" />
              <R label="Photo Raytracing HD 📸"     keys={['F10']} />
              <R label="Inventaire (toggle)"        keys={['I']} />
              <R label="Basculer Ortho / Perspective" keys={['P']} />
              <R label="Inventaire Personnages (direct)" keys={['Alt+P']} />
              <R label="Personnages Extra 🎭 (toggle)" keys={['Alt+E']} />
              <R label="Zones IA (toggle)"          keys={['A']} />
              <R label="Basculer rotation Orbit / Pan" keys={['O']} />
              <R label="Vue Orbit perspective par défaut (Nord-Ouest)" keys={['Alt+O']} />
              <R label="Follow (cycle 3P / FPV)" keys={['M']} />
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
              <R label="Afficher / masquer la grille" keys={['Alt+B']} />
              <R label="Grille Lara (toggle)"       keys={['G']} />
              <R label="Wireframe coloré 🕸 (toggle)" keys={['W']} />
              <R label="Enlever le haut (toggle)"   keys={['Alt+Z']} />
              <R label="Enlever le bas (toggle)"    keys={['Alt+C']} />
              <R label="Déshabiller les Lara (toggle)" keys={['Alt+X']} />
              <R label="Squelettes / Bones (toggle)" keys={['K']} />
              <R label="Structure murale (toggle)"  keys={['Alt+W']} />
              <R label="Dalle et plafond (toggle)"  keys={['Alt+Q']} />
              <R label="Mobilier (toggle)"          keys={['Alt+F']} />
              <R label="Décoration (toggle)"        keys={['Alt+D']} />
              <R label="Habillage (toggle)"         keys={['Alt+H']} />
              <R label="Miroirs HD (toggle)"        keys={['Alt+G']} />
              <R label="Arêtes des murs (toggle)"   keys={['Alt+A']} />
              <R label="Piliers seuls (toggle)"     keys={['Alt+Shift+P']} />
              <R label="Grille inventaire 📦 (toggle)" keys={['Alt+I']} />
              <R label="Mesures réelles 📐 (toggle)" keys={['Alt+M']} />
              <R label="Quitter follow / top-down / ortho" keys={['Échap']} />
              <R label="Changer de personnage"      keys={['L']} />
            </div>

            <div>
              <Section title="Vues de la barre de contrôle" />
              <R label="Face / Dos / Gauche / Droite" keys={['Alt+1', 'Alt+2', 'Alt+3', 'Alt+4']} />
              <R label="Dessus / Dessous"         keys={['Alt+5', 'Alt+6']} />
              <R label="ISO Sud-Est / Sud-Ouest"  keys={['Alt+7', 'Alt+8']} />
              <R label="ISO Nord-Est / Nord-Ouest" keys={['Alt+9', 'Alt+0']} />
              <Section title="Grille PNJ / Lara (pavé numérique)" />
              <R label="Vue Ortho Face / Dos"      keys={['Num 1', 'Ctrl+Num 1']} />
              <R label="Vue Ortho Gauche / Droite" keys={['Ctrl+Num 3', 'Num 3']} />
              <R label="Vue Ortho Dessus / Dessous" keys={['Num 7', 'Ctrl+Num 7']} />
              <R label="Bascule Ortho / Persp 3D"  keys={['Num 5']} />
            </div>

            <div>
              <Section title="Avion (mode vol)" />
              <R label="Décoller (pré-vol)"         keys={['Espace', 'C']} />
              <R label="Changer de vue"             keys={['C']} />
              <R label="Changer d’avion"            keys={['V']} />
              <R label="Piquer / cabrer"            keys={['↑', '↓']} />
              <R label="Roulis / vrille (maintenir)"              keys={['←', '→']} />
              <R label="Accélérer"                  keys={['Espace', 'Ctrl']} />
              <R label="Freiner"                    keys={['Shift']} />
              <R label="Quitter"                    keys={['F', 'Échap']} />
            </div>

            <div>
              <Section title="Orbit — style Google Earth" />
              <R label="Déplacer le personnage"         keys={['↑', '↓', '←', '→']} />
              <R label="Orbiter autour"             keys={['Shift + ↑↓←→']} />
              <R label="Rotation caméra"            keys={['Ctrl + ↑↓←→']} />
              <R label="Pan"                        keys={['Alt + ↑↓←→']} />
              <R label="Pan diagonal"               keys={['Shift+Ctrl + ↑↓←→']} />
            </div>

            <div>
              <Section title="Follow mode" />
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
    </div>,
    document.body,
  );
}
