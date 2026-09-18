#!/usr/bin/env python3
"""
rig_breast_mixamo.py  (v2 — axes corrigés)
===========================================
Ajoute des bones de poitrine (breast_left / breast_right + ends) à un GLB
Mixamo standard, puis redistribue les poids de vertex pour que la physique
de buste R3F fonctionne.

Coordonnées Blender après import GLB GLTF2 :
    X = gauche (+) / droite (-)      ← identique GLB
    Y = AVANT du personnage (+Y)     ← GLB's -Z converti
    Z = HAUT (+Z)                    ← GLB's +Y converti

Les breast bones doivent donc être en +Y (avant), ±X (côtés), Z = hauteur Spine2.

Usage :
    blender --background --python scripts/rig_breast_mixamo.py -- \\
        public/characters/zoe/zoe.glb \\
        public/characters/zoe/zoe.glb
"""

import sys
import os
import bpy
from mathutils import Vector

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
    """Sauvegarde la scène Blender courante en .blend (fichier source inspectable)."""
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


# ---------------------------------------------------------------------------
# Calcul de position anatomique des bones
# ---------------------------------------------------------------------------

def compute_breast_positions(arm_obj, meshes, spine2_name='mixamorig:Spine2'):
    """
    Positionne les breast bones EN UTILISANT LA GÉOMÉTRIE RÉELLE DU MESH.

    Axe Blender après import GLB (Mixamo face +Z en Three.js) :
        X = gauche (+X) / droite (-X)
        Y = dos (>0) / avant (<0)   → "avant" = Y négatif
        Z = haut

    Algorithme "breast peak" :
      1. Collecte les vertices Spine2 sur le côté AVANT (Y < s2_mid_y)
         dans la MOITIÉ BASSE de Spine2 (là où est la poitrine)
      2. Pour chaque côté (L/R), trouve le cluster de vertices les
         plus en avant (min Y = protrusion maximale = peak du sein)
      3. Base du bone : entre la colonne et le peak (point pivot)
      4. Tip du bone  : au peak + petit offset supplémentaire
    """
    arm = arm_obj.data
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones

    spine2 = eb.get(spine2_name)
    if spine2 is None:
        for b in eb:
            if 'Spine2' in b.name or 'spine2' in b.name.lower():
                spine2 = b; break
    if spine2 is None:
        bpy.ops.object.mode_set(mode='OBJECT')
        raise RuntimeError(f"Bone '{spine2_name}' introuvable dans l'armature.")

    s2_head  = Vector(spine2.head)
    s2_tail  = Vector(spine2.tail)
    s2_mid_y = (s2_head.y + s2_tail.y) / 2.0
    bone_len = (s2_tail - s2_head).length

    # Point d'attache sur la colonne (là où le bone va pivoter)
    # Légèrement en avant de Spine2 (côté chest)
    spine_attach_z = s2_head.z + (s2_tail.z - s2_head.z) * 0.35

    bpy.ops.object.mode_set(mode='OBJECT')

    # --- Zone de recherche ---
    # Z : de juste en dessous de Spine2 jusqu'à 65% de sa hauteur
    # (la poitrine est dans le TIERS INFÉRIEUR de Spine2, pas en haut)
    z_min = s2_head.z - 0.05
    z_max = s2_head.z + (s2_tail.z - s2_head.z) * 0.70

    # Y : côté avant = Y < s2_mid_y (tout ce qui est devant le dos)
    y_front_max = s2_mid_y + 0.01

    print(f"  Search Z=[{z_min:.3f}, {z_max:.3f}] (Spine2: {s2_head.z:.3f}-{s2_tail.z:.3f})")
    print(f"  Search Y < {y_front_max:.4f}  (s2_mid_y={s2_mid_y:.4f})")

    # --- Collecte des vertices de poitrine ---
    left_pts  = []  # X ≥ 0
    right_pts = []  # X < 0

    for mesh_obj in meshes:
        mesh = mesh_obj.data
        vg = mesh_obj.vertex_groups.get(spine2_name)
        if vg is None:
            continue
        mat = mesh_obj.matrix_world
        for v in mesh.vertices:
            wco = mat @ v.co
            if not (z_min <= wco.z <= z_max):
                continue
            if wco.y >= y_front_max:
                continue
            sw = 0.0
            for g in v.groups:
                if g.group == vg.index:
                    sw = g.weight; break
            if sw < 0.03:   # seuil bas pour capturer même les weights légers
                continue
            pt = Vector((wco.x, wco.y, wco.z))
            if wco.x >= 0:
                left_pts.append(pt)
            else:
                right_pts.append(pt)

    print(f"  Front-lower thorax verts: L={len(left_pts)}, R={len(right_pts)}")

    def find_breast_peak(pts, bone_len, side_sign):
        """
        Trouve le 'peak' de poitrine = cluster de vertices les plus en avant (min Y).
        Retourne (base, tip) en coordonnées Blender.
        """
        if len(pts) < 5:
            return None, None

        # Tri par Y croissant (le plus négatif = le plus en avant)
        sorted_pts = sorted(pts, key=lambda p: p.y)

        # Cluster = les N% de verts les plus en avant
        n_peak = max(5, len(sorted_pts) // 6)  # top ~17% le plus en avant
        peak_cluster = sorted_pts[:n_peak]

        # Centroïde du cluster = position du sein
        n = len(peak_cluster)
        breast_pos = Vector((
            sum(p.x for p in peak_cluster) / n,
            sum(p.y for p in peak_cluster) / n,
            sum(p.z for p in peak_cluster) / n,
        ))

        # TIP = au niveau du cluster, légèrement encore plus en avant
        tip = Vector((
            breast_pos.x + side_sign * bone_len * 0.04,
            breast_pos.y - bone_len * 0.20,   # un peu plus en avant (-Y)
            breast_pos.z,
        ))

        # BASE = entre la colonne (Y proche de 0) et le breast peak (50/50)
        # Le bone pivote à la base → on le met au 1/3 entre colonne et sein
        base = Vector((
            breast_pos.x * 0.5,               # rapproché du centre (colonne)
            breast_pos.y * 0.30 + s2_mid_y * 0.70,  # surtout côté colonne
            spine_attach_z,                    # hauteur du point d'attache
        ))

        return base, tip

    if len(left_pts) >= 5 and len(right_pts) >= 5:
        base_l, tip_l = find_breast_peak(left_pts,  bone_len, +1)
        base_r, tip_r = find_breast_peak(right_pts, bone_len, -1)

        if base_l and base_r:
            method = "peak-cluster"
        else:
            method = "fallback"
    else:
        base_l = base_r = tip_l = tip_r = None
        method = "fallback"

    if method == "fallback":
        print("  ⚠ Pas assez de verts, fallback formule.")
        chest_center = s2_head.lerp(s2_tail, 0.35)
        lateral = bone_len * 0.60
        forward = bone_len * 0.90
        base_l = chest_center + Vector(( lateral, -forward * 0.3, 0))
        base_r = chest_center + Vector((-lateral, -forward * 0.3, 0))
        tip_l  = base_l + Vector(( bone_len*0.10, -forward, 0))
        tip_r  = base_r + Vector((-bone_len*0.10, -forward, 0))

    print(f"  [{method}] breast_left  base={base_l}, tip={tip_l}")
    print(f"  [{method}] breast_right base={base_r}, tip={tip_r}")

    return base_l, tip_l, base_r, tip_r, spine2_name



# ---------------------------------------------------------------------------
# Ajout des bones
# ---------------------------------------------------------------------------


def add_breast_bones(arm_obj, base_l, tip_l, base_r, tip_r, parent_name):
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_obj.data.edit_bones

    parent_bone = eb.get(parent_name)

    def make_bone(name, head, tail, parent):
        b = eb.new(name)
        b.head = head
        b.tail = tail
        b.use_connect = False
        b.use_deform = True
        if parent:
            b.parent = parent
        return b

    # breast_left
    dir_l = (tip_l - base_l).normalized()
    end_l = tip_l + dir_l * (tip_l - base_l).length * 0.25

    bl  = make_bone('breast_left',     base_l, tip_l,  parent_bone)
    ble = make_bone('breast_left_end', tip_l,  end_l,  bl)

    # breast_right
    dir_r = (tip_r - base_r).normalized()
    end_r = tip_r + dir_r * (tip_r - base_r).length * 0.25

    br  = make_bone('breast_right',     base_r, tip_r,  parent_bone)
    bre = make_bone('breast_right_end', tip_r,  end_r,  br)

    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"✅ 4 bones breast ajoutés, parented to '{parent_name}'")


