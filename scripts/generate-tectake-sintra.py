"""TecTake Sintra B0FFHJ2TVP — photo-referenced articulated garden sofa.
blender -b --python-exit-code 1 --python scripts/generate-tectake-sintra.py
Metres, Blender Z up; +X right, front -Y. Independent arm flattening clips.
Manufacturer: 157x61x89 cm upright, 183.5 cm flat, seat top 48 cm.
"""
from pathlib import Path
import math
import bpy
import numpy as np
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/items/armrest-sofa-gris';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name,color,roughness,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metal
    return m
rattan=material('Grey variegated synthetic rattan',(.25,.27,.27),.62)
cloth=material('Anthracite woven polyester',(.075,.080,.083),.88)
metal=material('Black powder coated steel',(.022,.026,.028),.43,.65)
rubber=material('Black adjustable feet',(.009,.010,.011),.9)

# Portable PBR textures: woven strips have alternating crossings and fine longitudinal grain.
def packed_image(name,array,noncolor=False):
    h,w,c=array.shape;im=bpy.data.images.new(name,width=w,height=h,alpha=True)
    if noncolor:im.colorspace_settings.name='Non-Color'
    im.pixels.foreach_set(array.astype(np.float32).ravel());im.pack();return im
# Sample the unobstructed weave close-up from the manufacturer's existing gallery.
reference=bpy.data.images.load(str(OUT/'armrest-sofa-gris-4.jpg'))
w,h=reference.size
photopixels=np.empty(w*h*4,dtype=np.float32);reference.pixels.foreach_get(photopixels);photopixels=photopixels.reshape(h,w,4)
crop=photopixels[h-1270:h-1150,70:340,:3].copy()
# Mirrored tiling keeps the photographic strands continuous at the texture edges.
rowtile=np.concatenate((crop,crop[:,::-1]),axis=1)
colour=np.concatenate((rowtile,rowtile[::-1]),axis=0)
shade=colour.mean(axis=2);dy,dx=np.gradient(shade)
albedo=np.concatenate((colour,np.ones((*colour.shape[:2],1))),axis=2)
norm=np.stack([.5-dx*2,.5-dy*2,np.ones_like(shade),np.ones_like(shade)],axis=-1)
for mat,normalimg,colorimg in [(rattan,packed_image('Rattan crossing normals',norm,True),packed_image('Rattan strand colour',albedo)),(cloth,None,None)]:
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
    if mat==cloth:
        y,x=np.mgrid[0:128,0:128];n=np.stack([.5+.16*np.sin(x*np.pi/2),.5+.16*np.cos(y*np.pi/2),np.ones_like(x),np.ones_like(x)],axis=-1)
        normalimg=packed_image('Fine polyester weave',n,True)
    image=nodes.new('ShaderNodeTexImage');image.image=normalimg
    normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.65 if mat==rattan else .28
    links.new(image.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],p.inputs['Normal'])
    if colorimg:
        color=nodes.new('ShaderNodeTexImage');color.image=colorimg;links.new(color.outputs['Color'],p.inputs['Base Color'])

def mesh(name,verts,faces,mat):
    m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(mat);return o

def uv_project(o,tile):
    while o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers[0])
    uv=o.data.uv_layers.new()
    for face in o.data.polygons:
        axis=max(range(3),key=lambda i:abs(face.normal[i]));a,b=[i for i in range(3) if i!=axis]
        for li in face.loop_indices:
            co=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(co[a]/tile,co[b]/tile)

def box(name,dims,loc,mat,bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        m=o.modifiers.new('Rounded frame edges','BEVEL');m.width=bevel;m.segments=3;bpy.ops.object.modifier_apply(modifier=m.name)
    m=o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=m.name)
    uv_project(o,.05 if mat==rattan else .04)
    return o

def beam(name,a,b,width,depth,mat):
    d=Vector(b)-Vector(a);o=box(name,(width,depth,d.length),(Vector(a)+Vector(b))/2,mat,.002);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o

def tube(name,points,radius,mat,cyclic=True):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=1;c.use_fill_caps=True
    sp=c.splines.new('POLY');sp.points.add(len(points)-1)
    for p,co in zip(sp.points,points):p.co=(*co,1)
    sp.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');uv_project(o,.04)
    for p in o.data.polygons:p.use_smooth=True
    return o

