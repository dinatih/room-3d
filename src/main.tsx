import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import { Studio } from '@features/scene/Studio';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import * as THREE from 'three';

// Le frustum culling global est désactivé pour préserver la visibilité des
// éléments du personnage dans le mode VR.
THREE.Object3D.prototype.frustumCulled = false;

useGLTF.setDecoderPath('/draco/');

createRoot(document.getElementById('root')!).render(<Studio />);
