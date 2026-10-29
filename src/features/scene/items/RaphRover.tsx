import type { SceneItemProps } from '@shared/types';
import { WheeledRobot } from './WheeledRobot';
import { RAPH_DRIVE_SPEED, createRaphMotion } from './raphMotion';

export function RaphRover(props: Partial<Omit<SceneItemProps, 'item'>>) {
  return <WheeledRobot {...props} modelId="raph-rover" driveSpeed={RAPH_DRIVE_SPEED} createMotion={createRaphMotion} />;
}
