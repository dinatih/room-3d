"""Rebuild LAGAN from its untouched IKEA GLB: blender -b --python scripts/articulate_lagan.py."""
import bpy
import bmesh
import math
import copy
import json
import struct
from collections import defaultdict
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = next((ROOT / 'public/items').glob('lagan réfrigérateur*/*.glb'))
OUTPUT = ROOT / 'public/items/lagan_anim/LAGAN_anim.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
mesh = source.data
for material in mesh.materials:
    # IKEA's closed-model optimisation leaves single-sided interior panels.
    # Show their reverse faces now that the door can expose the interior.
    material.use_backface_culling = False
adjacency = defaultdict(set)
seams = defaultdict(list)
for v in mesh.vertices:
    seams[tuple(round(c, 5) for c in v.co)].append(v.index)
for ids in seams.values():
    for i in ids:
        adjacency[i].update(ids)
for edge in mesh.edges:
    a, b = edge.vertices
    adjacency[a].add(b)
    adjacency[b].add(a)
remaining = set(range(len(mesh.vertices)))
parts = []
while remaining:
    todo, ids = [min(remaining)], set()
    while todo:
        i = todo.pop()
        if i in ids:
            continue
        ids.add(i)
        todo.extend(adjacency[i] - ids)
    remaining -= ids
    parts.append(ids)
assert len(parts) == 52, 'IKEA topology changed: inspect components before rebuilding.'

# Complete connected islands, inspected with temp_inspect_lagan.py. No clipping
# planes or face-centroid cuts: UV seams remain separate in the exported mesh.
door_ids = {5, 16, 26, 28, 29, 42, 43, 44}
crisper_ids = {41, 49}
lamp_ids = {48}
body_ids = set(range(len(parts))) - door_ids - crisper_ids - lamp_ids

def extract(name, indices):
    keep = set().union(*(parts[i] for i in indices))
    data = mesh.copy()
    bm = bmesh.new()
    bm.from_mesh(data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    bm.to_mesh(data)
    bm.free()
    data.transform(source.matrix_world)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj

body = extract('body', body_ids)
door = extract('door_surface', door_ids - {42, 43, 44})
bins = [extract(f'door_bin_{i+1}', {part}) for i, part in enumerate([43, 44, 42])]
crisper = extract('crisper', crisper_ids)
lamp = extract('lamp', lamp_ids)
objects = [body, door, *bins, crisper, lamp]
assert sum(len(o.data.polygons) for o in objects) == len(mesh.polygons)
assert sum(len(o.data.vertices) for o in objects) == len(mesh.vertices)
bpy.data.objects.remove(source, do_unlink=True)
for obj in list(bpy.context.scene.objects):
    if obj not in objects:
        bpy.data.objects.remove(obj, do_unlink=True)

# Right-hand hinge viewed from the source front (Blender -Y, glTF +Z).
# Axis runs through the top hinge pin (source component 8).
hardware = [mesh.vertices[i].co for i in parts[8]]
hinge_x = (min(v.x for v in hardware) + max(v.x for v in hardware)) / 2
# Hinge depth follows the fixed top hinge pin rather than the door's outer skin.
hinge_y = (min(v.y for v in hardware) + max(v.y for v in hardware)) / 2
pivot = bpy.data.objects.new('door', None)
bpy.context.collection.objects.link(pivot)
pivot.location = (hinge_x, hinge_y, 0)
for obj in [door, *bins]:
    obj.parent = pivot
    obj.matrix_parent_inverse = Matrix.Translation(-pivot.location)

anchor = bpy.data.objects.new('LampAnchor', None)
bpy.context.collection.objects.link(anchor)
lamp_lo = Vector([min(v.co[a] for v in lamp.data.vertices) for a in range(3)])
lamp_hi = Vector([max(v.co[a] for v in lamp.data.vertices) for a in range(3)])
anchor.location = (lamp_lo + lamp_hi) / 2
# Put the point source just inside the housing, on its inward (-X) face.
anchor.location.x = lamp_lo.x - (lamp_hi.x - lamp_lo.x)
anchor['powerWatts'] = 5.0  # Small refrigerator bulb, model units are metres.

scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 30
pivot.rotation_euler.z = 0
pivot.keyframe_insert('rotation_euler', frame=0)
# Find the angle at which every balcony clears the drawer's right edge.
# At 90 degrees the deep lower balcony otherwise intersects the sliding bin.
drawer_right = max(v.co.x for v in crisper.data.vertices)
def clears_drawer(angle):
    return min(hinge_x + math.cos(angle) * (v.co.x - hinge_x)
               - math.sin(angle) * (v.co.y - hinge_y)
               for bin_obj in bins for v in bin_obj.data.vertices) >= drawer_right
low, high = math.pi / 2, math.pi
assert clears_drawer(high), 'Door balconies cannot clear the drawer.'
while high - low > 1e-6:  # Angular numerical precision, not a geometry cutoff.
    middle = (low + high) / 2
    if clears_drawer(middle):
        high = middle
    else:
        low = middle
pivot.rotation_euler.z = high
pivot.keyframe_insert('rotation_euler', frame=30)
pivot.animation_data.action.name = 'door_open'
depth = max(v.co.y for v in crisper.data.vertices) - min(v.co.y for v in crisper.data.vertices)
crisper.location.y = 0
crisper.keyframe_insert('location', frame=0)
crisper.location.y = -depth
crisper.keyframe_insert('location', frame=30)
crisper.animation_data.action.name = 'crisper_slide'
for obj in [pivot, crisper]:
    action = obj.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'
scene.frame_set(0)
bpy.ops.file.pack_all()
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT.with_suffix('.blend')))
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', export_yup=True,
                          export_extras=True, export_animations=True,
                          export_animation_mode='ACTIONS', export_frame_range=True)

