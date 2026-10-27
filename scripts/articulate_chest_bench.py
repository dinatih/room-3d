"""Articulate the captured YITAHOME chest bench with hinged lid animation.

blender -b -noaudio --python scripts/articulate_chest_bench.py
"""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artifacts/yitahome-chest-bench-100gal/yitahome-chest-bench.glb'
OUTPUT = ROOT / 'public/items/chest-bench/chest-bench-animated.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source = next(obj for obj in bpy.context.scene.objects if obj.type == 'MESH')
mesh = source.data

normals = [normal.vector.copy() for normal in mesh.corner_normals]
corners = mesh.attributes.new('source_corner', 'INT', 'CORNER')
for index, corner in enumerate(corners.data):
    corner.value = index

parent = list(range(len(mesh.vertices)))
def root(index):
    while parent[index] != index:
        parent[index] = parent[parent[index]]
        index = parent[index]
    return index

positions = {}
for vertex in mesh.vertices:
    key = tuple(round(c, 5) for c in vertex.co)
    if key in positions:
        parent[root(vertex.index)] = root(positions[key])
    positions[key] = vertex.index
for face in mesh.polygons:
    for vertex in face.vertices:
        parent[root(vertex)] = root(face.vertices[0])
components = {}
for face in mesh.polygons:
    components.setdefault(root(face.vertices[0]), []).append(face.index)

parts = {faces[0]: faces for faces in components.values()}
assert len(parts) == 34 and len(mesh.polygons) == 58564, f"Topology mismatch: {len(parts)} parts, {len(mesh.polygons)} faces"

# Lid parts: 39419 (resin lid), 21502, 0, 10751 (cushion + piping/layers)
lid_parts = {39419, 21502, 0, 10751}
assert lid_parts <= parts.keys()

def extract(name, identifiers):
    keep = {vertex for part in identifiers for face in parts[part] for vertex in mesh.polygons[face].vertices}
    data = mesh.copy()
    bm = bmesh.new()
    bm.from_mesh(data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[vertex for vertex in bm.verts if vertex.index not in keep], context='VERTS')
    bm.to_mesh(data)
    bm.free()
    for face in data.polygons:
        face.use_smooth = True
    data.normals_split_custom_set([normals[corner.value] for corner in data.attributes['source_corner'].data])
    data.attributes.remove(data.attributes['source_corner'])
    data.transform(source.matrix_world)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj

body = extract('ChestBenchBody', parts.keys() - lid_parts)
lid = extract('ChestBenchLidSurface', lid_parts)
assert len(body.data.polygons) + len(lid.data.polygons) == len(mesh.polygons)

# Calculate lid rear top boundary for hinge pivot
# Rear is at Y = max(Y) ≈ 0.2779, top of body / bottom of lid is at Z ≈ 0.584
lid_coords = [vertex.co for vertex in lid.data.vertices]
pivot_y = max(c.y for c in lid_coords)
pivot_z = min(c.z for c in lid_coords)
pivot_x = (min(c.x for c in lid_coords) + max(c.x for c in lid_coords)) / 2

pivot = bpy.data.objects.new('ChestBenchLid', None)
bpy.context.collection.objects.link(pivot)
pivot.location = Vector((pivot_x, pivot_y, pivot_z))
lid.parent = pivot
lid.matrix_parent_inverse = Matrix.Translation(-pivot.location)

for obj in list(bpy.context.scene.objects):
    if obj not in (body, lid, pivot):
        bpy.data.objects.remove(obj, do_unlink=True)

# Animation: 0 to 24 frames (0.8s at 30 fps), rotating around local X axis by ~75-80 degrees backward
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 24
pivot.keyframe_insert('rotation_euler', frame=0)
# Opening backward: rotation around X axis (pointing towards +X, right)
# In Blender coordinate system: +X right, +Y back, +Z up.
# Rotating around X: positive rotation tilts +Y towards +Z.
# To tilt the lid back, rotating around +X: lid rotates backward.
pivot.rotation_euler.x = -math.radians(75)
pivot.keyframe_insert('rotation_euler', frame=24)
pivot.animation_data.action.name = 'lid_open'

for layer in pivot.animation_data.action.layers:
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
    export_copyright='2025 (c) Amazon.com, Inc. / YITAHOME'
)
print(f'CHEST BENCH ARTICULATED: exported to {OUTPUT}, pivot at {tuple(pivot.location)}')
