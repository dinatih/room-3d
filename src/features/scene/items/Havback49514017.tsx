import type { SceneModelProps } from '@shared/types';
import { FaucetWater } from './FaucetWater';
import { createStaticGlbItem } from './createStaticGlbItem';

/**
 * HAVBÄCK / ORRSJÖN meuble avec tiroirs/vasque/mitigeur, blanc, 62x49x69 cm
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/havbaeck-orrsjoen-meuble-avec-tiroirs-vasque-mitigeur-blanc-s49514017/
 */
export const HAVBACK_D = 49;

const HavbackModel = createStaticGlbItem('/items/havback49514017/Havback49514017.glb');

export function Havback49514017(props: SceneModelProps & { isPreview?: boolean }) {
  return <>
    <HavbackModel {...props} />
    <FaucetWater objectId="vasque-sdb" slotIds={['wash-hands', 'brush-teeth']} position={[0, 76, -7]} basinY={58} isPreview={props.isPreview} />
  </>;
}
