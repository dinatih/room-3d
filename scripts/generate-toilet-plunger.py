"""Convert the supplied Assem002.STL plunger to GLB with a red handle.

Run: blender -b --python-exit-code 1 --python scripts/generate-toilet-plunger.py
Optional source override: append -- /absolute/path/Assem002.STL
Source is millimetres with Y up. GLB uses metres, Y up, base at zero.
"""
from pathlib import Path
import math
import sys
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/items/toilet-plunger'
SOURCE = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else Path.home() / '3D Resources/others furniture/Assem002.STL'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    return mat


rubber = material('Black flexible rubber', (.009, .011, .012), .62)
red = material('Red moulded ergonomic handle', (.44, .009, .015), .27)
bpy.ops.wm.stl_import(filepath=str(SOURCE))
source = bpy.context.object
source.data.transform(Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Scale(.001, 4))
vertices = [v.co for v in source.data.vertices]
minimum = Vector(tuple(min(v[a] for v in vertices) for a in range(3)))
maximum = Vector(tuple(max(v[a] for v in vertices) for a in range(3)))
source.data.transform(Matrix.Translation(Vector((-(minimum.x + maximum.x) / 2, -(minimum.y + maximum.y) / 2, -minimum.z))))
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')
parts = sorted(bpy.context.scene.objects, key=lambda obj: min(v.co.z for v in obj.data.vertices))
if len(parts) != 2:
    raise ValueError(f'Expected cup and handle in Assem002.STL, found {len(parts)} components')
for obj, name, mat in zip(parts, ('Original STL rubber cup', 'Original STL red handle'), (rubber, red)):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT / 'ToiletPlunger.glb'), export_format='GLB', use_selection=True)
print('SOURCE DIMENSIONS CM:', tuple((maximum - minimum) * 100), flush=True)


def rounded_box(name, dimensions, position, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


# Offline views for the inventory, excluding all preview scenery from the GLB.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.resolution_x = 600
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Preview world')
scene.world.color = (.25, .25, .25)
scene.view_settings.view_transform = 'AgX'
ground = rounded_box('Preview floor', (200, 200, .01), (0, 0, -.005), 0)
ground.data.materials.append(material('Grey preview floor', (.16, .17, .18), .8))
for position, energy in (((-.4, -.5, .7), 18), ((.3, .3, .6), 12)):
    bpy.ops.object.light_add(type='AREA', location=position)
    lamp = bpy.context.object
    lamp.data.energy = energy
    lamp.data.shape = 'DISK'
    lamp.data.size = .45
    lamp.rotation_euler = (Vector((0, 0, .1042)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
scene.camera = bpy.context.object
scene.camera.data.type = 'ORTHO'
scene.camera.data.ortho_scale = .28
for name, position in (('front', (0, -.8, .25)), ('three-quarter', (.5, -.8, .30)), ('back', (-.4, .8, .25))):
    scene.camera.location = position
    scene.camera.rotation_euler = (Vector((0, 0, .1042)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / f'preview-{name}.png')
    bpy.ops.render.render(write_still=True)
