import bpy
import math
import mathutils
import os

SOURCE_GLB = "/home/dinatih/Projects/room-3d/sources_backup/curious_skeleton/source/Curious skeleton.glb"
OUTPUT_DIR = "/home/dinatih/Projects/room-3d/public/characters/curious_skeleton"
OUTPUT_GLB = os.path.join(OUTPUT_DIR, "curious_skeleton.glb")
OUTPUT_PNG = os.path.join(OUTPUT_DIR, "curious_skeleton_3d_preview.png")
OUTPUT_FRONT_PNG = os.path.join(OUTPUT_DIR, "curious_skeleton_ortho_front.png")
OUTPUT_TOP_PNG = os.path.join(OUTPUT_DIR, "curious_skeleton_ortho_top.png")
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
    'l_hand.36': 'mixamorig:LeftHand',

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
    'r_hand.62': 'mixamorig:RightHand',

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

def render_views(mesh, out_perspective, out_front, out_top):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'FLAT'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    cam_data = bpy.data.cameras.new(name="PreviewCamera")
    cam_obj = bpy.data.objects.new(name="PreviewCamera", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # 1. Front Ortho
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 2.1
    cam_obj.location = mathutils.Vector((0, -3.0, 0.9))
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    scene.render.filepath = out_front
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Front Ortho view: {out_front}")

    # 2. Top Ortho
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 2.1
    cam_obj.location = mathutils.Vector((0, 0, 3.0))
    cam_obj.rotation_euler = (0, 0, math.radians(180))
    scene.render.filepath = out_top
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Top Ortho view: {out_top}")

    # 3. 3/4 Perspective Preview
    cam_data.type = 'PERSP'
    cam_data.lens = 45
    cam_obj.location = mathutils.Vector((0.5, -2.4, 1.0))
    direction = mathutils.Vector((0, 0, 0.9)) - cam_obj.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot_quat.to_euler()
    scene.render.filepath = out_perspective
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Perspective view: {out_perspective}")

def convert_curious_skeleton():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(OUTPUT_BLEND_BACKUP_DIR, exist_ok=True)

    print("Loading source GLB:", SOURCE_GLB)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE_GLB)

    arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
    mesh = [o for o in bpy.data.objects if o.type == "MESH" and len(o.data.vertices) > 1000][0]

    # Delete unneeded objects (Icosphere, RootNode, empty nodes, etc.)
    for obj in list(bpy.data.objects):
        if obj not in (arm, mesh):
            bpy.data.objects.remove(obj, do_unlink=True)

    # Maintain proper world transforms when unparenting from RootNode
    arm.matrix_world = arm.matrix_world.copy()
    arm.parent = None
    mesh.parent = arm

    # Clear all animations and reset ALL pose bones to true bind/rest identity
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()

    # In rest pose:
    # - The head is facing strictly forward (-Y), spine is upright (+Z), no tilt or yaw.
    # - The clavicles are symmetrical in depth (Y) and height (Z).
    # - The legs are symmetrical, straight, feet flat.
    # We now rotate the arms into a pure, horizontal T-Pose:

    # 1. Left Arm:
    # Rotate humerus so elbow aligns along +X
    # Rotate elbow so wrist aligns along +X
    for bname, childname in [('l_humerus.33', 'l_elbow.34'), ('l_elbow.34', 'l_wrist.35')]:
        pb = arm.pose.bones[bname]
        h = pb.head.copy()
        h_child = arm.pose.bones[childname].head.copy()
        v = (h_child - h).normalized()
        q = v.rotation_difference(mathutils.Vector((1, 0, 0)))
        pb.matrix = mathutils.Matrix.Translation(h) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-h) @ pb.matrix
        bpy.context.view_layer.update()

    # Rotate Left Wrist around wrist joint so hand aligns along +X
    h_wri = arm.pose.bones['l_wrist.35'].head.copy()
    h_mid = arm.pose.bones['l_middle1.41'].head.copy()
    v_hand = (h_mid - h_wri).normalized()
    q_wri = v_hand.rotation_difference(mathutils.Vector((1, 0, 0)))
    pb_wri = arm.pose.bones['l_wrist.35']
    pb_wri.matrix = mathutils.Matrix.Translation(h_wri) @ q_wri.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-h_wri) @ pb_wri.matrix
    bpy.context.view_layer.update()

    # 2. Right Arm:
    # Rotate humerus so elbow aligns along -X
    # Rotate elbow so wrist aligns along -X
    for bname, childname in [('r_humerus.59', 'r_elbow.60'), ('r_elbow.60', 'r_wrist.61')]:
        pb = arm.pose.bones[bname]
        h = pb.head.copy()
        h_child = arm.pose.bones[childname].head.copy()
        v = (h_child - h).normalized()
        q = v.rotation_difference(mathutils.Vector((-1, 0, 0)))
        pb.matrix = mathutils.Matrix.Translation(h) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-h) @ pb.matrix
        bpy.context.view_layer.update()

    # Rotate Right Wrist around wrist joint so hand aligns along -X
    h_rwri = arm.pose.bones['r_wrist.61'].head.copy()
    h_rmid = arm.pose.bones['r_middle1.67'].head.copy()
    v_rhand = (h_rmid - h_rwri).normalized()
    q_rwri = v_rhand.rotation_difference(mathutils.Vector((-1, 0, 0)))
    pb_rwri = arm.pose.bones['r_wrist.61']
    pb_rwri.matrix = mathutils.Matrix.Translation(h_rwri) @ q_rwri.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-h_rwri) @ pb_rwri.matrix
    bpy.context.view_layer.update()

    # Apply deformation permanently into mesh vertices
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

    # Re-link armature modifier to mesh
    mod = mesh.modifiers.new(name='Armature', type='ARMATURE')
    mod.object = arm

    # EDIT MODE: Standardize bone hierarchy, connections, and rolls to Mixamo conventions
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')

    # Pelvis as root
    eb_pelvis = arm.data.edit_bones['pelvis.5']
    eb_pelvis.parent = None

    # Connect Left Arm chain
    eb_la = arm.data.edit_bones['l_humerus.33']
    eb_lfa = arm.data.edit_bones['l_elbow.34']
    eb_lw = arm.data.edit_bones['l_wrist.35']
    eb_lh = arm.data.edit_bones['l_hand.36']

    eb_la.parent = arm.data.edit_bones['l_clavicle_base.31']
    eb_la.tail = eb_lfa.head
    eb_la.roll = math.radians(180)

    eb_lfa.parent = eb_la
    eb_lfa.tail = eb_lw.head
    eb_lfa.roll = math.radians(180)

    # Position hand bone head exactly at wrist joint and connect to forearm
    eb_lh.head = eb_lw.head
    eb_lh.tail = eb_lh.head + mathutils.Vector((0.08, 0, 0))
    eb_lh.parent = eb_lfa
    eb_lh.roll = math.radians(-180)

    # Reparent thumb to hand
    eb_lth = arm.data.edit_bones.get('l_thumb1.53')
    if eb_lth:
        eb_lth.parent = eb_lh

    # Connect Right Arm chain
    eb_ra = arm.data.edit_bones['r_humerus.59']
    eb_rfa = arm.data.edit_bones['r_elbow.60']
    eb_rw = arm.data.edit_bones['r_wrist.61']
    eb_rh = arm.data.edit_bones['r_hand.62']

    eb_ra.parent = arm.data.edit_bones['r_clavicle_base.57']
    eb_ra.tail = eb_rfa.head
    eb_ra.roll = math.radians(-180)

    eb_rfa.parent = eb_ra
    eb_rfa.tail = eb_rw.head
    eb_rfa.roll = math.radians(-180)

    # Position right hand bone head exactly at wrist joint and connect to forearm
    eb_rh.head = eb_rw.head
    eb_rh.tail = eb_rh.head + mathutils.Vector((-0.08, 0, 0))
    eb_rh.parent = eb_rfa
    eb_rh.roll = math.radians(180)

    # Reparent right thumb to hand
    eb_rth = arm.data.edit_bones.get('r_thumb1.79')
    if eb_rth:
        eb_rth.parent = eb_rh

    # Set finger bones rolls and tails
    for f_prefix in ['l_pointer', 'l_middle', 'l_ring', 'l_pinkie', 'l_thumb']:
        for i in range(1, 4):
            # Find bone starting with f_prefix + str(i)
            matching = [b for b in arm.data.edit_bones if b.name.startswith(f"{f_prefix}{i}")]
            matching_next = [b for b in arm.data.edit_bones if b.name.startswith(f"{f_prefix}{i+1}")]
            if matching and matching_next:
                matching[0].tail = matching_next[0].head
                matching[0].roll = math.radians(-180)

    for f_prefix in ['r_pointer', 'r_middle', 'r_ring', 'r_pinkie', 'r_thumb']:
        for i in range(1, 4):
            matching = [b for b in arm.data.edit_bones if b.name.startswith(f"{f_prefix}{i}")]
            matching_next = [b for b in arm.data.edit_bones if b.name.startswith(f"{f_prefix}{i+1}")]
            if matching and matching_next:
                matching[0].tail = matching_next[0].head
                matching[0].roll = math.radians(180)

    # Legs
    eb_lul = arm.data.edit_bones['l_hip_n.87']
    eb_ll = arm.data.edit_bones['l_knee_n.88']
    eb_lf = arm.data.edit_bones['l_ankle_n.89']
    eb_lul.tail = eb_ll.head
    eb_lul.roll = math.radians(180)
    eb_ll.tail = eb_lf.head
    eb_ll.roll = math.radians(180)

    eb_rul = arm.data.edit_bones['r_hip_n.100']
    eb_rl = arm.data.edit_bones['r_knee_n.101']
    eb_rf = arm.data.edit_bones['r_ankle_n.102']
    eb_rul.tail = eb_rl.head
    eb_rul.roll = math.radians(-180)
    eb_rl.tail = eb_rf.head
    eb_rl.roll = math.radians(-180)

    # Delete unneeded zero-vertex bones
    deleted_bones = [
        'root.4',
        'l_clavicle_distal.32', 'l_wrist.35',
        'l_pointer4.40', 'l_middle4.44', 'l_ring4.48', 'l_pinkie4.52', 'l_thumb4.56',
        'r_clavicle_distal.58', 'r_wrist.61',
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

    # Rename bones and vertex groups to mixamorig:*
    for old_name, new_name in BONE_MAP.items():
        if old_name in arm.data.bones:
            arm.data.bones[old_name].name = new_name
        if old_name in mesh.vertex_groups:
            mesh.vertex_groups[old_name].name = new_name

    # Calibration: scale to standard 175cm height, grounded at Z=0
    bbox_corners = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
    curr_h = max(v.z for v in bbox_corners) - min(v.z for v in bbox_corners)
    scale_mult = 1.75 / curr_h
    arm.scale *= scale_mult
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bbox_corners = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
    min_z = min(v.z for v in bbox_corners)
    arm.location.z -= min_z
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    print("Final character calibration:")
    bbox_corners = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
    print(f"  Width  (X): {max(v.x for v in bbox_corners) - min(v.x for v in bbox_corners):.3f}m [{min(v.x for v in bbox_corners):.3f} to {max(v.x for v in bbox_corners):.3f}]")
    print(f"  Depth  (Y): {max(v.y for v in bbox_corners) - min(v.y for v in bbox_corners):.3f}m [{min(v.y for v in bbox_corners):.3f} to {max(v.y for v in bbox_corners):.3f}]")
    print(f"  Height (Z): {max(v.z for v in bbox_corners) - min(v.z for v in bbox_corners):.3f}m [{min(v.z for v in bbox_corners):.3f} to {max(v.z for v in bbox_corners):.3f}]")

    # Clear animations again
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    # Save .blend file
    print(f"Saving .blend file to: {OUTPUT_BLEND_PUBLIC}")
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND_PUBLIC)

    # Maintain symlink in sources_backup to avoid duplicating large binary files
    if not os.path.islink(OUTPUT_BLEND_BACKUP):
        if os.path.exists(OUTPUT_BLEND_BACKUP):
            os.remove(OUTPUT_BLEND_BACKUP)
        rel_target = os.path.relpath(OUTPUT_BLEND_PUBLIC, os.path.dirname(OUTPUT_BLEND_BACKUP))
        os.symlink(rel_target, OUTPUT_BLEND_BACKUP)
        print(f"Maintained symlink: {OUTPUT_BLEND_BACKUP} -> {rel_target}")

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

    # Render Preview images
    render_views(mesh, OUTPUT_PNG, OUTPUT_FRONT_PNG, OUTPUT_TOP_PNG)
    print("All conversions and renders completed successfully!")

if __name__ == "__main__":
    convert_curious_skeleton()
