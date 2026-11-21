import '../../../src/dracoSetup';
import { Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { CharacterGroup } from '../../../src/features/scene/character';
import { NavigationEnabledContext } from '../../../src/features/scene/ai/navigation/NavigationContext';
import { cameraState } from '../../../src/features/scene/cameraState';
import { useSceneStore } from '../../../src/features/scene/store/useSceneStore';

useSceneStore.getState().setLaraCount(1);
cameraState.positions[useSceneStore.getState().activeCharacterId] = { x: 0, y: 0, z: 0, yaw: 0, anim: 'idle' };

function Fixture() {
  const [paused, setPaused] = useState(true);
  Object.assign(window, { setCharacterPaused: setPaused });
  return <Canvas camera={{ position: [250, 100, 250] }} onCreated={({ scene, camera }) => {
    camera.layers.enableAll();
    camera.lookAt(0, 90, 0);
    Object.assign(window, { characterScene: scene });
  }}>
    <ambientLight intensity={1} onUpdate={light => light.layers.enableAll()} />
    <NavigationEnabledContext.Provider value={false}>
      <Suspense fallback={null}><CharacterGroup isPaused={paused} /></Suspense>
    </NavigationEnabledContext.Provider>
  </Canvas>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
