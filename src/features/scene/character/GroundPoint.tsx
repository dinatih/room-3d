import { useMemo } from 'react';
import * as THREE from 'three';

export function GroundPoint({ color = '#0058a3', scale = 1 }: { color?: string; scale?: number }) {
  const arrowShape = useMemo(() => {
    const s = new THREE.Shape();
    // Dessiné dans le plan XY local de la Shape :
    // Y+ correspond à +Z dans la scène après rotation X = -PI/2
    // X=0 est l'axe de symétrie pour un centrage parfait
    s.moveTo(0, 8.5);       // Pointe avant
    s.lineTo(2.4, 4.6);     // Aile droite
    s.lineTo(1.1, 5.0);     // Encoche droite
    s.lineTo(1.1, 2.5);     // Pied droit
    s.lineTo(-1.1, 2.5);    // Pied gauche
    s.lineTo(-1.1, 5.0);    // Encoche gauche
    s.lineTo(-2.4, 4.6);    // Aile gauche
    s.closePath();
    return s;
  }, []);

  return (
    <group position={[0, 0.05 * scale, 0]} scale={scale} name="GroundPoint">
      {/* Anneau extérieur - visible sur les 2 faces */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Disque central - visible sur les 2 faces */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Flèche d'orientation 2D dirigée vers l'avant (+Z) - visible sur les 2 faces */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[arrowShape]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

