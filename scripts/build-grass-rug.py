"""Build the synthetic grass bathroom rug GLB (200 x 100 x 1.2 cm) in Blender."""

import math
import os
import random
import bpy
import bmesh

OUT_GLB = os.path.abspath("public/items/grass-rug/grass-rug.glb")
PREVIEW_PNG = "/tmp/grass_rug_preview.png"

RUG_W = 2.00   # 200 cm (X)
RUG_D = 1.00   # 100 cm (Y in Blender -> Z in Three.js)
RUG_H = 0.012  # 1.2 cm (Z in Blender -> Y in Three.js)
TEX_SIZE = 512


def make_seamless_turf_images(size: int = TEX_SIZE):
    """Generate mathematically seamless 512x512 diffuse & normal maps for synthetic turf."""
    rng = random.Random(42)
    height = [0.0] * (size * size)
    r_buf = [28.0] * (size * size)
    g_buf = [74.0] * (size * size)
    b_buf = [30.0] * (size * size)

    # Subtle base noise (toroidal)
    for y in range(size):
        for x in range(size):
            idx = y * size + x
            n = (rng() if callable(rng) else rng.random())
            v = (n - 0.5) * 10.0
            r_buf[idx] += v * 0.4
            g_buf[idx] += v
            b_buf[idx] += v * 0.4
            height[idx] = 0.15 + n * 0.15

    def paint_pixel(px: int, py: int, r: float, g: float, b: float, h: float, alpha: float):
        x = px % size
        y = py % size
        idx = y * size + x
        inv = 1.0 - alpha
        r_buf[idx] = r_buf[idx] * inv + r * alpha
        g_buf[idx] = g_buf[idx] * inv + g * alpha
        b_buf[idx] = b_buf[idx] * inv + b * alpha
        if h > height[idx]:
            height[idx] = height[idx] * inv + h * alpha

    # Draw 18,000 short synthetic turf blades wrapping toroidally across all edges
    for _ in range(18000):
        x0 = rng.uniform(0.0, size)
        y0 = rng.uniform(0.0, size)
        angle = rng.uniform(0.0, math.tau)
        length = rng.uniform(4.0, 10.0)
        dx = math.cos(angle)
        dy = math.sin(angle)

        shade = rng.random()
        # Realistic synthetic turf palette (deep green, medium olive, fresh lime tip)
        base_r = 26.0 + shade * 36.0
        base_g = 78.0 + shade * 78.0
        base_b = 24.0 + shade * 24.0

        steps = int(math.ceil(length))
        for s in range(steps + 1):
            t = s / max(1, steps)
            px = x0 + dx * (t * length)
            py = y0 + dy * (t * length)
            # Slightly brighter and higher toward blade tip
            tip = 0.75 + 0.35 * t
            h = 0.35 + 0.65 * t
            ix = int(round(px))
            iy = int(round(py))
            paint_pixel(ix, iy, base_r * tip, base_g * tip, base_b * tip, h, 0.85)
            # 1px soft width
            paint_pixel(ix + 1, iy, base_r * tip * 0.9, base_g * tip * 0.9, base_b * tip * 0.9, h * 0.9, 0.35)

    diff_img = bpy.data.images.new("TurfDiffuse", width=size, height=size, alpha=False)
    diff_pixels = [0.0] * (size * size * 4)
    for i in range(size * size):
        j = i * 4
        diff_pixels[j] = min(1.0, max(0.0, r_buf[i] / 255.0))
        diff_pixels[j + 1] = min(1.0, max(0.0, g_buf[i] / 255.0))
        diff_pixels[j + 2] = min(1.0, max(0.0, b_buf[i] / 255.0))
        diff_pixels[j + 3] = 1.0
    diff_img.pixels.foreach_set(diff_pixels)
    diff_img.filepath_raw = "/tmp/turf_diff.png"
    diff_img.file_format = "PNG"
    diff_img.save()
    bpy.data.images.remove(diff_img)
    diff_img = bpy.data.images.load("/tmp/turf_diff.png")
    diff_img.colorspace_settings.name = "sRGB"
    diff_img.pack()

    norm_img = bpy.data.images.new("TurfNormal", width=size, height=size, alpha=False)
    norm_pixels = [0.0] * (size * size * 4)
    strength = 2.2
    for y in range(size):
        ym = (y - 1) % size
        yp = (y + 1) % size
        for x in range(size):
            xm = (x - 1) % size
            xp = (x + 1) % size
            dhdx = (height[y * size + xp] - height[y * size + xm]) * strength
            dhdy = (height[yp * size + x] - height[ym * size + x]) * strength
            nx, ny, nz = -dhdx, -dhdy, 1.0
            inv_len = 1.0 / math.sqrt(nx * nx + ny * ny + nz * nz)
            j = (y * size + x) * 4
            norm_pixels[j] = (nx * inv_len) * 0.5 + 0.5
            norm_pixels[j + 1] = (ny * inv_len) * 0.5 + 0.5
            norm_pixels[j + 2] = (nz * inv_len) * 0.5 + 0.5
            norm_pixels[j + 3] = 1.0
    norm_img.pixels.foreach_set(norm_pixels)
    norm_img.filepath_raw = "/tmp/turf_norm.png"
    norm_img.file_format = "PNG"
    norm_img.save()
    bpy.data.images.remove(norm_img)
    norm_img = bpy.data.images.load("/tmp/turf_norm.png")
    norm_img.colorspace_settings.name = "Non-Color"
    norm_img.pack()

    return diff_img, norm_img


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(col):
            col.remove(item)


