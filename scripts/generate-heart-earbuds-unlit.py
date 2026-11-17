"""Photo reconstruction of Temu 606750782628703, red non-luminous heart earbuds.
blender -b --python-exit-code 1 --python scripts/generate-heart-earbuds-unlit.py
Estimated case width 6.4 cm; open display with both earbuds outside the case.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
OUT=ROOT/'public/items/heart-earbuds-unlit';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
red=mat('Glossy scarlet plastic',(.62,.006,.012),.21)
ivory=mat('Warm white charging cradle',(.88,.85,.79),.28)
gold=mat('Gold charging contacts',(.56,.30,.055),.25);gold.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.85
black=mat('Acoustic mesh and USB C port',(.012,.012,.014),.65)

def difference(obj,cutter):
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Moulded recess','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)

def heart(name,x,y,z,w,depth,material):
    pts=[]
    for k in range(48):
        t=2*math.pi*k/48;pts.append((16*math.sin(t)**3,13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)))
    ymin=min(y for x,y in pts);ymax=max(y for x,y in pts)
    outline=[(x+px/32*w,y+(py-(ymin+ymax)/2)/(ymax-ymin)*w*.95) for px,py in pts]
    verts=[(px,py,z+dz) for dz in [-depth/2,depth/2] for px,py in outline];n=len(pts)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    o=mesh(name,verts,faces,material)
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    bevel=o.modifiers.new('Rounded heart shell','BEVEL');bevel.width=.0017;bevel.segments=3;bpy.ops.object.modifier_apply(modifier=bevel.name)
    normal=o.modifiers.new('Heart face normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=normal.name)
    return o

def pill_ring(w,d,z):
    radius=d/2;cx=w/2-radius;points=[]
    for sign,start in [(1,-math.pi/2),(-1,math.pi/2)]:
        for i in range(17):
            t=start+i*math.pi/16;points.append((sign*cx+radius*math.cos(t),.012+radius*math.sin(t),z))
    return points

def pill(name,rings,material):
    n=len(rings[0]);vertices=[v for ring in rings for v in ring]
    faces=[tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))]
    for k in range(len(rings)-1):
        faces.extend((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n))
    o=mesh(name,vertices,faces,material)
    for face in o.data.polygons:face.use_smooth=len(face.vertices)==4
    return o

body=pill('Red capsule case',[pill_ring(.053,.020,0),pill_ring(.059,.026,.004),pill_ring(.060,.027,.018),pill_ring(.060,.027,.020),pill_ring(.056,.023,.020),pill_ring(.054,.021,.004)],red)
tray=pill('White recessed tray',[pill_ring(.054,.021,.006),pill_ring(.056,.023,.0198)],ivory)
for x in [-.015,.015]:
    cut=heart('Heart socket cutter',x,.012,.023,.021,.022,ivory)
    difference(tray,cut)
    for dx in [-.003,0,.003]:sphere('Gold contact',(x+dx,.010,.013),(.0008,.001,.0017),gold)
hinge=cyl('Rear hinge barrel',.002,.038,(0,.024,.019),red);hinge.rotation_euler.y=math.pi/2
lid=pill('Red capsule lid',[pill_ring(.060,.027,.021),pill_ring(.060,.027,.023),pill_ring(.055,.022,.027)],red)
liner=pill('White lid liner',[pill_ring(.055,.022,.018),pill_ring(.055,.022,.021)],ivory)
# Shallow inset heart-shaped relief in the lid, with the red outer skin behind it.
for x in [-.015,.015]:
    cut=heart('Lid heart recess',x,.012,.017,.020,.004,ivory);difference(liner,cut)
bpy.context.view_layer.update();pivot=Vector((0,.024,.020))
transform=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(-105),4,'X')@Matrix.Translation(-pivot)
for obj in [lid,liner]:obj.matrix_world=transform@obj.matrix_world
# Two glossy heart shells and silicone in-ear ends, outside the case for inspection.
for x,y,angle in [(-.019,-.027,-.18),(.017,-.035,.2)]:
    # The touch face points up; the acoustic housing and silicone tip sit underneath.
    shell=heart('Heart touch face',x,y,.018,.021,.010,red)
    shell.data.transform(Matrix.Translation(Vector((x,y,0)))@Matrix.Rotation(angle,4,'Z')@Matrix.Translation(Vector((-x,-y,0))))
    sphere('Red in-ear housing',(x,y,.010),(.007,.008,.0065),red)
    sphere('Silicone ear tip',(x,y+.001,.0047),(.005,.0055,.0047),red)
    sphere('Downward acoustic opening',(x,y+.001,.0006),(.0028,.0025,.0006),black)
# Rear USB-C recess and wrist strap loop (no LED strip or emission materials).
box('USB C socket',(.008,.0007,.0027),(0,.0255,.008),black,.0007)
bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=6,location=(.030,.015,.017),major_radius=.004,minor_radius=.0015)
bpy.context.object.name='Red lanyard eyelet';bpy.context.object.data.materials.append(red)
# Centre the complete display and ground it, keeping the model in metres.
bpy.context.view_layer.update();objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
shift=Matrix.Translation(Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z)))
for o in objects:o.data.transform(shift@o.matrix_world);o.matrix_world=Matrix.Identity(4)
bpy.context.view_layer.update()
print('DISPLAY CM',tuple((hi-lo)*100),flush=True)
finish('HeartEarbudsUnlit',(0,0,(hi.z-lo.z)/2),.115)
