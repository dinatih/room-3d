import bpy
import math
import mathutils
import os

SOURCE_GLB = "/home/dinatih/Projects/room-3d/sources_backup/curious_skeleton/source/Curious skeleton.glb"
OUTPUT_DIR = "/home/dinatih/Projects/room-3d/public/characters/curious_skeleton"
OUTPUT_GLB = os.path.join(OUTPUT_DIR, "curious_skeleton.glb")
OUTPUT_PNG = os.path.join(OUTPUT_DIR, "curious_skeleton_3d_preview.png")
OUTPUT_BLEND_PUBLIC = os.path.join(OUTPUT_DIR, "curious_skeleton_tpose.blend")
OUTPUT_BLEND_BACKUP_DIR = "/home/dinatih/Projects/room-3d/sources_backup/curious_skeleton"
OUTPUT_BLEND_BACKUP = os.path.join(OUTPUT_BLEND_BACKUP_DIR, "curious_skeleton_tpose.blend")

BONE_MAP = {
    # Hips / Pelvis
    'pelvis.5': 'mixamorig:Hips',

    # Spine & Neck & Head
    'L5.6': 'mixamorig:Spine',
    'Th8.15': 'mixamorig:Spine1',
    'Th5.18': 'mixamorig:Spine2',
    'c7.23': 'mixamorig:Neck',
    'skull.28': 'mixamorig:Head',
    'jawbone.29': 'mixamorig:Jaw',

    # Left Arm
    'l_clavicle_base.31': 'mixamorig:LeftShoulder',
    'l_humerus.33': 'mixamorig:LeftArm',
    'l_elbow.34': 'mixamorig:LeftForeArm',
    'l_wrist.35': 'mixamorig:LeftHand',

    # Left Fingers
    'l_thumb1.53': 'mixamorig:LeftHandThumb1',
    'l_thumb2.54': 'mixamorig:LeftHandThumb2',
    'l_thumb3.55': 'mixamorig:LeftHandThumb3',
    'l_pointer1.37': 'mixamorig:LeftHandIndex1',
    'l_pointer2.38': 'mixamorig:LeftHandIndex2',
    'l_pointer3.39': 'mixamorig:LeftHandIndex3',
    'l_middle1.41': 'mixamorig:LeftHandMiddle1',
    'l_middle2.42': 'mixamorig:LeftHandMiddle2',
    'l_middle3.43': 'mixamorig:LeftHandMiddle3',
    'l_ring1.45': 'mixamorig:LeftHandRing1',
    'l_ring2.46': 'mixamorig:LeftHandRing2',
    'l_ring3.47': 'mixamorig:LeftHandRing3',
    'l_pinkie1.49': 'mixamorig:LeftHandPinky1',
    'l_pinkie2.50': 'mixamorig:LeftHandPinky2',
    'l_pinkie3.51': 'mixamorig:LeftHandPinky3',

    # Right Arm
    'r_clavicle_base.57': 'mixamorig:RightShoulder',
    'r_humerus.59': 'mixamorig:RightArm',
    'r_elbow.60': 'mixamorig:RightForeArm',
    'r_wrist.61': 'mixamorig:RightHand',

    # Right Fingers
    'r_thumb1.79': 'mixamorig:RightHandThumb1',
    'r_thumb2.80': 'mixamorig:RightHandThumb2',
    'r_thumb3.81': 'mixamorig:RightHandThumb3',
    'r_pointer1.63': 'mixamorig:RightHandIndex1',
    'r_pointer2.64': 'mixamorig:RightHandIndex2',
    'r_pointer3.65': 'mixamorig:RightHandIndex3',
    'r_middle1.67': 'mixamorig:RightHandMiddle1',
    'r_middle2.68': 'mixamorig:RightHandMiddle2',
    'r_middle3.69': 'mixamorig:RightHandMiddle3',
    'r_ring1.71': 'mixamorig:RightHandRing1',
    'r_ring2.72': 'mixamorig:RightHandRing2',
    'r_ring3.73': 'mixamorig:RightHandRing3',
    'r_pinkie1.75': 'mixamorig:RightHandPinky1',
    'r_pinkie2.76': 'mixamorig:RightHandPinky2',
    'r_pinkie3.77': 'mixamorig:RightHandPinky3',

    # Left Leg
    'l_hip_n.87': 'mixamorig:LeftUpLeg',
    'l_knee_n.88': 'mixamorig:LeftLeg',
    'l_ankle_n.89': 'mixamorig:LeftFoot',
    'l_foot1.90': 'mixamorig:LeftToeBase',

    # Right Leg
    'r_hip_n.100': 'mixamorig:RightUpLeg',
    'r_knee_n.101': 'mixamorig:RightLeg',
    'r_ankle_n.102': 'mixamorig:RightFoot',
    'r_foot1.103': 'mixamorig:RightToeBase',
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

def merge_vg(mesh, source_names, target_name):
    target_vg = mesh.vertex_groups.get(target_name)
    if not target_vg:
        target_vg = mesh.vertex_groups.new(name=target_name)
    for src_name in source_names:
        src_vg = mesh.vertex_groups.get(src_name)
        if not src_vg: continue
        for v in mesh.data.vertices:
            try:
                w = src_vg.weight(v.index)
                if w > 0.0001:
                    curr_w = 0.0
                    try: curr_w = target_vg.weight(v.index)
                    except: pass
                    target_vg.add([v.index], curr_w + w, 'REPLACE')
            except: pass
        mesh.vertex_groups.remove(src_vg)

def convert_curious_skeleton():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(OUTPUT_BLEND_BACKUP_DIR, exist_ok=True)

    print("Loading source GLB:", SOURCE_GLB)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE_GLB)

    arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
    mesh = [o for o in bpy.data.objects if o.type == "MESH" and len(o.data.vertices) > 1000][0]

    # Delete unneeded objects (e.g. Icosphere, Cube, RootNode, etc.)
    for obj in list(bpy.data.objects):
        if obj not in (arm, mesh):
            bpy.data.objects.remove(obj, do_unlink=True)

    if arm.parent:
        arm.parent = None
    mesh.parent = arm

    # Clear animations from source
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    # Merge hand vertex groups into wrist before bone deletion
    merge_vg(mesh, ['l_hand.36'], 'l_wrist.35')
    merge_vg(mesh, ['r_hand.62'], 'r_wrist.61')

    # Reparent bones and clean 0-vertex bones in EDIT MODE
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')

    # Pelvis as root
    eb_pelvis = arm.data.edit_bones['pelvis.5']
    eb_pelvis.parent = None

    # Connect arms across 0-vertex intermediary bones:
    # Left Arm: parent l_humerus to l_clavicle_base
    eb_l_hum = arm.data.edit_bones['l_humerus.33']
    eb_l_hum.parent = arm.data.edit_bones['l_clavicle_base.31']

    # Left Forearm to Hand (l_wrist): parent l_wrist to l_elbow
    eb_l_wrist = arm.data.edit_bones['l_wrist.35']
    eb_l_wrist.parent = arm.data.edit_bones['l_elbow.34']

    # Reparent all left fingers to l_wrist
    for f_name in ['l_pointer1.37', 'l_middle1.41', 'l_ring1.45', 'l_pinkie1.49', 'l_thumb1.53']:
        eb_f = arm.data.edit_bones.get(f_name)
        if eb_f:
            eb_f.parent = eb_l_wrist

    # Right Arm: parent r_humerus to r_clavicle_base
    eb_r_hum = arm.data.edit_bones['r_humerus.59']
    eb_r_hum.parent = arm.data.edit_bones['r_clavicle_base.57']

    # Right Forearm to Hand (r_wrist): parent r_wrist to r_elbow
    eb_r_wrist = arm.data.edit_bones['r_wrist.61']
    eb_r_wrist.parent = arm.data.edit_bones['r_elbow.60']

    # Reparent all right fingers to r_wrist
    for f_name in ['r_pointer1.63', 'r_middle1.67', 'r_ring1.71', 'r_pinkie1.75', 'r_thumb1.79']:
        eb_f = arm.data.edit_bones.get(f_name)
        if eb_f:
            eb_f.parent = eb_r_wrist

    # Delete unneeded bones
    deleted_bones = [
        'root.4',
        'l_clavicle_distal.32', 'l_hand.36',
        'l_pointer4.40', 'l_middle4.44', 'l_ring4.48', 'l_pinkie4.52', 'l_thumb4.56',
        'r_clavicle_distal.58', 'r_hand.62',
        'r_pointer4.66', 'r_middle4.70', 'r_ring4.74', 'r_pinkie4.78', 'r_thumb4.82',
        'l_scapula_end.84', 'r_scapula_end.86',
        'l_foot3.92', 'l_foot5.94', 'l_foot7.96', 'l_foot9.98',
        'r_foot3.105', 'r_foot5.107', 'r_foot7.109', 'r_foot9.111'
    ]
    for b_name in deleted_bones:
        if b_name in arm.data.edit_bones:
            arm.data.edit_bones.remove(arm.data.edit_bones[b_name])

    bpy.ops.object.mode_set(mode='OBJECT')

    # Remove deleted bones from mesh vertex groups
    for b_name in deleted_bones:
        vg = mesh.vertex_groups.get(b_name)
        if vg:
            mesh.vertex_groups.remove(vg)

    # Rename bones and vertex groups
    for old_name, new_name in BONE_MAP.items():
        if old_name in arm.data.bones:
            arm.data.bones[old_name].name = new_name
        if old_name in mesh.vertex_groups:
            mesh.vertex_groups[old_name].name = new_name

    # POSE MODE: Adjust to True T-Pose
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    def align_pose_bone(bname, target_dir):
        pb = arm.pose.bones.get(bname)
        if not pb: return
        w_head = arm.matrix_world @ pb.head
        if pb.children:
            w_target_head = arm.matrix_world @ pb.children[0].head
            curr_dir = (w_target_head - w_head).normalized()
        else:
            curr_dir = ((arm.matrix_world @ pb.tail) - w_head).normalized()
        q = curr_dir.rotation_difference(target_dir)
        m_world = arm.matrix_world @ pb.matrix
        m_world_new = mathutils.Matrix.Translation(w_head) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
        pb.matrix = arm.matrix_world.inverted() @ m_world_new
        bpy.context.view_layer.update()

    # Straighten Cervical Spine and Head
    for bname in ['mixamorig:Neck', 'c6.24', 'c5.25', 'c4.26', 'c3.27', 'mixamorig:Head']:
        pb = arm.pose.bones.get(bname)
        if not pb: continue
        w_head = arm.matrix_world @ pb.head
        curr_dir = ((arm.matrix_world @ pb.tail) - w_head).normalized()
        q = curr_dir.rotation_difference(mathutils.Vector((0, 0, 1)))
        m_world = arm.matrix_world @ pb.matrix
        m_world_new = mathutils.Matrix.Translation(w_head) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
        pb.matrix = arm.matrix_world.inverted() @ m_world_new
        bpy.context.view_layer.update()

    # Straighten Left Arm horizontally to +X
    p_l_arm = arm.pose.bones['mixamorig:LeftArm']
    p_l_fore = arm.pose.bones['mixamorig:LeftForeArm']
    v_l = ((arm.matrix_world @ p_l_fore.head) - (arm.matrix_world @ p_l_arm.head)).normalized()
    q_l = v_l.rotation_difference(mathutils.Vector((1, 0, 0)))
    w_head = arm.matrix_world @ p_l_arm.head
    m_world = arm.matrix_world @ p_l_arm.matrix
    m_world_new = mathutils.Matrix.Translation(w_head) @ q_l.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
    p_l_arm.matrix = arm.matrix_world.inverted() @ m_world_new
    bpy.context.view_layer.update()

    p_l_hand = arm.pose.bones['mixamorig:LeftHand']
    v_l_fore = ((arm.matrix_world @ p_l_hand.head) - (arm.matrix_world @ p_l_fore.head)).normalized()
    q_l_fore = v_l_fore.rotation_difference(mathutils.Vector((1, 0, 0)))
    w_head = arm.matrix_world @ p_l_fore.head
    m_world = arm.matrix_world @ p_l_fore.matrix
    m_world_new = mathutils.Matrix.Translation(w_head) @ q_l_fore.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
    p_l_fore.matrix = arm.matrix_world.inverted() @ m_world_new
    bpy.context.view_layer.update()

    p_l_mid = arm.pose.bones['mixamorig:LeftHandMiddle1']
    v_l_hand = ((arm.matrix_world @ p_l_mid.head) - (arm.matrix_world @ p_l_hand.head)).normalized()
    q_l_hand = v_l_hand.rotation_difference(mathutils.Vector((1, 0, 0)))
    w_head = arm.matrix_world @ p_l_hand.head
    m_world = arm.matrix_world @ p_l_hand.matrix
    m_world_new = mathutils.Matrix.Translation(w_head) @ q_l_hand.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
    p_l_hand.matrix = arm.matrix_world.inverted() @ m_world_new
    bpy.context.view_layer.update()

    # Straighten Right Arm horizontally to -X
    p_r_arm = arm.pose.bones['mixamorig:RightArm']
    p_r_fore = arm.pose.bones['mixamorig:RightForeArm']
    v_r = ((arm.matrix_world @ p_r_fore.head) - (arm.matrix_world @ p_r_arm.head)).normalized()
    q_r = v_r.rotation_difference(mathutils.Vector((-1, 0, 0)))
    w_head = arm.matrix_world @ p_r_arm.head
    m_world = arm.matrix_world @ p_r_arm.matrix
    m_world_new = mathutils.Matrix.Translation(w_head) @ q_r.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
    p_r_arm.matrix = arm.matrix_world.inverted() @ m_world_new
    bpy.context.view_layer.update()

    p_r_hand = arm.pose.bones['mixamorig:RightHand']
    v_r_fore = ((arm.matrix_world @ p_r_hand.head) - (arm.matrix_world @ p_r_fore.head)).normalized()
    q_r_fore = v_r_fore.rotation_difference(mathutils.Vector((-1, 0, 0)))
    w_head = arm.matrix_world @ p_r_fore.head
    m_world = arm.matrix_world @ p_r_fore.matrix
    m_world_new = mathutils.Matrix.Translation(w_head) @ q_r_fore.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
    p_r_fore.matrix = arm.matrix_world.inverted() @ m_world_new
    bpy.context.view_layer.update()

    p_r_mid = arm.pose.bones['mixamorig:RightHandMiddle1']
    v_r_hand = ((arm.matrix_world @ p_r_mid.head) - (arm.matrix_world @ p_r_hand.head)).normalized()
    q_r_hand = v_r_hand.rotation_difference(mathutils.Vector((-1, 0, 0)))
    w_head = arm.matrix_world @ p_r_hand.head
    m_world = arm.matrix_world @ p_r_hand.matrix
    m_world_new = mathutils.Matrix.Translation(w_head) @ q_r_hand.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_world
    p_r_hand.matrix = arm.matrix_world.inverted() @ m_world_new
    bpy.context.view_layer.update()

    bpy.ops.object.mode_set(mode='OBJECT')

    # Apply deformation to mesh
    bpy.context.view_layer.objects.active = mesh
    for mod in list(mesh.modifiers):
        if mod.type == 'ARMATURE':
            bpy.ops.object.modifier_copy(modifier=mod.name)
            bpy.ops.object.modifier_apply(modifier=mod.name)
            break

    # Apply pose as rest pose on armature
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # EDIT MODE: Standardize bone tails, axes, and rolls to Mixamo conventions
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')

    # Left Arm
    eb_la = arm.data.edit_bones['mixamorig:LeftArm']
    eb_lfa = arm.data.edit_bones['mixamorig:LeftForeArm']
    eb_lh = arm.data.edit_bones['mixamorig:LeftHand']
    eb_la.tail = eb_lfa.head
    eb_la.roll = math.radians(180)
    eb_lfa.tail = eb_lh.head
    eb_lfa.roll = math.radians(180)
    eb_lh.tail = eb_lh.head + mathutils.Vector((0.08, 0, 0))
    eb_lh.roll = math.radians(-180)

    # Right Arm
    eb_ra = arm.data.edit_bones['mixamorig:RightArm']
    eb_rfa = arm.data.edit_bones['mixamorig:RightForeArm']
    eb_rh = arm.data.edit_bones['mixamorig:RightHand']
    eb_ra.tail = eb_rfa.head
    eb_ra.roll = math.radians(-180)
    eb_rfa.tail = eb_rh.head
    eb_rfa.roll = math.radians(-180)
    eb_rh.tail = eb_rh.head + mathutils.Vector((-0.08, 0, 0))
    eb_rh.roll = math.radians(180)

    # Left Fingers
    for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
        b1 = arm.data.edit_bones.get(f'mixamorig:LeftHand{finger}1')
        b2 = arm.data.edit_bones.get(f'mixamorig:LeftHand{finger}2')
        b3 = arm.data.edit_bones.get(f'mixamorig:LeftHand{finger}3')
        if b1 and b2 and b3:
            b1.tail = b2.head
            b1.roll = math.radians(-180)
            b2.tail = b3.head
            b2.roll = math.radians(-180)
            b3.tail = b3.head + (b3.head - b2.head)
            b3.roll = math.radians(-180)

    # Right Fingers
    for finger in ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']:
        b1 = arm.data.edit_bones.get(f'mixamorig:RightHand{finger}1')
        b2 = arm.data.edit_bones.get(f'mixamorig:RightHand{finger}2')
        b3 = arm.data.edit_bones.get(f'mixamorig:RightHand{finger}3')
        if b1 and b2 and b3:
            b1.tail = b2.head
            b1.roll = math.radians(180)
            b2.tail = b3.head
            b2.roll = math.radians(180)
            b3.tail = b3.head + (b3.head - b2.head)
            b3.roll = math.radians(180)

    # Legs
    eb_lul = arm.data.edit_bones['mixamorig:LeftUpLeg']
    eb_ll = arm.data.edit_bones['mixamorig:LeftLeg']
    eb_lf = arm.data.edit_bones['mixamorig:LeftFoot']
    eb_lul.tail = eb_ll.head
    eb_lul.roll = math.radians(180)
    eb_ll.tail = eb_lf.head
    eb_ll.roll = math.radians(180)

    eb_rul = arm.data.edit_bones['mixamorig:RightUpLeg']
    eb_rl = arm.data.edit_bones['mixamorig:RightLeg']
    eb_rf = arm.data.edit_bones['mixamorig:RightFoot']
    eb_rul.tail = eb_rl.head
    eb_rul.roll = math.radians(-180)
    eb_rl.tail = eb_rf.head
    eb_rl.roll = math.radians(-180)

    bpy.ops.object.mode_set(mode='OBJECT')

    # Calibration: Height to 175cm and Ground at Z=0
    bbox_corners = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
    curr_h = max(v.z for v in bbox_corners) - min(v.z for v in bbox_corners)
    scale_mult = 1.75 / curr_h
    arm.scale *= scale_mult
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bbox_corners = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
    min_z = min(v.z for v in bbox_corners)
    if abs(min_z) > 0.001:
        arm.location.z -= min_z
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # Clear animations again
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
    print(f"Exported true T-pose curious skeleton GLB: {OUTPUT_GLB} ({os.path.getsize(OUTPUT_GLB)} bytes)")

    # Render Preview
    render_preview(OUTPUT_GLB, OUTPUT_PNG)
    print("All conversion completed successfully!")

if __name__ == "__main__":
    convert_curious_skeleton()
