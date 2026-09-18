import bpy
import os
import math
import mathutils
from mathutils import Vector, Matrix

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

def is_excluded_mesh(mesh_name):
    n = mesh_name.lower()
    keywords = ('hair', 'eyelash', 'eye', 'teeth', 'tongue', 'pants', 'sneaker', 'shoes',
                'helmet', 'glass', 'head', 'hat', 'icosphere')
    return any(kw in n for kw in keywords)

def rig_character_breasts(char_id, input_path, target_glb, target_blend, target_png, params):
    print("\n" + "="*65)
    print(f"🚀 Rigging poitrine de {char_id} ({input_path})")
    print("="*65)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    if input_path.endswith('.blend'):
        bpy.ops.wm.open_mainfile(filepath=input_path)
    elif input_path.endswith('.glb') or input_path.endswith('.gltf'):
        bpy.ops.import_scene.gltf(filepath=input_path)
    elif input_path.endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=input_path)
    else:
        raise ValueError(f"Format inconnu: {input_path}")

    # 1. Nettoyer objets parasites (caméras, lumières, icospheres)
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT') or 'icosphere' in o.name.lower():
            bpy.data.objects.remove(o, do_unlink=True)

    # 2. Supprimer les actions d'animation résiduelles
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']

    # 3. Réinitialiser la pose à l'identité absolue
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

    # 4. Définition des coordonnées anatomiques des os
    tip_l = params['tip_l']
    tip_r = params['tip_r']
    base_l = params['base_l']
    base_r = params['base_r']
    rx = params.get('rx', 0.08)
    ry = params.get('ry', 0.10)
    rz = params.get('rz', 0.08)

    # 5. Création / configuration des os de poitrine dans l'armature
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    # Détacher Hips en racine unique si ce n'est pas déjà le cas
    eb_hips = eb.get('mixamorig:Hips')
    if eb_hips and eb_hips.parent:
        eb_hips.parent = None

    parent_name = params.get('parent_bone', 'mixamorig:Spine2')
    parent_bone = eb.get(parent_name) or eb.get('mixamorig:Spine2') or eb.get('mixamorig:Spine1')
    if not parent_bone:
        raise ValueError("Bone parent (Spine) non trouvé dans l'armature !")

    # Os Gauche
    eb_bl = eb.get('breast_left') or eb.new('breast_left')
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

    # Os Droit
    eb_br = eb.get('breast_right') or eb.new('breast_right')
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

    print(f"  ✅ breast_left configuré sous {parent_bone.name}: base={base_l}, pointe={tip_l}, len={len_l*100:.1f} cm")
    print(f"  ✅ breast_right configuré sous {parent_bone.name}: base={base_r}, pointe={tip_r}, len={len_r*100:.1f} cm")
    bpy.ops.object.mode_set(mode='OBJECT')

    # 6. Pondération volumétrique réaliste (Norme Jennifer 65/35 proportionnelle au torse)
    total_verts_weighted_l = 0
    total_verts_weighted_r = 0

    spine_names = ['mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2', 'mixamorig:Spine3', 'Spine', 'Spine1', 'Spine2', 'Spine3']

    for m in meshes:
        if is_excluded_mesh(m.name):
            # Supprimer tout groupe de buste indésirable
            for vg_name in ('breast_left', 'breast_right', 'breast_left_end', 'breast_right_end'):
                vg = m.vertex_groups.get(vg_name)
                if vg:
                    m.vertex_groups.remove(vg)
            continue

        spine_vgs = [m.vertex_groups.get(sname) for sname in spine_names]
        spine_vgs = [vg for vg in spine_vgs if vg is not None]
        if not spine_vgs:
            continue

        # Créer ou réinitialiser les groupes breast_left et breast_right
        vg_bl = m.vertex_groups.get('breast_left') or m.vertex_groups.new(name='breast_left')
        vg_br = m.vertex_groups.get('breast_right') or m.vertex_groups.new(name='breast_right')

        # Vider les groupes existants pour repartir sur une pondération saine
        for v in m.data.vertices:
            vg_bl.remove([v.index])
            vg_br.remove([v.index])

        # Appliquer la déformation ellipsoïdale progressive depuis les os du torse
        mat = m.matrix_world
        for v in m.data.vertices:
            w_co = mat @ v.co

            # Trouver le poids total actuel sur les os de la colonne
            spine_weights = {}
            total_spine_w = 0.0
            for g in v.groups:
                for svg in spine_vgs:
                    if g.group == svg.index:
                        spine_weights[svg] = g.weight
                        total_spine_w += g.weight

            if total_spine_w < 0.01:
                continue

            # Côté Gauche
            dx_l = (w_co.x - tip_l.x) / rx
            dy_l = (w_co.y - tip_l.y) / ry
            dz_l = (w_co.z - tip_l.z) / rz
            d2_l = dx_l*dx_l + dy_l*dy_l + dz_l*dz_l
            if d2_l < 1.0:
                factor = (1.0 - d2_l) ** 1.5
                target_w = 0.65 * factor
                for svg, sw in spine_weights.items():
                    svg.add([v.index], sw * (1.0 - target_w), 'REPLACE')
                vg_bl.add([v.index], total_spine_w * target_w, 'REPLACE')
                total_verts_weighted_l += 1

            # Côté Droit
            dx_r = (w_co.x - tip_r.x) / rx
            dy_r = (w_co.y - tip_r.y) / ry
            dz_r = (w_co.z - tip_r.z) / rz
            d2_r = dx_r*dx_r + dy_r*dy_r + dz_r*dz_r
            if d2_r < 1.0:
                factor = (1.0 - d2_r) ** 1.5
                target_w = 0.65 * factor
                for svg, sw in spine_weights.items():
                    svg.add([v.index], sw * (1.0 - target_w), 'REPLACE')
                vg_br.add([v.index], total_spine_w * target_w, 'REPLACE')
                total_verts_weighted_r += 1

    print(f"  ✨ Sommets pondérés: Left={total_verts_weighted_l}, Right={total_verts_weighted_r}")

    # 7. Garantie zéro sommet non-pondéré
    fallback_spine = 'mixamorig:Spine2' if 'mixamorig:Spine2' in arm.data.bones else ('mixamorig:Spine1' if 'mixamorig:Spine1' in arm.data.bones else 'mixamorig:Spine')
    total_unweighted_fixed = 0
    for m in meshes:
        for v in m.data.vertices:
            tot_w = sum(g.weight for g in v.groups)
            if tot_w < 0.001:
                vg = m.vertex_groups.get(fallback_spine) or m.vertex_groups.new(name=fallback_spine)
                vg.add([v.index], 1.0, 'REPLACE')
                total_unweighted_fixed += 1

    if total_unweighted_fixed > 0:
        print(f"  🛡️ {total_unweighted_fixed} sommets rattachés à {fallback_spine}")
    else:
        print("  🛡️ 100% des sommets sont parfaitement pondérés !")

    # 8. Unparent meshes pour éliminer neutral_bone à l'export
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

    # 9. Sauvegarde .blend et export GLB
    os.makedirs(os.path.dirname(target_glb), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=target_blend, compress=True)
    bpy.ops.export_scene.gltf(
        filepath=target_glb,
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False
    )
    print(f"  📦 Export GLB terminé: {target_glb}")

    # 10. Rendu preview PNG
    render_preview(target_glb, target_png)
    print(f"🎉 {char_id} breast-rigged avec succès !")

