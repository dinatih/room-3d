"""Rebuild three photo-referenced cleaning accessories with Blender.
Run: blender -b --python-exit-code 1 --python scripts/generate-cleaning-accessories.py
GLB metres, Y up, base zero. IKEA dimensions verified; sponge/brush estimated.
References and pricing are recorded in docs/cleaning-accessories.md.
"""
from pathlib import Path
import math
import json
import struct
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/items/cleaning-accessories'
OUT.mkdir(parents=True, exist_ok=True)

def mat(name, color, rough=.4):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough
    return m

def box(name, size, loc, material, bevel=.001):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(material)
    if bevel:
        m=o.modifiers.new('Soft moulded edges','BEVEL'); m.width=bevel; m.segments=2; bpy.ops.object.modifier_apply(modifier=m.name)
        m=o.modifiers.new('Face normals','WEIGHTED_NORMAL'); bpy.ops.object.modifier_apply(modifier=m.name)
    return o

def mesh(name, verts, faces, material):
    m=bpy.data.meshes.new(name); m.from_pydata(verts,[],faces); m.update(); o=bpy.data.objects.new(name,m); bpy.context.collection.objects.link(o); m.materials.append(material); return o

def sphere(name, loc, size, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,location=loc); o=bpy.context.object; o.name=name; o.scale=size; o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth=True
    return o

def cyl(name, radius, depth, loc, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=radius,depth=depth,location=loc); o=bpy.context.object; o.name=name; o.data.materials.append(material); return o

