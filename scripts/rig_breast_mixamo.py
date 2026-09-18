#!/usr/bin/env python3
"""
rig_breast_mixamo.py
====================
Ajoute des bones de poitrine (breast_left / breast_right + ends) à un GLB
Mixamo standard, puis redistribue les poids de vertex pour que la physique
de buste R3F fonctionne.

Usage :
    blender --background --python scripts/rig_breast_mixamo.py -- \
        public/characters/zoe/zoe.glb \
        public/characters/zoe/zoe.glb

Arguments positionnels (après `--`) :
    1. INPUT_GLB   chemin d'entrée
    2. OUTPUT_GLB  chemin de sortie (peut être identique → overwrite)

Hypothèses :
    - Rig Mixamo : spine parent = "mixamorig:Spine2"
    - Mesh(es) ont un vertex group "mixamorig:Spine2" pour la zone thorax
    - Blender 3.6+ ou 4.x requis (bpy)
"""

import sys
import os
import math
import bpy
import bmesh
from mathutils import Vector, Matrix

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_args():
    """Récupère les arguments après '--'."""
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


def find_armature():
    for obj in bpy.data.objects:
        if obj.type == 'ARMATURE':
            return obj
    return None


def find_meshes(arm):
    """Retourne tous les objets Mesh qui utilisent cet armature."""
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

def compute_breast_positions(arm_obj, spine2_name='mixamorig:Spine2'):
    """
    Calcule les positions world-space pour les bases et tips des breast bones
    en se basant sur la pose rest du bone Spine2 et de ses enfants immédiats
    (Neck / Spine3 si présent).
    
    Returns: (base_l, tip_l, base_r, tip_r) en coordonnées locales de l'armature.
    """
    arm = arm_obj.data
    # On travaille en edit mode pour lire head/tail
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones

    spine2 = eb.get(spine2_name)
    if spine2 is None:
        # Essai sans préfixe
        for b in eb:
            if 'Spine2' in b.name or 'spine2' in b.name.lower():
                spine2 = b
                break
    if spine2 is None:
        bpy.ops.object.mode_set(mode='OBJECT')
        raise RuntimeError(f"Bone '{spine2_name}' introuvable dans l'armature.")

    # Centre du thorax = interpolation entre head et tail de Spine2
    # Les bones Mixamo mesurent environ 8-12 cm (0.08-0.12 en units m → *100 = cm)
    spine2_head = Vector(spine2.head)   # local armature
    spine2_tail = Vector(spine2.tail)
    chest_center = spine2_head.lerp(spine2_tail, 0.5)

    # Direction "avant" (Z négatif pour Blender convention, +Z en Three.js)
    # L'armature Mixamo est en T-pose, X=left, Y=up, Z=forward
    bone_len = (spine2_tail - spine2_head).length
    # Espacement latéral ≈ 10% de la hauteur du personnage
    # On estime ~5cm de chaque côté du centre
    lateral_offset = bone_len * 0.9   # ~5-8 cm selon la taille du bone
    forward_offset  = bone_len * 0.7   # projection vers l'avant
    vertical_offset = bone_len * 0.0   # au même niveau que le centre
    tip_forward     = bone_len * 0.8   # longueur du bone jusqu'au tip

    # Gauche = +X local (convention Blender/Mixamo), Droite = -X
    base_l = chest_center + Vector(( lateral_offset, vertical_offset, forward_offset))
    tip_l  = base_l        + Vector(( 0,             bone_len * 0.5,  tip_forward))

    base_r = chest_center + Vector((-lateral_offset, vertical_offset, forward_offset))
    tip_r  = base_r        + Vector(( 0,             bone_len * 0.5,  tip_forward))

    bpy.ops.object.mode_set(mode='OBJECT')
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
        if parent:
            b.parent = parent
        return b

    bl  = make_bone('breast_left',      base_l, tip_l,  parent_bone)
    ble = make_bone('breast_left_end',  tip_l,
                    tip_l + (tip_l - base_l).normalized() * (tip_l - base_l).length * 0.3,
                    bl)
    br  = make_bone('breast_right',     base_r, tip_r,  parent_bone)
    bre = make_bone('breast_right_end', tip_r,
                    tip_r + (tip_r - base_r).normalized() * (tip_r - base_r).length * 0.3,
                    br)

    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"✅ Bones ajoutés : breast_left, breast_left_end, breast_right, breast_right_end")
    print(f"   Parent : {parent_name}")
    print(f"   base_l={base_l}, tip_l={tip_l}")
    print(f"   base_r={base_r}, tip_r={tip_r}")


# ---------------------------------------------------------------------------
# Redistribution des poids de vertex
# ---------------------------------------------------------------------------

