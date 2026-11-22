"""Sol High comparison bottoms: body-derived cuts, Blender Cloth, native skinning.

The original garment files are never read or overwritten by this family.
Dimensions below describe garment cuts and ease in Blender metres.
"""
import math
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from .rigging import bind_and_transfer_weights, export_garment_glb

STYLES = {
    'bikini-slip-sol-high': ('swimwear/lara_bikini_slip_sol_high.glb', .965, .036, .095, .125),
    'bikini-shorty-sol-high': ('swimwear/lara_bikini_shorty_sol_high.glb', .985, .732),
    'bikini-tanga-sol-high': ('swimwear/lara_bikini_tanga_sol_high.glb', .975, .018, .082, .072),
    'bikini-string-sol-high': ('swimwear/lara_bikini_string_sol_high.glb', .982, .008, .068, .024),
    'legging-sol-high': ('bottoms/lara_legging_sol_high.glb', 1.095, .145),
    'sweatpants-sol-high': ('bottoms/lara_sweatpants_sol_high.glb', 1.080, .155),
}
CLEARANCE = .004
CLOTH_FRAMES = 16


def _body_surface():
    bm = bmesh.new()
    for name in ('body_nude_legs', 'body_nude_feet', 'body_nude_torso'):
        bm.from_mesh(bpy.data.objects[name].data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary])
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    # The open source skin pieces can have inward normals. Use their radial
    # orientation to make the collision surface point out of the body.
    remaining = set(bm.faces)
    while remaining:
        component = {remaining.pop()}
        pending = list(component)
        while pending:
            face = pending.pop()
            for edge in face.edges:
                for neighbour in edge.link_faces:
                    if neighbour in remaining:
                        remaining.remove(neighbour)
                        component.add(neighbour)
                        pending.append(neighbour)
        score = sum(f.calc_area()*f.normal.dot(Vector((f.calc_center_median().x, f.calc_center_median().y, 0))) for f in component)
        if score < 0:
            bmesh.ops.reverse_faces(bm, faces=list(component))
    bm.normal_update()
    bvh = BVHTree.FromBMesh(bm)
    # Measure the central perineum, not the descending inner-thigh surface.
    hit, _, _, _ = bvh.ray_cast(Vector((0, 0, .3)), Vector((0, 0, 1)), 1)
    if hit is None:
        raise RuntimeError('Cannot measure Lara crotch')
    mesh = bpy.data.meshes.new('Sol High body collision surface')
    bm.to_mesh(mesh)
    bm.free()
    collider = bpy.data.objects.new('Sol High body collider', mesh)
    bpy.context.collection.objects.link(collider)
    collider.modifiers.new('Body collision', 'COLLISION')
    collider.collision.thickness_outer = CLEARANCE/2
    return collider, hit.z


def _clip(points, distance):
    """Clip a convex face at the zero contour, inserting the edge intersections."""
    result = []
    for a,b in zip(points, points[1:]+points[:1]):
        da,db = distance(a),distance(b)
        if da >= 0:
            result.append(a)
        if (da < 0) != (db < 0):
            result.append(a.lerp(b, da/(da-db)))
    return result


