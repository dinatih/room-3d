import json
import struct

def load_bones(path):
    with open(path, 'rb') as f:
        data = f.read()
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    nodes = js.get('nodes', [])
    skins = js.get('skins', [])
    if not skins:
        return []
    joints = skins[0].get('joints', [])
    return [nodes[i].get('name') for i in joints]

xbot_bones = load_bones('public/media/sandbox/Xbot_official.glb')
lara_bones = load_bones('public/media/sandbox/lara_native.glb')

xbot_set = set(xbot_bones)
lara_set = set(lara_bones)

# Categorization and mapping
# 1. Root & Hips
root_mapping = [
    ("", "mixamorig_root_ground", "Point d'ancrage au sol (Lara)"),
    ("mixamorig:Hips", "mixamorig_root_hips", "Hanches / Racine physique"),
    ("", "mixamorig_pelvis", "Bassin intermédiaire (Lara)")
]

# 2. Spine & Head
spine_mapping = [
    ("mixamorig:Spine", "mixamorig_spine_lower", "Bas de la colonne"),
    ("mixamorig:Spine1", "", "Milieu de la colonne (X-Bot seul)"),
    ("mixamorig:Spine2", "mixamorig_spine_upper", "Haut de la colonne / Torse"),
    ("mixamorig:Neck", "mixamorig_head_neck_lower", "Cou"),
    ("mixamorig:Head", "mixamorig_head_neck_upper", "Tête"),
    ("mixamorig:HeadTop_End", "", "Sommet de la tête (X-Bot seul)"),
    ("mixamorig:LeftEye", "mixamorig_head_eyeball_left", "Œil gauche"),
    ("mixamorig:RightEye", "mixamorig_head_eyeball_right", "Œil droit")
]

# 3. Left Arm & Hand
left_arm_base = [
    ("mixamorig:LeftShoulder", "", "Épaule / Clavicule gauche"),
    ("mixamorig:LeftArm", "mixamorig_arm_left_shoulder_2", "Bras gauche (Shoulder/UpperArm)"),
    ("mixamorig:LeftForeArm", "mixamorig_arm_left_elbow", "Avant-bras gauche (Elbow)"),
    ("mixamorig:LeftHand", "mixamorig_arm_left_wrist", "Poignet / Main gauche"),
    ("", "mixamorig_weapon_left", "Point d'attache Arme gauche (Lara)")
]

# Left Fingers mapping
left_fingers = []
finger_names_map = [
    ("Thumb", "1"),
    ("Index", "2"),
    ("Middle", "3"),
    ("Ring", "4"),
    ("Pinky", "5")
]
for xbot_f, lara_num in finger_names_map:
    for i in range(1, 5):
        xb = f"mixamorig:LeftHand{xbot_f}{i}"
        lr = f"mixamorig_arm_left_finger_{lara_num}{chr(96+i)}" if i <= 3 else ""
        desc = f"Doigt gauche ({xbot_f}) - Phalange {i}"
        left_fingers.append((xb, lr, desc))

# 4. Right Arm & Hand
right_arm_base = [
    ("mixamorig:RightShoulder", "", "Épaule / Clavicule droite"),
    ("mixamorig:RightArm", "mixamorig_arm_right_shoulder_2", "Bras droit (Shoulder/UpperArm)"),
    ("mixamorig:RightForeArm", "mixamorig_arm_right_elbow", "Avant-bras droit (Elbow)"),
    ("mixamorig:RightHand", "mixamorig_arm_right_wrist", "Poignet / Main droite"),
    ("", "mixamorig_weapon_right", "Point d'attache Arme droite (Lara)")
]

right_fingers = []
for xbot_f, lara_num in finger_names_map:
    for i in range(1, 5):
        xb = f"mixamorig:RightHand{xbot_f}{i}"
        lr = f"mixamorig_arm_right_finger_{lara_num}{chr(96+i)}" if i <= 3 else ""
        desc = f"Doigt droit ({xbot_f}) - Phalange {i}"
        right_fingers.append((xb, lr, desc))

# 5. Left Leg
left_leg = [
    ("mixamorig:LeftUpLeg", "mixamorig_leg_left_thigh", "Cuisse gauche"),
    ("mixamorig:LeftLeg", "mixamorig_leg_left_knee", "Genou gauche"),
    ("mixamorig:LeftFoot", "mixamorig_leg_left_ankle", "Cheville gauche"),
    ("mixamorig:LeftToeBase", "mixamorig_leg_left_toes", "Orteils gauches"),
    ("mixamorig:LeftToe_End", "", "Bout des orteils gauches")
]

# 6. Right Leg
right_leg = [
    ("mixamorig:RightUpLeg", "mixamorig_leg_right_thigh", "Cuisse droite"),
    ("mixamorig:RightLeg", "mixamorig_leg_right_knee", "Genou droit"),
    ("mixamorig:RightFoot", "mixamorig_leg_right_ankle", "Cheville droite"),
    ("mixamorig:RightToeBase", "mixamorig_leg_right_toes", "Orteils droits"),
    ("mixamorig:RightToe_End", "", "Bout des orteils droits")
]

