import '../../../src/dracoSetup';
import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import { _roots } from '@react-three/fiber';
import { InventoryPreview } from '../../../src/features/inventory/InventoryPreview';
import { INVENTORY } from '../../../src/features/inventory/inventoryData';
import { useAnimPreviewStore } from '../../../src/features/inventory/useAnimPreviewStore';
import { useSceneStore } from '../../../src/features/scene/store/useSceneStore';
import '../../../scss/app.scss';
import '../../../src/index.css';

// The BNF label requests an external fallback font; tests stay entirely local.
useSceneStore.getState().setLayers({ bnfMarker: false });
Object.assign(window, { anim: useAnimPreviewStore, store: useSceneStore });
Object.defineProperty(window, 'preview', {
  get: () => [..._roots.values()][0]?.store.getState(),
});

createRoot(document.getElementById('root')!).render(
  <Suspense fallback="Loading">
    <InventoryPreview
      item={INVENTORY.find(item => item.id === 'native')!}
      width={1000}
      height={600}
      defaultShowMiniPerf
    />
  </Suspense>,
);
