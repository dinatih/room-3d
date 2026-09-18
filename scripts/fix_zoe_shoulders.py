#!/usr/bin/env python3
"""
fix_zoe_shoulders.py
====================
Corrige la pente des clavicules de Zoe :
Les axes Y et Z avaient été inversés lors de sa conversion initiale,
faisant pointer ses clavicules vers le haut (+10.1° en Z) au lieu d'une
pente anatomique descendante naturelle (-6.1° en Z, -10.1° vers l'avant).
Ce script redresse les clavicules de Zoe à l'identique de Hayley, applique
la pose au mesh et à l'armature, puis régénère le rig de poitrine.
"""

import os
import sys
import math
import bpy
from mathutils import Matrix, Vector


def fix_zoe(glb_path):
    print(f"\n{'='*60}")
    print(f"Redressement des épaules de Zoe : {glb_path}")
    print(f"{'='*60}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb_path)

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    def align_bone_direction(pb_from, pb_to, target_dir):
        bpy.context.view_layer.update()
        v = (pb_to.head - pb_from.head).normalized()
        q = v.rotation_difference(target_dir)
        T = Matrix.Translation(pb_from.head)
        pb_from.matrix = T @ q.to_matrix().to_4x4() @ T.inverted() @ pb_from.matrix
        bpy.context.view_layer.update()

    # Pente anatomique naturelle : -6 deg vers le bas (-Z), 10 deg vers l'avant (-Y)
    angle_down = math.radians(-6)
    angle_fwd = math.radians(10)
    tgt_l_scap = Vector((math.cos(angle_down) * math.cos(angle_fwd), -math.sin(angle_fwd), math.sin(angle_down))).normalized()
    tgt_r_scap = Vector((-math.cos(angle_down) * math.cos(angle_fwd), -math.sin(angle_fwd), math.sin(angle_down))).normalized()

    print(f"  Target LeftShoulder dir:  {tgt_l_scap}")
    print(f"  Target RightShoulder dir: {tgt_r_scap}")

    align_bone_direction(arm.pose.bones['mixamorig:LeftShoulder'], arm.pose.bones['mixamorig:LeftArm'], tgt_l_scap)
    align_bone_direction(arm.pose.bones['mixamorig:RightShoulder'], arm.pose.bones['mixamorig:RightArm'], tgt_r_scap)

    def align_arm_chain(pb_arm, pb_forearm, pb_wrist, pb_mid, target_dir):
        bpy.context.view_layer.update()
        v1 = (pb_forearm.head - pb_arm.head).normalized()
        q1 = v1.rotation_difference(target_dir)
        T1 = Matrix.Translation(pb_arm.head)
        pb_arm.matrix = T1 @ q1.to_matrix().to_4x4() @ T1.inverted() @ pb_arm.matrix
        bpy.context.view_layer.update()

        v2 = (pb_wrist.head - pb_forearm.head).normalized()
        q2 = v2.rotation_difference(target_dir)
        T2 = Matrix.Translation(pb_forearm.head)
        pb_forearm.matrix = T2 @ q2.to_matrix().to_4x4() @ T2.inverted() @ pb_forearm.matrix
        bpy.context.view_layer.update()

        if pb_mid:
            v3 = (pb_mid.head - pb_wrist.head).normalized()
            q3 = v3.rotation_difference(target_dir)
            T3 = Matrix.Translation(pb_wrist.head)
            pb_wrist.matrix = T3 @ q3.to_matrix().to_4x4() @ T3.inverted() @ pb_wrist.matrix
            bpy.context.view_layer.update()

    align_arm_chain(
        arm.pose.bones['mixamorig:LeftArm'],
        arm.pose.bones['mixamorig:LeftForeArm'],
        arm.pose.bones['mixamorig:LeftHand'],
        arm.pose.bones.get('mixamorig:LeftHandMiddle1'),
        Vector((1.0, 0.0, 0.0))
    )
    align_arm_chain(
        arm.pose.bones['mixamorig:RightArm'],
        arm.pose.bones['mixamorig:RightForeArm'],
        arm.pose.bones['mixamorig:RightHand'],
        arm.pose.bones.get('mixamorig:RightHandMiddle1'),
        Vector((-1.0, 0.0, 0.0))
    )

    # Bake la pose dans les coordonnées de sommets des meshes
    print("  Baking T-Pose aux meshes...")
    bpy.ops.object.mode_set(mode='OBJECT')
    for m in meshes:
        if m.data.shape_keys:
            m.shape_key_clear()
        bpy.context.view_layer.objects.active = m
        for mod in list(m.modifiers):
            if mod.type == 'ARMATURE':
                bpy.ops.object.modifier_apply(modifier=mod.name)
                new_mod = m.modifiers.new(name='Armature', type='ARMATURE')
                new_mod.object = arm

    # Applique la pose à l'armature pour en faire la nouvelle rest-pose
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply()

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    if 'mixamorig:LeftShoulder' in eb and 'mixamorig:LeftArm' in eb:
        eb['mixamorig:LeftShoulder'].tail = eb['mixamorig:LeftArm'].head
    if 'mixamorig:RightShoulder' in eb and 'mixamorig:RightArm' in eb:
        eb['mixamorig:RightShoulder'].tail = eb['mixamorig:RightArm'].head
    if 'mixamorig:LeftHand' in eb and 'mixamorig:LeftHandMiddle1' in eb:
        eb['mixamorig:LeftHand'].tail = eb['mixamorig:LeftHandMiddle1'].head
    if 'mixamorig:RightHand' in eb and 'mixamorig:RightHandMiddle1' in eb:
        eb['mixamorig:RightHand'].tail = eb['mixamorig:RightHandMiddle1'].head

    bpy.ops.object.mode_set(mode='OBJECT')

    # Export GLB temporaire redressé
    print(f"  Export GLB redressé vers {glb_path}...")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_rest_position_armature=True
    )
    print("✅ Épaules de Zoe redressées avec succès.")


if __name__ == '__main__':
    path = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'public/characters/zoe/zoe.glb'
    fix_zoe(path)
