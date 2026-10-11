import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GroundPointProps {
  color?: string;
  scale?: number;
  hipsBone?: THREE.Bone | null;
}

export function GroundPoint({ color = '#0058a3', scale = 1, hipsBone }: GroundPointProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hipMarkerRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const lineGeomRef = useRef<THREE.BufferGeometry>(null);

  const arrowShape = useMemo(() => {
    const s = new THREE.Shape();
    // Dessiné dans le plan XY local de la Shape :
    // Y+ correspond à +Z dans la scène après rotation X = -PI/2
    // X=0 est l'axe de symétrie pour un centrage parfait
    // Y- correspond à l'avant face au personnage (-Z) une fois le mesh incliné à plat
    s.moveTo(0, -8.5);       // Pointe avant
    s.lineTo(2.4, -4.6);     // Aile droite
    s.lineTo(1.1, -5.0);     // Encoche droite
    s.lineTo(1.1, -2.5);     // Pied droit
    s.lineTo(-1.1, -2.5);    // Pied gauche
    s.lineTo(-1.1, -5.0);    // Encoche gauche
    s.lineTo(-2.4, -4.6);    // Aile gauche
    s.closePath();
    return s;
  }, []);

  const dashedLineMat = useMemo(() => {
    return new THREE.LineDashedMaterial({
      color,
      dashSize: 1.5,
      gapSize: 1,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });
  }, [color]);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    // Si la caméra regarde depuis le dessous (vue de dessous, Y < 0),
    // positionner le marqueur à -0.05 pour être au premier plan par rapport à la face inférieure (Y=0)
    const sign = camera.position.y < 0 ? -1 : 1;
    const yGround = 0.05 * scale * sign;
    groupRef.current.position.y = yGround;

    if (hipsBone && hipMarkerRef.current && lineGeomRef.current) {
      // Calcul de la projection de l'os des hanches (root_hip) dans le repère local du personnage (XZ avec Y=0)
      const parentObj = groupRef.current.parent;
      if (parentObj) {
        const hipsWorldPos = new THREE.Vector3();
        hipsBone.getWorldPosition(hipsWorldPos);
        const hipsLocal = parentObj.worldToLocal(hipsWorldPos);

        const hx = hipsLocal.x;
        const hz = hipsLocal.z;

        // Positionnement du ground point root_hip
        hipMarkerRef.current.position.set(hx, yGround, hz);
        hipMarkerRef.current.visible = true;

        // Ligne pointillée reliant root_joint (0, yGround, 0) à root_hip (hx, yGround, hz)
        const pts = new Float32Array([
          0, yGround, 0,
          hx, yGround, hz,
        ]);
        lineGeomRef.current.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        if (lineRef.current) {
          lineRef.current.computeLineDistances();
          lineRef.current.visible = true;
        }
      }
    } else {
      if (hipMarkerRef.current) hipMarkerRef.current.visible = false;
      if (lineRef.current) lineRef.current.visible = false;
    }
  });

  return (
    <>
      {/* Ground Point root_joint (origine locale du personnage) */}
      <group ref={groupRef} position={[0, 0.05 * scale, 0]} scale={scale} name="GroundPoint">
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
        {/* Flèche d'orientation 2D dirigée vers l'avant (-Z) - visible sur les 2 faces */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <shapeGeometry args={[arrowShape]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Ligne pointillée reliant root_joint et root_hip */}
      {hipsBone && (
        <lineSegments ref={lineRef} material={dashedLineMat} renderOrder={9999} frustumCulled={false}>
          <bufferGeometry ref={lineGeomRef} />
        </lineSegments>
      )}

      {/* Ground Point root_hip (projection XZ des hanches à Y=0) */}
      {hipsBone && (
        <group ref={hipMarkerRef} scale={scale * 0.85} name="GroundPointHips">
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 3.5, 36]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.0, 24]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </>
  );
}