def build():
    clear_scene()
    diff_img, norm_img = make_seamless_turf_images(TEX_SIZE)

    # Top turf material
    mat_turf = bpy.data.materials.new("GrassTurfTop")
    mat_turf.use_nodes = True
    nt = mat_turf.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.88
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25

    tex_diff = nt.nodes.new("ShaderNodeTexImage")
    tex_diff.image = diff_img
    tex_diff.extension = "REPEAT"

    tex_norm = nt.nodes.new("ShaderNodeTexImage")
    tex_norm.image = norm_img
    tex_norm.extension = "REPEAT"

    norm_map = nt.nodes.new("ShaderNodeNormalMap")
    norm_map.inputs["Strength"].default_value = 0.65

    nt.links.new(tex_diff.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex_norm.outputs["Color"], norm_map.inputs["Color"])
    nt.links.new(norm_map.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # Backing / side rim material
    mat_back = bpy.data.materials.new("GrassTurfBacking")
    mat_back.use_nodes = True
    b_bsdf = mat_back.node_tree.nodes.get("Principled BSDF")
    b_bsdf.inputs["Base Color"].default_value = (0.04, 0.08, 0.04, 1.0)
    b_bsdf.inputs["Roughness"].default_value = 0.92

    # Mesh: beveled rectangular mat, bottom at Z=0, centered X/Y
    mesh = bpy.data.meshes.new("GrassRugMesh")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= RUG_W
        v.co.y *= RUG_D
        v.co.z = (v.co.z + 0.5) * RUG_H

    # Bevel top & vertical edges for a clean bath-mat silhouette
    bevel_edges = [e for e in bm.edges if any(v.co.z > RUG_H * 0.5 for v in e.verts)]
    bmesh.ops.bevel(
        bm,
        geom=bevel_edges,
        offset=0.004,
        segments=2,
        profile=0.5,
        affect="EDGES",
    )

    uv_layer = bm.loops.layers.uv.new("UVMap")
    tile_m = 0.25  # 25 cm seamless tile repeat (8 x 4 repeats)
    bm.normal_update()
    bm.faces.ensure_lookup_table()
    for face in bm.faces:
        if face.normal.z > 0.7:
            face.material_index = 0
        else:
            face.material_index = 1
        for loop in face.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (co.x / tile_m, co.y / tile_m)

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("GrassRug", mesh)
    obj.data.materials.append(mat_turf)
    obj.data.materials.append(mat_back)
    bpy.context.collection.objects.link(obj)
    for p in obj.data.polygons:
        p.use_smooth = True

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_jpeg_quality=88,
    )
    print(f"Exported {OUT_GLB} ({os.path.getsize(OUT_GLB)} bytes, {len(obj.data.polygons)} polys)")

    # Quick offline preview render
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 16
    scene.render.resolution_x = 640
    scene.render.resolution_y = 400
    scene.render.filepath = PREVIEW_PNG

    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.7, 0.7, 0.7, 1.0)
    bg.inputs["Strength"].default_value = 1.2

    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (1.4, -1.8, 1.3)
    direction = (-cam.location[0], -cam.location[1], -cam.location[2])
    cam.rotation_euler = (math.atan2(math.hypot(direction[0], direction[1]), -direction[2]), 0, math.atan2(direction[1], direction[0]) + math.pi / 2)
    # Use Track To for exact aim
    tt = cam.constraints.new("TRACK_TO")
    tt.target = obj
    tt.track_axis = "TRACK_NEGATIVE_Z"
    tt.up_axis = "UP_Y"
    scene.camera = cam

    bpy.ops.render.render(write_still=True)
    print(f"Rendered preview {PREVIEW_PNG}")


if __name__ == "__main__":
    build()
