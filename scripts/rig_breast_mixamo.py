#!/usr/bin/env python3
"""
rig_breast_mixamo.py (v3 — Volumetric Ellipsoid Skinning)
=========================================================
Ajoute des bones de poitrine (breast_left, breast_right, breast_left_end, breast_right_end)
aux personnages Mixamo et redistribue les vertex weights de manière volumétrique
pour un englobement complet et naturel de la poitrine.

Axes Blender (post import glTF, Three.js Mixamo facing +Z) :
  X = Gauche (+X) / Droite (-X)
  Y = Avant (-Y) / Arrière (+Y)
  Z = Haut (+Z) / Bas (-Z)
"""

import sys
import os
import bpy
from mathutils import Vector


def get_args():
    argv = sys.argv
    if "--" not in argv:
        print("Usage: blender --background --python rig_breast_mixamo.py -- INPUT.glb OUTPUT.glb")
        sys.exit(1)
    rest = argv[argv.index("--") + 1:]
    if len(rest) < 2:
        print("Erreur: Fournir INPUT_GLB et OUTPUT_GLB")
        sys.exit(1)
    return rest[0], rest[1]


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)


def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_animations=True,
        export_skins=True,
        export_morph=True,
        use_selection=False,
    )


def save_blend(path):
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)


def find_armature():
    for obj in bpy.data.objects:
        if obj.type == 'ARMATURE':
            return obj
    return None


def find_meshes(arm):
    meshes = []
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            for mod in obj.modifiers:
                if mod.type == 'ARMATURE' and mod.object == arm:
                    meshes.append(obj)
                    break
    return meshes


def remove_existing_breast_elements(arm_obj, meshes):
    """Nettoie d'éventuels anciens bones ou vertex groups de test."""
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
        for vg_name in ['breast_left', 'breast_left_end', 'breast_right', 'breast_right_end']:
            vg = m.vertex_groups.get(vg_name)
            if vg:
                m.vertex_groups.remove(vg)


def detect_breast_peaks(arm_obj, meshes, spine2_name='mixamorig:Spine2'):
    """
    Localise précisément le sommet (peak) de chaque sein en trouvant
    le vertex le plus en avant (-Y) ayant du poids sur le torse (Spine1/Spine2).
    """
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

    s2_head_z = s2.head_local.z
    s2_mid_y = (s2.head_local.y + s2.tail_local.y) / 2.0

    # Collecte tous les vertices du torse avant
    front_verts = []
    for m in meshes:
        vgs = [m.vertex_groups.get(n) for n in ['mixamorig:Spine', 'mixamorig:Spine1', spine2_name, 'mixamorig:Spine3']]
        vgs = [g for g in vgs if g is not None]
        if not vgs:
            continue
        mat = m.matrix_world
        for v in m.data.vertices:
            w = sum(g.weight for g in v.groups if any(g.group == vg.index for vg in vgs))
            if w > 0.15:
                wco = mat @ v.co
                # Devant la colonne et à hauteur du buste (autour de Spine1-Spine2)
                if wco.y < (s2_mid_y - 0.01) and (s2_head_z - 0.20 <= wco.z <= s2_head_z + 0.25):
                    front_verts.append(wco.copy())

    left_verts = [p for p in front_verts if p.x > 0.015]
    right_verts = [p for p in front_verts if p.x < -0.015]

    if not left_verts or not right_verts:
        print("  ⚠ Détection géométrique insuffisante, fallback coordonnées relatives.")
        peak_l = Vector((0.06, s2_mid_y - 0.12, s2_head_z - 0.03))
        peak_r = Vector((-0.06, s2_mid_y - 0.12, s2_head_z - 0.03))
    else:
        # Le peak est le vertex le plus en avant (valeur Y minimale)
        peak_l = min(left_verts, key=lambda p: p.y)
        peak_r = min(right_verts, key=lambda p: p.y)

    print(f"  📍 Peak sein gauche: ({peak_l.x:.4f}, {peak_l.y:.4f}, {peak_l.z:.4f})")
    print(f"  📍 Peak sein droit:  ({peak_r.x:.4f}, {peak_r.y:.4f}, {peak_r.z:.4f})")

    return peak_l, peak_r, spine2_name, s2_mid_y


