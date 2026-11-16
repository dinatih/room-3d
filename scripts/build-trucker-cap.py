#!/usr/bin/env python3
"""
build-trucker-cap.py — Construit le fichier Blender (.blend) et exporte le GLB de
la casquette de camionneur rouge à partir de cap-m-low.zip :
  - Supprime l'écusson rouge/noir frontal (Cap_M02_low).
  - Peint l'ensemble de la casquette (panneaux, visière, filet, bandeau, bouton,
    lanière snapback) en rouge vif saturé tout en conservant le tissage, les
    surpiqûres, la rugosité (matière tissu vs plastique) et l'opacité du filet.
  - Met à l'échelle réelle (largeur 20,0 cm), centre X/Z, pose au sol Y=0,
    packe les textures dans public/items/trucker-cap-red/trucker-cap-red.blend
    et exporte public/items/trucker-cap-red/TruckerCapRed.glb (1 Draw Call, Draco).

Usage :
  blender -b -P scripts/build-trucker-cap.py -- --render
"""
import argparse
import json
import math
import os
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET

import bpy
import bmesh
import numpy as np
from mathutils import Euler, Matrix, Vector
from PIL import Image, ImageFilter

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_ZIP = "/home/dinatih/3D Resources/others furniture/cap-m-low.zip"
EXTRACT_DIR = "/tmp/cap_m_low"
DAE_PATH = os.path.join(EXTRACT_DIR, "model", "model", "model.dae")
SRC_TEX_DIR = os.path.join(EXTRACT_DIR, "textures")
WORK_TEX_DIR = "/tmp/cap_m_red_tex"

OUT_DIR = os.path.join(REPO_ROOT, "public", "items", "trucker-cap-red")
OUT_BLEND = os.path.join(OUT_DIR, "trucker-cap-red.blend")
OUT_GLB = os.path.join(OUT_DIR, "TruckerCapRed.glb")
RENDER_DIR = (
    "/home/dinatih/.gemini/antigravity-cli/brain/"
    "23ad45a2-31a1-49bf-a3f8-542818ad8a9f/scratch"
)

TARGET_WIDTH_M = 0.185  # 18.5 cm largeur réelle d'une casquette adulte (~18.5 × 29.8 × 18 cm)
PATCH_SUBMESH_NAME = "Cap_M02_low"
TEX_SIZE = 2048  # Préserve la finesse des mailles du filet arrière sans bavure

SUBMESH_RENAMES = {
    "Cap_M01_low": "Crown_Panels",
    "Cap_M03_low": "Front_Binding_Seams",
    "Cap_M04_low": "Visor_Brim",
    "Cap_M05_low": "Rear_Mesh_And_Lining",
    "Cap_M06_low": "Top_Button",
    "Cap_M07_low": "Snapback_Strap",
}


def ensure_source_extracted():
    if os.path.isfile(DAE_PATH) and os.path.isdir(SRC_TEX_DIR):
        return
    os.makedirs(EXTRACT_DIR, exist_ok=True)
    subprocess.run(["unzip", "-q", "-o", SOURCE_ZIP, "-d", EXTRACT_DIR], check=True)
    subprocess.run(
        ["unzip", "-q", "-o", os.path.join(EXTRACT_DIR, "source", "model.zip"), "-d", os.path.join(EXTRACT_DIR, "model")],
        check=True,
    )


