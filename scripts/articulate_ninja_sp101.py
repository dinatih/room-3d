"""Split the captured Ninja's existing parts and bake its door/rack clips.

blender -b -noaudio --python scripts/articulate_ninja_sp101.py
"""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/items/ninja-sp101/ninja-sp101-animated.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'artifacts/ninja-foodi-sp101eu/ninja-foodi-sp101eu.glb'))
source = next(obj for obj in bpy.context.scene.objects if obj.type == 'MESH')
mesh = source.data
normals = [normal.vector.copy() for normal in mesh.corner_normals]
corners = mesh.attributes.new('source_corner', 'INT', 'CORNER')
for index, corner in enumerate(corners.data):
    corner.value = index

# Join UV/normal seams by identical positions without welding the source mesh.
parent = list(range(len(mesh.vertices)))
def root(index):
    while parent[index] != index:
        parent[index] = parent[parent[index]]
        index = parent[index]
    return index

positions = {}
for vertex in mesh.vertices:
    key = tuple(vertex.co)
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
assert len(parts) == 44 and len(mesh.polygons) == 76434, 'Source topology changed: inspect before articulating.'

# First-face identifiers of complete islands in the captured source: frame,
# glazing, handle, caps, hinge; then the tray and its 24 separate wire/rail parts.
door_parts = {0, 219, 9967, 24551, 48703, 70583, 70775, 76338}
rack_parts = {22664, *range(23687, 24551, 36)}
assert door_parts | rack_parts <= parts.keys()

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

body = extract('NinjaBody', parts.keys() - door_parts - rack_parts)
door = extract('NinjaDoorSurface', door_parts)
rack = extract('NinjaRack', rack_parts)
assert sum(len(obj.data.polygons) for obj in (body, door, rack)) == len(mesh.polygons)

def bounds(coordinates):
    return (Vector([min(p[axis] for p in coordinates) for axis in range(3)]),
            Vector([max(p[axis] for p in coordinates) for axis in range(3)]))

def part_bounds(identifier):
    return bounds([source.matrix_world @ mesh.vertices[index].co
                   for face in parts[identifier] for index in mesh.polygons[face].vertices])

hinge_min, hinge_max = part_bounds(0)
pivot = bpy.data.objects.new('NinjaDoor', None)
bpy.context.collection.objects.link(pivot)
pivot.location = (hinge_min + hinge_max) / 2
door.parent = pivot
door.matrix_parent_inverse = Matrix.Translation(-pivot.location)

cavity_min, cavity_max = part_bounds(29627)
anchor = bpy.data.objects.new('NinjaLampAnchor', None)
bpy.context.collection.objects.link(anchor)
anchor.location = ((cavity_max.x - 0.006), (cavity_min.y + cavity_max.y) / 2, cavity_max.z - 0.02)
anchor['lumens'] = 90
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.0025, location=anchor.location)
bulb = bpy.context.object
bulb.name = 'NinjaLampBulb'
material = bpy.data.materials.new('NinjaLamp')
material.diffuse_color = (1, 0.9, 0.7, 1)
bulb.data.materials.append(material)
for obj in list(bpy.context.scene.objects):
    if obj not in (body, door, rack, pivot, anchor, bulb):
        bpy.data.objects.remove(obj, do_unlink=True)

scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 24
pivot.keyframe_insert('rotation_euler', frame=0)
pivot.rotation_euler.x = math.pi / 2
pivot.keyframe_insert('rotation_euler', frame=24)
pivot.animation_data.action.name = 'door_open'
rack.keyframe_insert('location', frame=0)
rack_min, rack_max = bounds([vertex.co for vertex in rack.data.vertices])
rack.location.y = -(rack_max.y - rack_min.y - 0.07)  # Keep 7 cm engaged on the runners.
rack.keyframe_insert('location', frame=24)
rack.animation_data.action.name = 'rack_slide'
for obj in (pivot, rack):
    for layer in obj.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'
scene.frame_set(0)
bpy.ops.file.pack_all()
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', export_extras=True,
                          export_animations=True, export_animation_mode='ACTIONS', export_frame_range=True,
                          export_copyright='2025 (c) Amazon.com, Inc.')
print('NINJA: source faces preserved, door hinge', tuple(pivot.location), 'rack travel', rack_max.y - rack_min.y - 0.07)
