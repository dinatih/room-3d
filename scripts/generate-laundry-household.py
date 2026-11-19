"""Photo-referenced red laundry, floss picks, magic sponge and DR8250.
Run with blender -b --python-exit-code 1 --python scripts/generate-laundry-household.py.
Source dimensions are estimates except the sponge's photographed 10 x 6 x 2 cm.
Metres, Blender Z up; exported glTF Y up. Runtime converts metres to cm.
"""
from pathlib import Path
import math, json, os
import bpy, bmesh
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
REPORT={}

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def tube(name,points,radius,material,closed=False):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=1;c.use_fill_caps=True
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,co in zip(s.points,points):p.co=(*co,1)
    s.use_cyclic_u=closed
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    for p in o.data.polygons:p.use_smooth=True
    return o

def knit(material):
    im=bpy.data.images.new('Fine knitted cotton normal',width=64,height=64)
    im.colorspace_settings.name='Non-Color'
    im.pixels=[v for y in range(64) for x in range(64) for v in (.5+.11*math.sin(x*math.pi/2+.6*math.sin(y)),.5+.08*math.cos(y*math.pi/2),1,1)]
    im.pack();n=material.node_tree.nodes;l=material.node_tree.links
    tex=n.new('ShaderNodeTexImage');tex.image=im
    uv=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='SCALE';mapping.inputs[3].default_value=20
    l.new(uv.outputs['UV'],mapping.inputs[0]);l.new(mapping.outputs[0],tex.inputs['Vector'])
    normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.23
    l.new(tex.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs[0],n.get('Principled BSDF').inputs['Normal'])

def save(slug,filename,render=True):
    folder=ROOT/'public/items'/slug;folder.mkdir(parents=True,exist_ok=True)
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    bpy.context.view_layer.update()
    points=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
    lo,hi=[Vector([f(p[i] for p in points) for i in range(3)]) for f in (min,max)]
    shift=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
    for o in objects:o.location+=shift
    bpy.context.view_layer.update();size=hi-lo
    if filename=='SockDryer20Loaded.glb':
        REPORT['loadedHookOffsetCm']=[round((.003-(lo.x+hi.x)/2)*100,4),round((lo.y+hi.y)/2*100,4)]
    REPORT[filename]={'dimensionsCm':{'w':round(size.x*100,3),'d':round(size.y*100,3),'h':round(size.z*100,3)},'triangles':sum(len(p.vertices)-2 for o in objects for p in o.data.polygons)}
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(folder/filename),export_format='GLB',use_selection=True)
    if not render:return
    center=Vector((0,0,size.z/2));span=max(size)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8
    scene.render.resolution_x=scene.render.resolution_y=360;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.36,.36,.36)
    for direction,power in [((-1,-2,3),160),((2,1,2),100)]:
        bpy.ops.object.light_add(type='AREA',location=center+Vector(direction)*span);o=bpy.context.object;o.data.energy=power*span**2;o.data.size=span*2;o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=span*1.35
    for view,direction in [('front',(0,-2,.5)),('three-quarter',(1.6,-2,1)),('back',(0,2,.6))]:
        cam.location=center+Vector(direction)*span;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(folder/f'{Path(filename).stem}-{view}.png');bpy.ops.render.render(write_still=True)


