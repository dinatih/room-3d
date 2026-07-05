import bpy
import sys
from mathutils import Vector

xps_path = "/home/dinatih/3D Resources/xps___tomb_raider_iv_v_remastered___lara_croft_by_henrysmodels_dj8nh4u/Lara_TRRemaster2_Classic/xps.xps"
output_path = "/home/dinatih/3D Resources/xps___tomb_raider_iv_v_remastered___lara_croft_by_henrysmodels_dj8nh4u/Lara_TRRemaster2_Classic/lara_croft_perfect_rigify.blend"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

try:
    bpy.ops.preferences.addon_enable(module="bl_ext.blender_org.io_xnalara")
except:
    pass
try:
    bpy.ops.preferences.addon_enable(module="rigify")
except:
    pass

try:
    bpy.ops.xps_tools.import_model(filepath=xps_path)
except Exception as e:
    print(f"FAILED_TO_IMPORT_XPS: {e}")
    sys.exit(1)

xps_arm = next((obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE'), None)
if not xps_arm:
    sys.exit(1)

bpy.ops.object.armature_human_metarig_add()
metarig = bpy.context.active_object
metarig.show_in_front = True

# Extract XPS Global Coordinates
bpy.context.view_layer.objects.active = xps_arm
bpy.ops.object.mode_set(mode='EDIT')
xps_gl = {}
for bone in xps_arm.data.edit_bones:
    xps_gl[bone.name] = {
        'head': xps_arm.matrix_world @ bone.head.copy(),
        'tail': xps_arm.matrix_world @ bone.tail.copy()
    }
bpy.ops.object.mode_set(mode='OBJECT')

def get_xps_head(name):
    return xps_gl[name]['head'] if name in xps_gl else None

def get_xps_tail(name):
    return xps_gl[name]['tail'] if name in xps_gl else None

# Important points
pts = {
    "spine_lower": get_xps_head("spine lower"),
    "spine_upper": get_xps_head("spine upper"),
    "neck_lower": get_xps_head("head neck lower"),
    "neck_upper": get_xps_head("head neck upper"),
    "head_top": get_xps_tail("head neck upper"),
    "eye_L": get_xps_head("head eyeball left"),
    "eye_R": get_xps_head("head eyeball right"),
    "L_hip": get_xps_head("leg left thigh"),
    "R_hip": get_xps_head("leg right thigh"),
}
pts["pelvis"] = (pts["L_hip"] + pts["R_hip"]) / 2 if (pts["L_hip"] and pts["R_hip"]) else get_xps_head("pelvis")

bpy.context.view_layer.objects.active = metarig
bpy.ops.object.mode_set(mode='EDIT')
meta_b = metarig.data.edit_bones

# Scale metarig
m_pelvis = metarig.matrix_world @ meta_b["spine"].head
m_eye_L = metarig.matrix_world @ meta_b["eye.L"].head
m_eye_R = metarig.matrix_world @ meta_b["eye.R"].head
m_eye_avg = (m_eye_L + m_eye_R) / 2
x_eye_avg = (pts["eye_L"] + pts["eye_R"]) / 2 if pts["eye_L"] and pts["eye_R"] else pts["pelvis"] + Vector((0,0,1.5))

scale_factor = (x_eye_avg.z - pts["pelvis"].z) / (m_eye_avg.z - m_pelvis.z)

bpy.ops.object.mode_set(mode='OBJECT')
metarig.scale = (scale_factor, scale_factor, scale_factor)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Translate pelvis
bpy.ops.object.mode_set(mode='EDIT')
m_pelvis_new = metarig.matrix_world @ meta_b["spine"].head
bpy.ops.object.mode_set(mode='OBJECT')

offset = pts["pelvis"] - m_pelvis_new
metarig.location = offset
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

bpy.ops.object.mode_set(mode='EDIT')

def set_gl_head(b_name, gl_pos):
    if b_name in meta_b and gl_pos:
        meta_b[b_name].head = metarig.matrix_world.inverted() @ gl_pos

def set_gl_tail(b_name, gl_pos):
    if b_name in meta_b and gl_pos:
        meta_b[b_name].tail = metarig.matrix_world.inverted() @ gl_pos

def translate_bone_tree_gl(b_name, gl_delta):
    b = meta_b.get(b_name)
    if not b: return
    bones_to_move = [b]
    def add_children(bone):
        for c in bone.children:
            bones_to_move.append(c)
            add_children(c)
    add_children(b)
    local_delta = metarig.matrix_world.inverted().to_3x3() @ gl_delta
    new_heads = {bone.name: bone.head + local_delta for bone in bones_to_move}
    new_tails = {bone.name: bone.tail + local_delta for bone in bones_to_move}
    for bone in bones_to_move:
        bone.head = new_heads[bone.name]
        bone.tail = new_tails[bone.name]


# LEGS ALIGNMENT
for side, char in [("L", "left"), ("R", "right")]:
    hip = get_xps_head(f"leg {char} thigh")
    knee = get_xps_head(f"leg {char} knee")
    ankle = get_xps_head(f"leg {char} ankle")
    
    if hip and knee and ankle:
        ankle.y += 0.035 
        
        set_gl_head(f"thigh.{side}", hip)
        set_gl_tail(f"thigh.{side}", knee)
        set_gl_head(f"shin.{side}", knee)
        set_gl_tail(f"shin.{side}", ankle)
        
        foot_tail = get_xps_head(f"leg {char} toes")
        if foot_tail:
            set_gl_head(f"foot.{side}", ankle)
            set_gl_tail(f"foot.{side}", foot_tail)
            
            set_gl_head(f"toe.{side}", foot_tail)
            toe_tail_pos = foot_tail.copy()
            toe_tail_pos.y -= 0.08  
            toe_tail_pos.z += 0.04 
            set_gl_tail(f"toe.{side}", toe_tail_pos)
            
            if f"heel.02.{side}" in meta_b:
                heel_head = foot_tail.copy()
                heel_head.y = ankle.y + 0.03 
                heel_head.z = foot_tail.z 
                set_gl_head(f"heel.02.{side}", heel_head)
                heel_tail = heel_head.copy()
                heel_tail.x += (0.03 if side == "L" else -0.03)
                set_gl_tail(f"heel.02.{side}", heel_tail)


# SPINE ALIGNMENT
if pts["spine_lower"] and pts["spine_upper"]:
    set_gl_head("spine", pts["pelvis"])
    set_gl_tail("spine", pts["spine_lower"])
    
    set_gl_head("spine.001", pts["spine_lower"])
    mid_spine = (pts["spine_lower"] + pts["spine_upper"]) / 2
    set_gl_tail("spine.001", mid_spine)
    
    set_gl_head("spine.002", mid_spine)
    set_gl_tail("spine.002", pts["spine_upper"])
    
    set_gl_head("spine.003", pts["spine_upper"])
    set_gl_tail("spine.003", pts["neck_lower"])
    
    # SPINE 6 AND FACE UNIFICATION (V10)
    curr_meta_eye = metarig.matrix_world @ ((meta_b["eye.L"].head + meta_b["eye.R"].head) / 2)
    face_offset = x_eye_avg - curr_meta_eye
    
    # V10: Reduced head_shift from 0.015 to 0.005 because 0.015 was 1cm too far back!
    head_shift = Vector((0, 0.005, 0))
    total_face_shift = face_offset + head_shift
    
    translate_bone_tree_gl("spine.006", total_face_shift)
    
    new_head_base = metarig.matrix_world @ meta_b["spine.006"].head
    neck_lower = pts["neck_lower"]
    mid_neck = (neck_lower + new_head_base) / 2
    
    set_gl_head("spine.004", neck_lower)
    set_gl_tail("spine.004", mid_neck)
    
    set_gl_head("spine.005", mid_neck)
    set_gl_tail("spine.005", new_head_base)


# ARMS ALIGNMENT
for side, char in [("L", "left"), ("R", "right")]:
    shoulder_joint = get_xps_head(f"arm {char} shoulder 2")
    elbow_joint = get_xps_head(f"arm {char} elbow")
    wrist_joint = get_xps_head(f"arm {char} wrist")
    knuckles = get_xps_tail(f"arm {char} wrist")
    
    if shoulder_joint and elbow_joint and wrist_joint:
        # V10: Clavicle head moved to manubrium (front of the chest, slightly outwards and downwards)
        clav_head = pts["neck_lower"].copy()
        clav_head.x += 0.02 * (1 if side == "L" else -1) # 2cm outward
        clav_head.y -= 0.03 # 3cm forward (front of the chest)
        clav_head.z -= 0.02 # 2cm below neck lower
        
        set_gl_head(f"shoulder.{side}", clav_head)
        set_gl_tail(f"shoulder.{side}", shoulder_joint)
        
        set_gl_head(f"upper_arm.{side}", shoulder_joint)
        set_gl_tail(f"upper_arm.{side}", elbow_joint)
        set_gl_head(f"forearm.{side}", elbow_joint)
        set_gl_tail(f"forearm.{side}", wrist_joint)
        set_gl_head(f"hand.{side}", wrist_joint)
        set_gl_tail(f"hand.{side}", knuckles)
        
        # Palms
        for idx, p_name in enumerate(["palm.01", "palm.02", "palm.03", "palm.04"]):
            f_base = get_xps_head(f"arm {char} finger {idx+2}a")
            if f_base:
                set_gl_head(f"{p_name}.{side}", wrist_joint)
                set_gl_tail(f"{p_name}.{side}", f_base)


# FINGERS EXACT MATCH
finger_map = {
    "thumb.01.L": "arm left finger 1a", "thumb.02.L": "arm left finger 1b", "thumb.03.L": "arm left finger 1c",
    "f_index.01.L": "arm left finger 2a", "f_index.02.L": "arm left finger 2b", "f_index.03.L": "arm left finger 2c",
    "f_middle.01.L": "arm left finger 3a", "f_middle.02.L": "arm left finger 3b", "f_middle.03.L": "arm left finger 3c",
    "f_ring.01.L": "arm left finger 4a", "f_ring.02.L": "arm left finger 4b", "f_ring.03.L": "arm left finger 4c",
    "f_pinky.01.L": "arm left finger 5a", "f_pinky.02.L": "arm left finger 5b", "f_pinky.03.L": "arm left finger 5c",
    "thumb.01.R": "arm right finger 1a", "thumb.02.R": "arm right finger 1b", "thumb.03.R": "arm right finger 1c",
    "f_index.01.R": "arm right finger 2a", "f_index.02.R": "arm right finger 2b", "f_index.03.R": "arm right finger 2c",
    "f_middle.01.R": "arm right finger 3a", "f_middle.02.R": "arm right finger 3b", "f_middle.03.R": "arm right finger 3c",
    "f_ring.01.R": "arm right finger 4a", "f_ring.02.R": "arm right finger 4b", "f_ring.03.R": "arm right finger 4c",
    "f_pinky.01.R": "arm right finger 5a", "f_pinky.02.R": "arm right finger 5b", "f_pinky.03.R": "arm right finger 5c"
}
for meta_name, xps_name in finger_map.items():
    if meta_name in meta_b:
        gl_h = get_xps_head(xps_name)
        gl_t = get_xps_tail(xps_name)
        if gl_h and gl_t:
            set_gl_head(meta_name, gl_h)
            set_gl_tail(meta_name, gl_t)


bpy.ops.object.mode_set(mode='OBJECT')
bpy.data.objects.remove(xps_arm, do_unlink=True)

for ws in bpy.data.workspaces:
    for screen in ws.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'MATERIAL'
                        if space.region_3d:
                            space.region_3d.view_distance = 2.5
                            space.region_3d.view_location = (0.0, 0.0, 0.9)

bpy.ops.wm.save_as_mainfile(filepath=output_path)
print("SUCCESS_ALIGNMENT_V10")
