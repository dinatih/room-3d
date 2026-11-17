"""Offline dimensional and visual check of the three products on the SDB GREJIG."""
from pathlib import Path
import math
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
def load(path,x,y,z,rotation=0):
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'public'/path));objs=[o for o in bpy.context.selected_objects if o.type=='MESH']
 pts=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box]
 lo=Vector(tuple(min(v[a] for v in pts) for a in range(3)));hi=Vector(tuple(max(v[a] for v in pts) for a in range(3)))
 group=bpy.data.objects.new(path,None);bpy.context.collection.objects.link(group)
 for o in objs:
  o.parent=group;o.location-=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
 group.location=(x,y,z);group.rotation_euler.z=rotation
 return hi-lo
load('items/grejig40329868/Grejig40329868.glb',0,0,0)
for path,x,depth,rotation in [('items/cleaning-accessories/plogsvaeng.glb',.17,.05,0),('items/cif-infinite-clean/CifInfiniteClean.glb',.01,.03,math.pi),('items/w5-bleach/W5Bleach.glb',-.18,.03,math.pi)]:
 size=load(path,x,-depth,.17,rotation)
 assert abs(x)+size.x/2<=.29, (path,'outside shelf width',size)
 assert abs(depth)+size.y/2<=.135,(path,'outside shelf depth',size)
 print('FITS',path,tuple(size),flush=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=850;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.32,.32,.32)
for loc,energy in [((-.7,.7,1.2),90),((.7,-.5,.8),60)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.size=.7
 o.rotation_euler=(Vector((0,0,.2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.65,1.4,1))
scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=.85
scene.camera.rotation_euler=(Vector((0,0,.23))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath='/tmp/closet-cleaning-placement.png';bpy.ops.render.render(write_still=True)
import os
os._exit(0)