def socks():
    red=mat('Red cotton knit',(.55,.012,.022),.95);knit(red)
    rib=mat('Red ribbed cuff',(.36,.006,.012),.95)
    # Rounded closed toe, shaped heel and open ribbed ankle, each sock distinct.
    for offset in (-.045,.045):
        rings=[(0,.0,.018,.012),(-.028,0,.03,.016),(-.055,0,.032,.019),(-.09,.008,.029,.025),(-.1,.045,.028,.024),(-.1,.10,.026,.019),(-.1,.20,.027,.018)]
        verts=[]
        for j,(y,z,rx,ry) in enumerate(rings):
            prev=rings[max(0,j-1)];nxt=rings[min(len(rings)-1,j+1)]
            dy,dz=nxt[0]-prev[0],nxt[1]-prev[1];length=math.hypot(dy,dz)
            for i in range(24):
                a=2*math.pi*i/24;verts.append((offset+rx*math.cos(a),y+ry*math.sin(a)*dz/length,z-ry*math.sin(a)*dy/length))
        faces=[tuple(reversed(range(24)))]+[(j*24+i,j*24+(i+1)%24,(j+1)*24+(i+1)%24,(j+1)*24+i) for j in range(len(rings)-1) for i in range(24)]
        o=mesh('Red sock with shaped heel',verts,faces,red)
        for p in o.data.polygons:p.use_smooth=True
        m=o.modifiers.new('Soft knitted silhouette','SUBSURF');m.levels=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
        for z in (.183,.19,.198):tube('Cuff rib',[(offset+.027*math.cos(a),-.1+.018*math.sin(a),z) for a in [2*math.pi*i/32 for i in range(32)]],.0013,rib,True)


def boxers():
    red=mat('Red viscose jersey',(.55,.009,.017),.92);knit(red)
    band=mat('Red elastic waistband',(.32,.004,.009),.97)
    thread=mat('Red flatlock seams',(.7,.025,.035),.97)
    # Front and back sewn panels. Waist and both long leg openings stay open.
    outline=[(-.18,.33),(.18,.33),(.195,.16),(.18,0),(.025,0),(.018,.12),(0,.145),(-.018,.12),(-.025,0),(-.18,0),(-.195,.16)]
    def depth(x,z):return .009+.0025*math.sin(z*43+x*30)+.0015*math.cos(x*75-z*24)+.018*math.exp(-(x/.065)**2-((z-.21)/.1)**2)
    panels=[]
    for side in (-1,1):
        o=mesh('Front fly panel' if side<0 else 'Back jersey panel',[(x,side*depth(x,z),z) for x,z in outline],[tuple(range(len(outline)))],red)
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=6,use_grid_fill=True)
        bm.to_mesh(o.data);bm.free()
        for v in o.data.vertices:v.co.y=side*depth(v.co.x,v.co.z)
        for p in o.data.polygons:p.use_smooth=True
        panels.append(o)
    # Connect the side and crotch seams; leave waist and leg hems open.
    for a,b in [(1,2),(2,3),(4,5),(5,6),(6,7),(7,8),(9,10),(10,0)]:
        x,z=outline[a];xx,zz=outline[b]
        mesh('Sewn edge',[(x,-depth(x,z),z),(xx,-depth(xx,zz),zz),(xx,depth(xx,zz),zz),(x,depth(x,z),z)],[(0,1,2,3)],red)
    for z in (.31,.316,.326,.333):
        tube('Elastic waistband rib',[(-.18+i*.36/48,-depth(-.18+i*.36/48,z)-.001,z) for i in range(49)]+[(.18-i*.36/48,depth(.18-i*.36/48,z)+.001,z) for i in range(49)],.002,band,True)
    # U-shaped pouch and overlapping vertical fly lip, as on the grey reference.
    pouch=[(-.052,.31),(-.052,.23),(-.045,.177),(-.025,.158),(0,.153),(.025,.158),(.045,.177),(.052,.23),(.052,.31)]
    tube('U shaped flatlock pouch seam',[(x,-depth(x,z)-.002,z) for x,z in pouch],.0014,thread)
    tube('Open overlapping fly',[(.012,-depth(.012,z)-.003,z) for z in [.31-i*.12/24 for i in range(25)]],.0024,band)
    for side in (-1,1):
        for left,right in [(-.18,-.025),(.025,.18)]:
            for z in (.006,.012):tube('Double stitched leg hem',[(left+(right-left)*i/24,side*(depth(left+(right-left)*i/24,z)+.001),z) for i in range(25)],.001,thread)

