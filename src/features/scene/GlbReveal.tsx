/**
 * GlbReveal.tsx — cache les groupes sceneItemRoot pendant le chargement initial des GLBs,
 * puis les révèle tous en même temps quand useProgress().active passe à false.
 *
 * Les groupes sceneItemRoot sont les wrappers placés dans Placements/Building :
 *   <group userData={{ sceneItemRoot: true }}> … </group>
 * Ils sont dans la scène dès le premier rendu (avant que leurs enfants GLB chargent),
 * donc les masquer masque aussi les futurs enfants.
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';

export function GlbReveal() {
  const { scene } = useThree();
  const hiddenRef   = useRef(false);
  const revealedRef = useRef(false);

  // Souscription store Zustand (hors render) — évite warning setState-in-render
  // quand useProgress fluctue pendant qu'un composant (LaptopGlb, TV…) rend.
  useEffect(() => {
    const handle = (active: boolean) => {
      if (active && !hiddenRef.current) {
        hiddenRef.current = true;
        scene.traverse(obj => {
          if (obj.userData?.sceneItemRoot) obj.visible = false;
        });
      }
      if (!active && hiddenRef.current && !revealedRef.current) {
        revealedRef.current = true;
        requestAnimationFrame(() => {
          scene.traverse(obj => {
            if (obj.userData?.sceneItemRoot) obj.visible = true;
          });
        });
      }
    };
    handle(useProgress.getState().active);
    return useProgress.subscribe(s => handle(s.active));
  }, [scene]);

  return null;
}
