"""Accessory generators for Lara:
- Red neck bandana (Lucky Luke / Fête de Bayonne triangular drape) (lara_bandana_neck.glb)
- Red wrist bandana (knotted wrap around left wrist) (lara_bandana_wrist.glb)
"""

import math
import bpy
import bmesh
from mathutils import Vector

from .geometry import (
    ensure_radial_clearance,
    ensure_z_plane_clearance,
    radial_surface_radius,
    slice_centroid_x,
    slice_centroid_z,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


def build_neck_bandana(name: str, bvhs, mat_bandana):
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # 1. Rolled neck collar wrap sitting cleanly at base of neck (z ~ 1.454 front to 1.488 back)
    n_theta = 40
    n_v = 7
    collar_grid = []
    for iv in range(n_v):
        tv = iv / (n_v - 1)  # 0 = lower rim, 1 = upper rim
        ring = []
        for j in range(n_theta):
            th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
            # Tilt higher at back (+Y), lower at front (-Y)
            z_base = 1.454 + 0.024 * (0.5 + 0.5 * math.sin(th))
            z = z_base + tv * 0.022
            c = slice_centroid_z(verts_torso, z, tol=0.025, fallback=Vector((0.002, 0.005, z)))
            d = Vector((math.cos(th), math.sin(th), 0.0))
            r = radial_surface_radius(bvh_torso, c, d, max_r=0.14)
            # Soft cloth bunching folds
            fold = 0.0020 * math.sin(tv * math.pi) + 0.0012 * math.cos(th * 5.0 + tv * 2.0)
            p = c + d * (r + 0.0058 + fold)
            p = ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_torso, 0.0048, max_r=0.14)
            ring.append(bm.verts.new(p))
        collar_grid.append(ring)

    for iv in range(n_v - 1):
        for j in range(n_theta):
            jn = (j + 1) % n_theta
            bm.faces.new((collar_grid[iv][j], collar_grid[iv][jn], collar_grid[iv + 1][jn], collar_grid[iv + 1][j]))

    # 2. Classic folded triangular front bib draping from collar base (z=1.464) over upper chest (z=1.356)
    n_bib_v = 12
    n_bib_u = 15
    bib_grid = []
    for iv in range(n_bib_v):
        tv = iv / (n_bib_v - 1)  # 0 = top neck seam (z=1.464), 1 = bottom triangle tip (z=1.356)
        z = 1.464 - tv * 0.108
        c = slice_centroid_z(verts_torso, z, tol=0.03, fallback=Vector((0.002, -0.012, z)))
        half_span = 1.18 * (1.0 - 0.90 * (tv ** 1.05))
        row = []
        for iu in range(n_bib_u):
            tu = (iu / (n_bib_u - 1)) * 2.0 - 1.0  # -1..1
            th = -0.5 * math.pi + tu * half_span
            d = Vector((math.cos(th), math.sin(th), 0.0))
            r = radial_surface_radius(bvh_torso, c, d, max_r=0.22)
            # Subtle fabric ripple along central drape
            drape_wave = 0.0030 * math.cos(tu * math.pi * 2.5) * math.sin(tv * math.pi)
            clr = 0.0085 + drape_wave + 0.003 * (1.0 - tv)
            p = c + d * (r + clr)
            p = ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_torso, 0.0070, max_r=0.22)
            row.append(bm.verts.new(p))
        bib_grid.append(row)

    for iv in range(n_bib_v - 1):
        for iu in range(n_bib_u - 1):
            bm.faces.new((bib_grid[iv][iu], bib_grid[iv + 1][iu], bib_grid[iv + 1][iu + 1], bib_grid[iv][iu + 1]))

    # 3. Back knot + two short tie tails at nape (z ~ 1.474)
    c_nape = slice_centroid_z(verts_torso, 1.474, tol=0.025, fallback=Vector((0.002, 0.010, 1.474)))
    r_nape = radial_surface_radius(bvh_torso, c_nape, Vector((0.0, 1.0, 0.0)), max_r=0.12)
    knot_pos = Vector((c_nape.x, c_nape.y + r_nape + 0.011, 1.474))
    res_k = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.012)
    for v in res_k["verts"]:
        v.co = knot_pos + Vector((v.co.x * 1.25, v.co.y * 0.85, v.co.z * 0.90))

    for side in (-1, 1):
        tail_pts = [
            knot_pos + Vector((side * 0.008, 0.002, -0.002)),
            knot_pos + Vector((side * 0.024, 0.012, -0.022)),
            knot_pos + Vector((side * 0.036, 0.018, -0.050)),
        ]
        widths = [0.010, 0.013, 0.005]
        t_rows = []
        for pt, hw in zip(tail_pts, widths):
            t_rows.append((
                bm.verts.new(pt + Vector((-hw, 0.0, 0.0))),
                bm.verts.new(pt + Vector((+hw, 0.0, 0.0))),
            ))
        for i in range(len(t_rows) - 1):
            bm.faces.new((t_rows[i][0], t_rows[i + 1][0], t_rows[i + 1][1], t_rows[i][1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (co.x * 6.0 + 0.5, co.z * 6.0)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_bandana)

    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = 0.0018
    solid.offset = 0.5
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=solid.name)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)

    return obj


