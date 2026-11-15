"""Create the editable laptop from the decoded CAD, configure ports, cull hidden faces.

blender -b -noaudio -t 4 --python scripts/configure-framework-laptop.py -- source.glb
The original CAD is retained in a hidden collection. Only Export is exported.
Coordinates in Blender: +X right, +Y hinge, +Z up, metres.
"""
import bpy,bmesh,math,json,os,sys,itertools,time
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/items/framework-laptop13'
AUDIT=ROOT/'test-results/laptop-authoring'
AUDIT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(sys.argv[sys.argv.index('--')+1]).resolve()))
bpy.context.view_layer.update()
source=bpy.data.collections.new('CAD reference — original (not exported)');bpy.context.scene.collection.children.link(source)
working=bpy.data.collections.new('Export');bpy.context.scene.collection.children.link(working)
original=list(bpy.context.scene.objects)
# Keep a completely independent editable CAD reference.
for o in original:
 for collection in list(o.users_collection):collection.objects.unlink(o)
 source.objects.link(o)
lookup={}
for o in original:
 c=o.copy()
 if o.type=='MESH':c.data=o.data.copy()
 working.objects.link(c);lookup[o]=c
for o,c in lookup.items():
 c.parent=lookup.get(o.parent)
 c.matrix_parent_inverse=o.matrix_parent_inverse.copy();c.matrix_basis=o.matrix_basis.copy()
source.hide_render=True;source.hide_viewport=True
# Free original names for the editable copy (export identifiers remain predictable).
for o in original:o.name='CAD '+o.name
for o,c in lookup.items():c.name=o.name.removeprefix('CAD ')
bpy.context.view_layer.update()
def material(name,color,roughness):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1)
 bs.inputs['Roughness'].default_value=roughness;bs.inputs['Metallic'].default_value=0
 return m
# sRGB #cc0000 converted to scene-linear, matching Three.Color(0xcc0000).
red=(0.6038273389,0,0)
card=material('Framework matte red',red,.7);bezel=card
def group(name):return next(o for o in working.objects if o.name=='occurrence of GFW00_3H_NB_ID_'+name+'_CARD_1')
def points(o):return [c.matrix_world@Vector(p) for c in [o]+list(o.children_recursive) if c.type=='MESH' for p in c.bound_box]
def center(o):
 p=points(o);return Vector([(min(v[i] for v in p)+max(v[i] for v in p))/2 for i in range(3)])
ports={name:group(name) for name in ['HDMI','SD','USBA','USBC']}
centers={k:center(v) for k,v in ports.items()}
def place(o,target,rotation=0):
 old=center(o);o.matrix_world=Matrix.Translation(target)@Matrix.Rotation(rotation,4,'Z')@Matrix.Translation(-old)@o.matrix_world
 bpy.context.view_layer.update()
def rename(o,name):
 o['original_cad_name']=o.name;o.name=name
 for i,c in enumerate(o.children_recursive):c.name=f'{name}_part_{i}'
usbc=ports['SD'];duplicate=usbc.copy();working.objects.link(duplicate)
for child in list(usbc.children_recursive):
 assert child.parent==usbc,'Audit nested card hierarchy before duplicating'
 copy=child.copy();copy.data=child.data.copy();working.objects.link(copy);copy.parent=duplicate
 copy.matrix_parent_inverse=child.matrix_parent_inverse.copy();copy.matrix_basis=child.matrix_basis.copy()
bpy.context.view_layer.update()
place(usbc,centers['USBC']);place(duplicate,centers['HDMI'],math.pi)
place(ports['HDMI'],centers['USBA']);place(ports['USBA'],centers['SD'],math.pi)
for o in [ports['USBC']]+list(ports['USBC'].children_recursive):bpy.data.objects.remove(o,do_unlink=True)
for root,name in [(usbc,'USB_C_Rear_Right'),(duplicate,'USB_C_Rear_Left'),(ports['HDMI'],'HDMI_Front_Left'),(ports['USBA'],'USB_A_Front_Right')]:
 rename(root,'Expansion_'+name)
 if 'USB_C' in name:
  for o in root.children_recursive:
   if o.type=='MESH':o.data.materials.clear();o.data.materials.append(card)
bezel_obj=next(o for o in working.objects if o.name=='GFW00_3H_NB_ID_BEZEL_1_3')
bezel_obj.data.materials.clear();bezel_obj.data.materials.append(bezel)
bpy.context.view_layer.update()
# Explicitly bake the former screen/logo face correction in the authoring mesh.
# CAD local Z faces: screen keeps front, cover logo keeps back.
for name,sign in [('GFW00_3H_NB_ID_BEZEL_1_1',1),('GFW00_3H_NB_ID_COVER_LOGO_1',-1)]:
 o=next(o for o in working.objects if o.name==name)
 bm=bmesh.new();bm.from_mesh(o.data)
 # The importer retains CAD-local coordinates in the mesh; its Y-up/Z-up
 # conversion is carried by the object hierarchy.
 remove=[f for f in bm.faces if sign*f.normal.z <= -.5]
 bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(o.data);bm.free()
