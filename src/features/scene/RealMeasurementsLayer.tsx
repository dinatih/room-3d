import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { useSceneStore } from './store/useSceneStore';
import {
  MEASURED_DIST_CORRIDOR_CLOSET_Z,
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
  NICHE_Z_START,
} from '@config';
import { pEast, pWest, pNorth, pSouth, pZ, CORR_WALL_X } from './wallData';

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

  // Calcul des ticks d'extrémité perpendiculaires aux faces internes
  const tickGeo = useMemo(() => {
    const tickLen = 5;
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
      {/* Ligne principale de cote */}
      <Line
        points={[start, end]}
        color={color}
        lineWidth={3}
        depthTest={false}
      />

      {/* Ticks d'arêtes perpendiculaires aux faces internes */}
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

      {/* Marqueurs d'ancrage sur les surfaces */}
      <mesh position={start}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>

      {/* Badge HTML flottant */}
      <Html position={mid} center distanceFactor={160} style={{ pointerEvents: 'auto' }}>
        <div
          title={`${name} : ${valueCm} cm\n${item.description}`}
          style={{
            background: 'rgba(15, 23, 42, 0.90)',
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
    // Hauteur d'élévation pour les cotes horizontales (surélevé en 2D pour vue dessus)
    const yBase = cameraMode === 'top' ? 275 : 18;

    return [
      // 1. Largeur / profondeur du placard couloir le long de l'axe Z (traverse le placard)
      {
        id: 'corr-closet-z',
        name: 'Placard Couloir',
        valueCm: MEASURED_DIST_CORRIDOR_CLOSET_Z,
        start: [CORR_WALL_X - 18, yBase, pSouth('door-living-w')],
        end: [CORR_WALL_X - 18, yBase, pNorth('bath-ne')],
        color: '#ffc107',
        description: 'Largeur/profondeur intérieure du placard couloir entre la face sud porte séjour (door-living-w) et la face nord mur SDB (bath-ne)',
        axis: 'z',
      },

      // 2. Distance Mur Nord SDB -> Douche NE (axe Z, face interne sud mur nord à face nord douche)
      {
        id: 'bath-n-to-shower-ne',
        name: 'Nord SDB ↔ Douche',
        valueCm: MEASURED_DIST_BATH_N_TO_SHOWER_NE,
        start: [pWest('shower-ne') - 2, yBase, pSouth('bath-nw')],
        end: [pWest('shower-ne') - 2, yBase, pNorth('shower-ne')],
        color: '#00e5ff',
        description: 'Distance intérieure Z entre la face sud du mur nord SDB et la face nord de la douche NE',
        axis: 'z',
      },

      // 3. Distance Mur Ouest SDB -> Porte SDB Nord (axe X, face interne ouest à face interne ouest porte SDB)
      {
        id: 'bath-w-to-door-bath-n',
        name: 'Largeur Intérieure SDB',
        valueCm: MEASURED_DIST_BATH_W_TO_DOOR_BATH_N,
        start: [pEast('bath-nw'), yBase, pZ('door-bath-n')],
        end: [pWest('door-bath-n'), yBase, pZ('door-bath-n')],
        color: '#76ff03',
        description: 'Largeur intérieure entre la face interne du mur ouest et la face interne du mur porte SDB',
        axis: 'x',
      },

      // 4. Largeur ouverture cuisine (axe X, face interne est kitchen-sw à face interne ouest kitchen-se)
      {
        id: 'kitchen-sw-to-se',
        name: 'Ouverture Cuisine',
        valueCm: MEASURED_DIST_KITCHEN_SW_TO_SE,
        start: [pEast('kitchen-sw'), yBase, pNorth('kitchen-sw') + 5],
        end: [pWest('kitchen-se'), yBase, pNorth('kitchen-sw') + 5],
        color: '#ff4081',
        description: 'Largeur de passage entre la face interne de kitchen-sw et la face interne de kitchen-se',
        axis: 'x',
      },

      // 5. Profondeur Séjour Mur Est (axe Z, face interne sud mur nord à face interne nord mur sud)
      {
        id: 'corner-ne-to-se',
        name: 'Profondeur Séjour Est',
        valueCm: MEASURED_DIST_CORNER_NE_TO_SE,
        start: [ROOM_W - 6, yBase, pSouth('corner-ne')],
        end: [ROOM_W - 6, yBase, pNorth('corner-se')],
        color: '#e040fb',
        description: 'Distance intérieure entre la face sud du mur nord et la face nord du mur sud (le long du mur Est)',
        axis: 'z',
      },

      // 6. Largeur de douche (axe X, face interne ouest à face interne retour douche)
      {
        id: 'shower-nw-to-ne',
        name: 'Largeur Douche',
        valueCm: MEASURED_DIST_SHOWER_NW_TO_NE,
        start: [pEast('shower-nw'), yBase, pNorth('shower-ne') + 5],
        end: [pWest('shower-ne'), yBase, pNorth('shower-ne') + 5],
        color: '#00e676',
        description: 'Largeur intérieure de la douche entre la face interne ouest et le retour douche NE',
        axis: 'x',
      },

      // 7. Passage couloir Est (axe X, face externe est cloison SDB à face interne ouest mur Est)
      {
        id: 'door-bath-e-to-corr-e',
        name: 'Largeur Couloir',
        valueCm: MEASURED_DIST_DOOR_BATH_E_TO_CORR_E,
        start: [pEast('door-bath-n'), yBase, 540],
        end: [ROOM_W - 2, yBase, 540],
        color: '#ff9100',
        description: 'Largeur intérieure de passage du couloir entre la face externe de la cloison SDB et le mur Est',
        axis: 'x',
      },

      // 8. Largeur Séjour Poutre ↔ Mur Est (axe X, face interne est poutre à face interne ouest mur Est)
      {
        id: 'niche-beam-to-east-wall',
        name: 'Largeur Séjour Poutre ↔ Est',
        valueCm: MEASURED_DIST_NICHE_BEAM_TO_EAST_WALL,
        start: [pEast('niche-beam'), yBase, NICHE_Z_START],
        end: [ROOM_W - 2, yBase, NICHE_Z_START],
        color: '#ffd600',
        description: 'Largeur intérieure du séjour entre la face interne de la poutre ouest et la face interne du mur Est',
        axis: 'x',
      },

      // 9. Hauteur sous plafond (axe Y, surface du parquet à sous-face du plafond)
      {
        id: 'floor-to-ceiling',
        name: 'Hauteur Parquet ↔ Plafond',
        valueCm: MEASURED_HEIGHT_FLOOR_TO_CEILING,
        start: [ROOM_W - 15, 0, 30],
        end: [ROOM_W - 15, WALL_H, 30],
        color: '#b388ff',
        description: 'Hauteur mesurée entre la surface du parquet et le plafond',
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
