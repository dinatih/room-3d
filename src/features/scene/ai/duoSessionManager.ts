import { DUO_ANIMATIONS, DuoAnimationDef, canCharacterPerformDuo } from '../animations/duoAnimations';
import { computeWorldTransform } from '../animations/duoWorldTransform';
import { OccupancyManager, LIMITED_ROOMS } from './occupancyManager';
import { appLog } from '@features/ui/AppConsole';
import { cameraState } from '../cameraState';
import { AUTONOMOUS_NPC_IDS, isCharacterVisibleInMode } from '../characterConfig';
import { getSmartObject } from './smartObjectRegistry';
import { INITIAL_SMART_OBJECT_BY_CHAR } from './autonomousActivities';
import { useSceneStore } from '../store/useSceneStore';
import { findDuoAnchor } from './navigation/duoPlacement';
import { navigationValue, resolveNavigation } from './navigation/navigationScope';
import { getNavigationGraph } from './navigation/service';
import { getAgentProfile } from './navigation/obstacles';
import { isLifeCharacter, socialPartnerScore } from './laraLife';
import { characterLives } from './laraLifeStore';

export type DuoRole = 'roleA' | 'roleB';

export interface DuoLocation {
  objectId: string;                    // ex: 'chair-office', 'duo-zone', 'combat-point', 'hugs-point'
  slotId?: string;                     // ex: 'sit-cuddle', 'roleA', 'combat-session', 'hugs-trio', 'duo-random'
  anchorPos: [number, number, number]; // Position monde de référence
  anchorRotY: number;                  // Orientation monde (radians)
}

export interface DuoSessionParticipant {
  characterId: string;
  role: DuoRole;
  isReady: boolean;
}

export interface DuoCurrentAnimState {
  def: DuoAnimationDef;
  clipA: string;
  clipB: string;
  posA: [number, number, number];
  posB: [number, number, number];
  rotA: number;
  rotB: number;
  duration: number;
}

export interface ActiveDuoSession {
  sessionId: string;
  location: DuoLocation;
  participantA: DuoSessionParticipant | null;
  participantB: DuoSessionParticipant | null;
  playlist: DuoAnimationDef[];
  currentAnimIndex: number;
  currentRepeatIndex: number;
  repeatsPerAnim: number;
  sessionTimer: number;
  isSessionPlaying: boolean;
  isSessionComplete: boolean;
  cachedAnimState?: DuoCurrentAnimState | null;
}

type SessionListener = () => void;

/** Fabrique une nouvelle instance d'ActiveDuoSession initialisée */
function createDuoSession(
  sessionId: string,
  location: DuoLocation,
  playlist: DuoAnimationDef[],
  repeatsPerAnim: number,
  participantA: DuoSessionParticipant | null = null,
  participantB: DuoSessionParticipant | null = null
): ActiveDuoSession {
  return {
    sessionId,
    location,
    participantA,
    participantB,
    playlist,
    currentAnimIndex: 0,
    currentRepeatIndex: 0,
    repeatsPerAnim,
    sessionTimer: playlist[0]?.duration ?? 5.0,
    isSessionPlaying: false,
    isSessionComplete: false,
    cachedAnimState: null,
  };
}

class DuoSessionManager {
  public readonly basePos: [number, number, number] = [-100, 0, -200];
  private readonly defaultLocation: DuoLocation = {
    objectId: 'duo-zone',
    slotId: 'duo-random',
    anchorPos: [-100, 0, -200],
    anchorRotY: 0,
  };

  /** Sessions duo actives indexées par sessionId (ex: objectId). */
  private sessions = new Map<string, ActiveDuoSession>();

  /** Index inversé personnage -> session pour accès instantané O(1) */
  private charToSession = new Map<string, ActiveDuoSession>();

  public repeatsPerAnim = 1;
  private listeners = new Set<SessionListener>();

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitChange() {
    this.listeners.forEach(fn => fn());
  }

  /** Récupère la session à laquelle participe un personnage donné (accès O(1)). */
  public getSessionFor(characterId: string): ActiveDuoSession | null {
    const session = this.charToSession.get(characterId);
    if (session) return session;
    return null;
  }


  /** Récupère la session liée à un objet donné. */
  public getSessionByObjectId(objectId: string): ActiveDuoSession | null {
    return this.sessions.get(objectId) ?? null;
  }

