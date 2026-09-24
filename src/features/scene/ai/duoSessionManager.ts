import { DUO_ANIMATIONS, DuoAnimationDef } from './duoAnimations';
import { OccupancyManager } from './occupancyManager';
import { appLog } from '@features/ui/AppConsole';
import { cameraState } from '../cameraState';
import { AUTONOMOUS_NPC_IDS } from '../walkerConfig';
import { getSmartObject } from './smartObjectRegistry';

export type DuoRole = 'roleA' | 'roleB';

export interface DuoLocation {
  objectId: string;                    // ex: 'chair-office' ou 'duo-zone'
  slotId?: string;                     // ex: 'sit-cuddle' ou 'roleA'
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

type SessionListener = () => void;

class DuoSessionManager {
  public readonly basePos: [number, number, number] = [-200, 0, -300];
  private currentLocation: DuoLocation = {
    objectId: 'duo-zone',
    anchorPos: [-200, 0, -300],
    anchorRotY: 0,
  };

  private participantA: DuoSessionParticipant | null = null;
  private participantB: DuoSessionParticipant | null = null;
  
  private playlist: DuoAnimationDef[] = [];
  private currentAnimIndex = 0;
  private currentRepeatIndex = 0;
  public repeatsPerAnim = 3;
  private sessionTimer = 0;
  private isSessionPlaying = false;
  private isSessionComplete = false;

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
   * Tente de rejoindre la Duo Zone pour un PNJ autonome.
   */
  public joinDuoZone(characterId: string): DuoRole | null {
    if (this.participantA?.characterId === characterId) return 'roleA';
    if (this.participantB?.characterId === characterId) return 'roleB';

    if (!this.participantA) {
      if (!OccupancyManager.claimSlot('duo-zone', 'roleA', characterId)) {
        return null;
      }
      this.participantA = { characterId, role: 'roleA', isReady: false };
      this.initPlaylistIfFirst();
      this.emitChange();
      return 'roleA';
    }

    if (!this.participantB) {
      if (!OccupancyManager.claimSlot('duo-zone', 'roleB', characterId)) {
        return null;
      }
      this.participantB = { characterId, role: 'roleB', isReady: false };
      this.emitChange();
      return 'roleB';
    }

    return null;
  }

  /**
   * Initialise une séquence de 2 à 4 animations aléatoires pour la session.
   */
  private initPlaylistIfFirst() {
    this.currentAnimIndex = 0;
    this.currentRepeatIndex = 0;
    this.sessionTimer = 0;
    this.isSessionPlaying = false;
    this.isSessionComplete = false;
    
    // Choisir entre 2 et 4 animations aléatoires uniques
    const count = 2 + Math.floor(Math.random() * 3); // 2, 3 ou 4
    const shuffled = [...DUO_ANIMATIONS].sort(() => Math.random() - 0.5);
    this.playlist = shuffled.slice(0, count);
  }

  /**
   * Marque un participant comme physiquement arrivé sur le spot et prêt.
   */
  public markReady(characterId: string): void {
    if (this.participantA?.characterId === characterId) {
      this.participantA.isReady = true;
    }
    if (this.participantB?.characterId === characterId) {
      this.participantB.isReady = true;
    }

    // Si les deux sont prêts, démarrer la session avec le timer centralisé
    if (this.participantA?.isReady && this.participantB?.isReady && !this.isSessionPlaying) {
      this.isSessionPlaying = true;
      this.currentAnimIndex = 0;
      this.currentRepeatIndex = 0;
      const firstAnim = this.playlist[0];
      this.sessionTimer = firstAnim?.duration ?? 5.0;
      if (firstAnim) {
        appLog('duo-zone', `🎭 Duo démarré entre ${this.participantA.characterId} & ${this.participantB.characterId} : "${firstAnim.label}" (x${this.repeatsPerAnim}, ${this.playlist.length} anims, ${this.sessionTimer.toFixed(1)}s/clip)`);
      }
      this.emitChange();
    }
  }

  public getParticipantA(): DuoSessionParticipant | null {
    return this.participantA;
  }

  public getParticipantB(): DuoSessionParticipant | null {
    return this.participantB;
  }

  public getElapsedTimeInRepeat(): number {
    const currentAnim = this.playlist[this.currentAnimIndex];
    const duration = currentAnim?.duration ?? 5.0;
    return Math.max(0, duration - this.sessionTimer);
  }


  public isWaitingPartner(characterId: string): boolean {
    if (this.participantA?.characterId === characterId && !this.participantB?.isReady) return true;
    if (this.participantB?.characterId === characterId && !this.participantA?.isReady) return true;
    return false;
  }

