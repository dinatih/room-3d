/**
 * SunLight.tsx — directional light calée sur la position réelle du soleil.
 *
 * Algorithme USNO simplifié (~1° de précision) :
 *   longitude écliptique → RA/déclinaison → angle horaire → alt/az.
 *
 * La direction ENU résultante est ensuite convertie dans le repère de la
 * scène via la même rotation enuToRoom que RealWorldLayer (VITE_STUDIO_AZ).
 */

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { DirectionalLight, Mesh, MeshBasicMaterial, Color, MathUtils } from 'three';

const LAT    = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const LNG    = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');
const AZ_DEG = parseFloat(import.meta.env.VITE_STUDIO_AZ  ?? '90');

// ── Calcul de la position solaire ─────────────────────────────────────────────

export function solarPosition(lat: number, lng: number, date: Date) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n  = JD - 2451545.0; // jours depuis J2000.0

  const L  = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g  = MathUtils.degToRad(((357.528 + 0.9856003 * n) % 360 + 360) % 360);
  const lam = MathUtils.degToRad(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const eps = MathUtils.degToRad(23.439 - 0.0000004 * n);

  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const RA  = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));

  const GMST = ((6.697375 + 0.0657098242 * n) % 24 + 24) % 24;
  const utH  = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const LST  = (GMST + utH * 1.00274) % 24 + lng / 15;
  const HA   = MathUtils.degToRad(((LST * 15) - MathUtils.radToDeg(RA) + 360) % 360);

  const phiR  = MathUtils.degToRad(lat);
  const sinEl = Math.sin(phiR) * Math.sin(dec) + Math.cos(phiR) * Math.cos(dec) * Math.cos(HA);
  const elRad = Math.asin(Math.max(-1, Math.min(1, sinEl)));

  const cosAz = (Math.sin(dec) - Math.sin(elRad) * Math.sin(phiR)) / (Math.cos(elRad) * Math.cos(phiR));
  let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(HA) > 0) azRad = 2 * Math.PI - azRad;

  return {
    elevation: MathUtils.radToDeg(elRad),  // °  au-dessus de l'horizon
    azimuth:   MathUtils.radToDeg(azRad),  // °  depuis le Nord, sens horaire
  };
}

// ── Couleur et intensité selon l'élévation ────────────────────────────────────

function sunParams(el: number): { color: Color; intensity: number } {
  if (el <= 0)  return { color: new Color(0x001020), intensity: 0 };
  if (el < 5)   return { color: new Color(0xff5500), intensity: 0.3 + (el / 5) * 0.5 };
  if (el < 15)  return { color: new Color(0xff9940), intensity: 0.8 + ((el - 5)  / 10) * 0.4 };
  if (el < 30)  return { color: new Color(0xffc070), intensity: 1.1 + ((el - 15) / 15) * 0.4 };
  return { color: new Color(0xfff5e0), intensity: 1.4 + Math.sin(MathUtils.degToRad(el)) * 0.4 };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function SunLight() {
  const lightRef = useRef<DirectionalLight>(null!);
  const { invalidate } = useThree();

  useEffect(() => {
    function update() {
      if (!lightRef.current) return;
      const { azimuth, elevation } = solarPosition(LAT, LNG, new Date());

      // Direction ENU vers le soleil
      const azR   = MathUtils.degToRad(azimuth);
      const elR   = MathUtils.degToRad(Math.max(0, elevation));
      const east  = Math.sin(azR) * Math.cos(elR);
      const north = Math.cos(azR) * Math.cos(elR);
      const up    = Math.sin(elR);

      // Rotation ENU → scène (même matrice que RealWorldLayer.buildTileTransform)
      const stAz  = MathUtils.degToRad(AZ_DEG);
      const sinSt = Math.sin(stAz);
      const cosSt = Math.cos(stAz);
      const D = 2000;
      lightRef.current.position.set(
        (sinSt * east + cosSt * north) * D,
        up * D,
        (cosSt * east - sinSt * north) * D,
      );

      const { color, intensity } = sunParams(elevation);
      lightRef.current.color.copy(color);
      lightRef.current.intensity = intensity;
      invalidate();
    }

    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [invalidate]);

  return (
    <directionalLight
      ref={lightRef}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-near={1}
      shadow-camera-far={2000}
      shadow-camera-left={-600}
      shadow-camera-right={600}
      shadow-camera-top={600}
      shadow-camera-bottom={-600}
      shadow-bias={-0.0002}
      shadow-normalBias={0.04}
    />
  );
}

// ── Disque solaire visible ────────────────────────────────────────────────────

const SPHERE_D = 4000; // cm depuis le centre de la pièce
const SPHERE_R = 130;  // rayon apparent

function sunDir(azimuth: number, elevation: number) {
  const azR  = MathUtils.degToRad(azimuth);
  const elR  = MathUtils.degToRad(Math.max(0, elevation));
  const east  = Math.sin(azR) * Math.cos(elR);
  const north = Math.cos(azR) * Math.cos(elR);
  const up    = Math.sin(elR);
  const stAz  = MathUtils.degToRad(AZ_DEG);
  const sinSt = Math.sin(stAz);
  const cosSt = Math.cos(stAz);
  return {
    x: 150 + (sinSt * east + cosSt * north) * SPHERE_D,
    y: up * SPHERE_D,
    z: 200 + (cosSt * east - sinSt * north) * SPHERE_D,
  };
}

export function SunSphere() {
  const meshRef = useRef<Mesh>(null!);
  const matRef  = useRef<MeshBasicMaterial>(null!);
  const { invalidate } = useThree();

  useEffect(() => {
    function update() {
      if (!meshRef.current || !matRef.current) return;
      const { azimuth, elevation } = solarPosition(LAT, LNG, new Date());
      meshRef.current.visible = elevation > 0;
      if (elevation > 0) {
        const { x, y, z } = sunDir(azimuth, elevation);
        meshRef.current.position.set(x, y, z);
        const { color } = sunParams(elevation);
        matRef.current.color.copy(color);
      }
      invalidate();
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [invalidate]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[SPHERE_R, 16, 8]} />
      <meshBasicMaterial ref={matRef} />
    </mesh>
  );
}
