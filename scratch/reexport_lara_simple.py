import bpy
import os

FBX_PATH = "/home/dinatih/Projects/room-3d/scratch/lara_source_extracted/final_fbx/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
GLB_PATH = "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=FBX_PATH)
    
    # 1. Stand up the armature if needed? No, let's keep it as is.
    # 2. Rename bones to mixamorig_root_...
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    
    # Simple rename for Hips
    for b in arm.data.bones:
        if "Pelvis" in b.name.lower():
            b.name = "mixamorig_root_hips"
        if "Ground" in b.name.lower():
            b.name = "mixamorig_root_ground"

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_yup=True,
        export_apply=True
    )
    print("SUCCESS")

if __name__ == "__main__":
    main()
