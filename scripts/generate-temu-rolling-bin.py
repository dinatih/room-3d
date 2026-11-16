"""Blender: reproduce Temu 607499684021065 from its dimensioned green photo.

Run: blender -b --python scripts/generate-temu-rolling-bin.py
Photo dimensions take precedence over the listing's inconsistent 26.4 L title.
Metres in GLB; front = -Y in Blender / +Z in glTF; base at floor zero.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/items/temu-rolling-bin'
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


green = material('Forest green moulded polypropylene', (0.012, 0.065, 0.040), 0.3)
lid_green = material('Green inset lid', (0.020, 0.090, 0.060), 0.32)
black = material('Charcoal caster tyres', (0.018, 0.022, 0.021), 0.65)
frame = material('Dark grey base and caster forks', (0.045, 0.055, 0.05), 0.4)


def box(name, dimensions, location, bevel, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Moulded rounded edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 4
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def cylinder(name, radius, depth, location, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new('Rounded tyre edges', 'BEVEL')
    bevel.width = 0.0015
    bevel.segments = 3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    mod = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


# Four separate swivel caster assemblies, wheel contact at Z = 0.
for x in (-0.087, 0.087):
    for y in (-0.092, 0.092):
        tag = f'{x:+.3f}_{y:+.3f}'
        cylinder('Caster swivel ' + tag, 0.009, 0.008, (x, y, 0.033), frame)
        box('Caster fork ' + tag, (0.018, 0.012, 0.019), (x, y, 0.023), 0.003, frame)
        for side in (-1, 1):
            cylinder('Twin caster wheel ' + tag, 0.015, 0.006,
                     (x + side * 0.007, y - 0.003, 0.015), black, (0, math.pi / 2, 0))
        cylinder('Wheel axle ' + tag, 0.004, 0.023, (x, y - 0.003, 0.015), frame, (0, math.pi / 2, 0))

box('Recessed dark base', (0.220, 0.230, 0.012), (0, 0, 0.040), 0.005, frame)

# Hollow continuous rounded shell, including wall thickness and a closed floor.
# Rounded rectangle rings, CCW viewed from above.
def ring(width, depth, radius, height):
    points = []
    for cx, cy, angle in ((width / 2 - radius, depth / 2 - radius, 0),
                          (-width / 2 + radius, depth / 2 - radius, 90),
                          (-width / 2 + radius, -depth / 2 + radius, 180),
                          (width / 2 - radius, -depth / 2 + radius, 270)):
        for i in range(9):
            a = math.radians(angle + i * 90 / 8)
            points.append((cx + radius * math.cos(a), cy + radius * math.sin(a), height))
    return points


rings = [ring(0.221, 0.231, 0.018, 0.044),
         ring(0.227, 0.237, 0.019, 0.346),
         ring(0.227, 0.237, 0.019, 0.350),
         ring(0.185, 0.168, 0.006, 0.341),
         ring(0.215, 0.225, 0.015, 0.049)]
n = len(rings[0])
vertices = [v for r in rings for v in r]
faces = []
for k in range(len(rings) - 1):
    for i in range(n):
        j = (i + 1) % n
        faces.append((k * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i))
faces.extend([tuple(reversed(range(n))), tuple(4 * n + i for i in range(n))])
mesh = bpy.data.meshes.new('Hollow injection moulded bin')
mesh.from_pydata(vertices, [], faces)
mesh.update()
body = bpy.data.objects.new('Green rounded body with inner walls', mesh)
bpy.context.collection.objects.link(body)
body.data.materials.append(green)
for poly in mesh.polygons:
    poly.use_smooth = len(poly.vertices) == 4

# Sloping surround with a genuinely separate flush rectangular lid and dark seam.
box('Lid recessed shadow seam', (0.185, 0.168, 0.003), (0, 0, 0.339), 0.005, frame)
box('Inset push lid', (0.182, 0.165, 0.005), (0, 0, 0.342), 0.005, lid_green)
box('Finger recess', (0.050, 0.006, 0.002), (0, -0.080, 0.344), 0.002, green)
for x in (-0.064, 0.064):
    cylinder('Lid pivot', 0.003, 0.014, (x, 0.080, 0.342), green, (0, math.pi / 2, 0))

objects = list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT / 'TemuRollingBin.glb'), export_format='GLB', use_selection=True)

# Three quick offline views; camera/lights/floor stay outside the exported asset.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.resolution_x = 550
scene.render.resolution_y = 550
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Preview world')
scene.world.color = (0.3, 0.3, 0.3)
scene.view_settings.view_transform = 'AgX'
box('Preview floor', (200, 200, 0.01), (0, 0, -0.005), 0, material('Preview floor', (0.22, 0.23, 0.22), 0.85))
for loc, power, size in (((-0.4, -0.5, 0.8), 35, 0.5), ((0.4, 0.2, 0.6), 20, 0.4)):
    bpy.ops.object.light_add(type='AREA', location=loc)
    lamp = bpy.context.object
    lamp.data.energy = power
    lamp.data.shape = 'DISK'
    lamp.data.size = size
    lamp.rotation_euler = (Vector((0, 0, 0.17)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
scene.camera = bpy.context.object
scene.camera.data.type = 'ORTHO'
scene.camera.data.ortho_scale = 0.49
for name, position in (('front', (0, -0.8, 0.45)), ('three-quarter', (0.6, -0.8, 0.60)), ('back', (0.5, 0.8, 0.50))):
    scene.camera.location = position
    scene.camera.rotation_euler = (Vector((0, 0, 0.17)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / ('preview.png' if name == 'three-quarter' else f'preview-{name}.png'))
    bpy.ops.render.render(write_still=True)
