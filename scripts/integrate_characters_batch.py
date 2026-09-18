import bpy
import os
import re
import math
import mathutils
from mathutils import Vector

CC3_TO_MIXAMO = {
    'CC_Base_Hip': 'Hips',
    'CC_Base_Pelvis': 'Pelvis',
    'CC_Base_Waist': 'Spine',
    'CC_Base_Spine01': 'Spine1',
    'CC_Base_Spine02': 'Spine2',
    'CC_Base_NeckTwist01': 'Neck',
    'CC_Base_NeckTwist02': 'Neck1',
    'CC_Base_Head': 'Head',
    'CC_Base_L_Clavicle': 'LeftShoulder',
    'CC_Base_L_Upperarm': 'LeftArm',
    'CC_Base_L_Forearm': 'LeftForeArm',
    'CC_Base_L_Hand': 'LeftHand',
    'CC_Base_R_Clavicle': 'RightShoulder',
    'CC_Base_R_Upperarm': 'RightArm',
    'CC_Base_R_Forearm': 'RightForeArm',
    'CC_Base_R_Hand': 'RightHand',
    'CC_Base_L_Thigh': 'LeftUpLeg',
    'CC_Base_L_Calf': 'LeftLeg',
    'CC_Base_L_Foot': 'LeftFoot',
    'CC_Base_L_ToeBase': 'LeftToeBase',
    'CC_Base_R_Thigh': 'RightUpLeg',
    'CC_Base_R_Calf': 'RightLeg',
    'CC_Base_R_Foot': 'RightFoot',
    'CC_Base_R_ToeBase': 'RightToeBase',
    'CC_Base_L_Thumb1': 'LeftHandThumb1',
    'CC_Base_L_Thumb2': 'LeftHandThumb2',
    'CC_Base_L_Thumb3': 'LeftHandThumb3',
    'CC_Base_L_Index1': 'LeftHandIndex1',
    'CC_Base_L_Index2': 'LeftHandIndex2',
    'CC_Base_L_Index3': 'LeftHandIndex3',
    'CC_Base_L_Mid1': 'LeftHandMiddle1',
    'CC_Base_L_Mid2': 'LeftHandMiddle2',
    'CC_Base_L_Mid3': 'LeftHandMiddle3',
    'CC_Base_L_Ring1': 'LeftHandRing1',
    'CC_Base_L_Ring2': 'LeftHandRing2',
    'CC_Base_L_Ring3': 'LeftHandRing3',
    'CC_Base_L_Pinky1': 'LeftHandPinky1',
    'CC_Base_L_Pinky2': 'LeftHandPinky2',
    'CC_Base_L_Pinky3': 'LeftHandPinky3',
    'CC_Base_R_Thumb1': 'RightHandThumb1',
    'CC_Base_R_Thumb2': 'RightHandThumb2',
    'CC_Base_R_Thumb3': 'RightHandThumb3',
    'CC_Base_R_Index1': 'RightHandIndex1',
    'CC_Base_R_Index2': 'RightHandIndex2',
    'CC_Base_R_Index3': 'RightHandIndex3',
    'CC_Base_R_Mid1': 'RightHandMiddle1',
    'CC_Base_R_Mid2': 'RightHandMiddle2',
    'CC_Base_R_Mid3': 'RightHandMiddle3',
    'CC_Base_R_Ring1': 'RightHandRing1',
    'CC_Base_R_Ring2': 'RightHandRing2',
    'CC_Base_R_Ring3': 'RightHandRing3',
    'CC_Base_R_Pinky1': 'RightHandPinky1',
    'CC_Base_R_Pinky2': 'RightHandPinky2',
    'CC_Base_R_Pinky3': 'RightHandPinky3',
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

def normalize_rig(arm, meshes):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='OBJECT')
    
    for b in arm.data.bones:
        m = re.match(r'^mixamorig\d*:(.+)$', b.name)
        if m:
            b.name = f'mixamorig:{m.group(1)}'
        elif b.name in CC3_TO_MIXAMO:
            b.name = f'mixamorig:{CC3_TO_MIXAMO[b.name]}'
            
    for m in meshes:
        for vg in m.vertex_groups:
            match = re.match(r'^mixamorig\d*:(.+)$', vg.name)
            if match:
                vg.name = f'mixamorig:{match.group(1)}'
            elif vg.name in CC3_TO_MIXAMO:
                vg.name = f'mixamorig:{CC3_TO_MIXAMO[vg.name]}'

