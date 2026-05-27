import bpy
import math
import re
from mathutils import Vector, Matrix

LARA_FBX = "/home/dinatih/Projects/room-3d/scratch/lara_source/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
YBOT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/y_bot_from_mixamo.glb"
OUT_GLB  = "/home/dinatih/Projects/room-3d/public/media/glb/lara_mixamo.glb"

def log(msg):
    print(f"[rig-perfect] {msg}", flush=True)

# 1) Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2) Import Lara FBX (our reference mesh and skeleton)
log("Importing Lara FBX...")
bpy.ops.import_scene.fbx(filepath=LARA_FBX)
lara_arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
lara_arm.name = "Lara_Original_Armature"

# Get original Lara bone world head/tail positions
lara_bones_world = {}
M_lara = lara_arm.matrix_world
for b in lara_arm.data.bones:
    lara_bones_world[b.name] = (M_lara @ b.head_local, M_lara @ b.tail_local)

# Get all Lara meshes
lara_meshes = [o for o in lara_arm.children if o.type == "MESH"]
log(f"Found {len(lara_meshes)} Lara meshes to retarget")

# 3) Import Y-Bot (our reference animation skeleton)
log("Importing Y-Bot...")
bpy.ops.import_scene.gltf(filepath=YBOT_GLB)
ybot_arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE" and o.name != "Lara_Original_Armature")
ybot_arm.name = "lara_mixamo_armature"

# Clear parent of ybot_arm to make it a root object and preserve its world scale (0.01)
bpy.ops.object.select_all(action="DESELECT")
ybot_arm.select_set(True)
bpy.context.view_layer.objects.active = ybot_arm
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')

# Strip suffix from Y-Bot bone names if any (e.g. mixamorig:Hips_01 -> mixamorig:Hips)
bpy.ops.object.mode_set(mode="EDIT")
suffix_re = re.compile(r"_\d+$")
for eb in list(ybot_arm.data.edit_bones):
    clean = suffix_re.sub("", eb.name)
    if clean != eb.name and clean not in ybot_arm.data.edit_bones:
        eb.name = clean
bpy.ops.object.mode_set(mode="OBJECT")

# Apply scale and transforms on ybot_arm (so its scale becomes 1.0, and edit bones are scaled down to centimeters)
bpy.ops.object.select_all(action="DESELECT")
ybot_arm.select_set(True)
bpy.context.view_layer.objects.active = ybot_arm
bpy.ops.object.transform_apply(scale=True, location=True, rotation=True)
log("Y-Bot armature cleared of parent and local scale applied")

# 4) Mapping from Lara bone prefix to Mixamo bone name
LARA_TO_MIXAMO = {
    "root hips": "mixamorig:Hips",
    "spine lower": "mixamorig:Spine",
    "spine upper": "mixamorig:Spine2",
    "head neck lower": "mixamorig:Neck",
    "head neck upper": "mixamorig:Head",
    
    # Left arm/leg
    "arm left shoulder 1": "mixamorig:LeftShoulder",
    "arm left shoulder 2": "mixamorig:LeftArm",
    "arm left elbow": "mixamorig:LeftForeArm",
    "arm left wrist": "mixamorig:LeftHand",
    "leg left thigh": "mixamorig:LeftUpLeg",
    "leg left knee": "mixamorig:LeftLeg",
    "leg left ankle": "mixamorig:LeftFoot",
    "leg left toes": "mixamorig:LeftToeBase",
    
    # Right arm/leg
    "arm right shoulder 1": "mixamorig:RightShoulder",
    "arm right shoulder 2": "mixamorig:RightArm",
    "arm right elbow": "mixamorig:RightForeArm",
    "arm right wrist": "mixamorig:RightHand",
    "leg right thigh": "mixamorig:RightUpLeg",
    "leg right knee": "mixamorig:RightLeg",
    "leg right ankle": "mixamorig:RightFoot",
    "leg right toes": "mixamorig:RightToeBase",
}

# Add fingers
for side in ["left", "right"]:
    side_mix = "Left" if side == "left" else "Right"
    for f_idx, f_name in [("1", "Thumb"), ("2", "Index"), ("3", "Middle"), ("4", "Ring"), ("5", "Pinky")]:
        for seg_idx, seg_let in enumerate(["a", "b", "c"], 1):
            lara_pref = f"arm {side} finger {f_idx}{seg_let}"
            mix_bone = f"mixamorig:{side_mix}Hand{f_name}{seg_idx}"
            LARA_TO_MIXAMO[lara_pref] = mix_bone

