export interface SmartAction {
  actionId: string;
  position: [number, number, number]; // [x, y, z] target
  rotationY: number; // orientation target
  animation?: string;
  duration?: number;
}

export interface ZoneNode {
  id: string;
  x: number;
  z: number;
}

export type InstructionType = 'MOVE_TO' | 'INTERACT' | 'WAIT';

export interface AgentInstruction {
  type: InstructionType;
  targetNodeId?: string; // for MOVE_TO
  targetPos?: [number, number, number]; // direct position instead of node
  actionId?: string; // for INTERACT
  animation?: string; // animation to play
  duration?: number; // for WAIT or INTERACT
  triggerEventKey?: string; // event to dispatch
  rotY?: number; // target rotation to face during interaction
}