def remove_existing_breast_elements(arm_obj, meshes):
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_obj.data.edit_bones
    to_remove = [b.name for b in eb if 'breast' in b.name.lower()]
    for name in to_remove:
        if name in eb:
            eb.remove(eb[name])
    bpy.ops.object.mode_set(mode='OBJECT')
    if to_remove:
        print(f"  🗑 Supprimé anciens bones: {to_remove}")

    for m in meshes:
        for vg in list(m.vertex_groups):
            if 'breast' in vg.name.lower():
                m.vertex_groups.remove(vg)

def detect_breast_peaks(arm_obj, meshes, spine2_name='mixamorig:Spine2'):
    arm = arm_obj.data
    s2 = arm.bones.get(spine2_name)
    if not s2:
        for b in arm.bones:
            if 'Spine2' in b.name or 'spine2' in b.name.lower():
                s2 = b
                spine2_name = b.name
                break
    if not s2:
        raise RuntimeError(f"Bone {spine2_name} introuvable.")

    s2_head_w = arm_obj.matrix_world @ s2.head_local
    s2_tail_w = arm_obj.matrix_world @ s2.tail_local
    s2_head_z = s2_head_w.z
    s2_mid_y = (s2_head_w.y + s2_tail_w.y) / 2.0

    front_verts = []
    spine_names = ['mixamorig:Spine', 'mixamorig:Spine1', spine2_name, 'mixamorig:Spine3', 'CC_Base_Spine01', 'CC_Base_Spine02']
    
    for m in meshes:
        vgs = [m.vertex_groups.get(n) for n in spine_names]
        vgs = [g for g in vgs if g is not None]
        if not vgs:
            continue
        mat = m.matrix_world
        for v in m.data.vertices:
            w = sum(g.weight for g in v.groups if any(g.group == vg.index for vg in vgs))
            if w > 0.10:
                wco = mat @ v.co
                if wco.y < (s2_mid_y - 0.01) and (s2_head_z - 0.20 <= wco.z <= s2_head_z + 0.25):
                    front_verts.append(wco.copy())

    left_verts = [p for p in front_verts if p.x > 0.015]
    right_verts = [p for p in front_verts if p.x < -0.015]

    if not left_verts or not right_verts:
        print("  ⚠ Détection géométrique insuffisante, fallback anatomique.")
        peak_l = Vector((0.065, s2_mid_y - 0.12, s2_head_z - 0.03))
        peak_r = Vector((-0.065, s2_mid_y - 0.12, s2_head_z - 0.03))
    else:
        peak_l = min(left_verts, key=lambda p: p.y)
        peak_r = min(right_verts, key=lambda p: p.y)

    print(f"  📍 Peak sein gauche: ({peak_l.x:.4f}, {peak_l.y:.4f}, {peak_l.z:.4f})")
    print(f"  📍 Peak sein droit:  ({peak_r.x:.4f}, {peak_r.y:.4f}, {peak_r.z:.4f})")

    return peak_l, peak_r, spine2_name, s2_mid_y

