import bpy
import os

GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect_v2.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if arm:
        print(f"ARMATURE: {arm.name}")
        for bone in arm.data.bones:
            print(f"BONE: {bone.name}")
    else:
        print("NO ARMATURE FOUND")

if __name__ == "__main__":
    main()
