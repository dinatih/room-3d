import bpy
import os

OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"
os.makedirs(OUT_DIR, exist_ok=True)

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_animation(fbx_path, name):
    clean_scene()
    print(f"--- Exporting Animation: {name} ---")
    if not os.path.exists(fbx_path):
        print(f"Error: FBX file not found at {fbx_path}")
        return
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    # Fix names for consistency
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not arm:
        print(f"Warning: No Armature found in {fbx_path}")
        return
        
    for b in arm.data.bones:
        b.name = "mixamorig_" + b.name.replace("mixamorig:", "").replace("mixamorig_", "").replace(" ", "_")
        
    out_path = os.path.join(OUT_DIR, f"anim_{name}.glb")
    # MUST export_yup=True so the animation vertical axis matches the Y-up models
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_animations=True, export_yup=True)
    print(f"Exported to {out_path}")

if __name__ == "__main__":
    anims_to_convert = [
        ("/home/dinatih/Projects/room-3d/sources_backup/Blow A Kiss.fbx", "blow_a_kiss"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Climbing.fbx", "climbing"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Kiss (1).fbx", "kiss_1"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Kiss from man.fbx", "kiss_from_man"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Kiss from woman.fbx", "kiss_from_woman"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Kiss.fbx", "kiss"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Macarena Dance.fbx", "macarena_dance"),
        ("/home/dinatih/Projects/room-3d/sources_backup/Taken Hostage - Villain.fbx", "taken_hostage_villain")
    ]
    
    for fbx_path, name in anims_to_convert:
        export_animation(fbx_path, name)
