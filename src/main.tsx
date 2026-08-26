import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import { Studio } from '@features/scene/Studio';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

useGLTF.setDecoderPath('/draco/');

createRoot(document.getElementById('root')!).render(<Studio />);
