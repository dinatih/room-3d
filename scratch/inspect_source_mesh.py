import bpy

for path, name in [
    ("/home/dinatih/Projects/room-3d/public/media/sandbox/source_woman_solo.glb", "woman_solo"),
    ("/home/dinatih/Projects/room-3d/public/media/sandbox/source_knee_push_up.glb", "knee_push_up")
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    print(f"\n=== OBJECTS IN {name} ===")
    for obj in bpy.context.scene.objects:
        print(f"Name: {obj.name}, Type: {obj.type}, Parent: {obj.parent.name if obj.parent else 'None'}, Dimensions: {obj.dimensions}")
