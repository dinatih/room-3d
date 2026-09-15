import bpy
import math
import mathutils
import os

SOURCE_GLB = "/home/dinatih/3D Resources/humans/skeletons_and_flesh.glb"
OUTPUT_DIR = "/home/dinatih/Projects/room-3d/public/characters/skeleton"
OUTPUT_GLB = os.path.join(OUTPUT_DIR, "skeleton.glb")
OUTPUT_PNG = os.path.join(OUTPUT_DIR, "skeleton_3d_preview.png")
OUTPUT_BLEND_PUBLIC = os.path.join(OUTPUT_DIR, "skeleton_tpose.blend")
OUTPUT_BLEND_BACKUP_DIR = "/home/dinatih/Projects/room-3d/sources_backup/skeleton"
OUTPUT_BLEND_BACKUP = os.path.join(OUTPUT_BLEND_BACKUP_DIR, "skeleton_tpose.blend")

BONE_MAP = {
    'ValveBiped.Bip01_Pelvis_181': 'mixamorig:Hips',
    'ValveBiped.Bip01_Spine_152': 'mixamorig:Spine',
    'ValveBiped.Bip01_Spine1_145': 'mixamorig:Spine1',
    'ValveBiped.Bip01_Spine2_137': 'mixamorig:Spine2_mid',
    'ValveBiped.Bip01_Spine4_118': 'mixamorig:Spine2',
    'ValveBiped.Bip01_Neck1_25': 'mixamorig:Neck',
    'ValveBiped.Bip01_Head1_16': 'mixamorig:Head',
    'head jaw_13': 'mixamorig:Jaw',

    'ValveBiped.Bip01_L_Clavicle_56': 'mixamorig:LeftShoulder',
    'ValveBiped.Bip01_L_UpperArm_55': 'mixamorig:LeftArm',
    'ValveBiped.Bip01_L_ForeArm_54': 'mixamorig:LeftForeArm',
    'ValveBiped.Bip01_L_Hand_53': 'mixamorig:LeftHand',

    'ValveBiped.Bip01_R_Clavicle_87': 'mixamorig:RightShoulder',
    'ValveBiped.Bip01_R_UpperArm_86': 'mixamorig:RightArm',
    'ValveBiped.Bip01_R_ForeArm_85': 'mixamorig:RightForeArm',
    'ValveBiped.Bip01_R_Hand_84': 'mixamorig:RightHand',

    'ValveBiped.Bip01_L_Thigh_159': 'mixamorig:LeftUpLeg',
    'ValveBiped.Bip01_L_Calf_158': 'mixamorig:LeftLeg',
    'ValveBiped.Bip01_L_Foot_156': 'mixamorig:LeftFoot',
    'ValveBiped.Bip01_L_Toe0_155': 'mixamorig:LeftToeBase',

    'ValveBiped.Bip01_R_Thigh_166': 'mixamorig:RightUpLeg',
    'ValveBiped.Bip01_R_Calf_165': 'mixamorig:RightLeg',
    'ValveBiped.Bip01_R_Foot_163': 'mixamorig:RightFoot',
    'ValveBiped.Bip01_R_Toe0_162': 'mixamorig:RightToeBase',

    # Left Fingers
    'LeftHandThumb1_52': 'mixamorig:LeftHandThumb1',
    'LeftHandThumb2_51': 'mixamorig:LeftHandThumb2',
    'LeftHandThumb3_50': 'mixamorig:LeftHandThumb3',
    'LeftHandIndex1_37': 'mixamorig:LeftHandIndex1',
    'LeftHandIndex2_36': 'mixamorig:LeftHandIndex2',
    'LeftHandIndex3_35': 'mixamorig:LeftHandIndex3',
    'LeftHandMiddle1_40': 'mixamorig:LeftHandMiddle1',
    'LeftHandMiddle2_39': 'mixamorig:LeftHandMiddle2',
    'LeftHandMiddle3_38': 'mixamorig:LeftHandMiddle3',
    'LeftHandRing1_43': 'mixamorig:LeftHandRing1',
    'LeftHandRing2_42': 'mixamorig:LeftHandRing2',
    'LeftHandRing3_41': 'mixamorig:LeftHandRing3',
    'LeftHandPinky1_47': 'mixamorig:LeftHandPinky1',
    'LeftHandPinky2_46': 'mixamorig:LeftHandPinky2',
    'LeftHandPinky3_45': 'mixamorig:LeftHandPinky3',

    # Right Fingers
    'RightHandThumb1_83': 'mixamorig:RightHandThumb1',
    'RightHandThumb2_82': 'mixamorig:RightHandThumb2',
    'RightHandThumb3_81': 'mixamorig:RightHandThumb3',
    'RightHandIndex1_68': 'mixamorig:RightHandIndex1',
    'RightHandIndex2_67': 'mixamorig:RightHandIndex2',
    'RightHandIndex3_66': 'mixamorig:RightHandIndex3',
    'RightHandMiddle1_71': 'mixamorig:RightHandMiddle1',
    'RightHandMiddle2_70': 'mixamorig:RightHandMiddle2',
    'RightHandMiddle3_69': 'mixamorig:RightHandMiddle3',
    'RightHandRing1_74': 'mixamorig:RightHandRing1',
    'RightHandRing2_73': 'mixamorig:RightHandRing2',
    'RightHandRing3_72': 'mixamorig:RightHandRing3',
    'RightHandPinky1_78': 'mixamorig:RightHandPinky1',
    'RightHandPinky2_77': 'mixamorig:RightHandPinky2',
    'RightHandPinky3_76': 'mixamorig:RightHandPinky3',
}

