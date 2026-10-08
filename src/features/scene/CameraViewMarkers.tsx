import { useEffect, useMemo, useRef, useState } from 'react';
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_SHORTCUT_VIEWS, VIEWS, dispatchView } from './sidepanel/types';
import { useSceneStore } from './store/useSceneStore';

type ShortcutView = typeof CAMERA_SHORTCUT_VIEWS[number];

function CameraViewMarker({ view }: { view: ShortcutView }) {
  const { scene, camera, gl, size } = useThree();
  const aspect = size.width / size.height;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, 'pointer', '', gl.domElement);
  const preset = VIEWS[view.key];
  const quaternion = useMemo(() => {
    // Object3D.lookAt oriente +Z ; une caméra oriente bien son objectif selon −Z.
    const markerCamera = new THREE.PerspectiveCamera();
    markerCamera.position.set(...preset.pos);
    markerCamera.lookAt(...preset.target);
    return markerCamera.quaternion.clone();
  }, [preset]);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const markerRef = useRef<THREE.Group>(null);
  const _tmpCamPos = useMemo(() => new THREE.Vector3(), []);
  const presetPosVec = useMemo(() => new THREE.Vector3(...preset.pos), [preset.pos]);

  useFrame(() => {
    if (!markerRef.current) return;
    const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera;
    let s = 1.0;
    if (isOrtho) {
      const orthoZoom = (camera as THREE.OrthographicCamera).zoom || 1;
      s = Math.max(1.0, Math.min(12.0, 1.25 / orthoZoom));
    } else {
      camera.getWorldPosition(_tmpCamPos);
      const dist = _tmpCamPos.distanceTo(presetPosVec);
      // À 350 cm (proche), échelle standard 1.0. En s'éloignant, l'échelle grandit proportionnellement.
      s = Math.max(1.0, Math.min(12.0, dist / 350));
    }
    if (hovered) s *= 1.25;
    markerRef.current.scale.setScalar(s);
  });

  const isUnobstructed = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    // R3F n'intersecte que les objets ayant des handlers : vérifier aussi
    // les murs et les autres meshes pour respecter l'occlusion visuelle.
    raycaster.ray.copy(event.ray);
    raycaster.camera = camera;
    raycaster.layers.mask = camera.layers.mask;
    for (const hit of raycaster.intersectObjects(scene.children, true)) {
      const mesh = hit.object as THREE.Mesh;
      if (!mesh.isMesh) continue;
      let hidden = false;
      for (let parent: THREE.Object3D | null = mesh; parent; parent = parent.parent) {
        if (!parent.visible) { hidden = true; break; }
      }
      if (hidden) continue;

      // Si le premier objet physique rencontré appartient au marqueur lui-même, il n'est pas occlus.
      for (let parent: THREE.Object3D | null = mesh; parent; parent = parent.parent) {
        if (parent === event.eventObject) return true;
      }

      const material = Array.isArray(mesh.material)
        ? mesh.material[hit.face!.materialIndex]
        : mesh.material;
      if (!material.visible || material.opacity === 0) continue;
      return false;
    }
    return false;
  };

  const onHover = (event: ThreeEvent<PointerEvent>) => {
    const visible = isUnobstructed(event);
    setHovered(visible);
    if (visible) event.stopPropagation();
  };
  const red = hovered ? '#ea6976' : '#dc3545';

  const pyramidGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const h = 10; // demi-hauteur de la base (20 cm)
    const w = h * aspect; // même ratio largeur/hauteur que le viewport du Canvas
    const d = 26; // profondeur vers −Z (26 cm)
    const pApex = [0, 0, 0];
    const pTR = [w, h, -d];
    const pTL = [-w, h, -d];
    const pBL = [-w, -h, -d];
    const pBR = [w, -h, -d];

    const vertices = new Float32Array([
      // Face Haut
      ...pApex, ...pTR, ...pTL,
      // Face Gauche
      ...pApex, ...pTL, ...pBL,
      // Face Bas
      ...pApex, ...pBL, ...pBR,
      // Face Droite
      ...pApex, ...pBR, ...pTR,
      // Base (face avant tournée vers la cible)
      ...pTR, ...pBR, ...pBL,
      ...pTR, ...pBL, ...pTL,
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [aspect]);

  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(pyramidGeo), [pyramidGeo]);
  useEffect(() => () => {
    pyramidGeo.dispose();
    edgesGeo.dispose();
  }, [pyramidGeo, edgesGeo]);

  return (
    <group
      ref={markerRef}
      name={`camera-view-marker-${view.key}`}
      userData={{ isCameraViewMarker: true, cameraView: view.key }}
      position={preset.pos}
      quaternion={quaternion}
      onPointerOver={onHover}
      onPointerMove={onHover}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        if (!isUnobstructed(event)) return;
        event.stopPropagation();
        // Le menu de survol écoute aussi les clics DOM, indépendamment de R3F.
        event.nativeEvent.stopImmediatePropagation();
        // Même tolérance de clic que R3F (2 px), pour ne pas activer après un drag.
        if (event.button !== 0 || event.delta > 2) return;
        dispatchView(view.key);
      }}
    >
      {/* Hitbox invisible élargie pour maximiser le confort de clic et de survol */}
      <mesh position={[0, 0, -13]}>
        <sphereGeometry args={[22, 12, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {/* Pyramide de visée (point de vue s'évasant vers −Z) */}
      <mesh geometry={pyramidGeo}>
        <meshBasicMaterial
          color={red}
          toneMapped={false}
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color={hovered ? '#ffffff' : '#ff99a4'} toneMapped={false} />
      </lineSegments>
      {/* Point focal au sommet de la pyramide */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.5, 12, 12]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : red} toneMapped={false} />
      </mesh>
      {hovered && (
        <Html position={[0, 16, -13]} center wrapperClass="pe-none" style={{ pointerEvents: 'none' }}>
          <div role="tooltip" className="d-flex flex-column align-items-center gap-1 text-nowrap">
            <span className="badge text-bg-danger">{view.label} ({view.shortcut})</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export function CameraViewMarkers() {
  const enabled = useSceneStore(s => s.layers.cameraViewMarkers);
  const activeView = useSceneStore(s => s.activeCameraView);
  const photoOpen = useSceneStore(s => s.isPhotoModeOpen);
  if (!enabled || photoOpen) return null;

  return (
    <group name="camera-view-markers">
      {CAMERA_SHORTCUT_VIEWS.map(view => view.key !== activeView && (
        <CameraViewMarker key={view.key} view={view} />
      ))}
    </group>
  );
}
