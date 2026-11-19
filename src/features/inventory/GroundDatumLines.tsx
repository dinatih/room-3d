import { Line } from '@react-three/drei';

export function GroundDatumLines({ mode, span = 150 }: { mode: string; span?: number }) {

  if (mode === 'top') {
    return (
      <group name="orthographic-ground-datum" position={[0, 0.05, 0]}>
        {/* Axe latéral X (Alignement T-Pose des bras : Vert) */}
        <Line points={[[-span, 0, 0], [span, 0, 0]]} color="#00ff66" lineWidth={2} />
        {/* Axe antéro-postérieur Z (Axe de regard / marche : Bleu) */}
        <Line points={[[0, 0, -span], [0, 0, span]]} color="#0088ff" lineWidth={2} />
        {/* Lignes de repère latérales ±10 cm */}
        <Line points={[[-span, 0, 10], [span, 0, 10]]} color="#ffbb00" lineWidth={1} dashed dashSize={2} gapSize={1} />
        <Line points={[[-span, 0, -10], [span, 0, -10]]} color="#ffbb00" lineWidth={1} dashed dashSize={2} gapSize={1} />
      </group>
    );
  }

  const isSide = mode === 'west' || mode === 'east';

  const linePoints = (y: number): [[number, number, number], [number, number, number]] => {
    if (isSide) {
      return [[0, y, -span], [0, y, span]];
    }
    return [[-span, y, 0], [span, y, 0]];
  };

  return (
    <group name="orthographic-ground-datum" position={[0, 0, 0]}>
      {/* Ligne de sol principale Y = 0 (Vert fluo haute visibilité) */}
      <Line points={linePoints(0)} color="#00ff66" lineWidth={2.5} />
      <Line points={linePoints(0.01)} color="#00ff66" lineWidth={1.5} />

      {/* Ligne de tolérance +2 cm (Jaune) */}
      <Line points={linePoints(2)} color="#ffbb00" lineWidth={1} dashed dashSize={2} gapSize={1} />

      {/* Ligne de tolérance -2 cm (Rouge) */}
      <Line points={linePoints(-2)} color="#ff4444" lineWidth={1} dashed dashSize={2} gapSize={1} />
    </group>
  );
}
