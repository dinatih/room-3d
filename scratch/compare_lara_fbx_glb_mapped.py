import bpy
import os

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_path = "/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/source/C1S1UIP9N1UQPLO2U787FMDUD_FBX (1)/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
glb_path = "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"

# Import FBX
bpy.ops.import_scene.fbx(filepath=fbx_path)
fbx_armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE':
        fbx_armature = obj
        break
fbx_armature.name = "FBX_Lara"

# Import GLB
bpy.ops.import_scene.gltf(filepath=glb_path)
glb_armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE' and obj.name != "FBX_Lara":
        glb_armature = obj
        break

# Go to EDIT mode to inspect bone details
bpy.context.view_layer.objects.active = fbx_armature
bpy.ops.object.mode_set(mode='EDIT')
fbx_ebones = {b.name: (b.head.copy(), b.tail.copy(), b.length, b.roll) for b in fbx_armature.data.edit_bones}
bpy.ops.object.mode_set(mode='OBJECT')

bpy.context.view_layer.objects.active = glb_armature
bpy.ops.object.mode_set(mode='EDIT')
glb_ebones = {b.name: (b.head.copy(), b.tail.copy(), b.length, b.roll) for b in glb_armature.data.edit_bones}
bpy.ops.object.mode_set(mode='OBJECT')

print("\n--- DETAIL COMPARISON LARA: FBX (Mapped Name) vs GLB ---")
key_bones = [
    ("root hips", "mixamorig_root_hips"),
    ("spine lower", "mixamorig_spine_lower"),
    ("arm left shoulder 2", "mixamorig_arm_left_shoulder_2"),
    ("leg left thigh", "mixamorig_leg_left_thigh")
]

for fbx_name, glb_name in key_bones:
    fb = fbx_ebones.get(fbx_name)
    gb = glb_ebones.get(glb_name)
    if fb and gb:
        fh, ft, fl, fr = fb
        gh, gt, gl, gr = gb
        print(f"\nFBX Bone: '{fbx_name}' | GLB Bone: '{glb_name}'")
        print(f"  FBX Head: [{fh.x:.4f}, {fh.y:.4f}, {fh.z:.4f}] | Length: {fl:.4f} | Roll: {fr:.4f} rad ({fr*180/3.14159:.1f}°)")
        print(f"  GLB Head: [{gh.x:.4f}, {gh.y:.4f}, {gh.z:.4f}] | Length: {gl:.4f} | Roll: {gr:.4f} rad ({gr*180/3.14159:.1f}°)")
