import math
import os
import bpy
import bmesh
from mathutils import Euler, Matrix, Vector

# Output path relative to project root
OUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "ring-drone-cam.glb"))

# Dimensions en mètres (dock style Mac Mini rouge évidé + Ring Drone Cam)
DOCK_W, DOCK_D, DOCK_H = 0.215, 0.215, 0.044
DOCK_CAVITY_Z = 0.012
DRONE_W, DRONE_D, DRONE_H = 0.1718, 0.1369, 0.03315

# Palette linéaire (studio red #cc1a1a ≈ sRGB 0.80, 0.10, 0.10 -> linéaire 0.60, 0.010, 0.010)
COL_RED = (0.62, 0.014, 0.014, 1.0)
COL_RED_DARK = (0.52, 0.011, 0.011, 1.0)
COL_DARK = (0.015, 0.016, 0.020, 1.0)
COL_LENS = (0.004, 0.008, 0.018, 1.0)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_mat(name, base_color, roughness=0.42, metallic=0.05, emission=None, emission_strength=0.0, use_vertex_color=False):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if use_vertex_color:
        vcol = nt.nodes.new(type="ShaderNodeVertexColor")
        vcol.layer_name = "Color"
        nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def rounded_rect_points(w, d, r, segs=4):
    """Retourne les points 2D (CCW) d'un rectangle aux coins arrondis."""
    hx = w * 0.5 - r
    hy = d * 0.5 - r
    centers = ((hx, hy, 0.0), (-hx, hy, math.pi * 0.5), (-hx, -hy, math.pi), (hx, -hy, math.pi * 1.5))
    pts = []
    for cx, cy, start_a in centers:
        for i in range(segs + 1):
            a = start_a + (math.pi * 0.5) * (i / segs)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def append_bmesh(target_bm, src_bm, color=None, location=(0, 0, 0), rotation=(0, 0, 0)):
    """Copie src_bm transformé dans target_bm en appliquant éventuellement une couleur de sommet."""
    xf = Matrix.Translation(Vector(location)) @ Euler(rotation, 'XYZ').to_matrix().to_4x4()
    bmesh.ops.transform(src_bm, matrix=xf, verts=src_bm.verts)
    vert_map = {}
    for v in src_bm.verts:
        vert_map[v] = target_bm.verts.new(v.co)
    color_layer = target_bm.loops.layers.color.get("Color") if color is not None else None
    for f in src_bm.faces:
        nf = target_bm.faces.new([vert_map[v] for v in f.verts])
        nf.smooth = f.smooth
        if color_layer is not None:
            for loop in nf.loops:
                loop[color_layer] = color
    src_bm.free()


def make_box_bm(size, radius=0.0, segments=2):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if radius > 0.0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=radius, segments=segments, affect='EDGES', clamp_overlap=True)
    for f in bm.faces:
        f.smooth = radius > 0.0
    return bm


def make_cylinder_bm(radius, depth, vertices=16):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=vertices, radius1=radius, radius2=radius, depth=depth)
    for f in bm.faces:
        f.smooth = abs(f.normal.z) < 0.9
    return bm


