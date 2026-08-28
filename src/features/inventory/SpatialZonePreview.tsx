import { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { SpatialZone } from '@features/scene/ai/SpatialZone';

// Composants d'équipements / meubles pour les pièces
import { Toilet } from '@features/scene/items/Toilet';
import { Shower } from '@features/scene/items/Shower';
import { VasqueSdb } from '@features/scene/items/VasqueSdb';
import { WaterHeater } from '@features/scene/items/WaterHeater';
import { SdbCloset } from '@features/scene/items/SdbCloset';
import { BathroomCabinetWest, BathroomCabinetEast } from '@features/scene/items/BathroomCabinet';
import { CorridorCloset } from '@features/scene/items/CorridorCloset';
import { UtakerFrame } from '@features/scene/items/UtakerFrame';
import { BollsidanDesk } from '@features/scene/items/BollsidanDesk';
import { CuisineGroup } from '@features/scene/items/CuisineGroup';
import { Freezer } from '@features/scene/items/Freezer';
import { ArmrestSofa } from '@features/scene/items/ArmrestSofa';
import { ArmlessSofa } from '@features/scene/items/ArmlessSofa';
import { Bathtub } from '@features/scene/items/Bathtub';
import { GrassRug } from '@features/scene/items/GrassRug';
import { Scooter } from '@features/scene/items/Scooter';
import { Linky } from '@features/scene/items/Linky';
import { TradfriBulb } from '@features/scene/items/TradfriBulb';
import { DoorLiving, DoorBath } from '@features/scene/items/DoorWhite';
import { DoorEntry } from '@features/scene/items/DoorEntry';
import { NOOP_ITEM, NOOP_SIZE, NOOP_STATE } from '@features/scene/sceneItem';
import { ROOM_W, ROOM_D, DOOR_START, DOOR_END, KITCHEN_Z, DiagWall } from '@config';
import { PARTITION_THICKNESS, CORR_WALL_X, pZ } from '@features/scene/wallData';

const CATEGORY_COLORS: Record<string, string> = {
  bed: '#ff4081',
  seating: '#00e5ff',
  hygiene: '#00e676',
  surface: '#ffab00',
  storage: '#ffd600',
  appliance: '#e040fb',
  outdoor: '#76ff03',
  decor: '#b388ff',
};

/**
 * Rendu 3D spécifique d'une SpatialZone isolée
 */
function IsolatedZoneContent({ zone }: { zone: SpatialZone }) {
  const min = zone.bounds.min;
  const max = zone.bounds.max;

  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  const size: [number, number, number] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];

  const smartObjects = useMemo(() => zone.getSmartObjects(), [zone]);
  const waypoints = useMemo(() => zone.getWaypoints(), [zone]);

  // Coordonnées et calculs de la porte d'entrée diagonale
  const entry = useMemo(() => {
    const c = DiagWall.p(DiagWall.door.start + 45, 5);
    return {
      wx: c.x,
      wy: 102,
      wz: c.z,
      diagRotY: DiagWall.rotY - Math.PI / 2,
    };
  }, []);

  const CORR_CX = (DOOR_START + ROOM_W) / 2;
  const CORR_LAMP_Z = (pZ('corner-se') + pZ('diag-ne')) / 2;

  return (
    <group position={[-center[0], 0, -center[2]]}>
      {/* Sol de la pièce */}
      <mesh position={[center[0], -0.2, center[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial
          color={zone.environment === 'outdoor' ? '#3a7d44' : (zone.id === 'bathroom' ? '#e2e8f0' : (zone.id === 'corridor' ? '#b32d2d' : '#d4a437'))}
          roughness={0.7}
        />
      </mesh>

      {/* ── Contenu 3D dédié par pièce ── */}
      {zone.id === 'bathroom' && (
        <group>
          {/* Murs carrelés SDB */}
          <mesh position={[91, 125, 400]}>
            <boxGeometry args={[202, 250, 4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          <mesh position={[-10, 125, 540]}>
            <boxGeometry args={[4, 250, 280]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* Équipements SDB */}
          <group position={[50, 0, 500]}>
            <Toilet item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[116, 0, 545]}>
            <VasqueSdb item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[25, 0, 645]}>
            <Shower item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[130, 0, 600]}>
            <SdbCloset item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[30, 0, 487]}>
            <BathroomCabinetWest item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[169, 0, 487]}>
            <BathroomCabinetEast item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[140, 160, 470]}>
            <WaterHeater item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {zone.id === 'corridor' && (
        <group>
          {/* Murs du couloir */}
          {/* Mur Est (X=ROOM_W=316, de Z=400 à DiagWall.A.z=542) */}
          <mesh position={[ROOM_W + 2.5, 125, (400 + DiagWall.A.z) / 2]}>
            <boxGeometry args={[5, 250, DiagWall.A.z - 400]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
          </mesh>

          {/* Mur Nord (séparation Séjour, Z=400) — de X=192 à X=DOOR_START (placard) + linteau au dessus porte */}
          <mesh position={[(192 + DOOR_START) / 2, 125, ROOM_D + PARTITION_THICKNESS / 2]}>
            <boxGeometry args={[DOOR_START - 192, 250, PARTITION_THICKNESS]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          <mesh position={[(DOOR_START + DOOR_END) / 2, 227, ROOM_D + PARTITION_THICKNESS / 2]}>
            <boxGeometry args={[DOOR_END - DOOR_START, 46, PARTITION_THICKNESS]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          <mesh position={[(DOOR_END + ROOM_W) / 2, 125, ROOM_D + PARTITION_THICKNESS / 2]}>
            <boxGeometry args={[ROOM_W - DOOR_END, 250, PARTITION_THICKNESS]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>

          {/* Mur Ouest (séparation SDB, X=CORR_WALL_X=195.6) — morceaux nord, sud et linteau */}
          <mesh position={[CORR_WALL_X, 125, (460 + 513.4) / 2]}>
            <boxGeometry args={[PARTITION_THICKNESS, 250, 513.4 - 460]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          <mesh position={[CORR_WALL_X, 227, 560]}>
            <boxGeometry args={[PARTITION_THICKNESS, 46, 93.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          <mesh position={[CORR_WALL_X, 125, (606.6 + 680) / 2]}>
            <boxGeometry args={[PARTITION_THICKNESS, 250, 680 - 606.6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>

          {/* Mur Diagonal Sud / Entrée */}
          {(() => {
            const centerDiag = DiagWall.p(DiagWall.len / 2, DiagWall.depth / 2);
            return (
              <group position={[centerDiag.x, 125, centerDiag.z]} rotation-y={DiagWall.rotY + Math.PI / 2}>
                {/* Linteau au dessus de la porte d'entrée */}
                <mesh position={[-DiagWall.len / 2 + 55, 102, 0]}>
                  <boxGeometry args={[90, 46, DiagWall.depth]} />
                  <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
                </mesh>
                {/* Panneau diagonal restant */}
                <mesh position={[45, 0, 0]}>
                  <boxGeometry args={[DiagWall.len - 100, 250, DiagWall.depth]} />
                  <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
                </mesh>
              </group>
            );
          })()}

          {/* ── Les 3 Portes ── */}
          {/* 1. Porte Séjour */}
          <group position={[(DOOR_START + DOOR_END) / 2, 102, ROOM_D + PARTITION_THICKNESS / 2]}>
            <DoorLiving item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>

          {/* 2. Porte SDB */}
          <group position={[CORR_WALL_X, 102, 560]} rotation-y={Math.PI / 2}>
            <DoorBath item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>

          {/* 3. Porte Entrée */}
          <group position={[entry.wx, entry.wy, entry.wz]} rotation-y={entry.diagRotY}>
            <DoorEntry item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>

          {/* ── Placard Couloir ── */}
          <group position={[220, 0, (ROOM_D + 10 + KITCHEN_Z) / 2]}>
            <CorridorCloset item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>

          {/* ── Coffrage Linky ── */}
          <group>
            <mesh position={[ROOM_W - 3.25, 125, 512.75]}>
              <boxGeometry args={[6.5, 250, 25.5]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.7} />
            </mesh>
            <group position={[ROOM_W - 6.5 - 3.5, 170, 512.75]} rotation={[0, -Math.PI / 2, 0]}>
              <Linky item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
            </group>
          </group>

          {/* ── Trottinette ── */}
          <group position={[298, 0, 470]} rotation-y={Math.PI}>
            <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>

          {/* ── Ampoule Tradfri Couloir ── */}
          <group position={[CORR_CX, 240, CORR_LAMP_Z]} rotation={[Math.PI, 0, 0]}>
            <TradfriBulb item={NOOP_ITEM} actionState={{ on: true }} onSize={NOOP_SIZE} />
            <pointLight position={[0, 20, 0]} intensity={2.5} distance={300} decay={2} color={0xfff5e6} />
          </group>
        </group>
      )}

      {zone.id === 'living' && (
        <group>
          <group position={[74, 0, 151.5]}>
            <UtakerFrame item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[270, 0, 190]}>
            <UtakerFrame item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[75, 0, 60]}>
            <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[200, 0, 215]}>
            <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[80, 0, 370]}>
            <CuisineGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[250, 0, 320]}>
            <Freezer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {zone.id === 'garden' && (
        <group>
          <group position={[270, 0, -110]}>
            <ArmrestSofa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[100, 0, -80]}>
            <ArmlessSofa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[120, 0, -300]}>
            <Bathtub item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[120, 0, -100]}>
            <GrassRug item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {/* ── Waypoints de navigation de la pièce ── */}
      {waypoints.map(wp => (
        <group key={wp.id} position={[wp.x, 1, wp.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[6, 8, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Html position={[0, 10, 0]} center distanceFactor={180}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              border: '1px solid #ffffff',
              pointerEvents: 'none'
            }}>
              📍 {wp.name || wp.id}
            </div>
          </Html>
        </group>
      ))}

      {/* ── SmartObjects et slots de la pièce ── */}
      {smartObjects.map(obj => {
        const color = CATEGORY_COLORS[obj.category] || '#00e5ff';
        return (
          <group key={obj.id} position={[obj.position[0], 2, obj.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[10, 24]} />
              <meshBasicMaterial color={color} opacity={0.3} transparent />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8, 10, 24]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <Html position={[0, 15, 0]} center distanceFactor={180}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                color: color,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                border: `1px solid ${color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}>
                ✨ {obj.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function SpatialZonePreview({
  zone,
  height = 320
}: {
  zone: SpatialZone;
  height?: number | string;
}) {
  const maxDim = Math.max(
    zone.bounds.max[0] - zone.bounds.min[0],
    zone.bounds.max[2] - zone.bounds.min[2]
  );
  const camDistance = Math.max(250, maxDim * 1.3);

  return (
    <div style={{ width: '100%', height, position: 'relative', background: '#0b1120', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [camDistance * 0.8, camDistance * 0.8, camDistance * 0.8], fov: 40, near: 1, far: 5000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[200, 400, 200]} intensity={2.0} castShadow />
        <directionalLight position={[-200, 300, -200]} intensity={1.0} />

        <Suspense fallback={null}>
          <IsolatedZoneContent zone={zone} />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02} // Empêche de passer sous le sol
          minDistance={50}
          maxDistance={camDistance * 3}
        />
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(15, 23, 42, 0.85)',
        color: '#ffffff',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(4px)'
      }}>
        <span>{zone.environment === 'indoor' ? '🏠' : '🌳'}</span>
        <span>Vue Isolée : {zone.name}</span>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        background: 'rgba(15, 23, 42, 0.75)',
        color: '#94a3b8',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        pointerEvents: 'none'
      }}>
        Clic gauche : rotation • Molette : zoom • Clic droit : translation
      </div>
    </div>
  );
}
