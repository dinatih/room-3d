import { DUO_ANIMATIONS, DuoAnimationDef } from './duoAnimations';
import { OccupancyManager } from './occupancyManager';
import { appLog } from '@features/ui/AppConsole';
import { cameraState } from '../cameraState';
import { AUTONOMOUS_NPC_IDS, isCharacterVisibleInMode } from '../walkerConfig';
import { getSmartObject } from './smartObjectRegistry';
import { INITIAL_SMART_OBJECT_BY_CHAR } from './scenarios';
import { useSceneStore } from '../store/useSceneStore';

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
}

type SessionListener = () => void;

/** Calcule les positions/rotations monde pour les deux participants d'une animation duo */
function computeWorldTransform(
  anchorPos: [number, number, number],
  anchorRotY: number,
  offsetB: [number, number, number] = [0, 0, 0],
  rotB = 0
) {
  const [bx, by, bz] = anchorPos;
  const cos = Math.cos(anchorRotY);
  const sin = Math.sin(anchorRotY);
  const [lx, ly, lz] = offsetB;
  return {
    posA: [bx, by, bz] as [number, number, number],
    posB: [bx + lx * cos + lz * sin, by + ly, bz - lx * sin + lz * cos] as [number, number, number],
    rotA: anchorRotY % (Math.PI * 2),
    rotB: (anchorRotY + rotB) % (Math.PI * 2),
  };
}

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

  public repeatsPerAnim = 3;
  private listeners = new Set<SessionListener>();

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitChange() {
    this.listeners.forEach(fn => fn());
  }

  /** Récupère la session à laquelle participe un personnage donné. */
  public getSessionFor(characterId: string): ActiveDuoSession | null {
    for (const session of this.sessions.values()) {
      if (session.participantA?.characterId === characterId || session.participantB?.characterId === characterId) {
        return session;
      }
    }
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
      session.currentAnimIndex = 0;
      session.currentRepeatIndex = 0;
      const firstAnim = session.playlist[0];
      session.sessionTimer = firstAnim?.duration ?? 5.0;
      if (firstAnim) {
        appLog(session.location.objectId, `🎭 Duo démarré entre ${session.participantA.characterId} & ${session.participantB.characterId} : "${firstAnim.label}" (x${session.repeatsPerAnim}, ${session.playlist.length} anims, ${session.sessionTimer.toFixed(1)}s/clip)`);
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
    if (characterId) return Boolean(this.getSessionFor(characterId)?.isSessionPlaying);
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
    const def = session.playlist[session.currentAnimIndex];
    if (!def) return null;

    const { posA, posB, rotA, rotB } = computeWorldTransform(
      session.location.anchorPos,
      session.location.anchorRotY,
      def.offsetB,
      def.rotB
    );

    return {
      def,
      clipA: def.animA,
      clipB: def.animB,
      posA,
      posB,
      rotA,
      rotB,
      duration: def.duration ?? 5.0
    };
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
      const objLabel = session.location.objectId;
      if (session.currentRepeatIndex + 1 < session.repeatsPerAnim) {
        session.currentRepeatIndex++;
        const currentAnim = session.playlist[session.currentAnimIndex];
        session.sessionTimer = currentAnim?.duration ?? 5.0;
        appLog(objLabel, `🔄 Répétition Duo (${session.currentRepeatIndex + 1}/${session.repeatsPerAnim}) : "${currentAnim?.label}"`);
      } else {
        session.currentRepeatIndex = 0;
        session.currentAnimIndex++;
        if (session.currentAnimIndex < session.playlist.length) {
          const nextAnim = session.playlist[session.currentAnimIndex];
          session.sessionTimer = nextAnim?.duration ?? 5.0;
          appLog(objLabel, `🎬 Nouvelle animation Duo (${session.currentAnimIndex + 1}/${session.playlist.length}) : "${nextAnim?.label}" (x${session.repeatsPerAnim})`);
        } else {
          session.isSessionPlaying = false;
          session.isSessionComplete = true;
          appLog(objLabel, `✨ Session Duo terminée ! Les 2 PNJs reprennent leur vie autonome.`);
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
    const releaseRole = (role: DuoRole) => {
      if (slotId) {
        OccupancyManager.releaseSlot(objId, `${slotId}:${role}`, characterId);
        OccupancyManager.releaseSlot(objId, slotId, characterId);
      }
      OccupancyManager.releaseSlot(objId, role, characterId);
    };

    if (session.participantA?.characterId === characterId) {
      releaseRole('roleA');
      session.participantA = null;
    }
    if (session.participantB?.characterId === characterId) {
      releaseRole('roleB');
      session.participantB = null;
    }

    if (!session.participantA && !session.participantB) {
      this.sessions.delete(session.sessionId);
    }
    this.emitChange();
  }

  /** Trouve le PNJ autonome le plus proche du spot actif et lui envoie une invitation. */
  public inviteNearestNpc(callerId: string): string | null {
    const session = this.getSessionFor(callerId);
    if (!session || (session.participantA && session.participantB)) return null;

    const [bx, , bz] = session.location.anchorPos;
    let closestId: string | null = null;
    let minDistance = Infinity;

    for (const npcId of AUTONOMOUS_NPC_IDS) {
      if (npcId === callerId) continue;
      if (session.participantA?.characterId === npcId || session.participantB?.characterId === npcId) continue;
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

      if (session.participantB && session.participantB.characterId !== closestId) {
        OccupancyManager.releaseSlot(session.location.objectId, `${session.location.slotId}:roleB`, session.participantB.characterId);
      }
      session.participantB = { characterId: closestId, role: 'roleB', isReady: false };
      OccupancyManager.claimSlot(session.location.objectId, `${session.location.slotId}:roleB`, closestId);

      appLog(session.location.objectId, `📢 ${callerId} invite ${closestId} (${minDistance.toFixed(0)} cm) à rejoindre ${locLabel} !`);
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
      return [...slot.duoPool].sort(() => Math.random() - 0.5).slice(0, slot.duoCount ?? 3)
        .map(findAnim).filter((d): d is DuoAnimationDef => Boolean(d));
    }
    if (slot?.duoAnimId) {
      const d = findAnim(slot.duoAnimId);
      return d ? [d] : [];
    }
    return slot?.isDuo ? [...DUO_ANIMATIONS].sort(() => Math.random() - 0.5).slice(0, slot.duoCount ?? 3) : [];
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
    if (!obj) return null;

    const playlist = this.resolveSlotPlaylist(objectId, slotId, forcedAnimId);
    if (playlist.length === 0) return null;
    const def = playlist[0];

    const slot = obj.slots.find(s => s.slotId === slotId)
      || obj.slots.find(s => s.animationsRandom === 'seated-front')
      || obj.slots[0];
    const actualSlotId = slotId || slot?.slotId || 'duo';

    const anchorPos: [number, number, number] = slot?.offset ?? [0, 0, 0];
    const anchorRotY: number = slot?.rotY ?? obj.rotationY ?? 0;
    const [bx, , bz] = anchorPos;

    // Si une session existe déjà pour cet objet
    const existing = this.sessions.get(objectId);
    if (existing && !existing.isSessionComplete) {
      const curDef = existing.playlist[existing.currentAnimIndex] || def;
      const { posA, posB, rotA, rotB } = computeWorldTransform(anchorPos, anchorRotY, curDef.offsetB, curDef.rotB);

      if (leaderId && existing.participantA?.characterId === leaderId) {
        return { targetA: leaderId, targetB: existing.participantB?.characterId ?? '', posA, posB, rotA, rotB, actualSlotId };
      }
      if (leaderId && existing.participantB?.characterId === leaderId) {
        return { targetA: existing.participantA?.characterId ?? '', targetB: leaderId, posA, posB, rotA, rotB, actualSlotId };
      }
      if (!existing.participantB?.isReady && leaderId) {
        if (existing.participantB && existing.participantB.characterId !== leaderId) {
          OccupancyManager.releaseSlot(objectId, `${actualSlotId}:roleB`, existing.participantB.characterId);
        }
        existing.participantB = { characterId: leaderId, role: 'roleB', isReady: false };
        OccupancyManager.claimSlot(objectId, `${actualSlotId}:roleB`, leaderId);
        appLog(objectId, `🤝 ${leaderId} rejoint la session Duo sur ${obj.name} en Rôle B avec ${existing.participantA?.characterId} !`);
        return { targetA: existing.participantA?.characterId ?? '', targetB: leaderId, posA, posB, rotA, rotB, actualSlotId };
      }
      return null;
    }

    // Résolution Leader (A) et Partenaire (B)
    const isVisibleChar = (id: string) => {
      if (id === 'shiba' || id === 'robin') return false;
      const store = useSceneStore.getState();
      return (
        isCharacterVisibleInMode(id, store.layers.laraCount ?? 4, store.activeWalkerId, store.layers.extraCharacters ?? false, store.activeExtraIds) ||
        id === store.activeWalkerId
      );
    };

    const getCandidates = (excludeId?: string) => {
      const preferred = Object.entries(INITIAL_SMART_OBJECT_BY_CHAR)
        .filter(([id, objDest]) => objDest === objectId && id !== excludeId && !this.getSessionFor(id) && isVisibleChar(id))
        .map(([id]) => id);
      if (preferred.length > 0) return preferred;

      return Object.keys(cameraState.positions)
        .filter(id => id !== excludeId && !this.getSessionFor(id) && isVisibleChar(id))
        .sort((a, b) => {
          const pa = cameraState.positions[a];
          const pb = cameraState.positions[b];
          return (pa ? Math.hypot(pa.x - bx, pa.z - bz) : Infinity) - (pb ? Math.hypot(pb.x - bx, pb.z - bz) : Infinity);
        });
    };

    const candidates = getCandidates();
    const targetA = leaderId || candidates[0] || (isVisibleChar('native') ? 'native' : 'xbot');
    const partnerCandidates = getCandidates(targetA);
    const targetB = partnerId || partnerCandidates[0] || (targetA === 'native' ? 'rosanna' : 'native');
    if (!targetA || !targetB || targetA === targetB) return null;

    const location: DuoLocation = { objectId, slotId: actualSlotId, anchorPos, anchorRotY };

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
      slot?.duoCount ? 1 : this.repeatsPerAnim,
      participantA,
      participantB
    );
    this.sessions.set(objectId, newSession);

    const { posA, posB, rotA, rotB } = computeWorldTransform(anchorPos, anchorRotY, def.offsetB, def.rotB);

    appLog(objectId, `🛋️ Session Duo "${def.label}" lancée sur ${obj.name} entre ${targetA} (Meneur A) et ${targetB} (Partenaire B) !`);

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
   * Force le déclenchement d'une animation duo spécifique (ex: depuis le SidePanel ou l'Inventaire).
   * Si aucun meneur/partenaire n'est spécifié, sélectionne les PNJs disponibles les plus proches de la Duo Zone.
   */
  public forceDuoAnimation(
    def: DuoAnimationDef,
    leaderId?: string,
    partnerId?: string,
    fromId = 'SidePanel'
  ): { targetA: string; targetB: string } | null {
    const [bx, , bz] = this.basePos;
    let session = this.sessions.get('duo-zone');
    if (!session) {
      session = createDuoSession('duo-zone', { ...this.defaultLocation }, [def], this.repeatsPerAnim);
      this.sessions.set('duo-zone', session);
    }

    // Déterminer targetA et targetB
    let targetA: string | null = leaderId || session.participantA?.characterId || null;
    let targetB: string | null = partnerId || session.participantB?.characterId || null;

    if (!targetA || !targetB) {
      const candidates = Array.from(AUTONOMOUS_NPC_IDS)
        .filter(id => id !== targetA && id !== targetB && !this.getSessionFor(id))
        .sort((a, b) => {
          const pa = cameraState.positions[a];
          const pb = cameraState.positions[b];
          return (pa ? Math.hypot(pa.x - bx, pa.z - bz) : Infinity) - (pb ? Math.hypot(pb.x - bx, pb.z - bz) : Infinity);
        });

      if (!targetA) targetA = candidates.shift() || 'native';
      if (!targetB) targetB = candidates.find(id => id !== targetA) || (targetA === 'native' ? 'rosanna' : 'native');
    }

    if (!targetA || !targetB || targetA === targetB) return null;

    // Libérer les anciens occupants si changement de PNJ
    if (session.participantA && session.participantA.characterId !== targetA) {
      OccupancyManager.releaseSlot('duo-zone', 'roleA', session.participantA.characterId);
    }
    if (session.participantB && session.participantB.characterId !== targetB) {
      OccupancyManager.releaseSlot('duo-zone', 'roleB', session.participantB.characterId);
    }

    // Configurer la session
    session.playlist = [def];
    session.currentAnimIndex = 0;
    session.currentRepeatIndex = 0;
    session.sessionTimer = def.duration ?? 5.0;
    session.isSessionComplete = false;

    // Présence physique (< 80 cm du spot de la duo-zone)
    const isNearby = (id: string) => {
      const pos = cameraState.positions[id];
      return pos ? Math.hypot(pos.x - bx, pos.z - bz) < 80 : false;
    };
    const isAlreadyThereA = isNearby(targetA);
    const isAlreadyThereB = isNearby(targetB);

    OccupancyManager.claimSlot('duo-zone', 'roleA', targetA);
    session.participantA = { characterId: targetA, role: 'roleA', isReady: isAlreadyThereA };
    OccupancyManager.claimSlot('duo-zone', 'roleB', targetB);
    session.participantB = { characterId: targetB, role: 'roleB', isReady: isAlreadyThereB };

    session.isSessionPlaying = isAlreadyThereA && isAlreadyThereB;
    appLog('duo-zone', session.isSessionPlaying
      ? `🎭 Duo instantané (2 déjà sur place) : "${def.label}" avec ${targetA} & ${targetB}`
      : `🎮 Appel Duo (${fromId}) : "${def.label}" assignée à ${targetA} (Meneur) et ${targetB} (Partenaire)`);

    for (const [targetId, role, alreadyThere] of [[targetA, 'roleA', isAlreadyThereA], [targetB, 'roleB', isAlreadyThereB]] as const) {
      document.dispatchEvent(new CustomEvent('npc-invite-duo', {
        detail: { targetId, fromId, forceRole: role, objectId: 'duo-zone', slotId: 'duo-random', alreadyThere }
      }));
    }

    this.emitChange();
    return { targetA, targetB };
  }

  /**
   * Alias de rétrocompatibilité pour forcer un duo avec un meneur spécifique.
   */
  public forceDuoAnimationWithLeader(leaderId: string, def: DuoAnimationDef, partnerId?: string): { targetA: string; targetB: string } | null {
    return this.forceDuoAnimation(def, leaderId, partnerId, 'Inventory');
  }
}

export const duoSessionManager = new DuoSessionManager();