# ---------------------------------------------------------------------------
# Redistribution des poids de vertex — VERSION CORRIGÉE
# ---------------------------------------------------------------------------

def redistribute_breast_weights(meshes, arm_obj, spine2_name='mixamorig:Spine2'):
    """
    Prend les vertices qui ont un poids Spine2 > seuil ET qui sont dans la
    zone thoracique AVANT du corps (Y > 0 en Blender = devant) et Z entre
    [z_min, z_max] calibré sur Spine2.

    Redistribue une fraction de leur poids Spine2 vers breast_left / breast_right
    selon leur position X (côté gauche/droite).

    Jennifer avait des faux positifs (visage, cheveux) → filtre Z + Y strict.
    """
    # Récupère les limites Z de Spine2 pour définir la zone thorax
    arm = arm_obj.data
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    spine2 = eb.get(spine2_name)
    if spine2:
        z_spine2_head = spine2.head.z
        z_spine2_tail = spine2.tail.z
        spine2_mid_y  = (spine2.head.y + spine2.tail.y) / 2.0
    else:
        z_spine2_head = 1.1
        z_spine2_tail = 1.6
        spine2_mid_y  = 0.0
    bpy.ops.object.mode_set(mode='OBJECT')

    # Zone thorax : entre head et tail de Spine2
    # Marge Z : -0.01 en bas, +0.02 en haut (pas trop large pour éviter le visage)
    z_min = z_spine2_head - 0.01
    z_max = z_spine2_tail + 0.02

    # Seuil Y : le "devant" du perso est à -Y en Blender (perso face +Z en Three.js)
    # On garde les verts avec Y < spine2_mid_y (= verts à l'avant du corps)
    y_front_threshold = spine2_mid_y + 0.005  # légèrement du côté avant

    print(f"  Zone thorax Z=[{z_min:.3f}, {z_max:.3f}], Y < {y_front_threshold:.3f}")

    for mesh_obj in meshes:
        mesh = mesh_obj.data

        vg_spine2 = mesh_obj.vertex_groups.get(spine2_name)
        if vg_spine2 is None:
            print(f"  ⚠ {mesh_obj.name}: pas de VG '{spine2_name}', skip")
            continue

        # Crée les vertex groups breast si absents
        vg_bl = mesh_obj.vertex_groups.get('breast_left')  or mesh_obj.vertex_groups.new(name='breast_left')
        vg_br = mesh_obj.vertex_groups.get('breast_right') or mesh_obj.vertex_groups.new(name='breast_right')

        # Collecte les vertices avec poids Spine2 ET dans la zone thorax avant
        thorax_verts = []
        for v in mesh.vertices:
            co = v.co  # coord locale mesh
            # Filtre spatial strict
            if co.z < z_min or co.z > z_max:
                continue
            if co.y >= y_front_threshold:   # doit être devant (-Y en Blender)
                continue
            for g in v.groups:
                if g.group == vg_spine2.index and g.weight > 0.05:
                    thorax_verts.append((v.index, co.copy(), g.weight))
                    break

        if not thorax_verts:
            print(f"  ⚠ {mesh_obj.name}: 0 vertex thorax-avant trouvé (zone Z={z_min:.2f}-{z_max:.2f}, Y>{y_front_threshold:.2f})")
            continue

        # Centroid X pour la séparation gauche/droite
        xs = [co.x for _, co, _ in thorax_verts]
        x_center = sum(xs) / len(xs)
        x_range  = max(xs) - min(xs) if max(xs) != min(xs) else 0.01

        assigned_l = []
        assigned_r = []

        for vi, co, spine_w in thorax_verts:
            # Normalisation X : +1 = extrême gauche, -1 = extrême droite
            x_norm = (co.x - x_center) / (x_range / 2.0)

            # Facteur latéral : plus fort sur les côtés
            lateral_factor = abs(x_norm) ** 0.6

            # Facteur avant : plus fort sur les vertices les plus en avant
            y_vals = [c.y for _, c, _ in thorax_verts]
            y_min_t = min(y_vals)
            y_max_t = max(y_vals)
            y_norm = (co.y - y_min_t) / max(0.001, y_max_t - y_min_t)
            front_factor = 0.3 + 0.7 * y_norm  # plus fort à l'avant

            # Fraction du poids Spine2 à transférer : max 55%
            breast_frac = min(0.55, lateral_factor * front_factor * 0.65)
            breast_weight = spine_w * breast_frac
            remaining_spine = spine_w - breast_weight

            if breast_weight < 0.01:
                continue

            # Répartition gauche/droite
            if x_norm >= 0:
                frac_l = min(1.0, x_norm ** 0.4)
                frac_r = 1.0 - frac_l
            else:
                frac_r = min(1.0, (-x_norm) ** 0.4)
                frac_l = 1.0 - frac_r

            w_l = breast_weight * frac_l
            w_r = breast_weight * frac_r

            if w_l > 0.005:
                assigned_l.append((vi, w_l))
            if w_r > 0.005:
                assigned_r.append((vi, w_r))

            # Réduit le poids Spine2
            vg_spine2.add([vi], remaining_spine, 'REPLACE')

        for vi, w in assigned_l:
            vg_bl.add([vi], w, 'ADD')
        for vi, w in assigned_r:
            vg_br.add([vi], w, 'ADD')

        print(f"  ✅ {mesh_obj.name}: {len(assigned_l)} verts → breast_left, {len(assigned_r)} verts → breast_right")


