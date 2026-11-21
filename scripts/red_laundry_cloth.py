"""Sewn red laundry, simulated with Blender Cloth and baked for glTF."""
import math
import bpy
import bmesh
from mathutils import Vector


def hanging(kind, material):
    step = .01  # 1 cm sewing-pattern grid.
    if kind == 'boxers':
        outline = [(-.18,.33),(.18,.33),(.195,.16),(.18,0),(.025,0),(.018,.12),(0,.145),(-.018,.12),(-.025,0),(-.18,0),(-.195,.16)]
        xmin, width, height = -.20, .40, .33
    else:
        outline = [(-.03,.22),(.03,.22),(.03,.07),(.065,.04),(.075,.015),(.06,0),(-.025,0),(-.04,.035)]
        xmin, width, height = -.04, .12, .22
    def inside(x,z):
        hit=False
        for (a,b),(c,d) in zip(outline,outline[1:]+outline[:1]):
            if (b>z)!=(d>z) and x<(c-a)*(z-b)/(d-b)+a:hit=not hit
        return hit
    cells=[(i,j) for j in range(round(height/step)) for i in range(round(width/step)) if inside(xmin+(i+.5)*step,(j+.5)*step)]
    nodes=sorted({p for i,j in cells for p in ((i,j),(i+1,j),(i+1,j+1),(i,j+1))})
    ids={p:i for i,p in enumerate(nodes)};n=len(nodes)
    verts=[(xmin+i*step,side*.003+.0004*math.sin(i*1.3+j*.8),j*step) for side in (-1,1) for i,j in nodes]
    front=[tuple(ids[p] for p in ((i,j),(i+1,j),(i+1,j+1),(i,j+1))) for i,j in cells]
    faces=front+[tuple(v+n for v in reversed(f)) for f in front]
    counts={}
    for face in front:
        for a,b in zip(face,face[1:]+face[:1]):
            key=tuple(sorted((a,b)));counts[key]=counts.get(key,0)+1
    for (a,b),count in counts.items():
        if count!=1:continue
        x=(verts[a][0]+verts[b][0])/2;z=(verts[a][2]+verts[b][2])/2
        # Leave the elastic waist and both leg hems open; sock only at cuff.
        opening=z>height-step/2 or (kind=='boxers' and z<step/2)
        if not opening:faces.append((b,a,a+n,b+n))
    mesh=bpy.data.meshes.new('Sewn '+kind);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Cloth '+kind,mesh);bpy.context.collection.objects.link(o);mesh.materials.append(material)
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    smooth=o.modifiers.new('Relax sewing pattern','SMOOTH');smooth.factor=.5;smooth.iterations=3
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    band=material.copy();band.name='Elastic waistband' if kind=='boxers' else 'Sock ribbed cuff'
    shader=band.node_tree.nodes.get('Principled BSDF')
    color=shader.inputs['Base Color'].default_value
    shader.inputs['Base Color'].default_value=(color[0]*.65,color[1]*.65,color[2]*.65,1)
    mesh.materials.append(band)
    for face in mesh.polygons:
        if all(mesh.vertices[i].co.z>height-.025 for i in face.vertices):face.material_index=1
    uv=mesh.uv_layers.new(name='Fabric pattern')
    for loop in mesh.loops:
        p=mesh.vertices[loop.vertex_index].co;uv.data[loop.index].uv=((p.x-xmin)/width,p.z/height)
    # Pin a single 1 cm patch at ONE SIDE of the elastic, on both sewn panels.
    anchor=min((v for v in mesh.vertices if v.co.z>height-step),key=lambda v:v.co.x)
    grip=anchor.co.copy()
    pins=[v.index for v in mesh.vertices if abs(v.co.x-grip.x)<step*.6 and v.co.z>height-step]
    group=o.vertex_groups.new(name='One side of elastic held by one clip');group.add(pins,1,'REPLACE')
    cloth=o.modifiers.new('Gravity drape from one side of elastic','CLOTH');s=cloth.settings
    s.quality=8;s.mass=.12;s.air_damping=5
    s.tension_stiffness=20;s.compression_stiffness=20;s.shear_stiffness=8;s.bending_stiffness=.035
    s.tension_damping=8;s.compression_damping=8;s.shear_damping=8;s.bending_damping=1
    s.vertex_group_mass=group.name;s.pin_stiffness=1
    c=cloth.collision_settings;c.use_self_collision=True;c.self_distance_min=.001;c.distance_min=.001;c.self_friction=3;c.collision_quality=3
    scene=bpy.context.scene;scene.frame_set(1);scene.frame_end=100
    cloth.point_cache.frame_start=1;cloth.point_cache.frame_end=100
    for frame in range(1,101):
        scene.frame_set(frame)
        if frame%20==0:print('CLOTH',kind,frame,flush=True)
    deps=bpy.context.evaluated_depsgraph_get()
    baked=bpy.data.meshes.new_from_object(o.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
    o.modifiers.clear();o.data=baked
    grip=sum((baked.vertices[i].co for i in pins),Vector())/len(pins)
    for v in baked.vertices:v.co-=grip
    sub=o.modifiers.new('Smooth fabric','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
    solid=o.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=.0006;bpy.ops.object.modifier_apply(modifier=solid.name)
    for p in o.data.polygons:p.use_smooth=True
    o['simulation']='Blender Cloth, 100 frames, gravity, self collision, one side of elastic pinned'
    return o