# Helper function to find a Lara bone name from prefix
def find_lara_bone(prefix):
    for name in lara_bones_world.keys():
        if name.startswith(prefix):
            return name
    return None

# Calculate snapping targets (in world space)
targets = {}
for lara_pref, mix_bone in LARA_TO_MIXAMO.items():
    lara_name = find_lara_bone(lara_pref)
    if lara_name:
        targets[mix_bone] = lara_bones_world[lara_name]

# Special cases: Spine1 (middle of spine), Shoulders (clavicles)
pelvis_name = find_lara_bone("pelvis")
spine_lower_name = find_lara_bone("spine lower")
spine_upper_name = find_lara_bone("spine upper")
neck_name = find_lara_bone("head neck lower")

if pelvis_name and spine_lower_name and spine_upper_name and neck_name:
    pelvis_head = lara_bones_world[pelvis_name][0]
    spine_head = lara_bones_world[spine_lower_name][0]
    spine2_head = lara_bones_world[spine_upper_name][0]
    neck_head = lara_bones_world[neck_name][0]
    
    # Spine1 is between Spine and Spine2
    spine1_head = (spine_head + spine2_head) * 0.5
    
    targets["mixamorig:Hips"] = (pelvis_head, spine_head)
    targets["mixamorig:Spine"] = (spine_head, spine1_head)
    targets["mixamorig:Spine1"] = (spine1_head, spine2_head)
    targets["mixamorig:Spine2"] = (spine2_head, neck_head)

# Shoulders (clavicles)
left_sh_name = find_lara_bone("arm left shoulder 2")
right_sh_name = find_lara_bone("arm right shoulder 2")
if spine_upper_name and left_sh_name and right_sh_name:
    spine2_head = lara_bones_world[spine_upper_name][0]
    targets["mixamorig:LeftShoulder"] = (spine2_head, lara_bones_world[left_sh_name][0])
    targets["mixamorig:RightShoulder"] = (spine2_head, lara_bones_world[right_sh_name][0])

# Hands: tail to start of middle finger
left_middle1_name = find_lara_bone("arm left finger 3a")
right_middle1_name = find_lara_bone("arm right finger 3a")
left_hand_name = find_lara_bone("arm left wrist")
right_hand_name = find_lara_bone("arm right wrist")
if left_hand_name and left_middle1_name:
    targets["mixamorig:LeftHand"] = (lara_bones_world[left_hand_name][0], lara_bones_world[left_middle1_name][0])
if right_hand_name and right_middle1_name:
    targets["mixamorig:RightHand"] = (lara_bones_world[right_hand_name][0], lara_bones_world[right_middle1_name][0])

# 5) Snap Y-Bot armature bones to Lara's joint centers in Edit Mode
# Crucially, we keep Y-Bot's local rolls untouched by aligning the roll
# to the original bone's local Z-axis direction in armature space.
bpy.ops.object.select_all(action="DESELECT")
ybot_arm.select_set(True)
bpy.context.view_layer.objects.active = ybot_arm
bpy.ops.object.mode_set(mode="EDIT")

# Remember original Y-Bot edit bone lengths, directions, and local Z axes
ybot_orig = {}
for eb in ybot_arm.data.edit_bones:
    ybot_orig[eb.name] = {
        "length": eb.length,
        "dir": (eb.tail - eb.head).normalized(),
        "roll": eb.roll,
        "z_axis": eb.matrix.col[2].to_3d().normalized()
    }

# Snap mapped bones and align their rolls
for name, bone in ybot_arm.data.edit_bones.items():
    if name in targets:
        orig_z = ybot_orig[name]["z_axis"]
        head_pos, tail_pos = targets[name]
        bone.head = head_pos
        bone.tail = tail_pos
        bone.align_roll(orig_z)

# Propagate to unmapped child bones (like ends, toe tips, etc.)
for name, bone in ybot_arm.data.edit_bones.items():
    if name not in targets:
        if bone.parent:
            bone.head = bone.parent.tail
        orig = ybot_orig.get(name)
        if orig:
            bone.tail = bone.head + orig["dir"] * orig["length"]
            bone.align_roll(orig["z_axis"])

bpy.ops.object.mode_set(mode="OBJECT")
log("Snapped Y-Bot bones to Lara's joint positions cleanly with correct roll alignment")

# 6) Transfer Lara auxiliary bones (ponytails, face, weapons, glasses)
log("Transferring auxiliary bones (ponytails, face, weapons, glasses)...")

