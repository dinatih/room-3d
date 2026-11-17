"""Reconstruct Vileda 1-2 Spray ONE, metres, floor origin; run with Blender.
Height 136.5 cm from Lidl 100408536. Head 40 × 14 cm and detail proportions
estimated from product photographs; not a manufacturer CAD model.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/items/vileda-spray-one'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metal
    return m


red = material('Vileda red polypropylene', (.57, .008, .022), .28)
steel = material('Red coated steel shaft', (.48, .009, .018), .24, .35)
grey = material('Graphite moulded plate', (.035, .042, .048), .42)
tank = material('Smoky grey refillable reservoir', (.24, .29, .32), .24)
white = material('White woven microfibre', (.87, .86, .81), .95)
fibre_red = material('Red cleaning fibres', (.46, .012, .026), .95)
# Microfibre relief is baked to an embedded normal texture for glTF.
size = 256
import random
rng = random.Random(12)
img = bpy.data.images.new('Microfibre weave normal', width=size, height=size)
pixels = []
for y in range(size):
    for x in range(size):
        nx = .5 + .16 * math.sin(x * math.pi / 2) + rng.uniform(-.09, .09)
        ny = .5 + .14 * math.sin(y * math.pi / 3) + rng.uniform(-.09, .09)
        pixels.extend((nx, ny, 1, 1))
img.pixels = pixels
img.pack()
for m in (white, fibre_red):
    nodes = m.node_tree.nodes
    tex = nodes.new('ShaderNodeTexImage'); tex.image = img
    normal = nodes.new('ShaderNodeNormalMap')
    m.node_tree.links.new(tex.outputs['Color'], normal.inputs['Color'])
    m.node_tree.links.new(normal.outputs['Normal'], nodes.get('Principled BSDF').inputs['Normal'])


def box(name, dims, loc, bevel, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        b = o.modifiers.new('Soft moulded edges', 'BEVEL'); b.width = bevel; b.segments = 5
        bpy.ops.object.modifier_apply(modifier=b.name)
    n = o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=n.name)
    return o


def rod(name, a, b, radius, mat):
    delta = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=delta.length, location=(Vector(a) + Vector(b)) / 2)
    o = bpy.context.object; o.name = name
    o.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = len(p.vertices) == 4
    return o


def tube(name, points, radius, mat, cyclic=False):
    c = bpy.data.curves.new(name, 'CURVE'); c.dimensions = '3D'
    c.bevel_depth = radius; c.bevel_resolution = 4
    s = c.splines.new('BEZIER'); s.bezier_points.add(len(points) - 1)
    for p, co in zip(s.bezier_points, points):
        p.co = co; p.handle_left_type = 'AUTO'; p.handle_right_type = 'AUTO'
    s.use_cyclic_u = cyclic
    o = bpy.data.objects.new(name, c); bpy.context.collection.objects.link(o); o.data.materials.append(mat)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o.select_set(False)


box('Thick washable microfibre pad', (.40, .14, .012), (0, 0, .006), .006, white)
box('Red perimeter backing', (.386, .126, .006), (0, 0, .015), .007, red)
box('Graphite pivoting head', (.371, .111, .014), (0, 0, .025), .008, grey)
for x in (-.163, .163):
    for y in (-.043, .043):
        box('Red pad release clip', (.038, .025, .009), (x, y, .035), .006, red)
        rod('Clip black fastener', (x, y, .039), (x, y, .042), .007, grey)
# Alternating fibre bands are geometry so they remain visible from the underside.
for x in range(-9, 10):
    box('Red scrubbing weave', (.003, .126, .0015), (x * .019, 0, .001), .0006, fibre_red)
rod('Swivel axle', (-.023, 0, .046), (.023, 0, .046), .012, grey)
box('Pivot fork', (.035, .028, .035), (0, 0, .060), .007, red)
rod('Lower spray housing', (0, 0, .065), (0, 0, .17), .019, grey)
box('Spray nozzle red surround', (.027, .019, .023), (0, -.017, .125), .005, red)
rod('Spray outlet', (0, -.026, .125), (0, -.029, .125), .003, grey)
rod('Red steel handle', (0, 0, .15), (0, 0, 1.255), .010, steel)
box('Reservoir mount', (.034, .029, .22), (0, .004, .29), .014, grey)
box('Removable grey water tank', (.063, .068, .22), (0, -.017, .30), .025, tank)
box('Tank release shoulder', (.058, .050, .027), (0, -.014, .413), .009, red)
rod('Reservoir cap', (0, -.018, .422), (0, -.018, .438), .019, grey)
rod('Handle lower collar', (0, 0, 1.20), (0, 0, 1.245), .014, grey)
tube('Ergonomic red loop grip', [(0, 0, 1.23), (.025, 0, 1.26), (.075, 0, 1.29), (.077, 0, 1.332), (.045, 0, 1.353), (0, 0, 1.34)], .012, red, True)
tube('Black squeeze trigger', [(.005, -.002, 1.25), (.030, -.002, 1.278), (.060, -.002, 1.285)], .006, grey)
# Orient the grip and its trigger along the head's depth, around the shaft axis.
for name in ('Ergonomic red loop grip', 'Black squeeze trigger'):
    bpy.data.objects[name].rotation_euler.z = math.pi / 2
# Raised white product lettering on the upper head surface.
bpy.ops.object.text_add(location=(-.14, -.018, .033))
t = bpy.context.object; t.name = 'Vileda head branding'; t.data.body = 'vileda   1·2 SPRAY ONE'
t.data.size = .014; t.data.extrude = .00012; t.data.materials.append(white)
bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT / 'ViledaSprayOne.glb'), export_format='GLB', use_selection=True)
# Offline front / three-quarter / rear verification and inventory photographs.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'; scene.cycles.samples = 16
scene.render.resolution_x = 640; scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Studio'); scene.world.color = (.3, .3, .3)
box('Preview floor', (200, 200, .01), (0, 0, -.005), 0, material('Floor', (.19, .21, .23), .8))
for loc, energy in (((-1, -2, 2), 180), ((1, 1, 1.8), 140)):
    bpy.ops.object.light_add(type='AREA', location=loc)
    o = bpy.context.object; o.data.energy = energy; o.data.size = 1.6
    o.rotation_euler = (Vector((0, 0, .68)) - o.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
scene.camera = bpy.context.object; scene.camera.data.type = 'ORTHO'; scene.camera.data.ortho_scale = 1.57
for name, loc in [('front', (0, -3, 1.35)), ('three-quarter', (1.6, -3, 1.6)), ('back', (-1.6, 3, 1.5))]:
    scene.camera.location = loc
    scene.camera.rotation_euler = (Vector((0, 0, .68)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / f'preview-{name}.png')
    bpy.ops.render.render(write_still=True)
