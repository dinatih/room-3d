/**
 * Scène principale R3F — remplace lego-room.html + js/scene.js.
 *
 * Correspondances avec la scène vanilla Three.js :
 *   - background / fog       → scene.js
 *   - camera fov/near/far    → scene.js
 *   - OrbitControls target   → scene.js (150, 83, 200)
 *   - lumières               → scene.js
 *   - toneMapping / shadows  → scene.js
 */
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping, PCFSoftShadowMap, FogExp2, Color } from 'three';
import { Walls }     from './structure/Walls';
import { Floor }     from './structure/Floor';
import { Kitchen }   from './structure/Kitchen';
import { Bathroom }  from './structure/Bathroom';
import { Furniture }   from './Furniture';
import { Furnishings } from './Furnishings';

// @ts-ignore — JS file with no type declarations
import { ROOM_W, WALL_H, ROOM_D } from '@config';

export function Studio() {
  return (
    <Canvas
      style={{ width: '100vw', height: '100vh' }}
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
      {/* Lumières — identiques à scene.js */}
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

      <OrbitControls
        target={[ROOM_W / 2, WALL_H / 3, ROOM_D / 2]}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI}
      />

      <Walls />
      <Floor />
      <Kitchen />
      <Bathroom />
      <Furniture />
      <Furnishings />
    </Canvas>
  );
}
