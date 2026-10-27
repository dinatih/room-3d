"""Articulate the captured YITAHOME chest bench with hollow cavity and hinged lid animation.

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

# Hollow cavity is island 56817 (108 faces).
# The top cap/bevel faces (min_z > 0.58) are removed and the 66 cavity wall/floor faces are flipped inward.
cavity_island = parts[56817]
cavity_top_faces = {p for p in cavity_island if min(mesh.vertices[i].co.z for i in mesh.polygons[p].vertices) > 0.58}
assert len(cavity_top_faces) == 42, f"Unexpected cavity top faces count: {len(cavity_top_faces)}"

def extract_body(name, identifiers):
    keep = {vertex for part in identifiers for face in parts[part] for vertex in mesh.polygons[face].vertices}
    data = mesh.copy()
    bm = bmesh.new()
    bm.from_mesh(data)
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[vertex for vertex in bm.verts if vertex.index not in keep], context='VERTS')
    bm.faces.ensure_lookup_table()

    # Flip the 66 cavity wall/floor faces and remove all top cap and bevel faces (min_z > 0.58)
    cavity_bm_faces = [f for f in bm.faces if -0.57 < f.calc_center_median().x < 0.58 and -0.24 < f.calc_center_median().y < 0.25 and 0.03 < f.calc_center_median().z < 0.59]
    top_faces = [f for f in cavity_bm_faces if min(v.co.z for v in f.verts) > 0.58]
    for f in cavity_bm_faces:
        if f not in top_faces:
            f.normal_flip()
    bmesh.ops.delete(bm, geom=top_faces, context='FACES')

    bm.to_mesh(data)
    bm.free()
    for face in data.polygons:
        face.use_smooth = True
    data.transform(source.matrix_world)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj

def extract_lid(name, identifiers):
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

body = extract_body('ChestBenchBody', parts.keys() - lid_parts)
lid = extract_lid('ChestBenchLidSurface', lid_parts)

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

scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 24
pivot.keyframe_insert('rotation_euler', frame=0)
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
print(f'HOLLOW CHEST BENCH ARTICULATED: exported to {OUTPUT}')
