import bpy
import os

def convert_fbx_to_glb(fbx_path, glb_path):
    print(f"--- Converting: {fbx_path} -> {glb_path} ---")
    if not os.path.exists(fbx_path):
        print(f"Error: FBX file not found at {fbx_path}")
        return False
        
    # Reset scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import FBX
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    # Clean up prefixes from object/bone names
    for o in bpy.data.objects:
        if ":" in o.name:
            o.name = o.name.split(":")[-1]
            
    # Also clean up armature bones if any
    for arm in bpy.data.armatures:
        for bone in arm.bones:
            if ":" in bone.name:
                bone.name = bone.name.split(":")[-1]
                
    # Ensure directory exists
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)
    
    # Export GLB
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
    print(f"Successfully exported to {glb_path}")
    return True

if __name__ == "__main__":
    variants = [
        (
            "/tmp/lara_extract/black_tank_top/source_fbx/X8QZJLEB0GKTVPR57TCD0LCQH.fbx",
            "/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_black_tank_top.glb"
        ),
        (
            "/tmp/lara_extract/lara_4259/source_fbx/HDWBPF98UM9VH1MI3XS3A3EUO.fbx",
            "/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_4259.glb"
        )
    ]
    
    for fbx, glb in variants:
        convert_fbx_to_glb(fbx, glb)
