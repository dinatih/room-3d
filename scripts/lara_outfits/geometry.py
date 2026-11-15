"""Clean region-separated body BVHs, clearance helpers, and cord builders."""

import math
import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def _orient_mesh_islands_outward(bm: bmesh.types.BMesh):
    """Ensure every connected mesh island has consistently outward-pointing face normals."""
    bm.faces.ensure_lookup_table()
    visited = set()
    for seed in bm.faces:
        if seed in visited:
            continue
        island = []
        stack = [seed]
        visited.add(seed)
        while stack:
            f = stack.pop()
            island.append(f)
            for e in f.edges:
                for lf in e.link_faces:
                    if lf not in visited:
                        visited.add(lf)
                        stack.append(lf)

        bmesh.ops.recalc_face_normals(bm, faces=island)
        bm.normal_update()

        verts_island = {v for f in island for v in f.verts}
        if not verts_island:
            continue
        center = sum((v.co for v in verts_island), Vector((0.0, 0.0, 0.0))) / len(verts_island)
        radii = sorted((f.calc_center_median() - center).length for f in island)
        thresh = radii[int(len(radii) * 0.80)] if len(radii) > 5 else 0.0
        score = sum(
            (f.calc_center_median() - center).dot(f.normal)
            for f in island
            if (f.calc_center_median() - center).length >= thresh
        )
        if score < 0.0:
            bmesh.ops.reverse_faces(bm, faces=island)

    bm.normal_update()


def build_filtered_bvh(obj_names, face_filter=None):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    for name in obj_names:
        src = bpy.data.objects.get(name)
        if not src:
            raise RuntimeError(f"Missing Lara reference mesh: {name}")
        tmp_mesh = bpy.data.meshes.new_from_object(src.evaluated_get(depsgraph))
        bm_part = bmesh.new()
        bm_part.from_mesh(tmp_mesh)
        bpy.data.meshes.remove(tmp_mesh)
        _orient_mesh_islands_outward(bm_part)
        # Merge into combined bmesh via temporary mesh
        tmp_oriented = bpy.data.meshes.new(f"_tmp_{name}")
        bm_part.to_mesh(tmp_oriented)
        bm_part.free()
        bm.from_mesh(tmp_oriented)
        bpy.data.meshes.remove(tmp_oriented)

    bm.normal_update()
    if face_filter is not None:
        to_del = [f for f in bm.faces if not face_filter(f)]
        if to_del:
            bmesh.ops.delete(bm, geom=to_del, context="FACES")
        loose_verts = [v for v in bm.verts if not v.link_faces]
        if loose_verts:
            bmesh.ops.delete(bm, geom=loose_verts, context="VERTS")

    verts = [v.co.copy() for v in bm.verts]
    bvh = BVHTree.FromBMesh(bm)
    bm.free()
    return bvh, verts


def slice_centroid_z(verts, z: float, tol: float = 0.025, fallback=Vector((0.0, 0.0, 0.0))):
    pts = [p for p in verts if abs(p.z - z) <= tol]
    if not pts:
        pts = [p for p in verts if abs(p.z - z) <= tol * 2.5]
    if not pts:
        return Vector((fallback.x, fallback.y, z))
    cx = 0.5 * (min(p.x for p in pts) + max(p.x for p in pts))
    cy = 0.5 * (min(p.y for p in pts) + max(p.y for p in pts))
    return Vector((cx, cy, z))


def slice_centroid_x(verts, x: float, tol: float = 0.025):
    pts = [p for p in verts if abs(p.x - x) <= tol]
    if not pts:
        pts = [p for p in verts if abs(p.x - x) <= tol * 2.5]
    if not pts:
        return Vector((x, 0.004, 1.425))
    cy = 0.5 * (min(p.y for p in pts) + max(p.y for p in pts))
    cz = 0.5 * (min(p.z for p in pts) + max(p.z for p in pts))
    return Vector((x, cy, cz))


def radial_surface_radius(bvh: BVHTree, center: Vector, d: Vector, max_r: float = 0.25) -> float:
    dn = d.normalized()
    best_r = None
    hit_in, _, _, _ = bvh.ray_cast(center + dn * max_r, -dn, max_r * 1.1)
    if hit_in is not None:
        r_in = (hit_in - center).dot(dn)
        if r_in > 0.005:
            best_r = r_in

    hit_out, _, _, _ = bvh.ray_cast(center, dn, max_r)
    if hit_out is not None:
        r_out = (hit_out - center).dot(dn)
        if r_out > 0.005 and (best_r is None or r_out > best_r):
            best_r = r_out

    if best_r is not None:
        return best_r

    loc, _, _, _ = bvh.find_nearest(center + dn * 0.06)
    if loc is not None:
        return max(0.020, (loc - center).dot(dn))
    return 0.05