# Cushions are sewn, gently inflated surfaces rather than hard rounded cubes.
def cushion(name,dims,loc,rotation=(0,0,0),parent=None):
    w,d,h=dims;half=Vector((w/2,d/2,h/2));r=min(.035,h*.24)
    verts=[];faces=[]
    counts=[18,14,4]
    for axis in range(3):
        a,b=[i for i in range(3) if i!=axis]
        for sign in [-1,1]:
            start=len(verts);na,nb=counts[a],counts[b]
            for j in range(nb+1):
                for i in range(na+1):
                    co=Vector((0,0,0));co[axis]=sign*half[axis];co[a]=(2*i/na-1)*half[a];co[b]=(2*j/nb-1)*half[b]
                    inner=Vector(tuple(max(-half[k]+r,min(half[k]-r,co[k])) for k in range(3)));delta=co-inner
                    p=inner+delta.normalized()*r
                    if axis==2:
                        uu=co.x/half.x;vv=co.y/half.y
                        dome=(1-uu*uu)*(1-vv*vv)
                        p.z+=sign*((.022 if h>.1 else .004)*dome+.0009*math.sin(uu*28+vv*9)*(abs(uu)**7+abs(vv)**7))
                    if h>.1: p.y+=.016*((co.x/half.x)**2-.5)*max(co.y/half.y,0)**6
                    verts.append(p)
            for j in range(nb):
                for i in range(na):
                    k=start+j*(na+1)+i;faces.append((k,k+1,k+na+2,k+na+1))
    o=mesh(name,verts,faces,cloth);uv_project(o,.045)
    for face in o.data.polygons:face.use_smooth=True
    o.location=loc;o.rotation_euler=rotation;o.parent=parent
    # Raised piping follows the rounded rectangular sewn edge, including small corner gathers.
    seam=[]
    for cx,cy,angle in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
        for i in range(7):
            t=math.radians(angle+i*90/6);sx=cx+r*math.cos(t);sy=cy+r*math.sin(t)
            if h>.1: sy+=.016*((sx/(w/2))**2-.5)*max(sy/(d/2),0)**6
            seam.append((sx,sy,0))
    pipe=tube(name+' sewn piping',seam,.0014,cloth);pipe.location=loc;pipe.rotation_euler=rotation;pipe.parent=parent
    return o

# Fixed structure and the accurately grounded four splayed legs.
box('Woven seat rim',(1.15,.61,.08),(0,0,.37),rattan)
for x in [-.42,.42]:
    for y in [-.225,.225]:
        sign=1 if x>0 else -1
        beam('Splayed steel leg',(sign*.54,y,.012),(x,y,.355),.03,.03,metal)
        box('Adjustable rubber foot',(.034,.034,.012),(sign*.54,y,.006),rubber,.003)
    beam('Steel lower stretcher',(x*1.16,-.225,.10),(x*1.16,.225,.10),.025,.022,metal)
for y in [-.22,.22]:beam('Under-seat cross member',(-.54,y,.325),(.54,y,.325),.025,.025,metal)
# Set the back behind the full seat cushion, including its rear sewn edge.
# The manufacturer's nominal depth must not force upholstery through the panel.
back_y=.33;back_angle=math.radians(-7);back_thickness=.035
back=box('Woven full back panel',(1.17,back_thickness,.48),(0,back_y,.65),rattan);back.rotation_euler.x=back_angle
def back_rear_y(z):
    return back_y-math.tan(back_angle)*(z-.65)+back_thickness/(2*math.cos(back_angle))
for x in [-.54,0,.54]:
    lower=(x,back_rear_y(.395)+.011,.395)
    beam('Rear upright',lower,(x,back_rear_y(.875)+.011,.875),.022,.022,metal)
    beam('Back support bracket',(x,.225,.325),lower,.022,.022,metal)
