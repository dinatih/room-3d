import { duoSessionManager, DuoRole } from '../duoSessionManager';
import { appLog } from '@features/ui/AppConsole';
import { AgentState } from './agentTypes';

export interface DuoUpdateContext {
  characterId: string;
  dt: number;
  state: AgentState;
  duoRole: DuoRole | null;
  duoWaitTimer: number;
  duoInvited: boolean;
  onSessionEnded: () => void;
  setDuoWaitTimer: (t: number) => void;
  setDuoInvited: (invited: boolean) => void;
}

export function handleDuoInteraction(ctx: DuoUpdateContext): boolean {
  const {
    characterId,
    dt,
    state,
    duoRole,
    duoWaitTimer,
    duoInvited,
    onSessionEnded,
    setDuoWaitTimer,
    setDuoInvited
  } = ctx;

  if (duoSessionManager.isCompletedFor(characterId)) {
    onSessionEnded();
    return true; // action terminée
  }

  const isWaiting = duoSessionManager.isWaitingPartner(characterId);
  if (isWaiting) {
    const nextTimer = duoWaitTimer + dt;
    setDuoWaitTimer(nextTimer);
    state.animation = duoRole === 'roleA'
      ? 'animations/poses_idles/anim_female_standing_pose.glb'
      : 'animations/poses_idles/anim_female_standing_pose_1.glb';
    state.rotY = 0;

    if (!duoInvited) {
      setDuoInvited(true);
      duoSessionManager.inviteNearestNpc(characterId);
    }

    if (nextTimer > 20.0) {
      appLog(characterId, `⏳ Duo timeout : pas de partenaire, reprise du parcours`);
      onSessionEnded();
      return true;
    }
    return false; // toujours en attente
  }

  // Ticker l'horloge centrale (par le meneur rôle A)
  duoSessionManager.tickSession(characterId, dt);

  const animState = duoSessionManager.getCurrentAnimState();
  if (animState && duoRole) {
    const clip = duoRole === 'roleA' ? animState.clipA : animState.clipB;
    const pos = duoRole === 'roleA' ? animState.posA : animState.posB;
    const rot = duoRole === 'roleA' ? animState.rotA : animState.rotB;

    state.animation = clip;
    state.x = pos[0];
    state.y = pos[1];
    state.z = pos[2];
    state.rotY = rot;
    return false;
  }

  if (duoSessionManager.isCompletedFor(characterId)) {
    onSessionEnded();
    return true;
  }

  return false;
}
