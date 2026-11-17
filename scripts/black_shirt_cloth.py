"""Sewn V-neck cotton shell, settled with Blender Cloth, then baked for glTF."""
import math
import bpy
import bmesh
from mathutils import Vector


def garment(hanging, scale, material):
    # One continuous sewn shell: open hem, neckline and cuffs. No disconnected
    # sleeve panels or decorative curves resisting the cloth solver.
    step = .015
    outline = [(-.27,0),(.27,0),(.27,.435),(.39,.39),(.42,.555),
               (.27,.675),(.09,.72),(0,.605),(-.09,.72),(-.27,.675),
               (-.42,.555),(-.39,.39),(-.27,.435)]
    def inside(x,z):
        hit=False
        for (a,b),(c,d) in zip(outline,outline[1:]+outline[:1]):
            if (b>z)!=(d>z) and x<(c-a)*(z-b)/(d-b)+a: hit=not hit
        return hit
    cells=[]
    for j in range(48):
        for i in range(56):
            if inside(-.42+(i+.5)*step,(j+.5)*step): cells.append((i,j))
    nodes=sorted({p for i,j in cells for p in ((i,j),(i+1,j),(i+1,j+1),(i,j+1))})
    ids={p:i for i,p in enumerate(nodes)};n=len(nodes)
    verts=[]
    for side in (-1,1):
        for i,j in nodes:
            x=-.42+i*step;z=j*step
            verts.append((x,side*.006+.0008*math.sin(x*31+z*17),z))
    front=[tuple(ids[p] for p in ((i,j),(i+1,j),(i+1,j+1),(i,j+1))) for i,j in cells]
    faces=front+[tuple(v+n for v in reversed(f)) for f in front]
    edge_count={}
    for face in front:
        for a,b in zip(face,face[1:]+face[:1]):
            key=tuple(sorted((a,b)));edge_count[key]=edge_count.get(key,0)+1
    for (a,b),count in edge_count.items():
        if count!=1: continue
        x=(verts[a][0]+verts[b][0])/2;z=(verts[a][2]+verts[b][2])/2
        # Sew shoulders, armpits and torso sides. Cuffs / neck / hem stay open.
        opening=z<.015 or (abs(x)<.105 and z>.59) or abs(x)>.385
        if not opening: faces.append((b,a,a+n,b+n))
    mesh=bpy.data.meshes.new('Sewn cotton V neck');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Cloth simulated black tee',mesh);bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    # Smooth the stair-stepped pattern before simulation; keep a regular mesh.
    smooth=o.modifiers.new('Relax cut pattern','SMOOTH');smooth.factor=.7;smooth.iterations=4
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    uv=o.data.uv_layers.new(name='Cotton pattern')
    for loop in o.data.loops:
        p=o.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(p.x/.84+.5,p.z/.72)
    floor=None
    if hanging:
        # The clip grips one small patch of the BACK collar, leaving both
        # shoulders and both sleeves free to fall under gravity.
        anchor=max((v for v in o.data.vertices if v.index>=n),key=lambda v:v.co.z)
        origin=anchor.co.copy()
        pins=[v.index for v in o.data.vertices if v.index>=n and (v.co-origin).length<.018]
        group=o.vertex_groups.new(name='Back collar held by clip');group.add(pins,1,'REPLACE')
    else:
        for v in o.data.vertices:
            x,y,z=v.co;v.co=(x,z-.36,-y+.035)
        bpy.ops.mesh.primitive_plane_add(size=4)
        floor=bpy.context.object;floor.modifiers.new('Table collision','COLLISION')
        floor.collision.thickness_outer=.001;floor.collision.cloth_friction=8
    bpy.context.view_layer.objects.active=o
    cloth=o.modifiers.new('Cotton gravity simulation','CLOTH')
    s=cloth.settings;s.quality=8;s.mass=.18;s.air_damping=2
    s.tension_stiffness=15;s.compression_stiffness=15;s.shear_stiffness=5;s.bending_stiffness=.025
    s.tension_damping=5;s.compression_damping=5;s.shear_damping=5;s.bending_damping=.5
    if hanging:s.vertex_group_mass=group.name;s.pin_stiffness=1
    c=cloth.collision_settings;c.use_self_collision=True;c.self_distance_min=.0015
    c.distance_min=.0015;c.self_friction=3;c.collision_quality=3
    scene=bpy.context.scene;scene.frame_set(1);scene.frame_end=90 if hanging else 40
    cloth.point_cache.frame_start=1;cloth.point_cache.frame_end=scene.frame_end
    for frame in range(1,scene.frame_end+1):
        scene.frame_set(frame)
        if frame%10==0:print('CLOTH', 'hanging' if hanging else 'flat',frame,flush=True)
    deps=bpy.context.evaluated_depsgraph_get()
    baked=bpy.data.meshes.new_from_object(o.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
    o.modifiers.clear();o.data=baked
    if floor:bpy.data.objects.remove(floor,do_unlink=True)
    if hanging:
        shift=Vector((0,0,.703))-o.data.vertices[anchor.index].co
        for v in o.data.vertices:v.co+=shift
    for v in o.data.vertices:v.co*=scale
    sub=o.modifiers.new('Soft cloth surface','SUBSURF');sub.levels=1
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name)
    solid=o.modifiers.new('Cotton thickness','SOLIDIFY');solid.thickness=.0007*scale
    bpy.ops.object.modifier_apply(modifier=solid.name)
    for p in o.data.polygons:p.use_smooth=True
    # Export receives a static mesh, never an active simulation.
    return o