def make_duct_bm(outer_r, inner_r, height, segments=24):
    bm = bmesh.new()
    hz = height * 0.5
    top_out, top_in, bot_out, bot_in = [], [], [], []
    for i in range(segments):
        a = 2.0 * math.pi * i / segments
        ca, sa = math.cos(a), math.sin(a)
        top_out.append(bm.verts.new((outer_r * ca, outer_r * sa, hz)))
        top_in.append(bm.verts.new((inner_r * ca, inner_r * sa, hz)))
        bot_out.append(bm.verts.new((outer_r * ca, outer_r * sa, -hz)))
        bot_in.append(bm.verts.new((inner_r * ca, inner_r * sa, -hz)))
    for i in range(segments):
        j = (i + 1) % segments
        bm.faces.new((top_out[i], top_out[j], top_in[j], top_in[i])).smooth = False
        bm.faces.new((bot_in[i], bot_in[j], bot_out[j], bot_out[i])).smooth = False
        bm.faces.new((bot_out[i], bot_out[j], top_out[j], top_out[i])).smooth = True
        bm.faces.new((top_in[i], top_in[j], bot_in[j], bot_in[i])).smooth = True
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def build_dock(mat):
    """Simple socle style Mac Mini rouge : pavé aplati aux coins arrondis, creusé au centre (1 seul mesh, 1 DC)."""
    mesh = bpy.data.meshes.new("RingDock")
    obj = bpy.data.objects.new("RingDock", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)

    bm = bmesh.new()
    outer_r = 0.032
    chamfer = 0.0025
    cav_w, cav_d, cav_r = 0.184, 0.150, 0.024

    # Anneaux du profil continu (extérieur bas -> chanfrein -> rebord -> cavité -> fond)
    r_bot = rounded_rect_points(DOCK_W - chamfer * 2, DOCK_D - chamfer * 2, outer_r - chamfer, segs=4)
    r_low = rounded_rect_points(DOCK_W, DOCK_D, outer_r, segs=4)
    r_high = rounded_rect_points(DOCK_W, DOCK_D, outer_r, segs=4)
    r_top_out = rounded_rect_points(DOCK_W - chamfer * 2, DOCK_D - chamfer * 2, outer_r - chamfer, segs=4)
    r_top_in = rounded_rect_points(cav_w + chamfer * 2, cav_d + chamfer * 2, cav_r + chamfer, segs=4)
    r_cav_wall = rounded_rect_points(cav_w, cav_d, cav_r, segs=4)
    r_cav_floor = rounded_rect_points(cav_w - chamfer, cav_d - chamfer, cav_r - chamfer * 0.5, segs=4)

    rings_spec = [
        (r_bot, 0.0, False),
        (r_low, chamfer, True),
        (r_high, DOCK_H - chamfer, True),
        (r_top_out, DOCK_H, True),
        (r_top_in, DOCK_H, False),
        (r_cav_wall, DOCK_H - chamfer, True),
        (r_cav_floor, DOCK_CAVITY_Z, True),
    ]
    rings = [[bm.verts.new((x, y, z)) for (x, y) in pts] for (pts, z, _) in rings_spec]
    n = len(rings[0])

    for idx in range(len(rings) - 1):
        a, b = rings[idx], rings[idx + 1]
        smooth_band = rings_spec[idx + 1][2]
        for i in range(n):
            j = (i + 1) % n
            f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.smooth = smooth_band

    bm.faces.new(list(reversed(rings[0]))).smooth = False
    bm.faces.new(rings[-1]).smooth = False
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return obj


