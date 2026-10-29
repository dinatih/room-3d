import { useState } from 'react';
import { SMART_OBJECTS } from '@features/scene/ai/smartObjectRegistry';
import { CHARACTERS } from '@features/scene/characterConfig';
import { getActionLabel } from '@features/scene/objectActionRegistry';
import { INVENTORY_SMART_OBJECT_IDS } from '@features/scene/objectActions';

export interface SmartActionPreviewRequest {
  objectId: string;
  slotId: string;
  characterId: string;
  runId: number;
  playing: boolean;
}

export function getInventorySmartObjects(itemId: string) {
  return Object.values(SMART_OBJECTS).filter(object => (object.itemId ?? object.id) === itemId || INVENTORY_SMART_OBJECT_IDS[itemId]?.includes(object.id));
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
    <div className="d-flex flex-wrap align-items-center gap-1 px-2 py-1 border-bottom" role="group" aria-label="SmartActions">
      <select className="form-select form-select-sm w-auto" aria-label="PNJ de la preview" value={agentId} onChange={event => {
        setAgentId(event.target.value);
        if (request) onPreview({ ...request, characterId: event.target.value, runId: request.runId + 1 });
      }}>
        {CHARACTERS.map(agent => <option key={agent.id} value={agent.id}>{agent.emoji} {agent.name}</option>)}
      </select>
      <select className="form-select form-select-sm w-auto mw-100 flex-grow-1" aria-label="Smart action de la preview" value={request ? `${request.objectId}:${request.slotId}` : ''} onChange={event => {
        const [objectId, slotId] = event.target.value.split(':');
        onPreview({ objectId, slotId, characterId: agentId, runId: (request?.runId ?? 0) + 1, playing: true });
      }}>
        <option value="" disabled>⚡ Smart action…</option>
        {objects.flatMap(object => object.slots.map(slot => (
          <option key={`${object.id}:${slot.slotId}`} value={`${object.id}:${slot.slotId}`} disabled={slot.isDuo}>
            {getActionLabel(`smart-object:::${object.id}:::${slot.slotId}`)}{slot.isDuo ? ' (2 PNJ)' : ''}
          </option>
      )))}
      </select>
      {request && <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" title="Rejouer" aria-label="Rejouer" onClick={() => onPreview({ ...request, runId: request.runId + 1, playing: true })}>↻</button>
        <button type="button" className="btn btn-outline-secondary" title={request.playing ? 'Pause' : 'Reprendre'} aria-label={request.playing ? 'Pause' : 'Reprendre'} onClick={() => onPreview({ ...request, playing: !request.playing })}>{request.playing ? '⏸' : '▶'}</button>
        <button type="button" className="btn btn-outline-secondary" title="Retirer le PNJ" aria-label="Retirer le PNJ" onClick={() => onPreview(undefined)}>×</button>
      </div>}
    </div>
  );
}
