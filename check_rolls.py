import bpy
import math

def print_bone_rolls(filepath, arm_name, bone_names):
    bpy.ops.wm.open_mainfile(filepath=filepath)
    arm_obj = bpy.data.objects.get(arm_name)
    if not arm_obj: return
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    print(f"--- Bone Rolls for {filepath} ---")
    for b in bone_names:
        if b in arm_obj.data.edit_bones:
            eb = arm_obj.data.edit_bones[b]
            print(f"{b}: roll={math.degrees(eb.roll):.2f}")
    bpy.ops.object.mode_set(mode='OBJECT')

print_bone_rolls("sources_backup/lara_croft_metarig_final.blend", "Armature", ['spine', 'upper_arm.L', 'forearm.L', 'thigh.L', 'shin.L'])
print_bone_rolls("sources_backup/xbot_from_mixamo.blend", "Armature", ['mixamorig:Spine', 'mixamorig:LeftArm', 'mixamorig:LeftForeArm', 'mixamorig:LeftUpLeg', 'mixamorig:LeftLeg'])