def redistribute_breast_weights(meshes, spine2_name='mixamorig:Spine2'):
    """
    Pour chaque mesh, prend les vertices qui ont un poids sur Spine2 et les
    partage proportionnellement entre Spine2 et les deux breast bones selon
    la position X du vertex (gauche/droite) et sa position Z (avant = plus fort).
    
    Stratégie :
      - Sélectionne les vertices avec poids Spine2 > 0.1
      - Calcule le centroid de ces vertices pour connaître le centre thorax
      - Attribue aux breast bones une fraction basée sur la distance au centre
        et la composante forward (Z)
    """
    for mesh_obj in meshes:
        mesh = mesh_obj.data
        
        # Assure que les vertex groups existent
        vg_spine2 = mesh_obj.vertex_groups.get(spine2_name)
        if vg_spine2 is None:
            print(f"  ⚠ {mesh_obj.name}: pas de vertex group '{spine2_name}', skip")
            continue

        # Crée les VG si absents
        vg_bl = mesh_obj.vertex_groups.get('breast_left')  or mesh_obj.vertex_groups.new(name='breast_left')
        vg_br = mesh_obj.vertex_groups.get('breast_right') or mesh_obj.vertex_groups.new(name='breast_right')

        # Collecte les vertices du thorax (poids Spine2 > 0.05)
        thorax_verts = []
        for v in mesh.vertices:
            for g in v.groups:
                if g.group == vg_spine2.index and g.weight > 0.05:
                    thorax_verts.append((v.index, v.co.copy(), g.weight))
                    break

        if not thorax_verts:
            print(f"  ⚠ {mesh_obj.name}: aucun vertex Spine2 trouvé")
            continue

        # Calcul du centroid
        centroid = Vector()
        for _, co, _ in thorax_verts:
            centroid += co
        centroid /= len(thorax_verts)

        # Calcul des extremes pour normalisation
        xs = [co.x for _, co, _ in thorax_verts]
        zs = [co.z for _, co, _ in thorax_verts]
        x_range = max(xs) - min(xs) if max(xs) != min(xs) else 1.0
        z_max   = max(zs)
        z_min   = centroid.z  # on prend le centroid comme baseline Z

        assigned_l = []
        assigned_r = []

        for vi, co, spine_w in thorax_verts:
            # Position X normalisée : +1 = gauche, -1 = droite
            x_norm = (co.x - centroid.x) / (x_range / 2.0)
            # Position Z normalisée : 0 = dos, 1 = avant
            z_norm = max(0.0, (co.z - z_min) / max(0.001, z_max - z_min))

            # Poids brut avant répartition : plus fort si latéral ET vers l'avant
            lateral_factor = abs(x_norm)      # 0=centre, 1=extrême
            breast_raw = lateral_factor ** 0.7 * (0.4 + 0.6 * z_norm)

            # Clamp: on ne prend max 65% du poids Spine2 pour les boobs
            breast_weight = min(spine_w * 0.65, breast_raw * spine_w)
            remaining_spine = spine_w - breast_weight

            if breast_weight < 0.01:
                continue

            # Répartition gauche/droite selon le signe de X
            if x_norm >= 0:
                # Vertex côté gauche → breast_left
                fraction_l = min(1.0, x_norm ** 0.5)
                fraction_r = 1.0 - fraction_l
            else:
                fraction_r = min(1.0, (-x_norm) ** 0.5)
                fraction_l = 1.0 - fraction_r

            w_l = breast_weight * fraction_l
            w_r = breast_weight * fraction_r

            if w_l > 0.005:
                assigned_l.append((vi, w_l))
            if w_r > 0.005:
                assigned_r.append((vi, w_r))

            # Réduit le poids Spine2 d'autant
            vg_spine2.add([vi], remaining_spine, 'REPLACE')

        # Applique les poids breast
        for vi, w in assigned_l:
            vg_bl.add([vi], w, 'ADD')
        for vi, w in assigned_r:
            vg_br.add([vi], w, 'ADD')

        print(f"  ✅ {mesh_obj.name}: {len(assigned_l)} verts → breast_left, {len(assigned_r)} verts → breast_right")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    input_path, output_path = get_args()

    # Chemins absolus (relatifs au CWD qui est la racine du projet)
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

    # Vérifie que les breast bones n'existent pas déjà
    existing = [b.name for b in arm.data.bones if 'breast' in b.name.lower()]
    if existing:
        print(f"ℹ Bones breast déjà présents : {existing} — skip ajout bones, redo poids seulement")
        meshes = find_meshes(arm)
        redistribute_breast_weights(meshes)
    else:
        # Calcule positions anatomiques
        base_l, tip_l, base_r, tip_r, parent_name = compute_breast_positions(arm)

        # Ajoute les bones
        add_breast_bones(arm, base_l, tip_l, base_r, tip_r, parent_name)

        # Redistribue les poids
        meshes = find_meshes(arm)
        redistribute_breast_weights(meshes)

    # Export
    os.makedirs(os.path.dirname(output_abs), exist_ok=True)
    export_glb(output_abs)
    print(f"\n✅ Export GLB → {output_abs}")


if __name__ == "__main__":
    main()
