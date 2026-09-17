import bpy
import mathutils
import math

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="sources_backup/curious_skeleton/source/Curious skeleton.glb")

arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
mesh = [o for o in bpy.data.objects if o.type == "MESH" and len(o.data.vertices) > 1000][0]

for o in list(bpy.data.objects):
    if o not in (arm, mesh):
        bpy.data.objects.remove(o, do_unlink=True)

if arm.parent:
    arm.parent = None
mesh.parent = arm

for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)
for obj in bpy.data.objects:
    obj.animation_data_clear()

# Helper to merge vertex groups
def merge_vg(mesh, source_names, target_name):
    target_vg = mesh.vertex_groups.get(target_name)
    if not target_vg:
        target_vg = mesh.vertex_groups.new(name=target_name)
    for src_name in source_names:
        src_vg = mesh.vertex_groups.get(src_name)
        if not src_vg: continue
        for v in mesh.data.vertices:
            try:
                w = src_vg.weight(v.index)
                if w > 0.0001:
                    curr_w = 0.0
                    try: curr_w = target_vg.weight(v.index)
                    except: pass
                    target_vg.add([v.index], curr_w + w, 'REPLACE')
            except: pass
        mesh.vertex_groups.remove(src_vg)

merge_vg(mesh, ['l_hand.36'], 'l_wrist.35')
merge_vg(mesh, ['r_hand.62'], 'r_wrist.61')

# Reparent bones in EDIT MODE
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')

arm.data.edit_bones['pelvis.5'].parent = None

# Connect left arm: clavicle -> humerus -> elbow -> wrist
arm.data.edit_bones['l_humerus.33'].parent = arm.data.edit_bones['l_clavicle_base.31']
arm.data.edit_bones['l_wrist.35'].parent = arm.data.edit_bones['l_elbow.34']
for f in ['l_pointer1.37', 'l_middle1.41', 'l_ring1.45', 'l_pinkie1.49', 'l_thumb1.53']:
    if f in arm.data.edit_bones:
        arm.data.edit_bones[f].parent = arm.data.edit_bones['l_wrist.35']

# Connect right arm: clavicle -> humerus -> elbow -> wrist
arm.data.edit_bones['r_humerus.59'].parent = arm.data.edit_bones['r_clavicle_base.57']
arm.data.edit_bones['r_wrist.61'].parent = arm.data.edit_bones['r_elbow.60']
for f in ['r_pointer1.63', 'r_middle1.67', 'r_ring1.71', 'r_pinkie1.75', 'r_thumb1.79']:
    if f in arm.data.edit_bones:
        arm.data.edit_bones[f].parent = arm.data.edit_bones['r_wrist.61']

deleted_bones = [
    'root.4',
    'l_clavicle_distal.32', 'l_hand.36',
    'l_pointer4.40', 'l_middle4.44', 'l_ring4.48', 'l_pinkie4.52', 'l_thumb4.56',
    'r_clavicle_distal.58', 'r_hand.62',
    'r_pointer4.66', 'r_middle4.70', 'r_ring4.74', 'r_pinkie4.78', 'r_thumb4.82',
    'l_scapula_end.84', 'r_scapula_end.86',
    'l_foot3.92', 'l_foot5.94', 'l_foot7.96', 'l_foot9.98',
    'r_foot3.105', 'r_foot5.107', 'r_foot7.109', 'r_foot9.111'
]
for b_name in deleted_bones:
    if b_name in arm.data.edit_bones:
        arm.data.edit_bones.remove(arm.data.edit_bones[b_name])

bpy.ops.object.mode_set(mode='OBJECT')

for b_name in deleted_bones:
    vg = mesh.vertex_groups.get(b_name)
    if vg:
        mesh.vertex_groups.remove(vg)

# POSE MODE ADJUSTMENT
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

def set_bone_world_matrix(pb, target_mat):
    w_head = arm.matrix_world @ pb.head
    target_mat_pos = target_mat.copy()
    target_mat_pos.translation = w_head
    pb.matrix = arm.matrix_world.inverted() @ target_mat_pos
    bpy.context.view_layer.update()

def rotate_bone_to_align(pb, curr_w_dir, target_w_dir):
    q = curr_w_dir.rotation_difference(target_w_dir)
    w_head = arm.matrix_world @ pb.head
    m_w = arm.matrix_world @ pb.matrix
    m_w_new = mathutils.Matrix.Translation(w_head) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_w
    pb.matrix = arm.matrix_world.inverted() @ m_w_new
    bpy.context.view_layer.update()