  /** Récupère la session liée à un objet et/ou slot donné. */
  public getSessionForSlot(objectId: string, slotId?: string): ActiveDuoSession | null {
    const direct = this.sessions.get(objectId);
    if (direct && (!slotId || direct.location.slotId === slotId)) return direct;
    return Array.from(this.sessions.values()).find(
      s => s.location.objectId === objectId && (!slotId || s.location.slotId === slotId)
    ) ?? null;
  }

  /** Première session active (fallback de compatibilité sans id). */
  private getFirstActiveSession(): ActiveDuoSession | null {
    return Array.from(this.sessions.values()).find(
      s => s.isSessionPlaying || s.participantA || s.participantB
    ) ?? null;
  }

  /** Marque un participant comme physiquement arrivé sur son spot et prêt. */
  public markReady(characterId: string): void {
    const session = this.getSessionFor(characterId);
    if (!session) return;

    if (session.participantA?.characterId === characterId) session.participantA.isReady = true;
    if (session.participantB?.characterId === characterId) session.participantB.isReady = true;

    // Si les deux sont prêts, démarrer la session avec le timer centralisé
    if (session.participantA?.isReady && session.participantB?.isReady && !session.isSessionPlaying) {
      session.isSessionPlaying = true;
      session.isSessionComplete = false;
      session.cachedAnimState = null;
      session.currentAnimIndex = 0;
      session.currentRepeatIndex = 0;
      const firstAnim = session.playlist[0];
      session.sessionTimer = firstAnim?.duration ?? 5.0;
      if (firstAnim) {
        const pAId = session.participantA.characterId;
        const pBId = session.participantB.characterId;
        appLog(
          `${pAId}+${pBId}`,
          `🎭 Duo démarré entre ${pAId} & ${pBId} : "${firstAnim.label}" (x${session.repeatsPerAnim}, ${session.playlist.length} anims, ${session.sessionTimer.toFixed(1)}s/clip)`,
          {
            category: 'duo',
            action: 'duo_start',
            actors: [pAId, pBId],
            animation: { id: firstAnim.id, mode: 'duo', label: firstAnim.label, actorId: pAId, partnerId: pBId },
            object: { id: session.location.objectId, slotId: session.location.slotId },
          }
        );
      }
      this.emitChange();
    }
  }

  public getParticipantA(characterId?: string): DuoSessionParticipant | null {
    return (characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession())?.participantA ?? null;
  }

  public getParticipantB(characterId?: string): DuoSessionParticipant | null {
    return (characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession())?.participantB ?? null;
  }

  public getElapsedTimeInRepeat(characterId?: string): number {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    if (!session) return 0;
    const duration = session.playlist[session.currentAnimIndex]?.duration ?? 5.0;
    return Math.max(0, duration - session.sessionTimer);
  }

  public isWaitingPartner(characterId: string): boolean {
    const session = this.getSessionFor(characterId);
    if (!session || session.isSessionPlaying || session.isSessionComplete) return false;
    return (session.participantA?.characterId === characterId && !session.participantB?.isReady)
        || (session.participantB?.characterId === characterId && !session.participantA?.isReady);
  }

  public isPlaying(characterId?: string): boolean {
    if (characterId) return Boolean(this.charToSession.get(characterId)?.isSessionPlaying);
    return Array.from(this.sessions.values()).some(s => s.isSessionPlaying);
  }

  public isCompletedFor(characterId: string): boolean {
    const session = this.getSessionFor(characterId);
    if (!session || session.isSessionComplete) return true;
    return session.participantA?.characterId !== characterId && session.participantB?.characterId !== characterId;
  }

  public getCurrentLocation(characterId?: string): DuoLocation {
    return (characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession())?.location ?? this.defaultLocation;
  }

  /** Récupère les données d'animation et de placement calculées pour l'animation courante d'une session. */
  public getCurrentAnimState(characterId?: string): DuoCurrentAnimState | null {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    if (!session || !session.isSessionPlaying || session.currentAnimIndex >= session.playlist.length) return null;
    if (session.cachedAnimState) return session.cachedAnimState;

    const def = session.playlist[session.currentAnimIndex];
    if (!def) return null;

    const { posA, posB, rotA, rotB } = computeWorldTransform(
      session.location.anchorPos,
      session.location.anchorRotY,
      def.offsetB,
      def.rotB
    );

    session.cachedAnimState = {
      def,
      clipA: def.animA,
      clipB: def.animB,
      posA,
      posB,
      rotA,
      rotB,
      duration: def.duration ?? 5.0
    };
    return session.cachedAnimState;
  }

