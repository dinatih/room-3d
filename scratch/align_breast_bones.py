import bpy

def align_breasts(source_path, target_path, output_path):
    print(f"\n--- Aligning breast bones from {source_path} to {target_path} ---")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import source
    bpy.ops.import_scene.gltf(filepath=source_path)
    src_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    
    # Get world-space positions of breast bones
    # We must be in edit mode or read from bones
    bpy.context.view_layer.objects.active = src_arm
    bpy.ops.object.mode_set(mode='EDIT')
    
    left_head = src_arm.matrix_world @ src_arm.data.edit_bones['breast_left_base'].head.copy()
    left_tail = src_arm.matrix_world @ src_arm.data.edit_bones['breast_left_base'].tail.copy()
    left_roll = src_arm.data.edit_bones['breast_left_base'].roll
    
    right_head = src_arm.matrix_world @ src_arm.data.edit_bones['breast_right_base'].head.copy()
    right_tail = src_arm.matrix_world @ src_arm.data.edit_bones['breast_right_base'].tail.copy()
    right_roll = src_arm.data.edit_bones['breast_right_base'].roll
    
    print(f"Source left breast head: {left_head}, tail: {left_tail}")
    print(f"Source right breast head: {right_head}, tail: {right_tail}")
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Delete source
    bpy.ops.object.select_all(action='DESELECT')
    src_arm.select_set(True)
    for c in src_arm.children:
        c.select_set(True)
    bpy.ops.object.delete()
    
    # Import target
    bpy.ops.import_scene.gltf(filepath=target_path)
    tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    
    # Go to edit mode to reposition target breast bones
    bpy.context.view_layer.objects.active = tgt_arm
    bpy.ops.object.mode_set(mode='EDIT')
    
    # Align left breast
    l_bone = tgt_arm.data.edit_bones.get('breast_left_base')
    if l_bone:
        l_bone.head = tgt_arm.matrix_world.inverted() @ left_head
        l_bone.tail = tgt_arm.matrix_world.inverted() @ left_tail
        l_bone.roll = left_roll
        # Ensure correct parent
        parent_bone = tgt_arm.data.edit_bones.get('mixamorig_spine_upper')
        if parent_bone:
            l_bone.parent = parent_bone
            print("Parented left breast to mixamorig_spine_upper")
            
    # Align right breast
    r_bone = tgt_arm.data.edit_bones.get('breast_right_base')
    if r_bone:
        r_bone.head = tgt_arm.matrix_world.inverted() @ right_head
        r_bone.tail = tgt_arm.matrix_world.inverted() @ right_tail
        r_bone.roll = right_roll
        # Ensure correct parent
        parent_bone = tgt_arm.data.edit_bones.get('mixamorig_spine_upper')
        if parent_bone:
            r_bone.parent = parent_bone
            print("Parented right breast to mixamorig_spine_upper")
            
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Export target
    bpy.ops.object.select_all(action='DESELECT')
    tgt_arm.select_set(True)
    for o in bpy.context.scene.objects:
        if o.parent == tgt_arm or o == tgt_arm:
            o.select_set(True)
            
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
    print(f"Aligned and exported successfully to: {output_path}")

# Run for the files
files_to_fix = [
    "/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb",
    "/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb"
]

for f in files_to_fix:
    align_breasts(
        "/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb",
        f,
        f
    )
