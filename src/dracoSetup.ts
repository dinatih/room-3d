import { useGLTF } from '@react-three/drei';
import { configureTextBuilder } from 'troika-three-text';

// Configurer le décodeur Draco local avant tout import de scène qui appelle useGLTF.preload.
useGLTF.setDecoderPath('/draco/');

// Drei also preloads text before mounting its mesh. Configure the worker here,
// before those preloads, so the BNF label needs no external font requests.
configureTextBuilder({ unicodeFontsURL: new URL('/fonts/unicode', window.location.href).href });