def build_drone(body_mat, spotlight_mat, blade_mat, location=(0, 0, DOCK_CAVITY_Z)):
    """Construit RingDrone optimisé (1 mesh corps vertex-color + 1 mesh LEDs + 4 rotors = 6 DC)."""
    drone_root = bpy.data.objects.new("RingDrone", None)
    bpy.context.collection.objects.link(drone_root)
    drone_root.location = location

    mid_z = DRONE_H * 0.5
    spine_w = 0.056
    front_y = -DRONE_D * 0.5

    # 1) Corps complet fusionné dans un seul mesh (avec attribut Color linéaire)
    body_mesh = bpy.data.meshes.new("Drone_Body")
    body_obj = bpy.data.objects.new("Drone_Body", body_mesh)
    bpy.context.collection.objects.link(body_obj)
    body_obj.parent = drone_root
    body_obj.data.materials.append(body_mat)

    body_bm = bmesh.new()
    body_bm.loops.layers.color.new("Color")

    append_bmesh(body_bm, make_box_bm((spine_w, DRONE_D, DRONE_H), 0.006, segments=2),
                 color=COL_RED, location=(0, 0, mid_z))
    append_bmesh(body_bm, make_box_bm((spine_w - 0.010, DRONE_D - 0.024, 0.0025), 0.001, segments=1),
                 color=COL_RED_DARK, location=(0, 0.004, DRONE_H - 0.0005))
    append_bmesh(body_bm, make_box_bm((0.026, 0.030, 0.002)),
                 color=COL_DARK, location=(0, 0.0, 0.0005))

    # Caméra frontale 2K
    append_bmesh(body_bm, make_box_bm((0.042, 0.005, 0.018), 0.0015, segments=1),
                 color=COL_DARK, location=(0, front_y + 0.0015, mid_z))
    append_bmesh(body_bm, make_cylinder_bm(0.0072, 0.0045, vertices=14),
                 color=COL_DARK, location=(0, front_y - 0.0005, mid_z), rotation=(math.pi * 0.5, 0, 0))
    append_bmesh(body_bm, make_cylinder_bm(0.0050, 0.002, vertices=14),
                 color=COL_LENS, location=(0, front_y - 0.0022, mid_z), rotation=(math.pi * 0.5, 0, 0))

    outer_r, inner_r = 0.0325, 0.0285
    duct_h = DRONE_H * 0.90
    rx = DRONE_W * 0.5 - outer_r
    ry = DRONE_D * 0.5 - outer_r
    arm_len = rx - spine_w * 0.42

    for tag, px, py, spin_dir in (("FL", -rx, -ry, 1), ("FR", rx, -ry, -1), ("RL", -rx, ry, -1), ("RR", rx, ry, 1)):
        append_bmesh(body_bm, make_duct_bm(outer_r, inner_r, duct_h, segments=22),
                     color=COL_RED, location=(px, py, mid_z))
        append_bmesh(body_bm, make_box_bm((arm_len, 0.011, 0.011), 0.002, segments=1),
                     color=COL_RED, location=(px * 0.55, py, mid_z))
        append_bmesh(body_bm, make_cylinder_bm(0.0062, 0.009, vertices=12),
                     color=COL_DARK, location=(px, py, mid_z - 0.002))

        # Barreaux de protection haut & bas simples (sans chanfrein inutile)
        for z_off in (duct_h * 0.46, -duct_h * 0.46):
            for ang in (math.pi * 0.25, -math.pi * 0.25):
                append_bmesh(body_bm, make_box_bm((inner_r * 1.98, 0.0018, 0.0018)),
                             color=COL_RED_DARK, location=(px, py, mid_z + z_off), rotation=(0, 0, ang))

        # 2) Hélices : 1 mesh fusionné par rotor centré sur le moteur
        rotor_mesh = bpy.data.meshes.new(f"Drone_Rotor_{tag}")
        rotor_obj = bpy.data.objects.new(f"Drone_Rotor_{tag}", rotor_mesh)
        bpy.context.collection.objects.link(rotor_obj)
        rotor_obj.parent = drone_root
        rotor_obj.location = (px, py, mid_z + 0.003)
        rotor_obj.data.materials.append(blade_mat)

        rotor_bm = bmesh.new()
        for b in range(3):
            b_ang = b * (2.0 * math.pi / 3.0)
            bx = math.cos(b_ang) * (inner_r * 0.44)
            by = math.sin(b_ang) * (inner_r * 0.44)
            append_bmesh(rotor_bm, make_box_bm((inner_r * 0.84, 0.0062, 0.0011)),
                         location=(bx, by, 0.0), rotation=(0.18 * spin_dir, 0.0, b_ang))
        rotor_bm.to_mesh(rotor_mesh)
        rotor_bm.free()

    body_bm.to_mesh(body_mesh)
    body_bm.free()

    # 3) Projecteurs LED frontaux fusionnés en 1 seul mesh (1 DC)
    led_mesh = bpy.data.meshes.new("Drone_SpotlightLED")
    led_obj = bpy.data.objects.new("Drone_SpotlightLED", led_mesh)
    bpy.context.collection.objects.link(led_obj)
    led_obj.parent = drone_root
    led_obj.data.materials.append(spotlight_mat)
    led_bm = bmesh.new()
    for sx in (-0.0155, 0.0155):
        append_bmesh(led_bm, make_cylinder_bm(0.0032, 0.002, vertices=10),
                     location=(sx, front_y - 0.001, mid_z), rotation=(math.pi * 0.5, 0, 0))
    led_bm.to_mesh(led_mesh)
    led_bm.free()

    return drone_root


def main():
    clear_scene()
    dock_mat = make_mat("Ring_DockRed", COL_RED[:3], roughness=0.40, metallic=0.10)
    body_mat = make_mat("Ring_DroneBody", (1.0, 1.0, 1.0), roughness=0.38, metallic=0.08, use_vertex_color=True)
    blade_mat = make_mat("Ring_PropBlade", COL_DARK[:3], roughness=0.38, metallic=0.05)
    spotlight_mat = make_mat("Ring_SpotlightLED", (0.95, 0.97, 1.0), roughness=0.15,
                             emission=(1.0, 0.98, 0.92), emission_strength=2.0)

    build_dock(dock_mat)
    build_drone(body_mat, spotlight_mat, blade_mat, location=(0.0, 0.0, DOCK_CAVITY_Z))

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_materials='EXPORT',
    )
    print(f"Exported GLB to: {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")


if __name__ == "__main__":
    main()