if __name__ == '__main__':
    import sys
    args = sys.argv
    char_to_run = args[args.index('--') + 1] if '--' in args else 'all'

    configs = {
        'megan': {
            'input_path': 'public/characters/megan/megan_rigged.blend',
            'target_glb': 'public/characters/megan/megan.glb',
            'target_blend': 'public/characters/megan/megan_rigged.blend',
            'target_png': 'public/characters/megan/megan_3d_preview.png',
            'params': {
                'tip_l': Vector((0.045, -0.159, 1.015)),
                'tip_r': Vector((-0.045, -0.159, 1.015)),
                'base_l': Vector((0.022, 0.000, 1.015)),
                'base_r': Vector((-0.022, 0.000, 1.015)),
                'parent_bone': 'mixamorig:Spine2',
                'rx': 0.085,
                'ry': 0.110,
                'rz': 0.085,
            }
        },
        'lola': {
            'input_path': 'public/characters/lola/lola.glb',
            'target_glb': 'public/characters/lola/lola.glb',
            'target_blend': 'public/characters/lola/lola_rigged.blend',
            'target_png': 'public/characters/lola/lola_3d_preview.png',
            'params': {
                'tip_l': Vector((0.048, -0.130, 1.355)),
                'tip_r': Vector((-0.048, -0.130, 1.355)),
                'base_l': Vector((0.024, 0.000, 1.355)),
                'base_r': Vector((-0.024, 0.000, 1.355)),
                'parent_bone': 'mixamorig:Spine1',
                'rx': 0.110,
                'ry': 0.120,
                'rz': 0.110,
            }
        },
        'inyeong': {
            'input_path': 'sources_backup/inyeong/inyeong_nitro_tpose.blend',
            'target_glb': 'public/characters/inyeong/nitro_anim_inyeong.glb',
            'target_blend': 'sources_backup/inyeong/inyeong_nitro_tpose.blend',
            'target_png': 'public/characters/inyeong/nitro_anim_inyeong_3d_preview.png',
            'params': {
                'tip_l': Vector((0.048, -0.118, 1.190)),
                'tip_r': Vector((-0.048, -0.118, 1.190)),
                'base_l': Vector((0.024, 0.000, 1.190)),
                'base_r': Vector((-0.024, 0.000, 1.190)),
                'parent_bone': 'mixamorig:Spine2',
                'rx': 0.085,
                'ry': 0.100,
                'rz': 0.085,
            }
        }
    }

    if char_to_run in configs:
        c = configs[char_to_run]
        rig_character_breasts(char_to_run, c['input_path'], c['target_glb'], c['target_blend'], c['target_png'], c['params'])
    elif char_to_run == 'all':
        for cid, c in configs.items():
            rig_character_breasts(cid, c['input_path'], c['target_glb'], c['target_blend'], c['target_png'], c['params'])
