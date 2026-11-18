"""Offline checks and three-quarter view of unpackaged toothpaste in a TISKEN.
Run: blender -b -t 4 --python-exit-code 1 --python scripts/check-amazon-bathroom-products.py
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)


def load(path,loc=(0,0,0),rotation=(0,0,0)):
 before=set(bpy.context.scene.objects)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'public'/path))
 objects=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH']
 pts=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
 lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
 shift=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
 group=bpy.data.objects.new(path,None);bpy.context.collection.objects.link(group)
 for o in objects:
  mesh=o.data.copy();mesh.transform(o.matrix_world);o.parent=None;o.matrix_world=Matrix.Identity(4);o.data=mesh
  o.location=shift;o.parent=group
 group.location=loc;group.rotation_euler=rotation
 bpy.context.view_layer.update()
 return group,objects


basket,basketmeshes=load('items/tisken40381253/Tisken40381253.glb',rotation=(math.pi/2,0,0))
for i,(key,x) in enumerate([('signal-nature-elements-coco',-.01),('elmex-blancheur-douce',.09),('signal-nature-elements-coco',.05),('elmex-blancheur-douce',-.06)]):
 group,objs=load(f'items/{key}/{key}.glb',loc=(x,-.12,-.0815))
 # The screw-cap footprint must rest on plastic, rather than fall outside or
 # float above the perforated basket floor. Probe the whole contact circle.
 supports=[]
 for sample in range(16):
  a=2*math.pi*sample/16;origin=Vector((x+.0125*math.cos(a),-.12+.0125*math.sin(a),.3))
  for o in basketmeshes:
   inv=o.matrix_world.inverted()
   hit,p,n,index=o.ray_cast(inv@origin,inv.to_3x3()@Vector((0,0,-1)))
   if hit:supports.append((o.matrix_world@p).z)
 assert supports,(key,'cap is outside basket floor')
 assert abs(max(supports)+.0815)<.003,(key,'floor support',max(supports))
 print('PASS',key,'cap rests on TISKEN',max(supports),flush=True)
 if i>=2:
  for o in objs:o.hide_render=True
# Shelf products: bounding corners must clear the diagonal wall and shelf edges.
for key,x,z in [('axe-cherry-fizz-rollon',144.2,626.2),('axe-ultime-cherry-fizz',164.2,620.2),('axe-ultime-cherry-fizz',173.2,620.2)]:
 group,objs=load(f'items/{key}/{key}.glb')
 pts=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box]
 rx=(max(p.x for p in pts)-min(p.x for p in pts))*50
 ry=(max(p.y for p in pts)-min(p.y for p in pts))*50
 assert x-rx>68.2 and x+rx<192 and z-ry>615.2
 assert z+ry<547-(x+rx-316)/math.sqrt(3),(key,'shelf diagonal')
 group.hide_render=True
 for o in objs:o.hide_render=True
 print('PASS',key,'shelf and diagonal clearance',flush=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=700;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.3,.3,.3)
for loc,power in [((-.5,-.6,1),30),((.4,.3,.7),20)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=.5
 o.rotation_euler=(Vector((0,-.1,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.45,-.65,.45));scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=.43
scene.camera.rotation_euler=(Vector((0,-.09,.01))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath='/tmp/amazon-bathroom-tisken.png';bpy.ops.render.render(write_still=True)
import os
os._exit(0)
