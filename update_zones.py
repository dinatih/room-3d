import re

with open('src/features/scene/ai/ZoneNodes.ts', 'r') as f:
    content = f.read()

zones_addition = """  Bureau_1: { id: 'Bureau_1', x: 73.5, z: 50 },
  Bureau_2: { id: 'Bureau_2', x: 200, z: 140 },
  Lit_Ouest: { id: 'Lit_Ouest', x: 120, z: 172 },
  Lit_Est: { id: 'Lit_Est', x: 210, z: 190 },
  Baignoire: { id: 'Baignoire', x: 120, z: -250 },
  Douche: { id: 'Douche', x: 35, z: 650 },
  Canape_Est: { id: 'Canape_Est', x: 270, z: -80 },
  Canape_Ouest: { id: 'Canape_Ouest', x: 100, z: -50 },
  Cuisine: { id: 'Cuisine', x: 35, z: 250 },
  Kallax_NE: { id: 'Kallax_NE', x: 240, z: 38 },
  Fond_Jardin: { id: 'Fond_Jardin', x: 150, z: -350 },
};"""
content = re.sub(r'};\s*(?=\nexport const ACTION_GO_TO_TOILET)', zones_addition, content)

content = content.replace("rotY: Math.PI / 2 },\n\n  // Retour au couloir", "rotY: -Math.PI / 2 },\n\n  // Retour au couloir")

actions_addition = """
export const ACTION_SIT_DESK_1: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Bureau_1' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_SIT_DESK_2: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Bureau_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_BED_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: -Math.PI / 2 },
];

export const ACTION_BED_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },
];

export const ACTION_BATHTUB: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: 0 },
];

export const ACTION_SHOWER: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Douche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: Math.PI / 2 },
];

export const ACTION_GARDEN_SOFA_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_GARDEN_SOFA_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },
];

export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Cuisine' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: -Math.PI / 2 },
];

export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Kallax_NE' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_hand_raising.glb', duration: 5.0, rotY: -Math.PI / 2 },
];

export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Sortie' },
  { type: 'MOVE_TO', targetNodeId: 'Fond_Jardin' },
  { type: 'INTERACT', animation: 'idle', duration: 15.0, rotY: Math.PI },
];
"""

content += actions_addition

with open('src/features/scene/ai/ZoneNodes.ts', 'w') as f:
    f.write(content)
