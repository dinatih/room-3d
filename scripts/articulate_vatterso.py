"""Articulate IKEA VÄTTERSÖ outdoor storage box (20562909) with rolling fabric flap animation.

blender -b -noaudio --python scripts/articulate_vatterso.py
"""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/items/vatterso20562909/Vatterso20562909.glb'
OUTPUT = ROOT / 'public/items/vatterso20562909/vatterso-animated.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source = next(obj for obj in bpy.context.scene.objects if obj.type == 'MESH')
mesh = source.data

plane_co = Vector((0.0, 0.0, 0.705))
plane_no = Vector((0.0, -0.181, 1.0)).normalized()
slope = -plane_no.y / plane_no.z

# 1. Structure & Body (Everything below the cut plane + interior hollow cavity & top rim)
bm_body = bmesh.new()
bm_body.from_mesh(mesh)
bmesh.ops.bisect_plane(
    bm_body,
    geom=bm_body.faces[:] + bm_body.edges[:] + bm_body.verts[:],
    plane_co=plane_co,
    plane_no=plane_no,
    clear_inner=False,
    clear_outer=True
)

# Interior cavity of the storage box
cx0, cx1 = -0.73, 0.73
cy0, cy1 = -0.31, 0.31
cz_floor = 0.06

f1 = bm_body.verts.new(Vector((cx0, cy0, cz_floor)))
f2 = bm_body.verts.new(Vector((cx1, cy0, cz_floor)))
f3 = bm_body.verts.new(Vector((cx1, cy1, cz_floor)))
f4 = bm_body.verts.new(Vector((cx0, cy1, cz_floor)))
bm_body.faces.new([f1, f2, f3, f4]) # Floor (normal up)

r1 = bm_body.verts.new(Vector((cx0, cy0, plane_co.z + slope * cy0)))
r2 = bm_body.verts.new(Vector((cx1, cy0, plane_co.z + slope * cy0)))
r3 = bm_body.verts.new(Vector((cx1, cy1, plane_co.z + slope * cy1)))
r4 = bm_body.verts.new(Vector((cx0, cy1, plane_co.z + slope * cy1)))

# Walls (facing inwards)
bm_body.faces.new([f1, r1, r2, f2])
bm_body.faces.new([f2, r2, r3, f3])
bm_body.faces.new([f3, r3, r4, f4])
bm_body.faces.new([f4, r4, r1, f1])

# Rim frame between outer fabric/mesh and interior cavity
ox0, ox1 = -0.775, 0.775
oy0, oy1 = -0.355, 0.355
o1 = bm_body.verts.new(Vector((ox0, oy0, plane_co.z + slope * oy0)))
o2 = bm_body.verts.new(Vector((ox1, oy0, plane_co.z + slope * oy0)))
o3 = bm_body.verts.new(Vector((ox1, oy1, plane_co.z + slope * oy1)))
o4 = bm_body.verts.new(Vector((ox0, oy1, plane_co.z + slope * oy1)))

bm_body.faces.new([o1, o2, r2, r1])
bm_body.faces.new([o2, o3, r3, r2])
bm_body.faces.new([o3, o4, r4, r3])
bm_body.faces.new([o4, o1, r1, r4])

body_mesh = bpy.data.meshes.new('VattersoBody')
bm_body.to_mesh(body_mesh)
bm_body.free()
for mat in mesh.materials:
    body_mesh.materials.append(mat)
body_obj = bpy.data.objects.new('VattersoBody', body_mesh)
bpy.context.collection.objects.link(body_obj)

# 2. Fabric Cover (The upper part of the model above the cut plane)
bm_flap = bmesh.new()
bm_flap.from_mesh(mesh)
bmesh.ops.bisect_plane(
    bm_flap,
    geom=bm_flap.faces[:] + bm_flap.edges[:] + bm_flap.verts[:],
    plane_co=plane_co,
    plane_no=plane_no,
    clear_inner=True,
    clear_outer=False
)

