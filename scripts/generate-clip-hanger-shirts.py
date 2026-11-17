"""Low-poly AliExpress 1005007724278509 (16 clips), and black V-neck tees.
Run: blender -b --python-exit-code 1 --python scripts/generate-clip-hanger-shirts.py
Metres, Blender Z-up. Hanger width 44 cm estimated from photos (no CAD dimensions).
Garment measurements estimated: L 72 cm long, 54 cm chest width; XL +4%.
Cloth normals, seams and folds exported as meshes, no procedural runtime geometry.
"""
from pathlib import Path
import math
import json
import os
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
HANGER = ROOT / 'public/items/clip-hanger-16'
SHIRTS = ROOT / 'public/items/tshirt-noir'
REPORT = {}
bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, roughness, metal=0):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness; p.inputs['Metallic'].default_value = metal
    return m


steel = mat('Brushed stainless steel', (.56, .59, .62), .29, 1)
cotton = mat('Black cotton jersey', (.012, .014, .017), .9)
rib = mat('Black ribbed V neck and hems', (.008, .009, .011), .96)
thread = mat('Black double needle stitching', (.023, .025, .029), .98)
label = mat('Woven neck label', (.35, .35, .32), 1)
# Embed a small normal map: micro-jersey texture survives the GLB export.
image = bpy.data.images.new('Fine cotton knit normal', width=128, height=128)
image.colorspace_settings.name = 'Non-Color'
pixels = []
for y in range(128):
    for x in range(128):
        pixels.extend((.5 + .12 * math.sin(x * math.pi / 2 + .65 * math.sin(y * math.pi / 4)),
                       .5 + .1 * math.cos(y * math.pi / 2), 1, 1))
image.pixels = pixels; image.pack()
for m in (cotton, rib):
    tex = m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = image
    uv = m.node_tree.nodes.new('ShaderNodeTexCoord')
    mapping = m.node_tree.nodes.new('ShaderNodeVectorMath'); mapping.operation = 'SCALE'; mapping.inputs[3].default_value = 12
    m.node_tree.links.new(uv.outputs['UV'], mapping.inputs[0])
    m.node_tree.links.new(mapping.outputs[0], tex.inputs['Vector'])
    normal = m.node_tree.nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value = .25
    m.node_tree.links.new(tex.outputs['Color'], normal.inputs['Color'])
    m.node_tree.links.new(normal.outputs['Normal'], m.node_tree.nodes.get('Principled BSDF').inputs['Normal'])


def tube(name, points, radius, material, cyclic=False, sides=4):
    c = bpy.data.curves.new(name, 'CURVE'); c.dimensions = '3D'; c.resolution_u = 1
    c.bevel_depth = radius; c.bevel_resolution = 0; c.resolution_u = 1
    s = c.splines.new('POLY'); s.points.add(len(points)-1)
    for p, co in zip(s.points, points): p.co = (*co, 1)
    s.use_cyclic_u = cyclic
    o = bpy.data.objects.new(name, c); bpy.context.collection.objects.link(o); o.data.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH')
    for p in o.data.polygons: p.use_smooth = True
    return o


def export(objects, path):
    # Bake transforms and join: the export groups primitives by material.
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
        if o.data.users > 1: o.data = o.data.copy()
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    o = bpy.context.object
    points = [o.matrix_world @ v.co for v in o.data.vertices]
    lo = Vector(tuple(min(v[a] for v in points) for a in range(3)))
    hi = Vector(tuple(max(v[a] for v in points) for a in range(3)))
    triangles = sum(len(p.vertices)-2 for p in o.data.polygons)
    REPORT[path.name] = {'triangles': triangles, 'dimensionsCm': list((hi-lo)*100)}
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True)
    return o


# Curved double wire frame, sixteen separate jaw pairs and their hanging loops.
def arch(x): return .14 - .072*(x/.22)**2

def clip_tip(index):
    x = -.205 + .410 * index / 15
    return x, arch(x) - .074


wire = []
for depth in (-.002, .002):
    wire.append(tube('Curved frame wire', [(x, depth, arch(x)) for x in [-.22 + .44*i/48 for i in range(49)]], .0015, steel))
