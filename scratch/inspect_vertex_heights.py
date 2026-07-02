import bpy

# Load the Scoop bodysuit style zip / FBX to inspect
bpy.ops.wm.read_factory_settings(use_empty=True)
import zipfile
import os

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect")
    
fbx_path = "/tmp/scoop_inspect/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

# Let's find the armature and the body mesh
armature = None
body_mesh = None

print("ALL SCENE OBJECTS:")
for obj in bpy.data.objects:
    print(f"Object: {obj.name}, type={obj.type}")
    if obj.type == 'MESH':
        body_mesh = obj

print(f"Armature: {armature.name if armature else 'None'}")
print(f"Body Mesh: {body_mesh.name if body_mesh else 'None'}")

if body_mesh and armature:
    # Let's check the location of spine_upper / breast bones or chest area
    # Note: breast bones are added dynamically in our build script, so let's see where spine_upper is
    spine_upper = armature.pose.bones.get("spine_upper") or armature.pose.bones.get("Spine2")
    if spine_upper:
        # Get head / tail positions in world space
        world_matrix = armature.matrix_world
        head_world = world_matrix @ spine_upper.head
        tail_world = world_matrix @ spine_upper.tail
        print(f"spine_upper head Z (up): {head_world.z:.4f}, tail Z: {tail_world.z:.4f}")
        
    # Let's inspect the vertex coordinates of the mesh in local space
    # Z coordinate is vertical.
    z_coords = [v.co.z for v in body_mesh.data.vertices]
    print(f"Vertex Z range: min={min(z_coords):.4f}, max={max(z_coords):.4f}")
