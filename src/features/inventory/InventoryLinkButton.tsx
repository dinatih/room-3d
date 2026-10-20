import { useState } from 'react';
import { inventoryUrl, type InventoryUrlState } from './inventoryUrlParams';

export function InventoryLinkButton({ state }: { state: InventoryUrlState }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(inventoryUrl(state));
      setMessage('Lien copié');
    } catch {
      setMessage('Impossible de copier le lien');
    }
  }
  return <span className="d-inline-flex align-items-center gap-2">
    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copy}>Copier le lien</button>
    <span className="small" role="status">{message}</span>
  </span>;
}