def add_breast_bones_at_peaks(arm_obj, peak_l, peak_r, parent_name, s2_mid_y):
    arm_inv = arm_obj.matrix_world.inverted()
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_obj.data.edit_bones

    parent_bone = eb.get(parent_name)
    base_l_w = Vector((peak_l.x * 0.70, s2_mid_y - 0.02, peak_l.z))
    base_r_w = Vector((peak_r.x * 0.70, s2_mid_y - 0.02, peak_r.z))
    tip_l_w = Vector((peak_l.x, peak_l.y, peak_l.z))
    tip_r_w = Vector((peak_r.x, peak_r.y, peak_r.z))

    base_l = arm_inv @ base_l_w
    base_r = arm_inv @ base_r_w
    tip_l = arm_inv @ tip_l_w
    tip_r = arm_inv @ tip_r_w
    tip_l_end = arm_inv @ (tip_l_w + Vector((0.0, -0.035, 0.0)))
    tip_r_end = arm_inv @ (tip_r_w + Vector((0.0, -0.035, 0.0)))

    bl = eb.new('breast_left')
    bl.head = base_l
    bl.tail = tip_l
    bl.parent = parent_bone
    bl.use_deform = True

    ble = eb.new('breast_left_end')
    ble.head = tip_l
    ble.tail = tip_l_end
    ble.parent = bl
    ble.use_deform = False

    br = eb.new('breast_right')
    br.head = base_r
    br.tail = tip_r
    br.parent = parent_bone
    br.use_deform = True

    bre = eb.new('breast_right_end')
    bre.head = tip_r
    bre.tail = tip_r_end
    bre.parent = br
    bre.use_deform = False

    bpy.ops.object.mode_set(mode='OBJECT')
    print("  ✅ 4 bones créés (breast_left/right + tips)")

def apply_volumetric_skinning(meshes, peak_l, peak_r, spine2_name):
    Rx = 0.085
    Ry = 0.110
    Rz = 0.095
    max_transfer_ratio = 0.65

    spine_names = ['mixamorig:Spine', 'mixamorig:Spine1', spine2_name, 'mixamorig:Spine3']
    total_verts_l = 0
    total_verts_r = 0

    for m in meshes:
        vg_bl = m.vertex_groups.get('breast_left') or m.vertex_groups.new(name='breast_left')
        vg_br = m.vertex_groups.get('breast_right') or m.vertex_groups.new(name='breast_right')

        spine_vgs = [m.vertex_groups.get(n) for n in spine_names]
        spine_vgs = [g for g in spine_vgs if g is not None]
        if not spine_vgs:
            continue

        assigned_l = []
        assigned_r = []
        mat = m.matrix_world

        for v in m.data.vertices:
            wco = mat @ v.co
            vg_weights = {vg.index: 0.0 for vg in spine_vgs}
            for g in v.groups:
                if g.group in vg_weights:
                    vg_weights[g.group] = g.weight

            total_spine_w = sum(vg_weights.values())
            if total_spine_w < 0.04:
                continue

            dx_l = (wco.x - peak_l.x) / Rx
            dy_l = (wco.y - peak_l.y) / Ry
            dz_l = (wco.z - peak_l.z) / Rz
            d_l = (dx_l*dx_l + dy_l*dy_l + dz_l*dz_l) ** 0.5

            dx_r = (wco.x - peak_r.x) / Rx
            dy_r = (wco.y - peak_r.y) / Ry
            dz_r = (wco.z - peak_r.z) / Rz
            d_r = (dx_r*dx_r + dy_r*dy_r + dz_r*dz_r) ** 0.5

            if d_l < 1.0 and wco.x >= -0.005:
                falloff = ((1.0 - d_l * d_l) ** 2)
                transfer = falloff * max_transfer_ratio * total_spine_w
                if transfer > 0.01:
                    assigned_l.append((v.index, transfer, vg_weights, total_spine_w))

            elif d_r < 1.0 and wco.x <= 0.005:
                falloff = ((1.0 - d_r * d_r) ** 2)
                transfer = falloff * max_transfer_ratio * total_spine_w
                if transfer > 0.01:
                    assigned_r.append((v.index, transfer, vg_weights, total_spine_w))

        for vi, trans, vg_w, tot in assigned_l:
            vg_bl.add([vi], trans, 'ADD')
            for vg_idx, w in vg_w.items():
                if w > 0.001:
                    new_w = w - trans * (w / tot)
                    m.vertex_groups[vg_idx].add([vi], new_w, 'REPLACE')

        for vi, trans, vg_w, tot in assigned_r:
            vg_br.add([vi], trans, 'ADD')
            for vg_idx, w in vg_w.items():
                if w > 0.001:
                    new_w = w - trans * (w / tot)
                    m.vertex_groups[vg_idx].add([vi], new_w, 'REPLACE')

        if assigned_l or assigned_r:
            print(f"  ✨ {m.name}: {len(assigned_l)} verts → breast_left, {len(assigned_r)} verts → breast_right")
            total_verts_l += len(assigned_l)
            total_verts_r += len(assigned_r)

    print(f"  Total vertices riggués: L={total_verts_l}, R={total_verts_r}")

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
    print(f"Rendered preview: {out_png}")