# Blender's glTF round-trip can repack the IKEA channel textures differently.
# Restore the original PBR definitions and JPEG bytes exactly, compacting out
# the exported images while retaining the new geometry and animation buffers.
def read_glb(path):
    data = path.read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + size]), data[28 + size:]

original, original_binary = read_glb(SOURCE)
exported, exported_binary = read_glb(OUTPUT)
old_images = {i['bufferView'] for i in exported['images']}
views, binary, mapping = [], bytearray(), {}
def append_view(view, data):
    while len(binary) % 4:
        binary.append(0)
    result = dict(view, buffer=0, byteOffset=len(binary))
    binary.extend(data)
    views.append(result)
    return len(views) - 1

for index, view in enumerate(exported['bufferViews']):
    if index in old_images:
        continue
    start = view.get('byteOffset', 0)
    mapping[index] = append_view(view, exported_binary[start:start + view['byteLength']])
for accessor in exported['accessors']:
    if 'bufferView' in accessor:
        accessor['bufferView'] = mapping[accessor['bufferView']]
exported['images'] = copy.deepcopy(original['images'])
for image in exported['images']:
    view = original['bufferViews'][image['bufferView']]
    start = view.get('byteOffset', 0)
    image['bufferView'] = append_view(view, original_binary[start:start + view['byteLength']])
assert [m['name'] for m in exported['materials']] == [m['name'] for m in original['materials']]
for key in ['materials', 'textures', 'samplers']:
    exported[key] = copy.deepcopy(original[key])
for material in exported['materials']:
    material['doubleSided'] = True
exported['bufferViews'] = views
while len(binary) % 4:
    binary.append(0)
exported['buffers'] = [{'byteLength': len(binary)}]
encoded = json.dumps(exported, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
OUTPUT.write_bytes(struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(binary))
                   + struct.pack('<I4s', len(encoded), b'JSON') + encoded
                   + struct.pack('<I4s', len(binary), b'BIN\0') + binary)
print('LAGAN: preserved', sum(len(o.data.polygons) for o in objects), 'faces;',
      'right hinge', tuple(pivot.location), 'opening degrees', math.degrees(high),
      'drawer travel', depth)
