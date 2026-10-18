"""Author red rigged bikini pieces in Lara's Blender source and export the third outfit."""
from pathlib import Path
import sys, math, importlib.util
sys.dont_write_bytecode=True
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'public/characters/lara'
bpy.ops.wm.open_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
arm=bpy.data.objects['Armature']
if '--inspect' in sys.argv:
 for obj in bpy.data.objects:
  if obj.type=='MESH' and obj.name.startswith('body_nude'):
   print('BODY_SHAPES',obj.name,[(k.name,k.value) for k in obj.data.shape_keys.key_blocks] if obj.data.shape_keys else [],flush=True)
 print('ARMATURE',list(arm.matrix_world),flush=True)
 for bone in arm.pose.bones:
  if any(k in bone.name for k in ['breast','thigh','pelvis']):print('POSE',bone.name,list(bone.matrix_basis),flush=True)
 raise SystemExit(0)
# Query the authored skin, with the same weight palette as the original body.
verts=[];triangles=[];weights=[]
for name in ['body_nude_torso','body_nude_legs','body_nude_panties','arms']:
 obj=bpy.data.objects[name];offset=len(verts);obj.data.calc_loop_triangles()
 for vertex in obj.data.vertices:
  verts.append(obj.matrix_world@vertex.co)
  weights.append({obj.vertex_groups[g.group].name:g.weight for g in vertex.groups if g.weight>0})
 triangles.extend(tuple(offset+i for i in tri.vertices) for tri in obj.data.loop_triangles)
tree=BVHTree.FromPolygons(verts,triangles,all_triangles=True)
material=bpy.data.materials.get('Bikini_Red') or bpy.data.materials.new('Bikini_Red')
material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=(.72,.0003,.001,1)
bsdf.inputs['Roughness'].default_value=.65
bsdf.inputs['Specular IOR Level'].default_value=.18
material.diffuse_color=(.72,.0003,.001,1)
collection=bpy.data.collections.get('Lara - Bikini')
if not collection:
 collection=bpy.data.collections.new('Lara - Bikini');bpy.context.scene.collection.children.link(collection)
for obj in list(collection.objects):bpy.data.objects.remove(obj,do_unlink=True)

def hit(origin,direction):
 p,n,tri,distance=tree.ray_cast(Vector(origin),Vector(direction))
 if p is None:raise RuntimeError(f'Bikini misses skin at {origin}, {direction}')
 if n.dot(Vector(direction))>0:n=-n
 return p+n*.004,tri,p

def front(x,z):return hit((x,-.5,z),(0,1,0))
def radial(theta,z):
 d=Vector((math.sin(theta),-math.cos(theta),0))
 return hit((d.x*.5,d.y*.5,z),-d)

def garment(name,patches):
 points=[];faces=[];samples=[]
 for rows in patches:
  start=len(points);height=len(rows);width=len(rows[0])
  for row in rows:
   for point,tri,skin in row:points.append(point);samples.append((tri,skin))
  for y in range(height-1):
   for x in range(width-1):
    i=start+y*width+x;faces.extend([(i,i+1,i+width+1),(i,i+width+1,i+width)])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],faces);mesh.update()
 obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj);obj.data.materials.append(material)
 # Match the source skin at each sample; the cups follow the breast bones too.
 for i,(tri,point) in enumerate(samples):
  ids=triangles[tri];a,b,c=[verts[j] for j in ids]
  bary=barycentric_transform(point,a,b,c,Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1)))
  influences={}
  for vertex,weight in zip(ids,bary):
   for bone,value in weights[vertex].items():influences[bone]=influences.get(bone,0)+max(0,weight)*value
  total=sum(influences.values());assert total>0
  for bone,value in influences.items():
   group=obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone)
   group.add([i],value/total,'REPLACE')
 modifier=obj.modifiers.new('Lara skeleton','ARMATURE');modifier.object=arm
 obj.parent=arm
 for polygon in mesh.polygons:polygon.use_smooth=True
 # Double-sided cloth exports cleanly without adding another skin shell.
 material.use_backface_culling=False
 obj['lara_outfit']='bikini';obj['lara_default_color']='red'
 print('BIKINI',name,len(points),'vertices',len(faces),'triangles',flush=True)
 return obj

def theta_for_x(x,z,side):
 low,high=0,math.pi/2
 for _ in range(28):
  middle=(low+high)/2
  if abs(radial(side*middle,z)[0].x)<x:low=middle
  else:high=middle
 return (low+high)/2