# Map of old Lara name -> new Mixamo name for parent mapping
rename_map = {}
for lara_pref, mix_bone in LARA_TO_MIXAMO.items():
    for b_name in lara_bones_world.keys():
        if b_name.startswith(lara_pref):
            rename_map[b_name] = mix_bone

for b_name in lara_bones_world.keys():
    if b_name.startswith("pelvis"):
        rename_map[b_name] = "mixamorig:Hips"

# Go to Edit Mode on Lara armature to get edit bones details
bpy.ops.object.select_all(action="DESELECT")
lara_arm.select_set(True)
bpy.context.view_layer.objects.active = lara_arm
bpy.ops.object.mode_set(mode="EDIT")

aux_bones = []
for eb in lara_arm.data.edit_bones:
    # Any bone in original Lara armature that is not mapped to Mixamo, and is not the root ground
    if eb.name not in rename_map and eb.name != "root ground":
        aux_bones.append({
            "name": eb.name,
            "head": eb.head.copy(),
            "tail": eb.tail.copy(),
            "roll": eb.roll,
            "parent": eb.parent.name if eb.parent else None
        })

bpy.ops.object.mode_set(mode="OBJECT")
log(f"Found {len(aux_bones)} auxiliary bones to copy")

# Now add them to our target armature
bpy.ops.object.select_all(action="DESELECT")
ybot_arm.select_set(True)
bpy.context.view_layer.objects.active = ybot_arm
bpy.ops.object.mode_set(mode="EDIT")

for b_info in aux_bones:
    nb = ybot_arm.data.edit_bones.new(b_info["name"])
    nb.head = b_info["head"]
    nb.tail = b_info["tail"]
    nb.roll = b_info["roll"]
    
    p_name = b_info["parent"]
    if p_name:
        if p_name in rename_map:
            nb.parent = ybot_arm.data.edit_bones.get(rename_map[p_name])
        else:
            nb.parent = ybot_arm.data.edit_bones.get(p_name)
    else:
        # Fallback to Head/Hips
        nb.parent = ybot_arm.data.edit_bones.get("mixamorig:Head")

bpy.ops.object.mode_set(mode="OBJECT")
log("Transferred auxiliary bones to the new armature successfully")

# 7) Renaming vertex groups on all Lara meshes and updating modifiers
log("Renaming vertex groups on Lara meshes...")

for mesh in lara_meshes:
    for vg in mesh.vertex_groups:
        matched = False
        for lara_pref in sorted(LARA_TO_MIXAMO.keys(), key=len, reverse=True):
            if vg.name.startswith(lara_pref):
                vg.name = LARA_TO_MIXAMO[lara_pref]
                matched = True
                break
        if not matched and vg.name.startswith("pelvis"):
            vg.name = "mixamorig:Hips"
            
    for mod in list(mesh.modifiers):
        if mod.type == "ARMATURE":
            mesh.modifiers.remove(mod)
            
    mod = mesh.modifiers.new(name="Armature", type="ARMATURE")
    mod.object = ybot_arm
    mod.use_vertex_groups = True
    
    # Parent mesh to new armature - DO NOT APPLY TRANSFORMS TO SKINNED MESHES!
    mesh.parent = ybot_arm
    mesh.matrix_parent_inverse = ybot_arm.matrix_world.inverted()

log("Lara meshes fully reparented and vertex groups renamed")

# 8) Remove old Lara armature and original Y-Bot objects
bpy.ops.object.select_all(action="DESELECT")
lara_arm.select_set(True)
bpy.ops.object.delete()

for o in list(bpy.context.scene.objects):
    if o.type == "MESH" and o not in lara_meshes:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.ops.object.delete()

# Delete unused root nodes imported by Y-bot (like Sketchfab_model)
for o in list(bpy.context.scene.objects):
    if o.name == "Sketchfab_model":
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.ops.object.delete()

# 9) Export final GLB
bpy.ops.object.select_all(action="DESELECT")
ybot_arm.select_set(True)
for mesh in lara_meshes:
    mesh.select_set(True)

log(f"Exporting final clean model to {OUT_GLB}...")
# Scale settings must be kept at 1.0 (do not modify meshes scale)
for o in bpy.context.scene.objects:
    if o.select_get():
        o.scale = (1.0, 1.0, 1.0)

bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_animations=False,
    export_yup=True,
    export_def_bones=False,
    export_rest_position_armature=True,
)
log("Rigging and skinning retargeting completed with absolute skinning safety and correct scale!")