def build_wrist_bandana(name: str, bvhs, mat_bandana):
    bvh_left_arm = bvhs["bvh_left_arm"]
    verts_left_arm = bvhs["verts_left_arm"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # Wrapped bandana around Lara's left wrist (x = 0.506 .. 0.546)
    n_x = 8
    n_rad = 24
    x0, x1 = 0.506, 0.546
    rings = []
    for ix in range(n_x):
        tx = ix / (n_x - 1)
        x = x0 + (x1 - x0) * tx
        c = slice_centroid_x(verts_left_arm, x, tol=0.025)
        rv = []
        for k in range(n_rad):
            ang = (k / n_rad) * 2.0 * math.pi
            d = Vector((0.0, math.cos(ang), math.sin(ang)))
            r = radial_surface_radius(bvh_left_arm, c, d, max_r=0.08)
            fold = 0.0018 * math.sin(tx * math.pi) + 0.0010 * math.sin(ang * 3.0 + tx * 4.0)
            p = c + d * (r + 0.0042 + fold)
            p = ensure_radial_clearance(p, c, bvh_left_arm, 0.0038, max_r=0.08)
            rv.append(bm.verts.new(p))
        rings.append(rv)

    for ix in range(n_x - 1):
        for k in range(n_rad):
            kn = (k + 1) % n_rad
            bm.faces.new((rings[ix][k], rings[ix + 1][k], rings[ix + 1][kn], rings[ix][kn]))

    # Side knot + short fluttering tails on upper-front wrist
    c_mid = slice_centroid_x(verts_left_arm, 0.526, tol=0.025)
    d_knot = Vector((0.0, -0.75, 0.66)).normalized()
    r_k = radial_surface_radius(bvh_left_arm, c_mid, d_knot, max_r=0.08)
    knot_pos = c_mid + d_knot * (r_k + 0.009)
    res_k = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.0085)
    for v in res_k["verts"]:
        v.co = knot_pos + Vector((v.co.x * 1.15, v.co.y * 0.85, v.co.z * 0.85))

    for s in (-1, 1):
        t_pts = [
            knot_pos + Vector((s * 0.004, -0.002, 0.002)),
            knot_pos + Vector((s * 0.014, -0.012, 0.014)),
            knot_pos + Vector((s * 0.020, -0.020, 0.026)),
        ]
        hws = [0.006, 0.008, 0.003]
        t_rows = []
        for pt, hw in zip(t_pts, hws):
            t_rows.append((
                bm.verts.new(pt + Vector((-hw, 0.0, 0.0))),
                bm.verts.new(pt + Vector((+hw, 0.0, 0.0))),
            ))
        for i in range(len(t_rows) - 1):
            bm.faces.new((t_rows[i][0], t_rows[i + 1][0], t_rows[i + 1][1], t_rows[i][1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            co = loop.vert.co
            ang = math.atan2(co.z - c_mid.z, co.y - c_mid.y)
            loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 2.0, (co.x - x0) * 14.0)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_bandana)

    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = 0.0016
    solid.offset = 0.5
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=solid.name)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)

    return obj


def generate_accessories(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_torso_only = [bpy.data.objects["body_nude_torso"]]
    donor_arms_only = [bpy.data.objects["arms"]]

    if only_ids is None or "bandana-neck" in only_ids:
        neck_bandana = build_neck_bandana("lara_bandana_neck", bvhs, mats["bandana"])
        bind_and_transfer_weights(neck_bandana, donor_torso_only, armature, smooth_passes=1)
        export_garment_glb([neck_bandana], armature, "accessories/lara_bandana_neck.glb")

    if only_ids is None or "bandana-wrist" in only_ids:
        wrist_bandana = build_wrist_bandana("lara_bandana_wrist", bvhs, mats["bandana"])
        bind_and_transfer_weights(wrist_bandana, donor_arms_only, armature, smooth_passes=1)
        export_garment_glb([wrist_bandana], armature, "accessories/lara_bandana_wrist.glb")
