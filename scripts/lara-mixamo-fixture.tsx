// Exercise the actual character component without loading the whole apartment.
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { CharacterGroup } from '../src/features/scene/character/CharacterGroup';
import { cameraState } from '../src/features/scene/cameraState';
import { useAnimPreviewStore } from '../src/features/inventory/useAnimPreviewStore';

cameraState.mode = 'orbit';
useAnimPreviewStore.getState().pause();
const params = new URLSearchParams(location.search);
const shoulders = params.get('view') === 'shoulders';
const animation = params.get('anim') ?? 'overhead-squat';

createRoot(document.getElementById('root')!).render(
  <Canvas orthographic={shoulders} camera={{ position: shoulders ? [0, 140, 230] : [0, 110, 500], zoom: shoulders ? 6 : 1, fov: 40, near: 1, far: 2000 }}
    onCreated={({scene, camera}) => {
      (window as any).threeScene = scene;
      camera.layers.enableAll();
      camera.layers.disable(16);
      camera.lookAt(0, shoulders ? 140 : 90, 0);
    }}>
    <color attach="background" args={[shoulders ? '#d3d3d3' : '#17212b']} />
    <hemisphereLight args={['#ffffff', '#788698', 2]} />
    <directionalLight position={[100, 300, 300]} intensity={3} />
    <Suspense fallback={null}>
      <CharacterGroup isPreview previewCharacterId="native" previewPosition={[shoulders ? -65 : -100, 0, 0]} characterAnim={animation} />
      <CharacterGroup isPreview previewCharacterId="lara_mixamo" previewPosition={[shoulders ? 65 : 100, 0, 0]} characterAnim={animation} />
    </Suspense>
  </Canvas>
);
