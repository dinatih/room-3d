"""Temu 601099729677712: red-grip stainless steel barbecue tongs.
Run: blender -b --python-exit-code 1 --python scripts/generate-temu-grill-tongs.py
Photo dimensions: 25.8 cm long, 10.2 cm open; strip width estimated 1.4 cm.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
OUT=ROOT/'public/items/temu-grill-tongs';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
steel=mat('Brushed stainless steel',(.57,.60,.63),.26);steel.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=1
red=mat('Red non-slip handle pads',(.50,.006,.012),.47)
# One bent spring-steel strip, including the rounded U return at the handle end.
path=[(-.050,.129),(-.049,.120),(-.044,.090),(-.033,.025),(-.021,-.045),(-.011,-.100)]
for i in range(25):
    angle=math.pi+i*math.pi/24
    path.append((.011*math.cos(angle),-.109+.011*math.sin(angle)))
path.extend([(.011,-.100),(.021,-.045),(.033,.025),(.044,.090),(.049,.120),(.050,.129)])
vertices=[]
for i,(x,y) in enumerate(path):
    previous=Vector(path[max(i-1,0)]);following=Vector(path[min(i+1,len(path)-1)])
    tangent=(following-previous).normalized();normal=Vector((-tangent.y,tangent.x))
    # Flat spring stock, with broader gripping jaws at the business end.
    width=.014 if y>.09 else .011
    for offset,z in [(-.0005,0),(.0005,0),(.0005,width),(-.0005,width)]:vertices.append((x+normal.x*offset,y+normal.y*offset,z))
faces=[]
for i in range(len(path)-1):
    for j in range(4):faces.append((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j))
faces.extend([(3,2,1,0),tuple((len(path)-1)*4+j for j in range(4))])
strip=mesh('Continuous U spring and two arms',vertices,faces,steel)
# Stamped triangular teeth on the inner gripping edges, six per jaw.
for side in [-1,1]:
    for index in range(6):
        y=.096+index*.005
        x=side*(.044+(y-.09)*(.006/.039))
        verts=[(x,y-.002,0),(x-side*.002,y,0),(x,y+.002,0),(x,y-.002,.014),(x-side*.002,y,.014),(x,y+.002,.014)]
        mesh('Stamped serration',verts,[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],steel)
    pad=box('Red moulded non-slip grip',(.004,.094,.012),(side*.022,-.041,.0055),red,.0018)
    pad.rotation_euler.z=-side*math.atan(.010/.055)
    # Raised narrow border follows the moulded pad instead of extra grooves.
    ridge=box('Grip raised centre',(.0044,.080,.008),(side*.0225,-.041,.0055),red,.0017)
    ridge.rotation_euler.z=pad.rotation_euler.z
# Calibrate the envelope to the manufacturer photo and centre/ground it.
bpy.context.view_layer.update();objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
size=hi-lo
transform=Matrix.Diagonal((.102/size.x,.258/size.y,1,1))@Matrix.Translation(Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z)))
for o in objects:o.data.transform(transform@o.matrix_world);o.matrix_world=Matrix.Identity(4)
bpy.context.view_layer.update()
print('HEIGHT CM',size.z*100,flush=True)
finish('GrillTongs',(0,0,.007),.32)
