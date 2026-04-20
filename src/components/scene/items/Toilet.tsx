/**
 * WC (toilettes) — géométrie procédurale fidèle à js/structure/wc.js.
 * Rendu en coordonnées locales : X centré, Z=0 = face arrière réservoir (mur), Y=0 = sol.
 * Utilisé dans Furniture.tsx (scène) et dans l'inventaire (SCENE_REGISTRY).
 */
import { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const WC_W     = 40;
const R        = WC_W / 2;        // 20
const bowlOval = 1.15;
const bowlH    = 40;
const tankD    = 18;
const tankH    = 38;
const tankW    = WC_W - 2;        // 38
const tankLidH = 3.5;
const bowlCZ   = tankD + R * bowlOval; // 41

const wcMat       = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.12, metalness: 0.04 });
const wcInnerMat  = new THREE.MeshStandardMaterial({ color: 0xdfdfdf, roughness: 0.07, side: THREE.DoubleSide });
const seatMat     = new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.18 });
const lidMat      = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.10, metalness: 0.02 });
const waterMat    = new THREE.MeshStandardMaterial({ color: 0x7ab8d4, roughness: 0.01, transparent: true, opacity: 0.55 });
const btnBaseMat  = new THREE.MeshStandardMaterial({ color: 0xbababa, roughness: 0.18, metalness: 0.55 });
const btnBigMat   = new THREE.MeshStandardMaterial({ color: 0xe2e2e2, roughness: 0.10, metalness: 0.50 });
const btnSmallMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.13, metalness: 0.48 });
const hingeMat    = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.25, metalness: 0.3 });
const tankFaceMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.07, metalness: 0.04 });