reset();socks();save('red-socks','RedSocksPair.glb')
reset();boxers();save('red-boxers','RedBoxers.glb')
# Load standalone garments and pinch each at the top centre. Spread hangs
# perpendicular to the frame, with ten independent clips per row.
reset();bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/items/temu-sock-dryer-20/SockDryer20.glb'))
frame=[o for o in bpy.context.scene.objects if o.type=='MESH']
for slug,file,row in [('red-socks','RedSocksPair.glb',-1),('red-boxers','RedBoxers.glb',1)]:
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/items'/slug/file));garments=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH']
    # glTF import gives Blender Z up. Bake source transforms before draping.
    for o in garments:
        o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
    top=max(v.co.z for o in garments for v in o.data.vertices)
    for original in garments:
        for v in original.data.vertices:
            old=v.co.copy();t=(top-old.z)/top
            width=.025+.975*math.sin(t*math.pi/2)
            v.co=((old.y+.1)*.18 if row<0 else old.y*.48,row*.046+old.x*width,.004+old.z-top)
        for index in range(10):
            o=original.copy();bpy.context.collection.objects.link(o);o.name=f'{slug} clip {index+1:02}'
            o.location.x=-.163+index*.326/9
    for o in garments:bpy.data.objects.remove(o,do_unlink=True)
save('temu-sock-dryer-20','SockDryer20Loaded.glb')

reset();foam=mat('White open cell cleaning foam',(.94,.94,.92),1)
# Packed pore normal map supported by glTF (not a Blender-only shader).
im=bpy.data.images.new('Foam pores normal',width=128,height=128);im.colorspace_settings.name='Non-Color'
im.pixels=[v for y in range(128) for x in range(128) for v in (.5+.19*math.sin(x*12.9898+y*78.233),.5+.19*math.cos(x*39.346+y*11.135),1,1)];im.pack()
n=foam.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=im;normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.4
foam.node_tree.links.new(t.outputs['Color'],normal.inputs['Color']);foam.node_tree.links.new(normal.outputs[0],n.get('Principled BSDF').inputs['Normal'])
box('Magic sponge 10 x 6 x 2 cm',(.10,.06,.02),(0,0,.01),foam,.001)
save('magic-sponge','MagicSponge.glb')

reset();white=mat('White polyester floss pick',(.9,.92,.88),.55);green=mat('Green lid label',(.008,.29,.22));gold=mat('Gold label stripe',(.65,.43,.08))
clear=mat('Frosted translucent storage box',(.72,.83,.82),.32)
p=clear.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.45;p.inputs['IOR'].default_value=1.46
# Storage box and lid; standalone pick in front shows the actual fork/floss.
box('Frosted box base',(.085,.06,.004),(0,.012,.002),clear,.002)
for x in (-.041,.041):box('Box side',(.002,.06,.038),(x,.012,.021),clear,.001)
for y in (-.017,.041):box('Box end',(.082,.002,.038),(0,y,.021),clear,.001)
box('Clip on lid',(.087,.062,.004),(0,.012,.043),white,.002)
box('Green label',(.025,.05,.0005),(-.027,.012,.0455),green,.002)
box('Gold label rule',(.001,.05,.0005),(-.013,.012,.0458),gold,0)
for i in range(25):box('Packed white dental picks',(.0012,.05,.029),(-.035+i*.0028,.012,.019),white,.0005)
# One 7.5 cm long handled floss pick, fork is open with a taut fine floss.
path=[(-.007,0,0),(-.002,0,.009),(0,0,.023),(0,0,.045),(-.006,0,.052),(-.013,0,.059),(-.014,0,.067),(-.012,0,.073)]
o=tube('Curved anti slip handle and fork',[(x+.064,y-.025,z) for x,y,z in path],.0018,white)
tube('Second fork prong',[(.064,-.025,.045),(.076,-.025,.054),(.078,-.025,.066),(.076,-.025,.073)],.0018,white)
tube('Taut dental floss',[(.052,-.025,.073),(.076,-.025,.073)],.00018,white)
for z in (.02,.024,.028,.032,.036):box('Anti slip handle ridge',(.004,.004,.0008),(.064,-.025,z),white,.0003)
save('polyester-toothpicks','PolyesterToothpicks.glb')

