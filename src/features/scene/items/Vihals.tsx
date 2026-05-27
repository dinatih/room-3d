/**
 * Vihals.tsx — Chaise pliante IKEA VIHALS rouge (réf 70592744).
 * Dépliée : GLB media/glb/vihals.glb, 43×47×80cm.
 * Pliée   : procédural FoldedVihals, 44×88×9cm (debout, fine tranche verticale).
 * Action 'vihals-toggle' bascule entre les deux représentations (snap).
 */
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/vihals.glb';

// ── Open : GLB IKEA ───────────────────────────────────────────────────────────
function OpenVihals({ onSize }: { onSize: (v: THREE.Vector3) => void }) {
  const { scene } = useGLTFClone(GLB);
  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);
  return <primitive object={scene} />;
}

// ── Folded : procédural debout, 44×88×9cm ────────────────────────────────────
// Disposition : 4 montants verticaux (2 cadre arrière Z=-3, 2 cadre avant Z=+3),
// arc supérieur sur cadre arrière, traverses de pied, panneau dossier rouge
// vertical entre les cadres en haut, panneau assise rouge en bas.
const FRAME_W   = 44;
const FRAME_H   = 88;
const FRAME_D   = 9;
const TUBE_R    = 1.1;
const Z_REAR    = -3;
const Z_FRONT   = +3;
const BAR_HX    = FRAME_W / 2 - TUBE_R - 1;
const BAR_LEN   = FRAME_H - 4;
const BAR_Y     = BAR_LEN / 2 + 2;

function FoldedVihals({ onSize }: { onSize: (v: THREE.Vector3) => void }) {
  const matSteel = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xa92218, roughness: 0.5, metalness: 0.4,
  }), []);
  const matPlate = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xc62820, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide,
  }), []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(FRAME_W, FRAME_H, FRAME_D));
  }, [onSize]);

  return (
    <group>
      {/* 4 montants verticaux : 2 cadre arrière + 2 cadre avant */}
      {[-1, 1].map((s) => (
        <mesh key={`rear-${s}`} position={[s * BAR_HX, BAR_Y, Z_REAR]} material={matSteel} castShadow receiveShadow>
          <cylinderGeometry args={[TUBE_R, TUBE_R, BAR_LEN, 10]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`front-${s}`} position={[s * BAR_HX, BAR_Y, Z_FRONT]} material={matSteel} castShadow receiveShadow>
          <cylinderGeometry args={[TUBE_R, TUBE_R, BAR_LEN, 10]} />
        </mesh>
      ))}

      {/* Arc supérieur cadre arrière (haut du dossier arrondi) */}
      <mesh position={[0, FRAME_H - 4, Z_REAR]} rotation={[0, 0, 0]} material={matSteel} castShadow>
        <torusGeometry args={[BAR_HX, TUBE_R, 8, 28, Math.PI]} />
      </mesh>

      {/* Arc supérieur cadre avant (légèrement plus bas, pli typique) */}
      <mesh position={[0, FRAME_H - 4, Z_FRONT]} rotation={[0, 0, 0]} material={matSteel} castShadow>
        <torusGeometry args={[BAR_HX, TUBE_R, 8, 28, Math.PI]} />
      </mesh>

      {/* Traverses de pied : avant et arrière */}
      <mesh position={[0, 2, Z_REAR]} rotation={[0, 0, Math.PI / 2]} material={matSteel} castShadow>
        <cylinderGeometry args={[TUBE_R, TUBE_R, FRAME_W - 4, 10]} />
      </mesh>
      <mesh position={[0, 2, Z_FRONT]} rotation={[0, 0, Math.PI / 2]} material={matSteel} castShadow>
        <cylinderGeometry args={[TUBE_R, TUBE_R, FRAME_W - 4, 10]} />
      </mesh>

      {/* Panneau dossier (haut, contre cadre arrière) */}
      <mesh position={[0, FRAME_H * 0.65, Z_REAR + 1.4]} material={matPlate} castShadow receiveShadow>
        <boxGeometry args={[FRAME_W - 6, FRAME_H * 0.32, 1.2]} />
      </mesh>

      {/* Panneau assise (bas-milieu, contre cadre avant) */}
      <mesh position={[0, FRAME_H * 0.32, Z_FRONT - 1.4]} material={matPlate} castShadow receiveShadow>
        <boxGeometry args={[FRAME_W - 6, FRAME_H * 0.42, 1.2]} />
      </mesh>

      {/* Patins inférieurs (sabots noirs simulés par anneaux foncés) */}
      {[-1, 1].flatMap((s) => [Z_REAR, Z_FRONT].map((z) => (
        <mesh key={`peg-${s}-${z}`} position={[s * BAR_HX, 1, z]} material={matSteel}>
          <cylinderGeometry args={[TUBE_R * 1.3, TUBE_R * 1.3, 2, 10]} />
        </mesh>
      )))}
    </group>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export function Vihals({ onSize, actionState }: SceneItemProps) {
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    setFolded(!!actionState['vihals-toggle']);
  }, [actionState['vihals-toggle']]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key === 'vihals-toggle') setFolded((v) => !v);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  return (
    <group userData={{
      hoverAction: {
        label: folded ? 'VIHALS (Pliée)' : 'VIHALS (Dépliée)',
        actions: ['vihals-toggle'],
      },
    }}>
      {folded ? <FoldedVihals onSize={onSize} /> : <OpenVihals onSize={onSize} />}
    </group>
  );
}

useGLTF.preload(GLB);
