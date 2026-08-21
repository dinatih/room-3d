import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { getActiveFurnitureObstacles } from './furnitureObstacles';

/**
 * Composant de rendu 3D pour le débogage visuel des collisions :
 * 1. Cercles d'évitement / anticipation autour de chaque PNJ (Rayon 35cm sécurité + 70cm anticipation)
 * 2. Zones de contournement des meubles au sol (Rayons de collision + zones de dégagement)
 */
export function CollisionDebugHelper() {
  const showNpcDebug = useSceneStore(s => s.layers.debugNpcCollisions);
  const showFurnitureDebug = useSceneStore(s => s.layers.debugFurnitureCollisions);

  const npcGroupRef = useRef<THREE.Group>(null);

  // Géométrie d'un cercle 2D fin (anneau au sol)
  const innerRingGeo = useMemo(() => new THREE.RingGeometry(34, 36, 32), []);
  const outerRingGeo = useMemo(() => new THREE.RingGeometry(69, 71, 32), []);

  const innerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  }), []);

  const outerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x0077ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    depthTest: false,
  }), []);

  // Matériaux pour les meubles
  const furnRingMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xff3d00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
    depthTest: false,
  }), []);

  const furnFillMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xff9100,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
    depthTest: false,
  }), []);

  // Actualisation temps réel des anneaux sous les PNJ
  useFrame(() => {
    if (!showNpcDebug || !npcGroupRef.current) return;

    const group = npcGroupRef.current;
    const activeIds = Object.keys(cameraState.positions);

    // Supprimer les anciens enfants qui ne sont plus actifs
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i];
      if (!activeIds.includes(child.name)) {
        group.remove(child);
      }
    }

    // Mettre à jour ou ajouter les anneaux de chaque PNJ
    for (const [id, pos] of Object.entries(cameraState.positions)) {
      if (!pos) continue;

      let ringGroup = group.getObjectByName(id) as THREE.Group;
      if (!ringGroup) {
        ringGroup = new THREE.Group();
        ringGroup.name = id;

        // Anneau intérieur (Rayon sécurité 35 cm)
        const innerMesh = new THREE.Mesh(innerRingGeo, innerMat);
        innerMesh.rotation.x = -Math.PI / 2;
        innerMesh.renderOrder = 99990;
        ringGroup.add(innerMesh);

        // Anneau extérieur (Rayon anticipation 70 cm)
        const outerMesh = new THREE.Mesh(outerRingGeo, outerMat);
        outerMesh.rotation.x = -Math.PI / 2;
        outerMesh.renderOrder = 99990;
        ringGroup.add(outerMesh);

        group.add(ringGroup);
      }

      ringGroup.position.set(pos.x, 1.0, pos.z);
    }
  });

  // Obstacles des meubles (calculés dynamiquement en fonction du HoverMenu)
  const furnitureObstacles = useMemo(() => {
    if (!showFurnitureDebug) return [];
    return getActiveFurnitureObstacles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFurnitureDebug, useSceneStore(s => s.furniture)]);

  return (
    <group>
      {/* ── Visualisation Débogage PNJ ── */}
      {showNpcDebug && <group ref={npcGroupRef} />}

      {/* ── Visualisation Débogage Meubles ── */}
      {showFurnitureDebug && (
        <group>
          {furnitureObstacles.map((obs) => {
            const r = obs.radius;
            const clearance = r + 20;
            return (
              <group key={obs.id} position={[obs.x, 0.8, obs.z]}>
                {/* Surface de l'obstacle */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} material={furnFillMat} renderOrder={99980}>
                  <circleGeometry args={[r, 32]} />
                </mesh>
                {/* Périmètre de sécurité immédiate */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} material={furnRingMat} renderOrder={99985}>
                  <ringGeometry args={[r - 1.5, r + 1.5, 32]} />
                </mesh>
                {/* Zone de contournement / anticipation */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} material={outerMat} renderOrder={99985}>
                  <ringGeometry args={[clearance - 1.5, clearance + 1.5, 32]} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}
