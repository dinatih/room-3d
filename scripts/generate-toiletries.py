"""Photo-based toiletry reconstructions. Blender metres, +Z up, front -Y.

Run: blender -b -t 4 --python scripts/generate-toiletries.py
Dimensions are estimates, not manufacturer CAD measurements. Photo crops keep
the printed labels; bodies, shoulders, caps and pumps are actual 3D meshes.
"""
import bpy
import json
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ITEMS = json.loads((ROOT / 'scripts/toiletry-products.json').read_text())


def mat(name, color, rough=.3, metal=0, transmission=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Transmission Weight'].default_value = transmission
    p.inputs['IOR'].default_value = 1.46
    return m


def box(name, dims, loc, bevel, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new('Moulded rounded corners', 'BEVEL'); b.width = bevel; b.segments = 5
        bpy.ops.object.modifier_apply(modifier=b.name)
    n = o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=n.name)
    return o


def lathe(name, profile, depth_ratio, material):
    n = 96; verts = []; faces = []
    for z, r in profile:
        for i in range(n):
            a = 2 * math.pi * i / n
            verts.append((r * math.sin(a), -r * depth_ratio * math.cos(a), z))
    for j in range(len(profile)-1):
        for i in range(n):
            k = j*n+i; next_i = j*n+(i+1)%n
            faces.append((k, next_i, next_i+n, k+n))
    faces.extend([tuple(reversed(range(n))), tuple((len(profile)-1)*n+i for i in range(n))])
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
    o = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(o); o.data.materials.append(material)
    for p in mesh.polygons: p.use_smooth = len(p.vertices)==4
    return o


def photo_label(folder, filename, crop, width, depth, z0, z1, curved=False, back=False):
    """Crop coordinates in source pixels. Curved front spans 144 degrees."""
    image = bpy.data.images.load(str(folder / filename)); image.pack()
    m = mat('Photographed printed label', (1,1,1), .48)
    tex = m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = image
    m.node_tree.links.new(tex.outputs['Color'], m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    iw, ih = image.size; x0,y0,x1,y1 = crop
    n = 48 if curved else 1; vertices=[]; uvs=[]
    for z, v in [(z0,1-y1/ih),(z1,1-y0/ih)]:
        for i in range(n+1):
            u=i/n; a=(u-.5)*math.pi*.8
            x=width/2*math.sin(a) if curved else (u-.5)*width
            y=-depth/2*math.cos(a) if curved else -depth/2
            if back: x=-x; y=-y
            vertices.append((x,y,z)); pu=(math.sin(a)/math.sin(math.pi*.4)+1)/2 if curved else u
            uvs.append(((x0+pu*(x1-x0))/iw,v))
    faces=[(i,i+1,n+2+i,n+1+i) for i in range(n)]
    mesh=bpy.data.meshes.new('Label surface');mesh.from_pydata(vertices,[],faces);mesh.update()
    uv=mesh.uv_layers.new()
    for loop in mesh.loops: uv.data[loop.index].uv=uvs[loop.vertex_index]
    o=bpy.data.objects.new('Back label' if back else 'Front label',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)


def text(label, size, z, y, material):
    bpy.ops.object.text_add(location=(0,y,z), rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name=label;o.data.body=label;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.00003;o.data.materials.append(material)
    bpy.ops.object.convert(target='MESH')


for item in ITEMS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    folder=ROOT/'public'/Path(item['glbPath']).parent
    key=item['id'];w,d,h=[item['dims'][a]/100 for a in ('w','d','h')]
    black=mat('Satin black plastic',(.008,.009,.012)); white=mat('White polyethylene',(.93,.94,.95))
    blue=mat('Mennen blue',(.008,.38,.65)); red=mat('Guerlain lacquer red',(.48,.009,.018),.2)
    if key=='mennen-intracable':
        box('Oval broad stick housing',(w,d,h*.78),(0,0,h*.39),.011,black)
        box('Blue friction fit cap',(w,d,h*.22),(0,0,h*.89),.008,blue)
        box('Blue bottom adjustment wheel',(.019,d*.94,.011),(0,0,.006),.002,blue)
        photo_label(folder,'product-1.jpg',(145,150,395,451),w*.87,d+.0002,.018,.085)
    elif key=='dior-fahrenheit':
        # Elliptical profile follows the rounded shoulders in the supplied photo.
        amber=mat('Fahrenheit amber red lacquer',(.26,.016,.002),.16,.12)
        lathe('Fahrenheit rounded glass bottle',[(0,.026),(.003,.03),(.015,.03),(.06,.029),(.085,.026),(.101,.02),(.11,.011)],d/w,amber)
        gold=mat('Heavy amber glass heel',(.75,.37,.045),.14,.45)
        lathe('Thick amber heel',[(.001,.029),(.003,.03),(.012,.03)],d/w,gold)
        lathe('Black neck and cylindrical cap',[(.109,.011),(.131,.011),(.132,.0115),(.149,.0115),(.15,.0105)],1,black)
        # Embedded vertical amber -> red -> near-black texture, glTF-compatible.
        im=bpy.data.images.new('Fahrenheit vertical amber gradient',width=4,height=128)
        pixels=[]
        stops=[(0,(.9,.46,.025)),(.15,(1,.64,.025)),(.4,(.62,.035,.008)),(.75,(.15,.002,.003)),(1,(.015,.001,.002))]
        for j in range(128):
            t=j/127
            for (a,c),(b,e) in zip(stops,stops[1:]):
                if a<=t<=b:
                    f=(t-a)/(b-a);color=[c[k]*(1-f)+e[k]*f for k in range(3)];break
            pixels.extend((*color,1)*4)
        im.pixels=pixels;im.pack()
        body=bpy.data.objects['Fahrenheit rounded glass bottle'];uv=body.data.uv_layers.new()
        for loop in body.data.loops:
            v=body.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(.5,v.z/.11)
        tex=amber.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
        amber.node_tree.links.new(tex.outputs['Color'],amber.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
        ivory=mat('Ivory lettering',(.98,.92,.72))
        text('Fahrenheit',.0068,.074,-.0172,ivory);text('Dior',.007,.019,-.0177,ivory)
    elif key=='guerlain-habit-rouge':
        glass=mat('Clear thick faceted glass',(.94,.83,.58),.12,.05,.65)
        box('Rectangular bevelled Guerlain glass',(w,d,.077),(0,0,.0385),.004,glass)
        liquid=mat('Amber eau de toilette',(.72,.4,.08),.2,.1,.2)
        box('Inset perfume volume',(w-.009,d-.009,.061),(0,0,.038),.002,liquid)
        chrome=mat('Silver neck collar',(.65,.66,.65),.17,.9)
        lathe('Silver collar',[(.077,.010),(.083,.010)],1,chrome)
        lathe('Red cylindrical cap',[(.083,.012),(.104,.012),(.105,.011)],1,red)
        # Red square and exact lettering extracted from the 50 ml packshot.
        photo_label(folder,'product-1.jpg',(267,308,360,432),.019,d+.0002,.024,.050)
        for x in (-w/2+.002,w/2-.002):
            box('Polished glass vertical bevel',(.002,d,.068),(x,0,.037),.0007,glass)
    elif key in ('axe-dark-temptation','axe-cherry-fizz'):
        lathe('Aluminium aerosol can',[(0,w*.43),(.003,w/2),(h*.79,w/2),(h*.81,w*.46)],1,black)
        lathe('Twist spray actuator',[(h*.8,w*.48),(h*.91,w*.48),(h*.985,w*.40),(h,w*.36)],1,black)
        box('Spray outlet',(.006,.001,.004),(0,-w*.432,h*.86),.001,mat('Nozzle recess',(.001,.001,.001)))
        if key=='axe-dark-temptation':
            photo_label(folder,'product-1.jpg',(390,290,765,1330),w+.0002,d+.0002,.014,h*.79,True)
            photo_label(folder,'product-2.jpg',(12,375,368,1435),w+.0002,d+.0002,.006,h*.80,True,True)
        else:
            photo_label(folder,'product-1.jpg',(410,350,880,1160),w+.0002,d+.0002,.009,h*.79,True)
            photo_label(folder,'product-2.jpg',(12,370,485,1430),w+.0002,d+.0002,.006,h*.80,True,True)
    elif key=='axe-provocation':
        box('Rounded rectangular grip bottle',(w,d,h*.86),(0,0,h*.43),.012,black)
        box('Angular flip top cap',(w*.94,d*.94,h*.14),(0,0,h*.93),.004,black)
        photo_label(folder,'product-1.jpg',(70,340,545,1390),w*.78,d+.0003,.015,h*.76)
        photo_label(folder,'product-7.jpg',(85,210,510,1390),w*.78,d+.0003,.015,h*.80,False,True)
        for side in (-1,1):
            for z in range(7):
                box('Moulded grip rib',(.002,.025,.003),(side*(w/2-.002),0,.045+z*.012),.001,black)
    else:
        box('White oval family bottle',(w,d,.19),(0,0,.095),.022,white)
        lathe('Blue pump collar',[(.184,.015),(.204,.015)],1,blue)
        lathe('Pump stem',[(.20,.006),(.233,.006)],1,blue)
        box('Blue pump head',(.04,.021,.009),(.008,0,.237),.004,blue)
        box('Dispensing spout',(.029,.013,.008),(.03,0,.244),.003,blue)
        photo_label(folder,'product-1.jpg',(51,266,272,719),w*.72,d+.0002,.03,.162)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public'/item['glbPath']),export_format='GLB',use_selection=True)
    # Offline three-view inspection, using the same geometry exported to GLB.
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8
    scene.render.resolution_x=scene.render.resolution_y=400;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Studio');scene.world.color=(.35,.35,.35)
    box('Floor',(2,2,.001),(0,0,-.0005),0,mat('Studio floor',(.24,.25,.27),.8))
    for direction,power in [((-1,-2,3),250),((2,1,2),180)]:
        bpy.ops.object.light_add(type='AREA',location=Vector(direction)*h)
        o=bpy.context.object;o.data.energy=power*h*h;o.data.size=h*2
        o.rotation_euler=(Vector((0,0,h/2))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=h*1.25
    for name,direction in [('front',(0,-3,.6)),('three-quarter',(1.8,-3,1)),('back',(-1,3,.9))]:
        scene.camera.location=Vector((0,0,h/2))+Vector(direction)*h
        scene.camera.rotation_euler=(Vector((0,0,h/2))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(folder/f'preview-{name}.png');bpy.ops.render.render(write_still=True)
    print('EXPORTED',key,flush=True)
os._exit(0)
