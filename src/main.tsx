import { createRoot } from 'react-dom/client';
import { useGLTF } from '@react-three/drei';
import { Studio } from './components/scene/Studio';
import './index.css';

useGLTF.setDecoderPath('/draco/');

createRoot(document.getElementById('root')!).render(<Studio />);