def finish(slug, target, scale):
    # Join by motion root: each material becomes one draw call per root.
    roots={obj.parent for obj in bpy.context.scene.objects if obj.type=='MESH'}
    for parent in roots:
        meshes=[obj for obj in bpy.context.scene.objects if obj.type=='MESH' and obj.parent==parent]
        bpy.ops.object.select_all(action='DESELECT')
        for obj in meshes: obj.select_set(True)
        bpy.context.view_layer.objects.active=meshes[0]
        bpy.ops.object.join()
    objects=list(bpy.context.scene.objects)
    for obj in objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active=obj
            bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{slug}.glb'),export_format='GLB',use_selection=True)
    # glTF alpha MASK avoids transparency sorting and extra blended passes.
    path=OUT/f'{slug}.glb'
    data=path.read_bytes(); length=struct.unpack_from('<I',data,12)[0]
    document=json.loads(data[20:20+length])
    for material in document.get('materials',[]):
        if material['name']=='White perforated plastic':
            material['alphaMode']='MASK'; material['alphaCutoff']=.5
    payload=json.dumps(document,separators=(',',':')).encode()
    payload+=b' '*((-len(payload))%4)
    tail=data[20+length:]
    path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(payload)+len(tail))+struct.pack('<II',len(payload),0x4e4f534a)+payload+tail)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{slug}.blend'))
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=12
    scene.render.resolution_x=480; scene.render.resolution_y=480; scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Studio'); scene.world.color=(.35,.35,.35)
    box('Preview floor',(200,200,.002),(0,0,-.001),mat('Floor',(.18,.19,.21)),0)
    for loc,power in [((-.4,-.5,.8),35),((.4,.3,.6),25)]:
        bpy.ops.object.light_add(type='AREA',location=loc); o=bpy.context.object; o.data.energy=power; o.data.size=.5; o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(); scene.camera=bpy.context.object; scene.camera.data.type='ORTHO'; scene.camera.data.ortho_scale=scale
    for view,loc in [('front',(0,-.8,.4)),('three-quarter',(.5,-.8,.55)),('back',(.4,.8,.45))]:
        scene.camera.location=loc; scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=str(OUT/f'{slug}-{view}.png'); bpy.ops.render.render(write_still=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
white=mat('White polypropylene',(.88,.88,.85))
# One reusable alpha-cutout cell, packed in the GLB; actual holes without geometry.
perforated=mat('White perforated plastic',(.88,.88,.85))
image=bpy.data.images.new('Circular ventilation alpha',width=128,height=128,alpha=True)
pixels=[]
for y in range(128):
    for x in range(128):
        hole=((x+.5)/128-.5)**2+((y+.5)/128-.5)**2 < .21**2
        pixels.extend((.945,.945,.93,0 if hole else 1))
image.pixels.foreach_set(pixels); image.pack()
nodes=perforated.node_tree.nodes; links=perforated.node_tree.links
tex=nodes.new('ShaderNodeTexImage'); tex.image=image
shader=nodes.get('Principled BSDF'); links.new(tex.outputs['Color'],shader.inputs['Base Color']); links.new(tex.outputs['Alpha'],shader.inputs['Alpha'])
perforated.surface_render_method='DITHERED'
perforated.use_backface_culling=False

def panel(axis,sign,length,halfdepth,cols):
    def point(u,z):
        taper=.83+.17*z/.1
        return (u*taper,sign*halfdepth*taper,z) if axis==0 else (sign*halfdepth*taper,u*taper,z)
    obj=mesh('Textured perforated wall',[point(-length/2,.008),point(length/2,.008),point(length/2,.092),point(-length/2,.092)],[(0,1,2,3)],perforated)
    uv=obj.data.uv_layers.new()
    for loop,co in zip(uv.data,[(0,0),(cols,0),(cols,8),(0,8)]): loop.uv=co

# Rounded rectangular perimeter, with genuinely curved corners and a continuous lip.
def rounded_ring(w,d,r,z):
    pts=[]
    for cx,cy,angle in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
        for i in range(13):
            t=math.radians(angle+i*90/12); pts.append((cx+r*math.cos(t),cy+r*math.sin(t),z))
    return pts

def rounded_shell(name,w,d,h,r,thickness,material):
    rings=[rounded_ring(w*.84,d*.84,r*.84,0),rounded_ring(w,d,r,h),rounded_ring(w-2*thickness,d-2*thickness,r-thickness,h),rounded_ring(w*.84-2*thickness,d*.84-2*thickness,r*.84-thickness,thickness)]
    n=len(rings[0]); faces=[]
    for k in range(3):
        faces.extend((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for i in range(n))
    faces.extend([tuple(reversed(range(n))),tuple(3*n+i for i in range(n))])
    obj=mesh(name,[v for ring in rings for v in ring],faces,material)
    for face in obj.data.polygons: face.use_smooth=len(face.vertices)==4
    return obj
# Shortened flat perforated panels end exactly where each rounded corner begins.
for axis,length,dep,cols in [(0,.164,.074,16),(1,.114,.099,11)]:
    for sign in [-1,1]: panel(axis,sign,length,dep,cols)
# Corner arcs are continuous sheets, following the same taper as the perforations.
for sx in [-1,1]:
    for sy in [-1,1]:
        verts=[]
        for z in [.002,.096]:
            taper=.83+.17*z/.1
            for i in range(17):
                t=i*math.pi/32
                verts.append((sx*(.082+.017*math.cos(t))*taper,sy*(.057+.017*math.sin(t))*taper,z))
        o=mesh('Rounded moulded corner',verts,[(i,i+1,i+18,i+17) for i in range(16)],white)
        m=o.modifiers.new('Wall','SOLIDIFY'); m.thickness=.0012; bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
        for f in o.data.polygons: f.use_smooth=True
# Closed opaque 2 mm floor. A downward single face was culled from above
# by the scene's front-sided material merge, exposing the GREJIG underneath.
bottom=rounded_ring(.198*.83,.148*.83,.017*.83,0)
top=rounded_ring(.198*.83,.148*.83,.017*.83,.002)
n=len(bottom)
faces=[tuple(reversed(range(n))),tuple(n+i for i in range(n))]
faces.extend((i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n))
mesh('Solid opaque rounded floor',bottom+top,faces,white)
# Rounded top lip only; no separate bottom plate or rail.
pts=rounded_ring(.197,.147,.018,.097)
curve=bpy.data.curves.new('Rolled rim','CURVE'); curve.dimensions='3D'; curve.bevel_depth=.0015; curve.bevel_resolution=2
spline=curve.splines.new('POLY'); spline.points.add(len(pts)-1)
for pt,co in zip(spline.points,pts): pt.co=(*co,1)
spline.use_cyclic_u=True
o=bpy.data.objects.new('Continuous rounded rim',curve); bpy.context.collection.objects.link(o); o.data.materials.append(white)
bpy.context.view_layer.objects.active=o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o.select_set(False)
finish('plogsvaeng',(0,0,.045),.27)
if '--only-plogsvaeng' in __import__('sys').argv:
    __import__('os')._exit(0)

bpy.ops.wm.read_factory_settings(use_empty=True)
pink=mat('Pink porous foam',(.88,.33,.48),.95); red=mat('Red abrasive polyester',(.38,.008,.025),1)
# Bake a procedural microstructure into a portable glTF normal texture.
for material in [pink,red]:
    nodes=material.node_tree.nodes; links=material.node_tree.links; p=nodes.get('Principled BSDF')
    noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=180
    bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.4; bump.inputs['Distance'].default_value=.0005; links.new(noise.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],p.inputs['Normal'])
# Classic two-lobed heart; width 9 cm, depth 8.5 cm, thickness 3 cm (estimate).
points=[]
for k in range(64):
    t=2*math.pi*k/64; points.append((16*math.sin(t)**3,13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)))
ymin=min(y for x,y in points); ymax=max(y for x,y in points)
points=[(x/32*.09,-(y-(ymin+ymax)/2)/(ymax-ymin)*.085) for x,y in points]
for name,z0,z1,material in [('Pink foam',0,.026,pink),('Red scouring layer',.026,.03,red)]:
    verts=[(x,y,z) for z in [z0,z1] for x,y in points]; n=len(points)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(k,(k+1)%n,(k+1)%n+n,k+n) for k in range(n)]
    o=mesh(name,verts,faces,material); m=o.modifiers.new('Soft foam outline','BEVEL'); m.width=.0007; m.segments=2; bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