  /** Retourne la position monde de posB lors de la phase d'attente. */
  public getWaitPosB(characterId?: string): [number, number, number] {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    const loc = session?.location ?? this.defaultLocation;
    return computeWorldTransform(loc.anchorPos, loc.anchorRotY, session?.playlist[0]?.offsetB).posB;
  }

  /** Retourne la rotation monde attendue pour posB lors de la phase d'attente. */
  public getWaitRotB(characterId?: string): number {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    const loc = session?.location ?? this.defaultLocation;
    return computeWorldTransform(loc.anchorPos, loc.anchorRotY, undefined, session?.playlist[0]?.rotB).rotB;
  }

  /**
   * Horloge centrale de la session Duo.
   * Seul le rôle A (meneur) décrémente le timer de sa session pour garantir une synchronisation sans doublon.
   */
  public tickSession(characterId: string, dt: number): void {
    const session = this.getSessionFor(characterId);
    if (!session || !session.isSessionPlaying || session.isSessionComplete) return;
    if (session.participantA?.characterId !== characterId) return;

    session.sessionTimer -= dt;
    if (session.sessionTimer <= 0) {
      session.cachedAnimState = null;
      const pAId = session.participantA.characterId;
      const pBId = session.participantB?.characterId;
      const duoTag = pBId ? `${pAId}+${pBId}` : pAId;
      const actors = pBId ? [pAId, pBId] : [pAId];
      if (session.currentRepeatIndex + 1 < session.repeatsPerAnim) {
        session.currentRepeatIndex++;
        const currentAnim = session.playlist[session.currentAnimIndex];
        session.sessionTimer = currentAnim?.duration ?? 5.0;
        appLog(
          duoTag,
          `🔄 Répétition Duo (${session.currentRepeatIndex + 1}/${session.repeatsPerAnim}) : "${currentAnim?.label}"`,
          {
            category: 'duo',
            action: 'duo_repeat',
            actors,
            animation: currentAnim ? { id: currentAnim.id, mode: 'duo', label: currentAnim.label, actorId: pAId, partnerId: pBId } : undefined,
            object: { id: session.location.objectId, slotId: session.location.slotId },
          }
        );
      } else {
        session.currentRepeatIndex = 0;
        session.currentAnimIndex++;
        if (session.currentAnimIndex < session.playlist.length) {
          const nextAnim = session.playlist[session.currentAnimIndex];
          session.sessionTimer = nextAnim?.duration ?? 5.0;
          appLog(
            duoTag,
            `🎬 Nouvelle animation Duo (${session.currentAnimIndex + 1}/${session.playlist.length}) : "${nextAnim?.label}" (x${session.repeatsPerAnim})`,
            {
              category: 'duo',
              action: 'duo_next',
              actors,
              animation: nextAnim ? { id: nextAnim.id, mode: 'duo', label: nextAnim.label, actorId: pAId, partnerId: pBId } : undefined,
              object: { id: session.location.objectId, slotId: session.location.slotId },
            }
          );
        } else {
          session.isSessionPlaying = false;
          session.isSessionComplete = true;
          appLog(duoTag, `✨ Session Duo terminée ! Les 2 PNJs reprennent leur vie autonome.`, {
            category: 'duo',
            action: 'duo_end',
            actors,
            object: { id: session.location.objectId, slotId: session.location.slotId },
          });
        }
      }
      this.emitChange();
    }
  }

