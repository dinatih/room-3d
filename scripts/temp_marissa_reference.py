"""Author red rigged bikini pieces in Lara's Blender source and export the third outfit."""
from pathlib import Path
import sys, math, importlib.util
sys.dont_write_bytecode=True
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'public/characters/lara'
bpy.ops.wm.open_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
arm=bpy.data.objects['Armature']
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
bsdf.inputs['Base Color'].default_value=(.65,.008,.025,1)
bsdf.inputs['Roughness'].default_value=.82
material.diffuse_color=(.65,.008,.025,1)
collection=bpy.data.collections.get('Lara - Bikini')
if not collection:
 collection=bpy.data.collections.new('Lara - Bikini');bpy.context.scene.collection.children.link(collection)
for obj in list(collection.objects):bpy.data.objects.remove(obj,do_unlink=True)

def hit(origin,direction):
 p,n,tri,distance=tree.ray_cast(Vector(origin),Vector(direction))
 if p is None:raise RuntimeError(f'Bikini misses skin at {origin}, {direction}')
 if n.dot(Vector(direction))>0:n=-n
 return p+n*.0018,tri,p

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

patches=[]
for side in [-1,1]:
 rows=[]
 for row in range(25):
  v=row/24;z=1.235+v*.165;angle=side*(.55+v*.35);half=.45*(1-v)+.04*v
  rows.append([radial(angle+(column/24*2-1)*half,z) for column in range(25)])
 patches.append(rows)
# Under-bust band.
patches.append([[radial(column/96*2*math.pi,1.236+row/3*.012) for column in range(97)] for row in range(4)])
# Two shoulder straps, traced over the shoulder on the real skin.
for side in [-1,1]:
 rows=[]
 for row in range(57):
  angle=-2.25+row/56*4.5
  dy,dz=math.sin(angle),math.cos(angle)
  rows.append([hit((side*.09+(column/2-.5)*.008,dy*.5,1.34+dz*.5),(0,-dy,-dz)) for column in range(3)])
 patches.append(rows)
 # Continue each back strap to the under-bust band.
 patches.append([[hit((side*.09+(column/2-.5)*.008,.5,1.24+row/16*.10),(0,-1,0)) for column in range(3)] for row in range(17)])
garment('bikini_top',patches)
rows=[]
for row in range(13):
 v=row/12;ring=[]
 for column in range(97):
  theta=column/96*2*math.pi;side=abs(math.sin(theta))
  low=.895+.115*side**.9;high=1.015+.012*side**2
  ring.append(radial(theta,low+(high-low)*v))
 rows.append(ring)
# Close the underside between the front and back panels.
front_y=radial(0,.895)[0].y;back_y=radial(math.pi,.895)[0].y
crotch=[]
for row in range(17):
 strip=[]
 for column in range(7):
  target=Vector(((column/6-.5)*.035,front_y+(back_y-front_y)*row/16,.885))
  point,normal,tri,distance=tree.find_nearest(target)
  if normal.z>0:normal=-normal
  strip.append((point+normal*.0018,tri,point))
 crotch.append(strip)
garment('bikini_bottom',[rows,crotch])
bpy.context.scene['lara_outfits']='clothed, bikini, nude'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
spec=importlib.util.spec_from_file_location('limbs',ROOT/'scripts/separate_lara_limb_uvs.py')
limbs=importlib.util.module_from_spec(spec);spec.loader.exec_module(limbs)
limbs.export()
print('Saved Lara with three outfits',flush=True)