# Central swivel and carabiner-style open hanging hook.
wire.append(tube('Swivel eye', [(.009*math.cos(t), 0, .149+.009*math.sin(t)) for t in [2*math.pi*i/20 for i in range(20)]], .0012, steel, True))
wire.append(tube('Safety hook', [(0, 0, .157), (.007, 0, .17), (.008, 0, .185)] + [(.008+.025*math.cos(a), 0, .211+.025*math.sin(a)) for a in [-.8 + 4*i/32 for i in range(33)]], .0015, steel))
wire.append(tube('Spring hook gate', [(-.017, 0, .21), (-.011, 0, .185), (0, 0, .157)], .0008, steel))
for index in range(16):
    x, z = clip_tip(index)
    top = arch(x)
    wire.append(tube(f'Clip {index+1:02} hanging ring', [(x+.009*math.cos(t), 0, top-.017+.018*math.sin(t)) for t in [2*math.pi*i/16 for i in range(16)]], .0009, steel, True))
    # Two bent spring-wire jaws, meeting exactly at the garment pinch point.
    for depth in (-1, 1):
        wire.append(tube(f'Clip {index+1:02} jaw', [(x-.004, 0, z), (x-.005, depth*.004, z+.008), (x+.006, depth*.005, z+.037), (x+.009, depth*.003, z+.043), (x+.004, 0, z+.045), (x-.006, depth*.004, z+.026), (x+.004, 0, z)], .0008, steel))
    wire.append(tube(f'Clip {index+1:02} spring', [(x+.004*math.cos(t), -.003+.006*i/24, z+.024+.004*math.sin(t)) for i,t in [(i, 6*math.pi*i/24) for i in range(25)]], .00065, steel))
hanger = export(wire, HANGER/'ClipHanger16.glb')
# Highest point is the hook crown; contact lies one wire diameter below.
HANGER_TOP = max(v.co.z for v in hanger.data.vertices)
REPORT['hookContactFromTopCm'] = .3
hanger.hide_render = True


