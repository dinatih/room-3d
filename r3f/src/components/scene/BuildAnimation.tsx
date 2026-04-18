/**
 * BuildAnimation.tsx — Animation de construction de l'appartement.
 *
 * Révèle progressivement la scène de bas en haut via un plan de coupe
 * Three.js (renderer.clippingPlanes) qui monte de Y=0 à Y=WALL_H+20.
 * Une ligne de scan lumineuse (holographique) accompagne la montée.
 * La caméra effectue un tour d'orbite complet (360°) en même temps.
 *
 * Utilise requestAnimationFrame natif + invalidate() pour être compatible
 * avec frameloop="demand" (state.invalidate() dans useFrame est dédupliqué).
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from '@config';

// ── Constantes ────────────────────────────────────────────────────────────────

const DURATION    = 6000;       // ms
const ORBIT_TURNS = 1;          // tour complet → retour position de départ
const CX     = ROOM_W / 2;
const CZ     = ROOM_D / 2;
const LOOK_Y = WALL_H / 3;
const SCAN_W = 900;

// Temporaires réutilisés (évite allocations dans la boucle)
const _lookTarget = new THREE.Vector3(CX, LOOK_Y, CZ);
const _m4         = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();

// ── Easing ────────────────────────────────────────────────────────────────────

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// ── Matériaux ─────────────────────────────────────────────────────────────────

const lineMat = new THREE.MeshBasicMaterial({
  color: 0x22ddff, transparent: true, opacity: 0.9,
  depthWrite: false, depthTest: false, side: THREE.DoubleSide,
});
const glowMat = new THREE.MeshBasicMaterial({
  color: 0x0088cc, transparent: true, opacity: 0.18,
  depthWrite: false, depthTest: false, side: THREE.DoubleSide,
});

// ── Composant ─────────────────────────────────────────────────────────────────

export function BuildAnimation({ onFinish }: { onFinish: () => void }) {
  const { gl, invalidate, camera } = useThree();

  const clipPlane = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0));
  const lineRef   = useRef<THREE.Mesh>(null!);
  const glowRef   = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    gl.clippingPlanes = [clipPlane.current];

    // Capturer la position/orientation courante de la caméra
    const dx = camera.position.x - CX;
    const dz = camera.position.z - CZ;
    const orbit = {
      r:         Math.max(Math.sqrt(dx * dx + dz * dz), 100),
      angle0:    Math.atan2(dz, dx),
      camY:      camera.position.y,
      startQuat: camera.quaternion.clone(),
    };

    let start: number | null = null;
    let raf: number;

    function tick(now: number) {
      if (start === null) start = now;
      const t     = Math.min((now - start) / DURATION, 1);
      const eased = easeOut(easeInOut(t));
      const clipY = (WALL_H + 20) * eased;

      // Plan de coupe
      clipPlane.current.constant = clipY;

      // Scan line
      if (lineRef.current) {
        lineRef.current.position.y = clipY + 0.5;
        const fade = t > 0.88 ? Math.max(0, (1 - t) / 0.12) : 1;
        (lineRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * fade;
      }
      if (glowRef.current) {
        glowRef.current.position.y = clipY - 18;
        const fade = t > 0.88 ? Math.max(0, (1 - t) / 0.12) : 1;
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.18 * fade;
      }

      // Orbite caméra
      const angle = orbit.angle0 + easeInOut(t) * Math.PI * 2 * ORBIT_TURNS;
      camera.position.set(
        CX + orbit.r * Math.cos(angle),
        orbit.camY,
        CZ + orbit.r * Math.sin(angle),
      );
      // Orientation : slerp progressif vers le lookAt (évite saut au départ)
      _m4.lookAt(camera.position, _lookTarget, camera.up);
      _targetQuat.setFromRotationMatrix(_m4);
      const lookBlend = Math.min(t / 0.15, 1);
      camera.quaternion.slerpQuaternions(orbit.startQuat, _targetQuat, lookBlend);

      invalidate(); // déclencher le rendu R3F (compatible frameloop="demand")

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        gl.clippingPlanes = [];
        // Synchroniser OrbitControls avec la position finale
        document.dispatchEvent(new CustomEvent('camera-view', {
          detail: {
            pos:    [camera.position.x, camera.position.y, camera.position.z] as [number, number, number],
            target: [CX, LOOK_Y, CZ] as [number, number, number],
          },
        }));
        onFinish();
      }
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      gl.clippingPlanes = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // une seule fois au montage — camera/gl/invalidate sont stables

  return (
    <>
      {/* Ligne de scan principale */}
      <mesh
        ref={lineRef}
        position={[CX, 0, CZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={998}
        material={lineMat}
      >
        <planeGeometry args={[SCAN_W, 3]} />
      </mesh>

      {/* Halo diffus en-dessous */}
      <mesh
        ref={glowRef}
        position={[CX, -18, CZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={997}
        material={glowMat}
      >
        <planeGeometry args={[SCAN_W, 36]} />
      </mesh>
    </>
  );
}
