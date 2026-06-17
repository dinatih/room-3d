import bpy
import os

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_path = "/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/source/C1S1UIP9N1UQPLO2U787FMDUD_FBX (1)/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
glb_path = "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"

if not os.path.exists(fbx_path):
    print(f"Error: FBX file not found at {fbx_path}")
    exit(1)

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

print(f"\n--- LARA COMPARATIVE ANALYSIS: Source FBX vs Generated GLB ---")
print(f"FBX Armature: {fbx_armature.name} | Bones: {len(fbx_armature.data.bones)} | Scale: {fbx_armature.scale} | Rot: {fbx_armature.rotation_euler}")
print(f"GLB Armature: {glb_armature.name} | Bones: {len(glb_armature.data.bones)} | Scale: {glb_armature.scale} | Rot: {glb_armature.rotation_euler}")

fbx_bones = {b.name: b for b in fbx_armature.data.bones}
glb_bones = {b.name: b for b in glb_armature.data.bones}

# Missing bones comparison
missing_in_fbx = set(glb_bones.keys()) - set(fbx_bones.keys())
missing_in_glb = set(fbx_bones.keys()) - set(glb_bones.keys())

print(f"\nBones in GLB missing in FBX: {sorted(list(missing_in_fbx))}")
print(f"Bones in FBX missing in GLB: {sorted(list(missing_in_glb))}")

# Check EDIT mode data (Head/Tail/Roll)
bpy.context.view_layer.objects.active = fbx_armature
bpy.ops.object.mode_set(mode='EDIT')
fbx_ebones = {b.name: (b.head.copy(), b.tail.copy(), b.length, b.roll) for b in fbx_armature.data.edit_bones}
bpy.ops.object.mode_set(mode='OBJECT')

bpy.context.view_layer.objects.active = glb_armature
bpy.ops.object.mode_set(mode='EDIT')
glb_ebones = {b.name: (b.head.copy(), b.tail.copy(), b.length, b.roll) for b in glb_armature.data.edit_bones}
bpy.ops.object.mode_set(mode='OBJECT')

# Compare a few key bones
key_bones = ["mixamorig_root_hips", "mixamorig_spine_lower", "mixamorig_arm_left_shoulder_2", "mixamorig_leg_left_thigh"]
for name in key_bones:
    fb = fbx_ebones.get(name)
    gb = glb_ebones.get(name)
    if fb and gb:
        fh, ft, fl, fr = fb
        gh, gt, gl, gr = gb
        print(f"\nBone: {name}")
        print(f"  FBX Head: [{fh.x:.4f}, {fh.y:.4f}, {fh.z:.4f}] | Length: {fl:.4f} | Roll: {fr:.4f} rad ({fr*180/3.14159:.1f}°)")
        print(f"  GLB Head: [{gh.x:.4f}, {gh.y:.4f}, {gh.z:.4f}] | Length: {gl:.4f} | Roll: {gr:.4f} rad ({gr*180/3.14159:.1f}°)")

# Check if parent structures differ
for name in sorted(list(glb_ebones.keys())):
    if name not in fbx_ebones:
        continue
    fb_parent = fbx_armature.data.bones.get(name).parent
    gb_parent = glb_armature.data.bones.get(name).parent
    fb_pname = fb_parent.name if fb_parent else "None"
    gb_pname = gb_parent.name if gb_parent else "None"
    if fb_pname != gb_pname:
        print(f"Parent Diff for {name}: FBX = {fb_pname} | GLB = {gb_pname}")
