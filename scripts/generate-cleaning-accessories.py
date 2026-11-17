"""Rebuild three photo-referenced cleaning accessories with Blender.
Run: blender -b --python-exit-code 1 --python scripts/generate-cleaning-accessories.py
GLB metres, Y up, base zero. IKEA dimensions verified; sponge/brush estimated.
References and pricing are recorded in docs/cleaning-accessories.md.
"""
from pathlib import Path
import math
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
        m=o.modifiers.new('Soft moulded edges','BEVEL'); m.width=bevel; m.segments=3; bpy.ops.object.modifier_apply(modifier=m.name)
        m=o.modifiers.new('Face normals','WEIGHTED_NORMAL'); bpy.ops.object.modifier_apply(modifier=m.name)
    return o

def mesh(name, verts, faces, material):
    m=bpy.data.meshes.new(name); m.from_pydata(verts,[],faces); m.update(); o=bpy.data.objects.new(name,m); bpy.context.collection.objects.link(o); m.materials.append(material); return o

def sphere(name, loc, size, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc); o=bpy.context.object; o.name=name; o.scale=size; o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth=True
    return o

def cyl(name, radius, depth, loc, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=depth,location=loc); o=bpy.context.object; o.name=name; o.data.materials.append(material); return o

def finish(slug, target, scale):
    objects=list(bpy.context.scene.objects)
    for obj in objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active=obj
            bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{slug}.glb'),export_format='GLB',use_selection=True)
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
# Perforated side sheets: each cell connects its boundary to a circular opening.
# Sheet thickness is real geometry, including the inside of every hole.
def panel(axis, sign, length, halfdepth, cols):
    verts=[]; faces=[]; rows=8; bottom=.009; top=.091
    def point(u,z):
        taper=.83+.17*z/.1
        return (u*taper,sign*halfdepth*taper,z) if axis==0 else (sign*halfdepth*taper,u*taper,z)
    for col in range(cols):
        for row in range(rows):
            u=-length/2+(col+.5)*length/cols; z=bottom+(row+.5)*(top-bottom)/rows
            base=len(verts)
            for outer in [True,False]:
                for k in range(16):
                    a=2*math.pi*k/16; c=math.cos(a); s=math.sin(a)
                    r=min((length/cols/2)/max(abs(c),1e-9),((top-bottom)/rows/2)/max(abs(s),1e-9)) if outer else .0021
                    verts.append(point(u+r*c,z+r*s))
            for k in range(16): faces.append((base+k,base+(k+1)%16,base+16+(k+1)%16,base+16+k))
    o=mesh('Circular perforations',verts,faces,white); m=o.modifiers.new('Plastic wall thickness','SOLIDIFY'); m.thickness=.0012; bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
for axis, length, dep, cols in [(0,.18,.073,18),(1,.13,.098,13)]:
    for sign in [-1,1]: panel(axis,sign,length,dep,cols)
box('Closed base',(.167,.124,.003),(0,0,.0015),white,.002)
# Corner posts follow the taper, and continuous rims close the panel borders.
for x in [-1,1]:
    for y in [-1,1]:
        o=box('Tapered corner',(.01,.01,.098),(x*.087,y*.062,.05),white,.004)
        o.rotation_euler=(y*-.11,x*.14,0)
for z,w,d in [(.006,.168,.126),(.096,.2,.15)]:
    for y in [-1,1]: box('Long rim',(w,.004,.008),(0,y*(d/2-.002),z),white,.002)
    for x in [-1,1]: box('Short rim',(.004,d,.008),(x*(w/2-.002),0,z),white,.002)
finish('plogsvaeng',(0,0,.045),.27)

bpy.ops.wm.read_factory_settings(use_empty=True)
pink=mat('Pink porous foam',(.88,.33,.48),.95); red=mat('Red abrasive polyester',(.38,.008,.025),1)
# Bake a procedural microstructure into a portable glTF normal texture.
for material in [pink,red]:
    nodes=material.node_tree.nodes; links=material.node_tree.links; p=nodes.get('Principled BSDF')
    noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=180
    bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.4; bump.inputs['Distance'].default_value=.0005; links.new(noise.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],p.inputs['Normal'])
# Classic two-lobed heart; width 9 cm, depth 8.5 cm, thickness 3 cm (estimate).
points=[]
for k in range(128):
    t=2*math.pi*k/128; points.append((16*math.sin(t)**3,13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)))
ymin=min(y for x,y in points); ymax=max(y for x,y in points)
points=[(x/32*.09,-(y-(ymin+ymax)/2)/(ymax-ymin)*.085) for x,y in points]
for name,z0,z1,material in [('Pink foam',0,.026,pink),('Red scouring layer',.026,.03,red)]:
    verts=[(x,y,z) for z in [z0,z1] for x,y in points]; n=len(points)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(k,(k+1)%n,(k+1)%n+n,k+n) for k in range(n)]
    o=mesh(name,verts,faces,material); m=o.modifiers.new('Soft foam outline','BEVEL'); m.width=.0007; m.segments=3; bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
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
box('Caddy base',(.112,.075,.008),(0,0,.004),white,.003)
box('Rear shell',(.112,.004,.14),(0,.035,.075),orange,.002)
for x in [-.054,.054]: box('Caddy side',(.004,.07,.14),(x,0,.075),white,.002)
for i in range(11):
    x=(i-5)*.0097
    box('Ventilation rib',(.0065,.004,.105),(x,-.035,.059),white,.003)
box('Coral upper band',(.112,.006,.033),(0,-.034,.13),orange,.003)
for x in [-.04,.04]:
    sphere('White eye',(x,-.039,.132),(.007,.002,.007),white); sphere('Black pupil',(x,-.041,.132),(.004,.001,.004),black)
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
finish('fish-toilet-brush',(0,0,.212),.53)