def _cut_surface(collider, crotch_z, garment_id, spec, mats):
    bm = bmesh.new()
    bm.from_mesh(collider.data)
    # One refinement makes the curved cuts finer than the source skin triangles.
    bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    is_swim = garment_id.startswith('bikini-')
    is_jogging = garment_id == 'sweatpants-sol-high'
    waist = spec[1]
    brief = len(spec) == 5
    hem = min(v.co.z for v in collider.data.vertices) if brief else spec[2]
    distances = [lambda p: waist-p.z, lambda p: p.z-hem]
    if brief:
        band_height,front_width,back_width = spec[2:]
        band_bottom = waist-band_height
        gusset_width = .011 if 'string' in garment_id else .018
        def cut(p):
            t = (p.z-crotch_z)/(band_bottom-crotch_z)
            panel_width = front_width if p.y < 0 else back_width
            width = gusset_width+(panel_width-gusset_width)*math.copysign(abs(t)**1.15,t)
            return max(p.z-band_bottom, width-abs(p.x))
        distances.append(cut)
    vertices,faces = [],[]
    for f in bm.faces:
        polygon = [v.co.copy() for v in f.verts]
        for distance in distances:
            polygon = _clip(polygon, distance)
            if not polygon: break
        if len(polygon) >= 3:
            start = len(vertices)
            vertices.extend(polygon)
            faces.append(tuple(range(start,start+len(polygon))))
    bm.free()
    if not faces:
        raise RuntimeError(f'Empty garment {garment_id}')
    mesh = bpy.data.meshes.new(garment_id)
    mesh.from_pydata(vertices, [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=1e-7)
    bm.normal_update()
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        f.smooth = True
        for loop in f.loops:
            p = loop.vert.co
            loop[uv].uv = (math.atan2(p.y,p.x)/(2*math.pi),p.z)
        f.material_index = 1 if is_jogging and (f.calc_center_median().z > waist-.058 or f.calc_center_median().z < hem+.050) else 0
    for v in bm.verts:
        # Skin-derived topology already follows the perineum, so there is no
        # synthetic crotch fan to hang beneath the actual body.
        ease = .0145 if is_jogging else CLEARANCE
        v.co += v.normal*ease
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new('lara_'+garment_id.replace('-','_'),mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mats['swimwear' if is_swim else 'fleece' if is_jogging else 'legging'])
    if is_jogging: obj.data.materials.append(mats['rib'])
    return obj


def _validate_openings(obj):
    """A bottom must have one waist and two leg openings, not an open gusset."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    boundary = {e for e in bm.edges if e.is_boundary}
    count = 0
    while boundary:
        count += 1
        pending = list(boundary.pop().verts)
        while pending:
            vertex = pending.pop()
            for edge in vertex.link_edges:
                if edge in boundary:
                    boundary.remove(edge)
                    pending.append(edge.other_vert(vertex))
    bm.free()
    if count != 3:
        raise RuntimeError(f'{obj.name}: expected waist + two legs, got {count} openings')


def _fit_cloth(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    pins = [v.index for v in bm.verts if v.is_boundary]
    bm.free()
    if not pins: raise RuntimeError(f'{obj.name} has no garment openings')
    group = obj.vertex_groups.new(name='Cloth openings')
    group.add(pins,1,'REPLACE')
    cloth = obj.modifiers.new('Sol High Cloth fit','CLOTH')
    cloth.settings.vertex_group_mass = group.name
    cloth.settings.quality = 8
    cloth.settings.mass = .15
    cloth.settings.tension_stiffness = 30
    cloth.settings.compression_stiffness = 30
    cloth.settings.shear_stiffness = 15
    cloth.settings.bending_stiffness = .5
    cloth.settings.effector_weights.gravity = 0
    cloth.collision_settings.use_collision = True
    cloth.collision_settings.distance_min = CLEARANCE/2
    cloth.collision_settings.use_self_collision = True
    cloth.collision_settings.self_distance_min = CLEARANCE/2
    cloth.point_cache.frame_start = 1
    cloth.point_cache.frame_end = CLOTH_FRAMES
    bpy.context.scene.frame_set(1)
    before = [v.co.copy() for v in obj.data.vertices]
    for frame in range(1,CLOTH_FRAMES+1):
        bpy.context.scene.frame_set(frame)
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        evaluated.to_mesh()
        evaluated.to_mesh_clear()
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=cloth.name)
    if not all(math.isfinite(c) for v in obj.data.vertices for c in v.co):
        raise RuntimeError(f'{obj.name}: invalid Cloth result')
    motion = max((v.co-p).length for v,p in zip(obj.data.vertices,before))
    print(f'{obj.name}: Cloth {CLOTH_FRAMES} frames, max motion {motion:.6f} m',flush=True)
    obj.vertex_groups.clear()
    bpy.context.scene.frame_set(1)


def generate_sol_high_bottoms(bvhs, mats, armature, only_ids=None):
    collider,crotch_z = _body_surface()
    print(f'Sol High measured crotch: {crotch_z:.6f} m',flush=True)
    donors = [bpy.data.objects[n] for n in ('body_nude_legs','body_nude_feet','body_nude_torso')]
    for garment_id,spec in STYLES.items():
        if only_ids is not None and garment_id not in only_ids: continue
        obj = _cut_surface(collider,crotch_z,garment_id,spec,mats)
        _validate_openings(obj)
        _fit_cloth(obj)
        bind_and_transfer_weights(obj,donors,armature,smooth_passes=0)
        obj['generation'] = 'GPT-6.1-Sol high'
        obj['cloth_fit_frames'] = CLOTH_FRAMES
        export_garment_glb([obj],armature,spec[0])
        obj.hide_render = True
    bpy.data.objects.remove(collider,do_unlink=True)