  public isPlaying(): boolean {
    return this.isSessionPlaying;
  }

  public isCompletedFor(characterId: string): boolean {
    // Session explicitement terminée (toutes les anims jouées)
    if (this.isSessionComplete) return true;
    // Session vide = aucun participant inscrit = terminée
    if (!this.participantA && !this.participantB) return true;
    // Si ce PNJ n'est pas participant, la session est terminée pour lui
    const isParticipant = this.participantA?.characterId === characterId
                       || this.participantB?.characterId === characterId;
    if (!isParticipant) return true;
    // Si le PNJ est participant, il attend ou joue → pas terminé
    return false;
  }

  public getCurrentLocation(): DuoLocation {
    return this.currentLocation;
  }

  /**
   * Récupère les données d'animation et de placement calculées pour l'animation courante.
   */
  public getCurrentAnimState(): DuoCurrentAnimState | null {
    if (!this.isSessionPlaying || this.currentAnimIndex >= this.playlist.length) return null;
    const def = this.playlist[this.currentAnimIndex];
    if (!def) return null;

    const [bx, by, bz] = this.currentLocation.anchorPos;
    const ry = this.currentLocation.anchorRotY;
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
  public getWaitPosB(): [number, number, number] {
    const def = this.playlist[0];
    const [bx, by, bz] = this.currentLocation.anchorPos;
    const ry = this.currentLocation.anchorRotY;
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    const localB: [number, number, number] = def?.offsetB ?? [0, 0, 0];
    const [lx, ly, lz] = localB;
    return [bx + lx * cos + lz * sin, by + ly, bz - lx * sin + lz * cos];
  }

  /**
   * Horloge centrale de la session Duo.
   * Seul le rôle A (meneur) décrémente le timer pour garantir une synchronisation parfaite sans doublon.
   */
  public tickSession(characterId: string, dt: number): void {
    if (!this.isSessionPlaying || this.isSessionComplete) return;
    if (this.participantA?.characterId !== characterId) return;

    this.sessionTimer -= dt;
    if (this.sessionTimer <= 0) {
      if (this.currentRepeatIndex + 1 < this.repeatsPerAnim) {
        this.currentRepeatIndex++;
        const currentAnim = this.playlist[this.currentAnimIndex];
        this.sessionTimer = currentAnim?.duration ?? 5.0;
        appLog('duo-zone', `🔄 Répétition Duo (${this.currentRepeatIndex + 1}/${this.repeatsPerAnim}) : "${currentAnim?.label}"`);
        this.emitChange();
      } else {
        this.currentRepeatIndex = 0;
        this.currentAnimIndex++;
        if (this.currentAnimIndex < this.playlist.length) {
          const nextAnim = this.playlist[this.currentAnimIndex];
          this.sessionTimer = nextAnim?.duration ?? 5.0;
          appLog('duo-zone', `🎬 Nouvelle animation Duo (${this.currentAnimIndex + 1}/${this.playlist.length}) : "${nextAnim?.label}" (x${this.repeatsPerAnim})`);
          this.emitChange();
        } else {
          // Fin de la session complète (toutes les anims jouées 3 fois)
          this.isSessionPlaying = false;
          this.isSessionComplete = true;
          appLog('duo-zone', `✨ Session Duo terminée ! Les 2 PNJs reprennent leur vie autonome.`);
          this.emitChange();
        }
      }
    }
  }

  /**
   * Un PNJ quitte la zone (suite à fin normale ou timeout).
   */
  public leaveDuoZone(characterId: string): void {
    const loc = this.currentLocation;
    const objId = loc.objectId;
    const slotId = loc.slotId;

    if (this.participantA?.characterId === characterId) {
      if (objId === 'duo-zone') {
        OccupancyManager.releaseSlot('duo-zone', 'roleA', characterId);
      } else {
        if (slotId) {
          OccupancyManager.releaseSlot(objId, `${slotId}:roleA`, characterId);
          OccupancyManager.releaseSlot(objId, slotId, characterId);
        }
        OccupancyManager.releaseSlot(objId, 'roleA', characterId);
      }
      this.participantA = null;
    }
    if (this.participantB?.characterId === characterId) {
      if (objId === 'duo-zone') {
        OccupancyManager.releaseSlot('duo-zone', 'roleB', characterId);
      } else {
        if (slotId) {
          OccupancyManager.releaseSlot(objId, `${slotId}:roleB`, characterId);
          OccupancyManager.releaseSlot(objId, slotId, characterId);
        }
        OccupancyManager.releaseSlot(objId, 'roleB', characterId);
      }
      this.participantB = null;
    }

    if (!this.participantA && !this.participantB) {
      this.isSessionPlaying = false;
      this.isSessionComplete = false;
      this.currentAnimIndex = 0;
      this.currentRepeatIndex = 0;
      this.sessionTimer = 0;
      this.playlist = [];
      this.currentLocation = {
        objectId: 'duo-zone',
        anchorPos: [-200, 0, -300],
        anchorRotY: 0,
      };
    }
    this.emitChange();
  }

  /**
   * Trouve le PNJ autonome le plus proche du spot actif et lui envoie une invitation.
   */
  public inviteNearestNpc(callerId: string): string | null {
    if (this.participantA && this.participantB) return null;

    const [bx, , bz] = this.currentLocation.anchorPos;
    let closestId: string | null = null;
    let minDistance = Infinity;

    for (const npcId of AUTONOMOUS_NPC_IDS) {
      if (npcId === callerId) continue;
      if (this.participantA?.characterId === npcId || this.participantB?.characterId === npcId) continue;

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
      const locLabel = this.currentLocation.objectId === 'duo-zone'
        ? '✨ Scène Duo'
        : (getSmartObject(this.currentLocation.objectId)?.name || this.currentLocation.objectId);
      appLog('duo-zone', `📢 ${callerId} invite ${closestId} (${minDistance.toFixed(0)} cm) à rejoindre ${locLabel} !`);
      document.dispatchEvent(new CustomEvent('npc-invite-duo', {
        detail: {
          targetId: closestId,
          fromId: callerId,
          objectId: this.currentLocation.objectId,
          slotId: this.currentLocation.slotId,
        }
      }));
      return closestId;
    }

    return null;
  }

  /**
   * Résout la playlist d'animations pour un slot ou un SmartObject donné.
   */
  public resolveSlotPlaylist(objectId: string, slotId?: string): DuoAnimationDef[] {
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
    const count = slot?.duoCount ?? 3;
    return [...DUO_ANIMATIONS].sort(() => Math.random() - 0.5).slice(0, count);
  }

  /**
   * Démarre une session Duo directement à partir d'un SmartObject et de son slot,
   * en résolvant automatiquement sa playlist et les participants.
   */
  public startDuoSession(
    objectId: string,
    slotId?: string,
    leaderId?: string,
    partnerId?: string
  ): { targetA: string; targetB: string; posA: [number,number,number]; posB: [number,number,number]; rotA: number; rotB: number; actualSlotId: string } | null {
    const obj = getSmartObject(objectId);
    if (!obj) return null;

    const slot = obj.slots.find(s => s.slotId === slotId) || obj.slots[0];
    const actualSlotId = slot?.slotId || slotId || 'duo';
    const playlist = this.resolveSlotPlaylist(objectId, actualSlotId);
    if (playlist.length === 0) return null;
    const def = playlist[0];

    const anchorPos: [number, number, number] = slot?.offset ?? obj.position ?? [0, 0, 0];
    const anchorRotY: number = slot?.rotY ?? obj.rotationY ?? 0;
    const [bx, by, bz] = anchorPos;

    // Résolution Leader (A) et Partenaire (B)
    const getCandidates = (excludeId?: string) => {
      return Object.keys(cameraState.positions)
        .filter(id => id !== 'shiba' && id !== 'robin' && id !== excludeId)
        .sort((a, b) => {
          const pa = cameraState.positions[a];
          const pb = cameraState.positions[b];
          const da = pa ? Math.hypot(pa.x - bx, pa.z - bz) : Infinity;
          const db = pb ? Math.hypot(pb.x - bx, pb.z - bz) : Infinity;
          return da - db;
        });
    };

    const targetA = leaderId || getCandidates()[0] || 'native';
    const targetB = partnerId || getCandidates(targetA)[0] || (targetA === 'native' ? 'rosanna' : 'native');
    if (!targetA || !targetB || targetA === targetB) return null;

    // Définir l'emplacement actif
    this.currentLocation = { objectId, slotId: actualSlotId, anchorPos, anchorRotY };

    // Configurer la session
    this.playlist = playlist;
    this.currentAnimIndex = 0;
    this.currentRepeatIndex = 0;
    this.repeatsPerAnim = 1;
    this.sessionTimer = def.duration ?? 5.0;
    this.isSessionPlaying = false;
    this.isSessionComplete = false;

    // Réservations d'occupation
    OccupancyManager.claimSlot(objectId, `${actualSlotId}:roleA`, targetA);
    OccupancyManager.claimSlot(objectId, actualSlotId, targetA);
    this.participantA = { characterId: targetA, role: 'roleA', isReady: false };

    OccupancyManager.claimSlot(objectId, `${actualSlotId}:roleB`, targetB);
    this.participantB = { characterId: targetB, role: 'roleB', isReady: false };

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

    // 1. Vérifier si des participants sont déjà présents sur la Duo Zone
    let targetA: string | null = this.participantA?.characterId || null;
    let targetB: string | null = this.participantB?.characterId || null;

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
    this.playlist = [def];
    this.currentAnimIndex = 0;
    this.currentRepeatIndex = 0;
    this.sessionTimer = def.duration ?? 5.0;
    this.isSessionComplete = false;

    // Vérifier la présence physique des participants (à moins de 60 cm du centre de duo-zone)
    const posA = cameraState.positions[targetA];
    const posB = cameraState.positions[targetB];
    const isAlreadyThereA = posA ? Math.hypot(posA.x - bx, posA.z - bz) < 80 : false;
    const isAlreadyThereB = posB ? Math.hypot(posB.x - bx, posB.z - bz) < 80 : false;

    // Assigner les rôles
    OccupancyManager.claimSlot('duo-zone', 'roleA', targetA);
    this.participantA = { characterId: targetA, role: 'roleA', isReady: isAlreadyThereA };

    OccupancyManager.claimSlot('duo-zone', 'roleB', targetB);
    this.participantB = { characterId: targetB, role: 'roleB', isReady: isAlreadyThereB };

    // Si les 2 sont déjà sur place, lancer directement la session
    if (isAlreadyThereA && isAlreadyThereB) {
      this.isSessionPlaying = true;
      appLog('duo-zone', `🎭 Duo instantané (2 déjà sur place) : "${def.label}" avec ${targetA} & ${targetB}`);
    } else {
      this.isSessionPlaying = false;
      appLog('duo-zone', `🎮 Appel Duo : "${def.label}" assignée à ${targetA} (Meneur) et ${targetB} (Partenaire)`);
    }

    // Inviter les personnages
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetA, fromId: 'SidePanel', forceRole: 'roleA', alreadyThere: isAlreadyThereA }
    }));
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetB, fromId: 'SidePanel', forceRole: 'roleB', alreadyThere: isAlreadyThereB }
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

    // Si aucun partenaire n'est spécifié, choisir un autre PNJ autonome au hasard
    let targetB = partnerId;
    if (!targetB) {
      const candidates = Array.from(AUTONOMOUS_NPC_IDS).filter(id => id !== targetA);
      targetB = candidates[Math.floor(Math.random() * candidates.length)] || (targetA === 'native' ? 'rosanna' : 'native');
    }

    if (!targetA || !targetB || targetA === targetB) {
      return null;
    }

    // Libérer les anciens occupants éventuels
    if (this.participantA && this.participantA.characterId !== targetA) {
      OccupancyManager.releaseSlot('duo-zone', 'roleA', this.participantA.characterId);
    }
    if (this.participantB && this.participantB.characterId !== targetB) {
      OccupancyManager.releaseSlot('duo-zone', 'roleB', this.participantB.characterId);
    }

    // Configurer la session avec cette animation unique jouée 3 fois
    this.playlist = [def];
    this.currentAnimIndex = 0;
    this.currentRepeatIndex = 0;
    this.sessionTimer = def.duration ?? 5.0;
    this.isSessionPlaying = false;
    this.isSessionComplete = false;

    // Assigner les 2 rôles
    OccupancyManager.claimSlot('duo-zone', 'roleA', targetA);
    this.participantA = { characterId: targetA, role: 'roleA', isReady: false };

    OccupancyManager.claimSlot('duo-zone', 'roleB', targetB);
    this.participantB = { characterId: targetB, role: 'roleB', isReady: false };

    appLog('duo-zone', `🎮 Inventaire Personnage : "${def.label}" (x${this.repeatsPerAnim}) assignée à ${targetA} (Meneur) et ${targetB} (Partenaire aléatoire) !`);

    // Émettre l'invitation prioritaire aux 2 PNJs ciblés
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetA, fromId: 'Inventory', forceRole: 'roleA' }
    }));
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetB, fromId: 'Inventory', forceRole: 'roleB' }
    }));

    this.emitChange();
    return { targetA, targetB };
  }
}

export const duoSessionManager = new DuoSessionManager();
