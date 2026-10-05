import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useSceneStore } from './store/useSceneStore';

interface BnfSkyMarkerProps {
  skyRadius?: number;
}

export function BnfSkyMarker({
  skyRadius = 3600,
}: BnfSkyMarkerProps) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const showBnfMarker = useSceneStore(state => state.layers.bnfMarker ?? true);
  const bnfAzimuth = useSceneStore(state => state.bnfAzimuth ?? 156.5);
  const bnfElevation = useSceneStore(state => state.bnfElevation ?? -3.0);
  const bnfRadius = useSceneStore(state => state.bnfRadius ?? 50);

  const pulseRingRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);

  // Position relative à l'origine locale (0,0,0) du groupe SkySphere
  // Mapping Three.js SphereGeometry :
  // phi = u * 2 * PI = azimuthDeg * (PI / 180)
  // theta = v * PI = (90 - elevationDeg) * (PI / 180)
  const markerRadius = skyRadius * 0.99;
  const position = useMemo(() => {
    const phi = (bnfAzimuth * Math.PI) / 180;
    const theta = ((90 - bnfElevation) * Math.PI) / 180;
    const x = -markerRadius * Math.cos(phi) * Math.sin(theta);
    const y = markerRadius * Math.cos(theta);
    const z = markerRadius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }, [bnfAzimuth, bnfElevation, markerRadius]);

  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(({ clock }) => {
    if (pulseRingRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 2.8) * 0.08;
      pulseRingRef.current.scale.set(s, s, 1);
    }
  });

  // Visible uniquement sur le ciel de Paris par défaut et quand le toggle est activé
  if (currentHdri !== 'default' || !showBnfMarker) return null;

  return (
    <group
      position={position}
      onUpdate={(self) => self.lookAt(origin)}
      name="BnfSkyMarker"
    >
      {/* Anneau principal rouge */}
      <mesh renderOrder={-500}>
        <ringGeometry args={[bnfRadius * 0.90, bnfRadius, 64]} />
        <meshBasicMaterial
          color="#ff1a40"
          side={THREE.DoubleSide}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Anneau pulsant externe plus fin */}
      <mesh ref={pulseRingRef} renderOrder={-499}>
        <ringGeometry args={[bnfRadius * 1.06, bnfRadius * 1.12, 64]} />
        <meshBasicMaterial
          color="#ff4d6d"
          side={THREE.DoubleSide}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Réticule central fin */}
      <mesh renderOrder={-498}>
        <circleGeometry args={[bnfRadius * 0.08, 32]} />
        <meshBasicMaterial
          color="#ff1a40"
          side={THREE.DoubleSide}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Réticules cardinaux (petites encoches repères) */}
      <mesh position={[0, bnfRadius * 0.95, 0]} renderOrder={-497}>
        <planeGeometry args={[bnfRadius * 0.08, bnfRadius * 0.25]} />
        <meshBasicMaterial color="#ff1a40" side={THREE.DoubleSide} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, -bnfRadius * 0.95, 0]} renderOrder={-497}>
        <planeGeometry args={[bnfRadius * 0.08, bnfRadius * 0.25]} />
        <meshBasicMaterial color="#ff1a40" side={THREE.DoubleSide} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[bnfRadius * 0.95, 0, 0]} renderOrder={-497}>
        <planeGeometry args={[bnfRadius * 0.25, bnfRadius * 0.08]} />
        <meshBasicMaterial color="#ff1a40" side={THREE.DoubleSide} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[-bnfRadius * 0.95, 0, 0]} renderOrder={-497}>
        <planeGeometry args={[bnfRadius * 0.25, bnfRadius * 0.08]} />
        <meshBasicMaterial color="#ff1a40" side={THREE.DoubleSide} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>

      {/* Libellé textuel au-dessus de l'anneau */}
      <group ref={labelRef} position={[0, bnfRadius + 24, 0]}>
        <Text
          color="#ffffff"
          fontSize={24}
          maxWidth={300}
          textAlign="center"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={2}
          outlineColor="#b3001e"
          material-depthTest={false}
          renderOrder={-490}
        >
          📍 BNF · Domicile
        </Text>
      </group>
    </group>
  );
}
