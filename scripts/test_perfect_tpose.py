import bpy
import mathutils
import math
import os

SOURCE_GLB = "/home/dinatih/Projects/room-3d/sources_backup/curious_skeleton/source/Curious skeleton.glb"

print("--- TESTING PERFECT T-POSE ---")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SOURCE_GLB)

arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
mesh = [o for o in bpy.data.objects if o.type == "MESH" and len(o.data.vertices) > 1000][0]

# Delete RootNode and unneeded empties
root = bpy.data.objects.get("RootNode.0")
if root:
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    arm.parent = None
    bpy.data.objects.remove(root, do_unlink=True)

mesh.parent = arm

for o in list(bpy.data.objects):
    if o not in (arm, mesh):
        bpy.data.objects.remove(o, do_unlink=True)

for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)
for obj in bpy.data.objects:
    obj.animation_data_clear()

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

def rotate_bone_by_difference(pb, curr_w_dir, target_w_dir):
    q = curr_w_dir.rotation_difference(target_w_dir)
    w_head = arm.matrix_world @ pb.head
    m_w = arm.matrix_world @ pb.matrix
    m_w_new = mathutils.Matrix.Translation(w_head) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_w
    pb.matrix = arm.matrix_world.inverted() @ m_w_new
    bpy.context.view_layer.update()

# 1. HEAD & CERVICAL SPINE ALIGNMENT
# The skull was turned ~32° and tilted ~12°.
# To straighten:
# Align cervical vertebrae (c7 to c3) strictly along +Z:
for bname in ['c7.23', 'c6.24', 'c5.25', 'c4.26', 'c3.27']:
    pb = arm.pose.bones.get(bname)
    if pb:
        w_h = arm.matrix_world @ pb.head
        w_t = arm.matrix_world @ pb.tail
        rotate_bone_by_difference(pb, (w_t - w_h).normalized(), mathutils.Vector((0, 0, 1)))

# Now for skull.28:
# Target orientation in world space:
# Up (Local Y) = (0, 0, 1)
# Right (Local X) = (1, 0, 0)
# Front (Local -Z) = (0, -1, 0) -> so Local Z = (0, 1, 0)
# In Blender local coordinates, let's align skull tail to +Z and its face to -Y:
pb_skull = arm.pose.bones['skull.28']
w_sk_h = arm.matrix_world @ pb_skull.head
w_sk_t = arm.matrix_world @ pb_skull.tail
rotate_bone_by_difference(pb_skull, (w_sk_t - w_sk_h).normalized(), mathutils.Vector((0, 0, 1)))

# Now fix the yaw twist of the skull around +Z:
# Find nose/face direction
vg_skull = mesh.vertex_groups.get("skull.28")
dg = bpy.context.evaluated_depsgraph_get()
mesh_eval = mesh.evaluated_get(dg)
verts_eval = [(mesh.matrix_world @ v.co) for v in mesh_eval.data.vertices for g in v.groups if g.group == vg_skull.index]
c_skull = sum(verts_eval, mathutils.Vector((0,0,0))) / len(verts_eval)
min_y = min(v.y for v in verts_eval)
nose = [v for v in verts_eval if v.y < min_y + 0.02]
c_nose = sum(nose, mathutils.Vector((0,0,0))) / len(nose)
face_dir = (c_nose - c_skull).normalized()
yaw_angle = math.atan2(face_dir.x, -face_dir.y)
print(f"Current face yaw: {math.degrees(yaw_angle):.2f}°")

# Rotate skull around +Z by -yaw_angle
q_yaw = mathutils.Quaternion(mathutils.Vector((0, 0, 1)), -yaw_angle)
w_head = arm.matrix_world @ pb_skull.head
m_w = arm.matrix_world @ pb_skull.matrix
m_w_new = mathutils.Matrix.Translation(w_head) @ q_yaw.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_w
pb_skull.matrix = arm.matrix_world.inverted() @ m_w_new
bpy.context.view_layer.update()

