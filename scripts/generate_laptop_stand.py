"""Blender --background --python scripts/generate_laptop_stand.py.
Dimensions in metres. Blender Z-up, exported glTF Y-up; front is glTF +Z.
Measured references: supplied photos 13–19; acrylic lies flat as in photo 15.
"""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Vector

WIDTH = .25
STRIP_WIDTH = .04
METAL_THICKNESS = .006
BEND_RADIUS = .016
TOP_LENGTH = .22
BOTTOM_LENGTH = .20
REAR_HEIGHT = .15
FRONT_HEIGHT = .13
PAD_LENGTH = .195
PAD_WIDTH = .032
PAD_THICKNESS = .003
BAR_WIDTH = .256
BAR_DEPTH = .04
BAR_THICKNESS = .008
FOOT_RADIUS = .009
FOOT_HEIGHT = .003
CLIP_LENGTH = .014
CLIP_THICKNESS = .002
HOLE_RADIUS = .0015
EDGE_RADIUS = .0015
ARC_SEGMENTS = 12
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/items/support-ordinateur'
SLOPE = math.atan2(REAR_HEIGHT - FRONT_HEIGHT, TOP_LENGTH)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0, roughness=.4):
    m = bpy.data.materials.new(name)
    m.diffuse_color = color
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = color
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    return m

alu = material('Brushed aluminium', (.65, .68, .70, 1), 1, .4)
rubber = material('Dark grey rubber', (.045, .05, .052, 1), 0, .86)
clear = material('Clear acrylic', (.84, .93, .98, .35), 0, .09)
clear.surface_render_method = 'DITHERED'
p = clear.node_tree.nodes.get('Principled BSDF')
p.inputs['Alpha'].default_value = .35
p.inputs['Transmission Weight'].default_value = .7
p.inputs['IOR'].default_value = 1.49

def finish(obj, mat, bevel=EDGE_RADIUS):
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft manufactured edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def box(name, loc, size, mat, bevel=EDGE_RADIUS, tilt=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(o, mat, bevel)
    o.rotation_euler.x = tilt
    return o

# Fillet the two rear bends of the continuous C-shaped strip.
bottom_z = FOOT_HEIGHT + BAR_THICKNESS + METAL_THICKNESS / 2
rear_y = BOTTOM_LENGTH / 2
front_y = rear_y - TOP_LENGTH
upper_z = REAR_HEIGHT - PAD_THICKNESS - METAL_THICKNESS / 2
corners = [Vector((rear_y - BOTTOM_LENGTH, bottom_z)),
           Vector((rear_y, bottom_z)), Vector((rear_y, upper_z)),
           Vector((front_y, upper_z - (REAR_HEIGHT - FRONT_HEIGHT)))]
path = [corners[0]]
for i in (1, 2):
    a, b, c = corners[i-1:i+2]
    u, v = (a-b).normalized(), (c-b).normalized()
    angle = u.angle(v)
    tangent = BEND_RADIUS / math.tan(angle/2)
    center = b + (u+v).normalized() * BEND_RADIUS / math.sin(angle/2)
    start, end = b + u*tangent, b + v*tangent
    aa = math.atan2(*(start-center)[::-1])
    bb = math.atan2(*(end-center)[::-1])
    sweep = (bb-aa+math.pi) % (2*math.pi)-math.pi
    for j in range(ARC_SEGMENTS+1):
        t = aa + sweep*j/ARC_SEGMENTS
        path.append(center + Vector((math.cos(t), math.sin(t)))*BEND_RADIUS)
path.append(corners[-1])

for side, x in [('Left', -(WIDTH-STRIP_WIDTH)/2), ('Right', (WIDTH-STRIP_WIDTH)/2)]:
    verts, faces = [], []
    for i, point in enumerate(path):
        tangent = (path[min(i+1,len(path)-1)]-path[max(0,i-1)]).normalized()
        normal = Vector((-tangent.y, tangent.x)) * METAL_THICKNESS/2
        for dx, sign in [(-STRIP_WIDTH/2,-1),(STRIP_WIDTH/2,-1),(STRIP_WIDTH/2,1),(-STRIP_WIDTH/2,1)]:
            p = point + normal*sign
            verts.append((x+dx,p.x,p.y))
    for i in range(len(path)-1):
        for k in range(4):
            faces.append((4*i+k,4*i+(k+1)%4,4*(i+1)+(k+1)%4,4*(i+1)+k))
    faces.extend([(3,2,1,0),tuple(4*(len(path)-1)+k for k in range(4))])
    mesh = bpy.data.meshes.new(side+' bent strip')
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new(side+' continuous aluminium C',mesh)
    bpy.context.collection.objects.link(o)
    finish(o,alu)
    # Small through hole near the inside of the rear bridge.
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=HOLE_RADIUS, depth=METAL_THICKNESS*4,
        location=(x,rear_y,upper_z-BEND_RADIUS*2), rotation=(math.pi/2,0,0))
    cutter=bpy.context.object
    boolean=o.modifiers.new('Rear bridge through hole','BOOLEAN')
    boolean.operation='DIFFERENCE'
    boolean.object=cutter
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    pad_y = (front_y+rear_y)/2
    pad_z = (FRONT_HEIGHT+REAR_HEIGHT)/2 - PAD_THICKNESS/2
    box(side+' upper rubber pad',(x,pad_y,pad_z),(PAD_WIDTH,PAD_LENGTH,PAD_THICKNESS),rubber,.0014,SLOPE)
    box(side+' rear rubber foot',(x,rear_y-.028,FOOT_HEIGHT/2+BAR_THICKNESS/2),
        (PAD_WIDTH,.045,FOOT_HEIGHT+BAR_THICKNESS),rubber,.002)
    # Clear L cap: sleeve below the tip and upright retaining lip.
    tip_z = FRONT_HEIGHT-PAD_THICKNESS-METAL_THICKNESS/2
    box(side+' clear clip sleeve',(x,front_y+.004,tip_z-METAL_THICKNESS/2-CLIP_THICKNESS/2),
        (STRIP_WIDTH+.004,CLIP_LENGTH,CLIP_THICKNESS),clear,.0008,SLOPE)
    box(side+' clear retaining lip',(x,front_y-.003,tip_z+.003),
        (STRIP_WIDTH+.004,CLIP_THICKNESS,.016),clear,.0008,SLOPE)
    for dx in (-1,1):
        box(side+' clip side wall',(x+dx*(STRIP_WIDTH/2+.001),front_y+.004,tip_z),
            (CLIP_THICKNESS,CLIP_LENGTH,.009),clear,.0006,SLOPE)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=FOOT_RADIUS,depth=FOOT_HEIGHT,
        location=(x,rear_y-BOTTOM_LENGTH+.018,FOOT_HEIGHT/2))
    finish(bpy.context.object,rubber,.0007).name=side+' circular front foot'

