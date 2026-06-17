import bpy
import os

ANIM_SRC = "/home/dinatih/Projects/room-3d/sources_backup/animations"
OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_animation(fbx_path, name):
    clean_scene()
    print(f"--- Processing: {name} ---")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not arm: return
        
    arm.name = "Armature"
    
    # KEEP ORIGINAL COLON NAMES
    for b in arm.data.bones:
        if not b.name.startswith("mixamorig:"):
             b.name = "mixamorig:" + b.name
        
    out_path = os.path.join(OUT_DIR, f"anim_{name}.glb")
    
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_animations=True,
        export_yup=True,
        export_apply=True
    )

if __name__ == "__main__":
    if not os.path.exists(OUT_DIR):
        os.makedirs(OUT_DIR)
        
    for f in os.listdir(ANIM_SRC):
        if not f.endswith(".fbx"): continue
        path = os.path.join(ANIM_SRC, f)
        name = f.replace(".fbx", "").replace(" ", "_").replace(",", "").replace("-", "_").lower()
        export_animation(path, name)