def process_character(char_id, input_path, texture_dirs, target_height_cm=None):
    print(f"\n{'='*60}")
    print(f"🚀 Traitement de {char_id} ({input_path})")
    print(f"{'='*60}")
    
    out_dir = f"public/characters/{char_id}"
    out_glb = f"{out_dir}/{char_id}.glb"
    out_blend = f"{out_dir}/{char_id}_rigged.blend"
    out_png = f"{out_dir}/{char_id}_3d_preview.png"
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    if input_path.endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=input_path)
    elif input_path.endswith('.blend'):
        bpy.ops.wm.open_mainfile(filepath=input_path)
    elif input_path.endswith('.glb') or input_path.endswith('.gltf'):
        bpy.ops.import_scene.gltf(filepath=input_path)
    else:
        raise ValueError(f"Format non supporté: {input_path}")

    # Relink textures
    relink_textures(texture_dirs)

    armatures = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if not armatures:
        raise RuntimeError("Aucune armature trouvée !")

    arm = armatures[0]
    
    # 1. Normaliser l'armature et les vertex groups vers Mixamo
    normalize_rig(arm, meshes)

    # 2. Supprimer les anciens éléments mammaires
    remove_existing_breast_elements(arm, meshes)

    # 3. Détecter les sommets de poitrine spécifiquement selon l'anatomie
    peak_l, peak_r, spine2_name, s2_mid_y = detect_breast_peaks(arm, meshes)

    # 4. Créer les bones anatomiques
    add_breast_bones_at_peaks(arm, peak_l, peak_r, spine2_name, s2_mid_y)

    # 5. Skinning volumétrique de la poitrine
    apply_volumetric_skinning(meshes, peak_l, peak_r, spine2_name)

    # 6. Échelle et grounding (uniquement sur les objets racines sans parent)
    bbox_corners = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box] if meshes else []
    min_z = min(v.z for v in bbox_corners) if bbox_corners else 0
    max_z = max(v.z for v in bbox_corners) if bbox_corners else 0
    cur_h_cm = (max_z - min_z) * 100.0

    if target_height_cm and abs(cur_h_cm - target_height_cm) > 1.0:
        scale_factor = target_height_cm / cur_h_cm
        for o in bpy.data.objects:
            if o.parent is None:
                o.scale *= scale_factor
        bbox_corners = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box]
        min_z = min(v.z for v in bbox_corners)
        max_z = max(v.z for v in bbox_corners)
        cur_h_cm = (max_z - min_z) * 100.0

    if abs(min_z) > 0.001:
        for o in bpy.data.objects:
            if o.parent is None:
                o.location.z -= min_z

    print(f"Hauteur finale: {cur_h_cm:.1f} cm")

    # 7. Effacer les animations parasites du rest pose
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    # 8. Sauvegarde .blend et export GLB
    bpy.ops.wm.save_as_mainfile(filepath=out_blend, compress=True)
    print(f"  💾 Blend: {out_blend}")

    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False
    )
    print(f"  📦 GLB: {out_glb}")

    # 9. Rendu Preview PNG
    render_preview(out_glb, out_png)
    return round(cur_h_cm, 1)

if __name__ == '__main__':
    h1 = process_character(
        char_id='lady_deadpool',
        input_path='sources_backup/temp_extract/lady_deadpool/source/LADY DEADPOOL BY Oscar Creativo.fbx',
        texture_dirs=['sources_backup/temp_extract/lady_deadpool/textures', 'sources_backup/temp_extract/lady_deadpool/source'],
        target_height_cm=176.0
    )
    h2 = process_character(
        char_id='ivy',
        input_path='sources_backup/temp_extract/ivy/model/Ivy.fbx',
        texture_dirs=['sources_backup/temp_extract/ivy/textures', 'sources_backup/temp_extract/ivy/model/textures'],
        target_height_cm=173.0
    )
    print(f"\n🎉 Terminé ! Heights: lady_deadpool={h1}cm, ivy={h2}cm")
