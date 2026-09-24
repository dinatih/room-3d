import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import { Studio } from '@features/scene/Studio';
import 'bootstrap/dist/css/bootstrap.min.css';
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

useGLTF.setDecoderPath('/draco/');

createRoot(document.getElementById('root')!).render(<Studio />);
