import bpy
import os

media_dir = "public/media/sandbox"

def inspect_objects(filename):
    print(f"\n======================================")
    print(f"OBJECTS IN: {filename}")
    print(f"======================================")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(media_dir, filename))
    
    for obj in bpy.data.objects:
        print(f"Object: '{obj.name}' (type={obj.type})")
        print(f"  Location: {list(obj.location)}")
        print(f"  Rotation (Euler): {list(obj.rotation_euler)}")
        print(f"  Scale: {list(obj.scale)}")
        if obj.parent:
            print(f"  Parent: '{obj.parent.name}'")

inspect_objects("cyber_char_a.glb")
inspect_objects("cyber_char_b.glb")
