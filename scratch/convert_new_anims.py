import bpy
import os

OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"
os.makedirs(OUT_DIR, exist_ok=True)

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
    export_animation("/home/dinatih/Projects/room-3d/sources_backup/Martelo Do Chau Sem Mao.fbx", "martelo_do_chau_sem_mao")
    export_animation("/home/dinatih/Projects/room-3d/sources_backup/Female Laying Pose.fbx", "female_laying_pose")
    export_animation("/home/dinatih/Projects/room-3d/sources_backup/Female Laying Pose (1).fbx", "female_laying_pose_1")
    export_animation("/home/dinatih/Projects/room-3d/sources_backup/Female Laying Pose (2).fbx", "female_laying_pose_2")
    export_animation("/home/dinatih/Projects/room-3d/sources_backup/Female Laying Pose (3).fbx", "female_laying_pose_3")
    export_animation("/home/dinatih/Projects/room-3d/sources_backup/Tender Placement.fbx", "tender_placement")