# Dedicated seat node keeps bird/seat semantics independent of the back cushions.
bpy.ops.object.empty_add();seatroot=bpy.context.object;seatroot.name='SeatSurface'
upholstery=[cushion('Main seat cushion',(1.15,.56,.07),(0,0,.445),parent=seatroot)]
for x in [-.27,.27]:
    upholstery.append(cushion('Loose back pillow',(.53,.47,.14),(x,.210,.648),(math.radians(82),0,0)))
    # A short visible back tie and a zipper pull on the removable covers.
    strap=box('Back pillow retaining strap',(.025,.006,.13),(x,back_rear_y(.56)+.004,.56),cloth,.002);strap.rotation_euler.x=back_angle
    box('Small zipper pull',(.007,.002,.015),(x+.22,.185,.47),metal,.001)

# Verify the entire upholstery against the inclined front plane before batching.
# This also catches a seat cushion protruding through the bottom of the back.
bpy.context.view_layer.update()
inverse_back=back.matrix_world.inverted()
for part in upholstery:
    gap=min(-back_thickness/2-(inverse_back @ part.matrix_world @ v.co).y for v in part.data.vertices)
    assert gap>0, f'{part.name} crosses the back panel by {-gap*100:.2f} cm'
    print(f'Back clearance: {part.name}: {gap*100:.2f} cm')

# Separate pivots and clips; at rest the two ends are raised.
roots=[]
for side,name,clip in [(-1,'ArmLeft','left_flatten'),(1,'ArmRight','right_flatten')]:
    bpy.ops.object.empty_add(location=(side*.575,0,.41));root=bpy.context.object;root.name=name;roots.append(root)
    o=box('Woven folding arm',(.3425,.61,.06),(side*.17125,0,-.03),rattan);o.parent=root
    cushion('Folding cushion',(.3425,.56,.07),(side*.17125,0,.035),parent=root)
    for y in [-.25,.25]:
        o=box('Arm pivot bracket',(.045,.018,.045),(side*.565,y,.385),metal,.004)
        bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.010,depth=.020,location=(side*.575,y,.410),rotation=(math.pi/2,0,0));bpy.context.object.name='Visible hinge bolt';bpy.context.object.data.materials.append(metal)
    root.rotation_euler.y=-side*math.radians(62)
    root.keyframe_insert(data_path='rotation_euler',frame=1)
    root.rotation_euler.y=0;root.keyframe_insert(data_path='rotation_euler',frame=25)
    root.animation_data.action.name=clip
bpy.context.scene.frame_set(1);bpy.context.view_layer.update()

# Correct normals before export, batch by movement root while preserving the seat node.
for parent in {o.parent for o in bpy.context.scene.objects if o.type=='MESH'}:
    objs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.parent==parent]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
    o=bpy.context.object;o.name='SeatUpholstery' if parent==seatroot else (parent.name+'Mesh' if parent else 'FixedSofa')
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.000001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    if parent==seatroot:o['seatSurface']=True;o['birdPerch']=True
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'TectakeSintra.glb'),export_format='GLB',use_selection=True,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'TectakeSintra.blend'))
# Fast offline studio, excluded from the GLB and source modelling scene.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=720;scene.render.resolution_y=560;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Neutral studio');scene.world.color=(.3,.3,.3)
box('Preview floor',(200,200,.01),(0,0,-.005),material('Floor',(.16,.17,.18),.8),0)
for loc,power in [((-2,-3,4),700),((2,1,3),550),((0,3,2),350)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=3;o.rotation_euler=(Vector((0,0,.45))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=2.3
for name,loc in [('front',(0,-4,1.8)),('three-quarter',(3,-4,2.2)),('back',(-3,4,2.0))]:
    scene.camera.location=loc;scene.camera.rotation_euler=(Vector((0,0,.43))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
for root in roots: root.animation_data_clear()
scene.camera.location=(3,-4,2.2);scene.camera.rotation_euler=(Vector((0,0,.43))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
for name,left,right in [('flat',25,25),('left-flat',25,1),('right-flat',1,25)]:
    # Sample each independent action directly so mixed states are represented.
    for root,frame in zip(roots,[left,right]):
        root.rotation_euler.y=0 if frame==25 else (-1 if root.name=='ArmRight' else 1)*math.radians(62)
    scene.render.filepath=str(OUT/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
