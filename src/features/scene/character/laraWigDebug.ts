import { WIGS_ITEMS } from '@features/inventory/inventoryData';
import { CHARACTERS } from '../characterConfig';

const laraIds = CHARACTERS.filter(character => character.isLara !== false && !character.isRobot)
  .map(character => character.id);
const wigIds = [...new Map(WIGS_ITEMS.filter(wig => wig.glbPath).map(wig => [wig.glbPath, wig.id])).values()];

export function getDebugLaraWig(id: string, offset: number) {
  const index = laraIds.indexOf(id);
  return index >= 0 ? wigIds[(index + offset) % wigIds.length] : undefined;
}

export function nextDebugWigOffset(offset: number) {
  return (offset + 1) % wigIds.length;
}