# 2. SHOULDERS & ARMS ALIGNMENT
# Symmetrize clavicles:
p_lc = arm.pose.bones['l_clavicle_base.31']
p_rc = arm.pose.bones['r_clavicle_base.57']
# Target shoulder depth Y = -0.02, height Z = 1.48
v_lc = (mathutils.Vector((0.19, -0.02, 1.48)) - (arm.matrix_world @ p_lc.head)).normalized()
rotate_bone_by_difference(p_lc, ((arm.matrix_world @ arm.pose.bones['l_humerus.33'].head) - (arm.matrix_world @ p_lc.head)).normalized(), v_lc)

v_rc = (mathutils.Vector((-0.19, -0.02, 1.48)) - (arm.matrix_world @ p_rc.head)).normalized()
rotate_bone_by_difference(p_rc, ((arm.matrix_world @ arm.pose.bones['r_humerus.59'].head) - (arm.matrix_world @ p_rc.head)).normalized(), v_rc)

# Left Arm (Humerus, Elbow, Wrist, Hand, Fingers) -> strictly along (1, 0, 0)
p_la = arm.pose.bones['l_humerus.33']
p_le = arm.pose.bones['l_elbow.34']
rotate_bone_by_difference(p_la, ((arm.matrix_world @ p_le.head) - (arm.matrix_world @ p_la.head)).normalized(), mathutils.Vector((1, 0, 0)))

p_lw = arm.pose.bones['l_wrist.35']
rotate_bone_by_difference(p_le, ((arm.matrix_world @ p_lw.head) - (arm.matrix_world @ p_le.head)).normalized(), mathutils.Vector((1, 0, 0)))

p_lh = arm.pose.bones['l_hand.36']
rotate_bone_by_difference(p_lw, ((arm.matrix_world @ p_lh.head) - (arm.matrix_world @ p_lw.head)).normalized(), mathutils.Vector((1, 0, 0)))

p_lmid = arm.pose.bones['l_middle1.41']
rotate_bone_by_difference(p_lh, ((arm.matrix_world @ p_lmid.head) - (arm.matrix_world @ p_lh.head)).normalized(), mathutils.Vector((1, 0, 0)))

# Left Fingers along +X
for f in ['l_pointer1.37', 'l_middle1.41', 'l_ring1.45', 'l_pinkie1.49']:
    pb = arm.pose.bones.get(f)
    if pb:
        w_h = arm.matrix_world @ pb.head
        w_t = arm.matrix_world @ pb.tail
        rotate_bone_by_difference(pb, (w_t - w_h).normalized(), mathutils.Vector((1, 0, 0)))

# Right Arm (Humerus, Elbow, Wrist, Hand, Fingers) -> strictly along (-1, 0, 0)
p_ra = arm.pose.bones['r_humerus.59']
p_re = arm.pose.bones['r_elbow.60']
rotate_bone_by_difference(p_ra, ((arm.matrix_world @ p_re.head) - (arm.matrix_world @ p_ra.head)).normalized(), mathutils.Vector((-1, 0, 0)))

p_rw = arm.pose.bones['r_wrist.61']
rotate_bone_by_difference(p_re, ((arm.matrix_world @ p_rw.head) - (arm.matrix_world @ p_re.head)).normalized(), mathutils.Vector((-1, 0, 0)))

p_rh = arm.pose.bones['r_hand.62']
rotate_bone_by_difference(p_rw, ((arm.matrix_world @ p_rh.head) - (arm.matrix_world @ p_rw.head)).normalized(), mathutils.Vector((-1, 0, 0)))

p_rmid = arm.pose.bones['r_middle1.67']
rotate_bone_by_difference(p_rh, ((arm.matrix_world @ p_rmid.head) - (arm.matrix_world @ p_rh.head)).normalized(), mathutils.Vector((-1, 0, 0)))