def prepare_red_textures():
    """Transforme les textures 4K sources en textures 2K entièrement rouges."""
    os.makedirs(WORK_TEX_DIR, exist_ok=True)

    alb_raw = np.asarray(Image.open(os.path.join(SRC_TEX_DIR, "Cap_M_albedo.jpg")).convert("RGB")).astype(np.float32)
    rgh_raw = np.asarray(Image.open(os.path.join(SRC_TEX_DIR, "Cap_M_roughness.jpg")).convert("L")).astype(np.float32)
    opa_raw = np.asarray(Image.open(os.path.join(SRC_TEX_DIR, "Cap_M_opacity.jpg")).convert("L")).astype(np.float32)
    nrm_img = Image.open(os.path.join(SRC_TEX_DIR, "Cap_M_normal.jpg")).convert("RGB")

    # Luminance de référence du modèle d'origine (~20..65)
    lum = 0.299 * alb_raw[:, :, 0] + 0.587 * alb_raw[:, :, 1] + 0.114 * alb_raw[:, :, 2]

    # Flou basse fréquence pour préserver les micro-détails de tissage/coutures sans les taches sombres
    lum_blur_img = Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(radius=28))
    lum_blur = np.asarray(lum_blur_img).astype(np.float32)

    # Détail micro très doux (la normal map porte déjà le tissage, évite le bruit coûteux en PNG)
    micro_detail = np.clip(lum / np.maximum(lum_blur, 14.0), 0.90, 1.07)
    macro_shade = np.clip((np.maximum(lum_blur, 12.0) / 45.0) ** 0.24, 0.84, 1.04)
    shade = micro_detail * macro_shade

    # Rouge vif saturé fidèle à une casquette neuve (sans aspect corail sous AgX/EEVEE)
    red_base = np.array([174.0, 5.0, 8.0], dtype=np.float32)
    red_rgb = np.clip(red_base[None, None, :] * shade[:, :, None], 0, 255).astype(np.uint8)

    # Redimensionnement net vers TEX_SIZE × TEX_SIZE
    red_img = Image.fromarray(red_rgb, "RGB").resize((TEX_SIZE, TEX_SIZE), Image.Resampling.LANCZOS)
    opa_img = Image.fromarray(np.clip(opa_raw, 0, 255).astype(np.uint8), "L").resize((TEX_SIZE, TEX_SIZE), Image.Resampling.LANCZOS)
    opa_arr = np.asarray(opa_img).astype(np.float32)
    opa_sharp = np.where(opa_arr >= 128.0, 255, 0).astype(np.uint8)

    rgba = Image.merge("RGBA", (*red_img.split(), Image.fromarray(opa_sharp, "L")))
    # Quantification douce 256 couleurs -> réduit le PNG 2K RGBA de ~4,5 Mo à ~350 Ko tout en gardant un filet net
    rgba_q = rgba.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert("RGBA")
    base_rgba_path = os.path.join(WORK_TEX_DIR, "TruckerCapRed_BaseColor_Alpha.png")
    rgba_q.save(base_rgba_path, optimize=True)

    # Rugosité légèrement rehaussée sur la plage plastique (min ~82 => ~0.32 roughness pour éviter aspect mouillé)
    rgh_adj = np.clip(rgh_raw * 0.92 + 30.0, 82.0, 238.0).astype(np.uint8)
    rgh_img = Image.fromarray(rgh_adj, "L").resize((1024, 1024), Image.Resampling.BILINEAR)
    orm = np.stack([
        np.full((1024, 1024), 255, dtype=np.uint8),
        np.asarray(rgh_img),
        np.zeros((1024, 1024), dtype=np.uint8),
    ], axis=-1)
    orm_path = os.path.join(WORK_TEX_DIR, "TruckerCapRed_ORM.jpg")
    Image.fromarray(orm, "RGB").save(orm_path, quality=88, optimize=True)

    nrm_resized = nrm_img.resize((TEX_SIZE, TEX_SIZE), Image.Resampling.LANCZOS)
    nrm_path = os.path.join(WORK_TEX_DIR, "TruckerCapRed_Normal.jpg")
    nrm_resized.save(nrm_path, quality=88, optimize=True)

    return base_rgba_path, orm_path, nrm_path


