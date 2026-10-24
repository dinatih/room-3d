import type { SceneItemProps } from '@shared/types';
import { WheeledRobot } from './WheeledRobot';
import { AS2W_DRIVE_SPEED, createAs2wMotion } from './as2wMotion';

export function UnitreeAs2w(props: SceneItemProps) {
  return <WheeledRobot {...props} modelId="unitree-as2w" driveSpeed={AS2W_DRIVE_SPEED} createMotion={createAs2wMotion} />;
}