# Camera/light rig lives outside Export.
rig=bpy.data.collections.new('Preview rig (not exported)');bpy.context.scene.collection.children.link(rig)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8
scene.render.resolution_x=850;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.world=bpy.data.worlds.new('Preview world');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.5,.5,.5,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
scene.render.film_transparent=True
for position,power,size in [((.1,-.2,.6),2.45,.5),((-.5,.2,.3),1.4,.4)]:
 data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.shape='DISK';data.size=size
 o=bpy.data.objects.new('Softbox',data);rig.objects.link(o);o.location=position
 o.rotation_euler=(Vector((0,.1,.05))-o.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Preview');camera=bpy.data.objects.new('Preview',data);rig.objects.link(camera);scene.camera=camera
data.type='ORTHO';data.ortho_scale=.49
views={'front':(0,-.5,.30),'three-quarter':(.42,-.38,.30),'back':(-.36,.46,.30),'underside':(.25,-.25,-.35)}
def render(label):
 for name,pos in views.items():
  camera.location=pos;camera.rotation_euler=(Vector((0,.105,.085))-camera.location).to_track_quat('-Z','Y').to_euler()
  scene.render.filepath=str(AUDIT/f'{label}-{name}.png');bpy.ops.render.render(write_still=True)
render('before')
# Visibility audit over the complete configured model. Preserve any triangle for
# which a ray escapes from its centre or inset corners in one of 26 directions,
# or either face-normal direction. This samples exterior visibility; cavities
# and grazing angles require the saved before/after image checks.
meshes=[o for o in working.objects if o.type=='MESH']
vertices=[];faces=[];owners=[]
for o in meshes:
 offset=len(vertices);vertices.extend(o.matrix_world@v.co for v in o.data.vertices)
 for p in o.data.polygons:faces.append(tuple(offset+i for i in p.vertices));owners.append((o,p.index))
bvh=BVHTree.FromPolygons(vertices,faces,all_triangles=True)
directions=[Vector(d).normalized() for d in itertools.product([-1,0,1],repeat=3) if any(d)]
# Epsilon is relative to the CAD extent, solely to avoid self-intersections.
span=max(max(v[i] for v in vertices)-min(v[i] for v in vertices) for i in range(3));epsilon=span*1e-7
hidden={o:[] for o in meshes};started=time.monotonic()
for index,face in enumerate(faces):
 a,b,c=(vertices[i] for i in face);mid=(a+b+c)/3;normal=(b-a).cross(c-a).normalized()
 visible=False
 for direction in [normal,-normal]+directions:
  if bvh.ray_cast(mid+direction*epsilon,direction)[0] is None:visible=True;break
 if not visible:
  for vertex in (a,b,c):
   point=vertex.lerp(mid,.01)
   for direction in directions:
    if bvh.ray_cast(point+direction*epsilon,direction)[0] is None:visible=True;break
   if visible:break
 if not visible:
  o,polygon=owners[index];hidden[o].append(polygon)
 if index%20000==0:print('Visibility',index,'/',len(faces),flush=True)
rows=[]
for o,indices in hidden.items():
 if not indices:continue
 rows.append({'object':o.name,'before':len(o.data.polygons),'removed':len(indices)})
 bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table()
 bmesh.ops.delete(bm,geom=[bm.faces[i] for i in indices],context='FACES');bm.to_mesh(o.data);bm.free()
 if not o.data.polygons:bpy.data.objects.remove(o,do_unlink=True)
report={'before_triangles':len(faces),'removed_triangles':sum(r['removed'] for r in rows),'objects':rows,'audit_seconds':time.monotonic()-started}
(AUDIT/'visibility.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
render('after')
# Dissolve only effectively coplanar subdivisions, respecting material/normal boundaries.
for o in list(working.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o
 modifier=o.modifiers.new('Dissolve coplanar CAD subdivisions','DECIMATE')
 modifier.decimate_type='DISSOLVE';modifier.angle_limit=1e-5;modifier.delimit={'MATERIAL','NORMAL'}
 bpy.ops.object.modifier_apply(modifier=modifier.name)
 o.data.calc_loop_triangles()
scene['optimized_triangles']=sum(len(o.data.loop_triangles) for o in working.objects if o.type=='MESH')
render('final')
# Keep source geometry and the deleted geometry recoverable in the original collection.
scene['port_layout']='Viewed from keyboard: rear left/right USB-C red; front left HDMI; front right USB-A'
scene['visibility_audit']=json.dumps(report)
bpy.ops.object.select_all(action='DESELECT')
for o in working.objects:o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in working.objects if o.type=='MESH')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'framework-laptop13.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(AUDIT/'configured.glb'),export_format='GLB',use_selection=True,export_extras=True)
sys.stdout.flush();os._exit(0)
