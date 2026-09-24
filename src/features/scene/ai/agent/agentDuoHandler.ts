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

    if (nextTimer > 20.0) {
      appLog(characterId, `⏳ Duo timeout : pas de partenaire, reprise du parcours`);
      onSessionEnded();
      return true;
    }

    const loc = duoSessionManager.getCurrentLocation(characterId);
    const session = duoSessionManager.getSessionFor(characterId);
    const curAnimDef = session?.playlist[session.currentAnimIndex] || session?.playlist[0];
    const isCuddle = curAnimDef?.id === 'sit-cuddle' || loc.slotId === 'sit-cuddle';
    if (isCuddle) {
      state.animation = duoRole === 'roleA'
        ? 'miley-armature-sit-cuddle-hug-m'
        : 'miley-armature-sit-cuddle-hug-f';
    } else {
      state.animation = duoRole === 'roleA'
        ? 'anim-female-standing-pose'
        : 'anim-female-standing-pose-1';
    }

    // Rôle A → ancre sur anchorPos ; Rôle B → ancre sur posB (offsetB transformé)
    const waitPos = duoRole === 'roleB'
      ? duoSessionManager.getWaitPosB(characterId)
      : loc.anchorPos;

    state.x = waitPos[0];
    state.y = waitPos[1];
    state.z = waitPos[2];
    state.rotY = duoRole === 'roleB'
      ? duoSessionManager.getWaitRotB(characterId)
      : loc.anchorRotY;

    if (!duoInvited) {
      setDuoInvited(true);
      duoSessionManager.inviteNearestNpc(characterId);
    }

    return false; // toujours en attente
  }

  // Ticker l'horloge centrale (par le meneur rôle A)
  duoSessionManager.tickSession(characterId, dt);

  const animState = duoSessionManager.getCurrentAnimState(characterId);
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