# ---------------------------------------------------------------------------
# Supprime les bones breast existants (pour reriger proprement)
# ---------------------------------------------------------------------------

def remove_existing_breast_bones(arm_obj):
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_obj.data.edit_bones
    to_remove = [b.name for b in eb if 'breast' in b.name.lower()]
    for name in to_remove:
        if name in eb:
            eb.remove(eb[name])
    bpy.ops.object.mode_set(mode='OBJECT')
    if to_remove:
        print(f"  🗑 Supprimé bones existants : {to_remove}")


def remove_existing_breast_vgroups(meshes):
    """Remet les poids Spine2 à leur valeur d'origine (supprime les VG breast)."""
    for mesh_obj in meshes:
        for vg_name in ['breast_left', 'breast_right']:
            vg = mesh_obj.vertex_groups.get(vg_name)
            if vg:
                mesh_obj.vertex_groups.remove(vg)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    input_path, output_path = get_args()

    cwd = os.getcwd()
    input_abs  = os.path.join(cwd, input_path)  if not os.path.isabs(input_path)  else input_path
    output_abs = os.path.join(cwd, output_path) if not os.path.isabs(output_path) else output_path

    print(f"\n{'='*60}")
    print(f"Input  : {input_abs}")
    print(f"Output : {output_abs}")
    print(f"{'='*60}\n")

    if not os.path.exists(input_abs):
        print(f"❌ Fichier introuvable : {input_abs}")
        sys.exit(1)

    clear_scene()
    import_glb(input_abs)

    arm = find_armature()
    if arm is None:
        print("❌ Aucune armature trouvée dans le GLB.")
        sys.exit(1)
    print(f"✅ Armature : {arm.name} ({len(arm.data.bones)} bones)")

    meshes = find_meshes(arm)

    # Supprime les breast bones/VG existants pour repartir proprement
    remove_existing_breast_bones(arm)
    remove_existing_breast_vgroups(meshes)

    # Calcule les positions anatomiques (géométrie réelle du mesh)
    base_l, tip_l, base_r, tip_r, parent_name = compute_breast_positions(arm, meshes)

    # Ajoute les bones
    add_breast_bones(arm, base_l, tip_l, base_r, tip_r, parent_name)

    # Redistribue les poids (avec filtre spatial strict)
    redistribute_breast_weights(meshes, arm)

    # Sauvegarde le .blend source (pour inspection / debug dans Blender)
    blend_abs = os.path.splitext(output_abs)[0] + "_rigged.blend"
    os.makedirs(os.path.dirname(output_abs), exist_ok=True)
    save_blend(blend_abs)
    print(f"\n✅ Blend source → {blend_abs}")

    # Export GLB final
    export_glb(output_abs)
    print(f"✅ Export GLB   → {output_abs}")


if __name__ == "__main__":
    main()