def render_preview(glb_path, out_png):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"

    bpy.ops.import_scene.gltf(filepath=glb_path)
    meshes = [obj for obj in scene.objects if obj.type in ("MESH", "CURVE")]

    min_c = mathutils.Vector((float("inf"), float("inf"), float("inf")))
    max_c = mathutils.Vector((float("-inf"), float("-inf"), float("-inf")))

    for obj in meshes:
        for v in obj.bound_box:
            w_v = obj.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                min_c[i] = min(min_c[i], w_v[i])
                max_c[i] = max(max_c[i], w_v[i])

    center = (min_c + max_c) / 2
    size = max_c - min_c
    max_dim = max(size.x, size.y, size.z)

    cam_data = bpy.data.cameras.new(name="Camera")
    cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = max(max_dim * 1.3, 0.1)
    cam_obj.location = center + mathutils.Vector((dist * 0.25, -dist * 1.1, dist * 0.1))
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot_quat.to_euler()

    light_data = bpy.data.lights.new(name="LightKey", type="SUN")
    light_data.energy = 3.5
    light_obj = bpy.data.objects.new(name="LightKey", object_data=light_data)
    scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), math.radians(30), math.radians(45))

    light_data2 = bpy.data.lights.new(name="LightFill", type="SUN")
    light_data2.energy = 2.0
    light_obj2 = bpy.data.objects.new(name="LightFill", object_data=light_data2)
    scene.collection.objects.link(light_obj2)
    light_obj2.rotation_euler = (math.radians(-30), math.radians(-45), 0)

    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print(f"Rendered preview: {out_png} ({os.path.getsize(out_png)} bytes)")

