import bpy
import sys

def inspect_file(filepath):
    print(f"\n======================================")
    print(f"INSPECTING: {filepath}")
    print(f"======================================")
    
    # Clear existing data
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import GLB
    bpy.ops.import_scene.gltf(filepath=filepath)
    
    armatures = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE']
    if not armatures:
        print("No armatures found!")
        return
        
    for arm in armatures:
        print(f"\nArmature object: {arm.name}")
        # In edit mode, we can see the edit bones (rest pose)
        # Select armature and set active
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='EDIT')
        print("Edit bones (Rest Pose in edit space):")
        for eb in arm.data.edit_bones[:5]:
            print(f"  Bone '{eb.name}': head={list(eb.head)}, tail={list(eb.tail)}, roll={eb.roll:.4f}")
            
        bpy.ops.object.mode_set(mode='POSE')
        print("Pose bones (current pose in pose space):")
        non_identity_pose_bones = []
        for pb in arm.pose.bones:
            # check rotation_quaternion or rotation_euler
            q = pb.rotation_quaternion
            loc = pb.location
            # check if rotated/translated from rest pose
            if abs(q.w - 1.0) > 0.001 or abs(q.x) > 0.001 or abs(q.y) > 0.001 or abs(q.z) > 0.001 or loc.length > 0.001:
                non_identity_pose_bones.append((pb.name, list(loc), list(q)))
        
        print(f"Total pose bones: {len(arm.pose.bones)}")
        print(f"Pose bones with non-identity pose transforms: {len(non_identity_pose_bones)}")
        for name, loc, rot in non_identity_pose_bones[:10]:
            print(f"  Bone '{name}': pos={loc}, rot={rot}")

inspect_file("public/media/sandbox/cyber_char_a.glb")
inspect_file("public/media/sandbox/cyber_char_b.glb")
