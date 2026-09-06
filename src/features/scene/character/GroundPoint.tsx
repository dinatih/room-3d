export function GroundPoint({ color = '#0058a3', scale = 1 }: { color?: string; scale?: number }) {
  return (
    <group position={[0, 0.05 * scale, 0]} scale={scale} name="GroundPoint">
      {/* Anneau extérieur */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {/* Disque central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Indicateur d'orientation dirigé vers l'avant (+Z) */}
      <mesh position={[0, 0, 6.2]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[1.5, 3.2, 3]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
