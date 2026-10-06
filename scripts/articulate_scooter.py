"""Inspect or articulate the source scooter with Blender's Python interpreter."""
import bpy
import json
import sys
import math
import re
import numpy as np
from pathlib import Path
from mathutils import Vector, Quaternion, kdtree

SOURCE = Path('/home/dinatih/3D Resources/e-scooter/source/xiaomi-electric-scooter-4')
ROOT = Path(__file__).resolve().parents[1]

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(SOURCE / 'source/Xiaomi Electric Scooter 4.fbx'))
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')
parts = sorted((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: int(o.name.rsplit('.', 1)[-1]) if '.' in o.name else 0)
report = []
for i, obj in enumerate(parts):
    points = [obj.matrix_world @ v.co for v in obj.data.vertices]
    lo = Vector([min(p[a] for p in points) for a in range(3)])
    hi = Vector([max(p[a] for p in points) for a in range(3)])
    report.append({'id': i, 'vertices': len(points), 'min': list(lo), 'max': list(hi), 'materials': sorted({obj.data.materials[p.material_index].name for p in obj.data.polygons})})
if '--build' not in sys.argv:
    print('PARTS', json.dumps([r for r in report if r['materials']]))
    sys.exit(0)

# Connected islands of this FBX, identified from their geometry. The otherwise
# unreferenced vertices 8..151 belong to the front wheel and are preserved too.
front_ids = {0, 1, 2, 3, 7, 152, 154, 161, 164, 165, 169, 170, 171,
             178, 180, 181, 182, 183, 184, 187} | set(range(8, 152))
assert len(parts) == 191, 'Source topology changed; inspect before separating.'
original_faces = sum(len(o.data.polygons) for o in parts)
original_points = [o.matrix_world @ v.co for o in parts for v in o.data.vertices]

# Fit the column between the top of the fixed neck and the handlebar crossbar.
# These boundaries come from the adjacent parts, rather than a spatial cutoff.
stem = parts[2]
lower = report[4]['max'][2]
upper = report[152]['min'][2]
column = np.array([list(stem.matrix_world @ v.co) for v in stem.data.vertices
                   if lower < (stem.matrix_world @ v.co).z < upper])
center = column.mean(axis=0)
_, _, axes = np.linalg.svd(column - center)
axis = Vector(axes[0])
if axis.z < 0:
    axis.negate()
pivot_position = Vector(center) + axis * ((lower - center[2]) / axis.z)

def join(indices, name):
    bpy.ops.object.select_all(action='DESELECT')
    selected = [parts[i] for i in indices]
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = selected[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    return obj

front = join(sorted(front_ids), 'SteeringAssembly')
body = join([i for i in range(len(parts)) if i not in front_ids], 'ScooterBody')
assert len(front.data.polygons) + len(body.data.polygons) == original_faces
assert len(front.data.vertices) + len(body.data.vertices) == len(original_points)

root = bpy.data.objects.new('Scooter', None)
bpy.context.collection.objects.link(root)
pivot = bpy.data.objects.new('SteeringPivot', None)
bpy.context.collection.objects.link(pivot)
pivot.parent = root
pivot.location = pivot_position
pivot.rotation_mode = 'QUATERNION'
# Local Y remains the steering axis in both Blender and glTF.
pivot.rotation_quaternion = Vector((0, 1, 0)).rotation_difference(axis)
pivot.empty_display_type = 'ARROWS'
pivot.empty_display_size = 0.15
bpy.context.view_layer.update()
for obj, parent in [(body, root), (front, pivot)]:
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world
bpy.context.view_layer.update()

# Reuse the existing GLB's PBR materials to retain its appearance exactly.
old_objects = set(bpy.data.objects)
old_materials = set(bpy.data.materials)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/items/xiaomi-scooter4/xiaomi-scooter4.glb'))
material_map = {}
for material in set(bpy.data.materials) - old_materials:
    name = re.sub(r'\.\d+$', '', material.name).replace('_', ' ')
    # The original Sketchfab GLB names its red cable material "material".
    material_map['Red' if name == 'material' else name] = material
for obj in [body, front]:
    for slot in obj.material_slots:
        source_name = slot.material.name
        slot.material = material_map[source_name]
for obj in set(bpy.data.objects) - old_objects:
    bpy.data.objects.remove(obj, do_unlink=True)
for image in bpy.data.images:
    if image.source == 'FILE' and not image.packed_file:
        texture = SOURCE / 'textures' / Path(image.filepath.replace('\\', '/')).name
        if texture.exists():
            image.filepath = str(texture)
bpy.ops.file.pack_all()

# Validate unchanged positions and rotation about the actual local axis.
zero_positions = {obj.name: [obj.matrix_world @ v.co for v in obj.data.vertices] for obj in [body, front]}
original_tree = kdtree.KDTree(len(original_points))
for i, point in enumerate(original_points):
    original_tree.insert(point, i)
original_tree.balance()
assert max(original_tree.find(p)[2] for points in zero_positions.values() for p in points) < 1e-6, 'Separation moved source vertices.'
rest = pivot.rotation_quaternion.copy()
for angle in [-math.pi / 6, math.pi / 6, 0]:
    pivot.rotation_quaternion = rest @ Quaternion((0, 1, 0), angle)
    bpy.context.view_layer.update()
    assert all((body.matrix_world @ v.co - p).length < 1e-6 for v, p in zip(body.data.vertices, zero_positions[body.name]))
    if angle:
        assert any((front.matrix_world @ v.co - p).length > 0.01 for v, p in zip(front.data.vertices, zero_positions[front.name]))
    else:
        assert all((front.matrix_world @ v.co - p).length < 1e-6 for v, p in zip(front.data.vertices, zero_positions[front.name]))

bpy.ops.object.select_all(action='DESELECT')
for obj in [root, pivot, body, front]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = pivot
bpy.ops.wm.save_as_mainfile(filepath='/tmp/e-scooter-steering.blend')
output = ROOT / 'public/items/xiaomi-scooter4/xiaomi-scooter4.glb'
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True, export_yup=True, export_extras=True)
print('ARTICULATED', json.dumps({'pivot': list(pivot_position), 'axis': list(axis), 'faces': original_faces, 'vertices': len(original_points)}))

# Render a comparison sheet from the exported GLB, also testing its hierarchy.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(output))
pivot = bpy.data.objects['SteeringPivot']
pivot.rotation_mode = 'QUATERNION'
assert bpy.data.objects['SteeringAssembly'].parent == pivot
assert bpy.data.objects['ScooterBody'].parent != pivot
rest = pivot.rotation_quaternion.copy()
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.world.color = (0.4, 0.4, 0.4)
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
bpy.ops.object.camera_add(location=(2.2, -2.8, 1.8))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 1.65
scene.camera = camera
for location, power in [((2, -2, 3), 500), ((-2, 1, 2), 350)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = 3
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
for degrees in [0, -30, 30]:
    pivot.rotation_quaternion = rest @ Quaternion((0, 1, 0), math.radians(degrees))
    scene.render.filepath = f'/tmp/scooter-steering-{degrees}.png'
    bpy.ops.render.render(write_still=True)
