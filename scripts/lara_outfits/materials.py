"""Procedural textures and PBR materials for Lara's outfits."""

import math
import bpy
import numpy as np


def _make_image(name: str, rgba: np.ndarray, colorspace: str = "sRGB") -> bpy.types.Image:
    h, w, _ = rgba.shape
    img = bpy.data.images.new(name, width=w, height=h, alpha=False)
    img.colorspace_settings.name = colorspace
    img.pixels.foreach_set(rgba.ravel().astype(np.float32))
    img.pack()
    return img


def _height_to_normal_rgba(height: np.ndarray, strength: float = 1.0) -> np.ndarray:
    dx = np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)
    dy = np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)
    nx = -dx * strength
    ny = -dy * strength
    nz = np.ones_like(height)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz + 1e-8)
    nx *= inv_len
    ny *= inv_len
    nz *= inv_len
    h, w = height.shape
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., 0] = np.clip(nx * 0.5 + 0.5, 0.0, 1.0)
    rgba[..., 1] = np.clip(ny * 0.5 + 0.5, 0.0, 1.0)
    rgba[..., 2] = np.clip(nz * 0.5 + 0.5, 0.0, 1.0)
    return rgba


# Native Lara bikini red (Bikini_Red in lara_perfect.blend)
NATIVE_BIKINI_RED_LINEAR = (0.72, 0.0003, 0.001)
NATIVE_BIKINI_RED_SRGB = np.array([0.865008, 0.003876, 0.012920], dtype=np.float32)


