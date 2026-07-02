import bpy

for path, label in [
    ("/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb", "07_scoop"),
    ("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "lara_native"),
    ("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        print(f"\n=== WEIGHTS FOR {label} ===")
        # Look for breast bones vertex groups in meshes
        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH':
                # Check if it has vertex groups for breast bones
                breast_groups = [g for g in obj.vertex_groups if "breast" in g.name.lower()]
                if breast_groups:
                    print(f"Mesh {obj.name} has breast groups:")
                    for g in breast_groups:
                        # Count how many vertices have non-zero weight for this group
                        v_count = 0
                        for v in obj.data.vertices:
                            for grp in v.groups:
                                if grp.group == g.index and grp.weight > 0.0:
                                    v_count += 1
                        print(f"  - Group {g.name}: index={g.index}, vertices with weight > 0: {v_count}")
    except Exception as e:
        print(f"Error loading {label}: {e}")
