import bpy, math, os
from mathutils import Matrix, Vector

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

    # 3. Edit Mode bone cleanup and hierarchy fix
    print("=== 3. Cleaning bones in Edit Mode ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm.data.edit_bones

    # Unparent Pelvis from Root
    if 'Pelvis' in edit_bones:
        edit_bones['Pelvis'].parent = None

    # Reparent essential accessory bones
    if 'LeftUpArm_1' in edit_bones and 'LeftShoulder' in edit_bones:
        edit_bones['LeftUpArm_1'].parent = edit_bones['LeftShoulder']
    if 'LeftElbow_Pt_1' in edit_bones and 'LeftElbow' in edit_bones:
        edit_bones['LeftElbow_Pt_1'].parent = edit_bones['LeftElbow']
    if 'RightElbow_Pt_1' in edit_bones and 'RightElbow' in edit_bones:
        edit_bones['RightElbow_Pt_1'].parent = edit_bones['RightElbow']

    # Delete dummy leaf bones that have no vertices weighted
    delete_keywords = ['decor', 'socket', 'weapon', 'drv', 'camera', 'e_main', 'e_lefthand', 'e_righthand', 'rl_boneroot', 'root', 'hp_']
    bones_to_remove = []
    for b in edit_bones:
        nl = b.name.lower()
        if b.name in ['RL_BoneRoot', 'Root'] or any(k in nl for k in delete_keywords):
            bones_to_remove.append(b.name)

    for bname in bones_to_remove:
        if bname in edit_bones:
            edit_bones.remove(edit_bones[bname])

    print(f"Removed {len(bones_to_remove)} dummy bones. Remaining bones: {len(edit_bones)}")
    bpy.ops.object.mode_set(mode='OBJECT')

    # 4. Bone name mapping to standard Mixamo naming
    print("=== 4. Mapping bones to Mixamo standard ===")
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
        'LeftHandRing': 'mixamorig:LeftHandRing1',
        'LeftHandRing1': 'mixamorig:LeftHandRing2',
        'LeftHandRing2': 'mixamorig:LeftHandRing3',
        'LeftHandPinky': 'mixamorig:LeftHandPinky1',
        'LeftHandPinky1': 'mixamorig:LeftHandPinky2',
        'LeftHandPinky2': 'mixamorig:LeftHandPinky3',
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
        'RightHandRing': 'mixamorig:RightHandRing1',
        'RightHandRing1': 'mixamorig:RightHandRing2',
        'RightHandRing2': 'mixamorig:RightHandRing3',
        'RightHandPinky': 'mixamorig:RightHandPinky1',
        'RightHandPinky1': 'mixamorig:RightHandPinky2',
        'RightHandPinky2': 'mixamorig:RightHandPinky3',
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

    # Rename bones in armature
    for old_name, new_name in bone_map.items():
        b = arm.data.bones.get(old_name)
        if b:
            b.name = new_name

    # Rename vertex groups on all meshes
    for m in meshes:
        for old_name, new_name in bone_map.items():
            vg = m.vertex_groups.get(old_name)
            if vg:
                vg.name = new_name

    # Merge LeftUpArm_1 (armband) weight into mixamorig:LeftArm
    for m in meshes:
        vg_armband = m.vertex_groups.get('LeftUpArm_1')
        if vg_armband:
            vg_arm = m.vertex_groups.get('mixamorig:LeftArm')
            if not vg_arm:
                vg_arm = m.vertex_groups.new(name='mixamorig:LeftArm')
            for i in range(len(m.data.vertices)):
                try:
                    w = vg_armband.weight(i)
                    if w > 0:
                        vg_arm.add([i], w, 'ADD')
                except RuntimeError:
                    pass

    # 5. Global 90° rotation around Z to align character facing direction
    print("=== 5. Applying 90° rotation around Z ===")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')

    R = Matrix.Rotation(-math.pi / 2, 4, 'Z')
    for o in bpy.context.scene.objects:
        o.matrix_world = R @ o.matrix_world

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for m in meshes:
        m.parent = arm

    # 6. Perfect T-Pose alignment in Pose Mode
    print("=== 6. Aligning arms to strictly collinear T-Pose ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    def align_arm_chain(pb_arm, pb_forearm, pb_wrist, target_dir):
        bpy.context.view_layer.update()
        # Upper Arm
        v1 = (pb_forearm.head - pb_arm.head).normalized()
        q1 = v1.rotation_difference(target_dir)
        T1 = Matrix.Translation(pb_arm.head)
        rot_mat1 = T1 @ q1.to_matrix().to_4x4() @ T1.inverted()
        pb_arm.matrix = rot_mat1 @ pb_arm.matrix
        bpy.context.view_layer.update()

        # Forearm
        v2 = (pb_wrist.head - pb_forearm.head).normalized()
        q2 = v2.rotation_difference(target_dir)
        T2 = Matrix.Translation(pb_forearm.head)
        rot_mat2 = T2 @ q2.to_matrix().to_4x4() @ T2.inverted()
        pb_forearm.matrix = rot_mat2 @ pb_forearm.matrix
        bpy.context.view_layer.update()

        # Wrist
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
    print("=== 7. Baking T-Pose to meshes and rest pose ===")
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

    # 8. Height Calibration & Grounding
    print("=== 8. Calibrating height to 1.65m and grounding ===")
    min_z = 9999.0
    max_z = -9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z
            if world_v.z > max_z: max_z = world_v.z

    current_height = max_z - min_z
    print(f"Current mesh height: {current_height:.3f} (min_z: {min_z:.3f}, max_z: {max_z:.3f})")

    # Target height 1.65 meters
    target_h = 1.65
    scale_factor = target_h / current_height

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(scale_factor, scale_factor, scale_factor))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Recalculate min_z after scale
    min_z = 9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z

    # Center Hips in X/Y and ground feet at Z = 0
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

    # 9. Save .blend
    print(f"=== 9. Saving .blend to {out_blend} ===")
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)

    # 10. Export GLB
    print(f"=== 10. Exporting GLB to {out_glb} ===")
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

    # 11. Render 3D Preview Thumbnail
    print("=== 11. Rendering preview thumbnail ===")
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

    # Add Camera
    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_obj = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.location = (0.0, -2.4, 1.1)
    cam_obj.rotation_euler = (math.radians(82), 0, 0)

    # Add Lights
    light_data1 = bpy.data.lights.new(name="KeyLight", type='SUN')
    light_data1.energy = 3.5
    light_obj1 = bpy.data.objects.new(name="KeyLight", object_data=light_data1)
    scene.collection.objects.link(light_obj1)
    light_obj1.rotation_euler = (math.radians(45), math.radians(15), math.radians(-30))

    light_data2 = bpy.data.lights.new(name="FillLight", type='SUN')
    light_data2.energy = 2.0
    light_obj2 = bpy.data.objects.new(name="FillLight", object_data=light_data2)
    scene.collection.objects.link(light_obj2)
    light_obj2.rotation_euler = (math.radians(30), math.radians(-20), math.radians(150))

    bpy.ops.render.render(write_still=True)
    print(f"Rendered preview to {out_path}")

if __name__ == "__main__":
    convert_inyeong()
