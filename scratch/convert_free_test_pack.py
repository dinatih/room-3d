import bpy
import os
import glob

OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"
os.makedirs(OUT_DIR, exist_ok=True)

IN_DIR = "/home/dinatih/Projects/room-3d/sources_backup/free_test_pack"

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_animation(fbx_path, name):
    clean_scene()
    print(f"--- Exporting Animation: {name} ---")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    # Fix names for consistency
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for b in arm.data.bones:
        b.name = "mixamorig_" + b.name.replace("mixamorig:", "").replace("mixamorig_", "").replace(" ", "_")
        
    out_path = os.path.join(OUT_DIR, f"anim_{name}.glb")
    # MUST export_yup=True so the animation vertical axis matches the Y-up models
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_animations=True, export_yup=True)
    print(f"Exported to {out_path}")

if __name__ == "__main__":
    fbx_files = glob.glob(os.path.join(IN_DIR, "*.fbx"))
    for fbx_path in fbx_files:
        basename = os.path.basename(fbx_path)
        if basename == "X Bot.fbx":
            continue # skip the mesh
        
        # Create a clean name like "samba_dancing" from "samba dancing.fbx"
        name = basename.replace(".fbx", "").replace(" ", "_").lower()
        export_animation(fbx_path, name)
