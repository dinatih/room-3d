"""Generate reusable paper-roll GLBs in metres, base at zero, using Blender Python.
Typical estimated dimensions: toilet paper Ø11 × 10 cm; towel Ø11.5 × 25 cm.
Hollow cardboard core, rolled end grain, embossed paper and a loose sheet edge.
"""
from pathlib import Path
import math
import os
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]


def material(name,color,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 return m


def detail(m,ends=False):
 n=256;img=bpy.data.images.new('Rolled paper end grain' if ends else 'Embossed cellulose fibres',width=n,height=n)
 img.colorspace_settings.name='Non-Color';pixels=[]
 for y in range(n):
  for x in range(n):
   u=(x+.5)/n;v=(y+.5)/n
   if ends:
    dx=u-.5;dy=v-.5;r=math.hypot(dx,dy);a=math.atan2(dy,dx)
    # 0.3 mm layer relief, with a slight spiral phase at the visible cut ends.
    wave=.13*math.sin(r*2*math.pi*160+a)
    nx=.5+wave*math.cos(a);ny=.5+wave*math.sin(a)
   else:
    nx=.5+.09*math.sin(u*math.pi*32)*math.cos(v*math.pi*32)
    ny=.5+.09*math.cos(u*math.pi*32)*math.sin(v*math.pi*32)
   pixels.extend((nx,ny,1,1))
 img.pixels.foreach_set(pixels);img.pack()
 tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
 normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.45
 m.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],m.node_tree.nodes.get('Principled BSDF').inputs['Normal'])


def generate(slug,radius,height):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 out=ROOT/'public/items'/slug;out.mkdir(parents=True,exist_ok=True)
 paper=material('Soft white cellulose',(.88,.865,.82),.96);detail(paper)
 end=material('Concentric paper layers',(.84,.825,.78),.98);detail(end,True)
 card=material('Brown cardboard core',(.32,.21,.12),1)
 # Closed annular cross-section; leave a real 3.8 cm opening all the way through.
 profile=[(.020,0), (radius-.0008,0),(radius,.0008),(radius,height-.0008),
          (radius-.0008,height),(.020,height),(.019,height),(.019,0)]
 count=128;verts=[];faces=[];uvfaces=[];mats=[]
 for r,z in profile:
  verts.extend((r*math.cos(i*2*math.pi/count),r*math.sin(i*2*math.pi/count),z) for i in range(count))
 for k in range(len(profile)):
  nextk=(k+1)%len(profile)
  for i in range(count):
   j=(i+1)%count;face=(k*count+i,k*count+j,nextk*count+j,nextk*count+i);faces.append(face)
   is_end=k in (0,4)
   mats.append(1 if is_end else (2 if k>=5 else 0))
   if is_end:uvfaces.append([(verts[a][0]/(2*radius)+.5,verts[a][1]/(2*radius)+.5) for a in face])
   else:uvfaces.append([(i/count,profile[k][1]/height),((i+1)/count,profile[k][1]/height),((i+1)/count,profile[nextk][1]/height),(i/count,profile[nextk][1]/height)])
 mesh=bpy.data.meshes.new('Hollow paper and cardboard roll');mesh.from_pydata(verts,[],faces);mesh.update()
 for m in (paper,end,card):mesh.materials.append(m)
 uv=mesh.uv_layers.new(name='Paper grain UV')
 for p,coords,index in zip(mesh.polygons,uvfaces,mats):
  p.material_index=index;p.use_smooth=index!=1
  for li,co in zip(p.loop_indices,coords):uv.data[li].uv=co
 o=bpy.data.objects.new(slug,mesh);bpy.context.collection.objects.link(o)
 # Thin loose terminal sheet overlaps the roll, with a lifted vertical edge.
 pts=[]
 for z in (.001,height-.001):
  for i in range(17):
   a=-.9+.32*i/16;r=radius+.0003+.0015*(i/16)**3
   pts.append((r*math.cos(a),r*math.sin(a),z))
 mesh=bpy.data.meshes.new('Loose terminal sheet');mesh.from_pydata(pts,[],[(i,i+1,i+18,i+17) for i in range(16)]);mesh.update();mesh.materials.append(paper)
 flap=bpy.data.objects.new('Free paper edge',mesh);bpy.context.collection.objects.link(flap)
 for p in mesh.polygons:p.use_smooth=True
 uv=mesh.uv_layers.new(name='Paper UV')
 for loop in mesh.loops:uv.data[loop.index].uv=((loop.vertex_index%17)/16,loop.vertex_index//17)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(out/f'{slug}.glb'),export_format='GLB',use_selection=True)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
 scene.render.resolution_x=scene.render.resolution_y=560;scene.render.resolution_percentage=100
 scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.24,.24,.24)
 target=Vector((0,0,height/2));span=max(height,2*radius)*1.7
 for loc,power in [((-.4,-.5,.6),22),((.4,.3,.5),16)]:
  bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=.4
  lamp.rotation_euler=(target-lamp.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=span
 for name,direction in [('front',(0,-2,1)),('three-quarter',(1.3,-2,1.8)),('back',(-1,2,1.6))]:
  scene.camera.location=target+Vector(direction)*span
  scene.camera.rotation_euler=(target-scene.camera.location).to_track_quat('-Z','Y').to_euler()
  scene.render.filepath=str(out/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
 print('EXPORTED',slug,'metres',2*radius,height,flush=True)


generate('toilet-paper-roll',.055,.10)
generate('paper-towel-roll',.0575,.25)
os._exit(0)
