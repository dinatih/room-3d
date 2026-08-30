import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { useSceneStore } from './store/useSceneStore';
import {
  MEASURED_DIST_DOOR_LIVING_W_TO_BATH_NE,
  MEASURED_DIST_BATH_N_TO_SHOWER_NE,
  MEASURED_DIST_BATH_W_TO_DOOR_BATH_N,
  MEASURED_DIST_KITCHEN_SW_TO_SE,
  MEASURED_DIST_CORNER_NE_TO_SE,
  MEASURED_DIST_SHOWER_NW_TO_NE,
  MEASURED_DIST_DOOR_BATH_E_TO_CORR_E,
  MEASURED_DIST_NICHE_BEAM_TO_EAST_WALL,
  MEASURED_HEIGHT_FLOOR_TO_CEILING,
  ROOM_W,
  WALL_H,
  NICHE_X,
  NICHE_Z_START,
  KITCHEN_Z,
} from '@config';
import { pX, pZ, pEast, CORR_WALL_X } from './wallData';

interface MeasurementItem {
  id: string;
  name: string;
  valueCm: number;
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  description: string;
  axis: 'x' | 'y' | 'z';
}

function DimensionLine({ item }: { item: MeasurementItem }) {
  const { start, end, valueCm, name, color = '#ffc107' } = item;

  // Calcul du point milieu pour le badge
  const mid: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  // Calcul des ticks d'extrémité (perpendiculaires)
  const tickGeo = useMemo(() => {
    const tickLen = 6;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    let perpX = 0;
    let perpY = 0;
    let perpZ = 0;

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > Math.abs(dz)) {
      // Axe vertical Y -> ticks selon X
      perpX = tickLen;
    } else if (Math.abs(dx) > Math.abs(dz)) {
      // Axe horizontal X -> ticks selon Z
      perpZ = tickLen;
    } else {
      // Axe profondeur Z -> ticks selon X
      perpX = tickLen;
    }

    const startTick: [[number, number, number], [number, number, number]] = [
      [start[0] - perpX, start[1] - perpY, start[2] - perpZ],
      [start[0] + perpX, start[1] + perpY, start[2] + perpZ],
    ];

    const endTick: [[number, number, number], [number, number, number]] = [
      [end[0] - perpX, end[1] - perpY, end[2] - perpZ],
      [end[0] + perpX, end[1] + perpY, end[2] + perpZ],
    ];

    return { startTick, endTick };
  }, [start, end]);

  return (
    <group renderOrder={99999}>
      {/* Ligne principale */}
      <Line
        points={[start, end]}
        color={color}
        lineWidth={3}
        depthTest={false}
      />

      {/* Ticks d'extrémités */}
      <Line
        points={tickGeo.startTick}
        color={color}
        lineWidth={2.5}
        depthTest={false}
      />
      <Line
        points={tickGeo.endTick}
        color={color}
        lineWidth={2.5}
        depthTest={false}
      />

      {/* Points d'ancrage aux extrémités */}
      <mesh position={start}>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>

      {/* Badge HTML flottant */}
      <Html position={mid} center distanceFactor={160} style={{ pointerEvents: 'auto' }}>
        <div
          title={`${name} : ${valueCm} cm\n${item.description}`}
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            border: `1.5px solid ${color}`,
            borderRadius: 6,
            padding: '2px 7px',
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 10px ${color}44`,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'help',
            userSelect: 'none',
          }}
        >
          <span style={{ color, fontSize: '10px' }}>📐</span>
          <span style={{ color: '#f8fafc' }}>{valueCm} cm</span>
          <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 400 }}>({name})</span>
        </div>
      </Html>
    </group>
  );
}

export function RealMeasurementsLayer() {
  const visible = useSceneStore(state => state.layers.measuredDimensions);
  const cameraMode = useSceneStore(state => state.cameraMode);

  const measurements: MeasurementItem[] = useMemo(() => {
    // Hauteur standard d'élévation au-dessus du sol pour les cotes horizontales
    const yBase = cameraMode === 'top' ? 275 : 18;

    return [
      // 1. Distance porte séjour Ouest -> Mur Est SDB
      {
        id: 'door-living-w-to-bath-ne',
        name: 'Porte Séjour ↔ SDB',
        valueCm: MEASURED_DIST_DOOR_LIVING_W_TO_BATH_NE,
        start: [pX('door-living-w'), yBase, pZ('door-living-w')],
        end: [pX('bath-ne'), yBase, pZ('door-living-w')],
        color: '#ffc107',
        description: 'Distance entre la jambe ouest de la porte séjour et le mur Est SDB',
        axis: 'x',
      },

      // 2. Distance Mur Nord SDB -> Douche NE
      {
        id: 'bath-n-to-shower-ne',
        name: 'Mur Nord SDB ↔ Douche NE',
        valueCm: MEASURED_DIST_BATH_N_TO_SHOWER_NE,
        start: [pX('shower-ne'), yBase, KITCHEN_Z + 3.6],
        end: [pX('shower-ne'), yBase, pZ('shower-ne')],
        color: '#00e5ff',
        description: 'Distance entre le mur nord de la SDB et la séparation douche NE',
        axis: 'z',
      },

      // 3. Distance Mur Ouest SDB -> Porte SDB Nord
      {
        id: 'bath-w-to-door-bath-n',
        name: 'Largeur SDB Intérieure',
        valueCm: MEASURED_DIST_BATH_W_TO_DOOR_BATH_N,
        start: [NICHE_X, yBase, pZ('door-bath-n')],
        end: [CORR_WALL_X, yBase, pZ('door-bath-n')],
        color: '#76ff03',
        description: 'Largeur intérieure SDB entre mur Ouest et la porte SDB Nord',
        axis: 'x',
      },

      // 4. Largeur ouverture cuisine
      {
        id: 'kitchen-sw-to-se',
        name: 'Ouverture Cuisine',
        valueCm: MEASURED_DIST_KITCHEN_SW_TO_SE,
        start: [pX('kitchen-sw'), yBase, pZ('kitchen-sw')],
        end: [pX('kitchen-se'), yBase, pZ('kitchen-se')],
        color: '#ff4081',
        description: 'Largeur d’ouverture du renfoncement cuisine (kitchen-sw ↔ kitchen-se)',
        axis: 'x',
      },

      // 5. Profondeur Séjour Mur Est
      {
        id: 'corner-ne-to-se',
        name: 'Profondeur Séjour Est',
        valueCm: MEASURED_DIST_CORNER_NE_TO_SE,
        start: [ROOM_W - 8, yBase, pZ('corner-ne') + 5],
        end: [ROOM_W - 8, yBase, pZ('corner-se') - 5],
        color: '#e040fb',
        description: 'Profondeur du séjour le long du mur Est (corner-ne ↔ corner-se)',
        axis: 'z',
      },

      // 6. Largeur de douche
      {
        id: 'shower-nw-to-ne',
        name: 'Largeur Douche',
        valueCm: MEASURED_DIST_SHOWER_NW_TO_NE,
        start: [NICHE_X, yBase, pZ('shower-ne')],
        end: [pX('shower-ne'), yBase, pZ('shower-ne')],
        color: '#00e676',
        description: 'Largeur de la douche entre mur Ouest et séparation NE',
        axis: 'x',
      },

      // 7. Passage couloir Est
      {
        id: 'door-bath-e-to-corr-e',
        name: 'Passage Couloir Est',
        valueCm: MEASURED_DIST_DOOR_BATH_E_TO_CORR_E,
        start: [CORR_WALL_X, yBase, 540],
        end: [ROOM_W, yBase, 540],
        color: '#ff9100',
        description: 'Largeur de passage du couloir entre porte SDB et mur Est',
        axis: 'x',
      },

      // 8. Largeur Séjour Poutre / Mur Est
      {
        id: 'niche-beam-to-east-wall',
        name: 'Largeur Séjour Poutre ↔ Est',
        valueCm: MEASURED_DIST_NICHE_BEAM_TO_EAST_WALL,
        start: [pEast('niche-beam'), yBase, NICHE_Z_START],
        end: [ROOM_W, yBase, NICHE_Z_START],
        color: '#ffd600',
        description: 'Largeur du séjour entre la poutre/niche et le mur Est',
        axis: 'x',
      },

      // 9. Hauteur sous plafond
      {
        id: 'floor-to-ceiling',
        name: 'Hauteur sous plafond',
        valueCm: MEASURED_HEIGHT_FLOOR_TO_CEILING,
        start: [ROOM_W - 25, 0, 30],
        end: [ROOM_W - 25, WALL_H, 30],
        color: '#b388ff',
        description: 'Hauteur réelle mesurée du parquet au plafond',
        axis: 'y',
      },
    ];
  }, [cameraMode]);

  if (!visible) return null;

  return (
    <group name="real-measurements-layer">
      {measurements.map(item => (
        <DimensionLine key={item.id} item={item} />
      ))}
    </group>
  );
}
