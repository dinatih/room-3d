"""Four Amazon toiletries, mesh reconstruction from the user's Chrome photographs.
No cardboard cartons or multipack wrapping. All GLBs represent ONE bottle/tube.
Metres, floor at Z=0, front=-Y. Tube/cap dimensions are estimated without boxes.
Run: blender -b -t 4 --python-exit-code 1 --python scripts/generate-bathroom-amazon-products.py
"""
from pathlib import Path
import json
import math
import os
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
ITEMS=json.loads((ROOT/'scripts/bathroom-amazon-products.json').read_text())


def material(name,color,rough=.3):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 return m


def box(name,dims,loc,bevel,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 b=o.modifiers.new('Rounded injection moulding','BEVEL');b.width=bevel;b.segments=5;bpy.ops.object.modifier_apply(modifier=b.name)
 n=o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=n.name)
 return o


def shell(name,profile,m):
 n=96;verts=[];faces=[]
 for z,rx,ry in profile:
  verts.extend((rx*math.sin(2*math.pi*i/n),-ry*math.cos(2*math.pi*i/n),z) for i in range(n))
 for j in range(len(profile)-1):
  for i in range(n):
   a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 faces.extend([tuple(reversed(range(n))),tuple((len(profile)-1)*n+i for i in range(n))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in mesh.polygons:p.use_smooth=len(p.vertices)==4
 return o


def photo_surface(folder,file,rows,mapping,back=False,flat=False):
 image=bpy.data.images.load(str(folder/file));image.pack();w,h=image.size
 m=material('Photographic product printing',(1,1,1),.44)
 tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
 uvnode=m.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='Exact printed artwork UV'
 m.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
 m.node_tree.links.new(tex.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 verts=[];uv=[];n=48
 for j,(z,rx,ry) in enumerate(rows):
  for i in range(n+1):
   t=i/n;a=(t-.5)*math.pi*.9
   x=rx*math.sin(a);y=-ry if flat else -ry*math.cos(a)
   if back:x=-x;y=-y
   verts.append((x,y,z));px,py=mapping(z,math.sin(a)/math.sin(math.pi*.45))
   uv.append((px/w,1-py/h))
 faces=[]
 for j in range(len(rows)-1):
  for i in range(n):
   a=j*(n+1)+i;faces.append((a,a+1,a+n+2,a+n+1))
 mesh=bpy.data.meshes.new('Curved photographed label');mesh.from_pydata(verts,[],faces);mesh.update();layer=mesh.uv_layers.new(name='Exact printed artwork UV')
 for loop in mesh.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
 o=bpy.data.objects.new('Back printing' if back else 'Front printing',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in mesh.polygons:p.use_smooth=True


def linear_rows(z0,z1,rx,ry):return [(z0+(z1-z0)*j/24,rx,ry) for j in range(25)]


for item in ITEMS:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 key=item['id'];folder=ROOT/'public/items'/key
 black=material('Satin black polypropylene',(.007,.008,.01),.28)
 white=material('White plastic',(.9,.91,.91),.32)
 if key=='axe-cherry-fizz-rollon':
  shell('Tapered 50 ml roll-on bottle',[(0,.0155,.0155),(.003,.0175,.0175),(.012,.018,.018),(.058,.022,.022),(.073,.0225,.0225),(.075,.022,.022)],black)
  shell('Rounded removable cap',[(.0755,.022,.022),(.079,.0225,.0225),(.092,.0205,.0205),(.103,.017,.017),(.107,.012,.012)],black)
  rows=[]
  for j in range(25):
   z=.012+.056*j/24;r=.018+(z-.012)/(.058-.012)*.004 if z<.058 else .022+(z-.058)/.015*.0005
   rows.append((z,r+.00015,r+.00015))
  # Exclude the oversized 50 ml infographic badge from the photo's lower right.
  photo_surface(folder,'product-1.jpg',rows,lambda z,u:(282+u*250,1190-(z-.012)/.056*630))
  photo_surface(folder,'product-2.jpg',rows,lambda z,u:(282+u*225,1240-(z-.012)/.056*600),True)
 elif key=='axe-ultime-cherry-fizz':
  red=material('Cherry red bottle',(.63,.025,.033),.29)
  box('Rounded 225 ml gel bottle',(.073,.04,.141),(0,0,.0705),.012,red)
  # The cap's lower border forms the photographed deep V; it is a 3D prism.
  outline=[(-.0365,.132),(0,.121),(.0365,.132),(.0365,.154),(0,.159),(-.0365,.154)]
  vs=[(x,y,z) for y in (-.0201,.0201) for x,z in outline];n=len(outline)
  fs=[tuple(reversed(range(n))),tuple(n+i for i in range(n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
  mesh=bpy.data.meshes.new('V shaped flip cap');mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new('Angular black flip top',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(black)
  bevel=o.modifiers.new('Moulded cap edge','BEVEL');bevel.width=.001;bevel.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
  # Narrow flat print on the broad flat face, never a second bottle or carton.
  rows=linear_rows(.018,.110,.024,.02025)
  photo_surface(folder,'product-2.jpg',rows,lambda z,u:(343+u*198,1330-(z-.018)/.092*865),flat=True)
 else:
  signal=key.startswith('signal');height=.185 if signal else .177
  capheight=.024 if signal else .019;capr=.0125
  shell('Ribbed screw cap',[(0,capr-.0005,capr-.0005),(.001,capr,capr),(capheight-.001,capr,capr),(capheight,capr-.0005,capr-.0005)],white)
  # Rib geometry runs along the screw cap; a cap/base and a sealed crimp remain.
  for i in range(48):
   angle=i*2*math.pi/48
   bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.00022,depth=capheight-.002,location=(capr*math.sin(angle),-capr*math.cos(angle),capheight/2))
   bpy.context.object.name='Cap grip rib';bpy.context.object.data.materials.append(white)
  profile=[(capheight,.0095,.0095),(capheight+.006,.014,.012),(.055,.018,.013),(.115,.020,.009),(height-.009,.0215,.0015),(height-.003,.0215,.0008)]
  shell('Soft laminate toothpaste tube',profile,white)
  box('Heat sealed crimp',(.043,.002,.003),(0,0,height-.0015),.0006,white)
  for i in range(20):
   box('Crimp embossing',(.00045,.0022,.002),(-.019+i*.002,0,height-.0015),.00015,white)
  # Interpolate the printing to match the tube's 3D taper and flattened seal.
  rows=[]
  for (za,xa,ya),(zb,xb,yb) in zip(profile,profile[1:]):
   for j in range(8):
    t=j/8;rows.append((za+(zb-za)*t,xa+(xb-xa)*t+.00012,ya+(yb-ya)*t+.00012))
  rows.append((profile[-1][0],profile[-1][1]+.00012,profile[-1][2]+.00012))
  if signal:
   # Actual tube photographs (4/5); source X is the tube's longitudinal axis.
   def mapping(z,u):return (120+(z-capheight)/(height-.003-capheight)*910,113+u*99)
   photo_surface(folder,'product-4.jpg',rows,mapping)
   photo_surface(folder,'product-5.jpg',rows,mapping,True)
  else:
   # Tube isolated by UV projection from the lifestyle photo, excluding the box.
   def mapping(z,u):
    t=(z-capheight)/(height-.003-capheight)
    return (1210+u*(110+70*t),1260-t*1100)
   photo_surface(folder,'product-2.jpg',rows,mapping)
 # Single-product asset only, before studio lights/floor/camera exist.
 bpy.ops.object.select_all(action='SELECT')
 bpy.context.view_layer.objects.active=next(o for o in bpy.context.scene.objects if o.type=='MESH')
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 bpy.ops.object.join();bpy.context.object.name=key
 bpy.ops.export_scene.gltf(filepath=str(folder/f'{key}.glb'),export_format='GLB',use_selection=True)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 pts=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
 lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
 item['dims']={k:round(v*100,2) for k,v in zip(('w','d','h'),hi-lo)}
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
 scene.render.resolution_x=520;scene.render.resolution_y=620;scene.render.resolution_percentage=100
 scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.3,.3,.3)
 h=hi.z;target=Vector((0,0,h/2))
 for direction,power in [((-1.5,-2,3),280),((2,1,2),200)]:
  bpy.ops.object.light_add(type='AREA',location=Vector(direction)*h);o=bpy.context.object;o.data.energy=power*h*h;o.data.size=h*1.6
  o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=h*1.25
 for view,direction in [('front',(0,-3,.7)),('three-quarter',(1.5,-3,1)),('back',(-1,3,.9))]:
  scene.camera.location=target+Vector(direction)*h;scene.camera.rotation_euler=(target-scene.camera.location).to_track_quat('-Z','Y').to_euler()
  scene.render.filepath=str(folder/f'preview-{view}.png');bpy.ops.render.render(write_still=True)
 print('GENERATED',key,item['dims'],flush=True)
(ROOT/'scripts/bathroom-amazon-products.json').write_text(json.dumps(ITEMS,ensure_ascii=False,indent=2)+'\n')
os._exit(0)
