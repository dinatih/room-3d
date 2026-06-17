import bpy
import os

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_path = "/home/dinatih/Projects/room-3d/sources_backup/X Bot.fbx"
glb_path = "/home/dinatih/Projects/room-3d/public/media/sandbox/Xbot_official.glb"

# Import FBX
bpy.ops.import_scene.fbx(filepath=fbx_path)
fbx_armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE':
        fbx_armature = obj
        break
fbx_armature.name = "FBX_Armature"

# Import GLB
bpy.ops.import_scene.gltf(filepath=glb_path)
glb_armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE' and obj.name != "FBX_Armature":
        glb_armature = obj
        break

print(f"\n--- COMPARATIVE ANALYSIS: Mixamo FBX vs Three.js GLB ---")
print(f"FBX Armature: {fbx_armature.name} | Scale: {fbx_armature.scale} | Rot: {fbx_armature.rotation_euler}")
print(f"GLB Armature: {glb_armature.name} | Scale: {glb_armature.scale} | Rot: {glb_armature.rotation_euler}")

# Let's inspect bone rolls and coords in EDIT mode
# 1. FBX Armature
bpy.context.view_layer.objects.active = fbx_armature
bpy.ops.object.mode_set(mode='EDIT')
fbx_ebones = {b.name: (b.head.copy(), b.tail.copy(), b.length, b.roll) for b in fbx_armature.data.edit_bones}
bpy.ops.object.mode_set(mode='OBJECT')

# 2. GLB Armature
bpy.context.view_layer.objects.active = glb_armature
bpy.ops.object.mode_set(mode='EDIT')
glb_ebones = {b.name: (b.head.copy(), b.tail.copy(), b.length, b.roll) for b in glb_armature.data.edit_bones}
bpy.ops.object.mode_set(mode='OBJECT')

print(f"\n[Bones Comparison]")
key_bones = ["mixamorig:Hips", "mixamorig:Spine", "mixamorig:LeftArm", "mixamorig:LeftUpLeg", "mixamorig:LeftHand"]
for name in key_bones:
    fb = fbx_ebones.get(name)
    gb = glb_ebones.get(name)
    if fb and gb:
        f_head, f_tail, f_len, f_roll = fb
        g_head, g_tail, g_len, g_roll = gb
        print(f"\nBone: {name}")
        print(f"  FBX Head: [{f_head.x:.4f}, {f_head.y:.4f}, {f_head.z:.4f}] | Length: {f_len:.4f} | Roll: {f_roll:.4f} rad ({f_roll*180/3.14159:.1f}°)")
        print(f"  GLB Head: [{g_head.x:.4f}, {g_head.y:.4f}, {g_head.z:.4f}] | Length: {g_len:.4f} | Roll: {g_roll:.4f} rad ({g_roll*180/3.14159:.1f}°)")

# Let's also check parent-child differences
for name in sorted(list(glb_ebones.keys())):
    if name not in fbx_ebones:
        continue
    # Get parent in FBX
    fb_parent = fbx_armature.data.bones.get(name).parent
    gb_parent = glb_armature.data.bones.get(name).parent
    fb_parent_name = fb_parent.name if fb_parent else "None"
    gb_parent_name = gb_parent.name if gb_parent else "None"
    if fb_parent_name != gb_parent_name:
        print(f"Hierarchy diff for {name}: Parent FBX = {fb_parent_name} | Parent GLB = {gb_parent_name}")
