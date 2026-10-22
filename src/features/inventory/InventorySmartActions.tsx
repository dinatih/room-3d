import { useState } from 'react';
import { SMART_OBJECTS } from '@features/scene/ai/smartObjectRegistry';
import { CHARACTERS } from '@features/scene/characterConfig';
import { getActionLabel } from '@features/scene/objectActionRegistry';

export interface SmartActionPreviewRequest {
  objectId: string;
  slotId: string;
  characterId: string;
  runId: number;
  playing: boolean;
}

export function getInventorySmartObjects(itemId: string) {
  return Object.values(SMART_OBJECTS).filter(object => (object.itemId ?? object.id) === itemId);
}

export function InventorySmartActions({ itemId, request, onPreview }: {
  itemId: string;
  request?: SmartActionPreviewRequest;
  onPreview: (request: SmartActionPreviewRequest | undefined) => void;
}) {
  const [agentId, setAgentId] = useState(CHARACTERS[0].id);
  const objects = getInventorySmartObjects(itemId);
  if (!objects.length) return null;
  return (
    <div className="card p-2 mb-3 gap-2">
      <h4 className="small fw-bold mb-0">SmartActions dans la preview 3D</h4>
      <select className="form-select form-select-sm" aria-label="PNJ de la preview" value={agentId} onChange={event => setAgentId(event.target.value)}>
        {CHARACTERS.map(agent => <option key={agent.id} value={agent.id}>{agent.emoji} {agent.name}</option>)}
      </select>
      {objects.flatMap(object => object.slots.map(slot => (
        <button key={`${object.id}:${slot.slotId}`} type="button" className="btn btn-sm btn-outline-primary" disabled={slot.isDuo} title={slot.isDuo ? 'Cette action nécessite deux PNJ' : 'Jouer ou rejouer dans la preview'} onClick={() => {
          onPreview({ objectId: object.id, slotId: slot.slotId, characterId: agentId, runId: (request?.runId ?? 0) + 1, playing: true });
        }}>
          {getActionLabel(`smart-object:::${object.id}:::${slot.slotId}`)}
        </button>
      )))}
      {request && <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onPreview({ ...request, playing: !request.playing })}>{request.playing ? 'Pause' : 'Reprendre'}</button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onPreview(undefined)}>Retirer le PNJ</button>
      </div>}
      <p className="small text-muted mb-0">Objet et PNJ isolés. Cliquez à nouveau sur l’action pour la rejouer.</p>
    </div>
  );
}
