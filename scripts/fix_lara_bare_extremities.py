"""Join bare feet to clothed ankles and clean the boot-covered calf UVs."""
from pathlib import Path
import bpy,bmesh,importlib.util,sys
from mathutils import Vector
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'public/characters/lara'


def rims(obj):
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=2**-23)
    unseen={e for e in bm.edges if e.is_boundary};result=[]
    while unseen:
        e=unseen.pop();verts=set(e.verts);todo=list(e.verts)
        while todo:
            for edge in todo.pop().link_edges:
                if edge in unseen:
                    unseen.remove(edge)
                    for v in edge.verts:
                        if v not in verts:verts.add(v);todo.append(v)
        result.append([v.co.copy() for v in verts])
    bm.free();return result


def trim(obj,reference,axis,side,keep_positive):
    """Cut overlapping geometry, then project its open rim onto the target polygon."""
    bm=bmesh.new();bm.from_mesh(obj.data)
    # Work on one anatomical side; preserve UV seam duplicates and skin data.
    faces=[f for f in bm.faces if sum(v.co.x for v in f.verts)*side>0]
    edges=set(e for f in faces for e in f.edges);verts=set(v for f in faces for v in f.verts)
    plane=sum(p[axis] for p in reference)/len(reference)
    normal=Vector((0,0,0));normal[axis]=1
    point=Vector((0,0,0));point[axis]=plane
    result=bmesh.ops.bisect_plane(bm,geom=list(verts)+list(edges)+faces,plane_co=point,plane_no=normal,dist=2**-23,clear_inner=keep_positive,clear_outer=not keep_positive)
    cut={v for elem in result['geom_cut'] for v in ([elem] if isinstance(elem,bmesh.types.BMVert) else elem.verts)}
    # Sort target ring around its centroid in the cross section.
    import math
    axes=[i for i in range(3) if i!=axis]
    center=sum(reference,Vector())/len(reference)
    ordered=sorted(reference,key=lambda p:math.atan2(p[axes[1]]-center[axes[1]],p[axes[0]]-center[axes[0]]))
    segments=list(zip(ordered,ordered[1:]+ordered[:1]))
    for v in cut:
        candidates=[]
        for a,b in segments:
            ab=b-a;delta=v.co-a
            length=sum(ab[i]**2 for i in axes)
            t=max(0,min(1,sum(delta[i]*ab[i] for i in axes)/length))
            p=a+(b-a)*t
            candidates.append((sum((v.co[i]-p[i])**2 for i in axes),p))
        v.co=min(candidates,key=lambda item:item[0])[1]
    bm.normal_update();bm.to_mesh(obj.data);bm.free();obj.data.update()


def barefoot_legs():
    """Reuse clean neighboring skin UVs on the strip formerly hidden by boots."""
    original=bpy.data.objects['body_legs']
    obj=bpy.data.objects.get('body_legs_barefoot')
    if obj is None:
        obj=original.copy();obj.name='body_legs_barefoot'
        bpy.context.collection.objects.link(obj)
    obj.data=original.data.copy();obj.data.name='body_legs_barefoot'
    mesh=obj.data;uv=mesh.uv_layers.active.data
    bottom=min(v.co.z for v in mesh.vertices)
    edge={v.index for v in mesh.vertices if abs(v.co.z-bottom)<2**-17}
    affected=[f for f in mesh.polygons if any(i in edge for i in f.vertices)]
    assert affected
    upper=max(mesh.vertices[i].co.z for f in affected for i in f.vertices)
    knee=bpy.data.objects['Armature'].data.bones['leg_left_knee'].head_local.z
    skin=[]
    for f in mesh.polygons:
        for li in f.loop_indices:
            co=mesh.vertices[mesh.loops[li].vertex_index].co
            if upper<co.z<knee:
                skin.append((co.copy(),uv[li].uv.copy()))
    assert skin
    for f in affected:
        for li in f.loop_indices:
            co=mesh.vertices[mesh.loops[li].vertex_index].co
            if mesh.loops[li].vertex_index in edge:
                candidates=(item for item in skin if item[0].x*co.x>0)
                nearest=min(candidates,key=lambda item:(item[0].x-co.x)**2+(item[0].y-co.y)**2)
                uv[li].uv=nearest[1]
    print('Cleaned boot-hidden calf UVs',len(affected),'faces',flush=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    # Rebuild from the original feet on each export, avoiding cumulative cuts.
    feet=bpy.data.objects['body_nude_feet']
    clothed=bpy.data.objects.get('body_bare_feet_clothed')
    if clothed is None:
        clothed=feet.copy();clothed.name='body_bare_feet_clothed'
        bpy.context.collection.objects.link(clothed)
    clothed.data=feet.data.copy();clothed.data.name='body_bare_feet_clothed'
    knee_z=bpy.data.objects['Armature'].data.bones['leg_left_knee'].head_local.z
    for ring in rims(bpy.data.objects['body_legs']):
        if max(p.z for p in ring)<knee_z:
            side=1 if sum(p.x for p in ring)>0 else -1
            trim(clothed,ring,2,side,False)
    barefoot_legs()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    spec=importlib.util.spec_from_file_location('limbs',ROOT/'scripts/separate_lara_limb_uvs.py')
    limbs=importlib.util.module_from_spec(spec);spec.loader.exec_module(limbs);limbs.export()


if __name__=='__main__':main()
