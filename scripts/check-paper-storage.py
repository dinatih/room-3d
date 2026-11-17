"""Blender geometry checks: opaque PLOGSVÄNG floor, hollow rolls and support sizes.
Run: blender -b --python-exit-code 1 --python scripts/check-paper-storage.py
"""
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]

def load(path):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'public'/path))
 return [o for o in bpy.context.scene.objects if o.type=='MESH']

objs=load('items/cleaning-accessories/plogsvaeng.glb')
# Rays from inside the basket must meet an upward opaque face, even if a
# renderer culls backsides. This is the original GREJIG visibility regression.
for x,y in [(0,0),(.04,.03),(-.04,-.03)]:
 hits=[]
 for o in objs:
  origin=o.matrix_world.inverted()@Vector((x,y,.05))
  ok,p,n,index=o.ray_cast(origin,Vector((0,0,-1)))
  if ok:
   world=o.matrix_world@p
   if world.z<.005:
    material=o.data.materials[o.data.polygons[index].material_index]
    hits.append((world.z,n.z,material.name))
 assert hits, ('Basket bottom missing',x,y)
 hit=max(hits)
 assert hit[1]>.99, ('Basket bottom points downward',hit)
 assert hit[2]=='White polypropylene', ('Basket floor uses perforated material',hit)
print('PASS: opaque upward basket floor',flush=True)

for slug,diameter,height in [('toilet-paper-roll',.11,.10),('paper-towel-roll',.115,.25)]:
 objs=load(f'items/{slug}/{slug}.glb')
 pts=[o.matrix_world@Vector(v) for o in objs for v in o.bound_box]
 lo=Vector(tuple(min(p[a] for p in pts) for a in range(3)));hi=Vector(tuple(max(p[a] for p in pts) for a in range(3)))
 assert abs(lo.z)<1e-6 and abs(hi.z-height)<1e-6,(slug,lo,hi)
 assert hi.x-lo.x>=diameter-.0001
 for o in objs:
  ok,*_=o.ray_cast(Vector((0,0,height+.1)),Vector((0,0,-1)))
  assert not ok,(slug,'cardboard core is blocked')
 print('PASS: hollow roll',slug,tuple((hi-lo)*100),flush=True)
# Check the curved tank under the complete toilet roll footprint, rather than
# placing the flat roll base at the tank's lower centre point.
import math
objs=load('items/president-toilet/president-toilet.glb')
base=next(o for o in objs if o.name=='base')
support=[]
for i in range(32):
 a=2*math.pi*i/32
 origin=Vector((-.0952+.055*math.cos(a),.278+.055*math.sin(a),1.2))
 ok,p,n,index=base.ray_cast(base.matrix_world.inverted()@origin,base.matrix_world.to_3x3().inverted()@Vector((0,0,-1)))
 assert ok,'WC roll overhangs the tank'
 support.append((base.matrix_world@p).z*100+1.05+1)
assert 0<=84.82-max(support)<.15,('Tank support mismatch',max(support))
print('PASS: WC roll rests at the curved cistern height',max(support),flush=True)
# Shelf footprints (cm): left/right edges and diagonal interior half-plane.
# Derived from wallData: shower-ne inner edge 68.2; closet front 615.2.
left=68.2;right=192;front=615.2;slope=-1/(3**.5)
rolls=[(left+12+(i%3)*12,front+30+(i//3)*12,5.5) for i in range(6)]
rolls += [(left+51+(i%2)*12.5,front+11+(i//2)*12.5,5.75) for i in range(4)]
for x,z,r in rolls:
 assert left<x-r and x+r<right and z-r>front
 # Circle-to-diagonal distance, rather than a cosmetic bounding-box clip.
 assert (547+slope*(x-316)-z)/(1+slope*slope)**.5>r,(x,z,'diagonal collision')
for i,(x,z,r) in enumerate(rolls):
 for xx,zz,rr in rolls[i+1:]:assert ((x-xx)**2+(z-zz)**2)**.5>r+rr
print('PASS: six WC and four towels clear shelf edges, diagonal and each other',flush=True)
import os
os._exit(0)