def convert_skeleton():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(OUTPUT_BLEND_BACKUP_DIR, exist_ok=True)

    print("Loading source GLB:", SOURCE_GLB)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE_GLB)

    kept_mesh_names = {'Object_7', 'Object_9', 'Object_11', 'Object_12', 'Object_14'}
    arm = bpy.data.objects['GLTF_created_0']
    meshes = [bpy.data.objects[name] for name in kept_mesh_names]

    # Delete unneeded objects
    for obj in list(bpy.data.objects):
        if obj != arm and obj not in meshes:
            bpy.data.objects.remove(obj, do_unlink=True)

    if arm.parent:
        arm.parent = None
    for m in meshes:
        m.parent = arm

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')

    # Unparent Pelvis from Reference_182
    pelvis_eb = arm.data.edit_bones['ValveBiped.Bip01_Pelvis_181']
    pelvis_eb.parent = None

    # Remove root joint and reference
    for b_name in ['GLTF_created_0_rootJoint', 'Reference_182']:
        if b_name in arm.data.edit_bones:
            arm.data.edit_bones.remove(arm.data.edit_bones[b_name])

    bpy.ops.object.mode_set(mode='OBJECT')

    # Rename bones
    for old_name, new_name in BONE_MAP.items():
        if old_name in arm.data.bones:
            arm.data.bones[old_name].name = new_name

    # Rename vertex groups in meshes
    for m in meshes:
        for old_name, new_name in BONE_MAP.items():
            if old_name in m.vertex_groups:
                m.vertex_groups[old_name].name = new_name

    # Scale to 175cm height
    bbox_corners = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box]
    curr_h = max(v.z for v in bbox_corners) - min(v.z for v in bbox_corners)
    scale_mult = 1.75 / curr_h
    print(f"Current height: {curr_h:.3f}m, scaling by {scale_mult:.4f}")

    arm.scale *= scale_mult
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Ground at Z=0
    bbox_corners = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box]
    min_z = min(v.z for v in bbox_corners)
    max_z = max(v.z for v in bbox_corners)
    if abs(min_z) > 0.001:
        arm.location.z -= min_z
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # --- ADJUST ARMS FROM A-POSE TO TRUE T-POSE ---
    print("Adjusting arms from A-pose to TRUE horizontal T-pose...")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    # 1. Align LeftArm to (1, 0, 0)
    p_l_arm = arm.pose.bones['mixamorig:LeftArm']
    p_l_fore = arm.pose.bones['mixamorig:LeftForeArm']
    v_l = (p_l_fore.head - p_l_arm.head).normalized()
    q_l = v_l.rotation_difference(mathutils.Vector((1, 0, 0)))
    m_world_l = arm.matrix_world @ p_l_arm.matrix
    m_world_l_new = mathutils.Matrix.Translation(p_l_arm.head) @ q_l.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-p_l_arm.head) @ m_world_l
    p_l_arm.matrix = arm.matrix_world.inverted() @ m_world_l_new
    bpy.context.view_layer.update()

    # 2. Align LeftForeArm to (1, 0, 0)
    p_l_hand = arm.pose.bones['mixamorig:LeftHand']
    v_l_fore = (p_l_hand.head - p_l_fore.head).normalized()
    q_l_fore = v_l_fore.rotation_difference(mathutils.Vector((1, 0, 0)))
    m_world_lf = arm.matrix_world @ p_l_fore.matrix
    m_world_lf_new = mathutils.Matrix.Translation(p_l_fore.head) @ q_l_fore.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-p_l_fore.head) @ m_world_lf
    p_l_fore.matrix = arm.matrix_world.inverted() @ m_world_lf_new
    bpy.context.view_layer.update()

    # 3. Align RightArm to (-1, 0, 0)
    p_r_arm = arm.pose.bones['mixamorig:RightArm']
    p_r_fore = arm.pose.bones['mixamorig:RightForeArm']
    v_r = (p_r_fore.head - p_r_arm.head).normalized()
    q_r = v_r.rotation_difference(mathutils.Vector((-1, 0, 0)))
    m_world_r = arm.matrix_world @ p_r_arm.matrix
    m_world_r_new = mathutils.Matrix.Translation(p_r_arm.head) @ q_r.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-p_r_arm.head) @ m_world_r
    p_r_arm.matrix = arm.matrix_world.inverted() @ m_world_r_new
    bpy.context.view_layer.update()

    # 4. Align RightForeArm to (-1, 0, 0)
    p_r_hand = arm.pose.bones['mixamorig:RightHand']
    v_r_fore = (p_r_hand.head - p_r_fore.head).normalized()
    q_r_fore = v_r_fore.rotation_difference(mathutils.Vector((-1, 0, 0)))
    m_world_rf = arm.matrix_world @ p_r_fore.matrix
    m_world_rf_new = mathutils.Matrix.Translation(p_r_fore.head) @ q_r_fore.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-p_r_fore.head) @ m_world_rf
    p_r_fore.matrix = arm.matrix_world.inverted() @ m_world_rf_new
    bpy.context.view_layer.update()

    bpy.ops.object.mode_set(mode='OBJECT')

    # Apply deformation to meshes
    for m in meshes:
        bpy.context.view_layer.objects.active = m
        for mod in list(m.modifiers):
            if mod.type == 'ARMATURE':
                bpy.ops.object.modifier_copy(modifier=mod.name)
                bpy.ops.object.modifier_apply(modifier=mod.name)
                break

    # Apply pose as rest pose on armature
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Clear animations
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    # Save .blend files
    print(f"Saving blend file to: {OUTPUT_BLEND_PUBLIC}")
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND_PUBLIC)
    print(f"Saving backup blend file to: {OUTPUT_BLEND_BACKUP}")
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND_BACKUP)

    # Export clean GLB
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False
    )
    print(f"Exported true T-pose skeleton GLB: {OUTPUT_GLB} ({os.path.getsize(OUTPUT_GLB)} bytes)")

    # Render Preview
    render_preview(OUTPUT_GLB, OUTPUT_PNG)
    print("All conversion completed successfully!")

if __name__ == "__main__":
    convert_skeleton()