def garment(hanging=False, scale=1):
    objects = []
    half = .27
    # x is width; z runs from the hem to the shoulders in the pattern.
    # Open front and back neckline, hem and sleeve cuffs are physically separate.
    def top(x, back):
        a = abs(x)
        if a <= .09:
            return .72 - ((.017 if back else .115)*(1-a/.09))
        return .72 - .045*((a-.09)/(.27-.09))

    def cloth(x, z, side):
        if hanging:
            # Collar pinch gathers the shoulders; gravity releases folds below it.
            height = z/.72
            gather = 1 - .65*height**4
            xx = x*gather*.72
            zz = z - .15*(abs(x)/.43)**1.2 * height
            pleat = .009*math.sin(x*46+z*2)*(.3+.7*height) + .004*math.sin(x*89-z*5)
            depth = .012 + .012*(1-height)
            yy = side*depth + pleat
            # Back collar centre is the cloth attachment at (0,0,.703).
            yy -= .012*height**10
        else:
            xx, zz = x, z
            yy = side*(.004+.003*math.sin(z*29+x*22)**2)
            yy += .0018*math.sin(x*61+z*24)*math.sin(z*math.pi/.72)
        # Add short, decaying tension creases near armpits and the lower hem.
        yy += .003*math.sin(z*85+abs(x)*25)*math.exp(-((z-.43)/.10)**2)*(abs(x)/.43)**2
        return Vector((xx*scale, yy*scale, zz*scale))

    def surface(name, rows):
        verts = [v for row in rows for v in row]; n = len(rows[0]); faces=[]
        for j in range(len(rows)-1):
            for i in range(n-1):
                a=j*n+i; faces.append((a,a+1,a+1+n,a+n))
        mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
        o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o); o.data.materials.append(cotton)
        # UVs follow the original fabric pattern rather than generated world space.
        uv = mesh.uv_layers.new(name='Fabric UV')
        for p in mesh.polygons:
            for li in p.loop_indices:
                vi = mesh.loops[li].vertex_index
                uv.data[li].uv = ((vi % n)/(n-1), (vi//n)/(len(rows)-1))
        for p in mesh.polygons: p.use_smooth=True
        objects.append(o)
        return o

    for side in (-1, 1):
        back = side == 1
        rows=[]
        for j in range(41):
            t=j/40
            row=[]
            for i in range(41):
                x=-half+2*half*i/40
                # A slight taper at the waist and softly scalloped hem.
                xx=x*(1-.025*math.sin(t*math.pi))
                z=t*top(x,back)+.003*math.cos(x*17)*(1-t)
                row.append(cloth(xx,z,side))
            rows.append(row)
        o=surface(('Back' if back else 'Front')+' cotton panel', rows)
        if side == -1:
            for p in o.data.polygons: p.flip()
        for sign in (-1,1):
            rows=[]
            for j in range(17):
                t=j/16
                row=[]
                for i in range(17):
                    u=i/16
                    x=sign*(half+.145*u)
                    z=(.445+.23*t)*(1-u)+(.405+.155*t)*u
                    row.append(cloth(x,z,side))
                rows.append(row)
            o=surface('Short sleeve cotton panel',rows)
            # All normals are recalculated below after shoulder/side bridges.

    def seam(name, coords, material=rib, radius=.0014):
        o=tube(name,[cloth(x,z,s) for x,z,s in coords],radius*scale,material)
        objects.append(o)

    # Close sides and shoulders, preserving actual sleeve, collar and hem openings.
    for sign in (-1,1):
        surface('Side seam bridge', [[cloth(sign*half,.003+(.445-.003)*j/32,s) for s in (-1,1)] for j in range(33)])
        surface('Shoulder seam bridge', [[cloth(sign*(.09+.18*j/24),top(sign*(.09+.18*j/24),False),s) for s in (-1,1)] for j in range(25)])
        for edge in (0,1):
            surface('Sleeve seam bridge', [[cloth(sign*(half+.145*j/20),(.445+.23*edge)*(1-j/20)+(.405+.155*edge)*j/20,s) for s in (-1,1)] for j in range(21)])
        for side in (-1,1):
            seam('Sleeve cuff hem',[(sign*.415,.405+.155*j/20,side) for j in range(21)])
            seam('Sleeve cuff stitching',[(sign*.410,.406+.155*j/20,side) for j in range(21)],thread,.00045)
            seam('Torso side stitching',[(sign*.268,.01+.43*j/32,side) for j in range(33)],thread,.00045)
    for side in (-1,1):
        seam('V neck rib binding',[(x,top(x,side==1),side) for x in [-.09+.18*j/32 for j in range(33)]],rib,.0038)
        for offset in (.008,.012):
            seam('Double stitched hem',[(x,offset+.003*math.cos(x*17),side) for x in [-half+2*half*j/48 for j in range(49)]],thread,.0005)
    # Recalculate the garment shell normals consistently using its joined topology.
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]; bpy.ops.object.join()
    o=bpy.context.object
    bm=bmesh.new();bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    # Flat variant lies on a horizontal surface; hanging variant stays vertical.
    if not hanging:
        for v in o.data.vertices:
            x,y,z=v.co;v.co=(x,z-.36*scale,-y+.012*scale)
    return o


flat=garment(False)
flat=export([flat],SHIRTS/'TShirtBlackFlatL.glb');flat.hide_render=True
xl=garment(False,1.04)
xl=export([xl],SHIRTS/'TShirtBlackFlatXL.glb');xl.hide_render=True
hung=garment(True)
hung=export([hung],SHIRTS/'TShirtBlackHanging.glb');hung.hide_render=True
# A suspended hanger tee uses the same cloth mesh without collar gathering.
# Three tees attach by the back collar to three independent clips.
hanger.hide_render=False
loaded=[hanger]
for index in (0,5,15):
    o=hung.copy();o.data=hung.data; bpy.context.collection.objects.link(o);o.hide_render=False
    x,z=clip_tip(index)
    # Perpendicular to the wire frame: tees do not intersect adjacent garments.
    # The collar's centre back is the attachment point, at z=.703 before drape.
    o.rotation_euler.z=math.pi/2
    o.location=(x,0,z-.703)
    loaded.append(o)
assembly=export(loaded,HANGER/'ClipHanger16Loaded.glb')
assembly.hide_render=True
# Keep only the relevant object visible in each offline render.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Preview studio');scene.world.color=(.32,.32,.32)
for loc,power in (((-1,-1.5,2),150),((1,1,1.5),190)):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=1.4
    o.rotation_euler=(Vector((0,0,.2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO'
# The standalone hanger was consumed by export(); reuse the independent GLB.
bpy.ops.import_scene.gltf(filepath=str(HANGER/'ClipHanger16.glb'))
bare=[o for o in bpy.context.selected_objects if o.type=='MESH'][0];bare.hide_render=True
for obj,folder,prefix,target,span in ((bare,HANGER,'preview',(0,0,.13),.54),(assembly,HANGER,'loaded',(0,0,-.25),1.15),(flat,SHIRTS,'flat',(0,0,.02),1.05),(hung,SHIRTS,'hanging',(0,0,.36),.92)):
    obj.hide_render=False;scene.camera.data.ortho_scale=span
    for name,vec in [('front',(0,-2,.45)),('three-quarter',(1.5,-2,1.1)),('back',(-1,2,.75))]:
        if obj==flat:vec=(.7,-1.2,2.5) if name=='three-quarter' else ((0,0,3) if name=='front' else (-.7,1.2,2.5))
        scene.camera.location=Vector(target)+Vector(vec)*span
        scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(folder/f'{prefix}-{name}.png');bpy.ops.render.render(write_still=True)
    obj.hide_render=True
(ROOT/'scripts/clip-hanger-shirts-manifest.json').write_text(json.dumps(REPORT,indent=2)+'\n')
print(json.dumps(REPORT,indent=2),flush=True)
# Local PulseAudio can block Blender shutdown; exports and renders are complete.
os._exit(0)