def _generate_textures() -> dict[str, bpy.types.Image]:
    rng = np.random.default_rng(42)
    size = 512
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)

    u = xx / size * 128.0 * 2.0 * math.pi
    v = yy / size * 160.0 * 2.0 * math.pi
    knit_v = np.sin(v + 0.65 * np.abs(np.sin(u * 0.5))) * 0.5 + np.cos(u) * 0.35

    low_noise = rng.normal(0.0, 1.0, (size // 4, size // 4)).astype(np.float32)
    low_noise = np.repeat(np.repeat(low_noise, 4, axis=0), 4, axis=1)
    fine_noise = rng.normal(0.0, 0.35, (size, size)).astype(np.float32)
    fleece_h = knit_v * 0.38 + low_noise * 0.25 + fine_noise * 0.22

    rib_u = xx / size * 96.0 * 2.0 * math.pi
    rib_v = yy / size * 160.0 * 2.0 * math.pi
    rib_h = np.cos(rib_u) * 0.85 + np.sin(rib_v) * 0.18 + fine_noise * 0.14

    fine_rib_u = xx / size * 176.0 * 2.0 * math.pi
    fine_rib_h = np.cos(fine_rib_u) * 0.90 + np.sin(rib_v) * 0.15 + fine_noise * 0.10

    # 1. Cotton Fleece / Rib / Lining (Native Bikini Red)
    base_red_fleece = NATIVE_BIKINI_RED_SRGB
    melange = np.clip(1.0 + low_noise * 0.055 + fine_noise * 0.045 + knit_v * 0.015, 0.80, 1.18)
    fleece_rgb = np.clip(base_red_fleece[None, None, :] * melange[..., None], 0.0, 1.0)
    fleece_rgba = np.ones((size, size, 4), dtype=np.float32)
    fleece_rgba[..., :3] = fleece_rgb
    img_red_fleece_col = _make_image("tex_cotton_red_fleece_col", fleece_rgba, "sRGB")

    base_red_rib = NATIVE_BIKINI_RED_SRGB * 0.85
    rib_rgb = np.clip(base_red_rib[None, None, :] * melange[..., None], 0.0, 1.0)
    rib_rgba = np.ones((size, size, 4), dtype=np.float32)
    rib_rgba[..., :3] = rib_rgb
    img_red_rib_col = _make_image("tex_cotton_red_rib_col", rib_rgba, "sRGB")

    base_red_lining = NATIVE_BIKINI_RED_SRGB * 0.70
    lining_rgb = np.clip(base_red_lining[None, None, :] * melange[..., None], 0.0, 1.0)
    lining_rgba = np.ones((size, size, 4), dtype=np.float32)
    lining_rgba[..., :3] = lining_rgb
    img_red_lining_col = _make_image("tex_cotton_red_lining_col", lining_rgba, "sRGB")

    img_fleece_nrm = _make_image("tex_cotton_fleece_nrm", _height_to_normal_rgba(fleece_h, 0.85), "Non-Color")
    img_rib_nrm = _make_image("tex_cotton_rib_nrm", _height_to_normal_rgba(rib_h, 1.15), "Non-Color")
    img_fine_rib_nrm = _make_image("tex_cotton_fine_rib_nrm", _height_to_normal_rgba(fine_rib_h, 1.25), "Non-Color")

    # 2. Cotton-Elastane Jersey (Legging / T-Shirt / Fine Rib Tank)
    base_red_legging = NATIVE_BIKINI_RED_SRGB
    leg_melange = np.clip(1.0 + low_noise * 0.045 + fine_noise * 0.035 + knit_v * 0.020, 0.82, 1.18)
    leg_rgb = np.clip(base_red_legging[None, None, :] * leg_melange[..., None], 0.0, 1.0)
    leg_rgba = np.ones((size, size, 4), dtype=np.float32)
    leg_rgba[..., :3] = leg_rgb
    img_red_legging_col = _make_image("tex_legging_red_col", leg_rgba, "sRGB")
    img_jersey_nrm = _make_image("tex_legging_jersey_nrm", _height_to_normal_rgba(knit_v * 0.6 + fine_noise * 0.15, 0.55), "Non-Color")

    # 3. Swimwear / Lycra Elastane (Native Bikini Red)
    base_red_lycra = NATIVE_BIKINI_RED_SRGB
    lycra_weave = (np.sin(u * 1.4) * np.sin(v * 1.4)) * 0.25 + fine_noise * 0.08
    lycra_rgb = np.clip(base_red_lycra[None, None, :] * (1.0 + lycra_weave[..., None] * 0.03), 0.0, 1.0)
    lycra_rgba = np.ones((size, size, 4), dtype=np.float32)
    lycra_rgba[..., :3] = lycra_rgb
    img_lycra_col = _make_image("tex_lycra_red_col", lycra_rgba, "sRGB")
    img_lycra_nrm = _make_image("tex_lycra_nrm", _height_to_normal_rgba(lycra_weave, 0.28), "Non-Color")

    # 4. Braided Red Cotton Drawstring Cord
    cord_u = xx / size * 24.0 * 2.0 * math.pi
    cord_v = yy / size * 48.0 * 2.0 * math.pi
    cord_h = np.sin(cord_u + cord_v) * 0.6 + np.sin(cord_u - cord_v) * 0.4
    cord_col = np.ones((size, size, 4), dtype=np.float32)
    cord_col[..., 0] = np.clip(NATIVE_BIKINI_RED_SRGB[0] + cord_h * 0.04, 0.0, 1.0)
    cord_col[..., 1] = np.clip(NATIVE_BIKINI_RED_SRGB[1] + cord_h * 0.002, 0.0, 1.0)
    cord_col[..., 2] = np.clip(NATIVE_BIKINI_RED_SRGB[2] + cord_h * 0.004, 0.0, 1.0)
    img_cord_col = _make_image("tex_cord_col", cord_col, "sRGB")
    img_cord_nrm = _make_image("tex_cord_nrm", _height_to_normal_rgba(cord_h, 1.2), "Non-Color")

    # 5. Bandana Paisley-inspired Red Woven Cotton
    bu = xx / size * 10.0 * 2.0 * math.pi
    bv = yy / size * 10.0 * 2.0 * math.pi
    paisley = (
        np.exp(-((np.sin(bu) ** 2 + np.cos(bv) ** 2) * 3.5))
        + 0.45 * (np.cos(bu * 3.0) * np.cos(bv * 3.0) > 0.72).astype(np.float32)
    )
    bandana_base = NATIVE_BIKINI_RED_SRGB
    bandana_cream = np.array([0.92, 0.88, 0.84], dtype=np.float32)
    mask = np.clip((paisley - 0.55) * 2.5, 0.0, 1.0)[..., None]
    bandana_rgb = bandana_base[None, None, :] * (1.0 - 0.55 * mask) + bandana_cream[None, None, :] * (0.55 * mask)
    weave_plain = (np.sin(xx / size * 180.0 * math.pi) + np.sin(yy / size * 180.0 * math.pi)) * 0.25
    bandana_rgb = np.clip(bandana_rgb * (1.0 + weave_plain[..., None] * 0.03 + fine_noise[..., None] * 0.03), 0.0, 1.0)
    bandana_rgba = np.ones((size, size, 4), dtype=np.float32)
    bandana_rgba[..., :3] = bandana_rgb
    img_bandana_col = _make_image("tex_bandana_red_col", bandana_rgba, "sRGB")
    img_bandana_nrm = _make_image("tex_bandana_nrm", _height_to_normal_rgba(weave_plain + fine_noise * 0.12, 0.42), "Non-Color")

    # 6. Canvas / Sneaker Upper (Red)
    canvas_h = (np.sin(xx / size * 140.0 * math.pi) * 0.5 + np.sin(yy / size * 140.0 * math.pi) * 0.5) + fine_noise * 0.20
    canvas_base = NATIVE_BIKINI_RED_SRGB
    canvas_rgb = np.clip(canvas_base[None, None, :] * (1.0 + canvas_h[..., None] * 0.04), 0.0, 1.0)
    canvas_rgba = np.ones((size, size, 4), dtype=np.float32)
    canvas_rgba[..., :3] = canvas_rgb
    img_canvas_col = _make_image("tex_sneaker_canvas_red_col", canvas_rgba, "sRGB")
    img_canvas_nrm = _make_image("tex_sneaker_canvas_nrm", _height_to_normal_rgba(canvas_h, 0.60), "Non-Color")

    # 7. Red Denim Twill (3x1 diagonal twill weave + subtle stonewash slub)
    twill_phase = (xx * (128.0 / size) + yy * (128.0 / size)) * 2.0 * math.pi
    warp = np.sin(xx / size * 128.0 * 2.0 * math.pi) * 0.30
    weft = np.sin(yy / size * 128.0 * 2.0 * math.pi) * 0.25
    twill = np.sin(twill_phase) * 0.60 + warp + weft
    slub = low_noise * 0.14 + fine_noise * 0.18
    denim_h = twill * 0.55 + slub
    denim_base = NATIVE_BIKINI_RED_SRGB
    denim_wash = np.clip(1.0 + low_noise * 0.045 + fine_noise * 0.030 + twill * 0.032, 0.84, 1.16)
    denim_rgb = np.clip(denim_base[None, None, :] * denim_wash[..., None], 0.0, 1.0)
    denim_rgba = np.ones((size, size, 4), dtype=np.float32)
    denim_rgba[..., :3] = denim_rgb
    img_denim_col = _make_image("tex_denim_red_col", denim_rgba, "sRGB")

    denim_seam_base = NATIVE_BIKINI_RED_SRGB * 0.75
    denim_seam_rgb = np.clip(denim_seam_base[None, None, :] * denim_wash[..., None], 0.0, 1.0)
    denim_seam_rgba = np.ones((size, size, 4), dtype=np.float32)
    denim_seam_rgba[..., :3] = denim_seam_rgb
    img_denim_seam_col = _make_image("tex_denim_red_seam_col", denim_seam_rgba, "sRGB")
    img_denim_nrm = _make_image("tex_denim_twill_nrm", _height_to_normal_rgba(denim_h, 0.75), "Non-Color")

    return {
        "red_fleece_col": img_red_fleece_col,
        "red_rib_col": img_red_rib_col,
        "red_lining_col": img_red_lining_col,
        "fleece_nrm": img_fleece_nrm,
        "rib_nrm": img_rib_nrm,
        "fine_rib_nrm": img_fine_rib_nrm,
        "red_legging_col": img_red_legging_col,
        "jersey_nrm": img_jersey_nrm,
        "lycra_col": img_lycra_col,
        "lycra_nrm": img_lycra_nrm,
        "cord_col": img_cord_col,
        "cord_nrm": img_cord_nrm,
        "bandana_col": img_bandana_col,
        "bandana_nrm": img_bandana_nrm,
        "canvas_col": img_canvas_col,
        "canvas_nrm": img_canvas_nrm,
        "denim_col": img_denim_col,
        "denim_seam_col": img_denim_seam_col,
        "denim_nrm": img_denim_nrm,
    }


def make_pbr_material(
    name: str,
    base_color=(0.5, 0.5, 0.5, 1.0),
    roughness: float = 0.88,
    metallic: float = 0.0,
    color_img=None,
    normal_img=None,
    normal_strength: float = 0.45,
    uv_scale: float = 1.0,
    specular: float | None = None,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in bsdf.inputs:
        if specular is not None:
            bsdf.inputs["Specular IOR Level"].default_value = specular
        else:
            bsdf.inputs["Specular IOR Level"].default_value = 0.25 if metallic == 0.0 else 0.5
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    if color_img is not None or normal_img is not None:
        uv = nodes.new("ShaderNodeTexCoord")
        uv.location = (-750, 0)
        mapping = nodes.new("ShaderNodeMapping")
        mapping.location = (-550, 0)
        mapping.inputs["Scale"].default_value = (uv_scale, uv_scale, 1.0)
        links.new(uv.outputs["UV"], mapping.inputs["Vector"])

        if color_img is not None:
            tex_c = nodes.new("ShaderNodeTexImage")
            tex_c.location = (-280, 160)
            tex_c.image = color_img
            links.new(mapping.outputs["Vector"], tex_c.inputs["Vector"])
            links.new(tex_c.outputs["Color"], bsdf.inputs["Base Color"])

        if normal_img is not None:
            tex_n = nodes.new("ShaderNodeTexImage")
            tex_n.location = (-280, -160)
            tex_n.image = normal_img
            links.new(mapping.outputs["Vector"], tex_n.inputs["Vector"])
            nrm = nodes.new("ShaderNodeNormalMap")
            nrm.location = (-40, -160)
            nrm.inputs["Strength"].default_value = normal_strength
            links.new(tex_n.outputs["Color"], nrm.inputs["Color"])
            links.new(nrm.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def create_material_library() -> dict[str, bpy.types.Material]:
    textures = _generate_textures()
    lin_main = (*NATIVE_BIKINI_RED_LINEAR, 1.0)
    lin_mid = (0.52, 0.0002, 0.0007, 1.0)
    lin_dark = (0.36, 0.00015, 0.0005, 1.0)
    return {
        "legging": make_pbr_material(
            "Legging_Cotton_Red",
            base_color=lin_main,
            roughness=0.86,
            metallic=0.0,
            color_img=textures["red_legging_col"],
            normal_img=textures["jersey_nrm"],
            normal_strength=0.40,
            uv_scale=2.2,
        ),
        "fleece": make_pbr_material(
            "Cotton_Fleece_Red",
            base_color=lin_main,
            roughness=0.90,
            metallic=0.0,
            color_img=textures["red_fleece_col"],
            normal_img=textures["fleece_nrm"],
            normal_strength=0.50,
            uv_scale=2.0,
        ),
        "rib": make_pbr_material(
            "Cotton_Rib_Red",
            base_color=lin_mid,
            roughness=0.90,
            metallic=0.0,
            color_img=textures["red_rib_col"],
            normal_img=textures["rib_nrm"],
            normal_strength=0.65,
            uv_scale=2.5,
        ),
        "fine_rib": make_pbr_material(
            "Cotton_Fine_Rib_Red",
            base_color=lin_main,
            roughness=0.86,
            metallic=0.0,
            color_img=textures["red_legging_col"],
            normal_img=textures["fine_rib_nrm"],
            normal_strength=0.65,
            uv_scale=2.6,
        ),
        "jersey": make_pbr_material(
            "Cotton_Jersey_Red",
            base_color=lin_main,
            roughness=0.88,
            metallic=0.0,
            color_img=textures["red_fleece_col"],
            normal_img=textures["jersey_nrm"],
            normal_strength=0.42,
            uv_scale=2.4,
        ),
        "lining": make_pbr_material(
            "Cotton_Hood_Lining_Red",
            base_color=lin_dark,
            roughness=0.95,
            metallic=0.0,
            color_img=textures["red_lining_col"],
            normal_img=textures["jersey_nrm"],
            normal_strength=0.35,
            uv_scale=2.2,
        ),
        "zip_tape": make_pbr_material(
            "Zipper_Tape_Red",
            base_color=lin_dark,
            roughness=0.88,
            metallic=0.0,
        ),
        "zip_plastic_red": make_pbr_material(
            "Zipper_Rail_Plastic_Red",
            base_color=lin_main,
            roughness=0.34,
            metallic=0.0,
            specular=0.58,
        ),
        "zip_metal_red": make_pbr_material(
            "Zipper_Metal_Red",
            base_color=lin_main,
            roughness=0.24,
            metallic=0.88,
        ),
        "cord": make_pbr_material(
            "Cotton_Drawstring_Red",
            base_color=lin_main,
            roughness=0.92,
            metallic=0.0,
            color_img=textures["cord_col"],
            normal_img=textures["cord_nrm"],
            normal_strength=0.55,
            uv_scale=1.0,
        ),
        "swimwear": make_pbr_material(
            "Swimwear_Lycra_Red",
            base_color=lin_main,
            roughness=0.42,
            metallic=0.0,
            color_img=textures["lycra_col"],
            normal_img=textures["lycra_nrm"],
            normal_strength=0.30,
            uv_scale=2.4,
            specular=0.45,
        ),
        "wetsuit": make_pbr_material(
            "Wetsuit_Neoprene_Red",
            base_color=lin_main,
            roughness=0.58,
            metallic=0.0,
            color_img=textures["lycra_col"],
            normal_img=textures["lycra_nrm"],
            normal_strength=0.35,
            uv_scale=2.0,
            specular=0.35,
        ),
        "bandana": make_pbr_material(
            "Bandana_Cotton_Red",
            base_color=lin_main,
            roughness=0.84,
            metallic=0.0,
            color_img=textures["bandana_col"],
            normal_img=textures["bandana_nrm"],
            normal_strength=0.45,
            uv_scale=2.2,
        ),
        "sneaker_canvas": make_pbr_material(
            "Sneaker_Canvas_Red",
            base_color=lin_main,
            roughness=0.76,
            metallic=0.0,
            color_img=textures["canvas_col"],
            normal_img=textures["canvas_nrm"],
            normal_strength=0.48,
            uv_scale=2.8,
        ),
        "sneaker_rubber": make_pbr_material(
            "Sneaker_Rubber_Red",
            base_color=lin_mid,
            roughness=0.62,
            metallic=0.0,
            specular=0.40,
        ),
        "socks": make_pbr_material(
            "Socks_Knit_Red",
            base_color=lin_main,
            roughness=0.90,
            metallic=0.0,
            color_img=textures["red_rib_col"],
            normal_img=textures["fine_rib_nrm"],
            normal_strength=0.55,
            uv_scale=2.6,
        ),
        "denim": make_pbr_material(
            "Denim_Twill_Red",
            base_color=lin_main,
            roughness=0.82,
            metallic=0.0,
            color_img=textures["denim_col"],
            normal_img=textures["denim_nrm"],
            normal_strength=0.55,
            uv_scale=3.2,
            specular=0.22,
        ),
        "denim_seam": make_pbr_material(
            "Denim_Seam_Red",
            base_color=lin_mid,
            roughness=0.86,
            metallic=0.0,
            color_img=textures["denim_seam_col"],
            normal_img=textures["denim_nrm"],
            normal_strength=0.50,
            uv_scale=3.2,
            specular=0.18,
        ),
        "denim_hardware": make_pbr_material(
            "Denim_Brass_Button",
            base_color=(0.76, 0.54, 0.24, 1.0),
            roughness=0.28,
            metallic=0.88,
            specular=0.60,
        ),
    }
