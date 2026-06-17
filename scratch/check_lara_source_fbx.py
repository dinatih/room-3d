import bpy
import os

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_path = "/home/dinatih/Projects/room-3d/scratch/lara_source_extracted/final_fbx/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
if os.path.exists(fbx_path):
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    print(f"Bones in {fbx_path}:")
    print(list(arm.data.bones.keys())[:15])
else:
    print(f"{fbx_path} does not exist!")
