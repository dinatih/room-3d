"""Deterministic skinning / weight transfer and GLB export for Lara garments."""

import os
import bpy
import bmesh
from mathutils.bvhtree import BVHTree

from .common import OUT_DIR


def _build_donor_bvh(source_objs, bone_names: set[str], bone_attenuation: dict[str, float] | None):
    donor_bm = bmesh.new()
    vert_weights = []
    for s in source_objs:
        vg_names = [vg.name for vg in s.vertex_groups]
        for v in s.data.vertices:
            wmap = {}
            for g in v.groups:
                bname = vg_names[g.group]
                if bname in bone_names and g.weight > 1e-4:
                    w = g.weight
                    if bone_attenuation and bname in bone_attenuation:
                        w *= bone_attenuation[bname]
                    if w > 1e-4:
                        wmap[bname] = w
            vert_weights.append(wmap)
        tmp_bm = bmesh.new()
        tmp_bm.from_mesh(s.data)
        tmp_bm.verts.ensure_lookup_table()
        new_verts = [donor_bm.verts.new(v.co) for v in tmp_bm.verts]
        for f in tmp_bm.faces:
            try:
                donor_bm.faces.new([new_verts[v.index] for v in f.verts])
            except ValueError:
                pass
        tmp_bm.free()

    donor_bm.verts.ensure_lookup_table()
    donor_bm.faces.ensure_lookup_table()
    donor_bvh = BVHTree.FromBMesh(donor_bm)
    return donor_bm, donor_bvh, vert_weights


def bind_and_transfer_weights(
    garment_obj,
    source_objs,
    armature_obj,
    bone_attenuation: dict[str, float] | None = None,
    smooth_passes: int = 1,
    region_selector=None,
):
    """
    Transfer bone weights from Lara's native body meshes directly via BVHTree
    nearest-triangle vertex interpolation + topological smoothing, ensuring
    every vertex has <= 4 normalized influences matching Armature bones.
    """
    garment_obj.vertex_groups.clear()
    bone_names = {b.name for b in armature_obj.data.bones}

    donor_cache = {}

    def _get_donor(objs):
        key = tuple(id(o) for o in objs)
        if key not in donor_cache:
            donor_cache[key] = _build_donor_bvh(objs, bone_names, bone_attenuation)
        return donor_cache[key]

    _get_donor(source_objs)

    g_verts = garment_obj.data.vertices
    n_gv = len(g_verts)
    raw_weights = []
    for v in g_verts:
        objs = region_selector(v.co) if region_selector is not None else source_objs
        donor_bm, donor_bvh, vert_weights = _get_donor(objs)
        loc, _, f_idx, _ = donor_bvh.find_nearest(v.co)
        w_acc = {}
        if f_idx is not None:
            face = donor_bm.faces[f_idx]
            inv_d_sum = 0.0
            for fv in face.verts:
                d = (fv.co - loc).length
                inv_d = 1.0 / (d + 1e-4)
                inv_d_sum += inv_d
                for bname, bw in vert_weights[fv.index].items():
                    w_acc[bname] = w_acc.get(bname, 0.0) + bw * inv_d
            if inv_d_sum > 0.0:
                for bname in w_acc:
                    w_acc[bname] /= inv_d_sum
        if not w_acc:
            w_acc = {"spine_lower": 1.0}
        raw_weights.append(w_acc)

    for donor_bm, _, _ in donor_cache.values():
        donor_bm.free()

    adj = [[] for _ in range(n_gv)]
    for e in garment_obj.data.edges:
        adj[e.vertices[0]].append(e.vertices[1])
        adj[e.vertices[1]].append(e.vertices[0])

    for _ in range(smooth_passes):
        smoothed = []
        for vi in range(n_gv):
            nbrs = adj[vi]
            if not nbrs:
                smoothed.append(raw_weights[vi])
                continue
            acc = {}
            for bname, bw in raw_weights[vi].items():
                acc[bname] = acc.get(bname, 0.0) + bw * 0.60
            nbr_factor = 0.40 / len(nbrs)
            for ni in nbrs:
                for bname, bw in raw_weights[ni].items():
                    acc[bname] = acc.get(bname, 0.0) + bw * nbr_factor
            smoothed.append(acc)
        raw_weights = smoothed

    vg_cache = {}
    for vi, wmap in enumerate(raw_weights):
        top4 = sorted(wmap.items(), key=lambda kv: kv[1], reverse=True)[:4]
        s = sum(w for _, w in top4)
        if s <= 1e-6:
            top4 = [("spine_lower", 1.0)]
            s = 1.0
        for bname, w in top4:
            nw = w / s
            if nw < 1e-4:
                continue
            vg = vg_cache.get(bname)
            if vg is None:
                vg = garment_obj.vertex_groups.new(name=bname)
                vg_cache[bname] = vg
            vg.add([vi], nw, "REPLACE")

    armature_obj.hide_set(False)
    armature_obj.hide_viewport = False
    garment_obj.parent = armature_obj
    arm_mod = garment_obj.modifiers.new("Armature", "ARMATURE")
    arm_mod.object = armature_obj


def export_garment_glb(garment_objs, armature_obj, rel_out_path: str):
    armature_obj.hide_set(False)
    armature_obj.hide_viewport = False
    bpy.ops.object.select_all(action="DESELECT")
    armature_obj.select_set(True)
    for obj in garment_objs:
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj

    out_path = os.path.join(OUT_DIR, rel_out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_skins=True,
        export_all_influences=False,
        export_def_bones=False,
        export_materials="EXPORT",
        export_normals=True,
        export_texcoords=True,
        export_tangents=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes)")
    return out_path
