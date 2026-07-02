import bpy
import os

def retarget_and_bake(src_path, out_path_animations, out_path_sandbox, action_name):
    # Load objects
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import source animation glb
    print(f"Importing source GLB: {src_path}")
    bpy.ops.import_scene.gltf(filepath=src_path)
    src_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    src_arm.name = "Source_Armature"

    # Import target X-Bot glb
    print("Importing reference X-Bot GLB...")
    bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/sandbox/x_bot.glb")
    tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o.name != "Source_Armature")
    tgt_arm.name = "Target_Armature"

    # Map bones
    BONE_MAP = {
        "mixamorig_Hips": "rootx",
        "mixamorig_Spine": "spine_01x",
        "mixamorig_Spine1": "spine_02x",
        "mixamorig_Spine2": "spine_03x",
        "mixamorig_Neck": "neckx",
        "mixamorig_Head": "headx",
        
        "mixamorig_LeftShoulder": "shoulderl",
        "mixamorig_LeftArm": "arm_twistl",
        "mixamorig_LeftForeArm": "forearm_twistl",
        "mixamorig_LeftHand": "handl",
        
        "mixamorig_RightShoulder": "shoulderr",
        "mixamorig_RightArm": "arm_twistr",
        "mixamorig_RightForeArm": "forearm_twistr",
        "mixamorig_RightHand": "handr",
        
        "mixamorig_LeftUpLeg": "thigh_twistl",
        "mixamorig_LeftLeg": "leg_twistl",
        "mixamorig_LeftFoot": "footl",
        "mixamorig_LeftToeBase": "toes_01l",
        
        "mixamorig_RightUpLeg": "thigh_twistr",
        "mixamorig_RightLeg": "leg_twistr",
        "mixamorig_RightFoot": "footr",
        "mixamorig_RightToeBase": "toes_01r",
    }

    # Go to Pose Mode in target armature to add constraints
    bpy.context.view_layer.objects.active = tgt_arm
    bpy.ops.object.mode_set(mode='POSE')

    print("Adding Copy Transforms constraints...")
    for tgt_bone_name, src_bone_name in BONE_MAP.items():
        pbone = tgt_arm.pose.bones.get(tgt_bone_name)
        if pbone:
            if src_bone_name in src_arm.data.bones:
                con = pbone.constraints.new(type='COPY_TRANSFORMS')
                con.target = src_arm
                con.subtarget = src_bone_name
                con.target_space = 'WORLD'
                con.owner_space = 'WORLD'

    # Select all pose bones to make sure they are baked
    bpy.ops.pose.select_all(action='SELECT')

    # Find length of source animation
    source_action = src_arm.animation_data.action
    start_frame = int(source_action.frame_range[0])
    end_frame = int(source_action.frame_range[1])
    print(f"Baking animation from frame {start_frame} to {end_frame} while in POSE mode...")

    # We MUST be in Pose Mode to bake POSE bones with visual keying!
    bpy.ops.nla.bake(
        frame_start=start_frame,
        frame_end=end_frame,
        step=1,
        only_selected=True,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    # Go back to Object Mode for cleanup and export
    bpy.ops.object.mode_set(mode='OBJECT')

    # Rename the baked action
    baked_action = tgt_arm.animation_data.action
    if baked_action:
        baked_action.name = action_name
        print(f"Baked action renamed to: {baked_action.name}")
    else:
        print("WARNING: No active action found on target armature after bake!")

    # Clean up source armature and other source objects
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

    # Delete all actions from database except the baked action
    print("Cleaning actions database...")
    for act in list(bpy.data.actions):
        if act != baked_action:
            bpy.data.actions.remove(act)

    # Export baked armature and X-Bot to paths
    for out_path in [out_path_animations, out_path_sandbox]:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format='GLB',
            export_skins=True,
            export_yup=True
        )
        print(f"Exported successfully to: {out_path}")

# Run for both animations
retarget_and_bake(
    "/home/dinatih/Projects/room-3d/tmp_anim_extract/PT74TBFLIU63A25FS9ZSIUKJV.glb",
    "/home/dinatih/Projects/room-3d/public/media/glb-animations/woman-solo.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/anim_woman-solo.glb",
    "woman-solo"
)

retarget_and_bake(
    "/home/dinatih/Projects/room-3d/tmp_anim_extract/O5ETGWT4A4E27OM610Y9HSVUH.glb",
    "/home/dinatih/Projects/room-3d/public/media/glb-animations/knee-push-up.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/anim_knee-push-up.glb",
    "knee-push-up"
)