def add_breast_bones_at_peaks(arm_obj, peak_l, peak_r, parent_name, s2_mid_y):
    """
    Crée les bones breast_left et breast_right traversant le sein de la base au sommet.
    Base = ancrée dans le thorax derrière le sein.
    Tip  = au sommet du sein (peak).
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_obj.data.edit_bones

    parent_bone = eb.get(parent_name)

    # Base à mi-chemin vers la cage thoracique
    base_l = Vector((peak_l.x * 0.70, s2_mid_y - 0.02, peak_l.z))
    base_r = Vector((peak_r.x * 0.70, s2_mid_y - 0.02, peak_r.z))

    tip_l = Vector((peak_l.x, peak_l.y, peak_l.z))
    tip_r = Vector((peak_r.x, peak_r.y, peak_r.z))

    # Breast Left
    bl = eb.new('breast_left')
    bl.head = base_l
    bl.tail = tip_l
    bl.parent = parent_bone
    bl.use_deform = True

    ble = eb.new('breast_left_end')
    ble.head = tip_l
    ble.tail = tip_l + Vector((0.0, -0.035, 0.0))
    ble.parent = bl
    ble.use_deform = False

    # Breast Right
    br = eb.new('breast_right')
    br.head = base_r
    br.tail = tip_r
    br.parent = parent_bone
    br.use_deform = True

    bre = eb.new('breast_right_end')
    bre.head = tip_r
    bre.tail = tip_r + Vector((0.0, -0.035, 0.0))
    bre.parent = br
    bre.use_deform = False

    bpy.ops.object.mode_set(mode='OBJECT')
    print("  ✅ 4 bones créés (breast_left/right + tips)")


def apply_volumetric_skinning(meshes, peak_l, peak_r, spine2_name):
    """
    Transfère les poids de Spine1/Spine2 vers breast_left / breast_right
    selon un ellipsoïde volumétrique centré sur chaque sein.
    Englobe TOUT le galbe (haut, bas, côtés, centre) de façon progressive.
    """
    Rx = 0.085  # Rayon latéral
    Ry = 0.110  # Rayon profondeur
    Rz = 0.095  # Rayon vertical

    max_transfer_ratio = 0.65  # 65% max au sommet, comme Lara Croft (0.62)

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

            # Poids combiné du torse pour ce vertex
            vg_weights = {vg.index: 0.0 for vg in spine_vgs}
            for g in v.groups:
                if g.group in vg_weights:
                    vg_weights[g.group] = g.weight

            total_spine_w = sum(vg_weights.values())
            if total_spine_w < 0.04:
                continue

            # Distance ellipsoïdale au sein gauche
            dx_l = (wco.x - peak_l.x) / Rx
            dy_l = (wco.y - peak_l.y) / Ry
            dz_l = (wco.z - peak_l.z) / Rz
            d_l = (dx_l*dx_l + dy_l*dy_l + dz_l*dz_l) ** 0.5

            # Distance ellipsoïdale au sein droit
            dx_r = (wco.x - peak_r.x) / Rx
            dy_r = (wco.y - peak_r.y) / Ry
            dz_r = (wco.z - peak_r.z) / Rz
            d_r = (dx_r*dx_r + dy_r*dy_r + dz_r*dz_r) ** 0.5

            # Sein gauche
            if d_l < 1.0 and wco.x >= -0.005:
                falloff = ((1.0 - d_l * d_l) ** 2)
                transfer = falloff * max_transfer_ratio * total_spine_w
                if transfer > 0.01:
                    assigned_l.append((v.index, transfer, vg_weights, total_spine_w))

            # Sein droit
            elif d_r < 1.0 and wco.x <= 0.005:
                falloff = ((1.0 - d_r * d_r) ** 2)
                transfer = falloff * max_transfer_ratio * total_spine_w
                if transfer > 0.01:
                    assigned_r.append((v.index, transfer, vg_weights, total_spine_w))

        # Application des poids et soustraction proportionnelle de Spine
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


def main():
    input_path, output_path = get_args()
    cwd = os.getcwd()
    input_abs = os.path.join(cwd, input_path) if not os.path.isabs(input_path) else input_path
    output_abs = os.path.join(cwd, output_path) if not os.path.isabs(output_path) else output_path

    print(f"\n{'='*60}")
    print(f"Traitement : {input_abs}")
    print(f"{'='*60}")

    clear_scene()
    import_glb(input_abs)

    arm = find_armature()
    if not arm:
        print("❌ Armature introuvable.")
        sys.exit(1)

    meshes = find_meshes(arm)

    # 1. Nettoyage
    remove_existing_breast_elements(arm, meshes)

    # 2. Localisation anatomique exacte des peaks
    peak_l, peak_r, spine2_name, s2_mid_y = detect_breast_peaks(arm, meshes)

    # 3. Création des bones
    add_breast_bones_at_peaks(arm, peak_l, peak_r, spine2_name, s2_mid_y)

    # 4. Skinning volumétrique ellipsoïdal
    apply_volumetric_skinning(meshes, peak_l, peak_r, spine2_name)

    # 5. Sauvegarde .blend + GLB
    blend_abs = os.path.splitext(output_abs)[0] + "_rigged.blend"
    os.makedirs(os.path.dirname(output_abs), exist_ok=True)
    save_blend(blend_abs)
    print(f"  💾 Blend source : {blend_abs}")

    export_glb(output_abs)
    print(f"  📦 Export GLB   : {output_abs}")
    print(f"✅ Terminé avec succès.\n")


if __name__ == '__main__':
    main()
