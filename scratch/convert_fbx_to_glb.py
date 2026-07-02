import bpy
import os

FBX_PATH = "/home/dinatih/Projects/room-3d/scratch/temp_unzip/extracted/NTESZ8IYSC2AGYKS6PG6UUYJL.fbx"
GLB_PATH = "/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_543i.glb"

def main():
    # Reset file
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import FBX
    print(f"Importing FBX: {FBX_PATH}...")
    bpy.ops.import_scene.fbx(filepath=FBX_PATH)
    
    # Basic cleanup: remove prefix if any
    for o in bpy.data.objects:
        if ":" in o.name:
            o.name = o.name.split(":")[-1]
            
    # Export as GLB
    print(f"Exporting GLB: {GLB_PATH}...")
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
    print(f"Export completed: {GLB_PATH}")

if __name__ == "__main__":
    main()
