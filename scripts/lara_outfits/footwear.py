"""Footwear generators for Lara:
- All-red knit socks (lara_socks_red.glb)
- Simple all-red low-top sneakers (lara_sneakers_red.glb)
"""

import math
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

from .geometry import (
    add_tucked_edge,
    bridge_convex_radii,
    ensure_3d_surface_clearance,
    radial_surface_radius,
    slice_centroid_z,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


def _foot_xy_perimeter(
    bvh_foot: BVHTree,
    c_xy: Vector,
    n_circ: int,
    clearance: float,
) -> list[Vector]:
    """Trace true outer XY footprint of foot across z=[0.007..0.032] so low toes are fully captured."""
    raw_radii = []
    dirs = []
    for k in range(n_circ):
        a = (k / n_circ) * 2.0 * math.pi
        d_xy = Vector((math.cos(a), math.sin(a), 0.0)).normalized()
        best_r = 0.0
        for z_s in (0.007, 0.012, 0.017, 0.023, 0.030):
            origin = Vector((c_xy.x, c_xy.y, z_s)) + d_xy * 0.24
            hit_p, _, _, _ = bvh_foot.ray_cast(origin, -d_xy, 0.26)
            if hit_p is not None:
                r_proj = (hit_p.x - c_xy.x) * d_xy.x + (hit_p.y - c_xy.y) * d_xy.y
                if r_proj > best_r:
                    best_r = r_proj
        raw_radii.append(max(best_r, 0.030))
        dirs.append(d_xy)
    smooth_radii = bridge_convex_radii(raw_radii, max_dip=0.0002, passes=10)
    return [Vector((c_xy.x + dirs[k].x * (smooth_radii[k] + clearance), c_xy.y + dirs[k].y * (smooth_radii[k] + clearance), 0.0)) for k in range(n_circ)]


def _build_sock_foot(
    bm: bmesh.types.BMesh,
    bvh_foot: BVHTree,
    verts_foot,
    side: int,
    z_top: float = 0.215,
):
    """Build a smooth, zero-pinch knit sock covering toes -> heel -> ankle calf."""
    foot_pts = [p for p in verts_foot if p.z < 0.14]
    x_mid = 0.5 * (min(p.x for p in foot_pts) + max(p.x for p in foot_pts)) if foot_pts else side * 0.068
    y_toe = min(p.y for p in foot_pts) if foot_pts else -0.177
    y_ankle = 0.024
    toe_pts = [p for p in foot_pts if p.y < y_toe + 0.032]
    z_toe_mid = 0.5 * (min(p.z for p in toe_pts) + max(p.z for p in toe_pts)) if toe_pts else 0.017

    n_fore = 11
    n_arc = 7
    n_calf = 7
    n_rad = 28

    y_arc_start = -0.028
    z_arc_start = 0.036
    arc_r = 0.052
    spine = []
    for i in range(n_fore):
        u = i / max(1, n_fore - 1)
        y = (y_toe + 0.008) + (y_arc_start - (y_toe + 0.008)) * u
        pts_s = [p for p in foot_pts if abs(p.y - y) < 0.018]
        cx = 0.5 * (min(p.x for p in pts_s) + max(p.x for p in pts_s)) if pts_s else x_mid
        cz = z_toe_mid + (z_arc_start - z_toe_mid) * u
        spine.append((Vector((cx, y, cz)), Vector((0.0, 1.0, 0.0)), True))

    z_arc_top = z_arc_start + arc_r
    for i in range(1, n_arc + 1):
        a = (i / n_arc) * (math.pi * 0.5)
        y = y_arc_start + (y_ankle - y_arc_start) * math.sin(a)
        z = z_arc_top - (z_arc_top - z_arc_start) * math.cos(a)
        tang = Vector((0.0, math.cos(a), math.sin(a))).normalized()
        spine.append((Vector((x_mid, y, z)), tang, False))

    for i in range(1, n_calf + 1):
        u = i / n_calf
        z = z_arc_top + (z_top - z_arc_top) * u
        c_z = slice_centroid_z(verts_foot, z, tol=0.025, fallback=Vector((x_mid, y_ankle, z)))
        spine.append((Vector((c_z.x, c_z.y, z)), Vector((0.0, 0.0, 1.0)), False))

    rings = []
    centers = []
    for idx, (center, tang, is_fore) in enumerate(spine):
        e1 = Vector((1.0, 0.0, 0.0))
        e2 = tang.cross(e1).normalized()
        clr = 0.0050 if idx < 2 else (0.0046 if idx < n_fore + n_arc else 0.0036)
        radii = []
        dirs = []
        max_up_r = 0.062 - 0.020 * min(1.0, max(0.0, (center.y + 0.075) / 0.065))
        for k in range(n_rad):
            a = (k / n_rad) * 2.0 * math.pi
            d = (e1 * math.cos(a) + e2 * math.sin(a)).normalized()
            r = radial_surface_radius(bvh_foot, center, d, max_r=0.085)
            if center.y > -0.075 and tang.z < 0.85 and d.z > 0.25:
                r = min(r, max_up_r)
            radii.append(r)
            dirs.append(d)
        radii = bridge_convex_radii(radii, max_dip=0.0004, passes=8)

        rv = []
        for k in range(n_rad):
            p = ensure_3d_surface_clearance(center + dirs[k] * (radii[k] + clr), bvh_foot, clr, max_dist=0.045)
            rv.append(bm.verts.new(p))
        rings.append(rv)
        centers.append(center)

    # Rounded front toe dome + pole past big toe tip (zero Subsurf shrink poke-through)
    v_toe_pos = ensure_3d_surface_clearance(
        Vector((centers[0].x, y_toe - 0.021, max(0.009, z_toe_mid - 0.004))), bvh_foot, 0.0055, max_dist=0.045
    )
    toe_ring = []
    for v_r0 in rings[0]:
        p_t = v_r0.co.lerp(Vector((v_toe_pos.x, v_toe_pos.y + 0.008, v_toe_pos.z)), 0.36)
        p_t = ensure_3d_surface_clearance(p_t, bvh_foot, 0.0052, max_dist=0.045)
        toe_ring.append(bm.verts.new(p_t))

    v_toe = bm.verts.new(v_toe_pos)
    for k in range(n_rad):
        kn = (k + 1) % n_rad
        bm.faces.new((v_toe, toe_ring[k], toe_ring[kn]))
        bm.faces.new((toe_ring[k], rings[0][k], rings[0][kn], toe_ring[kn]))

    for si in range(len(rings) - 1):
        r0 = rings[si]
        r1 = rings[si + 1]
        for k in range(n_rad):
            kn = (k + 1) % n_rad
            bm.faces.new((r0[k], r1[k], r1[kn], r0[kn]))

    # Smooth instep/ankle bend ONLY (preserve toe rings untouched so big toe never pokes through)
    smooth_verts = [v for r in rings[3:-1] for v in r]
    for _ in range(3):
        bmesh.ops.smooth_vert(bm, verts=smooth_verts, factor=0.45, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    for v in smooth_verts:
        v.co = ensure_3d_surface_clearance(v.co, bvh_foot, 0.0042, max_dist=0.045)

    return rings, centers


def _build_sneaker_upper(
    bm: bmesh.types.BMesh,
    bvh_foot: BVHTree,
    verts_foot,
    side: int,
    sole_top_verts: list[bmesh.types.BMVert],
):
    """Build a sculpted low-top canvas sneaker upper cleanly stitched from rubber cupsole welt -> ankle collar."""
    foot_pts = [p for p in verts_foot if p.z < 0.14]
    x_mid = 0.5 * (min(p.x for p in foot_pts) + max(p.x for p in foot_pts)) if foot_pts else side * 0.068
    y_mid = 0.5 * (min(p.y for p in foot_pts) + max(p.y for p in foot_pts)) if foot_pts else -0.050
    n_circ = len(sole_top_verts)
    c_sole = Vector((x_mid, y_mid, 0.023))
    sole_pts = [Vector((v.co.x, v.co.y, 0.023)).lerp(c_sole, 0.012) for v in sole_top_verts]

    # Measure ankle opening perimeter around (x_mid, 0.024, 0.086)
    c_ankle = slice_centroid_z(verts_foot, 0.086, tol=0.022, fallback=Vector((x_mid, 0.024, 0.086)))
    ankle_pts = []
    for k in range(n_circ):
        a = (k / n_circ) * 2.0 * math.pi
        d_xy = Vector((math.cos(a), math.sin(a), 0.0)).normalized()
        r = radial_surface_radius(bvh_foot, c_ankle, d_xy, max_r=0.085)
        tongue_ext = 0.016 * max(0.0, -d_xy.y)
        z_collar = 0.086 + 0.014 * max(0.0, -d_xy.y) - 0.012 * abs(d_xy.x)
        p = Vector((c_ankle.x + d_xy.x * (r + 0.0075), c_ankle.y + d_xy.y * (r + 0.0085 + tongue_ext), z_collar))
        ankle_pts.append(p)

    # Loft n_rows smooth curves from convex sole welt -> tall rounded toe bumper -> collar rim
    # Using purely convex radial interpolation avoids lateral face-normal pinches over toe creases!
    n_rows = 12
    rows = []
    for ri in range(n_rows):
        t = ri / (n_rows - 1)
        rv = []
        for k in range(n_circ):
            a = (k / n_circ) * 2.0 * math.pi
            is_front = math.sin(a) < 0.0
            u_z = (math.sin(t * math.pi * 0.5) ** 0.72) if is_front else (t ** 0.90)
            u_xy = (t ** 1.85) if is_front else (t ** 1.05)
            p = Vector((
                sole_pts[k].x * (1.0 - u_xy) + ankle_pts[k].x * u_xy,
                sole_pts[k].y * (1.0 - u_xy) + ankle_pts[k].y * u_xy,
                sole_pts[k].z * (1.0 - u_z) + ankle_pts[k].z * u_z,
            ))
            inflate = (0.0135 if (ri > 0 and is_front) else (0.0050 if ri > 0 else 0.0)) * math.sin(t * math.pi)
            out_dir = Vector((math.cos(a) * 0.45, math.sin(a) * 0.65, 0.85)).normalized()
            p += out_dir * inflate
            # Push outward ONLY along convex out_dir if within 8.5mm of foot
            hit_p, _, _, dist = bvh_foot.find_nearest(p, 0.0085)
            if hit_p is not None and dist < 0.0085:
                p += out_dir * (0.0088 - dist)
            rv.append(bm.verts.new(p))
        rows.append(rv)

    # Smooth forefoot dome lightly for clean low-poly silhouette before Subsurf
    vamp_smooth = [v for row in rows[1:-2] for v in row]
    for _ in range(3):
        bmesh.ops.smooth_vert(bm, verts=vamp_smooth, factor=0.45, use_axis_x=True, use_axis_y=True, use_axis_z=True)

    for ri in range(n_rows - 1):
        for k in range(n_circ):
            kn = (k + 1) % n_circ
            bm.faces.new((rows[ri][k], rows[ri][kn], rows[ri + 1][kn], rows[ri + 1][k]))

    welt_faces = []
    for k in range(n_circ):
        kn = (k + 1) % n_circ
        welt_faces.append(bm.faces.new((sole_top_verts[k], sole_top_verts[kn], rows[0][kn], rows[0][k])))

    return rows[-1], c_ankle, welt_faces


def build_red_socks(name: str, bvhs, mat_socks):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    for side, bkey, vkey in (
        (1, "bvh_left_foot", "verts_left_foot"),
        (-1, "bvh_right_foot", "verts_right_foot"),
    ):
        rings, centers = _build_sock_foot(bm, bvhs[bkey], bvhs[vkey], side=side, z_top=0.215)
        add_tucked_edge(bm, rings[-1], centers[-1], 0.0028, Vector((0.0, 0.0, -0.006)))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (co.x * 10.0, (co.y + co.z) * 6.0)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_socks)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        b_f = bvhs["bvh_left_foot"] if v.co.x > 0.002 else bvhs["bvh_right_foot"]
        v.co = ensure_3d_surface_clearance(v.co, b_f, 0.0032, max_dist=0.05)

    return obj


def build_red_sneakers(name: str, bvhs, mat_canvas, mat_rubber, mat_laces):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    sole_faces = set()
    lace_faces = set()

    for side, bkey, vkey in (
        (1, "bvh_left_foot", "verts_left_foot"),
        (-1, "bvh_right_foot", "verts_right_foot"),
    ):
        bvh_f = bvhs[bkey]
        verts_f = bvhs[vkey]
        foot_pts = [p for p in verts_f if p.z < 0.14]
        x_min = min(p.x for p in foot_pts) - 0.011
        x_max = max(p.x for p in foot_pts) + 0.011
        x_mid = 0.5 * (x_min + x_max)
        half_w = 0.5 * (x_max - x_min)

        y_heel = max(p.y for p in foot_pts) + 0.011
        y_toe = min(p.y for p in foot_pts) - 0.013
        n_perim = 36
        sole_bot = []
        sole_top = []
        c_foot_xy = Vector((x_mid, 0.5 * (y_heel + y_toe), 0.0))
        rim_pts = _foot_xy_perimeter(bvh_f, c_foot_xy, n_perim, clearance=0.0135)
        for k in range(n_perim):
            p_rim = rim_pts[k]
            sole_bot.append(bm.verts.new(Vector((p_rim.x, p_rim.y, -0.004))))
            sole_top.append(bm.verts.new(Vector((p_rim.x, p_rim.y, 0.022))))

        for k in range(n_perim):
            kn = (k + 1) % n_perim
            sole_faces.add(bm.faces.new((sole_bot[k], sole_bot[kn], sole_top[kn], sole_top[k])))

        v_bot_c = bm.verts.new(Vector((x_mid, 0.5 * (y_heel + y_toe), -0.004)))
        for k in range(n_perim):
            kn = (k + 1) % n_perim
            sole_faces.add(bm.faces.new((v_bot_c, sole_bot[kn], sole_bot[k])))

        collar_ring, c_collar, welt_faces = _build_sneaker_upper(bm, bvh_f, verts_f, side=side, sole_top_verts=sole_top)
        sole_faces.update(welt_faces)
        add_tucked_edge(bm, collar_ring, c_collar, 0.0045, Vector((0.0, 0.0, -0.009)))

        # Trace exact vamp surface Z so laces lie cleanly flush on the upper tongue
        bvh_shoe = BVHTree.FromBMesh(bm)

        def _vamp_surface_pt(x_q: float, y_q: float, z_fallback: float) -> Vector:
            hit_p, _, _, _ = bvh_shoe.ray_cast(Vector((x_q, y_q, 0.22)), Vector((0.0, 0.0, -1.0)), 0.25)
            z_out = (hit_p.z + 0.0020) if hit_p is not None else z_fallback
            return Vector((x_q, y_q, z_out))

        for li in range(4):
            y_l = -0.095 + li * 0.020
            z_fb = 0.056 + li * 0.010
            for cross_dir in (-1, 1):
                p0 = _vamp_surface_pt(x_mid - 0.019, y_l - 0.006 * cross_dir, z_fb)
                p1 = _vamp_surface_pt(x_mid + 0.019, y_l + 0.006 * cross_dir, z_fb + 0.002)
                p_mid = _vamp_surface_pt(x_mid, y_l, z_fb + 0.006) + Vector((0.0, 0.0, 0.0025))
                pts_lace = [p0, p_mid, p1]
                rad_l = 0.0022
                lace_rings = []
                for pt in pts_lace:
                    rv = []
                    for k in range(6):
                        ang = (k / 6) * 2.0 * math.pi
                        rv.append(bm.verts.new(pt + Vector((0.0, math.cos(ang) * rad_l, math.sin(ang) * rad_l))))
                    lace_rings.append(rv)
                for pi in range(len(lace_rings) - 1):
                    for k in range(6):
                        kn = (k + 1) % 6
                        lace_faces.add(bm.faces.new((lace_rings[pi][k], lace_rings[pi + 1][k], lace_rings[pi + 1][kn], lace_rings[pi][kn])))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f in sole_faces:
            f.material_index = 1
        elif f in lace_faces:
            f.material_index = 2
        else:
            f.material_index = 0
        for loop in f.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (co.y * 5.0, (co.x + co.z) * 5.0)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_canvas)
    obj.data.materials.append(mat_rubber)
    obj.data.materials.append(mat_laces)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    # Post-subsurf safety push along outward radial+upward direction only (never lateral face-normal pinch)
    upper_verts = set()
    for poly in obj.data.polygons:
        if poly.material_index == 0:
            upper_verts.update(poly.vertices)
    for vi in upper_verts:
        v = obj.data.vertices[vi]
        if v.co.z > 0.025:
            b_f = bvhs["bvh_left_foot"] if v.co.x > 0.002 else bvhs["bvh_right_foot"]
            hit_p, _, _, dist = b_f.find_nearest(v.co, 0.0072)
            if hit_p is not None and dist < 0.0072:
                v.co.z += (0.0075 - dist)

    return obj


def generate_footwear(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_feet = [
        bpy.data.objects["body_nude_feet"],
        bpy.data.objects["body_nude_legs"],
    ]

    if only_ids is None or "socks-red" in only_ids:
        socks = build_red_socks("lara_socks_red", bvhs, mats["socks"])
        bind_and_transfer_weights(socks, donor_feet, armature, smooth_passes=1)
        export_garment_glb([socks], armature, "footwear/lara_socks_red.glb")

    if only_ids is None or "sneakers-red" in only_ids:
        sneakers = build_red_sneakers(
            "lara_sneakers_red",
            bvhs,
            mats["sneaker_canvas"],
            mats["sneaker_rubber"],
            mats["cord"],
        )
        bind_and_transfer_weights(sneakers, donor_feet, armature, smooth_passes=1)
        export_garment_glb([sneakers], armature, "footwear/lara_sneakers_red.glb")
