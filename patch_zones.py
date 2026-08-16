import re

with open('src/features/scene/ai/ZoneNodes.ts', 'r') as f:
    content = f.read()

# Replace zones
zones_replacement = """  Placard_Couloir: { id: 'Placard_Couloir', x: 215, z: 435 },
  Placard_SDB: { id: 'Placard_SDB', x: 85, z: 610 },
  Congelateur: { id: 'Congelateur', x: 250, z: 320 },
  SDB_Drona_Ouest: { id: 'SDB_Drona_Ouest', x: 40, z: 490 },
  SDB_Drona_Est: { id: 'SDB_Drona_Est', x: 140, z: 490 },
  Miroir_Sud: { id: 'Miroir_Sud', x: 160, z: 350 },
  
  Lit_Ouest: { id: 'Lit_Ouest', x: 90, z: 80 },
  Lit_Ouest_2: { id: 'Lit_Ouest_2', x: 90, z: 150 },
  Lit_Ouest_3: { id: 'Lit_Ouest_3', x: 90, z: 220 },
  Lit_Ouest_Couche: { id: 'Lit_Ouest_Couche', x: 74, z: 150 },
  
  Lit_Est: { id: 'Lit_Est', x: 245, z: 120 },
  Lit_Est_2: { id: 'Lit_Est_2', x: 245, z: 190 },
  Lit_Est_3: { id: 'Lit_Est_3', x: 245, z: 260 },
  Lit_Est_Couche: { id: 'Lit_Est_Couche', x: 270, z: 190 },
  
  Canape_Est: { id: 'Canape_Est', x: 270, z: -20 },
  Canape_Est_2: { id: 'Canape_Est_2', x: 270, z: -80 },
  Canape_Est_3: { id: 'Canape_Est_3', x: 270, z: -140 },
  Canape_Est_Allonge: { id: 'Canape_Est_Allonge', x: 270, z: -80 },
  
  Canape_Ouest: { id: 'Canape_Ouest', x: 100, z: -20 },
  Canape_Ouest_2: { id: 'Canape_Ouest_2', x: 100, z: -60 },
  Canape_Ouest_3: { id: 'Canape_Ouest_3', x: 100, z: -100 },
  
  Baignoire: { id: 'Baignoire', x: 120, z: -250 },
  Baignoire_Ouest: { id: 'Baignoire_Ouest', x: 80, z: -280 },
  Baignoire_Est: { id: 'Baignoire_Est', x: 160, z: -220 },

  Devant_Jardin_Voisin_Ouest: { id: 'Devant_Jardin_Voisin_Ouest', x: 30, z: -200 },
  Devant_Jardin_Voisin_Est: { id: 'Devant_Jardin_Voisin_Est', x: 286, z: -200 },
"""

content = re.sub(r"  Placard_Couloir:.*?Baignoire_Est: \{ id: 'Baignoire_Est', x: 160, z: -250 \},", zones_replacement.strip('\n'), content, flags=re.DOTALL)

# Update actions
content = content.replace("export const ACTION_BED_WEST: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },\n];", """export const ACTION_BED_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Ouest_Couche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },
];""")

content = content.replace("export const ACTION_BED_EAST: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Lit_Est' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },\n];", """export const ACTION_BED_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Lit_Est_Couche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_1.glb', duration: 10.0, rotY: Math.PI / 2 },
];""")

content = content.replace("export const ACTION_BATHTUB: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Baignoire' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: 0 },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },\n];", """export const ACTION_BATHTUB: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: 0 },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: 0 },
  { type: 'MOVE_TO', targetNodeId: 'Baignoire_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: 0 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];""")

content = content.replace("export const ACTION_GARDEN_SOFA_EAST: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Canape_Est' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 10.0, rotY: Math.PI },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },\n];", """export const ACTION_GARDEN_SOFA_EAST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Est_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_female_sitting_pose_3.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];""")

content = content.replace("export const ACTION_GARDEN_SOFA_WEST: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 10.0, rotY: Math.PI },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },\n];", """export const ACTION_GARDEN_SOFA_WEST: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest_2' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Canape_Ouest_3' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_sitting_idle.glb', duration: 5.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];""")

content = content.replace("export const ACTION_KALLAX_NE: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Kallax_NE' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_hand_raising.glb', duration: 5.0, rotY: -Math.PI / 2 },\n];", """export const ACTION_KALLAX_NE: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Kallax_NE' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_hand_raising.glb', duration: 5.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Placard_Couloir' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Miroir_Sud' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: Math.PI },
];""")

content = content.replace("export const ACTION_COOKING: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Cuisine' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: -Math.PI / 2 },\n];", """export const ACTION_COOKING: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Cuisine' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Congelateur' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: -Math.PI / 2 },
];""")

content = content.replace("export const ACTION_SHOWER: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },\n  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },\n  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },\n  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },\n  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },\n  { type: 'MOVE_TO', targetNodeId: 'Douche' },\n  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: Math.PI / 2 },\n  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },\n  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },\n  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },\n  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },\n  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },\n];", """export const ACTION_SHOWER: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Douche' },
  { type: 'INTERACT', animation: 'media/sandbox/anims/anim_shaking_hands_2.glb', duration: 10.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'SDB_Drona_Ouest' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'SDB_Drona_Est' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Placard_SDB' },
  { type: 'INTERACT', animation: 'idle', duration: 3.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Entree_SDB' },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_SDB' },
  { type: 'INTERACT', triggerEventKey: 'bathroomDoor', animation: 'idle', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Couloir_Central' },
  { type: 'INTERACT', triggerEventKey: 'livingDoor', animation: 'idle', duration: 1.0 },
];""")

content = content.replace("export const ACTION_FRESH_AIR: AgentInstruction[] = [\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Fond_Jardin' },\n  { type: 'INTERACT', animation: 'idle', duration: 15.0, rotY: Math.PI },\n  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },\n  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },\n  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },\n];", """export const ACTION_FRESH_AIR: AgentInstruction[] = [
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', triggerTargetState: true, animation: 'media/sandbox/anims/anim_open_door_outwards.glb', duration: 1.5 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Fond_Jardin' },
  { type: 'INTERACT', animation: 'idle', duration: 10.0, rotY: Math.PI },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Jardin_Voisin_Ouest' },
  { type: 'INTERACT', animation: 'idle', duration: 5.0, rotY: -Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Jardin_Voisin_Est' },
  { type: 'INTERACT', animation: 'idle', duration: 5.0, rotY: Math.PI / 2 },
  { type: 'MOVE_TO', targetNodeId: 'Dans_Jardin' },
  { type: 'MOVE_TO', targetNodeId: 'Devant_Baie_Vitree' },
  { type: 'INTERACT', triggerEventKey: 'eastGlassDoor', animation: 'idle', duration: 1.0 },
];""")

with open('src/features/scene/ai/ZoneNodes.ts', 'w') as f:
    f.write(content)
