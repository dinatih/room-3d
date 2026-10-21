import { useState } from 'react';
import { SMART_OBJECTS } from '@features/scene/ai/smartObjectRegistry';
import { OccupancyManager } from '@features/scene/ai/occupancyManager';
import { CHARACTERS, isCharacterVisibleInMode } from '@features/scene/characterConfig';
import { cameraState } from '@features/scene/cameraState';
import { getActionLabel } from '@features/scene/objectActionRegistry';
import { useSceneStore } from '@features/scene/store/useSceneStore';

export function getInventorySmartObjects(itemId: string) {
  return Object.values(SMART_OBJECTS).filter(object => (object.itemId ?? object.id) === itemId);
}

export function InventorySmartActions({ itemId, onInvite }: { itemId: string; onInvite: () => void }) {
  const store = useSceneStore();
  const [agentId, setAgentId] = useState('');
  const [error, setError] = useState('');
  const objects = getInventorySmartObjects(itemId);
  if (!objects.length) return null;
  const agents = CHARACTERS.filter(character => cameraState.positions[character.id] && isCharacterVisibleInMode(
    character.id, store.layers.laraCount, store.activeCharacterId,
    store.layers.extraCharacters, store.activeExtraIds, store.activeMainIds,
  ));
  const targetId = agents.find(agent => agent.id === agentId)?.id ?? agents[0]?.id;

  return (
    <div className="card p-2 mb-3 gap-2">
      <h4 className="small fw-bold mb-0">Inviter un agent</h4>
      <select className="form-select form-select-sm" aria-label="Agent à inviter" value={targetId ?? ''} onChange={event => { setAgentId(event.target.value); setError(''); }}>
        {!agents.length && <option value="">Aucun agent présent dans la scène</option>}
        {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.emoji} {agent.name}</option>)}
      </select>
      {objects.flatMap(object => object.slots.map(slot => (
        <button key={`${object.id}:${slot.slotId}`} type="button" className="btn btn-sm btn-outline-primary" disabled={!targetId} onClick={() => {
          if (!targetId) return;
          if (!OccupancyManager.canUseObject(object.id, targetId)) {
            setError('Cet objet est réservé à un autre agent.');
            return;
          }
          if (OccupancyManager.isSlotOccupied(object.id, slot.slotId, targetId)) {
            setError('Cette action est indisponible : place occupée ou capacité de la pièce atteinte.');
            return;
          }
          document.dispatchEvent(new CustomEvent('agent-force-smartobject', { detail: { targetId, objectId: object.id, slotId: slot.slotId } }));
          onInvite();
        }}>
          {getActionLabel(`smart-object:::${object.id}:::${slot.slotId}`)}
        </button>
      )))}
      {error && <p className="small text-danger mb-0" role="alert">{error}</p>}
      <p className="small text-muted mb-0">L’agent exécutera l’action dans l’appartement.</p>
    </div>
  );
}
