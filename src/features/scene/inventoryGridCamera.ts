let inventoryGridTarget: [number, number, number] | null = null;

export function setInventoryGridCameraTarget(target: [number, number, number] | null): void {
  inventoryGridTarget = target;
  window.dispatchEvent(new Event('inventory-grid-camera-target'));
}

export function getInventoryGridCameraTarget(): [number, number, number] | null {
  return inventoryGridTarget;
}