# 1. Align Cervical Spine and Skull (FACE FORWARD: +Z up, -Y front, +X right)
# Bone local in Blender: Y is along bone (+Z), X is right (+X), Z is back (+Y)
target_head_rot = mathutils.Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
# With Euler(90, 0, 0): local Y = (0, 0, 1) [up], local Z = (0, 1, 0) [back, so -Z is front!], local X = (1, 0, 0) [right]

for bname in ['c7.23', 'c6.24', 'c5.25', 'c4.26', 'c3.27', 'skull.28']:
    pb = arm.pose.bones.get(bname)
    if pb:
        set_bone_world_matrix(pb, target_head_rot)

# 2. Align Clavicles so both shoulders have exact same Y depth and height
p_l_clav = arm.pose.bones['l_clavicle_base.31']
p_r_clav = arm.pose.bones['r_clavicle_base.57']
# Make left clavicle point to target shoulder (0.19, -0.02, 1.48)
w_l_clav_head = arm.matrix_world @ p_l_clav.head
v_l_target = (mathutils.Vector((0.19, -0.02, 1.48)) - w_l_clav_head).normalized()
v_l_curr = ((arm.matrix_world @ arm.pose.bones['l_humerus.33'].head) - w_l_clav_head).normalized()
rotate_bone_to_align(p_l_clav, v_l_curr, v_l_target)

# Make right clavicle point to target shoulder (-0.19, -0.02, 1.48)
w_r_clav_head = arm.matrix_world @ p_r_clav.head
v_r_target = (mathutils.Vector((-0.19, -0.02, 1.48)) - w_r_clav_head).normalized()
v_r_curr = ((arm.matrix_world @ arm.pose.bones['r_humerus.59'].head) - w_r_clav_head).normalized()
rotate_bone_to_align(p_r_clav, v_r_curr, v_r_target)

# 3. Left Arm: strictly +X, palm facing down (-Z), thumb forward (-Y)
# For Left Arm pointing +X:
# Local Y = (1, 0, 0) [+X]
# Local Z = (0, 0, 1) [up, so -Z is down for palm]
# Local X = (0, 1, 0)
rot_l_arm = mathutils.Euler((0, math.radians(-90), 0)).to_matrix().to_4x4()
# Check: Euler(0, -90, 0) -> local Y = (1, 0, 0), local Z = (0, 0, 1)
# With local Y along bone (+X):
# Palm facing down means bone's roll should have palm normal down (-Z)
p_la = arm.pose.bones['l_humerus.33']
p_le = arm.pose.bones['l_elbow.34']
v_la = ((arm.matrix_world @ p_le.head) - (arm.matrix_world @ p_la.head)).normalized()
rotate_bone_to_align(p_la, v_la, mathutils.Vector((1, 0, 0)))

p_lw = arm.pose.bones['l_wrist.35']
v_le = ((arm.matrix_world @ p_lw.head) - (arm.matrix_world @ p_le.head)).normalized()
rotate_bone_to_align(p_le, v_le, mathutils.Vector((1, 0, 0)))

p_lmid = arm.pose.bones['l_middle1.41']
v_lw = ((arm.matrix_world @ p_lmid.head) - (arm.matrix_world @ p_lw.head)).normalized()
rotate_bone_to_align(p_lw, v_lw, mathutils.Vector((1, 0, 0)))

# Align left fingers along +X
for f in ['l_pointer1.37', 'l_middle1.41', 'l_ring1.45', 'l_pinkie1.49']:
    pb = arm.pose.bones.get(f)
    if pb:
        w_h = arm.matrix_world @ pb.head
        w_t = arm.matrix_world @ pb.tail
        rotate_bone_to_align(pb, (w_t - w_h).normalized(), mathutils.Vector((1, 0, 0)))

# 4. Right Arm: strictly -X, palm facing down (-Z), thumb forward (-Y)
p_ra = arm.pose.bones['r_humerus.59']
p_re = arm.pose.bones['r_elbow.60']
v_ra = ((arm.matrix_world @ p_re.head) - (arm.matrix_world @ p_ra.head)).normalized()
rotate_bone_to_align(p_ra, v_ra, mathutils.Vector((-1, 0, 0)))

p_rw = arm.pose.bones['r_wrist.61']
v_re = ((arm.matrix_world @ p_rw.head) - (arm.matrix_world @ p_re.head)).normalized()
rotate_bone_to_align(p_re, v_re, mathutils.Vector((-1, 0, 0)))

