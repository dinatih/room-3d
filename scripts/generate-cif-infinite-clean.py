"""Cif Infinite+Clean 280 ml, Amazon B0DZ34BJ73 photo reconstruction.
Blender metres; overall height 28 cm and diameter 5.6 cm estimated from photos.
Product photos are also used for projected front/back label UVs.
Run: blender -b --python-exit-code 1 --python scripts/generate-cif-infinite-clean.py
"""
from pathlib import Path
import math
import os
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/items/cif-infinite-clean'
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name,color,roughness,transmission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Roughness'].default_value=roughness;p.inputs['Transmission Weight'].default_value=transmission
 p.inputs['IOR'].default_value=1.46
 return m
white=material('White moulded continuous mist pump',(.89,.9,.91),.28)
clear=material('Clear PET bottle',(.93,.97,.96),.13,.8)
liquid=material('Clear cleaning liquid',(.94,.98,.95),.1,.9)
grey=material('Nozzle dark insert',(.08,.09,.09),.35)
for m in (liquid,):m.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.333


def lathe(name,profile,mat):
 n=96;vs=[];fs=[]
 for z,r in profile:
  vs.extend((r*math.cos(2*math.pi*i/n),r*math.sin(2*math.pi*i/n),z) for i in range(n))
 for k in range(len(profile)-1):
  for i in range(n):
   j=(i+1)%n;fs.append((k*n+i,k*n+j,(k+1)*n+j,(k+1)*n+i))
 fs.extend([tuple(reversed(range(n))),tuple((len(profile)-1)*n+i for i in range(n))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 for p in mesh.polygons:p.use_smooth=len(p.vertices)==4
 return o


def box(name,dims,loc,bevel,mat=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 b=o.modifiers.new('Soft moulded corners','BEVEL');b.width=bevel;b.segments=8
 bpy.ops.object.modifier_apply(modifier=b.name)
 if mat:o.data.materials.append(mat)
 return o


lathe('PET body with thick base and rounded shoulder',[(0,.022),(.001,.026),(.003,.0275),(.006,.028),(.15,.028),(.155,.0275),(.158,.026),(.159,.024)],clear)
lathe('Clear fill',[(.004,.025),(.006,.026),(.143,.026)],liquid)
lathe('Dip tube',[(.006,.0012),(.174,.0012)],white)
head=lathe('Hourglass pump housing',[(.158,.028),(.16,.028),(.173,.027),(.187,.023),(.202,.0185),(.213,.018),(.226,.0195),(.246,.023),(.268,.024),(.275,.0235),(.279,.017),(.28,0.002)],white)
# A real recessed opening exposes the pump stem behind the squeeze lever.
cutter=box('Front U slot cutter',(.019,.030,.096),(0,-.022,.223),.009)
bpy.context.view_layer.objects.active=head
b=head.modifiers.new('Recessed front pump slot','BOOLEAN');b.operation='DIFFERENCE';b.object=cutter
bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)
lathe('Internal pump piston',[(.175,.004),(.24,.004)],white)
box('Long integrated squeeze trigger',(.018,.008,.040),(0,-.0205,.25),.004,white)
box('Upper pump bridge',(.020,.015,.008),(0,-.018,.273),.003,white)
# Front-facing concentric outlet rings.
for radius,depth,y,mat in [(.0035,.002,-.026,white),(.0027,.002,-.027,grey),(.0018,.002,-.028,white),(.0008,.002,-.029,grey)]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=radius,depth=depth,location=(0,y,.272),rotation=(math.pi/2,0,0))
 o=bpy.context.object;o.name='Fine mist concentric nozzle';o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True


# Label strips are curved meshes with UVs projecting the exact photographed label.
for back,filename in [(False,'product-1.jpg'),(True,'product-2.jpg')]:
 m=material('Cif printed back label' if back else 'Cif printed front label',(1,1,1),.48)
 tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/filename));tex.image.pack()
 m.node_tree.links.new(tex.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 n=64;verts=[];uvs=[]
 for z,pixel in [(.011,1441),(.149,696)]:
  for i in range(n+1):
   a=-math.pi/2+math.pi*i/n
   # Front centre faces -Y, backside centre +Y.
   x=.0281*math.sin(a);y=(-1 if not back else 1)*.0281*math.cos(a)
   verts.append((x,y,z));u=(math.sin(a)+1)/2
   if back:u=1-u
   uvs.append((u,1-pixel/1500))
 faces=[(i,i+1,n+2+i,n+1+i) for i in range(n)]
 mesh=bpy.data.meshes.new('Photographic curved label');mesh.from_pydata(verts,[],faces);mesh.update()
 layer=mesh.uv_layers.new(name='Photo label UV')
 for loop in mesh.loops:layer.data[loop.index].uv=uvs[loop.vertex_index]
 o=bpy.data.objects.new('Rear label' if back else 'Front label',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in mesh.polygons:p.use_smooth=True
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'CifInfiniteClean.glb'),export_format='GLB',use_selection=True)
# Asset-only offline inspection; no Studio required.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=560;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Product studio');scene.world.color=(.3,.3,.3)
box('Floor',(20,20,.01),(0,0,-.005),.001,material('Studio grey',(.18,.19,.20),.85))
for loc,energy in [((-.3,-.4,.5),14),((.3,.2,.4),10)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.size=.4
 o.rotation_euler=(Vector((0,0,.14))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=.34
for name,loc in [('front',(0,-1,.21)),('three-quarter',(.45,-1,.3)),('back',(-.3,1,.25))]:
 scene.camera.location=loc;scene.camera.rotation_euler=(Vector((0,0,.14))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
os._exit(0)