export function Toilet({ actionState, onSize }: SceneItemProps) {
  const lidRef = useRef<THREE.Group>(null!);
  const isOpen = actionState['wc-lid-toggle'] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(WC_W + 2, bowlH + tankH + tankLidH + 2, tankD + 2 * R * bowlOval));
  }, []);

  useEffect(() => {
    if (lidRef.current) {
      lidRef.current.rotation.x = isOpen ? -Math.PI * 0.62 : 0;
      invalidate();
    }
  }, [isOpen, invalidate]);

  const { outerGeo, innerGeo, seatGeo } = useMemo(() => {
    const outerPts = [
      new THREE.Vector2(0.1,       0),
      new THREE.Vector2(R * 0.88,  0),
      new THREE.Vector2(R * 0.88,  2.5),
      new THREE.Vector2(R * 0.50,  6.0),
      new THREE.Vector2(R * 0.39,  10.0),
      new THREE.Vector2(R * 0.37,  19.0),
      new THREE.Vector2(R * 0.55,  27.0),
      new THREE.Vector2(R * 0.88,  33.5),
      new THREE.Vector2(R + 1.0,   37.5),
      new THREE.Vector2(R,         bowlH),
      new THREE.Vector2(R * 0.68,  bowlH),
    ];
    const innerPts = [
      new THREE.Vector2(R * 0.68,  bowlH),
      new THREE.Vector2(R * 0.62,  37.0),
      new THREE.Vector2(R * 0.50,  30.0),
      new THREE.Vector2(R * 0.30,  22.0),
      new THREE.Vector2(R * 0.16,  16.0),
      new THREE.Vector2(0.1,       13.5),
    ];
    const seatRX    = R * 0.90;
    const seatRZ    = seatRX * bowlOval;
    const seatOuter = new THREE.EllipseCurve(0, 0, seatRX,        seatRZ,        0, Math.PI * 2);
    const seatInner = new THREE.EllipseCurve(0, 0, seatRX * 0.70, seatRZ * 0.70, 0, Math.PI * 2);
    const seatShape = new THREE.Shape(seatOuter.getPoints(64));
    seatShape.holes.push(new THREE.Path(seatInner.getPoints(64)));
    const sGeo = new THREE.ExtrudeGeometry(seatShape, {
      depth: 2.8, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.5, bevelSegments: 5,
    });
    sGeo.rotateX(Math.PI / 2);
    return {
      outerGeo: new THREE.LatheGeometry(outerPts, 40),
      innerGeo: new THREE.LatheGeometry(innerPts, 40),
      seatGeo:  sGeo,
    };
  }, []);

  const seatRX = R * 0.90;
  const seatRZ = seatRX * bowlOval;
  const lidRX  = seatRX - 0.5;
  const hingeZ = bowlCZ - seatRZ + 1.5;
  const btnY   = bowlH + tankH + tankLidH + 0.8;
  const btnCZ  = tankD / 2;

  return (
    <group userData={{ hoverAction: { label: 'WC', actionId: 'wcLid' } }}>
      {/* Coque extérieure */}
      <mesh geometry={outerGeo} material={wcMat} castShadow receiveShadow
        position={[0, 0, bowlCZ]} scale={[1, 1, bowlOval]} />
      {/* Cavité intérieure */}
      <mesh geometry={innerGeo} material={wcInnerMat}
        position={[0, 0, bowlCZ]} scale={[1, 1, bowlOval]} />
      {/* Fond cuvette */}
      <mesh position={[0, 13.5, bowlCZ]} rotation={[-Math.PI / 2, 0, 0]}
        material={wcInnerMat} scale={[1, bowlOval, 1]}>
        <circleGeometry args={[R * 0.16, 36]} />
      </mesh>
      {/* Eau */}
      <mesh position={[0, 13.6, bowlCZ]} rotation={[-Math.PI / 2, 0, 0]}
        material={waterMat} scale={[1, bowlOval, 1]}>
        <circleGeometry args={[R * 0.16 * 0.88, 36]} />
      </mesh>

      {/* Siège */}
      <mesh geometry={seatGeo} material={seatMat} castShadow
        position={[0, bowlH + 2.8, bowlCZ]} />

      {/* Abattant (groupe charnière) */}
      <group ref={lidRef} position={[0, bowlH + 3.5, hingeZ]}>
        <mesh position={[0, 1, seatRZ - 0.5]} material={lidMat} castShadow scale={[1, 1, bowlOval]}>
          <cylinderGeometry args={[lidRX, lidRX, 2, 48]} />
        </mesh>
        <mesh position={[0, 1, -0.5]} rotation={[0, 0, Math.PI / 2]} material={hingeMat}>
          <cylinderGeometry args={[2, 2, 3, 12]} />
        </mesh>
      </group>

      {/* Réservoir */}
      <mesh position={[0, bowlH + tankH / 2, tankD / 2]}
        material={wcMat} castShadow receiveShadow>
        <boxGeometry args={[tankW, tankH, tankD]} />
      </mesh>
      <mesh position={[0, bowlH + tankH / 2, tankD + 0.2]}
        material={tankFaceMat}>
        <boxGeometry args={[tankW - 4, tankH - 6, 0.8]} />
      </mesh>
      {/* Couvercle réservoir */}
      <mesh position={[0, bowlH + tankH + tankLidH / 2, tankD / 2]}
        material={wcMat} castShadow>
        <boxGeometry args={[tankW + 1.5, tankLidH, tankD + 1.5]} />
      </mesh>

      {/* Boutons chasse d'eau */}
      <mesh position={[0, btnY - 0.35, btnCZ]} material={btnBaseMat}>
        <cylinderGeometry args={[6, 6, 0.7, 48]} />
      </mesh>
      <mesh position={[0, btnY + 0.9, btnCZ + 0.8]} material={btnBigMat}>
        <cylinderGeometry args={[5.3, 5.3, 1.8, 48, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[0, btnY + 0.7, btnCZ - 0.8]} material={btnSmallMat}>
        <cylinderGeometry args={[4.0, 4.0, 1.4, 48, 1, false, Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh position={[0, btnY + 1.4, btnCZ]} material={btnBaseMat}>
        <boxGeometry args={[11.5, 0.5, 0.7]} />
      </mesh>

      {/* Raccord réservoir → cuvette */}
      <mesh position={[0, bowlH - 2.5, tankD + 3]} material={wcMat}>
        <cylinderGeometry args={[2.5, 3.5, 5, 16]} />
      </mesh>
      {/* Embase au sol */}
      <mesh position={[0, 1.75, 1.5]} material={wcMat}>
        <boxGeometry args={[tankW * 0.75, 3.5, 3]} />
      </mesh>
    </group>
  );
}