bar_y = rear_y-BOTTOM_LENGTH+.018
box('Transparent front crossbar',(0,bar_y,FOOT_HEIGHT+BAR_THICKNESS/2),
    (BAR_WIDTH,BAR_DEPTH,BAR_THICKNESS),clear,.003)
bpy.ops.object.text_add(location=(0,bar_y-.003,FOOT_HEIGHT+BAR_THICKNESS+.0001))
logo=bpy.context.object
logo.name='GRIFFIN etched mark'
logo.data.body='G R I F F I N'
logo.data.align_x='CENTER'
logo.data.size=.006
logo.data.extrude=.00003
logo.data.materials.append(material('Etched acrylic',(.48,.55,.58,.65),0,.6))
bpy.ops.object.convert(target='MESH')
# Centre depth at origin without changing measured dimensions.
for o in list(bpy.context.scene.objects):
    o.location.y -= (rear_y+front_y)/2
OUT.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'support_ordinateur.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'support_ordinateur.glb'),export_format='GLB',export_yup=True)

# Inspection views are deliberately outside the web assets.
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=16
scene.render.resolution_x=700
scene.render.resolution_y=600
scene.render.resolution_percentage=100
scene.world.color=(.35,.35,.35)
box('Preview ground',(0,0,-.003),(.9,.9,.006),material('Ground',(.19,.21,.24,1)),.001)
for loc,energy,size in [((.2,-.3,.6),4.5,.45),((-.4,.1,.3),3,.35)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    bpy.context.object.data.energy=energy
    bpy.context.object.data.shape='DISK'
    bpy.context.object.data.size=size
    bpy.context.object.rotation_euler=(Vector((0,0,.07))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object
scene.camera=cam
cam.data.type='ORTHO'
cam.data.ortho_scale=.40
for name,loc in [('three-quarter',(.36,-.45,.32)),('profile',(.5,0,.13)),('top',(0,0,.65))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,.075))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath='/tmp/support-ordinateur-'+name+'.png'
    bpy.ops.render.render(write_still=True)
