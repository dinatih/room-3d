import bpy
import os
import re
import math
import mathutils
from mathutils import Vector, Quaternion, Matrix

CC_TO_MIXAMO = {
    'CC_Base_Hip': 'mixamorig:Hips',
    'CC_Base_Waist': 'mixamorig:Spine',
    'CC_Base_Spine01': 'mixamorig:Spine1',
    'CC_Base_Spine02': 'mixamorig:Spine2',
    'CC_Base_NeckTwist01': 'mixamorig:Neck',
    'CC_Base_Head': 'mixamorig:Head',
    'CC_Base_L_Clavicle': 'mixamorig:LeftShoulder',
    'CC_Base_L_Upperarm': 'mixamorig:LeftArm',
    'CC_Base_L_Forearm': 'mixamorig:LeftForeArm',
    'CC_Base_L_Hand': 'mixamorig:LeftHand',
    'CC_Base_R_Clavicle': 'mixamorig:RightShoulder',
    'CC_Base_R_Upperarm': 'mixamorig:RightArm',
    'CC_Base_R_Forearm': 'mixamorig:RightForeArm',
    'CC_Base_R_Hand': 'mixamorig:RightHand',
    'CC_Base_L_Thigh': 'mixamorig:LeftUpLeg',
    'CC_Base_L_Calf': 'mixamorig:LeftLeg',
    'CC_Base_L_Foot': 'mixamorig:LeftFoot',
    'CC_Base_L_ToeBase': 'mixamorig:LeftToeBase',
    'CC_Base_R_Thigh': 'mixamorig:RightUpLeg',
    'CC_Base_R_Calf': 'mixamorig:RightLeg',
    'CC_Base_R_Foot': 'mixamorig:RightFoot',
    'CC_Base_R_ToeBase': 'mixamorig:RightToeBase',
    # Poitrine native CC3/CC4
    'CC_Base_L_Breast': 'breast_left',
    'CC_Base_R_Breast': 'breast_right',
    # Fingers Left
    'CC_Base_L_Thumb1': 'mixamorig:LeftHandThumb1',
    'CC_Base_L_Thumb2': 'mixamorig:LeftHandThumb2',
    'CC_Base_L_Thumb3': 'mixamorig:LeftHandThumb3',
    'CC_Base_L_Index1': 'mixamorig:LeftHandIndex1',
    'CC_Base_L_Index2': 'mixamorig:LeftHandIndex2',
    'CC_Base_L_Index3': 'mixamorig:LeftHandIndex3',
    'CC_Base_L_Mid1': 'mixamorig:LeftHandMiddle1',
    'CC_Base_L_Mid2': 'mixamorig:LeftHandMiddle2',
    'CC_Base_L_Mid3': 'mixamorig:LeftHandMiddle3',
    'CC_Base_L_Ring1': 'mixamorig:LeftHandRing1',
    'CC_Base_L_Ring2': 'mixamorig:LeftHandRing2',
    'CC_Base_L_Ring3': 'mixamorig:LeftHandRing3',
    'CC_Base_L_Pinky1': 'mixamorig:LeftHandPinky1',
    'CC_Base_L_Pinky2': 'mixamorig:LeftHandPinky2',
    'CC_Base_L_Pinky3': 'mixamorig:LeftHandPinky3',
    # Fingers Right
    'CC_Base_R_Thumb1': 'mixamorig:RightHandThumb1',
    'CC_Base_R_Thumb2': 'mixamorig:RightHandThumb2',
    'CC_Base_R_Thumb3': 'mixamorig:RightHandThumb3',
    'CC_Base_R_Index1': 'mixamorig:RightHandIndex1',
    'CC_Base_R_Index2': 'mixamorig:RightHandIndex2',
    'CC_Base_R_Index3': 'mixamorig:RightHandIndex3',
    'CC_Base_R_Mid1': 'mixamorig:RightHandMiddle1',
    'CC_Base_R_Mid2': 'mixamorig:RightHandMiddle2',
    'CC_Base_R_Mid3': 'mixamorig:RightHandMiddle3',
    'CC_Base_R_Ring1': 'mixamorig:RightHandRing1',
    'CC_Base_R_Ring2': 'mixamorig:RightHandRing2',
    'CC_Base_R_Ring3': 'mixamorig:RightHandRing3',
    'CC_Base_R_Pinky1': 'mixamorig:RightHandPinky1',
    'CC_Base_R_Pinky2': 'mixamorig:RightHandPinky2',
    'CC_Base_R_Pinky3': 'mixamorig:RightHandPinky3',
}

