"""Grey Temu LDQ 607236952849850: 20-clip sock dryer, future purchase.
blender -b --python-exit-code 1 --python scripts/generate-sock-dryer-20.py
Photo frame dimensions 37 x 10 cm; total suspended height estimated 19.5 cm.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
OUT=ROOT/'public/items/temu-sock-dryer-20';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
grey=mat('Grey moulded frame and soft jaw pads',(.28,.30,.31),.4)
steel=mat('Stainless clips and suspension',(.62,.65,.67),.24);steel.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=1

def tube(name,points,radius,material,cyclic=False):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=0;curve.use_fill_caps=True
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    spline.use_cyclic_u=cyclic
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    for p in obj.data.polygons:p.use_smooth=True
    return obj

# Capsule frame with ten cross members. Long axis X, clip rows at +/-Y.
points=[]
for sign,start in [(1,-math.pi/2),(-1,math.pi/2)]:
    for i in range(13):
        angle=start+i*math.pi/12
        points.append((sign*.165+.016*math.cos(angle),.016*math.sin(angle),.071))
tube('Continuous rounded grey frame',points,.004,grey,True)
for index in range(10):
    x=-.163+index*.326/9
    tube('Frame cross member',[(x,-.016,.071),(x,.016,.071)],.0028,grey)
    for side in [-1,1]:
        y=side*.044
        tube('Curved clip support',[(x,side*.014,.071),(x,side*.028,.065),(x,side*.040,.052),(x,y,.047)],.0035,grey)
        # Plastic eye and a separate stainless hanging loop.
        tube('Plastic support eye',[(x+.004*math.cos(t),y,.045+.004*math.sin(t)) for t in [2*math.pi*i/12 for i in range(12)]],.002,grey,True)
        tube('Clip hanging loop',[(x+.0025*math.cos(t),y,.037+.007*math.sin(t)) for t in [2*math.pi*i/12 for i in range(12)]],.00065,steel,True)
        # Pair of stamped jaws: three rails leave two genuinely open slots.
        for jaw in [-1,1]:
            depth=y+jaw*.0016
            box('Stamped upper jaw bridge',(.010,.0006,.006),(x,depth,.026),steel,.00025)
            for rail in [-1,0,1]:
                box('Slotted jaw rail',(.0018,.0006,.017),(x+rail*.004,depth,.0145),steel,0)
            box('Grey soft grip pad',(.012,.0025,.009),(x,depth,.0045),grey,.001)
        tube('Clip spring coil',[(x+.002*math.cos(t),y-.002+.004*i/18,.022+.002*math.sin(t)) for i,t in [(i,4*math.pi*i/18) for i in range(19)]],.0005,steel)
# Central bracket and swivel hook, matching the two metal uprights in the reference.
tube('Stainless suspension bridge',[(-.052,0,.071),(-.052,0,.095),(-.049,0,.100),(.049,0,.100),(.052,0,.095),(.052,0,.071)],.0018,steel)
box('Swivel retaining block',(.014,.009,.011),(0,0,.103),steel,.001)
tube('Swivel hook stem',[(0,0,.106),(0,0,.133),(.004,0,.145),(.013,0,.156)],.0017,steel)
# Open curved hook: tip at left, stem joining at lower right.
hook=[(.003+.019*math.cos(t),0,.174+.019*math.sin(t)) for t in [-1.02+i*4.8/28 for i in range(29)]]
tube('Open hanging hook',[(.013,0,.156)]+hook,.0017,steel)
# Normalise only the photo-calibrated width/depth; height is an estimate.
bpy.context.view_layer.update();objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
size=hi-lo
transform=Matrix.Diagonal((.37/size.x,.10/size.y,1,1))@Matrix.Translation(Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z)))
for o in objects:o.data.transform(transform@o.matrix_world);o.matrix_world=Matrix.Identity(4)
bpy.context.view_layer.update()
print('HEIGHT_CM',size.z*100,flush=True)
finish('SockDryer20',(0,0,size.z/2),.45)
