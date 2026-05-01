/**
 * GlbReveal.tsx — cache les groupes animUnit pendant le chargement initial des GLBs,
 * puis les révèle tous en même temps quand useProgress().active passe à false.
 *
 * Les groupes animUnit sont les wrappers placés dans Placements/Building :
 *   <group userData={{ animUnit: true }}> … </group>
 * Ils sont dans la scène dès le premier rendu (avant que leurs enfants GLB chargent),
 * donc les masquer masque aussi les futurs enfants.
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';

export function GlbReveal() {
  const { scene } = useThree();
  const { active } = useProgress();
  const hiddenRef   = useRef(false);
  const revealedRef = useRef(false);

  // Dès que le chargement démarre : masquer tous les animUnit existants.
  // (Les wrappers animUnit sont déjà dans la scène avant que leurs GLB chargent.)
  useEffect(() => {
    if (active && !hiddenRef.current) {
      hiddenRef.current = true;
      scene.traverse(obj => {
        if (obj.userData?.animUnit) obj.visible = false;
      });
    }
  }, [active, scene]);

  // Quand le chargement se termine : révéler tous les animUnit d'un coup.
  // requestAnimationFrame garantit que React a commité les derniers GLBs chargés.
  useEffect(() => {
    if (!active && hiddenRef.current && !revealedRef.current) {
      revealedRef.current = true;
      requestAnimationFrame(() => {
        scene.traverse(obj => {
          if (obj.userData?.animUnit) obj.visible = true;
        });
      });
    }
  }, [active, scene]);

  return null;
}
