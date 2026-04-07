/**
 * Scène principale R3F — remplace lego-room.html + js/scene.js.
 */
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Color } from 'three';
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
import { LaptopDesk } from './LaptopDesk';
import { Backpacks }  from './Backpacks';
import { Garden }      from './Garden';
import { DronaBoxes }  from './DronaBoxes';
import { AltappenRug } from './AltappenRug';
import { XRayLayer }   from './XRayLayer';
import { HoverRaycaster, HoverOverlay } from './HoverMenu';
import { DevToolsCollector }            from './DevToolsCollector';

// @ts-ignore — JS file with no type declarations
import { ROOM_W, ROOM_D } from '@config';

export function Studio() {
  const [furniture, setFurniture] = useState<FurnitureState>({
    eastDoor: false, corrDoors: false,
    freezer: false, fridge: false, cabinet: false, wcLid: false,
  });
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
          position: [ROOM_W / 2 + 100, 200, ROOM_D / 2 + 300],
        }}
        shadows={{ type: PCFSoftShadowMap }}
        gl={{
          antialias:    true,
          toneMapping:  ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        onCreated={({ scene, gl }) => {
          scene.background = new Color(0x2a2a3e);
          scene.fog = new FogExp2(0x2a2a3e, 0.0006);
          gl.shadowMap.enabled = true;
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[300, 500, 400]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={3000}
          shadow-camera-left={-600}
          shadow-camera-right={600}
          shadow-camera-top={600}
          shadow-camera-bottom={-600}
        />
        <directionalLight position={[-200, 100, -300]} intensity={0.35} />

        <CameraController />
        <HoverRaycaster />
        <DevToolsCollector />
        {layers.xray && <XRayLayer />}

        {/* Structure */}
        <group visible={layers.structure}>
          <Walls />
          <Floor />
          <Doors />
        </group>

        {/* Équipements */}
        <group visible={layers.equipment}>
          <Kitchen />
          <Bathroom />
        </group>

        {/* Mobilier */}
        <group visible={layers.furniture}>
          <Furniture />
          <Furnishings />
          <Decor />
          <Mirrors />
          <LaptopDesk />
          <Backpacks />
          <DronaBoxes />
          <AltappenRug />
        </group>

        {/* GLB */}
        <group visible={layers.glb}>
          <GlbItems />
          <Garden />
        </group>

        {/* Voisins */}
        <group visible={layers.neighbors}>
          <Neighbors />
        </group>
      </Canvas>

      {/* HTML overlays */}
      <SidePanel
        furniture={furniture} onToggleFurniture={onToggleFurniture}
        layers={layers} onToggleLayer={onToggleLayer}
      />
      <Minimap />
      <HoverOverlay />
    </div>
  );
}