flap_mesh = bpy.data.meshes.new('VattersoFabricFlap')
bm_flap.to_mesh(flap_mesh)
bm_flap.free()
for mat in mesh.materials:
    flap_mesh.materials.append(mat)
flap_obj = bpy.data.objects.new('VattersoFabricFlap', flap_mesh)
bpy.context.collection.objects.link(flap_obj)

# Remove source object
bpy.data.objects.remove(source, do_unlink=True)

# 3. Create Armature / Rig with Bones to roll the fabric up to the back
# The top flap runs from Y ~ -0.36 to Y ~ +0.35.
# We create 6 sequential bones along Y from back to front:
# Bone 1 (fixed / rear anchor at Y=0.34, Z=0.767)
# Bone 2, 3, 4, 5, 6 curl progressively backwards and upwards into a roll.
armature_data = bpy.data.armatures.new('VattersoArmature')
armature_obj = bpy.data.objects.new('VattersoArmature', armature_data)
bpy.context.collection.objects.link(armature_obj)

bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.mode_set(mode='EDIT')

num_segments = 6
y_start = 0.35
y_end = -0.36
bones = []

for i in range(num_segments):
    b = armature_data.edit_bones.new(f'FlapBone_{i}')
    t0 = i / num_segments
    t1 = (i + 1) / num_segments
    y0 = y_start + t0 * (y_end - y_start)
    y1 = y_start + t1 * (y_end - y_start)
    z0 = plane_co.z + slope * y0 + 0.015
    z1 = plane_co.z + slope * y1 + 0.015
    b.head = Vector((0.0, y0, z0))
    b.tail = Vector((0.0, y1, z1))
    if i > 0:
        b.parent = bones[i - 1]
        b.use_connect = True
    bones.append(b)

bpy.ops.object.mode_set(mode='OBJECT')

# Add Armature modifier to flap_obj and assign vertex weights by Y coordinate
mod = flap_obj.modifiers.new(name='Armature', type='ARMATURE')
mod.object = armature_obj

# Vertex groups for each bone
vg_list = [flap_obj.vertex_groups.new(name=f'FlapBone_{i}') for i in range(num_segments)]

for vert in flap_mesh.vertices:
    y = vert.co.y
    t = (y_start - y) / (y_start - y_end)
    t = max(0.0, min(1.0, t))
    seg = t * num_segments
    idx = int(seg)
    idx = min(idx, num_segments - 1)
    frac = seg - idx
    if idx < num_segments - 1:
        vg_list[idx].add([vert.index], 1.0 - frac, 'REPLACE')
        vg_list[idx + 1].add([vert.index], frac, 'REPLACE')
    else:
        vg_list[idx].add([vert.index], 1.0, 'REPLACE')

flap_obj.parent = armature_obj

# 4. Animate the rolling of the bones (Curl each bone up and backward)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 24

armature_obj.animation_data_create()
action = bpy.data.actions.new(name='lid_open')
armature_obj.animation_data.action = action

# Frame 0: closed (flat)
scene.frame_set(0)
for i in range(1, num_segments):
    pbone = armature_obj.pose.bones[f'FlapBone_{i}']
    pbone.rotation_mode = 'XYZ'
    pbone.rotation_euler = (0, 0, 0)
    pbone.keyframe_insert('rotation_euler', frame=0)

# Frame 24: rolled up to the top rear bar
scene.frame_set(24)
for i in range(1, num_segments):
    pbone = armature_obj.pose.bones[f'FlapBone_{i}']
    # Progressive curling upwards and into a tight coil
    # Each segment rotates ~65-75 degrees around local X axis
    curl_angle = math.radians(68)
    pbone.rotation_euler = (-curl_angle, 0, 0)
    pbone.keyframe_insert('rotation_euler', frame=24)

# Set Bezier interpolation
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = 'BEZIER'

scene.frame_set(0)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format='GLB',
    export_extras=True,
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_frame_range=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_skins=True,
    export_all_influences=True,
    export_copyright='2025 (c) IKEA / VÄTTERSÖ'
)
print(f"VATTERSO ROLLED ARTICULATION EXPORTED: {OUTPUT}")
