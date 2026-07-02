import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb")

print("\n=== MATERIALS AND TEXTURES IN LARA SCOOP ===")
for m in bpy.data.materials:
    print(f"Material: {m.name}")
    if m.use_nodes and m.node_tree:
        for node in m.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image:
                print(f"  Texture: {node.image.name} (File path: {node.image.filepath})")
