/**
 * RealWorldLayer.tsx — Google Photorealistic 3D Tiles géoréférencés autour du studio.
 *
 * Coordonnées GPS :
 *   VITE_STUDIO_LAT / LNG  — decimal degrees
 *   OU VITE_W3W_API_KEY    — conversion auto de ///vegans.leap.camp
 *   VITE_STUDIO_ALT        — altitude en mètres (défaut 30)
 *   VITE_STUDIO_AZ         — bearing (°) depuis le Nord de l'axe +X du studio,
 *                            90 = X pointe Est (défaut)
 */

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Group, Matrix4, PerspectiveCamera, Color, MathUtils } from 'three';
import { TilesRenderer, WGS84_ELLIPSOID } from '3d-tiles-renderer/three';
import { GoogleCloudAuthPlugin } from '3d-tiles-renderer/core/plugins';

const GOOGLE_TILES_URL = 'https://tile.googleapis.com/v1/3dtiles/root.json';
const W3W_ADDRESS      = 'vegans.leap.camp';

// ── Résolution des coordonnées GPS ───────────────────────────────────────────

async function resolveCoords(): Promise<{ lat: number; lng: number; alt: number }> {
  const lat = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '');
  const lng = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '');
  if (!isNaN(lat) && !isNaN(lng)) {
    return { lat, lng, alt: parseFloat(import.meta.env.VITE_STUDIO_ALT ?? '30') };
  }
  const key = import.meta.env.VITE_W3W_API_KEY ?? '';
  if (!key) throw new Error('GPS manquant : définir VITE_STUDIO_LAT/LNG ou VITE_W3W_API_KEY');
  const r = await fetch(
    `https://api.what3words.com/v3/convert-to-coordinates?words=${W3W_ADDRESS}&key=${encodeURIComponent(key)}`
  );
  const d = await r.json();
  if (!d.coordinates) throw new Error(`what3words: ${d.error?.message ?? 'erreur'}`);
  return { lat: d.coordinates.lat, lng: d.coordinates.lng, alt: 30 };
}

// ── Transform ECEF (m) → scène (cm), studio GPS à l'origine ─────────────────

function buildTileTransform(lat: number, lng: number, alt: number, azDeg: number): Matrix4 {
  const enuToEcef = new Matrix4();
  WGS84_ELLIPSOID.getEastNorthUpFrame(MathUtils.degToRad(lat), MathUtils.degToRad(lng), alt, enuToEcef);
  const ecefToEnu = enuToEcef.clone().invert();

  // ENU (X=Est, Y=Nord, Z=Haut) → scène Three.js (Y-up)
  // azDeg = bearing depuis le Nord de l'axe +X du studio
  const az    = MathUtils.degToRad(azDeg);
  const sinAz = Math.sin(az);
  const cosAz = Math.cos(az);
  const enuToRoom = new Matrix4().set(
    sinAz,  cosAz,  0, 0,
    0,      0,      1, 0,
    cosAz, -sinAz,  0, 0,
    0,      0,      0, 1,
  );

  return new Matrix4()
    .multiply(new Matrix4().makeScale(100, 100, 100))
    .multiply(enuToRoom)
    .multiply(ecefToEnu);
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function RealWorldLayer() {
  const { gl, camera, scene, invalidate } = useThree();
  const tilesRef = useRef<TilesRenderer | null>(null);
  const groupRef = useRef<Group>(null!);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
    if (!apiKey) {
      console.error('[RealWorldLayer] VITE_GOOGLE_MAPS_API_KEY manquante dans .env.local');
      return;
    }

    const azDeg = parseFloat(import.meta.env.VITE_STUDIO_AZ ?? '90');
    const tiles = new TilesRenderer(GOOGLE_TILES_URL);
    tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: apiKey, autoRefreshToken: true }));

    let alive = true;
    const cam     = camera as PerspectiveCamera;
    const prevFar = cam.far;
    const prevBg  = scene.background;

    cam.far = 5_000_000; // ~50 km en cm
    cam.updateProjectionMatrix();
    scene.background = new Color(0x87ceeb);

    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, gl);
    tiles.addEventListener('needs-update', invalidate);

    resolveCoords()
      .then(({ lat, lng, alt }) => {
        if (!alive) { tiles.dispose(); return; }
        tiles.group.matrix.copy(buildTileTransform(lat, lng, alt, azDeg));
        tiles.group.matrixAutoUpdate = false;
        tiles.group.updateMatrixWorld(true);
        groupRef.current.add(tiles.group);
        tilesRef.current = tiles;
        invalidate();
      })
      .catch(err => {
        console.error('[RealWorldLayer]', String(err));
        if (alive) tiles.dispose();
      });

    return () => {
      alive = false;
      tiles.removeEventListener('needs-update', invalidate);
      cam.far = prevFar;
      cam.updateProjectionMatrix();
      scene.background = prevBg;
      const t = tilesRef.current;
      if (t) {
        groupRef.current?.remove(t.group);
        t.dispose();
        tilesRef.current = null;
      } else {
        tiles.dispose();
      }
    };
  }, [camera, gl, scene, invalidate]);

  useFrame(() => {
    tilesRef.current?.update();
  });

  return <group ref={groupRef} />;
}
