import math
from collections import defaultdict
from pathlib import Path
import bpy
import bmesh
from mathutils import Matrix, Vector

ROOT = Path('/home/dinatih/Projects/room-3d')
SOURCE = next((ROOT / 'public/items').glob('tillreda réfrigérateur*/*.glb'))
OUTPUT = ROOT / 'public/items/tillreda_anim/TILLREDA_anim.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
mesh = source.data
normals = [n.vector.copy() for n in mesh.corner_normals]
corners = mesh.attributes.new('source_corner', 'INT', 'CORNER')
for i, entry in enumerate(corners.data):
    entry.value = i

adjacency, seams = defaultdict(set), defaultdict(list)
for v in mesh.vertices:
    seams[tuple(round(c, 5) for c in v.co)].append(v.index)
for ids in seams.values():
    for i in ids:
        adjacency[i].update(ids)
for edge in mesh.edges:
    a, b = edge.vertices
    adjacency[a].add(b)
    adjacency[b].add(a)
remaining, parts = set(range(len(mesh.vertices))), []
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
assert len(parts) == 29, 'Source topology changed: inspect islands before rebuilding.'

def material(name, color, roughness, metalness=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metalness
    return mat

exterior = material('Black enamel', (.018, .018, .021), .3, .4)
liner = material('White interior liner', (.87, .89, .91), .38)
seal = material('Door gasket', (.035, .035, .035), .85)
chrome = material('Shelf steel', (.65, .68, .72), .25, .8)

def extract(name, indices, mat, mirror_x=False):
    keep = set().union(*(parts[i] for i in indices))
    data = mesh.copy()
    bm = bmesh.new()
    bm.from_mesh(data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    bm.to_mesh(data)
    bm.free()
    for face in data.polygons:
        face.use_smooth = True
    if mirror_x:
        for v in data.vertices:
            v.co.x = -v.co.x
        data.normals_split_custom_set([Vector((-normals[e.value].x, normals[e.value].y, normals[e.value].z)) for e in data.attributes['source_corner'].data])
        # Invert winding after mirror so normals point outward
        data.flip_normals()
    else:
        data.normals_split_custom_set([normals[e.value] for e in data.attributes['source_corner'].data])
    data.attributes.remove(data.attributes['source_corner'])
    data.transform(source.matrix_world)
    data.materials.clear()
    data.materials.append(mat)
    for face in data.polygons:
        face.material_index = 0
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj

# Door parts
door_ids = {7, 20, 28}
# Hinge hardware parts to mirror: bracket (9) and pin (11), holes (8, 23, 24)
hinge_bracket_ids = {9, 11}
holes_ids = {8, 23, 24}
# Remaining body parts (without door, removed solid proxy 21, floor 22, seal 10, bracket 9, 11, holes 8, 23, 24)
body_base_ids = set(range(29)) - door_ids - {10, 21, 22} - hinge_bracket_ids - holes_ids

body = extract('body', body_base_ids, exterior)
bracket_right = extract('hinge_bracket_right', hinge_bracket_ids, exterior, mirror_x=True)
holes_left = extract('holes_left', holes_ids, exterior, mirror_x=True)

door = extract('door_surface', door_ids, exterior)
gasket = extract('door_gasket', {10}, seal)
floor = extract('interior_floor', {22}, liner)

removed_faces = sum(p.vertices[0] in parts[21] for p in mesh.polygons)
assert removed_faces == 84

# Pin location on the RIGHT (+X)
pin = [mesh.vertices[i].co for i in parts[11]]
# Mirror X for right-hand hinge
hinge_x = -((min(v.x for v in pin) + max(v.x for v in pin)) / 2)
hinge_y = (min(v.y for v in pin) + max(v.y for v in pin)) / 2

pivot = bpy.data.objects.new('door', None)
bpy.context.collection.objects.link(pivot)
pivot.location = (hinge_x, hinge_y, 0)
pivot['removedSourceTriangles'] = removed_faces
pivot['sourceDoorIslands'] = sorted(door_ids)

for obj in [door, gasket]:
    obj.parent = pivot
    obj.matrix_parent_inverse = Matrix.Translation(-pivot.location)

def box(name, lo, hi, mat, parent=None):
    lo, hi = Vector(lo), Vector(hi)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(lo + hi) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = hi - lo
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new('Moulded edges', 'BEVEL')
    bevel.width, bevel.segments = .001, 3  # 1 mm moulded edge radius.
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = Matrix.Translation(-parent.location)
    return obj

cavity = [mesh.vertices[i].co for i in parts[21]]
lo = Vector([min(v[a] for v in cavity) for a in range(3)])
hi = Vector([max(v[a] for v in cavity) for a in range(3)])
wall = .008  # 8 mm liner inside the source insulated shell.
back = hi.y - .03  # 3 cm rear insulation.
left, right, ceiling = lo.x + wall, hi.x - wall, hi.z - wall
box('interior_left', lo, (left, hi.y, hi.z), liner)
box('interior_right', (right, lo.y, lo.z), hi, liner)
box('interior_ceiling', (left, lo.y, ceiling), (right, hi.y, hi.z), liner)
box('interior_back', (left, back, lo.z), (right, hi.y, ceiling), liner)
box('interior_door', (left + .01, -.185, lo.z + .01),
    (right - .01, -.174, ceiling - .01), liner, pivot)

motor_top, motor_front = lo.z + .12, back - .14
box('motor_casing', (left, motor_front, lo.z), (right, back, motor_top), liner)

shelf_z = motor_top + .07
shelf_front, shelf_back = lo.y + .025, back - .005
wire_radius, wire_pitch = .0015, .02
def rod(name, start, end):
    start, end = Vector(start), Vector(end)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=wire_radius,
                                      depth=(end - start).length, location=(start + end) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (end - start).to_track_quat('Z', 'Y').to_euler()
    obj.data.materials.append(chrome)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return obj

shelf = bpy.data.objects.new('shelf', None)
bpy.context.collection.objects.link(shelf)
for y in [shelf_front, shelf_back]:
    rod('shelf_crossbar', (left, y, shelf_z), (right, y, shelf_z)).parent = shelf
wire_count = math.ceil((right - left) / wire_pitch)
for i in range(wire_count + 1):
    x = left + (right - left) * i / wire_count
    rod('shelf_wire', (x, shelf_front, shelf_z), (x, shelf_back, shelf_z)).parent = shelf
for x in [left, right]:
    for y in [shelf_front, shelf_back]:
        box('shelf_support', (x - .004, y - .008, shelf_z - .01),
            (x + .004, y + .008, shelf_z - wire_radius), liner)

bpy.data.objects.remove(source, do_unlink=True)
for obj in list(bpy.context.scene.objects):
    if obj.type not in {'MESH', 'EMPTY'}:
        bpy.data.objects.remove(obj, do_unlink=True)

scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 30
pivot.rotation_euler.z = 0
pivot.keyframe_insert('rotation_euler', frame=0)
# Opening right-hinged door: rotation around +Z (positive) opens towards front-right (+X, -Y)
pivot.rotation_euler.z = math.radians(110)
pivot.keyframe_insert('rotation_euler', frame=30)
pivot.animation_data.action.name = 'door_open'
for layer in pivot.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = 'LINEAR'
scene.frame_set(0)

# Merge static meshes by material or keep them clean
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT.with_suffix('.blend')))
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', export_yup=True,
                          export_extras=True, export_animations=True,
                          export_animation_mode='ACTIONS', export_frame_range=True)
print('TILLREDA updated: right-hinged door at', tuple(pivot.location), 'bracket & holes swapped.')