# 7. Lara specific - Hair / Accessories
lara_acc = [
    ("", "mixamorig_glasses", "Lunettes de Lara"),
]
for i in range(1, 7):
    lara_acc.append(("", f"mixamorig_head_hair_ponytail_{i}", f"Queue de cheval - Segment {i}"))

# 8. Lara specific - Face
lara_face = [
    ("", "mixamorig_head_jaw", "Mâchoire"),
    ("", "mixamorig_head_tongue", "Langue"),
    ("", "mixamorig_head_cheek_left", "Joue gauche"),
    ("", "mixamorig_head_cheek_right", "Joue droite"),
    ("", "mixamorig_head_nostril_left", "Narine gauche"),
    ("", "mixamorig_head_nostril_right", "Narine droite"),
    ("", "mixamorig_head_eyebrow_left_1", "Sourcil gauche - Interne"),
    ("", "mixamorig_head_eyebrow_left_2", "Sourcil gauche - Milieu"),
    ("", "mixamorig_head_eyebrow_left_3", "Sourcil gauche - Externe"),
    ("", "mixamorig_head_eyebrow_right_1", "Sourcil droit - Interne"),
    ("", "mixamorig_head_eyebrow_right_2", "Sourcil droit - Milieu"),
    ("", "mixamorig_head_eyebrow_right_3", "Sourcil droit - Externe"),
    ("", "mixamorig_head_eyelid_left_upper", "Paupière supérieure gauche"),
    ("", "mixamorig_head_eyelid_left_lower", "Paupière inférieure gauche"),
    ("", "mixamorig_head_eyelid_right_upper", "Paupière supérieure droite"),
    ("", "mixamorig_head_eyelid_right_lower", "Paupière inférieure droite"),
    ("", "mixamorig_head_lip_upper_middle", "Lèvre supérieure - Milieu"),
    ("", "mixamorig_head_lip_upper_left_1", "Lèvre supérieure - Gauche interne"),
    ("", "mixamorig_head_lip_upper_left_2", "Lèvre supérieure - Gauche externe"),
    ("", "mixamorig_head_lip_upper_right_1", "Lèvre supérieure - Droite interne"),
    ("", "mixamorig_head_lip_upper_right_2", "Lèvre supérieure - Droite externe"),
    ("", "mixamorig_head_lip_lower_middle", "Lèvre inférieure - Milieu"),
    ("", "mixamorig_head_lip_lower_left_1", "Lèvre inférieure - Gauche interne"),
    ("", "mixamorig_head_lip_lower_left_2", "Lèvre inférieure - Gauche externe"),
    ("", "mixamorig_head_lip_lower_right_1", "Lèvre inférieure - Droite interne"),
    ("", "mixamorig_head_lip_lower_right_2", "Lèvre inférieure - Droite externe")
]

all_sections = [
    ("1. Origine, Bassin et Hanches", root_mapping),
    ("2. Colonne Vertébrale, Cou et Tête", spine_mapping),
    ("3. Membres Supérieurs Gauches (Bras et Main)", left_arm_base + left_fingers),
    ("4. Membres Supérieurs Droits (Bras et Main)", right_arm_base + right_fingers),
    ("5. Membres Inférieurs Gauches (Jambe et Pied)", left_leg),
    ("6. Membres Inférieurs Droits (Jambe et Pied)", right_leg),
    ("7. Lara Croft - Cheveux et Accessoires", lara_acc),
    ("8. Lara Croft - Squelette Facial (Visage)", lara_face)
]

# Verifications
all_mapped_xbot = set()
all_mapped_lara = set()

for section_name, mapping in all_sections:
    for xb, lr, desc in mapping:
        if xb: all_mapped_xbot.add(xb)
        if lr: all_mapped_lara.add(lr)

missing_xbot = xbot_set - all_mapped_xbot
missing_lara = lara_set - all_mapped_lara

if missing_xbot:
    print(f"WARNING: Missing X-Bot bones: {missing_xbot}")
if missing_lara:
    print(f"WARNING: Missing Lara bones: {missing_lara}")

print(f"Total mapped X-Bot bones: {len(all_mapped_xbot)} / {len(xbot_set)}")
print(f"Total mapped Lara bones: {len(all_mapped_lara)} / {len(lara_set)}")

# Generate Markdown
md = []
md.append("## 6. Tableau Comparatif des Squelettes : X-Bot Official (67) vs Lara Croft (88)")
md.append("")
md.append("Ce tableau présente de manière exhaustive toutes les articulations des deux modèles pour identifier précisément les correspondances et les os spécifiques à chaque personnage.")
md.append("")

for section_name, mapping in all_sections:
    md.append(f"### {section_name}")
    md.append("")
    md.append("| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |")
    md.append("| :--- | :--- | :--- |")
    for xb, lr, desc in mapping:
        xb_str = f"`{xb}`" if xb else "—"
        lr_str = f"`{lr}`" if lr else "—"
        md.append(f"| {xb_str} | {lr_str} | {desc} |")
    md.append("")

print("\nMarkdown generated.")
with open('scratch/comparison_table.md', 'w') as f:
    f.write("\n".join(md))
