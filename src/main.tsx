import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import { Studio } from '@features/scene/Studio';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import * as THREE from 'three';

// Désactive le Frustum Culling globalement pour éviter les bugs de visibilité (ex: oeil gauche manquant en VR)
THREE.Object3D.prototype.frustumCulled = false;

useGLTF.setDecoderPath('/draco/');

createRoot(document.getElementById('root')!).render(<Studio />);
