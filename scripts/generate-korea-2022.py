"""2022 Korea home jersey, INYEONG 24, genuine baked Blender Cloth.
Run korea-2022-textures.py first, then blender -b --python-exit-code 1 --python this_file.
"""
from pathlib import Path
import math,json,os
import bpy,bmesh
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/items/korea-2022-inyeong'
bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.88
 return m
mats=[]
for side in ['front','back']:
 m=material('2022 polyester '+side,(.7,.01,.025));image=bpy.data.images.load(str(OUT/f'{side}-artwork.png'));image.pack()
 t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=image;m.node_tree.links.new(t.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);mats.append(m)
black=material('Black knitted polo collar',(.009,.009,.012));mats.append(black)
step=.012
# Raglan shirt with a shallow polo opening. Shoulder width / torso estimated.
outline=[(-.27,0),(.27,0),(.27,.43),(.39,.39),(.42,.54),(.27,.675),(.095,.705),(.06,.665),(0,.64),(-.06,.665),(-.095,.705),(-.27,.675),(-.42,.54),(-.39,.39),(-.27,.43)]
def inside(x,z):
 hit=False
 for (a,b),(c,d) in zip(outline,outline[1:]+outline[:1]):
  if (b>z)!=(d>z) and x<(c-a)*(z-b)/(d-b)+a:hit=not hit
 return hit
cells=[(i,j) for j in range(60) for i in range(70) if inside(-.42+(i+.5)*step,(j+.5)*step)]
nodes=sorted({p for i,j in cells for p in ((i,j),(i+1,j),(i+1,j+1),(i,j+1))});ids={p:i for i,p in enumerate(nodes)};n=len(nodes)
verts=[(-.42+i*step,side*.012+.001*math.sin(i*.7+j*.4),j*step) for side in (-1,1) for i,j in nodes]
front=[tuple(ids[p] for p in ((i,j),(i+1,j),(i+1,j+1),(i,j+1))) for i,j in cells]
faces=front+[tuple(i+n for i in reversed(f)) for f in front];counts={}
for face in front:
 for a,b in zip(face,face[1:]+face[:1]):
  key=tuple(sorted((a,b)));counts[key]=counts.get(key,0)+1
for (a,b),count in counts.items():
 if count!=1:continue
 x=(verts[a][0]+verts[b][0])/2;z=(verts[a][2]+verts[b][2])/2
 if not (z<step or (abs(x)<.105 and z>.62) or abs(x)>.38):faces.append((b,a,a+n,b+n))
collar_start=len(faces)
mesh=bpy.data.meshes.new('Continuous sewn polyester shell');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Korea 2022 INYEONG 24 — Cloth',mesh);bpy.context.collection.objects.link(o)
for m in mats:mesh.materials.append(m)
for face in mesh.polygons:
 face.material_index=0 if face.index<len(front) else 1
 x=sum(mesh.vertices[i].co.x for i in face.vertices)/len(face.vertices);z=sum(mesh.vertices[i].co.z for i in face.vertices)/len(face.vertices)
 # Polo collar wings are sewn into the neckline and move with the cloth.
 if face.index>=collar_start:face.material_index=2
uv=mesh.uv_layers.new(name='Sewing pattern artwork')
for face in mesh.polygons:
 for li in face.loop_indices:
  p=mesh.vertices[mesh.loops[li].vertex_index].co
  x=p.x if face.material_index!=1 else -p.x
  uv.data[li].uv=(x/.84+.5,p.z/.72)
bpy.context.view_layer.objects.active=o;o.select_set(True)
smooth=o.modifiers.new('Relax cut edges','SMOOTH');smooth.factor=.5;smooth.iterations=3;bpy.ops.object.modifier_apply(modifier=smooth.name)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
# Support shoulder patches on the hanger, not an inflated mannequin.
pins=[v.index for v in mesh.vertices if v.index<2*n and .13<abs(v.co.x)<.20 and v.co.z>.67]
assert pins,'Missing shoulder support'
g=o.vertex_groups.new(name='Shoulders resting on SPRUTTIG');g.add(pins,1,'REPLACE')
cloth=o.modifiers.new('Polyester gravity and self collision','CLOTH');s=cloth.settings
s.quality=8;s.mass=.14;s.air_damping=4;s.tension_stiffness=30;s.compression_stiffness=30;s.shear_stiffness=12;s.bending_stiffness=.04
s.vertex_group_mass=g.name;s.pin_stiffness=1
c=cloth.collision_settings;c.use_self_collision=True;c.self_distance_min=.0015;c.distance_min=.0015;c.collision_quality=3
scene=bpy.context.scene;scene.frame_end=90;cloth.point_cache.frame_start=1;cloth.point_cache.frame_end=90
for frame in range(1,91):
 scene.frame_set(frame)
 if frame%15==0:print('CLOTH KOREA',frame,flush=True)