BONES_TO_MERGE = {
    # Pelvis
    'CC_Base_Pelvis': 'mixamorig:Hips',
    # Neck 2
    'CC_Base_NeckTwist02': 'mixamorig:Neck',
    # Ribs & Spine
    'CC_Base_L_RibsTwist': 'mixamorig:Spine2',
    'CC_Base_R_RibsTwist': 'mixamorig:Spine2',
    # Arms twist & share
    'CC_Base_L_UpperarmTwist01': 'mixamorig:LeftArm',
    'CC_Base_L_UpperarmTwist02': 'mixamorig:LeftArm',
    'CC_Base_R_UpperarmTwist01': 'mixamorig:RightArm',
    'CC_Base_R_UpperarmTwist02': 'mixamorig:RightArm',
    'CC_Base_L_ForearmTwist01': 'mixamorig:LeftForeArm',
    'CC_Base_L_ForearmTwist02': 'mixamorig:LeftForeArm',
    'CC_Base_R_ForearmTwist01': 'mixamorig:RightForeArm',
    'CC_Base_R_ForearmTwist02': 'mixamorig:RightForeArm',
    'CC_Base_L_ElbowShareBone': 'mixamorig:LeftForeArm',
    'CC_Base_R_ElbowShareBone': 'mixamorig:RightForeArm',
    # Legs twist & share
    'CC_Base_L_ThighTwist01': 'mixamorig:LeftUpLeg',
    'CC_Base_L_ThighTwist02': 'mixamorig:LeftUpLeg',
    'CC_Base_R_ThighTwist01': 'mixamorig:RightUpLeg',
    'CC_Base_R_ThighTwist02': 'mixamorig:RightUpLeg',
    'CC_Base_L_CalfTwist01': 'mixamorig:LeftLeg',
    'CC_Base_L_CalfTwist02': 'mixamorig:LeftLeg',
    'CC_Base_R_CalfTwist01': 'mixamorig:RightLeg',
    'CC_Base_R_CalfTwist02': 'mixamorig:RightLeg',
    'CC_Base_L_KneeShareBone': 'mixamorig:LeftLeg',
    'CC_Base_R_KneeShareBone': 'mixamorig:RightLeg',
    # Toes
    'CC_Base_L_ToeBaseShareBone': 'mixamorig:LeftToeBase',
    'CC_Base_L_BigToe1': 'mixamorig:LeftToeBase',
    'CC_Base_L_IndexToe1': 'mixamorig:LeftToeBase',
    'CC_Base_L_MidToe1': 'mixamorig:LeftToeBase',
    'CC_Base_L_RingToe1': 'mixamorig:LeftToeBase',
    'CC_Base_L_PinkyToe1': 'mixamorig:LeftToeBase',
    'CC_Base_R_ToeBaseShareBone': 'mixamorig:RightToeBase',
    'CC_Base_R_BigToe1': 'mixamorig:RightToeBase',
    'CC_Base_R_IndexToe1': 'mixamorig:RightToeBase',
    'CC_Base_R_MidToe1': 'mixamorig:RightToeBase',
    'CC_Base_R_RingToe1': 'mixamorig:RightToeBase',
    'CC_Base_R_PinkyToe1': 'mixamorig:RightToeBase',
    # Head / Face / Teeth / Eyes / Tongue
    'CC_Base_FacialBone': 'mixamorig:Head',
    'CC_Base_JawRoot': 'mixamorig:Head',
    'CC_Base_UpperJaw': 'mixamorig:Head',
    'CC_Base_Tongue01': 'mixamorig:Head',
    'CC_Base_Tongue02': 'mixamorig:Head',
    'CC_Base_Tongue03': 'mixamorig:Head',
    'CC_Base_Teeth01': 'mixamorig:Head',
    'CC_Base_Teeth02': 'mixamorig:Head',
    'CC_Base_L_Eye': 'mixamorig:Head',
    'CC_Base_R_Eye': 'mixamorig:Head',
}

