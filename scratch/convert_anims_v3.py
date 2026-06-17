import bpy
import os

ANIM_SRC = "/home/dinatih/Projects/room-3d/sources_backup/animations"
OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_animation(fbx_path, name):
    clean_scene()
    print(f"--- Processing Animation: {name} ---")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    # Standardize Armature name only
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not arm:
        print(f"ERROR: No armature found in {fbx_path}")
        return
        
    arm.name = "mixamo_armature"
    
    out_path = os.path.join(OUT_DIR, f"anim_{name}.glb")
    
    # Export with Y-Up and Animations
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_animations=True,
        export_yup=True,
        export_apply=True
    )
    print(f"Exported: {out_path}")

if __name__ == "__main__":
    if not os.path.exists(OUT_DIR):
        os.makedirs(OUT_DIR)
        
    for f in os.listdir(ANIM_SRC):
        if not f.endswith(".fbx"): continue
        path = os.path.join(ANIM_SRC, f)
        name = f.replace(".fbx", "").replace(" ", "_").replace(",", "").replace("-", "_").lower()
        export_animation(path, name)
