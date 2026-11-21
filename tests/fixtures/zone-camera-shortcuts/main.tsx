import '../../../src/dracoSetup';
import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { SpatialZoneCameraControls } from '../../../src/features/inventory/SpatialZonePreview';
import { PreviewCameraKeyboardController } from '../../../src/features/inventory/PreviewCameraKeyboardController';
import { useSceneStore } from '../../../src/features/scene/store/useSceneStore';

useSceneStore.getState().setCameraProjection('persp');
useSceneStore.getState().setOrbitMouseMode('rotate');

function Fixture() {
  const [performanceVisible, setPerformanceVisible] = useState(true);
  const togglePerformance = useCallback(() => setPerformanceVisible(value => !value), []);
  const resetView = useCallback(() => {
    document.dispatchEvent(new CustomEvent('camera-view', { detail: { key: 'iso-se', projection: 'persp' } }));
  }, []);
  return <>
    <input id="search" aria-label="Recherche" />
    <output id="performance">{String(performanceVisible)}</output>
    <Canvas onCreated={({ get }) => Object.assign(window, { cameraTestState: get })}>
      <SpatialZoneCameraControls centerX={100} centerY={50} centerZ={200} camDistance={500} zoneSize={400} />
      <PreviewCameraKeyboardController onResetView={resetView} onTogglePerformance={togglePerformance} />
    </Canvas>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
