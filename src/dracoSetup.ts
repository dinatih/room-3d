import { useGLTF } from '@react-three/drei';

// Configurer le décodeur Draco local avant tout import de scène qui appelle useGLTF.preload.
useGLTF.setDecoderPath('/draco/');
