"""Native-cut green body: preserve the shirt, fit the new gusset with Blender Cloth.

The source shirt includes two detached boot-lining triangles. They are not part
of the torso and are excluded using the pelvis bone as the anatomical boundary.
Cloth is baked into geometry; only skeletal animation is exported to glTF.
"""
import math
import bpy
import bmesh
from mathutils import Vector, Color
from mathutils.bvhtree import BVHTree
from .rigging import bind_and_transfer_weights, export_garment_glb

# Metres, matching the Blender source (the application converts to centimetres).
CLEARANCE = 0.002
GUSSET_HALF_WIDTH = 0.018
PANEL_ROWS = 12
GUSSET_ROWS = 8
CLOTH_FRAMES = 16


def generate_native_body(armature):
    source = bpy.data.objects['shirt']
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = 'lara_body_native_green'
    bpy.context.collection.objects.link(obj)
    obj.animation_data_clear()
    obj.modifiers.clear()
    obj.hide_set(False)
    obj.hide_viewport = False
    obj.hide_render = False
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    pelvis = armature.data.bones['pelvis']
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < pelvis.tail_local.z], context='VERTS')
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    bm.verts.ensure_lookup_table()
    original = set(bm.verts)
    original_coords = {v: v.co.copy() for v in original}
    deform = bm.verts.layers.deform.verify()
    original_weights = {v: dict(v[deform]) for v in original}
    group_names = {g.index: g.name for g in obj.vertex_groups}

    # Identify the waist opening by anatomy, independently of vertex ordering.
    boundary = {e for e in bm.edges if e.is_boundary}
    loops = []
    while boundary:
        edge = boundary.pop()
        component = set(edge.verts)
        stack = list(edge.verts)
        while stack:
            v = stack.pop()
            for e in v.link_edges:
                if e in boundary:
                    boundary.remove(e)
                    n = e.other_vert(v)
                    component.add(n)
                    stack.append(n)
        loops.append(component)
    hem = min(loops, key=lambda vs: sum(v.co.z for v in vs) / len(vs))
    center_x = (min(v.co.x for v in hem) + max(v.co.x for v in hem)) / 2
    center_y = (min(v.co.y for v in hem) + max(v.co.y for v in hem)) / 2
    ordered = sorted(hem, key=lambda v: math.atan2(v.co.y-center_y, v.co.x-center_x))

    skin = bpy.data.objects['body_nude_legs']
    skin_mesh = bmesh.new()
    for name in ('body_nude_legs', 'body_torso'):
        skin_mesh.from_mesh(bpy.data.objects[name].data)
    bmesh.ops.recalc_face_normals(skin_mesh, faces=list(skin_mesh.faces))
    # These open source skin pieces contain inward-facing components. Orient
    # the collider outwards so Cloth and Shrinkwrap cannot push fabric inward.
    remaining = set(skin_mesh.faces)
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
        orientation = sum(f.calc_area()*f.normal.dot(Vector((f.calc_center_median().x, f.calc_center_median().y, 0))) for f in component)
        if orientation < 0:
            bmesh.ops.reverse_faces(skin_mesh, faces=list(component))
    skin_bvh = BVHTree.FromBMesh(skin_mesh)
    low_z = min(v.co.z for v in skin.data.vertices)
    high_z = max(v.co.z for v in skin.data.vertices)

    def underside(x, y):
        hit, normal, _, _ = skin_bvh.ray_cast(Vector((0, y, low_z)), Vector((0, 0, 1)), high_z-low_z)
        if hit is None:
            raise RuntimeError(f'No crotch surface at {x}, {y}')
        return Vector((x, y, hit.z-CLEARANCE))

    def surface(x, z, back):
        direction = Vector((0, -1 if back else 1, 0))
        origin = Vector((x, 1 if back else -1, z))
        hit, normal, _, _ = skin_bvh.ray_cast(origin, direction, 2)
        if hit is None:
            raise RuntimeError(f'No pelvis surface at {x}, {z}')
        return hit - direction * CLEARANCE

    uv = bm.loops.layers.uv.active
    panels = {}
    # Seven existing waist vertices on each side form the panel attachment.
    # The intervening native side edges remain the high-cut hip boundaries.
    for back in (False, True):
        mid = max(range(len(ordered)), key=lambda i: ordered[i].co.y) if back else min(range(len(ordered)), key=lambda i: ordered[i].co.y)
        top = sorted([ordered[(mid+j) % len(ordered)] for j in range(-3, 4)], key=lambda v: v.co.x)
        rows = [top]
        for ri in range(1, PANEL_ROWS+1):
            t = ri/PANEL_ROWS
            row = []
            for j, v in enumerate(top):
                u = j/(len(top)-1)*2-1
                x = v.co.x*(1-t) + (center_x+u*GUSSET_HALF_WIDTH)*t
                # Attach to the actual underside, rather than a guessed crotch height.
                anchor = underside(center_x+u*GUSSET_HALF_WIDTH, 0.035 if back else -0.035)
                z = v.co.z*(1-t) + anchor.z*t
                if z > high_z:
                    # The native waist has no skin behind the shirt. A ray
                    # through that opening would hit the opposite body side.
                    # Bridge the shirt hem to the actual top of the leg mesh.
                    waist = surface(x, high_z-1e-6, back)
                    t_waist = (v.co.z-z)/(v.co.z-high_z)
                    p = Vector((x, v.co.y*(1-t_waist)+waist.y*t_waist, z))
                else:
                    p = surface(x, z, back) if ri < PANEL_ROWS else anchor
                nv = bm.verts.new(p)
                row.append(nv)
            rows.append(row)
        for a, b in zip(rows, rows[1:]):
            for j in range(len(top)-1):
                bm.faces.new((a[j], a[j+1], b[j+1], b[j]))
        panels[back] = rows[-1]
    rows = [panels[False]]
    for ri in range(1, GUSSET_ROWS):
        t = ri/GUSSET_ROWS
        row = []
        for a,b in zip(panels[False],panels[True]):
            nv = bm.verts.new(underside(a.co.x, a.co.y*(1-t)+b.co.y*t))
            row.append(nv)
        rows.append(row)
    rows.append(panels[True])
    for a,b in zip(rows,rows[1:]):
        for j in range(len(a)-1):
            bm.faces.new((a[j],a[j+1],b[j+1],b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    # Keep the new panels outward even if the source has custom split normals.
    for f in bm.faces:
        f.smooth = True
    uv = bm.loops.layers.uv.active
    texture = next(n.image for n in source.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE')
    import numpy as np
    pixels = np.array(texture.pixels[:]).reshape(-1, 4)
    w, h = texture.size
    samples = []
    for loop in source.data.uv_layers.active.data:
        u, v = loop.uv
        rgb = pixels[(int(v*h) % h)*w + int(u*w) % w, :3]
        if rgb[1] > rgb[0] and rgb[2] > rgb[0]:
            samples.append(rgb)
    if not samples:
        raise RuntimeError('Native shirt has no turquoise textile samples')
    colour = Color(np.median(samples, axis=0)).from_srgb_to_scene_linear()
    material = bpy.data.materials.new('Native green reconstructed fabric')
    material.use_nodes = True
    shader = material.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = (*colour, 1)
    shader.inputs['Roughness'].default_value = 0.5
    obj.data.materials.append(material)
    # Keep original upper UVs; only reconstructed faces use the sampled fabric.
    for f in bm.faces:
        if all(v in original for v in f.verts): continue
        f.material_index = len(obj.data.materials)-1
        for loop in f.loops:
            loop[uv].uv = (loop.vert.co.x, loop.vert.co.z)
    bm.verts.index_update()
    bm.faces.index_update()
    native_faces = {f.index for f in bm.faces if all(v in original for v in f.verts)}
    native_weights = {v.index: {group_names[g]:w for g,w in original_weights[v].items()} for v in original}
    fixed_coords = {v.index: p for v,p in original_coords.items()}
    pins = [v.index for v in bm.verts if v in original or any(e.is_boundary for e in v.link_edges)]
    bm.to_mesh(obj.data)
    bm.free()

    # Collider is independent of the hidden source meshes and their modifiers.
    collision_mesh = bpy.data.meshes.new('Native body collision surface')
    skin_mesh.to_mesh(collision_mesh)
    skin_mesh.free()
    collider = bpy.data.objects.new('Native body Cloth collider', collision_mesh)
    bpy.context.collection.objects.link(collider)
    collider.modifiers.new('Body collision','COLLISION')
    collider.collision.thickness_outer = CLEARANCE/2
    cloth_pins = obj.vertex_groups.new(name='Cloth native cut pins')
    cloth_pins.add(pins, 1, 'REPLACE')
    cloth = obj.modifiers.new('Cloth fitted native body','CLOTH')
    cloth.settings.quality = 8
    cloth.settings.mass = 0.15
    cloth.settings.vertex_group_mass = cloth_pins.name
    cloth.settings.pin_stiffness = 1
    cloth.settings.tension_stiffness = 30
    cloth.settings.compression_stiffness = 30
    cloth.settings.shear_stiffness = 15
    cloth.settings.bending_stiffness = 0.5
    cloth.settings.effector_weights.gravity = 0 # Fitted elastic garment, no hanging drape.
    cloth.collision_settings.use_collision = True
    cloth.collision_settings.distance_min = CLEARANCE/2
    cloth.collision_settings.use_self_collision = True
    cloth.collision_settings.self_distance_min = CLEARANCE/2
    cloth.point_cache.frame_start = 1
    cloth.point_cache.frame_end = CLOTH_FRAMES
    scene = bpy.context.scene
    for frame in range(1,CLOTH_FRAMES+1):
        scene.frame_set(frame)
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        evaluated.to_mesh()
        evaluated.to_mesh_clear()
    initial_fit = [v.co.copy() for v in obj.data.vertices]
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=cloth.name)
    fit_motion = max((v.co-p).length for v,p in zip(obj.data.vertices,initial_fit))
    if not all(math.isfinite(c) for v in obj.data.vertices for c in v.co):
        raise RuntimeError('Cloth produced non-finite coordinates')
    print(f'Cloth fit maximum motion: {fit_motion:.8f} m')
    moved = max((obj.data.vertices[i].co-p).length for i,p in fixed_coords.items())
    if moved > 1e-5:
        raise RuntimeError(f'Cloth moved the native cut by {moved} m')
    obj.vertex_groups.remove(obj.vertex_groups['Cloth native cut pins'])
    bind_and_transfer_weights(obj,[skin],armature,smooth_passes=0)
    # Preserve the native animation on the complete original upper garment.
    for i,weights in native_weights.items():
        for group in obj.vertex_groups: group.remove([i])
        for name,weight in weights.items():
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add([i],weight,'REPLACE')
    obj['cloth_fit_frames'] = CLOTH_FRAMES
    obj['native_cut_max_displacement_m'] = moved
    scene.frame_set(1)
    # The gusset is covered by the native short. Keep it as a separate section
    # so the application can omit covered fabric without changing the skin.
    fit_group = obj.vertex_groups.new(name='New fabric fit')
    fit_group.add([v.index for v in obj.data.vertices if v.index not in fixed_coords], 1, 'REPLACE')
    gusset = obj.copy()
    gusset.data = obj.data.copy()
    gusset.name = 'native_body_gusset'
    bpy.context.collection.objects.link(gusset)
    for part, keep_native in ((obj, True), (gusset, False)):
        mesh = bmesh.new()
        mesh.from_mesh(part.data)
        mesh.faces.ensure_lookup_table()
        bmesh.ops.delete(mesh, geom=[f for f in mesh.faces if (f.index in native_faces) != keep_native], context='FACES')
        bmesh.ops.delete(mesh, geom=[v for v in mesh.verts if not v.link_faces], context='VERTS')
        mesh.to_mesh(part.data)
        mesh.free()
    # Cloth vertices alone do not guarantee that the triangles between them
    # clear a convex buttock. Refine only the new fabric, then conform its
    # surface to the same collider; the native attachment edge stays fixed.
    gusset.modifiers.clear()
    bpy.context.view_layer.objects.active = gusset
    sub = gusset.modifiers.new('Gusset surface resolution', 'SUBSURF')
    sub.subdivision_type = 'SIMPLE'
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    wrap = gusset.modifiers.new('Final body surface clearance', 'SHRINKWRAP')
    wrap.target = collider
    wrap.wrap_method = 'NEAREST_SURFACEPOINT'
    wrap.wrap_mode = 'OUTSIDE_SURFACE'
    wrap.offset = CLEARANCE
    wrap.vertex_group = 'New fabric fit'
    bpy.ops.object.modifier_apply(modifier=wrap.name)
    obj.vertex_groups.remove(obj.vertex_groups['New fabric fit'])
    bind_and_transfer_weights(gusset, [skin], armature, smooth_passes=0)
    bpy.data.objects.remove(collider, do_unlink=True)
    export_garment_glb([obj,gusset],armature,'swimwear/lara_body_native_green.glb')
    print(f'Native body: {len(obj.data.vertices)} vertices, Cloth {CLOTH_FRAMES} frames, native cut displacement {moved:.8f} m')
    return obj