patches=[]
cup_tips={}
for side in [-1,1]:
 tip_left=theta_for_x(.086,1.4,side);tip_right=theta_for_x(.094,1.4,side)
 tip_center=(tip_left+tip_right)/2;tip_half=(tip_right-tip_left)/2
 rows=[]
 for row in range(25):
  v=row/24;z=1.235+v*.165;angle=side*(.55*(1-v)+tip_center*v);half=.45*(1-v)+tip_half*v
  rows.append([radial(angle+(column/24*2-1)*half,z) for column in range(25)])
 patches.append(rows)
 cup_tips[side]=[rows[-1][0],rows[-1][12],rows[-1][-1]]
# Under-bust band.
patches.append([[radial(column/96*2*math.pi,1.236+row/3*.012) for column in range(97)] for row in range(4)])
# Two shoulder straps, traced over the shoulder on the real skin.
for side in [-1,1]:
 rows=[]
 for row in range(57):
  angle=-2.25+row/56*4.5
  dy,dz=math.sin(angle),math.cos(angle)
  rows.append([hit((side*.09+(column/2-.5)*.008,dy*.5,1.34+dz*.5),(0,-dy,-dz)) for column in range(3)])
 # Start at the actual cup edge, removing the old dangling strap tail.
 tip=cup_tips[side]
 join=min(range(len(rows)//2),key=lambda i:(rows[i][1][0]-tip[1][0]).length_squared)
 connection=[tip]
 for row in range(1,8):
  strip=[]
  for column in range(3):
   target=tip[column][0].lerp(rows[join][column][0],row/8)
   strip.append(radial(math.atan2(target.x,-target.y),target.z))
  connection.append(strip)
 connection.append(rows[join])
 patches.extend([connection,rows[join:]])
 # Continue each back strap to the under-bust band.
 patches.append([[hit((side*.09+(column/2-.5)*.008,.5,1.24+row/16*.10),(0,-1,0)) for column in range(3)] for row in range(17)])
garment('bikini_top',patches)
rows=[]
for row in range(13):
 v=row/12;ring=[]
 for column in range(97):
  theta=column/96*2*math.pi;side=abs(math.sin(theta))
  low=.895+.115*side**1.45;high=1.015+.012*side**2
  ring.append(radial(theta,low+(high-low)*v))
 rows.append(ring)
# A smooth cloth bridge covers the groin without snapping to the separate thighs.
# Only the skin weights are sampled from the body; the fabric keeps its lofted shape.
front_y=front(0,.93)[2].y;back_y=hit((0,.5,.93),(0,-1,0))[2].y
profile=[]
for row in range(33):
 t=row/32;y=front_y+(back_y-front_y)*t
 centre,normal,tri,distance=tree.ray_cast(Vector((0,y,.6)),Vector((0,0,1)))
 if centre is None:raise RuntimeError(f'Missing groin surface at {y}')
 profile.append((centre,tri))
# Fit a continuous fabric curve underneath the skin, rather than reproducing
# every small anatomical fold in the centre-line ray intersections.
times=np.linspace(0,1,len(profile));skin_z=np.array([point.z for point,tri in profile])
curve=np.polyval(np.polyfit(times,skin_z,4),times)
curve-=np.max(curve-skin_z)+.004
assert np.all(curve<=skin_z-.004+1e-9)
crotch=[]
for row,(centre,tri) in enumerate(profile):
 strip=[]
 for column in range(17):
  u=column/16*2-1
  half_width=.018+.0195*math.sin(math.pi*row/32)**2
  target=Vector((u*half_width,centre.y,float(curve[row])-.002*u*u))
  strip.append((target,tri,centre))
 crotch.append(strip)
bottom=garment('bikini_bottom',[rows,crotch])
# Keep the central gusset on the pelvis when the thighs move independently.
gusset=list(range(len(rows)*len(rows[0]),len(bottom.data.vertices)))
for group in bottom.vertex_groups:group.remove(gusset)
(bottom.vertex_groups.get('pelvis') or bottom.vertex_groups.new(name='pelvis')).add(gusset,1,'REPLACE')
bpy.context.scene['lara_outfits']='clothed, bikini, nude'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
spec=importlib.util.spec_from_file_location('limbs',ROOT/'scripts/separate_lara_limb_uvs.py')
limbs=importlib.util.module_from_spec(spec);spec.loader.exec_module(limbs)
limbs.export()
print('Saved Lara with three outfits',flush=True)
