import './dracoSetup';
import { lazy, Suspense, useLayoutEffect, useState } from 'react';
import { parseUrlInventory, updateUrlInventory } from './features/inventory/inventoryUrlParams';

const Inventory = lazy(() => import('./features/inventory/Inventory').then(module => ({ default: module.Inventory })));
const Studio = lazy(() => import('./features/scene/Studio').then(module => ({ default: module.Studio })));

/** Inventory links do not allocate the apartment's models and WebGL context. */
export function SceneApp() {
  const [initialInventory] = useState(parseUrlInventory);
  const [inventoryOpen, setInventoryOpen] = useState(initialInventory.open);

  useLayoutEffect(() => {
    if (!inventoryOpen) return;
    const loading = document.getElementById('loading');
    loading?.classList.add('d-none');
    return () => loading?.classList.remove('d-none');
  }, [inventoryOpen]);

  return (
    <Suspense fallback={inventoryOpen ? (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark text-light">
        <div className="spinner-border" role="status"><span className="visually-hidden">Chargement de l’inventaire…</span></div>
      </div>
    ) : null}>
      {inventoryOpen ? (
        <Inventory visible initialCategory={initialInventory.category} onClose={() => {
          updateUrlInventory(false);
          setInventoryOpen(false);
        }} />
      ) : <Studio />}
    </Suspense>
  );
}
