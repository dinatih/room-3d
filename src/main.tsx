import './devLog';
import { createRoot } from 'react-dom/client';
import './features/ui/resourceDownloadLogs';
import './dracoSetup';
import { Studio } from '@features/scene/Studio';
import { HomeAssistantSync } from './features/home-assistant/HomeAssistant';
import { completeHomeAssistantPopupCallback } from './features/home-assistant/connection';
import '../scss/app.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

// Filtrer l'alerte de dépréciation THREE.Clock émise en interne par @react-three/fiber
// en attendant que R3F migre vers THREE.Timer en amont.
const _origWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
    return;
  }
  _origWarn(...args);
};

console.info(`[Room-3D] v${__APP_VERSION__} (${__COMMIT_HASH__}) - ${__BUILD_TIME__}`);
(window as any).__ROOM_3D_BUILD__ = { version: __APP_VERSION__, commit: __COMMIT_HASH__, buildTime: __BUILD_TIME__ };

const rootEl = document.getElementById('root')!;
if (completeHomeAssistantPopupCallback()) {
  rootEl.textContent = 'Connexion Home Assistant terminée. Tu peux fermer cette fenêtre.';
} else {
  createRoot(rootEl).render(<><HomeAssistantSync /><Studio /></>);
}
