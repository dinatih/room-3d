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

class DuoSessionManager {
  public readonly basePos: [number, number, number] = [-100, 0, -200];
  private readonly defaultLocation: DuoLocation = {
    objectId: 'duo-zone',
    slotId: 'duo-random',
    anchorPos: [-100, 0, -200],
    anchorRotY: 0,
  };

  /**
   * Sessions duo actives indexées par sessionId (ex: objectId).
   * Permet à plusieurs sessions de tourner en parallèle (Duo Zone, Combat, Câlins, etc.).
   */
  private sessions = new Map<string, ActiveDuoSession>();

  public repeatsPerAnim = 3;
  private listeners = new Set<SessionListener>();

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange() {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Récupère la session à laquelle participe un personnage donné.
   */
  public getSessionFor(characterId: string): ActiveDuoSession | null {
    for (const session of this.sessions.values()) {
      if (session.participantA?.characterId === characterId || session.participantB?.characterId === characterId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Récupère la session liée à un objet donné.
   */
  public getSessionByObjectId(objectId: string): ActiveDuoSession | null {
    return this.sessions.get(objectId) ?? null;
  }

  /**
   * Récupère la session liée à un objet et/ou slot donné.
   */
  public getSessionForSlot(objectId: string, slotId?: string): ActiveDuoSession | null {
    const direct = this.sessions.get(objectId);
    if (direct && (!slotId || direct.location.slotId === slotId)) {
      return direct;
    }
    for (const session of this.sessions.values()) {
      if (session.location.objectId === objectId && (!slotId || session.location.slotId === slotId)) {
        return session;
      }
    }
    return null;
  }

  /**
   * Première session active (fallback de compatibilité sans id).
   */
  private getFirstActiveSession(): ActiveDuoSession | null {
    for (const session of this.sessions.values()) {
      if (session.isSessionPlaying || session.participantA || session.participantB) {
        return session;
      }
    }
    return null;
  }

  /**
   * Marque un participant comme physiquement arrivé sur son spot et prêt.
   */
  public markReady(characterId: string): void {
    const session = this.getSessionFor(characterId);
    if (!session) return;

    if (session.participantA?.characterId === characterId) {
      session.participantA.isReady = true;
    }
    if (session.participantB?.characterId === characterId) {
      session.participantB.isReady = true;
    }

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
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    return session?.participantA ?? null;
  }

  public getParticipantB(characterId?: string): DuoSessionParticipant | null {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    return session?.participantB ?? null;
  }

  public getElapsedTimeInRepeat(characterId?: string): number {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    if (!session) return 0;
    const currentAnim = session.playlist[session.currentAnimIndex];
    const duration = currentAnim?.duration ?? 5.0;
    return Math.max(0, duration - session.sessionTimer);
  }

  public isWaitingPartner(characterId: string): boolean {
    const session = this.getSessionFor(characterId);
    if (!session || session.isSessionPlaying || session.isSessionComplete) return false;
    if (session.participantA?.characterId === characterId && !session.participantB?.isReady) return true;
    if (session.participantB?.characterId === characterId && !session.participantA?.isReady) return true;
    return false;
  }

  public isPlaying(characterId?: string): boolean {
    if (characterId) {
      const session = this.getSessionFor(characterId);
      return Boolean(session?.isSessionPlaying);
    }
    for (const session of this.sessions.values()) {
      if (session.isSessionPlaying) return true;
    }
    return false;
  }

  public isCompletedFor(characterId: string): boolean {
    const session = this.getSessionFor(characterId);
    if (!session) return true;
    if (session.isSessionComplete) return true;
    if (!session.participantA && !session.participantB) return true;
    const isParticipant = session.participantA?.characterId === characterId
                       || session.participantB?.characterId === characterId;
    if (!isParticipant) return true;
    return false;
  }

  public getCurrentLocation(characterId?: string): DuoLocation {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    return session?.location ?? this.defaultLocation;
  }

  /**
   * Récupère les données d'animation et de placement calculées pour l'animation courante d'une session.
   */
  public getCurrentAnimState(characterId?: string): DuoCurrentAnimState | null {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    if (!session || !session.isSessionPlaying || session.currentAnimIndex >= session.playlist.length) return null;
    const def = session.playlist[session.currentAnimIndex];
    if (!def) return null;

    const [bx, by, bz] = session.location.anchorPos;
    const ry = session.location.anchorRotY;
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);

    const transformLocalToWorld = (localOffset: [number, number, number]): [number, number, number] => {
      const [lx, ly, lz] = localOffset;
      return [
        bx + lx * cos + lz * sin,
        by + ly,
        bz - lx * sin + lz * cos,
      ];
    };

    const localA: [number, number, number] = [0, 0, 0];
    const localB: [number, number, number] = def.offsetB ?? [0, 0, 0];

    const posA = transformLocalToWorld(localA);
    const posB = transformLocalToWorld(localB);

    const rotA = ry % (Math.PI * 2);
    const rotB = (ry + (def.rotB !== undefined ? def.rotB : 0)) % (Math.PI * 2);

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

  /**
   * Retourne la position monde de posB pour le slot courant, utilisée pendant la phase d'attente
   * (avant que la session ne démarre, getCurrentAnimState() retourne null).
   */
  public getWaitPosB(characterId?: string): [number, number, number] {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    const def = session?.playlist[0];
    const anchorPos = session?.location.anchorPos ?? this.defaultLocation.anchorPos;
    const anchorRotY = session?.location.anchorRotY ?? this.defaultLocation.anchorRotY;
    const [bx, by, bz] = anchorPos;
    const cos = Math.cos(anchorRotY);
    const sin = Math.sin(anchorRotY);
    const localB: [number, number, number] = def?.offsetB ?? [0, 0, 0];
    const [lx, ly, lz] = localB;
    return [bx + lx * cos + lz * sin, by + ly, bz - lx * sin + lz * cos];
  }

  /**
   * Retourne la rotation monde attendue pour posB lors de la phase d'attente.
   */
  public getWaitRotB(characterId?: string): number {
    const session = characterId ? this.getSessionFor(characterId) : this.getFirstActiveSession();
    const def = session?.playlist[0];
    const anchorRotY = session?.location.anchorRotY ?? this.defaultLocation.anchorRotY;
    return (anchorRotY + (def?.rotB ?? 0)) % (Math.PI * 2);
  }

  /**
   * Horloge centrale de la session Duo.
   * Seul le rôle A (meneur) décrémente le timer de sa session pour garantir une synchronisation parfaite sans doublon.
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
        this.emitChange();
      } else {
        session.currentRepeatIndex = 0;
        session.currentAnimIndex++;
        if (session.currentAnimIndex < session.playlist.length) {
          const nextAnim = session.playlist[session.currentAnimIndex];
          session.sessionTimer = nextAnim?.duration ?? 5.0;
          appLog(objLabel, `🎬 Nouvelle animation Duo (${session.currentAnimIndex + 1}/${session.playlist.length}) : "${nextAnim?.label}" (x${session.repeatsPerAnim})`);
          this.emitChange();
        } else {
          // Fin de la session complète
          session.isSessionPlaying = false;
          session.isSessionComplete = true;
          appLog(objLabel, `✨ Session Duo terminée ! Les 2 PNJs reprennent leur vie autonome.`);
          this.emitChange();
        }
      }
    }
  }

  /**
   * Un PNJ quitte sa zone duo (suite à fin normale ou timeout).
   */
  public leaveDuoZone(characterId: string): void {
    const session = this.getSessionFor(characterId);
    if (!session) return;

    const loc = session.location;
    const objId = loc.objectId;
    const slotId = loc.slotId;

    const releaseRole = (role: 'roleA' | 'roleB') => {
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

  /**
   * Trouve le PNJ autonome le plus proche du spot actif et lui envoie une invitation.
   */
  public inviteNearestNpc(callerId: string): string | null {
    const session = this.getSessionFor(callerId);
    if (!session || (session.participantA && session.participantB)) return null;

    const [bx, , bz] = session.location.anchorPos;
    let closestId: string | null = null;
    let minDistance = Infinity;

    for (const npcId of AUTONOMOUS_NPC_IDS) {
      if (npcId === callerId) continue;
      if (session.participantA?.characterId === npcId || session.participantB?.characterId === npcId) continue;
      // Ne pas inviter un PNJ qui participe déjà à une autre session duo active
      if (this.getSessionFor(npcId) !== null) continue;

      const pos = cameraState.positions[npcId];
      if (pos) {
        const dx = pos.x - bx;
        const dz = pos.z - bz;
        const dist = Math.hypot(dx, dz);
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

  /**
   * Résout la playlist d'animations pour un slot ou un SmartObject donné.
   */
  public resolveSlotPlaylist(objectId: string, slotId?: string, forcedAnimId?: string): DuoAnimationDef[] {
    if (forcedAnimId) {
      const forcedDef = DUO_ANIMATIONS.find(d => d.id === forcedAnimId);
      if (forcedDef) {
        return [forcedDef];
      }
    }
    if (slotId === 'sit-cuddle') {
      const def = DUO_ANIMATIONS.find(d => d.id === 'sit-cuddle');
      return def ? [def] : [];
    }
    const obj = getSmartObject(objectId);
    const slot = obj?.slots.find(s => s.slotId === slotId) || obj?.slots[0];
    if (slot?.duoPool && slot.duoPool.length > 0) {
      const count = Math.min(slot.duoCount ?? 3, slot.duoPool.length);
      return [...slot.duoPool].sort(() => Math.random() - 0.5).slice(0, count)
        .map(id => DUO_ANIMATIONS.find(d => d.id === id))
        .filter((d): d is DuoAnimationDef => Boolean(d));
    }
    if (slot?.duoAnimId) {
      const def = DUO_ANIMATIONS.find(d => d.id === slot.duoAnimId);
      return def ? [def] : [];
    }
    if (!slot?.isDuo) {
      return [];
    }
    const count = slot?.duoCount ?? 3;
    return [...DUO_ANIMATIONS].sort(() => Math.random() - 0.5).slice(0, count);
  }

  /**
   * Démarre une session Duo directement à partir d'un SmartObject et de son slot,
   * en résolvant automatiquement sa playlist et les participants.
   * Gère de multiples sessions en parallèle sans écraser les autres duos.
   */
  public startDuoSession(
    objectId: string,
    slotId?: string,
    leaderId?: string,
    partnerId?: string,
    forcedAnimId?: string
  ): { targetA: string; targetB: string; posA: [number,number,number]; posB: [number,number,number]; rotA: number; rotB: number; actualSlotId: string } | null {
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
    const [bx, by, bz] = anchorPos;

    // Si une session existe déjà pour cet objet
    const existing = this.sessions.get(objectId);
    if (existing && !existing.isSessionComplete) {
      const cos = Math.cos(anchorRotY);
      const sin = Math.sin(anchorRotY);
      const curDef = existing.playlist[existing.currentAnimIndex] || def;
      const localB = curDef.offsetB ?? [0, 0, 0];
      const posA: [number, number, number] = [bx, by, bz];
      const posB: [number, number, number] = [
        bx + localB[0] * cos + localB[2] * sin,
        by + localB[1],
        bz - localB[0] * sin + localB[2] * cos,
      ];
      const rotA = anchorRotY % (Math.PI * 2);
      const rotB = (anchorRotY + (curDef.rotB ?? 0)) % (Math.PI * 2);

      // Cas 1 : Le personnage arrivant est déjà le meneur (Rôle A)
      if (existing.participantA?.characterId === leaderId) {
        return {
          targetA: leaderId ?? existing.participantA?.characterId ?? "",
          targetB: existing.participantB?.characterId ?? "",
          posA,
          posB,
          rotA,
          rotB,
          actualSlotId,
        };
      }

      // Cas 2 : Le personnage arrivant est déjà le partenaire assigné (Rôle B)
      if (existing.participantB?.characterId === leaderId) {
        return {
          targetA: existing.participantA?.characterId ?? "",
          targetB: leaderId ?? existing.participantB?.characterId ?? "",
          posA,
          posB,
          rotA,
          rotB,
          actualSlotId,
        };
      }

      // Cas 3 : La session attend encore son partenaire (Rôle B pas encore sur place)
      // Le personnage arrivant prend immédiatement la place de partenaire Rôle B !
      if (!existing.participantB?.isReady && leaderId) {
        if (existing.participantB && existing.participantB.characterId !== leaderId) {
          OccupancyManager.releaseSlot(objectId, `${actualSlotId}:roleB`, existing.participantB.characterId);
        }
        existing.participantB = { characterId: leaderId, role: "roleB", isReady: false };
        OccupancyManager.claimSlot(objectId, `${actualSlotId}:roleB`, leaderId);

        appLog(objectId, `🤝 ${leaderId} rejoint la session Duo sur ${obj.name} en Rôle B avec ${existing.participantA?.characterId} !`);

        return {
          targetA: existing.participantA?.characterId ?? "",
          targetB: leaderId,
          posA,
          posB,
          rotA,
          rotB,
          actualSlotId,
        };
      }

      // Objet déjà occupé par une autre session duo en cours
      return null;
    }

    // Résolution Leader (A) et Partenaire (B)
    const isVisibleChar = (id: string) => {
      if (id === 'shiba' || id === 'robin') return false;
      const store = useSceneStore.getState();
      const laraCount = store.layers.laraCount ?? 4;
      const extraChars = store.layers.extraCharacters ?? false;
      const activeWalkerId = store.activeWalkerId;
      const activeExtraIds = store.activeExtraIds;
      return (
        isCharacterVisibleInMode(id, laraCount, activeWalkerId, extraChars, activeExtraIds) ||
        id === activeWalkerId
      );
    };

    const getCandidates = (excludeId?: string) => {
      // 1. Chercher d'abord un PNJ qui a cet objet comme destination initiale assignée
      const preferred = Object.entries(INITIAL_SMART_OBJECT_BY_CHAR)
        .filter(([id, obj]) => obj === objectId && id !== excludeId && !this.getSessionFor(id) && isVisibleChar(id))
        .map(([id]) => id);
      if (preferred.length > 0) {
        return preferred;
      }
      return Object.keys(cameraState.positions)
        .filter(id => id !== excludeId && !this.getSessionFor(id) && isVisibleChar(id))
        .sort((a, b) => {
          const pa = cameraState.positions[a];
          const pb = cameraState.positions[b];
          const da = pa ? Math.hypot(pa.x - bx, pa.z - bz) : Infinity;
          const db = pb ? Math.hypot(pb.x - bx, pb.z - bz) : Infinity;
          return da - db;
        });
    };

    const candidates = getCandidates();
    const targetA = leaderId || candidates[0] || (isVisibleChar('native') ? 'native' : 'xbot');
    const partnerCandidates = getCandidates(targetA);
    const targetB = partnerId || partnerCandidates[0] || (targetA === 'native' ? 'rosanna' : 'native');
    if (!targetA || !targetB || targetA === targetB) return null;

    // Définir l'emplacement actif
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

    // Créer et enregistrer la session autonome
    const newSession: ActiveDuoSession = {
      sessionId: objectId,
      location,
      participantA,
      participantB,
      playlist,
      currentAnimIndex: 0,
      currentRepeatIndex: 0,
      repeatsPerAnim: slot?.duoCount ? 1 : this.repeatsPerAnim,
      sessionTimer: def.duration ?? 5.0,
      isSessionPlaying: false,
      isSessionComplete: false,
    };
    this.sessions.set(objectId, newSession);

    // Calculer les coordonnées monde de posA et posB pour l'animation Duo
    const cos = Math.cos(anchorRotY);
    const sin = Math.sin(anchorRotY);
    const transformLocalToWorld = (localOffset: [number, number, number]): [number, number, number] => {
      const [lx, ly, lz] = localOffset;
      return [bx + lx * cos + lz * sin, by + ly, bz - lx * sin + lz * cos];
    };
    const localA: [number, number, number] = [0, 0, 0];
    const localB: [number, number, number] = def.offsetB ?? [0, 0, 0];
    const posA = transformLocalToWorld(localA);
    const posB = transformLocalToWorld(localB);
    const rotA = anchorRotY % (Math.PI * 2);
    const rotB = (anchorRotY + (def.rotB ?? 0)) % (Math.PI * 2);

    appLog(objectId, `🛋️ Session Duo "${def.label}" lancée sur ${obj.name} entre ${targetA} (Meneur A) et ${targetB} (Partenaire B) !`);

    // Notifier le partenaire (Rôle B)
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
   * Force le déclenchement d'une animation de couple spécifique (ex: depuis le SidePanel)
   * en appelant les 2 PNJs autonomes les plus proches de la Duo Zone pour la jouer 3 fois.
   */
  public forceDuoAnimation(def: DuoAnimationDef): { targetA: string; targetB: string } | null {
    const [bx, , bz] = this.basePos;
    let session = this.sessions.get('duo-zone');
    if (!session) {
      session = {
        sessionId: 'duo-zone',
        location: { ...this.defaultLocation },
        participantA: null,
        participantB: null,
        playlist: [def],
        currentAnimIndex: 0,
        currentRepeatIndex: 0,
        repeatsPerAnim: this.repeatsPerAnim,
        sessionTimer: def.duration ?? 5.0,
        isSessionPlaying: false,
        isSessionComplete: false,
      };
      this.sessions.set('duo-zone', session);
    }

    // 1. Vérifier si des participants sont déjà présents sur la Duo Zone
    let targetA: string | null = session.participantA?.characterId || null;
    let targetB: string | null = session.participantB?.characterId || null;

    // Si un ou deux manquent, chercher les PNJs autonomes les plus proches
    if (!targetA || !targetB) {
      const sortedNpcs: { id: string; dist: number }[] = [];
      for (const npcId of AUTONOMOUS_NPC_IDS) {
        if (npcId === targetA || npcId === targetB) continue;
        const pos = cameraState.positions[npcId];
        const dist = pos ? Math.hypot(pos.x - bx, pos.z - bz) : Infinity;
        sortedNpcs.push({ id: npcId, dist });
      }
      sortedNpcs.sort((a, b) => a.dist - b.dist);

      const availableIds = sortedNpcs.map(n => n.id);
      if (!targetA) targetA = availableIds[0] || 'native';
      if (!targetB) targetB = (availableIds[0] === targetA ? availableIds[1] : availableIds[0]) || 'rosanna';
    }

    if (!targetA || !targetB || targetA === targetB) {
      return null;
    }

    // Configurer la session avec l'animation sélectionnée
    session.playlist = [def];
    session.currentAnimIndex = 0;
    session.currentRepeatIndex = 0;
    session.sessionTimer = def.duration ?? 5.0;
    session.isSessionComplete = false;

    // Vérifier la présence physique des participants (à moins de 80 cm du centre de duo-zone)
    const posA = cameraState.positions[targetA];
    const posB = cameraState.positions[targetB];
    const isAlreadyThereA = posA ? Math.hypot(posA.x - bx, posA.z - bz) < 80 : false;
    const isAlreadyThereB = posB ? Math.hypot(posB.x - bx, posB.z - bz) < 80 : false;

    // Assigner les rôles
    OccupancyManager.claimSlot('duo-zone', 'roleA', targetA);
    session.participantA = { characterId: targetA, role: 'roleA', isReady: isAlreadyThereA };

    OccupancyManager.claimSlot('duo-zone', 'roleB', targetB);
    session.participantB = { characterId: targetB, role: 'roleB', isReady: isAlreadyThereB };

    // Si les 2 sont déjà sur place, lancer directement la session
    if (isAlreadyThereA && isAlreadyThereB) {
      session.isSessionPlaying = true;
      appLog('duo-zone', `🎭 Duo instantané (2 déjà sur place) : "${def.label}" avec ${targetA} & ${targetB}`);
    } else {
      session.isSessionPlaying = false;
      appLog('duo-zone', `🎮 Appel Duo : "${def.label}" assignée à ${targetA} (Meneur) et ${targetB} (Partenaire)`);
    }

    // Inviter les personnages
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetA, fromId: 'SidePanel', forceRole: 'roleA', objectId: 'duo-zone', slotId: 'duo-random', alreadyThere: isAlreadyThereA }
    }));
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetB, fromId: 'SidePanel', forceRole: 'roleB', objectId: 'duo-zone', slotId: 'duo-random', alreadyThere: isAlreadyThereB }
    }));

    this.emitChange();
    return { targetA, targetB };
  }

  /**
   * Force le déclenchement d'une animation de couple avec un meneur (Rôle A) spécifique (ex: depuis l'Inventaire du personnage).
   * Choisit aléatoirement un autre PNJ autonome comme partenaire (Rôle B).
   */
  public forceDuoAnimationWithLeader(leaderId: string, def: DuoAnimationDef, partnerId?: string): { targetA: string; targetB: string } | null {
    const targetA = leaderId;

    let targetB = partnerId;
    if (!targetB) {
      const candidates = Array.from(AUTONOMOUS_NPC_IDS).filter(id => id !== targetA && !this.getSessionFor(id));
      targetB = candidates[Math.floor(Math.random() * candidates.length)] || (targetA === 'native' ? 'rosanna' : 'native');
    }

    if (!targetA || !targetB || targetA === targetB) {
      return null;
    }

    let session = this.sessions.get('duo-zone');
    if (!session) {
      session = {
        sessionId: 'duo-zone',
        location: { ...this.defaultLocation },
        participantA: null,
        participantB: null,
        playlist: [def],
        currentAnimIndex: 0,
        currentRepeatIndex: 0,
        repeatsPerAnim: this.repeatsPerAnim,
        sessionTimer: def.duration ?? 5.0,
        isSessionPlaying: false,
        isSessionComplete: false,
      };
      this.sessions.set('duo-zone', session);
    }

    // Libérer les anciens occupants éventuels
    if (session.participantA && session.participantA.characterId !== targetA) {
      OccupancyManager.releaseSlot('duo-zone', 'roleA', session.participantA.characterId);
    }
    if (session.participantB && session.participantB.characterId !== targetB) {
      OccupancyManager.releaseSlot('duo-zone', 'roleB', session.participantB.characterId);
    }

    // Configurer la session avec cette animation unique jouée 3 fois
    session.playlist = [def];
    session.currentAnimIndex = 0;
    session.currentRepeatIndex = 0;
    session.sessionTimer = def.duration ?? 5.0;
    session.isSessionPlaying = false;
    session.isSessionComplete = false;

    // Assigner les 2 rôles
    OccupancyManager.claimSlot('duo-zone', 'roleA', targetA);
    session.participantA = { characterId: targetA, role: 'roleA', isReady: false };

    OccupancyManager.claimSlot('duo-zone', 'roleB', targetB);
    session.participantB = { characterId: targetB, role: 'roleB', isReady: false };

    appLog('duo-zone', `🎮 Inventaire Personnage : "${def.label}" (x${this.repeatsPerAnim}) assignée à ${targetA} (Meneur) et ${targetB} (Partenaire aléatoire) !`);

    // Émettre l'invitation prioritaire aux 2 PNJs ciblés
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetA, fromId: 'Inventory', forceRole: 'roleA', objectId: 'duo-zone', slotId: 'duo-random' }
    }));
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetB, fromId: 'Inventory', forceRole: 'roleB', objectId: 'duo-zone', slotId: 'duo-random' }
    }));

    this.emitChange();
    return { targetA, targetB };
  }
}

export const duoSessionManager = new DuoSessionManager();