def build_material(tex_paths):
    base_rgba_path, orm_path, nrm_path = tex_paths

    mat = bpy.data.materials.new("TruckerCapRedMat")
    mat.use_nodes = True
    mat.blend_method = "CLIP"
    mat.alpha_threshold = 0.45
    mat.use_backface_culling = False

    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.16
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    t_col = nt.nodes.new("ShaderNodeTexImage")
    t_col.image = bpy.data.images.load(base_rgba_path)
    nt.links.new(t_col.outputs["Color"], bsdf.inputs["Base Color"])

    # Seuil GREATER_THAN pour forcer l'export glTF 2.0 en alphaMode="MASK" (cutout propre du filet)
    thresh = nt.nodes.new("ShaderNodeMath")
    thresh.operation = "GREATER_THAN"
    thresh.inputs[1].default_value = 0.45
    nt.links.new(t_col.outputs["Alpha"], thresh.inputs[0])
    nt.links.new(thresh.outputs["Value"], bsdf.inputs["Alpha"])

    t_orm = nt.nodes.new("ShaderNodeTexImage")
    t_orm.image = bpy.data.images.load(orm_path)
    t_orm.image.colorspace_settings.name = "Non-Color"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(t_orm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])

    gltf_grp = bpy.data.node_groups.new("glTF Settings", "ShaderNodeTree")
    gltf_grp.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    gltf_node = nt.nodes.new("ShaderNodeGroup")
    gltf_node.node_tree = gltf_grp
    nt.links.new(sep.outputs["Red"], gltf_node.inputs["Occlusion"])

    t_nrm = nt.nodes.new("ShaderNodeTexImage")
    t_nrm.image = bpy.data.images.load(nrm_path)
    t_nrm.image.colorspace_settings.name = "Non-Color"
    nrm_node = nt.nodes.new("ShaderNodeNormalMap")
    nrm_node.inputs["Strength"].default_value = 0.85
    nt.links.new(t_nrm.outputs["Color"], nrm_node.inputs["Color"])
    nt.links.new(nrm_node.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def parse_floats(el):
    return [float(x) for x in el.text.split()]


def import_dae_without_patch(mat):
    tree = ET.parse(DAE_PATH)
    root = tree.getroot()
    ns = {"c": root.tag.split("}")[0].strip("{")}
    geoms = {g.attrib["id"]: g for g in root.findall(".//c:geometry", ns)}

    objs = []
    for node in root.findall(".//c:visual_scene//c:node", ns):
        orig_name = node.attrib.get("name", node.attrib.get("id"))
        if orig_name == PATCH_SUBMESH_NAME:
            print(f"Écusson supprimé : {orig_name}")
            continue
        inst = node.find("c:instance_geometry", ns)
        if inst is None:
            continue

        geom = geoms[inst.attrib["url"].lstrip("#")]
        mesh_el = geom.find("c:mesh", ns)
        sources = {}
        for src in mesh_el.findall("c:source", ns):
            arr = parse_floats(src.find("c:float_array", ns))
            acc = src.find("c:technique_common/c:accessor", ns)
            stride = int(acc.attrib.get("stride", 3))
            sources[src.attrib["id"]] = [tuple(arr[i:i + stride]) for i in range(0, len(arr), stride)]

        vert_map = {
            inp.attrib["semantic"]: sources[inp.attrib["source"].lstrip("#")]
            for inp in mesh_el.find("c:vertices", ns).findall("c:input", ns)
        }
        positions = vert_map["POSITION"]
        uvs_arr = vert_map["TEXCOORD"]
        tris_el = mesh_el.find("c:triangles", ns)
        if tris_el is None:
            tris_el = mesh_el.find("c:polylist", ns)
        p_idx = [int(x) for x in tris_el.find("c:p", ns).text.split()]
        vc_el = tris_el.find("c:vcount", ns)
        vcounts = [int(x) for x in vc_el.text.split()] if vc_el is not None else [3] * int(tris_el.attrib["count"])

        bm = bmesh.new()
        uv_layer = bm.loops.layers.uv.new("UVMap")
        # DAE (X=-front, Y=up, Z=right) -> Blender Z-up avec visière vers -Y :
        # X_bl = Z_dae, Y_bl = X_dae, Z_bl = Y_dae
        v_objs = {vi: bm.verts.new((z, x, y)) for vi, (x, y, z) in enumerate(positions)}
        cursor = 0
        for vc in vcounts:
            vs = [v_objs[p_idx[cursor + k]] for k in range(vc)]
            uvs = [uvs_arr[p_idx[cursor + k]][:2] for k in range(vc)]
            cursor += vc
            try:
                f = bm.faces.new(vs)
                f.smooth = True
                for loop, uv in zip(f.loops, uvs):
                    loop[uv_layer].uv = uv
            except ValueError:
                pass

        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        clean_name = SUBMESH_RENAMES.get(orig_name, orig_name)
        m = bpy.data.meshes.new(clean_name)
        bm.to_mesh(m)
        bm.free()
        m.materials.append(mat)
        obj = bpy.data.objects.new(clean_name, m)
        bpy.context.collection.objects.link(obj)
        objs.append(obj)

    return objs


def normalize_transform(objs):
    """Met à l'échelle (largeur 20,0 cm), centre X/Y, et pose le bas à Z=0."""
    xs, ys, zs = [], [], []
    for obj in objs:
        for v in obj.data.vertices:
            xs.append(v.co.x)
            ys.append(v.co.y)
            zs.append(v.co.z)

    width_raw = max(xs) - min(xs)
    scale = TARGET_WIDTH_M / width_raw
    cx = 0.5 * (min(xs) + max(xs)) * scale
    cy = 0.5 * (min(ys) + max(ys)) * scale
    zmin = min(zs) * scale

    for obj in objs:
        for v in obj.data.vertices:
            v.co.x = v.co.x * scale - cx
            v.co.y = v.co.y * scale - cy
            v.co.z = v.co.z * scale - zmin
        obj.data.update()


def render_views(objs):
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 700
    scene.render.image_settings.file_format = "PNG"

    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.88, 0.88, 0.89, 1.0)
        bg.inputs[1].default_value = 0.85

    temp_objs = []
    for name, loc, energy, size in [
        ("KeyLight", (-0.65, -0.80, 0.90), 34.0, 0.9),
        ("FillLight", (0.75, -0.50, 0.65), 16.0, 1.2),
        ("RimLight", (0.15, 0.85, 0.70), 20.0, 0.8),
    ]:
        ldata = bpy.data.lights.new(name, type="AREA")
        ldata.energy = energy
        ldata.size = size
        lobj = bpy.data.objects.new(name, ldata)
        lobj.location = loc
        direction = Vector((0.0, 0.0, 0.06)) - Vector(loc)
        lobj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lobj)
        temp_objs.append(lobj)

    bpy.ops.mesh.primitive_plane_add(size=1.2, location=(0.0, 0.0, -0.0005))
    plane = bpy.context.active_object
    pmat = bpy.data.materials.new("GroundPlane")
    pmat.use_nodes = True
    pmat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.90, 0.90, 0.91, 1.0)
    pmat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
    plane.data.materials.append(pmat)
    temp_objs.append(plane)

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    temp_objs.append(cam_obj)

    # Calculer le centre vertical réel pour viser proprement
    zs = [v.co.z for o in objs for v in o.data.vertices]
    tz = 0.45 * max(zs)

    views = [
        ("cap_blend_front_3q.png", (-0.36, -0.32, 0.19), (0.0, -0.01, tz)),
        ("cap_blend_back_3q.png", (0.30, 0.32, 0.18), (0.0, 0.01, tz)),
        ("cap_blend_side.png", (-0.44, 0.0, 0.12), (0.0, 0.0, tz)),
        ("cap_blend_front.png", (0.0, -0.44, 0.15), (0.0, -0.01, tz)),
    ]
    for fname, loc, target in views:
        cam_obj.location = loc
        cam_obj.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, fname)
        bpy.ops.render.render(write_still=True)

    for to in temp_objs:
        bpy.data.objects.remove(to, do_unlink=True)
    bpy.data.worlds.remove(world, do_unlink=True)