# Right hand was twisted 180° in original model: untwist around (-1, 0, 0)
q_untwist = mathutils.Quaternion(mathutils.Vector((-1, 0, 0)), math.pi)
w_head = arm.matrix_world @ p_rh.head
m_w = arm.matrix_world @ p_rh.matrix
m_w_new = mathutils.Matrix.Translation(w_head) @ q_untwist.to_matrix().to_4x4() @ mathutils.Matrix.Translation(-w_head) @ m_w
p_rh.matrix = arm.matrix_world.inverted() @ m_w_new
bpy.context.view_layer.update()

for f in ['r_pointer1.63', 'r_middle1.67', 'r_ring1.71', 'r_pinkie1.75']:
    pb = arm.pose.bones.get(f)
    if pb:
        w_h = arm.matrix_world @ pb.head
        w_t = arm.matrix_world @ pb.tail
        rotate_bone_by_difference(pb, (w_t - w_h).normalized(), mathutils.Vector((-1, 0, 0)))

# 3. LEGS ALIGNMENT (SYMMETRICAL & STRAIGHT)
p_lul = arm.pose.bones['l_hip_n.87']
p_lk = arm.pose.bones['l_knee_n.88']
p_la = arm.pose.bones['l_ankle_n.89']
p_lf = arm.pose.bones['l_foot1.90']

p_rul = arm.pose.bones['r_hip_n.100']
p_rk = arm.pose.bones['r_knee_n.101']
p_ra = arm.pose.bones['r_ankle_n.102']
p_rf = arm.pose.bones['r_foot1.103']

# Left Thigh: from hip to target knee (+0.12, 0.0, 0.48)
w_lul_head = arm.matrix_world @ p_lul.head
v_lt_target = (mathutils.Vector((0.12, 0.0, 0.48)) - w_lul_head).normalized()
rotate_bone_by_difference(p_lul, ((arm.matrix_world @ p_lk.head) - w_lul_head).normalized(), v_lt_target)

# Left Shin: from knee to target ankle (+0.13, 0.02, 0.08)
w_lk_head = arm.matrix_world @ p_lk.head
v_ls_target = (mathutils.Vector((0.13, 0.02, 0.08)) - w_lk_head).normalized()
rotate_bone_by_difference(p_lk, ((arm.matrix_world @ p_la.head) - w_lk_head).normalized(), v_ls_target)

# Left Foot: flat on ground pointing -Y
rotate_bone_by_difference(p_la, ((arm.matrix_world @ p_lf.head) - (arm.matrix_world @ p_la.head)).normalized(), mathutils.Vector((0, -1, 0)))

# Right Thigh: from hip to target knee (-0.12, 0.0, 0.48)
w_rul_head = arm.matrix_world @ p_rul.head
v_rt_target = (mathutils.Vector((-0.12, 0.0, 0.48)) - w_rul_head).normalized()
rotate_bone_by_difference(p_rul, ((arm.matrix_world @ p_rk.head) - w_rul_head).normalized(), v_rt_target)

# Right Shin: from knee to target ankle (-0.13, 0.02, 0.08)
w_rk_head = arm.matrix_world @ p_rk.head
v_rs_target = (mathutils.Vector((-0.13, 0.02, 0.08)) - w_rk_head).normalized()
rotate_bone_by_difference(p_rk, ((arm.matrix_world @ p_ra.head) - w_rk_head).normalized(), v_rs_target)

# Right Foot: flat on ground pointing -Y
rotate_bone_by_difference(p_ra, ((arm.matrix_world @ p_rf.head) - (arm.matrix_world @ p_ra.head)).normalized(), mathutils.Vector((0, -1, 0)))

bpy.ops.object.mode_set(mode='OBJECT')

# Render Orthographic Front and Top to verify visually
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
cam_obj.location = (0, -3.0, 0.9)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
scene.render.filepath = "/tmp/perfect_front.png"
bpy.ops.render.render(write_still=True)
print("Rendered /tmp/perfect_front.png")

# Top view
cam_obj.location = (0, 0, 3.0)
cam_obj.rotation_euler = (0, 0, math.radians(-90))
scene.render.filepath = "/tmp/perfect_top.png"
bpy.ops.render.render(write_still=True)
print("Rendered /tmp/perfect_top.png")
