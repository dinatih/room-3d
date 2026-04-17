/**
 * RedWallLayer.tsx — colorie les murs de la structure en rouge.
 * Port fidèle de js/ui/events.js (wall-color-toggle).
 *
 * Même logique géométrique que le vanilla :
 *   - BoxGeometry multi-mat  : face +Y (index 2) conservée blanche
 *   - BoxGeometry mono-mat   : converti en 6-array, index 2 blanc
 *   - ExtrudeGeometry        : [rouge, orig (dessus), rouge]
 *   - transparent            : version fantôme rouge
 *   - autre                  : rouge plein
 */
import { useEffect } from 'react';
import { useThree }  from '@react-three/fiber';
import * as THREE    from 'three';

const redWallMat  = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.85 });
const redGhostMat = new THREE.MeshStandardMaterial({
  color: 0xcc2200, roughness: 0.85,
  transparent: true, opacity: 0.18, depthWrite: false,
});

const savedMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

export function RedWallLayer() {
  const { scene } = useThree();

  useEffect(() => {
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      if ((mesh as any).isSkinnedMesh) return;        // walkers
      if ((mesh.layers.mask & 1) === 0) return;       // layer 0 = structure uniquement
      if (savedMaterials.has(mesh)) return;

      const orig = mesh.material;
      savedMaterials.set(mesh, orig);

      if (Array.isArray(orig)) {
        // Multi-mat : index 2 = face +Y → conserver la teinte d'origine
        mesh.material = (orig as THREE.Material[]).map((m, i) =>
          i === 2 ? m : ((m as THREE.MeshStandardMaterial).transparent ? redGhostMat : redWallMat)
        );
      } else if ((orig as THREE.MeshStandardMaterial).transparent) {
        mesh.material = redGhostMat;
      } else if (mesh.geometry.type === 'BoxGeometry') {
        // Mono-mat BoxGeometry → 6-array, face +Y (idx 2) reste blanche
        mesh.material = [redWallMat, redWallMat, orig as THREE.Material, redWallMat, redWallMat, redWallMat];
      } else if (mesh.geometry.type === 'ExtrudeGeometry') {
        // ExtrudeGeometry : groups 0=bas, 1=haut (+Y), 2=côtés
        mesh.material = [redWallMat, orig as THREE.Material, redWallMat];
      } else {
        mesh.material = redWallMat;
      }
    });

    return () => {
      savedMaterials.forEach((mat, mesh) => { mesh.material = mat; });
      savedMaterials.clear();
    };
  }, [scene]);

  return null;
}
