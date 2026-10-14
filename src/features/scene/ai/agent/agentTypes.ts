export interface AgentState {
  x: number;
  y: number;
  z: number;
  rotY: number;
  animation: string;
  isSpawned: boolean;
}

export type AgentStatus = 'WAITING' | 'FALLING' | 'LANDING' | 'TRANSITIONING' | 'IDLE' | 'MOVING' | 'INTERACTING' | 'FINISHED' | 'BLOCKED';

export interface ResolvedInstructionCoords {
  owner?: string;
  tx: number;
  ty?: number;
  tz: number;
  label: string;
  rotY?: number;
  anim?: string;
  duration?: number;
  repeatCount?: number;
  repeatVariation?: boolean;
}