def save_blend(objs):
    os.makedirs(OUT_DIR, exist_ok=True)
    parent_empty = bpy.data.objects.new("TruckerCapRed", None)
    bpy.context.collection.objects.link(parent_empty)
    for o in objs:
        o.parent = parent_empty

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)
    return parent_empty


def export_merged_glb(objs):
    """Joint une copie temporaire en un seul objet (1 Draw Call) et exporte le GLB."""
    bpy.ops.object.select_all(action="DESELECT")
    copies = []
    for o in objs:
        c = o.copy()
        c.data = o.data.copy()
        c.parent = None
        bpy.context.collection.objects.link(c)
        copies.append(c)
        c.select_set(True)

    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    merged = bpy.context.active_object
    merged.name = "TruckerCapRed"

    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )

    m_data = merged.data
    bpy.data.objects.remove(merged, do_unlink=True)
    bpy.data.meshes.remove(m_data, do_unlink=True)


def inspect_outputs():
    blend_bytes = os.path.getsize(OUT_BLEND)
    glb_bytes = os.path.getsize(OUT_GLB)
    with open(OUT_GLB, "rb") as f:
        magic, version, length = struct.unpack("<III", f.read(12))
        chunk_len, chunk_type = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(chunk_len).decode("utf-8"))

    prims = sum(len(m.get("primitives", [])) for m in gltf.get("meshes", []))
    mats = [(m.get("name"), m.get("alphaMode", "OPAQUE"), m.get("doubleSided", False)) for m in gltf.get("materials", [])]

    xs, ys, zs = [], [], []
    tris = 0
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
            tris += len(obj.data.loop_triangles)
            for v in obj.data.vertices:
                xs.append(v.co.x)
                ys.append(v.co.y)
                zs.append(v.co.z)

    print(f"OUT_BLEND={OUT_BLEND} ({blend_bytes / 1024:.1f} Ko)")
    print(f"OUT_GLB={OUT_GLB} ({glb_bytes / 1024:.1f} Ko)")
    print(f"TRIS={tris} PRIMITIVES={prims}")
    print(f"DIMS_CM=({(max(xs)-min(xs))*100:.2f}, {(max(ys)-min(ys))*100:.2f}, {(max(zs)-min(zs))*100:.2f}) [w, d, h]")
    print(f"MATERIALS={mats}")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args(argv)

    ensure_source_extracted()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    tex_paths = prepare_red_textures()
    mat = build_material(tex_paths)
    objs = import_dae_without_patch(mat)
    normalize_transform(objs)

    if args.render:
        render_views(objs)

    save_blend(objs)
    export_merged_glb(objs)
    inspect_outputs()


if __name__ == "__main__":
    main()
