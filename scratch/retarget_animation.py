import bpy
import os

# Load objects
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import source animation glb
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/tmp_anim_extract/O5ETGWT4A4E27OM610Y9HSVUH.glb")
src_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
src_arm.name = "Source_Armature"

# Import target X-Bot glb
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/sandbox/x_bot.glb")
tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o.name != "Source_Armature")
tgt_arm.name = "Target_Armature"

# Map bones
BONE_MAP = {
    "mixamorigHips": "rootx",
    "mixamorigSpine": "spine_01x",
    "mixamorigSpine1": "spine_02x",
    "mixamorigSpine2": "spine_03x",
    "mixamorigNeck": "neckx",
    "mixamorigHead": "headx",
    
    "mixamorigLeftShoulder": "shoulderl",
    "mixamorigLeftArm": "arm_twistl",
    "mixamorigLeftForeArm": "forearm_twistl",
    "mixamorigLeftHand": "handl",
    
    "mixamorigRightShoulder": "shoulderr",
    "mixamorigRightArm": "arm_twistr",
    "mixamorigRightForeArm": "forearm_twistr",
    "mixamorigRightHand": "handr",
    
    "mixamorigLeftUpLeg": "thigh_twistl",
    "mixamorigLeftLeg": "leg_twistl",
    "mixamorigLeftFoot": "footl",
    "mixamorigLeftToeBase": "toes_01l",
    
    "mixamorigRightUpLeg": "thigh_twistr",
    "mixamorigRightLeg": "leg_twistr",
    "mixamorigRightFoot": "footr",
    "mixamorigRightToeBase": "toes_01r",
}

# Go to Pose Mode in target armature to add constraints
bpy.context.view_layer.objects.active = tgt_arm
bpy.ops.object.mode_set(mode='POSE')

for tgt_bone_name, src_bone_name in BONE_MAP.items():
    pbone = tgt_arm.pose.bones.get(tgt_bone_name)
    if pbone:
        if src_bone_name in src_arm.data.bones:
            con = pbone.constraints.new(type='COPY_TRANSFORMS')
            con.target = src_arm
            con.subtarget = src_bone_name
            con.target_space = 'WORLD'
            con.owner_space = 'WORLD'

# Bake animation on target armature
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
tgt_arm.select_set(True)
bpy.context.view_layer.objects.active = tgt_arm

# Find length of source animation
source_action = src_arm.animation_data.action
start_frame = int(source_action.frame_range[0])
end_frame = int(source_action.frame_range[1])
print(f"Baking animation from frame {start_frame} to {end_frame}...")

bpy.ops.nla.bake(
    frame_start=start_frame,
    frame_end=end_frame,
    step=1,
    only_selected=True,
    visual_keying=True,
    clear_constraints=True,
    bake_types={'POSE'}
)

# Rename the baked action
baked_action = tgt_arm.animation_data.action
if baked_action:
    baked_action.name = "knee-push-up"

# Clean up source objects
bpy.ops.object.select_all(action='DESELECT')
src_arm.select_set(True)
for o in bpy.context.scene.objects:
    if o.parent == src_arm or o.name.startswith("Source_Armature"):
        o.select_set(True)
for o in bpy.context.scene.objects:
    if "RigModels" in o.name or "Icosphere" in o.name:
        if o != tgt_arm and o.parent != tgt_arm:
            o.select_set(True)
bpy.ops.object.delete()

# Export baked armature
out_paths = [
    "/home/dinatih/Projects/room-3d/public/media/glb-animations/knee-push-up.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/anim_knee-push-up.glb"
]

for out_path in out_paths:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
print("Animation retargeted and exported successfully!")
