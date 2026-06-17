import bpy
import os

# Clear existing mesh/armature objects
bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_path = "/home/dinatih/Projects/room-3d/sources_backup/X Bot.fbx"
if not os.path.exists(fbx_path):
    print(f"Error: FBX file not found at {fbx_path}")
    exit(1)

# Import FBX
bpy.ops.import_scene.fbx(filepath=fbx_path)

# Find Armature
armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE':
        armature = obj
        break

if not armature:
    print("No armature found in FBX!")
    exit(1)

print(f"\n--- INSPECTING FBX: {fbx_path} ---")
print(f"Armature object name: {armature.name}")
print(f"Number of bones: {len(armature.data.bones)}")

# List first 10 bones and check names/namespaces
bones = armature.data.bones
print("\nFirst 15 bone names:")
for b in list(bones)[:15]:
    parent_name = b.parent.name if b.parent else "None"
    print(f" - {b.name} (Parent: {parent_name})")

# Let's check rotation mode and rest pose orientation of Hips
hips = bones.get("mixamorig:Hips") or bones.get("Hips") or bones.get("mixamorigHips") or list(bones)[0]
print(f"\nOs racine détecté : {hips.name}")
print(f"Position locale (head) : {hips.head}")
print(f"Position locale (tail) : {hips.tail}")
print(f"Matrice locale du Hips dans l'armature :\n{hips.matrix_local}")
if hips.parent:
    print(f"Parent du Hips : {hips.parent.name}")

# Let's print all bone names to check naming conventions (mixamorig: vs mixamorig_ vs no namespace)
print("\nAll bone names in FBX:")
all_names = [b.name for b in bones]
print(all_names)
