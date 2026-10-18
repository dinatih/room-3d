// Exercise the actual character component without loading the whole apartment.
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { CharacterGroup } from '../src/features/scene/character/CharacterGroup';
import { cameraState } from '../src/features/scene/cameraState';

cameraState.mode = 'orbit';

createRoot(document.getElementById('root')!).render(
  <Canvas camera={{ position: [0, 110, 500], fov: 40, near: 1, far: 2000 }}
    onCreated={({scene, camera}) => {
      (window as any).threeScene = scene;
      camera.layers.enableAll();
      camera.layers.disable(16);
      camera.lookAt(0, 90, 0);
    }}>
    <color attach="background" args={['#17212b']} />
    <hemisphereLight args={['#ffffff', '#788698', 2]} />
    <directionalLight position={[100, 300, 300]} intensity={3} />
    <Suspense fallback={null}>
      <CharacterGroup isPreview previewCharacterId="native" previewPosition={[-100, 0, 0]} characterAnim="overhead-squat" />
      <CharacterGroup isPreview previewCharacterId="lara_mixamo" previewPosition={[100, 0, 0]} characterAnim="overhead-squat" />
    </Suspense>
  </Canvas>
);
