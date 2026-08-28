import { DUO_ANIMATIONS, DuoAnimationDef } from './duoAnimations';
import { OccupancyManager } from './occupancyManager';
import { appLog } from '@features/ui/AppConsole';
import { cameraState } from '../cameraState';
import { AUTONOMOUS_NPC_IDS } from '../walkerConfig';

export type DuoRole = 'roleA' | 'roleB';

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

  private participantA: DuoSessionParticipant | null = null;
  private participantB: DuoSessionParticipant | null = null;
  
  private playlist: DuoAnimationDef[] = [];
  private currentAnimIndex = 0;
  private currentRepeatIndex = 0;
  public readonly repeatsPerAnim = 3;
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

  public isWaitingPartner(characterId: string): boolean {
    if (this.participantA?.characterId === characterId && !this.participantB?.isReady) return true;
    if (this.participantB?.characterId === characterId && !this.participantA?.isReady) return true;
    return false;
  }

  public isPlaying(): boolean {
    return this.isSessionPlaying;
  }

  public isCompletedFor(characterId: string): boolean {
    if (this.isSessionComplete) return true;
    if (!this.participantA && !this.participantB) return true;
    const isParticipant = this.participantA?.characterId === characterId || this.participantB?.characterId === characterId;
    return !isParticipant;
  }

  /**
   * Récupère les données d'animation et de placement calculées pour l'animation courante.
   */
  public getCurrentAnimState(): DuoCurrentAnimState | null {
    if (!this.isSessionPlaying || this.currentAnimIndex >= this.playlist.length) return null;
    const def = this.playlist[this.currentAnimIndex];
    if (!def) return null;

    const [bx, by, bz] = this.basePos;
    const dist = def.dist ?? 50;

    let posA: [number, number, number] = [bx + dist, by, bz];
    let posB: [number, number, number] = [bx, by, bz];

    if (def.offsetA) posA = [bx + def.offsetA[0], by + def.offsetA[1], bz + def.offsetA[2]];
    if (def.offsetB) posB = [bx + def.offsetB[0], by + def.offsetB[1], bz + def.offsetB[2]];

    const rotA = def.rotA !== undefined ? def.rotA : 0;
    const rotB = def.rotB !== undefined ? def.rotB : 0;

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
    if (this.participantA?.characterId === characterId) {
      OccupancyManager.releaseSlot('duo-zone', 'roleA', characterId);
      this.participantA = null;
    }
    if (this.participantB?.characterId === characterId) {
      OccupancyManager.releaseSlot('duo-zone', 'roleB', characterId);
      this.participantB = null;
    }

    if (!this.participantA && !this.participantB) {
      this.isSessionPlaying = false;
      this.isSessionComplete = false;
      this.currentAnimIndex = 0;
      this.currentRepeatIndex = 0;
      this.sessionTimer = 0;
      this.playlist = [];
    }
    this.emitChange();
  }

  /**
   * Trouve le PNJ autonome le plus proche de la Duo Zone et lui envoie une invitation.
   */
  public inviteNearestNpc(callerId: string): string | null {
    if (this.participantA && this.participantB) return null;

    const [bx, , bz] = this.basePos;
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
      appLog('duo-zone', `📢 ${callerId} invite ${closestId} (${minDistance.toFixed(0)} cm) à rejoindre la ✨ Scène Duo !`);
      document.dispatchEvent(new CustomEvent('npc-invite-duo', {
        detail: { targetId: closestId, fromId: callerId }
      }));
      return closestId;
    }

    return null;
  }

  /**
   * Force le déclenchement d'une animation de couple spécifique (ex: depuis le SidePanel)
   * en appelant les 2 PNJs autonomes les plus proches de la Duo Zone pour la jouer 3 fois.
   */
  public forceDuoAnimation(def: DuoAnimationDef): { targetA: string; targetB: string } | null {
    const [bx, , bz] = this.basePos;

    // Trier tous les PNJs autonomes par distance croissante au centre de la Duo Zone
    const sortedNpcs: { id: string; dist: number }[] = [];
    for (const npcId of AUTONOMOUS_NPC_IDS) {
      const pos = cameraState.positions[npcId];
      const dist = pos ? Math.hypot(pos.x - bx, pos.z - bz) : Infinity;
      sortedNpcs.push({ id: npcId, dist });
    }
    sortedNpcs.sort((a, b) => a.dist - b.dist);

    const availableIds = sortedNpcs.map(n => n.id);
    const targetA = availableIds[0] || 'native';
    const targetB = availableIds[1] || 'rosanna';

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

    appLog('duo-zone', `🎮 Sélection SidePanel : "${def.label}" (x${this.repeatsPerAnim}) assignée à ${targetA} (Meneur) et ${targetB} (Partenaire) !`);

    // Émettre l'invitation prioritaire aux 2 PNJs ciblés
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetA, fromId: 'SidePanel', forceRole: 'roleA' }
    }));
    document.dispatchEvent(new CustomEvent('npc-invite-duo', {
      detail: { targetId: targetB, fromId: 'SidePanel', forceRole: 'roleB' }
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
