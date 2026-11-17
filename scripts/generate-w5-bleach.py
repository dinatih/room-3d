"""W5 bleach spray: existing bottle mesh with supplied oval label projected to surface.
Run: blender -b --python-exit-code 1 --python scripts/generate-w5-bleach.py
"""
from pathlib import Path
import math
import os
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/items/w5-bleach'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/items/spray-cleaner/SprayCleaner.glb'))
body=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=body
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for v in body.data.vertices:v.co.x*=11/14.18

def mat(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.32
 return m
white=mat('Opaque white HDPE',(.92,.92,.89));yellow=mat('W5 yellow trigger',(.85,.65,.008));blue=mat('W5 dark blue pump cover',(.012,.022,.19))
body.data.materials.clear()
for m in (white,yellow,blue):body.data.materials.append(m)
for p in body.data.polygons:
 z=sum(body.data.vertices[i].co.z for i in p.vertices)/len(p.vertices)
 p.material_index=2 if z>.26 and p.normal.z>.6 else (1 if z>.23 else 0)
 p.use_smooth=True
# Project a rectangular UV grid onto the curved bottle; alpha follows the sticker.
label=mat('W5 oval label from supplied reference',(1,1,1))
label.surface_render_method='DITHERED'
tex=label.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'label.png'));tex.image.pack()
p=label.node_tree.nodes.get('Principled BSDF');label.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);label.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha'])
verts=[];uv=[];faces=[];nx=96;nz=16
for j in range(nz+1):
 for i in range(nx):
  r=j/nz;angle=2*math.pi*i/nx
  u=.5+.5*r*math.cos(angle);v=.5+.5*r*math.sin(angle)
  x=(u-.5)*.084;z=.026+v*.12
  hit,point,normal,face=body.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
  if not hit:raise ValueError(f'Label projection missed bottle at {x,z}')
  verts.append((x,point.y-.00025,z));uv.append((u,v))
for j in range(nz):
 for i in range(nx):
  a=j*nx+i;b=j*nx+(i+1)%nx
  faces.append((a,b,b+nx,a+nx))
mesh=bpy.data.meshes.new('Projected label');mesh.from_pydata(verts,[],faces);mesh.update();layer=mesh.uv_layers.new(name='Sticker UV')
for loop in mesh.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
o=bpy.data.objects.new('W5 front label',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(label)
for p in mesh.polygons:p.use_smooth=True
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'W5Bleach.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=560;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.3,.3,.3)
for loc,power in [((-.4,-.4,.6),18),((.4,.3,.4),12)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=.4
 o.rotation_euler=(Vector((0,0,.145))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=.36
for name,loc in [('front',(0,-1,.25)),('three-quarter',(.4,-1,.3)),('back',(-.4,1,.3))]:
 scene.camera.location=loc;scene.camera.rotation_euler=(Vector((0,0,.145))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
os._exit(0)