# Bake tangent-space normals so the pores also appear in the inventory WebGL viewer.
bpy.context.scene.render.engine='CYCLES'
bpy.context.scene.cycles.samples=1
for obj in list(bpy.context.scene.objects):
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(); bpy.ops.object.mode_set(mode='OBJECT')
    material=obj.data.materials[0]; nodes=material.node_tree.nodes; links=material.node_tree.links
    texture=bpy.data.images.new(obj.name+' pores',width=512,height=512)
    texture.colorspace_settings.name='Non-Color'
    image=nodes.new('ShaderNodeTexImage'); image.image=texture; nodes.active=image
    bpy.ops.object.bake(type='NORMAL',margin=4)
    shader=nodes.get('Principled BSDF')
    for link in list(shader.inputs['Normal'].links): links.remove(link)
    normal=nodes.new('ShaderNodeNormalMap'); links.new(image.outputs['Color'],normal.inputs['Color']); links.new(normal.outputs['Normal'],shader.inputs['Normal'])
    texture.pack()
finish('heart-sponge',(0,0,.012),.14)

bpy.ops.wm.read_factory_settings(use_empty=True)
white=mat('Ivory PP',(.86,.87,.83)); orange=mat('Coral red orange PP',(.95,.065,.025)); grey=mat('Dark bristles',(.075,.085,.08),.8); black=mat('Eyes',(.008,.009,.01)); glass=mat('Frosted reservoir',(.66,.76,.75),.22)
# Ventilated fish-shaped caddy, open top with separate inner walls.
caddy=rounded_shell('Rounded ventilated caddy',.112,.075,.148,.023,.003,white)
# Real vertical drain slots cut through the rounded front shell.
for i in range(9):
    cutter=box('Slot cutter',(.0045,.03,.099),((i-4)*.010,-.035,.058),white,.0022)
    bpy.context.view_layer.objects.active=caddy
    mod=caddy.modifiers.new('Drain slot','BOOLEAN'); mod.object=cutter; mod.operation='DIFFERENCE'
    bpy.ops.object.modifier_apply(modifier=mod.name); bpy.data.objects.remove(cutter,do_unlink=True)
import bmesh
bm=bmesh.new(); bm.from_mesh(caddy.data)
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,0,.118),plane_no=(0,0,1))
bm.to_mesh(caddy.data); bm.free(); caddy.data.update()
caddy.data.materials.append(orange)
for f in caddy.data.polygons:
    if sum(caddy.data.vertices[i].co.z for i in f.vertices)/len(f.vertices)>.118: f.material_index=1
for x in [-.036,.036]:
    sphere('White eye',(x,-.037,.132),(.007,.002,.007),white); sphere('Black pupil',(x,-.039,.132),(.004,.001,.004),black)
caddy_objects=set(bpy.context.scene.objects)
# Stored brush head with rear bristles and fish tail visible inside the caddy.
sphere('Fish brush body',(0,0,.091),(.037,.018,.049),white)
for ix in range(-5,6):
    for iz in range(9):
        x=ix*.006; z=.055+iz*.008
        if (x/.036)**2+((z-.09)/.045)**2<1:
            o=cyl('Dense rear bristle',.0012,.018,(x,.023,z),grey); o.rotation_euler.x=math.pi/2
            sphere('Flexible coral cleaning pin',(x,-.019,z),(.0017,.004,.0017),orange)
verts=[(-.012,0,.052),(.012,0,.052),(.027,0,.028),(-.027,0,.028)]
o=mesh('Fish tail',verts,[(0,1,2,3)],orange); m=o.modifiers.new('Tail thickness','SOLIDIFY'); m.thickness=.006; bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
cyl('White long shaft',.009,.19,(0,0,.23),white)
for i in range(7): cyl('Coral neck grip ring',.0105,.002,(0,0,.145+i*.004),orange)
box('Liquid reservoir handle',(.027,.024,.105),(0,0,.355),glass,.011)
box('Coral screw cap',(.028,.025,.023),(0,0,.4165),orange,.009)
box('Liquid release button',(.014,.006,.033),(0,-.013,.36),orange,.006)
# Keep all movable pieces under one named root for the shared lift action.
bpy.ops.object.empty_add(); brush=bpy.context.object; brush.name='BrushLift'
for obj in list(bpy.context.scene.objects):
    if obj not in caddy_objects and obj != brush: obj.parent=brush
brush.location.z=0
brush.keyframe_insert(data_path='location',frame=1)
brush.location.z=.18
brush.keyframe_insert(data_path='location',frame=25)
brush.animation_data.action.name='brush_lift'
bpy.context.scene.frame_set(1)
finish('fish-toilet-brush',(0,0,.212),.53)
