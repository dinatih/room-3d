"""Trouser mesh generators for Lara (legging & sweatpants)."""

import math
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

from .geometry import (
    add_tucked_edge,
    bridge_convex_radii,
    build_drawstrings,
    ensure_z_plane_clearance,
    radial_surface_radius,
    slice_centroid_z,
    smooth_ring_radii,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


def build_trousers(
    name: str,
    bvh_left_leg: BVHTree,
    verts_left_leg,
    bvh_right_leg: BVHTree,
    verts_right_leg,
    bvh_pelvis: BVHTree,
    verts_pelvis,
    z_ankle: float,
    z_cuff_top: float,
    z_crotch: float,
    z_waist_band_bot: float,
    z_waist_top: float,
    clearance_leg,
    clearance_pelvis,
    max_dip_pelvis: float,
    n_leg: int = 32,
    mat_main=None,
    mat_band=None,
    add_waistband_ribs: bool = False,
    add_side_seam_ridge: bool = False,
    add_pocket_welts: bool = False,
    add_drawstrings: bool = False,
    mat_cord=None,
    mat_aglet=None,
    mat_trim=None,
):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    leg_zs = []
    for i in range(5):
        leg_zs.append(z_ankle + (z_cuff_top - z_ankle) * (i / 4.0))
    n_upper_leg = 22
    for i in range(1, n_upper_leg + 1):
        leg_zs.append(z_cuff_top + (z_crotch - z_cuff_top) * (i / n_upper_leg))

    leg_rings = {1: [], -1: []}
    leg_data = {
        1: (bvh_left_leg, verts_left_leg, Vector((0.072, 0.0, 0.5))),
        -1: (bvh_right_leg, verts_right_leg, Vector((-0.072, 0.0, 0.5))),
    }

    for side in (1, -1):
        bvh_l, verts_l, fb = leg_data[side]
        for zi, z in enumerate(leg_zs):
            c = slice_centroid_z(verts_l, z, tol=0.025, fallback=fb)
            radii = []
            dirs = []
            for k in range(n_leg):
                ang = (k / n_leg) * 2.0 * math.pi
                dx = -side * math.cos(ang)
                dy = math.sin(ang)
                d = Vector((dx, dy, 0.0))
                r = radial_surface_radius(bvh_l, c, d, max_r=0.14)
                radii.append(r)
                dirs.append(d)

            radii = bridge_convex_radii(radii, max_dip=0.0020, passes=2)
            radii = smooth_ring_radii(radii, passes=1)

            ring_verts = []
            for k in range(n_leg):
                ang = (k / n_leg) * 2.0 * math.pi
                clr = clearance_leg(z, ang, zi)
                if add_side_seam_ridge and (k == n_leg // 2 or k == 0):
                    clr += 0.0009
                p = c + dirs[k] * (radii[k] + clr)
                if side == 1 and p.x < 0.0025:
                    p.x = 0.0025
                elif side == -1 and p.x > 0.0018:
                    p.x = 0.0018
                ring_verts.append(bm.verts.new(p))
            leg_rings[side].append(ring_verts)

    for side in (1, -1):
        rings = leg_rings[side]
        for zi in range(len(rings) - 1):
            r0 = rings[zi]
            r1 = rings[zi + 1]
            for k in range(n_leg):
                kn = (k + 1) % n_leg
                if side == -1:
                    bm.faces.new((r0[k], r0[kn], r1[kn], r1[k]))
                else:
                    bm.faces.new((r0[k], r1[k], r1[kn], r0[kn]))

    for side in (1, -1):
        _, verts_l, fb = leg_data[side]
        c_ank = slice_centroid_z(verts_l, z_ankle, tol=0.025, fallback=fb)
        add_tucked_edge(bm, leg_rings[side][0], c_ank, 0.0045, Vector((0.0, 0.0, 0.008)))

    l_top = leg_rings[1][-1]
    r_top = leg_rings[-1][-1]

    v_crotch_mid = bm.verts.new(Vector((0.0022, 0.005, z_crotch - 0.005)))
    v_crotch_front = bm.verts.new(Vector((0.0022, -0.048, z_crotch + 0.022)))
    v_crotch_back = bm.verts.new(Vector((0.0022, 0.056, z_crotch + 0.022)))

    bm.faces.new((l_top[0], v_crotch_mid, v_crotch_front, l_top[n_leg - 1]))
    bm.faces.new((r_top[0], r_top[n_leg - 1], v_crotch_front, v_crotch_mid))
    bm.faces.new((l_top[0], l_top[1], v_crotch_back, v_crotch_mid))
    bm.faces.new((r_top[0], v_crotch_mid, v_crotch_back, r_top[1]))

    pelvis_loop_0 = (
        [v_crotch_front]
        + [l_top[n_leg - 1 - i] for i in range(n_leg - 1)]
        + [v_crotch_back]
        + [r_top[1 + i] for i in range(n_leg - 1)]
    )
    n_pelvis = len(pelvis_loop_0)

    pelvis_zs = []
    n_hip_rings = 11
    for i in range(1, n_hip_rings + 1):
        pelvis_zs.append(z_crotch + (z_waist_band_bot - z_crotch) * (i / n_hip_rings))
    n_band_rings = 6
    for i in range(1, n_band_rings + 1):
        pelvis_zs.append(z_waist_band_bot + (z_waist_top - z_waist_band_bot) * (i / n_band_rings))

    pelvis_rings = [pelvis_loop_0]
    for zi, z in enumerate(pelvis_zs):
        c = slice_centroid_z(verts_pelvis, z, tol=0.025, fallback=Vector((0.0022, 0.0, z)))
        radii = []
        dirs = []
        thetas = []
        for pi in range(n_pelvis):
            theta = -0.5 * math.pi + (pi / n_pelvis) * 2.0 * math.pi
            d = Vector((math.cos(theta), math.sin(theta), 0.0))
            r = radial_surface_radius(bvh_pelvis, c, d, max_r=0.25)
            radii.append(r)
            dirs.append(d)
            thetas.append(theta)

        radii = bridge_convex_radii(radii, max_dip=max_dip_pelvis, passes=6)
        radii = smooth_ring_radii(radii, passes=2)

        is_band = z >= z_waist_band_bot - 1e-4
        band_t = (z - z_waist_band_bot) / max(1e-5, (z_waist_top - z_waist_band_bot)) if is_band else 0.0
        rib_bump = 0.0012 * math.sin(band_t * math.pi * 6.0) if (is_band and add_waistband_ribs) else 0.0

        ring_verts = []
        for pi in range(n_pelvis):
            clr = clearance_pelvis(z, thetas[pi], is_band, band_t) + rib_bump
            if add_side_seam_ridge and (pi == n_pelvis // 4 or pi == 3 * n_pelvis // 4):
                clr += 0.0009
            p = c + dirs[pi] * (radii[pi] + clr)
            if zi < 2:
                prev_p = pelvis_rings[-1][pi].co
                blend = 0.42 if zi == 0 else 0.78
                p = prev_p.lerp(p, blend)
                if z >= 0.805:
                    p = ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_pelvis, 0.0035, max_r=0.25)
            ring_verts.append(bm.verts.new(p))
        pelvis_rings.append(ring_verts)

    for zi in range(len(pelvis_rings) - 1):
        r0 = pelvis_rings[zi]
        r1 = pelvis_rings[zi + 1]
        for pi in range(n_pelvis):
            pn = (pi + 1) % n_pelvis
            bm.faces.new((r0[pi], r0[pn], r1[pn], r1[pi]))

    c_waist = slice_centroid_z(verts_pelvis, z_waist_top, tol=0.025, fallback=Vector((0.0022, 0.0, z_waist_top)))
    add_tucked_edge(bm, pelvis_rings[-1], c_waist, 0.0045, Vector((0.0, 0.0, -0.007)))

    welt_faces = set()
    if add_pocket_welts:
        for side in (1, -1):
            welt_top = []
            welt_bot = []
            for s in range(8):
                t = s / 7.0
                z_p = 1.005 - 0.135 * t
                theta_p = (-0.08 if side == 1 else math.pi + 0.08) - side * 0.36 * (1.0 - t)
                c_p = slice_centroid_z(verts_pelvis, z_p, tol=0.025, fallback=Vector((0.0022, 0.0, z_p)))
                d_p = Vector((math.cos(theta_p), math.sin(theta_p), 0.0))
                r_p = radial_surface_radius(bvh_pelvis, c_p, d_p, max_r=0.25)
                clr_w = clearance_pelvis(z_p, theta_p, False, 0.0)
                p_out = c_p + d_p * (r_p + clr_w + 0.0032)
                p_in = c_p + d_p * (r_p + clr_w - 0.0022) + Vector((0.006 * side, -0.006, 0.0))
                welt_top.append(bm.verts.new(p_out))
                welt_bot.append(bm.verts.new(p_in))
            for s in range(7):
                if side == 1:
                    f = bm.faces.new((welt_top[s], welt_bot[s], welt_bot[s + 1], welt_top[s + 1]))
                else:
                    f = bm.faces.new((welt_top[s], welt_top[s + 1], welt_bot[s + 1], welt_bot[s]))
                welt_faces.add(f)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            ang = math.atan2(co.y, co.x - (0.068 if co.x > 0.02 else (-0.068 if co.x < -0.02 else 0.0)))
            loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 1.6, co.z * 2.2)

    for f in bm.faces:
        if mat_trim is not None and f in welt_faces:
            f.material_index = 2 if (mat_band is not None and mat_band != mat_main) else 1
        else:
            f.material_index = 0

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    obj.data.materials.append(mat_main)
    idx_band = 0
    if mat_band is not None and mat_band != mat_main:
        obj.data.materials.append(mat_band)
        idx_band = len(obj.data.materials) - 1
    if mat_trim is not None:
        obj.data.materials.append(mat_trim)

    if idx_band > 0:
        for poly in obj.data.polygons:
            if poly.material_index == 0:
                z_avg = sum(obj.data.vertices[vi].co.z for vi in poly.vertices) / len(poly.vertices)
                if z_avg >= z_waist_band_bot - 0.002 or z_avg <= z_cuff_top + 0.002:
                    poly.material_index = idx_band

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        z = v.co.z
        if z >= 0.805:
            c_p = slice_centroid_z(verts_pelvis, z, tol=0.03, fallback=Vector((0.0022, 0.0, z)))
            clr_p = 0.0068 if (v.co.y > 0.02 and 0.805 <= z <= 0.98) else 0.0052
            v.co = ensure_z_plane_clearance(v.co, Vector((c_p.x, c_p.y)), bvh_pelvis, clr_p, max_r=0.25)
        elif v.co.x > 0.008:
            c_l = slice_centroid_z(verts_left_leg, z, tol=0.03, fallback=Vector((0.072, 0.0, z)))
            clr_min = 0.0062 if 0.46 < z < 0.62 else 0.0046
            v.co = ensure_z_plane_clearance(v.co, Vector((c_l.x, c_l.y)), bvh_left_leg, clr_min, max_r=0.14)
        elif v.co.x < -0.004:
            c_r = slice_centroid_z(verts_right_leg, z, tol=0.03, fallback=Vector((-0.072, 0.0, z)))
            clr_min = 0.0062 if 0.46 < z < 0.62 else 0.0046
            v.co = ensure_z_plane_clearance(v.co, Vector((c_r.x, c_r.y)), bvh_right_leg, clr_min, max_r=0.14)

    if add_drawstrings and mat_cord is not None:
        cords_obj = build_drawstrings(
            f"{name}_drawstrings",
            bvh_pelvis,
            verts_pelvis,
            eyelets=[(-0.014, 1.054), (0.018, 1.054)],
            z_end=0.955,
            mat_cord=mat_cord,
            mat_aglet=mat_aglet,
            extra_y=-0.015,
        )
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        cords_obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.join()

    return obj


def _sweat_leg_clr(z: float, ang: float, zi: int) -> float:
    if z <= 0.225:
        base = 0.0055 + 0.0105 * max(0.0, min(1.0, (z - 0.185) / 0.04))
    else:
        base = 0.0155 + 0.0038 * math.sin((z - 0.22) / 0.56 * math.pi) + 0.0016 * math.cos(ang * 3.0)
    if z > 0.60 and math.cos(ang) > 0.0:
        inner_t = max(0.0, min(1.0, (z - 0.60) / 0.18)) * math.cos(ang)
        return base * (1.0 - 0.62 * inner_t)
    return base


SPECS = [
    {
        "id": "legging",
        "filename": "bottoms/lara_legging.glb",
    },
    {
        "id": "sweatpants",
        "filename": "bottoms/lara_sweatpants.glb",
    },
]


def generate_trousers(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_legs = [
        bpy.data.objects["body_nude_feet"],
        bpy.data.objects["body_nude_legs"],
        bpy.data.objects["body_nude_panties"],
        bpy.data.objects["body_nude_torso"],
    ]

    if only_ids is None or "legging" in only_ids:
        legging = build_trousers(
            name="lara_legging",
            bvh_left_leg=bvhs["bvh_left_leg"],
            verts_left_leg=bvhs["verts_left_leg"],
            bvh_right_leg=bvhs["bvh_right_leg"],
            verts_right_leg=bvhs["verts_right_leg"],
            bvh_pelvis=bvhs["bvh_pelvis"],
            verts_pelvis=bvhs["verts_pelvis"],
            z_ankle=0.145,
            z_cuff_top=0.175,
            z_crotch=0.778,
            z_waist_band_bot=1.045,
            z_waist_top=1.095,
            clearance_leg=lambda z, ang, zi: 0.0055 + (0.0018 if 0.46 < z < 0.62 else 0.0),
            clearance_pelvis=lambda z, th, is_band, bt: (
                0.0074 if is_band else (0.0086 if (math.sin(th) > 0.15 and 0.80 < z < 0.98) else 0.0058)
            ),
            max_dip_pelvis=0.0018,
            n_leg=32,
            mat_main=mats["legging"],
            mat_band=mats["legging"],
            add_waistband_ribs=False,
            add_side_seam_ridge=True,
            add_pocket_welts=False,
            add_drawstrings=False,
        )
        bind_and_transfer_weights(legging, donor_legs, armature, smooth_passes=1)
        export_garment_glb([legging], armature, "bottoms/lara_legging.glb")

    if only_ids is None or "sweatpants" in only_ids:
        sweatpants = build_trousers(
            name="lara_sweatpants",
            bvh_left_leg=bvhs["bvh_left_leg"],
            verts_left_leg=bvhs["verts_left_leg"],
            bvh_right_leg=bvhs["bvh_right_leg"],
            verts_right_leg=bvhs["verts_right_leg"],
            bvh_pelvis=bvhs["bvh_pelvis"],
            verts_pelvis=bvhs["verts_pelvis"],
            z_ankle=0.155,
            z_cuff_top=0.205,
            z_crotch=0.778,
            z_waist_band_bot=1.022,
            z_waist_top=1.080,
            clearance_leg=_sweat_leg_clr,
            clearance_pelvis=lambda z, th, is_band, bt: 0.0082 if is_band else 0.0145,
            max_dip_pelvis=0.0012,
            n_leg=32,
            mat_main=mats["fleece"],
            mat_band=mats["rib"],
            add_waistband_ribs=True,
            add_side_seam_ridge=True,
            add_pocket_welts=False,
            add_drawstrings=True,
            mat_cord=mats["cord"],
            mat_aglet=mats["zip_metal_red"],
            mat_trim=mats["zip_tape"],
        )
        bind_and_transfer_weights(sweatpants, donor_legs, armature, smooth_passes=1)
        export_garment_glb([sweatpants], armature, "bottoms/lara_sweatpants.glb")
