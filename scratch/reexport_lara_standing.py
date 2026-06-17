import bpy
import os

FBX_PATH = "/home/dinatih/Projects/room-3d/scratch/lara_source_extracted/final_fbx/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
GLB_PATH = "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=FBX_PATH)
    
    lara_arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    
    # 1. STAND UP Armature
    lara_arm.rotation_euler[0] = 0 # Force upright
    
    # 2. APPLY TRANSFORM
    bpy.ops.object.select_all(action='DESELECT')
    lara_arm.select_set(True)
    bpy.context.view_layer.objects.active = lara_arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 3. Rename bones
    MAP = {"pelvis": "mixamorig_root_hips", "ground": "mixamorig_root_ground"}
    for b in lara_arm.data.bones:
        ln = b.name.lower()
        for k, v in MAP.items():
            if k in ln: b.name = v

    # Export
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_yup=True,
        export_apply=True
    )
    print("SUCCESS")

if __name__ == "__main__":
    main()