deps=bpy.context.evaluated_depsgraph_get();baked=bpy.data.meshes.new_from_object(o.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps);o.modifiers.clear();o.data=baked
sub=o.modifiers.new('Soft fabric surface','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
solid=o.modifiers.new('Thin polyester shell','SOLIDIFY');solid.thickness=.0006;bpy.ops.object.modifier_apply(modifier=solid.name)
for f in o.data.polygons:f.use_smooth=True
# Reinforced fold-over polo collar: sewn facing keeps its tailored shape.
# Unlike the thin jersey, this doubled rib knit should not collapse into ruffles.
collar_verts=[];collar_faces=[]
for sign in (-1,1):
 base=len(collar_verts)
 collar_verts.extend([(sign*.105,-.018,.697),(sign*.015,-.034,.681),(sign*.045,-.043,.635),(sign*.115,-.030,.658)])
 collar_faces.append(tuple(base+i for i in range(4)))
for i in range(25):
 t=math.pi*i/24
 x=.105*math.cos(t);y=.022*math.sin(t)
 collar_verts.extend([(x,y,.680),(x,y+.005,.716)])
 if i:collar_faces.append((8+2*(i-1),8+2*i,9+2*i,9+2*(i-1)))
cm=bpy.data.meshes.new('Structured folded black polo facing');cm.from_pydata(collar_verts,[],collar_faces);cm.update()
collar=bpy.data.objects.new('Black polo collar',cm);bpy.context.collection.objects.link(collar);cm.materials.append(black)
bpy.context.view_layer.objects.active=collar
solid=collar.modifiers.new('Double rib knit thickness','SOLIDIFY');solid.thickness=.0012;bpy.ops.object.modifier_apply(modifier=solid.name)
for f in collar.data.polygons:f.use_smooth=True
# The original physical hanger is included in the asset, hook above collar.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/items/spruttig20317079/Spruttig20317079.glb'))
hangers=[h for h in bpy.context.selected_objects if h.type=='MESH']
for h in hangers:
 h.data.transform(h.matrix_world);h.matrix_world=Matrix.Identity(4)
 # Lower shoulder rail at .59 m; hook crown at .78 m.
 h.location.z=.59
objects=[o,collar]+hangers
bpy.context.view_layer.update()
points=[obj.matrix_world@v.co for obj in objects for v in obj.data.vertices]
lo,hi=[Vector([f(p[i] for p in points) for i in range(3)]) for f in (min,max)]
for obj in objects:obj.location+=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'Korea2022Inyeong.glb'),export_format='GLB',use_selection=True)
report={'dimensionsCm':{'w':round((hi.x-lo.x)*100,3),'d':round((hi.y-lo.y)*100,3),'h':round((hi.z-lo.z)*100,3)},'simulation':{'solver':'Blender Cloth','frames':90,'shoulderPinnedVertices':len(pins),'selfCollision':True},'reference':'Nike Korea home 2022/23, black tiger crest; personalized INYEONG 24'}
(OUT/'model-report.json').write_text(json.dumps(report,indent=2)+'\n')
# Save the editable baked result, then offline front / 3/4 / back inspection.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Korea2022Inyeong.blend'))
center=Vector((0,0,(hi.z-lo.z)/2));span=max(hi-lo)
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.render.resolution_x=scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.33,.33,.33)
for v in [(-1,-2,3),(2,1,2)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(v)*span);h=bpy.context.object;h.data.energy=180*span**2;h.data.size=span*2;h.rotation_euler=(center-h.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=span*1.35
for name,direction in [('front',(0,-3,.1)),('three-quarter',(1.2,-3,.5)),('back',(0,3,.1))]:
 cam.location=center+Vector(direction)*span;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
print(report,flush=True);os._exit(0)