def ensure_radial_clearance(p: Vector, center: Vector, bvh: BVHTree, min_clear: float, max_r: float = 0.28) -> Vector:
    diff = p - center
    r = diff.length
    if r < 1e-6:
        return p
    d = diff / r
    r_surf = radial_surface_radius(bvh, center, d, max_r=max_r)
    if r < r_surf + min_clear:
        return center + d * (r_surf + min_clear)
    return p


def ensure_z_plane_clearance(p: Vector, center_xy: Vector, bvh: BVHTree, min_clear: float, max_r: float = 0.28) -> Vector:
    d = Vector((p.x - center_xy.x, p.y - center_xy.y, 0.0))
    r = d.length
    if r < 1e-6:
        return p
    dn = d / r
    c = Vector((center_xy.x, center_xy.y, p.z))
    r_surf = radial_surface_radius(bvh, c, dn, max_r=max_r)
    if r < r_surf + min_clear:
        return c + dn * (r_surf + min_clear)
    return p


def ensure_3d_surface_clearance(p: Vector, bvh: BVHTree, min_clear: float, max_dist: float = 0.03) -> Vector:
    loc, nrm, _, dist = bvh.find_nearest(p, max_dist)
    if loc is None:
        return p
    signed = (p - loc).dot(nrm)
    if signed < min_clear:
        return loc + nrm * min_clear
    return p


def bridge_convex_radii(radii: list[float], max_dip: float = 0.0020, passes: int = 5) -> list[float]:
    n = len(radii)
    r = list(radii)
    for _ in range(passes):
        nxt = list(r)
        for i in range(n):
            avg = 0.5 * (r[(i - 1) % n] + r[(i + 1) % n])
            if r[i] < avg - max_dip:
                nxt[i] = avg - max_dip * 0.35
        r = nxt
    return r


def smooth_ring_radii(radii: list[float], passes: int = 2) -> list[float]:
    r = list(radii)
    for _ in range(passes):
        r = [0.25 * r[(i - 1) % len(r)] + 0.5 * r[i] + 0.25 * r[(i + 1) % len(r)] for i in range(len(r))]
    return r


def add_tucked_edge(bm: bmesh.types.BMesh, edge_loop_verts, center: Vector, radial_inset: float, axial_offset: Vector):
    n = len(edge_loop_verts)
    inner_verts = []
    for v in edge_loop_verts:
        d = Vector((v.co.x - center.x, v.co.y - center.y, 0.0))
        if d.length > 1e-5:
            d.normalize()
        else:
            d = Vector((0.0, 0.0, 0.0))
        iv = bm.verts.new(v.co - d * radial_inset + axial_offset)
        inner_verts.append(iv)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((edge_loop_verts[i], edge_loop_verts[j], inner_verts[j], inner_verts[i]))
    return inner_verts


