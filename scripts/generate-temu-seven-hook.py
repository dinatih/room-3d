"""White Temu 607645746483736, seven-prong under-cabinet rotary hook.
Run: blender -b --python-exit-code 1 --python scripts/generate-temu-seven-hook.py
Dimensions from the dimensioned product photo: 9 cm diameter, 10 cm height.
Metres, Y up in GLB; highest surface is the adhesive mounting face.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[1]
# Shared material, primitive, batching and offline preview helpers.
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
OUT=ROOT/'public/items/temu-seven-hook'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
white=mat('White reinforced polypropylene',(.88,.89,.87),.32)
# All pieces share one material and are joined before export: one draw call.
box('Rounded adhesive mounting plate',(.066,.066,.003),(0,0,.1785),white,.0014)
cyl('Circular swivel mounting flange',.033,.006,(0,0,.174),white)
cyl('Upper swivel axle',.008,.006,(0,0,.168),white)
box('Reinforced hanging arm',(.012,.015,.107),(0,0,.1125),white,.005)
# Fork cheeks and horizontal pivot at the lower end permit the wall-mount variant.
for x in [-.007,.007]:
    box('Articulated fork cheek',(.003,.014,.020),(x,0,.054),white,.0014)
pivot=cyl('Horizontal hinge pin',.005,.019,(0,0,.054),white); pivot.rotation_euler.y=math.pi/2
cyl('Rotating lower collar',.008,.026,(0,0,.029),white)
cyl('Seven-arm hub',.012,.012,(0,0,.014),white)
# Seven identical rounded J arms distributed evenly around the rotating hub.
for index in range(7):
    angle=2*math.pi*index/7
    # Radius and height along the arm; rounded rising tip retains utensils.
    profile=[(.008,.014),(.024,.014),(.044,.014),(.052,.015),(.057,.020),(.059,.027)]
    curve=bpy.data.curves.new('Rounded radial hook','CURVE');curve.dimensions='3D';curve.resolution_u=4;curve.bevel_depth=.0035;curve.bevel_resolution=1;curve.use_fill_caps=True
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(profile)-1)
    for point,(radius,z) in zip(spline.bezier_points,profile):
        point.co=(radius*math.cos(angle),radius*math.sin(angle),z);point.handle_left_type='AUTO';point.handle_right_type='AUTO'
    obj=bpy.data.objects.new(f'Hook {index+1} of 7',curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(white)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    sphere('Rounded hook tip',(profile[-1][0]*math.cos(angle),profile[-1][0]*math.sin(angle),profile[-1][1]),(.0035,.0035,.0035),white)
# Apply the photo's 9 x 9 x 10 cm envelope, and centre/ground the export.
bpy.context.view_layer.update()
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(corner) for o in meshes for corner in o.bound_box]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
size=hi-lo
transform=Matrix.Diagonal((.09/size.x,.09/size.y,.10/size.z,1)) @ Matrix.Translation(Vector((-(hi.x+lo.x)/2,-(hi.y+lo.y)/2,-lo.z)))
for obj in meshes:
    obj.data.transform(transform@obj.matrix_world)
    obj.matrix_world=Matrix.Identity(4)
bpy.context.view_layer.update()
finish('SevenProngHook',(0,0,.05),.15)
