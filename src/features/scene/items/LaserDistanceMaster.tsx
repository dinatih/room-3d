/**
 * LaserDistanceMaster.tsx — Télémètre laser Laserliner DistanceMaster Compact 25 m
 * (réf 080.948A), procédural. 100 × 42 × 25 mm. Corps ABS gris foncé/noir,
 * bumpers caoutchouc nervurés sur les côtés, façade blanche : logo orange
 * « Laserliner® », LCD bleu marine multi-lignes, 1 gros bouton orange
 * (DIST / MIN-MAX) + 3 boutons blancs (mode, mesure, C/OFF). Lentilles
 * laser/récepteur au sommet.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W = 4.2;   // X — largeur
const H = 10.0;  // Y — hauteur
const D = 2.5;   // Z — profondeur
const R = 0.35;  // arrondi coins

const BODY_DARK   = 0x2c2e33;  // ABS gris anthracite
const BODY_GRIP   = 0x1a1b1f;  // bumper caoutchouc noir mat
const PANEL_WHITE = 0xeeeeee;  // façade plastique blanche
const ORANGE      = 0xf28119;  // logo + bouton DIST
const LCD_BG      = 0x0d2638;  // bleu marine LCD
const LCD_FG      = 0xb6e6f5;  // texte/icônes LCD
const LCD_FG2     = 0x6da9bc;  // texte LCD secondaire
const RED_C       = 0xd92e2e;
const TOP_BLK     = 0x16181b;

const bodyMat   = new THREE.MeshStandardMaterial({ color: BODY_DARK,   metalness: 0.1,  roughness: 0.55 });
const gripMat   = new THREE.MeshStandardMaterial({ color: BODY_GRIP,   roughness: 0.85, metalness: 0.0  });
const panelMat  = new THREE.MeshStandardMaterial({ color: PANEL_WHITE, roughness: 0.45, metalness: 0.05 });
const orangeMat = new THREE.MeshStandardMaterial({ color: ORANGE,      roughness: 0.45, metalness: 0.15 });
const whiteBtnMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f6,  roughness: 0.5,  metalness: 0.05 });
const topBlkMat = new THREE.MeshStandardMaterial({ color: TOP_BLK,     roughness: 0.5,  metalness: 0.25 });
const lensRed   = new THREE.MeshStandardMaterial({
  color: 0xb02020, emissive: 0x441010, emissiveIntensity: 0.4,
  roughness: 0.25, metalness: 0.3,
});
const lensBlk   = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.35, metalness: 0.5 });

function makeBody(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = W / 2;
  shape.moveTo(-hw + R, 0);
  shape.lineTo( hw - R, 0);
  shape.quadraticCurveTo( hw, 0,  hw, R);
  shape.lineTo( hw,  H - R);
  shape.quadraticCurveTo( hw,  H,  hw - R,  H);
  shape.lineTo(-hw + R,  H);
  shape.quadraticCurveTo(-hw,  H, -hw,  H - R);
  shape.lineTo(-hw, R);
  shape.quadraticCurveTo(-hw, 0, -hw + R, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: D,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.16,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -D / 2);
  return geo;
}

function makeLcdTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 384;
  const ctx = c.getContext('2d')!;
  // Fond bleu marine + léger gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, '#103246');
  grad.addColorStop(1, '#0a2030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 384, 384);
  // Cadre interne
  ctx.strokeStyle = '#1d4a64';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 372, 372);

  // — Bandeau haut : Wi-Fi + batterie —
  // Wi-Fi (arcs)
  ctx.strokeStyle = '#b6e6f5';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(60, 90, 12 + i * 12, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
  ctx.fillStyle = '#b6e6f5';
  ctx.beginPath();
  ctx.arc(60, 90, 5, 0, Math.PI * 2);
  ctx.fill();
  // Batterie
  ctx.strokeStyle = '#b6e6f5';
  ctx.lineWidth = 3;
  ctx.strokeRect(280, 60, 80, 32);
  ctx.fillStyle = '#b6e6f5';
  ctx.fillRect(360, 68, 8, 16);
  // Barres batterie pleines
  ctx.fillRect(285, 65, 22, 22);
  ctx.fillRect(310, 65, 22, 22);
  ctx.fillRect(335, 65, 22, 22);

  // — Lignes max/min/dernière —
  ctx.fillStyle = '#b6e6f5';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('max', 36, 178);
  ctx.fillText('min', 36, 222);
  // Icône règle (petit dessin gauche)
  ctx.strokeStyle = '#b6e6f5';
  ctx.lineWidth = 2;
  ctx.strokeRect(96, 140, 22, 50);
  ctx.beginPath();
  ctx.moveTo(107, 134); ctx.lineTo(107, 142); ctx.stroke();

  // Valeurs principales
  ctx.fillStyle = '#cdf2fa';
  ctx.font = 'bold 56px "Courier New", monospace';
  ctx.fillText('2.366', 140, 188);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('m', 340, 184);
  ctx.font = 'bold 56px "Courier New", monospace';
  ctx.fillText('0.564', 140, 240);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('m', 340, 236);

  // Ligne dernière mesure (plus gros, en bas)
  ctx.fillStyle = '#e6fbff';
  ctx.font = 'bold 92px "Courier New", monospace';
  ctx.fillText('2.365', 60, 340);
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('m', 340, 336);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLogoTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 384, 96);
  ctx.fillStyle = '#f28119';
  ctx.font = 'bold italic 64px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Laserliner', 178, 52);
  // ® symbole
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('®', 318, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeDistBtnTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f28119';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#202020';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIST', 128, 34);
  // Icône triangle laser (flèche + étoile)
  ctx.beginPath();
  ctx.moveTo(118, 58); ctx.lineTo(128, 48); ctx.lineTo(138, 58); ctx.stroke();
  ctx.beginPath();
  ctx.arc(128, 68, 4, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 8, 68 + Math.sin(a) * 8);
    ctx.lineTo(128 + Math.cos(a) * 14, 68 + Math.sin(a) * 14);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('MIN/MAX', 128, 108);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeIconTexture(draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = '#1c1c1c';
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawCubeIcon(ctx: CanvasRenderingContext2D) {
  // Cube isométrique
  ctx.beginPath();
  ctx.moveTo(40, 50); ctx.lineTo(64, 38); ctx.lineTo(88, 50);
  ctx.lineTo(88, 90); ctx.lineTo(64, 102); ctx.lineTo(40, 90);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, 50); ctx.lineTo(64, 62); ctx.lineTo(88, 50);
  ctx.moveTo(64, 62); ctx.lineTo(64, 102);
  ctx.stroke();
}

function drawArrowIcon(ctx: CanvasRenderingContext2D) {
  // Flèche montante + repère
  ctx.beginPath();
  ctx.moveTo(64, 28); ctx.lineTo(64, 100);
  ctx.moveTo(64, 28); ctx.lineTo(48, 46);
  ctx.moveTo(64, 28); ctx.lineTo(80, 46);
  ctx.stroke();
  // Petite base
  ctx.beginPath();
  ctx.moveTo(40, 100); ctx.lineTo(88, 100);
  ctx.stroke();
}

function drawCOffIcon(ctx: CanvasRenderingContext2D) {
  // Lettre C rouge + OFF
  ctx.fillStyle = '#d92e2e';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C', 64, 64);
  ctx.fillStyle = '#1c1c1c';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('OFF', 64, 100);
}

export function LaserDistanceMaster({ onSize }: SceneItemProps) {
  const bodyGeo  = useMemo(makeBody, []);
  const lcdTex   = useMemo(makeLcdTexture, []);
  const logoTex  = useMemo(makeLogoTexture, []);
  const distTex  = useMemo(makeDistBtnTexture, []);
  const cubeTex  = useMemo(() => makeIconTexture(drawCubeIcon),  []);
  const arrowTex = useMemo(() => makeIconTexture(drawArrowIcon), []);
  const cOffTex  = useMemo(() => makeIconTexture(drawCOffIcon),  []);

  const lcdMat  = useMemo(() => new THREE.MeshStandardMaterial({
    map: lcdTex, emissive: 0x0a2030, emissiveMap: lcdTex,
    emissiveIntensity: 0.35, roughness: 0.45, metalness: 0,
  }), [lcdTex]);
  const logoMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: logoTex, transparent: true, roughness: 0.5,
  }), [logoTex]);
  const distBtnMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: distTex, roughness: 0.4, metalness: 0.15,
  }), [distTex]);
  const cubeIconMat  = useMemo(() => new THREE.MeshStandardMaterial({ map: cubeTex,  transparent: true, roughness: 0.5 }), [cubeTex]);
  const arrowIconMat = useMemo(() => new THREE.MeshStandardMaterial({ map: arrowTex, transparent: true, roughness: 0.5 }), [arrowTex]);
  const cOffIconMat  = useMemo(() => new THREE.MeshStandardMaterial({ map: cOffTex,  transparent: true, roughness: 0.5 }), [cOffTex]);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  const frontZ = -D / 2;

  // — Sommet noir (cap) avec lentilles —
  const topCapH = 0.55;
  const topCapY = H - topCapH / 2;
  const laserX = -0.85;
  const sensorX = 0.85;

  // — Façade blanche centrale —
  const panelW  = W - 1.4;       // entre les deux bumpers
  const panelY0 = 0.6;            // bas
  const panelY1 = H - 0.9;        // haut (sous cap noir)
  const panelCY = (panelY0 + panelY1) / 2;
  const panelH  = panelY1 - panelY0;

  // — Logo & LCD positions (sur la façade) —
  const logoY  = panelY1 - 0.45;
  const lcdW   = panelW - 0.2;
  const lcdH   = 3.6;
  const lcdY   = logoY - 0.4 - lcdH / 2;

  // — Boutons —
  const distBtnY = lcdY - lcdH / 2 - 1.0;
  const cubeBtnY = distBtnY - 1.05;
  const arrowBtnY = cubeBtnY - 0.95;
  const cBtnY    = arrowBtnY - 0.95;

  return (
    <group userData={{ hoverAction: { label: 'Télémètre Laserliner' } }}>
      {/* Corps gris anthracite */}
      <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow />

      {/* Bumpers caoutchouc nervurés — côtés gauche/droit */}
      {(['left', 'right'] as const).map(side => {
        const sx = side === 'left' ? -W / 2 + 0.05 : W / 2 - 0.05;
        return (
          <group key={side} position={[sx, H / 2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.45, H * 0.78, D + 0.18]} />
              <primitive object={gripMat} attach="material" />
            </mesh>
            {/* Nervures horizontales (5 lignes en relief) */}
            {[-1.6, -0.8, 0, 0.8, 1.6].map((dy, i) => (
              <mesh key={i} position={[side === 'left' ? -0.15 : 0.15, dy, 0]}>
                <boxGeometry args={[0.18, 0.16, D + 0.22]} />
                <meshStandardMaterial color={0x0a0a0a} roughness={0.9} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Sommet noir (cap) */}
      <mesh position={[0, topCapY, 0]} castShadow>
        <boxGeometry args={[W - 0.1, topCapH, D - 0.05]} />
        <primitive object={topBlkMat} attach="material" />
      </mesh>
      {/* 2 lentilles sur le dessus (laser + récepteur) */}
      <mesh position={[laserX, H + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 22]} />
        <primitive object={lensBlk} attach="material" />
      </mesh>
      <mesh position={[laserX, H + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 18]} />
        <primitive object={lensRed} attach="material" />
      </mesh>
      <mesh position={[sensorX, H + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 22]} />
        <primitive object={lensBlk} attach="material" />
      </mesh>
      {/* Petite vis Phillips au centre-haut */}
      <mesh position={[0, H + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 12]} />
        <meshStandardMaterial color={0x444444} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Façade plastique blanche (en saillie) */}
      <mesh position={[0, panelCY, frontZ - 0.06]} castShadow>
        <boxGeometry args={[panelW, panelH, 0.12]} />
        <primitive object={panelMat} attach="material" />
      </mesh>

      {/* Logo orange "Laserliner®" */}
      <mesh position={[0, logoY, frontZ - 0.13]}>
        <planeGeometry args={[panelW - 0.4, 0.55]} />
        <primitive object={logoMat} attach="material" />
      </mesh>

      {/* LCD bezel noir + écran */}
      <mesh position={[0, lcdY, frontZ - 0.13]}>
        <boxGeometry args={[lcdW + 0.12, lcdH + 0.12, 0.05]} />
        <meshStandardMaterial color={0x0a0a0a} roughness={0.45} />
      </mesh>
      <mesh position={[0, lcdY, frontZ - 0.16]}>
        <planeGeometry args={[lcdW, lcdH]} />
        <primitive object={lcdMat} attach="material" />
      </mesh>

      {/* Bouton DIST / MIN-MAX (orange, rectangle arrondi) */}
      <mesh position={[0, distBtnY, frontZ - 0.16]} castShadow>
        <boxGeometry args={[panelW - 0.6, 0.85, 0.18]} />
        <primitive object={distBtnMat} attach="material" />
      </mesh>

      {/* Bouton cube (mode aire/volume) */}
      <WhiteIconBtn y={cubeBtnY} z={frontZ} panelW={panelW} iconMat={cubeIconMat} />
      {/* Bouton flèche (mesure indirecte) */}
      <WhiteIconBtn y={arrowBtnY} z={frontZ} panelW={panelW} iconMat={arrowIconMat} />
      {/* Bouton C/OFF */}
      <WhiteIconBtn y={cBtnY} z={frontZ} panelW={panelW} iconMat={cOffIconMat} />

      {/* Dragonne — petit anneau caoutchouc sur le côté droit en bas */}
      <mesh position={[W / 2 + 0.18, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.05, 8, 16]} />
        <primitive object={gripMat} attach="material" />
      </mesh>
    </group>
  );
}

function WhiteIconBtn({ y, z, panelW, iconMat }: { y: number; z: number; panelW: number; iconMat: THREE.Material }) {
  return (
    <group position={[0, y, z]}>
      <mesh position={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[panelW - 0.6, 0.7, 0.15]} />
        <primitive object={whiteBtnMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, -0.23]}>
        <planeGeometry args={[0.6, 0.6]} />
        <primitive object={iconMat} attach="material" />
      </mesh>
    </group>
  );
}