def build_drawstrings(
    name: str,
    bvh_front: BVHTree,
    verts_front,
    eyelets,
    z_end: float,
    mat_cord,
    mat_aglet=None,
    extra_y: float = -0.016,
):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    aglet_faces = set()

    for side_idx, eyelet in enumerate(eyelets):
        if len(eyelet) == 3:
            ex, ey_anchor, ez = eyelet
        else:
            ex, ez = eyelet
            ey_anchor = None
        sign = -1.0 if side_idx == 0 else 1.0
        pts = []
        n_steps = 14
        for i in range(n_steps):
            t = i / (n_steps - 1)
            z = ez - (ez - z_end) * t
            x = ex + sign * 0.010 * math.sin(t * math.pi * 0.75) + sign * 0.004 * t
            c = slice_centroid_z(verts_front, z, tol=0.03, fallback=Vector((0.0022, 0.0, z)))
            r_surf = radial_surface_radius(bvh_front, Vector((x, c.y, z)), Vector((0.0, -1.0, 0.0)), max_r=0.22)
            y_surf = c.y - r_surf + extra_y - 0.004 * math.sin(t * math.pi)
            if ey_anchor is not None and i < 4:
                blend = 1.0 - (i / 3.0)
                y = y_surf * (1.0 - blend) + ey_anchor * blend
            else:
                y = y_surf
            pts.append(Vector((x, y, z)))

        n_rad = 8
        radius = 0.0025
        rings = []
        for i, p in enumerate(pts):
            if i == 0:
                tang = (pts[1] - pts[0]).normalized()
            elif i == len(pts) - 1:
                tang = (pts[-1] - pts[-2]).normalized()
            else:
                tang = (pts[i + 1] - pts[i - 1]).normalized()
            up_ref = Vector((1.0, 0.0, 0.0)) if abs(tang.x) < 0.8 else Vector((0.0, 1.0, 0.0))
            b1 = tang.cross(up_ref).normalized()
            b2 = tang.cross(b1).normalized()
            r_cur = radius * (1.22 if i >= n_steps - 3 else 1.0)
            rv = []
            for k in range(n_rad):
                a = (k / n_rad) * 2.0 * math.pi
                rv.append(bm.verts.new(p + (b1 * math.cos(a) + b2 * math.sin(a)) * r_cur))
            rings.append(rv)

        for i in range(len(rings) - 1):
            for k in range(n_rad):
                kn = (k + 1) % n_rad
                f = bm.faces.new((rings[i][k], rings[i][kn], rings[i + 1][kn], rings[i + 1][k]))
                if i >= len(rings) - 3:
                    aglet_faces.add(f)
        aglet_faces.add(bm.faces.new(rings[-1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f in aglet_faces:
            f.material_index = 1 if mat_aglet is not None else 0
        else:
            f.material_index = 0
        for loop in f.loops:
            loop[uv_layer].uv = (loop.vert.co.x * 18.0, loop.vert.co.z * 18.0)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_cord)
    if mat_aglet is not None:
        obj.data.materials.append(mat_aglet)
    return obj


def build_body_bvhs():
    bvh_left_leg, verts_left_leg = build_filtered_bvh(
        ["body_nude_feet", "body_nude_legs"],
        face_filter=lambda f: f.calc_center_median().x > 0.0022 and f.calc_center_median().z < 0.86,
    )
    bvh_right_leg, verts_right_leg = build_filtered_bvh(
        ["body_nude_feet", "body_nude_legs"],
        face_filter=lambda f: f.calc_center_median().x <= 0.0022 and f.calc_center_median().z < 0.86,
    )
    bvh_pelvis, verts_pelvis = build_filtered_bvh(
        ["body_nude_legs", "body_nude_torso"],
        face_filter=lambda f: 0.76 <= f.calc_center_median().z <= 1.15,
    )
    bvh_torso, verts_torso = build_filtered_bvh(
        ["body_nude_legs", "body_nude_torso"],
        face_filter=lambda f: 0.90 <= f.calc_center_median().z <= 1.54,
    )
    bvh_left_arm, verts_left_arm = build_filtered_bvh(
        ["arms"],
        face_filter=lambda f: f.calc_center_median().x > 0.0,
    )
    bvh_right_arm, verts_right_arm = build_filtered_bvh(
        ["arms"],
        face_filter=lambda f: f.calc_center_median().x < 0.0,
    )
    bvh_left_foot, verts_left_foot = build_filtered_bvh(
        ["body_nude_feet", "body_nude_legs"],
        face_filter=lambda f: f.calc_center_median().x > 0.0022 and f.calc_center_median().z < 0.32,
    )
    bvh_right_foot, verts_right_foot = build_filtered_bvh(
        ["body_nude_feet", "body_nude_legs"],
        face_filter=lambda f: f.calc_center_median().x <= 0.0022 and f.calc_center_median().z < 0.32,
    )
    return {
        "bvh_left_leg": bvh_left_leg,
        "verts_left_leg": verts_left_leg,
        "bvh_right_leg": bvh_right_leg,
        "verts_right_leg": verts_right_leg,
        "bvh_pelvis": bvh_pelvis,
        "verts_pelvis": verts_pelvis,
        "bvh_torso": bvh_torso,
        "verts_torso": verts_torso,
        "bvh_left_arm": bvh_left_arm,
        "verts_left_arm": verts_left_arm,
        "bvh_right_arm": bvh_right_arm,
        "verts_right_arm": verts_right_arm,
        "bvh_left_foot": bvh_left_foot,
        "verts_left_foot": verts_left_foot,
        "bvh_right_foot": bvh_right_foot,
        "verts_right_foot": verts_right_foot,
    }