p_rmid = arm.pose.bones['r_middle1.67']
v_rw = ((arm.matrix_world @ p_rmid.head) - (arm.matrix_world @ p_rw.head)).normalized()
rotate_bone_to_align(p_rw, v_rw, mathutils.Vector((-1, 0, 0)))

for f in ['r_pointer1.63', 'r_middle1.67', 'r_ring1.71', 'r_pinkie1.75']:
    pb = arm.pose.bones.get(f)
    if pb:
        w_h = arm.matrix_world @ pb.head
        w_t = arm.matrix_world @ pb.tail
        rotate_bone_to_align(pb, (w_t - w_h).normalized(), mathutils.Vector((-1, 0, 0)))

# 5. Legs alignment: Symmetrical and grounded
p_lul = arm.pose.bones['l_hip_n.87']
p_lk = arm.pose.bones['l_knee_n.88']
p_la = arm.pose.bones['l_ankle_n.89']
p_lf = arm.pose.bones['l_foot1.90']

p_rul = arm.pose.bones['r_hip_n.100']
p_rk = arm.pose.bones['r_knee_n.101']
p_ra = arm.pose.bones['r_ankle_n.102']
p_rf = arm.pose.bones['r_foot1.103']

# Target knee: X=+/- 0.12, Y=0.0, Z=0.48
# Left thigh:
w_lul_head = arm.matrix_world @ p_lul.head
v_lt_target = (mathutils.Vector((0.12, 0.0, 0.48)) - w_lul_head).normalized()
v_lt_curr = ((arm.matrix_world @ p_lk.head) - w_lul_head).normalized()
rotate_bone_to_align(p_lul, v_lt_curr, v_lt_target)

# Left shin: knee to ankle (0.12, 0.02, 0.08)
w_lk_head = arm.matrix_world @ p_lk.head
v_ls_target = (mathutils.Vector((0.12, 0.02, 0.08)) - w_lk_head).normalized()
v_ls_curr = ((arm.matrix_world @ p_la.head) - w_lk_head).normalized()
rotate_bone_to_align(p_lk, v_ls_curr, v_ls_target)

# Left foot: flat on ground pointing -Y
rotate_bone_to_align(p_la, ((arm.matrix_world @ p_lf.head) - (arm.matrix_world @ p_la.head)).normalized(), mathutils.Vector((0, -1, 0)))

# Right thigh:
w_rul_head = arm.matrix_world @ p_rul.head
v_rt_target = (mathutils.Vector((-0.12, 0.0, 0.48)) - w_rul_head).normalized()
v_rt_curr = ((arm.matrix_world @ p_rk.head) - w_rul_head).normalized()
rotate_bone_to_align(p_rul, v_rt_curr, v_rt_target)

# Right shin: knee to ankle (-0.12, 0.02, 0.08)
w_rk_head = arm.matrix_world @ p_rk.head
v_rs_target = (mathutils.Vector((-0.12, 0.02, 0.08)) - w_rk_head).normalized()
v_rs_curr = ((arm.matrix_world @ p_ra.head) - w_rk_head).normalized()
rotate_bone_to_align(p_rk, v_rs_curr, v_rs_target)

# Right foot: flat on ground pointing -Y
rotate_bone_to_align(p_ra, ((arm.matrix_world @ p_rf.head) - (arm.matrix_world @ p_ra.head)).normalized(), mathutils.Vector((0, -1, 0)))

bpy.ops.object.mode_set(mode='OBJECT')

# Render test front and top
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.film_transparent = True

cam = bpy.data.cameras.new("Cam")
cam.type = 'ORTHO'
cam.ortho_scale = 2.2
cam_obj = bpy.data.objects.new("Cam", cam)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

light = bpy.data.lights.new("Sun", type="SUN")
light.energy = 4.0
l_obj = bpy.data.objects.new("Sun", light)
scene.collection.objects.link(l_obj)
l_obj.rotation_euler = (math.radians(45), math.radians(20), math.radians(30))

# Front view
cam_obj.location = (0, -3.0, 1.0)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
scene.render.filepath = "/tmp/tpose_ortho_front.png"
bpy.ops.render.render(write_still=True)
print("Rendered /tmp/tpose_ortho_front.png")

# Top view
cam_obj.location = (0, 0, 3.0)
cam_obj.rotation_euler = (0, 0, math.radians(-90)) # so -Y is facing right/down
scene.render.filepath = "/tmp/tpose_ortho_top.png"
bpy.ops.render.render(write_still=True)
print("Rendered /tmp/tpose_ortho_top.png")
