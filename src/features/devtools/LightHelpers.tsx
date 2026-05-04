/**
 * LightHelpers.tsx — Visualisation des lumières de la scène.
 * Activé via layers.lights dans SidePanel > Affichage.
 *
 * Lumières (miroir de Studio.tsx) :
 *   L1 — DirectionalLight jaune  [500, 700, 400]  intensity=1.8  castShadow
 *   Ambient — 0x8899bb  intensity=0.6
 *
 * Visuels :
 *   • Sphère à la position symbolique de chaque lumière
 *   • Ligne depuis la position vers l'origine [0,0,0] (direction effective)
 *   • Cône directionnel (indique le sens du flux)
 *   • Boîte wireframe = emprise de la shadow camera (L1)
 *   • Disque au sol = centre de la shadow camera projetée
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// ── Données des lumières (sync avec Studio.tsx) ────────────────────────────────
type LightDef = {
  pos:       [number, number, number];
  target:    [number, number, number]; // cible effective de la lumière
  color:     number;
  intensity: number;
  label:     string;
  shadow:    boolean;
};

const LIGHTS: LightDef[] = [
  {
    pos:       [500, 700, 400],
    target:    [0, 0, 0],
    color:     0xffee44,
    intensity: 1.8,
    label:     'Lumière principale (castShadow)',
    shadow:    true,
  },
];

// Shadow camera de L1 : orthographique, left/right/top/bottom = ±600, near=1, far=3000
const SHADOW_CAM = {
  pos:    new THREE.Vector3(500, 700, 400),
  target: new THREE.Vector3(0, 0, 0),
  left: -600, right: 600, top: 600, bottom: -600,
  near: 1, far: 3000,
};

// ── Helpers géométriques ──────────────────────────────────────────────────────

/** Ligne entre deux points via primitive THREE.Line. */
function DebugLine({ from, to, color }: { from: THREE.Vector3Like; to: THREE.Vector3Like; color: number }) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(
      [from.x, from.y, from.z, to.x, to.y, to.z], 3,
    ));
    const mat = new THREE.LineBasicMaterial({ color, toneMapped: false, depthTest: false });
    return new THREE.Line(geo, mat);
  }, []);
  return <primitive object={lineObj} />;
}

/** Sphère + ligne de direction pour une lumière directionnelle. */
function DirLightMarker({ def }: { def: LightDef }) {
  const pos   = new THREE.Vector3(...def.pos);
  const tgt   = new THREE.Vector3(...def.target);
  const dir   = new THREE.Vector3().subVectors(tgt, pos).normalize();
  const coneP = pos.clone().addScaledVector(dir, 80); // pointe du cône à 80u vers la cible

  // Orientation du cône : axis +Y → dir
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, []);

  return (
    <group>
      {/* Sphère à la position symbolique */}
      <mesh position={def.pos}>
        <sphereGeometry args={[30, 12, 8]} />
        <meshBasicMaterial color={def.color} toneMapped={false} depthTest={false} />
      </mesh>

      {/* Ligne pos → cible */}
      <DebugLine from={pos} to={tgt} color={def.color} />

      {/* Cône directionnel */}
      <mesh
        position={coneP.toArray() as [number, number, number]}
        quaternion={[quat.x, quat.y, quat.z, quat.w]}
      >
        <coneGeometry args={[18, 60, 8]} />
        <meshBasicMaterial color={def.color} toneMapped={false} depthTest={false} />
      </mesh>
    </group>
  );
}

/** Wireframe représentant l'emprise orthographique de la shadow camera. */
function ShadowFrustumViz() {
  const { pos, target, left, right, top, bottom, near, far } = SHADOW_CAM;

  // Direction caméra lumière (normalisée)
  const dir = new THREE.Vector3().subVectors(target, pos).normalize();

  // Centre du frustum le long de la direction
  const frustumDepth = far - near;
  const center = pos.clone().addScaledVector(dir, near + frustumDepth / 2);

  // Dimensions : largeur=1200, hauteur=1200, profondeur=frustumDepth
  const w = right - left;   // 1200
  const h = top - bottom;   // 1200
  const d = frustumDepth;   // 2999

  // Quaternion alignant +Z local sur la direction
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    return q;
  }, []);

  return (
    <mesh
      position={center.toArray() as [number, number, number]}
      quaternion={[quat.x, quat.y, quat.z, quat.w]}
    >
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial color={0xffee44} wireframe toneMapped={false} depthTest={false} opacity={0.4} transparent />
    </mesh>
  );
}

/** Disque au sol indiquant le centre de la zone couverte par la shadow camera. */
function ShadowGroundDisk() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
      <ringGeometry args={[595, 600, 64]} />
      <meshBasicMaterial color={0xffee44} toneMapped={false} depthTest={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function LightHelpers() {
  return (
    <>
      {LIGHTS.map((l, i) => <DirLightMarker key={i} def={l} />)}
      <ShadowFrustumViz />
      <ShadowGroundDisk />
    </>
  );
}
