import bpy, math, os
from mathutils import Matrix, Vector

def merge_vg(mesh, src_name, dst_name):
    src_vg = mesh.vertex_groups.get(src_name)
    if not src_vg:
        return
    dst_vg = mesh.vertex_groups.get(dst_name)
    if not dst_vg:
        dst_vg = mesh.vertex_groups.new(name=dst_name)
    for v in mesh.data.vertices:
        for g in v.groups:
            if g.group == src_vg.index and g.weight > 0:
                cur_w = 0.0
                for dg in v.groups:
                    if dg.group == dst_vg.index:
                        cur_w = dg.weight
                        break
                dst_vg.add([v.index], min(1.0, cur_w + g.weight), 'REPLACE')
    mesh.vertex_groups.remove(src_vg)

def convert_inyeong():
    fbx_path = os.path.abspath("sources_backup/inyeong/raw/source/Nitro.fbx")
    out_glb = os.path.abspath("public/characters/inyeong/nitro_anim_inyeong.glb")
    out_blend = os.path.abspath("sources_backup/inyeong/inyeong_nitro_tpose.blend")
    out_preview = os.path.abspath("public/characters/inyeong/nitro_anim_inyeong_3d_preview.png")

    print(f"=== 1. Loading FBX: {fbx_path} ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']

    # 2. Clear animation data and reset all pose transforms
    print("=== 2. Clearing animation data and resetting pose ===")
    for o in bpy.data.objects:
        if o.animation_data:
            o.animation_data_clear()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Merge secondary vertex groups into main deform bones
    print("=== 3. Merging secondary vertex groups into main deform bones ===")
    for m in meshes:
        # Transfer all facial / tongue / teeth / jaw groups to Head
        for g in list(m.vertex_groups):
            name = g.name
            if name.startswith('Face_'):
                merge_vg(m, name, 'Head')
            elif 'Hair' in name:
                merge_vg(m, name, 'Head')
            elif 'Head_Acce' in name:
                merge_vg(m, name, 'Head')
            elif name in ['LeftHandRing', 'LeftHandPinky']:
                merge_vg(m, name, 'LeftWrist')
            elif name in ['RightHandRing', 'RightHandPinky']:
                merge_vg(m, name, 'RightWrist')
            elif name in ['LeftUpArm_1']:
                merge_vg(m, name, 'LeftShoulder')
            elif name in ['RightUpArm_1']:
                merge_vg(m, name, 'RightShoulder')
            elif name in ['LeftElbow_Pt_1']:
                merge_vg(m, name, 'LeftElbow')
            elif name in ['RightElbow_Pt_1']:
                merge_vg(m, name, 'RightElbow')
            elif 'Spine_Acce' in name:
                merge_vg(m, name, 'Spine3')
            elif 'Pelvis_Acce' in name:
                merge_vg(m, name, 'Pelvis')

    # 4. Clean Armature Edit Bones
    print("=== 4. Cleaning Armature bones to exact Mixamo set ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm.data.edit_bones

    # Unparent Pelvis so it becomes the single, clean root bone
    if 'Pelvis' in edit_bones:
        edit_bones['Pelvis'].parent = None

    # Reparent finger chains directly to LeftWrist / RightWrist
    # (since palm metacarpals LeftHandRing and LeftHandPinky were merged into Wrist)
    if 'LeftHandRing1' in edit_bones and 'LeftWrist' in edit_bones:
        edit_bones['LeftHandRing1'].parent = edit_bones['LeftWrist']
    if 'LeftHandPinky1' in edit_bones and 'LeftWrist' in edit_bones:
        edit_bones['LeftHandPinky1'].parent = edit_bones['LeftWrist']
    if 'RightHandRing1' in edit_bones and 'RightWrist' in edit_bones:
        edit_bones['RightHandRing1'].parent = edit_bones['RightWrist']
    if 'RightHandPinky1' in edit_bones and 'RightWrist' in edit_bones:
        edit_bones['RightHandPinky1'].parent = edit_bones['RightWrist']

    # Reparent LeftWrist to LeftElbow directly
    if 'LeftWrist' in edit_bones and 'LeftElbow' in edit_bones:
        edit_bones['LeftWrist'].parent = edit_bones['LeftElbow']
    if 'RightWrist' in edit_bones and 'RightElbow' in edit_bones:
        edit_bones['RightWrist'].parent = edit_bones['RightElbow']

    # Define all standard bones to KEEP
    standard_bones = {
        'Pelvis', 'Spine1', 'Spine2', 'Spine3', 'Neck', 'Head',
        'LeftClavicle', 'LeftShoulder', 'LeftElbow', 'LeftWrist',
        'LeftHandThumb1', 'LeftHandThumb2', 'LeftHandThumb3',
        'LeftHandIndex1', 'LeftHandIndex2', 'LeftHandIndex3',
        'LeftHandMiddle1', 'LeftHandMiddle2', 'LeftHandMiddle3',
        'LeftHandRing1', 'LeftHandRing2', 'LeftHandRing3',
        'LeftHandPinky1', 'LeftHandPinky2', 'LeftHandPinky3',
        'RightClavicle', 'RightShoulder', 'RightElbow', 'RightWrist',
        'RightHandThumb1', 'RightHandThumb2', 'RightHandThumb3',
        'RightHandIndex1', 'RightHandIndex2', 'RightHandIndex3',
        'RightHandMiddle1', 'RightHandMiddle2', 'RightHandMiddle3',
        'RightHandRing1', 'RightHandRing2', 'RightHandRing3',
        'RightHandPinky1', 'RightHandPinky2', 'RightHandPinky3',
        'LeftThigh', 'LeftKnee', 'LeftFoot', 'LeftToe',
        'RightThigh', 'RightKnee', 'RightFoot', 'RightToe'
    }

    # Delete all other bones
    bones_to_remove = [b.name for b in edit_bones if b.name not in standard_bones]
    for bname in bones_to_remove:
        if bname in edit_bones:
            edit_bones.remove(edit_bones[bname])

    print(f"Kept {len(edit_bones)} standard bones. Removed {len(bones_to_remove)} secondary/dummy bones.")
    bpy.ops.object.mode_set(mode='OBJECT')

    # 5. Bone name mapping to standard Mixamo naming
    print("=== 5. Mapping bones to standard Mixamo names ===")
    bone_map = {
        'Pelvis': 'mixamorig:Hips',
        'Spine1': 'mixamorig:Spine',
        'Spine2': 'mixamorig:Spine1',
        'Spine3': 'mixamorig:Spine2',
        'Neck': 'mixamorig:Neck',
        'Head': 'mixamorig:Head',
        # Left Arm
        'LeftClavicle': 'mixamorig:LeftShoulder',
        'LeftShoulder': 'mixamorig:LeftArm',
        'LeftElbow': 'mixamorig:LeftForeArm',
        'LeftWrist': 'mixamorig:LeftHand',
        'LeftHandThumb1': 'mixamorig:LeftHandThumb1',
        'LeftHandThumb2': 'mixamorig:LeftHandThumb2',
        'LeftHandThumb3': 'mixamorig:LeftHandThumb3',
        'LeftHandIndex1': 'mixamorig:LeftHandIndex1',
        'LeftHandIndex2': 'mixamorig:LeftHandIndex2',
        'LeftHandIndex3': 'mixamorig:LeftHandIndex3',
        'LeftHandMiddle1': 'mixamorig:LeftHandMiddle1',
        'LeftHandMiddle2': 'mixamorig:LeftHandMiddle2',
        'LeftHandMiddle3': 'mixamorig:LeftHandMiddle3',
        'LeftHandRing1': 'mixamorig:LeftHandRing1',
        'LeftHandRing2': 'mixamorig:LeftHandRing2',
        'LeftHandRing3': 'mixamorig:LeftHandRing3',
        'LeftHandPinky1': 'mixamorig:LeftHandPinky1',
        'LeftHandPinky2': 'mixamorig:LeftHandPinky2',
        'LeftHandPinky3': 'mixamorig:LeftHandPinky3',
        # Right Arm
        'RightClavicle': 'mixamorig:RightShoulder',
        'RightShoulder': 'mixamorig:RightArm',
        'RightElbow': 'mixamorig:RightForeArm',
        'RightWrist': 'mixamorig:RightHand',
        'RightHandThumb1': 'mixamorig:RightHandThumb1',
        'RightHandThumb2': 'mixamorig:RightHandThumb2',
        'RightHandThumb3': 'mixamorig:RightHandThumb3',
        'RightHandIndex1': 'mixamorig:RightHandIndex1',
        'RightHandIndex2': 'mixamorig:RightHandIndex2',
        'RightHandIndex3': 'mixamorig:RightHandIndex3',
        'RightHandMiddle1': 'mixamorig:RightHandMiddle1',
        'RightHandMiddle2': 'mixamorig:RightHandMiddle2',
        'RightHandMiddle3': 'mixamorig:RightHandMiddle3',
        'RightHandRing1': 'mixamorig:RightHandRing1',
        'RightHandRing2': 'mixamorig:RightHandRing2',
        'RightHandRing3': 'mixamorig:RightHandRing3',
        'RightHandPinky1': 'mixamorig:RightHandPinky1',
        'RightHandPinky2': 'mixamorig:RightHandPinky2',
        'RightHandPinky3': 'mixamorig:RightHandPinky3',
        # Legs
        'LeftThigh': 'mixamorig:LeftUpLeg',
        'LeftKnee': 'mixamorig:LeftLeg',
        'LeftFoot': 'mixamorig:LeftFoot',
        'LeftToe': 'mixamorig:LeftToeBase',
        'RightThigh': 'mixamorig:RightUpLeg',
        'RightKnee': 'mixamorig:RightLeg',
        'RightFoot': 'mixamorig:RightFoot',
        'RightToe': 'mixamorig:RightToeBase',
    }

    for old_name, new_name in bone_map.items():
        b = arm.data.bones.get(old_name)
        if b:
            b.name = new_name

    for m in meshes:
        for old_name, new_name in bone_map.items():
            vg = m.vertex_groups.get(old_name)
            if vg:
                vg.name = new_name

    # 6. Global 90° rotation around Z
    print("=== 6. Applying 90° rotation around Z ===")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')

    R = Matrix.Rotation(-math.pi / 2, 4, 'Z')
    for o in bpy.context.scene.objects:
        o.matrix_world = R @ o.matrix_world

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for m in meshes:
        m.parent = arm

    # 7. T-Pose Arm Alignment in Pose Mode
    print("=== 7. Aligning arms to strictly collinear T-Pose ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    def align_arm_chain(pb_arm, pb_forearm, pb_wrist, target_dir):
        bpy.context.view_layer.update()
        v1 = (pb_forearm.head - pb_arm.head).normalized()
        q1 = v1.rotation_difference(target_dir)
        T1 = Matrix.Translation(pb_arm.head)
        rot_mat1 = T1 @ q1.to_matrix().to_4x4() @ T1.inverted()
        pb_arm.matrix = rot_mat1 @ pb_arm.matrix
        bpy.context.view_layer.update()

        v2 = (pb_wrist.head - pb_forearm.head).normalized()
        q2 = v2.rotation_difference(target_dir)
        T2 = Matrix.Translation(pb_forearm.head)
        rot_mat2 = T2 @ q2.to_matrix().to_4x4() @ T2.inverted()
        pb_forearm.matrix = rot_mat2 @ pb_forearm.matrix
        bpy.context.view_layer.update()

        v3 = (pb_wrist.tail - pb_wrist.head).normalized()
        if (v3.dot(target_dir)) < 0:
            v3 = -v3
        q3 = v3.rotation_difference(target_dir)
        T3 = Matrix.Translation(pb_wrist.head)
        rot_mat3 = T3 @ q3.to_matrix().to_4x4() @ T3.inverted()
        pb_wrist.matrix = rot_mat3 @ pb_wrist.matrix
        bpy.context.view_layer.update()

    align_arm_chain(arm.pose.bones['mixamorig:LeftArm'], arm.pose.bones['mixamorig:LeftForeArm'], arm.pose.bones['mixamorig:LeftHand'], Vector((1.0, 0.0, 0.0)))
    align_arm_chain(arm.pose.bones['mixamorig:RightArm'], arm.pose.bones['mixamorig:RightForeArm'], arm.pose.bones['mixamorig:RightHand'], Vector((-1.0, 0.0, 0.0)))

    # Bake pose into mesh vertex coordinates
    print("=== 8. Baking T-Pose to meshes and rest pose ===")
    bpy.ops.object.mode_set(mode='OBJECT')
    for m in meshes:
        bpy.context.view_layer.objects.active = m
        for mod in list(m.modifiers):
            if mod.type == 'ARMATURE':
                bpy.ops.object.modifier_apply(modifier=mod.name)
                new_mod = m.modifiers.new(name='Armature', type='ARMATURE')
                new_mod.object = arm

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 9. Height Calibration & Grounding
    print("=== 9. Calibrating height to 1.65m and grounding ===")
    min_z = 9999.0
    max_z = -9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z
            if world_v.z > max_z: max_z = world_v.z

    current_height = max_z - min_z
    print(f"Current mesh height: {current_height:.3f} (min_z: {min_z:.3f}, max_z: {max_z:.3f})")

    target_h = 1.65
    scale_factor = target_h / current_height

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(scale_factor, scale_factor, scale_factor))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    min_z = 9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z

    hips_bone = arm.data.bones.get('mixamorig:Hips')
    hips_world = arm.matrix_world @ hips_bone.head_local if hips_bone else Vector((0, 0, 0))
    offset = Vector((-hips_world.x, -hips_world.y, -min_z))

    for o in bpy.context.scene.objects:
        if not o.parent:
            o.location += offset

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    print("\n=== FINAL REST POSE BONE HEADS ===")
    for bname in ['mixamorig:Hips', 'mixamorig:LeftShoulder', 'mixamorig:LeftArm', 'mixamorig:LeftForeArm', 'mixamorig:LeftHand', 'mixamorig:RightShoulder', 'mixamorig:RightArm', 'mixamorig:RightForeArm', 'mixamorig:RightHand']:
        b = arm.data.bones.get(bname)
        if b:
            h = arm.matrix_world @ b.head_local
            print(f"{bname}: ({h.x:.4f}, {h.y:.4f}, {h.z:.4f})")

    # 10. Save .blend
    print(f"=== 10. Saving .blend to {out_blend} ===")
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)

    # 11. Export GLB
    print(f"=== 11. Exporting GLB to {out_glb} ===")
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_rest_position_armature=True
    )
    print(f"Successfully exported GLB: {out_glb} ({os.path.getsize(out_glb)} bytes)")

    # 12. Render Preview Thumbnail
    print("=== 12. Rendering preview thumbnail ===")
    render_preview(out_preview)

def render_preview(out_path):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'MATCAP'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = out_path

    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_obj = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.location = (0.0, -2.4, 1.1)
    cam_obj.rotation_euler = (math.radians(82), 0, 0)

    bpy.ops.render.render(write_still=True)
    print(f"Rendered preview to {out_path}")

if __name__ == "__main__":
    convert_inyeong()
