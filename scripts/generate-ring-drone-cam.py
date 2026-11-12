import math
import os
import bpy
import bmesh

# Output path relative to project root
OUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "ring-drone-cam.glb"))

# Exact Ring Drone Cam (Nov 2026) specs in meters
DOCK_W, DOCK_D, DOCK_H = 0.270, 0.2335, 0.0783
DRONE_W, DRONE_D, DRONE_H = 0.1718, 0.1369, 0.03315


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_mat(name, base_color, roughness=0.45, metallic=0.0, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def add_rounded_box(name, size, radius, segments=4, location=(0, 0, 0), rotation=(0, 0, 0), mat=None, parent=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=radius, segments=segments, affect='EDGES', clamp_overlap=True)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj.location = location
    obj.rotation_euler = rotation
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def add_cylinder(name, radius, depth, vertices=32, location=(0, 0, 0), rotation=(0, 0, 0), mat=None, parent=None, bevel=0.0):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=vertices, radius1=radius, radius2=radius, depth=depth)
    if bevel > 0.0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect='EDGES', clamp_overlap=True)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj.location = location
    obj.rotation_euler = rotation
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def add_duct_ring(name, outer_r, inner_r, height, segments=40, location=(0, 0, 0), mat=None, parent=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
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
        bm.faces.new((top_out[i], top_out[j], top_in[j], top_in[i]))
        bm.faces.new((bot_in[i], bot_in[j], bot_out[j], bot_out[i]))
        bm.faces.new((bot_out[i], bot_out[j], top_out[j], top_out[i]))
        bm.faces.new((top_in[i], top_in[j], bot_in[j], bot_in[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.0012, segments=2, affect='EDGES', clamp_overlap=True)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj.location = location
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def build_dock(mats):
    dock_root = bpy.data.objects.new("RingDock", None)
    bpy.context.collection.objects.link(dock_root)

    # Rubberized bottom pad (Z: 0 -> 0.003)
    add_rounded_box("Dock_RubberBase", (DOCK_W - 0.008, DOCK_D - 0.008, 0.003), 0.014,
                    location=(0, 0, 0.0015), mat=mats["dark_rubber"], parent=dock_root)

    # Main outer shell (lower body Z: 0.003 -> 0.042)
    add_rounded_box("Dock_LowerShell", (DOCK_W, DOCK_D, 0.039), 0.018,
                    location=(0, 0, 0.0225), mat=mats["gray_shell"], parent=dock_root)

    # Raised perimeter walls forming the recessed landing bay & front privacy shutter (Z: 0.040 -> 0.0783)
    wall_h = DOCK_H - 0.040
    wall_z = 0.040 + wall_h * 0.5
    bay_w, bay_d = DRONE_W + 0.012, DRONE_D + 0.012
    side_t = (DOCK_W - bay_w) * 0.5
    fb_t = (DOCK_D - bay_d) * 0.5

    # Front privacy wall (physically blocks camera lens when docked, -Y is front)
    add_rounded_box("Dock_FrontPrivacyWall", (DOCK_W - 0.004, fb_t, wall_h), 0.008,
                    location=(0, -(bay_d * 0.5 + fb_t * 0.5), wall_z), mat=mats["gray_shell"], parent=dock_root)
    # Rear wall
    add_rounded_box("Dock_RearWall", (DOCK_W - 0.004, fb_t, wall_h * 0.88), 0.008,
                    location=(0, (bay_d * 0.5 + fb_t * 0.5), 0.040 + wall_h * 0.44), mat=mats["gray_shell"], parent=dock_root)
    # Left & Right cradle walls
    for sign, label in ((-1, "Left"), (1, "Right")):
        add_rounded_box(f"Dock_{label}Wall", (side_t, bay_d + 0.016, wall_h * 0.88), 0.008,
                        location=(sign * (bay_w * 0.5 + side_t * 0.5), 0, 0.040 + wall_h * 0.44),
                        mat=mats["gray_shell"], parent=dock_root)

    # Inner cradle floor plate
    add_rounded_box("Dock_CradleFloor", (bay_w - 0.004, bay_d - 0.004, 0.004), 0.002,
                    location=(0, 0, 0.041), mat=mats["mid_gray"], parent=dock_root)

    # Gold charging contact pins inside bay
    for px in (-0.016, 0.0, 0.016):
        add_cylinder(f"Dock_ChargePin_{px:.3f}", 0.0022, 0.004, vertices=16,
                     location=(px, 0.015, 0.044), mat=mats["gold"], parent=dock_root)

    # Front Ring-blue status LED bar
    add_rounded_box("Dock_StatusLED", (0.032, 0.0025, 0.003), 0.001,
                    location=(0, -DOCK_D * 0.5 + 0.001, 0.022), mat=mats["ring_led"], parent=dock_root)

    # Rear USB-C power port recess
    add_rounded_box("Dock_USBC_Port", (0.011, 0.004, 0.0045), 0.0015,
                    location=(0, DOCK_D * 0.5 - 0.001, 0.016), mat=mats["dark_metal"], parent=dock_root)

    return dock_root


def build_drone(mats, location=(0, 0, 0.0435)):
    drone_root = bpy.data.objects.new("RingDrone", None)
    bpy.context.collection.objects.link(drone_root)
    drone_root.location = location

    mid_z = DRONE_H * 0.5
    spine_w = 0.056

    # Central spine / fuselage
    add_rounded_box("Drone_BodySpine", (spine_w, DRONE_D, DRONE_H), 0.008,
                    location=(0, 0, mid_z), mat=mats["light_gray"], parent=drone_root)

    # Top battery / sensor cover plate
    add_rounded_box("Drone_TopCap", (spine_w - 0.010, DRONE_D - 0.024, 0.003), 0.0015,
                    location=(0, 0.004, DRONE_H - 0.001), mat=mats["gray_shell"], parent=drone_root)

    # Cooling vents on top rear
    for i in range(4):
        add_rounded_box(f"Drone_Vent_{i}", (0.026, 0.0022, 0.002), 0.0005,
                        location=(0, 0.036 + i * 0.006, DRONE_H), mat=mats["dark_metal"], parent=drone_root)

    # Downward optical flow & ToF sensor pod on belly
    add_rounded_box("Drone_BottomSensorPad", (0.026, 0.030, 0.002), 0.001,
                    location=(0, 0.0, 0.0005), mat=mats["dark_metal"], parent=drone_root)
    add_cylinder("Drone_OpticalFlowLens", 0.0045, 0.002, vertices=20,
                 location=(0, -0.006, 0.0002), mat=mats["lens_glass"], parent=drone_root)

    # Front 2K Camera (148-deg FOV) & Dual LED Spotlights (-Y is front)
    front_y = -DRONE_D * 0.5
    add_rounded_box("Drone_CameraVisor", (0.044, 0.005, 0.020), 0.0025,
                    location=(0, front_y + 0.0015, mid_z), mat=mats["dark_metal"], parent=drone_root)
    add_cylinder("Drone_CameraBarrel", 0.0075, 0.005, vertices=24,
                 location=(0, front_y - 0.0005, mid_z), rotation=(math.pi * 0.5, 0, 0),
                 mat=mats["dark_rubber"], parent=drone_root, bevel=0.0008)
    add_cylinder("Drone_CameraLens", 0.0052, 0.002, vertices=24,
                 location=(0, front_y - 0.0025, mid_z), rotation=(math.pi * 0.5, 0, 0),
                 mat=mats["lens_glass"], parent=drone_root)

    for sx, label in ((-0.0155, "Left"), (0.0155, "Right")):
        add_cylinder(f"Drone_SpotlightBezel_{label}", 0.0042, 0.003, vertices=20,
                     location=(sx, front_y - 0.0005, mid_z), rotation=(math.pi * 0.5, 0, 0),
                     mat=mats["mid_gray"], parent=drone_root)
        add_cylinder(f"Drone_SpotlightLED_{label}", 0.0030, 0.002, vertices=20,
                     location=(sx, front_y - 0.0015, mid_z), rotation=(math.pi * 0.5, 0, 0),
                     mat=mats["spotlight_led"], parent=drone_root)

    # Top-front status LED indicator
    add_rounded_box("Drone_StatusLED", (0.014, 0.003, 0.0018), 0.0008,
                    location=(0, front_y + 0.012, DRONE_H - 0.0002), mat=mats["ring_led"], parent=drone_root)

    # 4 Encaged Rotor Ducts (total span X = 0.1718 m, Y = 0.1369 m)
    outer_r = 0.0325
    inner_r = 0.0285
    duct_h = DRONE_H * 0.90
    rx = DRONE_W * 0.5 - outer_r
    ry = DRONE_D * 0.5 - outer_r

    for tag, px, py, spin_dir in (("FL", -rx, -ry, 1), ("FR", rx, -ry, -1), ("RL", -rx, ry, -1), ("RR", rx, ry, 1)):
        add_duct_ring(f"Drone_Duct_{tag}", outer_r, inner_r, duct_h, segments=36,
                      location=(px, py, mid_z), mat=mats["light_gray"], parent=drone_root)

        arm_len = abs(px) - spine_w * 0.42
        add_rounded_box(f"Drone_Arm_{tag}", (arm_len, 0.012, 0.012), 0.003,
                        location=(px * 0.55, py, mid_z), mat=mats["light_gray"], parent=drone_root)

        # Top & Bottom safety cage cross-spokes
        for z_off, side in ((duct_h * 0.46, "Top"), (-duct_h * 0.46, "Bot")):
            for ang in (math.pi * 0.25, -math.pi * 0.25):
                add_rounded_box(f"Drone_CageSpoke_{tag}_{side}_{ang:.1f}", (inner_r * 1.98, 0.0018, 0.0018), 0.0004,
                                location=(px, py, mid_z + z_off), rotation=(0, 0, ang),
                                mat=mats["mid_gray"], parent=drone_root)

        add_cylinder(f"Drone_Motor_{tag}", 0.0065, 0.010, vertices=20,
                     location=(px, py, mid_z - 0.002), mat=mats["dark_metal"], parent=drone_root)

        # 3-blade propeller inside duct
        for b in range(3):
            b_ang = b * (2.0 * math.pi / 3.0)
            bx = px + math.cos(b_ang) * (inner_r * 0.45)
            by = py + math.sin(b_ang) * (inner_r * 0.45)
            add_rounded_box(f"Drone_Blade_{tag}_{b}", (inner_r * 0.85, 0.0065, 0.0012), 0.0004,
                            location=(bx, by, mid_z + 0.003), rotation=(0.18 * spin_dir, 0.0, b_ang),
                            mat=mats["prop_blade"], parent=drone_root)

    return drone_root


def main():
    clear_scene()
    mats = {
        "gray_shell": make_mat("Ring_GrayShell", (0.62, 0.64, 0.67), roughness=0.45),
        "light_gray": make_mat("Ring_LightGray", (0.72, 0.74, 0.77), roughness=0.40),
        "mid_gray": make_mat("Ring_MidGray", (0.38, 0.40, 0.43), roughness=0.50),
        "dark_rubber": make_mat("Ring_DarkRubber", (0.08, 0.09, 0.10), roughness=0.80),
        "dark_metal": make_mat("Ring_DarkMetal", (0.12, 0.13, 0.15), roughness=0.35, metallic=0.6),
        "prop_blade": make_mat("Ring_PropBlade", (0.14, 0.15, 0.17), roughness=0.35),
        "gold": make_mat("Ring_GoldContacts", (0.83, 0.68, 0.22), roughness=0.22, metallic=1.0),
        "lens_glass": make_mat("Ring_CameraLens", (0.02, 0.05, 0.10), roughness=0.05, metallic=0.1),
        "ring_led": make_mat("Ring_BlueLED", (0.0, 0.62, 1.0), roughness=0.2, emission=(0.0, 0.62, 1.0), emission_strength=3.5),
        "spotlight_led": make_mat("Ring_SpotlightLED", (0.95, 0.97, 1.0), roughness=0.15, emission=(1.0, 0.98, 0.92), emission_strength=2.0),
    }

    build_dock(mats)
    build_drone(mats, location=(0.0, 0.0, 0.0435))

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