  /** Un PNJ quitte sa zone duo (suite à fin normale ou timeout). */
  public leaveDuoZone(characterId: string): void {
    const session = this.getSessionFor(characterId);
    if (!session) return;

    const { objectId: objId, slotId } = session.location;
    const releaseRole = (role: DuoRole, occupantId = characterId) => {
      if (slotId) {
        OccupancyManager.releaseSlot(objId, `${slotId}:${role}`, occupantId);
        OccupancyManager.releaseSlot(objId, slotId, occupantId);
      }
      OccupancyManager.releaseSlot(objId, role, occupantId);
    };

    if (session.participantA?.characterId === characterId) {
      releaseRole('roleA');
      this.charToSession.delete(characterId);
      session.participantA = null;
      // Si le meneur A quitte, libérer également le partenaire B pour éviter une session orpheline
      if (session.participantB) {
        const partnerBId = session.participantB.characterId;
        releaseRole('roleB', partnerBId);
        this.charToSession.delete(partnerBId);
        session.participantB = null;
      }
      this.sessions.delete(session.sessionId);
    } else if (session.participantB?.characterId === characterId) {
      releaseRole('roleB');
      this.charToSession.delete(characterId);
      session.participantB = null;
      // Si le partenaire s'en va alors que la session jouait, libérer également le meneur et clore la session
      if (session.isSessionPlaying && session.participantA) {
        const leaderAId = session.participantA.characterId;
        releaseRole('roleA', leaderAId);
        this.charToSession.delete(leaderAId);
        session.participantA = null;
        this.sessions.delete(session.sessionId);
      }
    }

    if (!session.participantA && !session.participantB) {
      this.sessions.delete(session.sessionId);
    }
    this.emitChange();
  }

  /** Termine et nettoie toutes les sessions duo en cours (utilisé lors du passage en Grille de personnages). */
  public leaveAllSessions(): void {
    const chars = Array.from(this.charToSession.keys());
    for (const c of chars) {
      this.leaveDuoZone(c);
    }
    this.sessions.clear();
    this.charToSession.clear();
    this.emitChange();
  }

  /** Trouve le PNJ autonome le plus proche du spot actif et lui envoie une invitation. */
  public inviteNearestNpc(callerId: string): string | null {
    const session = this.getSessionFor(callerId);
    // Seul le meneur participantA peut inviter, et seulement si aucun partenaire n'est déjà assigné
    if (!session || session.participantA?.characterId !== callerId || session.participantB) return null;

    const [bx, , bz] = session.location.anchorPos;
    let closestId: string | null = null;
    let minDistance = Infinity;
    const store = useSceneStore.getState();

    for (const npcId of AUTONOMOUS_NPC_IDS) {
      if (!session.playlist.every(def => canCharacterPerformDuo(npcId, def))) continue;
      if (!isCharacterVisibleInMode(npcId, store.layers.laraCount ?? 4, store.activeCharacterId, store.layers.extraCharacters ?? false, store.activeExtraIds, store.activeMainIds)) continue;
      if (npcId === callerId) continue;
      if (npcId === store.activeCharacterId) continue;
      if (session.participantA?.characterId === npcId) continue;
      if (this.getSessionFor(npcId) !== null) continue;

      const pos = cameraState.positions[npcId];
      if (pos) {
        const dist = Math.hypot(pos.x - bx, pos.z - bz);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = npcId;
        }
      }
    }

    if (closestId) {
      const locLabel = getSmartObject(session.location.objectId)?.name || session.location.objectId;
      const posB = this.getWaitPosB(callerId);
      const rotB = this.getWaitRotB(callerId);

      session.participantB = { characterId: closestId, role: 'roleB', isReady: false };
      this.charToSession.set(closestId, session);
      OccupancyManager.claimSlot(session.location.objectId, `${session.location.slotId}:roleB`, closestId);

      const firstAnim = session.playlist[0];
      appLog(
        `${callerId}+${closestId}`,
        `📢 ${callerId} invite ${closestId} (${minDistance.toFixed(0)} cm) à rejoindre ${locLabel} !`,
        {
          category: 'duo',
          action: 'duo_invite',
          actors: [callerId, closestId],
          animation: firstAnim ? { id: firstAnim.id, mode: 'duo', label: firstAnim.label, actorId: callerId, partnerId: closestId } : undefined,
          object: { id: session.location.objectId, label: locLabel, slotId: session.location.slotId },
        }
      );
      document.dispatchEvent(new CustomEvent('npc-invite-duo', {
        detail: {
          targetId: closestId,
          fromId: callerId,
          objectId: session.location.objectId,
          slotId: `${session.location.slotId}:roleB`,
          forceRole: 'roleB',
          targetPos: posB,
          targetRotY: rotB,
        }
      }));
      return closestId;
    }

