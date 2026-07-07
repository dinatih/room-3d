import bpy
import sys

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify.blend")

armature = bpy.data.objects.get("metarig")
if not armature:
    print("Metarig not found")
    sys.exit(1)

bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode='EDIT')

bones = armature.data.edit_bones
s0 = bones.get("spine")
s1 = bones.get("spine.001")
s2 = bones.get("spine.002")
s3 = bones.get("spine.003")

if s0 and s1 and s2 and s3:
    # Get total length from bottom of spine to top of spine.003
    start_z = s0.head.z
    end_z = s3.tail.z
    total_len = end_z - start_z
    
    # Let's distribute them more evenly, like standard rigify or mixamo
    # Mixamo: Spine (lower), Spine1 (mid), Spine2 (upper)
    # Hips is roughly at start_z
    # spine (pelvis): ~10%
    # spine.001 (lower back): ~30%
    # spine.002 (mid back): ~30%
    # spine.003 (upper chest): ~30%
    
    p1 = start_z + total_len * 0.15
    p2 = start_z + total_len * 0.45
    p3 = start_z + total_len * 0.75
    
    s0.tail.z = p1
    s1.head.z = p1
    s1.tail.z = p2
    s2.head.z = p2
    s2.tail.z = p3
    s3.head.z = p3
    # s3.tail stays at end_z
    
    # We should also maintain the x and y coordinates by interpolating
    def interp(h, t, z_val):
        fac = (z_val - h.z) / (t.z - h.z) if t.z != h.z else 0
        return (
            h.x + (t.x - h.x) * fac,
            h.y + (t.y - h.y) * fac,
            z_val
        )
    
    full_h = s0.head.copy()
    full_t = s3.tail.copy()
    
    # Actually, the spine curves. Let's just evenly space the z, but keep y roughly interpolated from original curve
    # To be safe, just lerp between s0.head and s3.tail
    for z_val, head_bone, tail_bone in [(p1, s0, s1), (p2, s1, s2), (p3, s2, s3)]:
        pos = interp(full_h, full_t, z_val)
        head_bone.tail.x = pos[0]
        head_bone.tail.y = pos[1]
        head_bone.tail.z = pos[2]
        tail_bone.head.x = pos[0]
        tail_bone.head.y = pos[1]
        tail_bone.head.z = pos[2]
        
    print("Spine adjusted")

bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_fixed.blend")
