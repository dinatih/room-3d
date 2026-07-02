import bpy

def clear_pose_and_export(in_path, out_path):
    print(f"\n======================================")
    print(f"Clearing pose and exporting: {in_path} -> {out_path}")
    print(f"======================================")
    
    # Clear existing data
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import GLB
    bpy.ops.import_scene.gltf(filepath=in_path)
    
    armatures = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE']
    for arm in armatures:
        # Select armature
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='POSE')
        
        # Clear pose rotations, translations, scales
        for pb in arm.pose.bones:
            pb.rotation_quaternion = (1, 0, 0, 0)
            pb.rotation_euler = (0, 0, 0)
            pb.location = (0, 0, 0)
            pb.scale = (1, 1, 1)
            
        bpy.ops.object.mode_set(mode='OBJECT')
        
    # Export GLTF/GLB
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_animations=False # We don't need animations in the static meshes
    )
    print("Done!")

clear_pose_and_export("public/media/sandbox/cyber_char_a.glb", "public/media/sandbox/CCFemme_cleared.glb")
clear_pose_and_export("public/media/sandbox/cyber_char_b.glb", "public/media/sandbox/CChomme_cleared.glb")