    return null;
  }

  /** Résout la playlist d'animations pour un slot ou un SmartObject donné. */
  public resolveSlotPlaylist(objectId: string, slotId?: string, forcedAnimId?: string): DuoAnimationDef[] {
    const findAnim = (id: string) => DUO_ANIMATIONS.find(d => d.id === id);
    if (forcedAnimId) {
      const d = findAnim(forcedAnimId);
      if (d) return [d];
    }
    if (slotId === 'sit-cuddle') {
      const d = findAnim('sit-cuddle');
      return d ? [d] : [];
    }
    const slot = getSmartObject(objectId)?.slots.find(s => s.slotId === slotId) || getSmartObject(objectId)?.slots[0];
    if (slot?.duoPool?.length) {
      return [...slot.duoPool].sort(() => Math.random() - 0.5).slice(0, slot.duoCount ?? slot.duoPool.length)
        .map(findAnim).filter((d): d is DuoAnimationDef => Boolean(d));
    }
    if (slot?.duoAnimId) {
      const d = findAnim(slot.duoAnimId);
      return d ? [d] : [];
    }
    return slot?.isDuo ? [...DUO_ANIMATIONS].sort(() => Math.random() - 0.5).slice(0, slot.duoCount ?? 1) : [];
  }

  /**
   * Démarre une session Duo directement à partir d'un SmartObject et de son slot,
   * en résolvant automatiquement sa playlist et les participants.
   */
  public startDuoSession(
    objectId: string,
    slotId?: string,
    leaderId?: string,
    partnerId?: string,
    forcedAnimId?: string
  ): { targetA: string; targetB: string; posA: [number, number, number]; posB: [number, number, number]; rotA: number; rotB: number; actualSlotId: string } | null {
    const obj = getSmartObject(objectId);
    if (!obj || (leaderId && !OccupancyManager.canUseObject(objectId, leaderId))
      || (partnerId && !OccupancyManager.canUseObject(objectId, partnerId))) return null;

    const playlist = navigationValue(`duo:${objectId}:${slotId}:${forcedAnimId}`, () => this.resolveSlotPlaylist(objectId, slotId, forcedAnimId));
    if (playlist.length === 0) return null;
    const def = playlist[0];
    const canParticipate = (id: string) => playlist.every(anim => canCharacterPerformDuo(id, anim));
    const requestedLeaderId = leaderId;

    const slot = obj.slots.find(s => s.slotId === slotId)
      || obj.slots.find(s => s.animationsRandom === 'seated-front')
      || obj.slots[0];
    const actualSlotId = slotId || slot?.slotId || 'duo';

    let anchorPos: [number, number, number] = [...(slot?.offset ?? [0, 0, 0])];
    const anchorRotY: number = slot?.rotY ?? obj.rotationY ?? 0;
    const [bx, , bz] = anchorPos;

    // Si une session existe déjà pour cet objet
    const existing = this.sessions.get(objectId);
    if (existing?.isSessionComplete) {
      const participantId = existing.participantA?.characterId ?? existing.participantB?.characterId;
      if (participantId) this.leaveDuoZone(participantId);
    }
    if (existing && !existing.isSessionComplete) {
      const curDef = existing.playlist[existing.currentAnimIndex] || def;
      const { posA, posB, rotA, rotB } = computeWorldTransform(existing.location.anchorPos, existing.location.anchorRotY, curDef.offsetB, curDef.rotB);
      if (leaderId && !existing.playlist.every(anim => canCharacterPerformDuo(leaderId!, anim))) {
        if (!existing.participantA || !existing.participantB) return null;
        return { targetA: existing.participantA.characterId, targetB: existing.participantB.characterId, posA, posB, rotA, rotB, actualSlotId };
      }

      if (leaderId && existing.participantA?.characterId === leaderId) {
        return { targetA: leaderId, targetB: existing.participantB?.characterId ?? '', posA, posB, rotA, rotB, actualSlotId };
      }
      if (leaderId && existing.participantB?.characterId === leaderId) {
        return { targetA: existing.participantA?.characterId ?? '', targetB: leaderId, posA, posB, rotA, rotB, actualSlotId };
      }
      if (!existing.participantB?.isReady && leaderId) {
        if (LIMITED_ROOMS.some(room => OccupancyManager.isRoomObject(room, objectId, actualSlotId) && !OccupancyManager.hasRoomCapacity(room, leaderId!))) return null;
        if (existing.participantB && existing.participantB.characterId !== leaderId) {
          this.charToSession.delete(existing.participantB.characterId);
          OccupancyManager.releaseSlot(objectId, `${actualSlotId}:roleB`, existing.participantB.characterId);
        }
        existing.participantB = { characterId: leaderId, role: 'roleB', isReady: false };
        this.charToSession.set(leaderId, existing);
        const pAId = existing.participantA?.characterId;
        appLog(
          `${pAId}+${leaderId}`,
          `🤝 ${leaderId} rejoint la session Duo sur ${obj.name} en Rôle B avec ${pAId} !`,
          {
            category: 'duo',
            action: 'duo_join',
            actors: pAId ? [pAId, leaderId] : [leaderId],
            animation: { id: curDef.id, mode: 'duo', label: curDef.label, actorId: pAId, partnerId: leaderId },
            object: { id: objectId, label: obj.name, slotId: actualSlotId },
          }
        );
        return { targetA: existing.participantA?.characterId ?? '', targetB: leaderId, posA, posB, rotA, rotB, actualSlotId };
      }
      return null;
    }

    if (leaderId && !canParticipate(leaderId)) leaderId = undefined;
    if (partnerId && !canParticipate(partnerId)) partnerId = undefined;

    // Résolution Leader (A) et Partenaire (B)
    const isVisibleChar = (id: string, allowPlayer = true) => {
      if (id === 'ulotte' || id === 'shiba' || id === 'robin' || !canParticipate(id) || !OccupancyManager.canUseObject(objectId, id)) return false;
      const storeState = useSceneStore.getState();
      if (!allowPlayer && id === storeState.activeCharacterId) return false;
      return (
        isCharacterVisibleInMode(id, storeState.layers.laraCount ?? 4, storeState.activeCharacterId, storeState.layers.extraCharacters ?? false, storeState.activeExtraIds, storeState.activeMainIds) ||
        id === storeState.activeCharacterId
      );
    };

    const getCandidates = (excludeId?: string, allowPlayer = true) => {
      const preferred = Object.entries(INITIAL_SMART_OBJECT_BY_CHAR)
        .filter(([id, objDest]) => objDest === objectId && id !== excludeId && !this.getSessionFor(id) && isVisibleChar(id, allowPlayer))
        .map(([id]) => id);
      if (preferred.length > 0) return preferred;

      return Object.keys(cameraState.positions)
        .filter(id => id !== excludeId && !this.getSessionFor(id) && isVisibleChar(id, allowPlayer))
        .sort((a, b) => {
          if (isLifeCharacter(excludeId) && def.id === 'conversation') {
            const affinity = socialPartnerScore(characterLives[excludeId].relationships, b, characterLives[excludeId].elapsedSeconds) - socialPartnerScore(characterLives[excludeId].relationships, a, characterLives[excludeId].elapsedSeconds);
            if (affinity) return affinity;
          }
          const pa = cameraState.positions[a];
          const pb = cameraState.positions[b];
          return (pa ? Math.hypot(pa.x - bx, pa.z - bz) : Infinity) - (pb ? Math.hypot(pb.x - bx, pb.z - bz) : Infinity);
        });
    };

    const candidates = getCandidates(undefined, true);
    const targetA = leaderId || candidates.find(id => id !== partnerId);
    const partnerCandidates = getCandidates(targetA, false);
    const targetB = partnerId || partnerCandidates[0];
    if (!targetA || !targetB || targetA === targetB) return null;


    if (slot?.isDuo) {
      const safeAnchor = findDuoAnchor(anchorPos, anchorRotY, playlist,
        getNavigationGraph(getAgentProfile(targetA)), getNavigationGraph(getAgentProfile(targetB)));
      if (!safeAnchor) {
        appLog(`${targetA}+${targetB}`, `🚧 Impossible de placer le duo ${obj.name} sur un sol praticable pour toute la séquence`, {
          category: 'duo',
          action: 'duo_placement_failed',
          actors: [targetA, targetB],
          animation: { id: def.id, mode: 'duo', label: def.label, actorId: targetA, partnerId: targetB },
          object: { id: objectId, label: obj.name, slotId: actualSlotId },
        });
        return null;
      }
      anchorPos = safeAnchor;
    }
    const location: DuoLocation = { objectId, slotId: actualSlotId, anchorPos, anchorRotY };
    if (LIMITED_ROOMS.some(room => OccupancyManager.isRoomObject(room, objectId, actualSlotId) && !OccupancyManager.hasRoomCapacity(room, targetA, targetB))) return null;

    // Réservations d'occupation
    OccupancyManager.claimSlot(objectId, `${actualSlotId}:roleA`, targetA);
    OccupancyManager.claimSlot(objectId, actualSlotId, targetA);
    if (slot && slot.slotId !== actualSlotId) {
      OccupancyManager.claimSlot(objectId, slot.slotId, targetA);
    }
    const participantA = { characterId: targetA, role: 'roleA' as DuoRole, isReady: false };

    OccupancyManager.claimSlot(objectId, `${actualSlotId}:roleB`, targetB);
    const participantB = { characterId: targetB, role: 'roleB' as DuoRole, isReady: false };

    const newSession = createDuoSession(
      objectId,
      location,
      playlist,
      this.repeatsPerAnim,
      participantA,
      participantB
    );
    this.sessions.set(objectId, newSession);
    this.charToSession.set(targetA, newSession);
    this.charToSession.set(targetB, newSession);

    const { posA, posB, rotA, rotB } = computeWorldTransform(anchorPos, anchorRotY, def.offsetB, def.rotB);

    appLog(
      `${targetA}+${targetB}`,
      `🛋️ Session Duo "${def.label}" lancée sur ${obj.name} entre ${targetA} (Meneur A) et ${targetB} (Partenaire B) !`,
      {
        category: 'duo',
        action: 'duo_launch',
        actors: [targetA, targetB],
        animation: { id: def.id, mode: 'duo', label: def.label, actorId: targetA, partnerId: targetB },
        object: { id: objectId, label: obj.name, slotId: actualSlotId },
      }
    );

    if (requestedLeaderId && requestedLeaderId !== targetA && requestedLeaderId !== targetB) {
      document.dispatchEvent(new CustomEvent('npc-invite-duo', {
        detail: { targetId: targetA, fromId: 'SmartObject', objectId, slotId: actualSlotId, forceRole: 'roleA', targetPos: posA, targetRotY: rotA }
      }));
    }

    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: {
        targetId: targetB,
        fromId: 'SmartObject',
        objectId,
        slotId: `${actualSlotId}:roleB`,
        forceRole: 'roleB',
        targetPos: posB,
        targetRotY: rotB,
      }
    }));

    this.emitChange();
    return { targetA, targetB, posA, posB, rotA, rotB, actualSlotId };
  }

  /**
   * Force le déclenchement d'une animation duo spécifique (ex: depuis la Barre d'outils ou l'Inventaire).
   * Si aucun meneur/partenaire n'est spécifié, sélectionne les PNJs disponibles les plus proches de la Duo Zone.
   */
  public forceDuoAnimation(
    def: DuoAnimationDef,
    leaderId?: string,
    partnerId?: string,
    fromId = 'Toolbar'
  ): Promise<{ targetA: string; targetB: string } | null> {
    return resolveNavigation(() => {
    const [bx, , bz] = this.basePos;
    let session = this.sessions.get('duo-zone');
    if (!session) {
      session = createDuoSession('duo-zone', { ...this.defaultLocation }, [def], this.repeatsPerAnim);
    }

    // Déterminer targetA et targetB
    let targetA: string | null = leaderId || session.participantA?.characterId || null;
    let targetB: string | null = partnerId || session.participantB?.characterId || null;
    if (targetA && !canCharacterPerformDuo(targetA, def)) targetA = null;
    if (targetB && !canCharacterPerformDuo(targetB, def)) targetB = null;

    if (!targetA || !targetB) {
      const store = useSceneStore.getState();
      const candidates = Array.from(AUTONOMOUS_NPC_IDS)
        .filter(id => isCharacterVisibleInMode(id, store.layers.laraCount ?? 4, store.activeCharacterId, store.layers.extraCharacters ?? false, store.activeExtraIds, store.activeMainIds) && canCharacterPerformDuo(id, def) && id !== targetA && id !== targetB && !this.getSessionFor(id))
        .sort((a, b) => {
          const pa = cameraState.positions[a];
          const pb = cameraState.positions[b];
          return (pa ? Math.hypot(pa.x - bx, pa.z - bz) : Infinity) - (pb ? Math.hypot(pb.x - bx, pb.z - bz) : Infinity);
        });

      if (!targetA) targetA = candidates.shift() || null;
      if (!targetB) targetB = candidates.find(id => id !== targetA) || null;
    }

    if (!targetA || !targetB || targetA === targetB) return null;

    const safeAnchor = findDuoAnchor(this.basePos, this.defaultLocation.anchorRotY, [def],
      getNavigationGraph(getAgentProfile(targetA)), getNavigationGraph(getAgentProfile(targetB)));
    if (!safeAnchor) {
      appLog(`${targetA}+${targetB}`, `🚧 Impossible de placer le duo "${def.label}" sur un sol praticable`, {
        category: 'duo',
        action: 'duo_placement_failed',
        actors: [targetA, targetB],
        animation: { id: def.id, mode: 'duo', label: def.label, actorId: targetA, partnerId: targetB },
        object: { id: 'duo-zone', slotId: 'duo-random' },
      });
      return null;
    }
    session.location = { ...this.defaultLocation, anchorPos: safeAnchor };

    // Libérer les anciens occupants si changement de PNJ
    if (session.participantA && session.participantA.characterId !== targetA) {
      this.charToSession.delete(session.participantA.characterId);
      OccupancyManager.releaseSlot('duo-zone', 'roleA', session.participantA.characterId);
    }
    if (session.participantB && session.participantB.characterId !== targetB) {
      this.charToSession.delete(session.participantB.characterId);
      OccupancyManager.releaseSlot('duo-zone', 'roleB', session.participantB.characterId);
    }

    // Configurer la session
    this.sessions.set('duo-zone', session);
    session.playlist = [def];
    session.currentAnimIndex = 0;
    session.currentRepeatIndex = 0;
    session.sessionTimer = def.duration ?? 5.0;
    session.isSessionComplete = false;
    session.cachedAnimState = null;

    // Calculer les positions cibles monde pour A et B
    const { posA, posB, rotA, rotB } = computeWorldTransform(session.location.anchorPos, session.location.anchorRotY, def.offsetB, def.rotB);

    // Présence physique (< 80 cm de chaque spot respectif)
    const isNearby = (id: string, targetPos: [number, number, number]) => {
      const pos = cameraState.positions[id];
      return pos ? Math.hypot(pos.x - targetPos[0], pos.z - targetPos[2]) < 80 : false;
    };
    const isAlreadyThereA = isNearby(targetA, posA);
    const isAlreadyThereB = isNearby(targetB, posB);

    OccupancyManager.claimSlot('duo-zone', 'roleA', targetA);
    session.participantA = { characterId: targetA, role: 'roleA', isReady: isAlreadyThereA };
    OccupancyManager.claimSlot('duo-zone', 'roleB', targetB);
    session.participantB = { characterId: targetB, role: 'roleB', isReady: isAlreadyThereB };
    this.charToSession.set(targetA, session);
    this.charToSession.set(targetB, session);


    session.isSessionPlaying = isAlreadyThereA && isAlreadyThereB;
    appLog(
      `${targetA}+${targetB}`,
      session.isSessionPlaying
        ? `🎭 Duo instantané (2 déjà sur place) : "${def.label}" avec ${targetA} & ${targetB}`
        : `🎮 Appel Duo (${fromId}) : "${def.label}" assignée à ${targetA} (Meneur) et ${targetB} (Partenaire)`,
      {
        category: 'duo',
        action: session.isSessionPlaying ? 'duo_instant' : 'duo_force',
        actors: [targetA, targetB],
        animation: { id: def.id, mode: 'duo', label: def.label, actorId: targetA, partnerId: targetB },
        object: { id: 'duo-zone', slotId: 'duo-random' },
      }
    );

    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: {
        targetId: targetA,
        fromId,
        forceRole: 'roleA',
        objectId: 'duo-zone',
        slotId: 'duo-random',
        targetPos: posA,
        targetRotY: rotA,
        alreadyThere: isAlreadyThereA,
      }
    }));
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: {
        targetId: targetB,
        fromId,
        forceRole: 'roleB',
        objectId: 'duo-zone',
        slotId: 'duo-random',
        targetPos: posB,
        targetRotY: rotB,
        alreadyThere: isAlreadyThereB,
      }
    }));

    this.emitChange();
    return { targetA, targetB };
    });
  }

}

export const duoSessionManager = new DuoSessionManager();