reset();black=mat('Anthracite steamer shell',(.018,.023,.025),.35);silver=mat('Silver trim and heated sole',(.45,.49,.49),.3);silver.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.7
rubber=mat('Black rubber trigger and cable',(.006,.008,.008),.8);glass=mat('Smoked water reservoir',(.065,.10,.11),.25);white=mat('White markings',(.8,.82,.8))
# Standing handheld steamer, 28 cm high. Flattened oval base and sculpted grip.
sphere('Wide water tank', (0,.008,.025),(.055,.082,.025),black)
sphere('Silver tank trim',(0,.008,.037),(.0555,.081,.009),silver)
sphere('Smoked reservoir window',(0,-.048,.026),(.04,.016,.018),glass)
# Connected rounded rings produce a tapered ergonomic handle.
rings=[(.045,.018,.038,.043),(.08,.031,.023,.025),(.16,.033,.018,.023),(.215,.024,.023,.03),(.243,.008,.038,.047)]
verts=[]
for z,y,rx,ry in rings:
    for i in range(32):a=2*math.pi*i/32;verts.append((rx*math.cos(a),y+ry*math.sin(a),z))
faces=[tuple(reversed(range(32)))]+[(j*32+i,j*32+(i+1)%32,(j+1)*32+(i+1)%32,(j+1)*32+i) for j in range(len(rings)-1) for i in range(32)]+[tuple((len(rings)-1)*32+i for i in range(32))]
o=mesh('Ergonomic continuous grip',verts,faces,black)
for p in o.data.polygons:p.use_smooth=True
for sign in (-1,1):tube('Silver handle border',[(sign*rx,y-.008,z) for z,y,rx,ry in rings],.0025,silver)
sphere('Steam head shell',(0,-.012,.24),(.049,.062,.043),black)
sphere('Heated oval sole',(0,-.067,.245),(.045,.004,.038),silver)
for x in (-.027,-.018,-.009,0,.009,.018,.027):
    sphere('Steam outlet',(x,-.071,.25),(.0025,.0015,.004),rubber)
    tube('Sole radial groove',[(x*1.15,-.071,.273),(x,-.0715,.257)],.0007,black)
box('Steam trigger',(.023,.01,.029),(0,-.001,.184),rubber,.005)
box('Two steam settings switch',(.014,.006,.015),(0,.009,.144),silver,.003)
# Coiled power cable on the shelf, connected at the rear of the base.
tube('Power cable strain relief',[(0,.085,.016),(0,.10,.013)],.005,rubber)
points=[(0,.10,.013)]+[(.039*math.sin(t),.13+.025*math.cos(t),.006+.002*i/100) for i,t in [(i,6*math.pi*i/100) for i in range(101)]]
tube('Coiled power cord',points,.0024,rubber)
box('Power plug',(.017,.025,.012),(.012,.155,.008),rubber,.003)
for x in (.008,.016):cyl('Plug pin',.0018,.013,(x,.155,.02),silver)
bpy.ops.object.text_add(location=(-.026,-.058,.228),rotation=(math.pi/2,0,0));o=bpy.context.object;o.data.body='Rowenta';o.data.size=.011;o.data.extrude=0;o.data.materials.append(white);bpy.ops.object.convert(target='MESH')
save('rowenta-dr8250','RowentaDR8250.glb')
(ROOT/'scripts/laundry-household-manifest.json').write_text(json.dumps(REPORT,indent=2)+'\n')
print(json.dumps(REPORT),flush=True)
os._exit(0)
