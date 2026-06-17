import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="public/media/glb/lara_perfect_v2.glb")
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        for slot in obj.material_slots:
            if slot.material:
                print(f"Object: {obj.name}, Material: {slot.material.name}")
                if slot.material.node_tree:
                    for node in slot.material.node_tree.nodes:
                        if node.type == 'TEX_IMAGE':
                            print(f"  Texture: {node.image.name if node.image else 'None'}")