def relink_textures(texture_dirs):
    all_files = {}
    for tdir in texture_dirs:
        if os.path.exists(tdir):
            for root, _, files in os.walk(tdir):
                for f in files:
                    base = os.path.splitext(f)[0].lower()
                    all_files[base] = os.path.join(root, f)
                    all_files[f.lower()] = os.path.join(root, f)
    
    for img in bpy.data.images:
        orig_name = os.path.basename(img.filepath or img.name)
        base = os.path.splitext(orig_name)[0].lower()
        if base in all_files:
            img.filepath = all_files[base]
            try:
                img.reload()
            except Exception:
                pass
        elif orig_name.lower() in all_files:
            img.filepath = all_files[orig_name.lower()]
            try:
                img.reload()
            except Exception:
                pass

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
    print(f"  📷 Preview rendue: {out_png}")

def is_hair_or_face(mesh_name):
    n = mesh_name.lower()
    keywords = ('hair', 'scalp', 'wavy', 'curly', 'braid', 'bun', 'fringe', 'bang',
                'ponytail', 'side_part', 'dread', 'afro', 'part_', 'eye', 'teeth',
                'tongue', 'tear', 'occlusion', 'lash', 'brow')
    return any(kw in n for kw in keywords)

def process_character(char_id, input_path, texture_dirs, target_height_cm=172.0):
    print("\n" + "="*65)
    print(f"🚀 Traitement de {char_id} ({input_path})")
    print("="*65)

    out_dir = f"public/characters/{char_id}"
    out_glb = f"{out_dir}/{char_id}.glb"
    out_blend = f"{out_dir}/{char_id}_rigged.blend"
    out_png = f"{out_dir}/{char_id}_3d_preview.png"
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    if input_path.endswith('.blend'):
        bpy.ops.wm.open_mainfile(filepath=input_path)
    elif input_path.endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=input_path)
    else:
        raise ValueError(f"Format inconnu: {input_path}")

    # 0. Rendre tous les objets visibles dans le viewport
    for o in bpy.data.objects:
        o.hide_set(False)
        o.hide_viewport = False

    # 1. Nettoyer les caméras, lumières et objets parasites
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT') or 'icosphere' in o.name.lower():
            bpy.data.objects.remove(o, do_unlink=True)

    # 2. Supprimer toutes les actions et données d'animation
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']

    # 3. Réinitialiser la pose à l'identité absolue (vrai rest pose)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        pb.matrix_basis.identity()
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 4. Relier les textures
    relink_textures(texture_dirs)

    # 5. Préparation des poids de buste (65% breast, 35% Spine2 comme Jennifer) et nettoyage sur cheveux/yeux
    for m in meshes:
        if is_hair_or_face(m.name):
            for vg_name in ('CC_Base_L_Breast', 'CC_Base_R_Breast', 'breast_left', 'breast_right'):
                vg = m.vertex_groups.get(vg_name)
                if vg:
                    m.vertex_groups.remove(vg)
            continue

        s2_vg = m.vertex_groups.get('mixamorig:Spine2') or m.vertex_groups.get('CC_Base_Spine02')
        if not s2_vg:
            s2_vg = m.vertex_groups.new(name='CC_Base_Spine02')

        for b_src, b_tgt in (('CC_Base_L_Breast', 'breast_left'), ('CC_Base_R_Breast', 'breast_right')):
            vg = m.vertex_groups.get(b_src) or m.vertex_groups.get(b_tgt)
            if vg:
                vg.name = b_tgt
                for v in m.data.vertices:
                    for g in v.groups:
                        if g.group == vg.index:
                            w = g.weight
                            if w > 0.0005:
                                g.weight = w * 0.65
                                s2_vg.add([v.index], w * 0.35, 'ADD')

    # 6. Renommer les vertex groups principaux sur tous les maillages
    for m in meshes:
        for vg in m.vertex_groups:
            if vg.name in CC_TO_MIXAMO:
                vg.name = CC_TO_MIXAMO[vg.name]

    # 7. Fusionner les vertex groups des os secondaires vers les os parents
    for m in meshes:
        for src_name, tgt_name in BONES_TO_MERGE.items():
            src_vg = m.vertex_groups.get(src_name)
            if not src_vg:
                continue
            tgt_vg = m.vertex_groups.get(tgt_name) or m.vertex_groups.new(name=tgt_name)
            for v in m.data.vertices:
                w = 0.0
                for g in v.groups:
                    if g.group == src_vg.index:
                        w = g.weight
                        break
                if w > 0.0005:
                    tgt_vg.add([v.index], w, 'ADD')
            m.vertex_groups.remove(src_vg)

    # 8. Renommer les os principaux dans l'armature
    for b in arm.data.bones:
        if b.name in CC_TO_MIXAMO:
            b.name = CC_TO_MIXAMO[b.name]

    # 9. CONVERSION A-POSE EN VRAIE T-POSE (XBot style)
    # Rotation des bras à l'horizontale parfaite (vecteur (1,0,0) et (-1,0,0))
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for side, target_dir in [('Left', Vector((1.0, 0.0, 0.0))), ('Right', Vector((-1.0, 0.0, 0.0)))]:
        pb = arm.pose.bones.get(f'mixamorig:{side}Arm')
        if pb:
            v_curr = (pb.tail - pb.head).normalized()
            q_diff = v_curr.rotation_difference(target_dir)
            pb.matrix = Matrix.Translation(pb.head) @ q_diff.to_matrix().to_4x4() @ Matrix.Translation(-pb.head) @ pb.matrix

    bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='OBJECT')

    # Cuisson de la T-pose sur la géométrie des maillages (en préservant les shape keys faciales)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for m in meshes:
        eval_obj = m.evaluated_get(depsgraph)
        eval_mesh = eval_obj.to_mesh()
        if m.data.shape_keys:
            basis = m.data.shape_keys.key_blocks.get('Basis')
            if basis:
                old_basis = [Vector(v.co) for v in basis.data]
                new_basis = [Vector(v.co) for v in eval_mesh.vertices]
                for kb in m.data.shape_keys.key_blocks:
                    if kb == basis:
                        for i, v in enumerate(new_basis):
                            kb.data[i].co = v
                    else:
                        for i in range(len(new_basis)):
                            diff = kb.data[i].co - old_basis[i]
                            if diff.length_squared > 1e-6:
                                kb.data[i].co = new_basis[i] + diff
                            else:
                                kb.data[i].co = new_basis[i]
                for i, v in enumerate(new_basis):
                    m.data.vertices[i].co = v
        else:
            for i, v in enumerate(eval_mesh.vertices):
                m.data.vertices[i].co = v.co
        eval_obj.to_mesh_clear()

    # Application de la T-pose comme Rest Pose officielle sur l'armature
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    print("  ✅ Conversion A-pose -> vraie T-pose (XBot) appliquée et cuite au rest pose")

    # 10. Unparent mixamorig:Hips et configuration anatomique des os de poitrine
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    eb_hips = eb.get('mixamorig:Hips')
    if eb_hips:
        eb_hips.parent = None
        print("  ✅ mixamorig:Hips détaché en racine unique de l'armature")

    # Positionnement anatomique des os de poitrine (base à la cage thoracique, pointe au téton)
    parent_bone = eb.get('mixamorig:Spine2')
    body_obj = bpy.data.objects.get('CC_Base_Body')
    if body_obj and parent_bone:
        s2_mid_y = (parent_bone.head.y + parent_bone.tail.y) / 2.0
        z_min = parent_bone.head.z - 0.05
        z_max = parent_bone.tail.z + 0.05

        l_cands = [v for v in body_obj.data.vertices if v.co.x > 0.03 and z_min < v.co.z < z_max]
        r_cands = [v for v in body_obj.data.vertices if v.co.x < -0.03 and z_min < v.co.z < z_max]
        if l_cands and r_cands:
            min_l = min(l_cands, key=lambda v: v.co.y)
            min_r = min(r_cands, key=lambda v: v.co.y)

            tip_l = Vector(min_l.co)
            tip_r = Vector(min_r.co)
            base_l = Vector((tip_l.x * 0.45, s2_mid_y, tip_l.z))
            base_r = Vector((tip_r.x * 0.45, s2_mid_y, tip_r.z))

            eb_bl = eb.get('breast_left') or eb.get('CC_Base_L_Breast') or eb.new('breast_left')
            eb_bl.name = 'breast_left'
            eb_bl.head = base_l
            eb_bl.tail = tip_l
            eb_bl.parent = parent_bone
            eb_bl.use_deform = True
            dir_l = (tip_l - base_l).normalized()
            len_l = (tip_l - base_l).length

            ble = eb.get('breast_left_end') or eb.new('breast_left_end')
            ble.head = tip_l
            ble.tail = tip_l + dir_l * len_l
            ble.parent = eb_bl
            ble.use_deform = False
            print(f"  ✅ breast_left configuré: base={base_l}, pointe={tip_l}, longueur={len_l*100:.1f} cm")

            eb_br = eb.get('breast_right') or eb.get('CC_Base_R_Breast') or eb.new('breast_right')
            eb_br.name = 'breast_right'
            eb_br.head = base_r
            eb_br.tail = tip_r
            eb_br.parent = parent_bone
            eb_br.use_deform = True
            dir_r = (tip_r - base_r).normalized()
            len_r = (tip_r - base_r).length

            bre = eb.get('breast_right_end') or eb.new('breast_right_end')
            bre.head = tip_r
            bre.tail = tip_r + dir_r * len_r
            bre.parent = eb_br
            bre.use_deform = False
            print(f"  ✅ breast_right configuré: base={base_r}, pointe={tip_r}, longueur={len_r*100:.1f} cm")

    # Supprimer CC_Base_BoneRoot et tous les os secondaires fusionnés
    bones_to_delete = set(list(BONES_TO_MERGE.keys()) + ['CC_Base_BoneRoot', 'neutral_bone', 'CC_Base_Pivot'])
    for b in list(eb.keys()):
        if not b.startswith('mixamorig:') and not b.startswith('breast_'):
            bones_to_delete.add(b)

    # Fusionner les vertex groups des os restants inconnus vers leur parent ou Head
    for b_name in bones_to_delete:
        target_name = BONES_TO_MERGE.get(b_name)
        if not target_name:
            target_name = 'mixamorig:Head' if ('sunglass' in b_name.lower() or 'glass' in b_name.lower() or is_hair_or_face(b_name)) else 'mixamorig:Spine2'
        for m in meshes:
            src_vg = m.vertex_groups.get(b_name)
            if src_vg:
                tgt_vg = m.vertex_groups.get(target_name) or m.vertex_groups.new(name=target_name)
                for v in m.data.vertices:
                    w = 0.0
                    for g in v.groups:
                        if g.group == src_vg.index:
                            w = g.weight
                            break
                    if w > 0.0005:
                        tgt_vg.add([v.index], w, 'ADD')
                m.vertex_groups.remove(src_vg)
        if b_name in eb:
            eb.remove(eb[b_name])

    print(f"  🗑 Supprimé {len(bones_to_delete)} os secondaires / parasites du rig")
    bpy.ops.object.mode_set(mode='OBJECT')

    # Nettoyer les VGs résiduels sur les maillages qui n'existent pas dans l'armature
    valid_bone_names = set(b.name for b in arm.data.bones)
    for m in meshes:
        for vg in list(m.vertex_groups):
            if vg.name not in valid_bone_names:
                m.vertex_groups.remove(vg)

    # 11. Détacher les maillages de la hiérarchie objet de l'Armature pour éliminer neutral_bone au glTF export
    for m in meshes:
        mat = m.matrix_world.copy()
        m.parent = None
        m.matrix_world = mat
        arm_mods = [mod for mod in m.modifiers if mod.type == 'ARMATURE']
        if not arm_mods:
            mod = m.modifiers.new(name='Armature', type='ARMATURE')
            mod.object = arm
        else:
            arm_mods[0].object = arm

    # Uniformiser l'échelle à 1.0 sur l'armature et les maillages
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    print("  ✅ Échelles et rotations appliquées (scale = 1.0, meshes unparented)")

    # 12. Calibrer la hauteur globale au besoin (en mètres dans Blender)
    bbox_all = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box]
    min_z = min(v.z for v in bbox_all)
    max_z = max(v.z for v in bbox_all)
    current_h_cm = (max_z - min_z) * 100.0
    print(f"  📏 Hauteur actuelle: {current_h_cm:.1f} cm (cible: {target_height_cm:.1f} cm)")
    if abs(current_h_cm - target_height_cm) > 1.0 and current_h_cm > 20.0:
        scale_mult = target_height_cm / current_h_cm
        for o in [arm] + meshes:
            o.scale *= scale_mult
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        print(f"  ✅ Redimensionné à {target_height_cm:.1f} cm (facteur {scale_mult:.3f})")

    # 13. Calage au sol (Z = 0)
    bbox_all = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box]
    min_z = min(v.z for v in bbox_all)
    max_z = max(v.z for v in bbox_all)
    final_h_cm = (max_z - min_z) * 100.0
    if abs(min_z) > 0.001:
        for o in bpy.data.objects:
            if o.parent is None:
                o.location.z -= min_z
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
        print(f"  ✅ Pieds calés au sol Z=0 (ajustement {min_z:.4f}m)")

    # 14. Synchronisation des vêtements / soutiens-gorge avec la poitrine du corps
    body_obj = bpy.data.objects.get('CC_Base_Body')
    if body_obj:
        for m in meshes:
            if m != body_obj and not is_hair_or_face(m.name):
                # Vérifier si ce maillage a des sommets au niveau de la poitrine
                s2 = arm.data.bones.get('mixamorig:Spine2')
                s2_head_z = (arm.matrix_world @ s2.head_local).z
                mat = m.matrix_world
                near_chest = any((s2_head_z - 0.20 <= (mat @ v.co).z <= s2_head_z + 0.25) and ((mat @ v.co).y < -0.05) for v in m.data.vertices)
                if near_chest and not m.vertex_groups.get('breast_left'):
                    # Transférer les poids des groupes breast_left et breast_right
                    dt = m.modifiers.new(name='BreastWeightTransfer', type='DATA_TRANSFER')
                    dt.object = body_obj
                    dt.use_vert_data = True
                    dt.data_types_verts = {'VGROUP_WEIGHTS'}
                    dt.vert_mapping = 'NEAREST'
                    bpy.context.view_layer.objects.active = m
                    bpy.ops.object.datalayout_transfer(modifier=dt.name)
                    bpy.ops.object.modifier_apply(modifier=dt.name)
                    print(f"  ✨ Poids de poitrine transférés sur {m.name}")

    # 13. Garantie absolue zéro sommet non-pondéré (résolution définitive des tétons/sommets figés)
    total_unweighted_fixed = 0
    for m in meshes:
        for v in m.data.vertices:
            tot_w = sum(g.weight for g in v.groups)
            if tot_w < 0.001:
                # Rattacher au torse pour suivre le corps à 100%
                vg = m.vertex_groups.get('mixamorig:Spine2') or m.vertex_groups.new(name='mixamorig:Spine2')
                vg.add([v.index], 1.0, 'REPLACE')
                total_unweighted_fixed += 1

    if total_unweighted_fixed > 0:
        print(f"  🛡️ {total_unweighted_fixed} sommets orphelins (non-pondérés) rattachés à mixamorig:Spine2")
    else:
        print("  🛡️ 100% des sommets sont parfaitement pondérés !")

    # 15. Nettoyage final des actions
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    # 16. Sauvegarde .blend et export GLB
    bpy.ops.wm.save_as_mainfile(filepath=out_blend, compress=True)
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False
    )
    print(f"  📦 Export GLB terminé: {out_glb}")

    # 17. Rendu preview PNG
    render_preview(out_glb, out_png)
    print(f"🎉 {char_id} traité avec succès ! Hauteur finale: {final_h_cm:.1f} cm")
    return final_h_cm

if __name__ == '__main__':
    import sys
    args = sys.argv
    if '--' in args:
        char_to_run = args[args.index('--') + 1]
    else:
        char_to_run = 'all'

    configs = {
        'ivy': {
            'input_path': 'sources_backup/temp_extract/ivy/model/Ivy.fbx',
            'texture_dirs': [
                'sources_backup/temp_extract/ivy/textures',
                'sources_backup/temp_extract/ivy/model/textures'
            ],
            'height': 170.5
        },
        'rose': {
            'input_path': 'sources_backup/temp_extract/rose/source/Rose.blend',
            'texture_dirs': [
                'sources_backup/temp_extract/rose/textures'
            ],
            'height': 172.0
        },
        'beth': {
            'input_path': 'sources_backup/temp_extract/beth/source/Beth.blend',
            'texture_dirs': [
                'sources_backup/temp_extract/beth/textures'
            ],
            'height': 169.0
        }
    }

    if char_to_run in configs:
        cfg = configs[char_to_run]
        process_character(char_to_run, cfg['input_path'], cfg['texture_dirs'], cfg['height'])
    elif char_to_run == 'all':
        for cid, cfg in configs.items():
            process_character(cid, cfg['input_path'], cfg['texture_dirs'], cfg['height'])
