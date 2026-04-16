/**
 * Scène principale R3F — remplace lego-room.html + js/scene.js.
 */
import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Color, PMREMGenerator, Scene, AmbientLight, DirectionalLight, Mesh, PlaneGeometry, MeshStandardMaterial } from 'three';
import { CameraController } from './CameraController';
import { cameraState }      from './cameraState';
import { Minimap }          from './Minimap';
import { SidePanel, type FurnitureState, type LayerState } from './SidePanel';
import { Walls }     from './structure/Walls';
import { Floor }     from './structure/Floor';
import { Neighbors } from './structure/Neighbors';
import { Doors }     from './structure/Doors';
import { Kitchen }   from './structure/Kitchen';
import { Bathroom }  from './structure/Bathroom';
import { Furniture }   from './Furniture';
import { Furnishings } from './Furnishings';
import { Decor }       from './Decor';
import { Mirrors }     from './Mirrors';
import { GlbItems }   from './GlbItems';
import { Walker }     from './Walker';
import { Backpacks }  from './Backpacks';
import { Garden }      from './Garden';
import { DronaBoxes }  from './DronaBoxes';
import { AltappenRug } from './AltappenRug';
import { XRayLayer }   from './XRayLayer';
import { HoverRaycaster, HoverOverlay } from './HoverMenu';
import { DevToolsCollector }            from './DevToolsCollector';
import { Inventory }                    from './Inventory';

// @ts-ignore — JS file with no type declarations
import { ROOM_W, ROOM_D } from '@config';

/**
 * Déplace tous les objets du sous-arbre sur le layer N (retire du layer 0).
 * La caméra principale voit tous les layers ; la caméra miroir est limitée
 * au layer 0 → tout ce qui est dans LayerGroup disparaît des reflets.
 * useLayoutEffect sans deps = ré-exécuté après chaque render React, ce qui
 * couvre les GLBs chargés asynchronement (Suspense déclenche un re-render).
 */
function LayerGroup({ layer, children }: { layer: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useLayoutEffect(() => {
    ref.current.traverse(obj => obj.layers.set(layer));
  });
  return <group ref={ref}>{children}</group>;
}

export function Studio() {
  const [furniture, setFurniture] = useState<FurnitureState>({
    eastDoor: false, corrDoors: false,
    freezer: false, fridge: false, cabinet: false, wcLid: false,
  });
  const [showInventory, setShowInventory] = useState(false);
  const [layers, setLayers] = useState<LayerState>({
    structure: true, equipment: true, furniture: true,
    glb: true, neighbors: false, xray: false,
  });

  const onToggleFurniture = useCallback((key: keyof FurnitureState) => {
    setFurniture(s => ({ ...s, [key]: !s[key] }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key } }));
    cameraState.invalidate?.();
  }, []);

  const onToggleLayer = useCallback((key: keyof LayerState) => {
    setLayers(s => ({ ...s, [key]: !s[key] }));
    cameraState.invalidate?.();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        frameloop="demand"
        camera={{
          fov:  50,
          near: 1,
          far:  5000,
          position: [ROOM_W / 2, 1000, -150],
        }}
        shadows={{ type: PCFSoftShadowMap }}
        gl={{
          antialias:    true,
          alpha:        false,
          toneMapping:  ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        onCreated={({ scene, gl, camera }) => {
          scene.background = new Color(0x2a2a3e);
          scene.fog = new FogExp2(0x2a2a3e, 0.0006);
          gl.shadowMap.enabled = true;
          // La caméra principale doit voir tous les layers (défaut Three.js = layer 0 seulement).
          // La caméra miroir garde layers.mask=1 pour n'afficher que la structure.
          camera.layers.enableAll();

          // Environment map PMREM — fidèle à js/scene.js, synchrone avant le premier frame
          const pmrem = new PMREMGenerator(gl);
          const envScene = new Scene();
          envScene.background = new Color(0x889ab5);
          envScene.add(new AmbientLight(0xffffff, 1));
          const envDir = new DirectionalLight(0xfff8e8, 2);
          envDir.position.set(10, 10, 5);
          envScene.add(envDir);
          const envFloor = new Mesh(
            new PlaneGeometry(1000, 1000),
            new MeshStandardMaterial({ color: 0xc4a060 }),
          );
          envFloor.rotation.x = -Math.PI / 2;
          envFloor.position.y = -10;
          envScene.add(envFloor);
          const envWall = new Mesh(
            new PlaneGeometry(1000, 300),
            new MeshStandardMaterial({ color: 0xccccbb }),
          );
          envWall.position.set(0, 100, -100);
          envScene.add(envWall);
          scene.environment = pmrem.fromScene(envScene, 0.04).texture;
          pmrem.dispose();
        }}
      >
        <ambientLight color={0x8899bb} intensity={0.6} />
        <directionalLight
          color={0xfff5e0}
          position={[500, 700, 400]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={1}
          shadow-camera-far={3000}
          shadow-camera-left={-600}
          shadow-camera-right={600}
          shadow-camera-top={600}
          shadow-camera-bottom={-600}
          shadow-bias={-0.003}
          shadow-normalBias={0.4}
        />
        <directionalLight color={0xaabbff} position={[-200, 300, -100]} intensity={0.4} />

        <CameraController />
        <HoverRaycaster />
        <DevToolsCollector />
        {layers.xray && <XRayLayer />}

        {/* Layer 0 : structure + miroirs — seul ce layer est rendu dans les reflets */}
        <group visible={layers.structure}>
          <Walls />
          <Floor />
          <Doors />
        </group>
        <group visible={layers.furniture}>
          <Mirrors />
        </group>

        {/* Layer 1 : tout le reste — exclu des reflets, visible à la caméra principale */}
        <LayerGroup layer={1}>
          <group visible={layers.equipment}>
            <Kitchen />
            <Bathroom />
          </group>
          <group visible={layers.furniture}>
            <Furniture />
            <Furnishings />
            <Decor />
            <Backpacks />
            <DronaBoxes />
            <AltappenRug />
          </group>
          <group visible={layers.glb}>
            <GlbItems />
            <Garden />
            <Walker />
          </group>
          <group visible={layers.neighbors}>
            <Neighbors />
          </group>
        </LayerGroup>
      </Canvas>

      {/* HTML overlays */}
      <SidePanel
        furniture={furniture} onToggleFurniture={onToggleFurniture}
        layers={layers} onToggleLayer={onToggleLayer}
        onOpenInventory={() => setShowInventory(true)}
      />
      {showInventory && <Inventory onClose={() => setShowInventory(false)} />}
      <Minimap />
      <HoverOverlay />
    </div>
  );
}
