"""Maxi Bazar 2101000082 red MAXI FAMILLE cabas, hanging laundry-bag shape.
blender -b --python-exit-code 1 --python scripts/generate-kabba-laundry-bag.py
Nominal catalogue body 70 x 53 x 30 cm; photograph dimensions differ (59x50x28).
The mesh is a soft gathered hanging reconstruction; base zero, top grip 77 cm.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
OUT=ROOT/'public/items/kabba-laundry-bag';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
red=mat('Burgundy woven polypropylene',(.29,.006,.027),.62)
printed=mat('Photographic MAXI FAMILLE print',(.29,.006,.027),.62)
photo=bpy.data.images.load(str(OUT/'product-2.jpg'));photo.pack()
tex=printed.node_tree.nodes.new('ShaderNodeTexImage');tex.image=photo
printed.node_tree.links.new(tex.outputs['Color'],printed.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
# Small woven surface normal shared by the plastic panels and straps.
normal=bpy.data.images.new('Fine cross woven PP',width=128,height=128);normal.colorspace_settings.name='Non-Color'
pixels=[]
for y in range(128):
    for x in range(128):pixels.extend((.5+.13*math.sin(x*math.pi/2),.5+.13*math.sin(y*math.pi/2),1,1))
normal.pixels.foreach_set(pixels);normal.pack()
for material in [red,printed]:
    nodes=material.node_tree.nodes;links=material.node_tree.links
    uv=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='SCALE';mapping.inputs[3].default_value=32
    texnormal=nodes.new('ShaderNodeTexImage');texnormal.image=normal
    bump=nodes.new('ShaderNodeNormalMap');bump.inputs['Strength'].default_value=.3
    links.new(uv.outputs['UV'],mapping.inputs[0]);links.new(mapping.outputs['Vector'],texnormal.inputs['Vector']);links.new(texnormal.outputs['Color'],bump.inputs['Color']);links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])

def panel_point(u,v,side):
    width=.66+.04*math.sin(math.pi*v)-.14*v**4
    # Gathered mouth; vertical creases grow near seams and the top edge.
    x=(u-.5)*width
    fold=.009*math.sin(8*math.pi*u+v*3)*math.sin(math.pi*v)+.005*math.sin(u*23)*v*v
    y=side*(.10+.035*math.sin(math.pi*v)-.035*v**3+fold)
    z=.53*v+.009*math.cos(u*math.pi*2)*v**6
    return (x,y,z)
# Front and back quad grids use the real product print; sides remain burgundy.
for side in [-1,1]:
    verts=[];uvs=[];faces=[];nx=24;nz=20
    for j in range(nz+1):
        for i in range(nx+1):
            u=i/nx;v=j/nz;verts.append(panel_point(u,v,side));uvs.append(((40+660*(u if side==-1 else 1-u))/736,(740-(732-516*v))/740))
    for j in range(nz):
        for i in range(nx):
            a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1) if side==-1 else (a+1,a,a+nx+1,a+nx+2))
    obj=mesh('Printed soft front' if side==-1 else 'Printed soft back',verts,faces,printed)
    uv=obj.data.uv_layers.new()
    for poly in obj.data.polygons:
        poly.use_smooth=True
        for loop in poly.loop_indices:uv.data[loop].uv=uvs[obj.data.loops[loop].vertex_index]
    mod=obj.modifiers.new('Thin PP panel','SOLIDIFY');mod.thickness=.0008;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
for u in [0,1]:
    verts=[];faces=[]
    for j in range(21):
        for k in range(5):
            v=j/20;t=k/4;a=Vector(panel_point(u,v,-1));b=Vector(panel_point(u,v,1));p=a.lerp(b,t)
            p.x+=(1 if u==0 else -1)*.02*math.sin(math.pi*t)*math.sin(math.pi*v)
            verts.append(p)
    for j in range(20):
        for k in range(4):a=j*5+k;faces.append((a,a+1,a+6,a+5))
    obj=mesh('Creased side gusset',verts,faces,red)
    for poly in obj.data.polygons:poly.use_smooth=True
mesh('Closed flexible bottom',[panel_point(0,0,-1),panel_point(1,0,-1),panel_point(1,0,1),panel_point(0,0,1)],[(0,1,2,3)],red)
# Wide fabric tape straps converge on the same hanging point above the opening.
for side in [-1,1]:
    points=[(-.17,side*.070,.46),(-.13,side*.060,.56),(-.075,side*.035,.68),(0,side*.006,.77),(.075,side*.035,.68),(.13,side*.060,.56),(.17,side*.070,.46)]
    verts=[]
    for x,y,z in points:verts.extend([(x-.012,y,z),(x+.012,y,z)])
    obj=mesh('Woven carrying handle',verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(points)-1)],red)
    mod=obj.modifiers.new('Tape thickness','SOLIDIFY');mod.thickness=.001;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:poly.use_smooth=True
finish('KabbaLaundryBag',(0,0,.36),.95)
