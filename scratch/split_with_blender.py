import bpy
import os

media_dir = "public/media/sandbox"

# ──────────────────────────────────────────────────────────────────────────
# 1. PROCESS CCFemme.glb
# ──────────────────────────────────────────────────────────────────────────
print("\n=== Processing CCFemme.glb ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(media_dir, "cyber_char_a.glb"))

# List all objects to confirm names
print("Objects in cyber_char_a.glb:", [obj.name for obj in bpy.data.objects])

# Delete male armature
male_arm = bpy.data.objects.get("Object_219")
if male_arm:
    print("Deleting male armature Object_219...")
    bpy.data.objects.remove(male_arm, do_unlink=True)

# Delete male meshes/objects
male_meshes = ["5", "6", "Cyborg_Male", "Cyborg_Male_Mesh"]
for name in male_meshes:
    obj = bpy.data.objects.get(name)
    if obj:
        print(f"Deleting male mesh {name}...")
        bpy.data.objects.remove(obj, do_unlink=True)

# Clear pose transforms of female armature Object_4
fem_arm = bpy.data.objects.get("Object_4")
if fem_arm:
    print("Clearing pose transforms for female armature Object_4...")
    bpy.context.view_layer.objects.active = fem_arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in fem_arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.ops.object.mode_set(mode='OBJECT')
else:
    print("WARNING: Female armature Object_4 not found!")

# Export cleaned female GLB
out_femme = os.path.join(media_dir, "CCFemme.glb")
bpy.ops.export_scene.gltf(
    filepath=out_femme,
    export_format='GLB',
    export_animations=False
)
print(f"Saved CCFemme.glb to {out_femme}")

# ──────────────────────────────────────────────────────────────────────────
# 2. PROCESS CChomme.glb
# ──────────────────────────────────────────────────────────────────────────
print("\n=== Processing CChomme.glb ===")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(media_dir, "cyber_char_b.glb"))

# Clear pose transforms of male armature Object_219
male_arm = bpy.data.objects.get("Object_219")
if male_arm:
    print("Clearing pose transforms for male armature Object_219...")
    bpy.context.view_layer.objects.active = male_arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in male_arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.ops.object.mode_set(mode='OBJECT')
else:
    print("WARNING: Male armature Object_219 not found!")

# Export cleared male GLB
out_homme = os.path.join(media_dir, "CChomme.glb")
bpy.ops.export_scene.gltf(
    filepath=out_homme,
    export_format='GLB',
    export_animations=False
)
print(f"Saved CChomme.glb to {out_homme}")

print("\n=== All Done! ===")
