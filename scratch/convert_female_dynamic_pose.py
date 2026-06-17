import bpy
import os

def main():
    fbx_path = "/home/dinatih/Projects/room-3d/sources_backup/Female Dynamic Pose.fbx"
    out_path = "/home/dinatih/Projects/room-3d/public/media/sandbox/anim_female_dynamic_pose.glb"

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    # Fix names for consistency
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for b in arm.data.bones:
        b.name = "mixamorig_" + b.name.replace("mixamorig:", "").replace("mixamorig_", "").replace(" ", "_")

    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_animations=True, export_yup=True)
    print(f"Exported to {out_path}")

if __name__ == "__main__":
    main()
