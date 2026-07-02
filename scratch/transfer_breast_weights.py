import bpy

def transfer_weights(source_path, target_path, output_path):
    print(f"\n--- Transferring weights from {source_path} to {target_path} ---")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import source
    bpy.ops.import_scene.gltf(filepath=source_path)
    src_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    
    # Find source meshes with breast weights
    src_breast_meshes = []
    for m in src_meshes:
        has_weights = False
        for g in m.vertex_groups:
            if "breast" in g.name.lower():
                # check if anyone has weight
                for v in m.data.vertices:
                    for grp in v.groups:
                        if grp.group == g.index and grp.weight > 0.01:
                            has_weights = True
                            break
        if has_weights:
            src_breast_meshes.append(m)
            
    print("Source breast meshes found:", [m.name for m in src_breast_meshes])
    if not src_breast_meshes:
        print("ERROR: No source breast meshes found!")
        return

    # Import target
    # We must keep source loaded to transfer from them
    bpy.ops.import_scene.gltf(filepath=target_path)
    
    # Target armature and meshes (they were imported second, so they are not in src_meshes)
    target_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o not in src_meshes]
    target_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o.name != "Armature") # source armature might be named Armature or root
    
    # We want to transfer weights from the source breast meshes to target meshes that cover the chest area.
    # In Lara Scoop, the main body mesh is '5_+Head|Glasses_1.0_0_0' or similar.
    # To be safe, we can transfer to ALL target meshes that already have 'breast_left_base' / 'breast_right_base' vertex groups
    # but currently have 0 vertices.
    for tgt_mesh in target_meshes:
        has_breast_group = any("breast" in g.name.lower() for g in tgt_mesh.vertex_groups)
        if has_breast_group:
            print(f"Targeting mesh: {tgt_mesh.name}")
            # For each source breast mesh, transfer weights using Data Transfer
            for src_mesh in src_breast_meshes:
                # Add Data Transfer modifier
                mod = tgt_mesh.modifiers.new(name="Weight_Transfer", type='DATA_TRANSFER')
                mod.object = src_mesh
                mod.use_vert_data = True
                mod.data_types_verts = {'VGROUP_WEIGHTS'}
                mod.vert_mapping = 'POLYINTERP_NEAREST'
                
                # Apply modifier
                bpy.context.view_layer.objects.active = tgt_mesh
                bpy.ops.object.modifier_apply(modifier=mod.name)
                print(f"Transferred weights from {src_mesh.name} to {tgt_mesh.name}")

    # Delete source objects to avoid exporting them
    bpy.ops.object.select_all(action='DESELECT')
    for o in src_meshes:
        o.select_set(True)
    # Also delete source armatures
    for o in bpy.context.scene.objects:
        if o.type == 'ARMATURE' and o != target_arm:
            o.select_set(True)
            # delete children too
            for child in o.children:
                child.select_set(True)
    bpy.ops.object.delete()

    # Verify target weights
    print("\nVerifying transferred weights:")
    for tgt_mesh in target_meshes:
        breast_groups = [g for g in tgt_mesh.vertex_groups if "breast" in g.name.lower()]
        for g in breast_groups:
            v_count = sum(1 for v in tgt_mesh.data.vertices if any(grp.group == g.index and grp.weight > 0.01 for grp in v.groups))
            print(f"  Mesh {tgt_mesh.name} -> Group {g.name}: {v_count} vertices weighted")

    # Export target
    bpy.ops.object.select_all(action='DESELECT')
    target_arm.select_set(True)
    for o in bpy.context.scene.objects:
        if o.parent == target_arm or o == target_arm:
            o.select_set(True)
            
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
    print(f"Exported successfully to: {output_path}")

# Run for 07_scoop_bodysuit_shorts.glb
transfer_weights(
    "/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb",
    "/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb",
    "/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb"
)

# Run for lara_native.glb
transfer_weights(
    "/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"
)

# Run for rosanna_lara_native.glb
transfer_weights(
    "/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb"
)

# Run for vivid_red_lara_native.glb
transfer_weights(
    "/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb"
)

