import os
import math
import bpy
import bmesh
from mathutils import Vector

OUT_GLB = os.path.abspath("public/models/dimpa-cover.glb")

# Dimensions du sac Dimpa (en mètres, Blender Z-up) : 0.683 x 0.273 x 0.669
BAG_W = 0.675
BAG_D = 0.265
BAG_H = 0.665


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def create_bag_collider():
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, BAG_H * 0.5))
    bag = bpy.context.active_object
    bag.name = "DimpaCollider"
    bag.scale = (BAG_W, BAG_D, BAG_H)
    bpy.ops.object.transform_apply(scale=True)

    sub = bag.modifiers.new(name="Subsurf", type="SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = 2
    sub.render_levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in bag.data.vertices:
        nx = v.co.x / (BAG_W * 0.5)
        ny = v.co.y / (BAG_D * 0.5)
        nz = (v.co.z - BAG_H * 0.5) / (BAG_H * 0.5)
        bulge = max(0.0, 1.0 - nx * nx * 0.55) * max(0.0, 1.0 - nz * nz * 0.45)
        v.co.y += math.copysign(0.014 * bulge, v.co.y) if abs(v.co.y) > 0.02 else 0.0

    bev = bag.modifiers.new(name="Bevel", type="BEVEL")
    bev.width = 0.032
    bev.segments = 3
    bev.limit_method = "NONE"
    bpy.ops.object.modifier_apply(modifier=bev.name)

    bpy.ops.object.modifier_add(type="COLLISION")
    bag.collision.thickness_outer = 0.006
    bag.collision.thickness_inner = 0.02
    bag.collision.cloth_friction = 14.0
    return bag


def create_floor_collider():
    bpy.ops.mesh.primitive_plane_add(size=2.4, location=(0.0, 0.0, 0.0))
    floor = bpy.context.active_object
    floor.name = "FloorCollider"
    bpy.ops.object.modifier_add(type="COLLISION")
    floor.collision.thickness_outer = 0.005
    floor.collision.cloth_friction = 22.0
    return floor


def create_draped_sheet():
    # Housse / drap en cloche ajustée autour du sac (ouverte en bas), simulée par Cloth
    hx = BAG_W * 0.5 + 0.015
    hy = BAG_D * 0.5 + 0.014
    hz = BAG_H + 0.015

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, hz * 0.5))
    obj = bpy.context.active_object
    obj.name = "DimpaCover"
    obj.scale = (hx * 2.0, hy * 2.0, hz)
    bpy.ops.object.transform_apply(scale=True)

    # Supprimer la face inférieure pour en faire un drap/housse ouvert en bas
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bottom_faces = [f for f in bm.faces if f.normal.z < -0.5]
    bmesh.ops.delete(bm, geom=bottom_faces, context="FACES")

    # Subdiviser en grille régulière pour la simulation Cloth
    bmesh.ops.subdivide_edges(
        bm,
        edges=bm.edges[:],
        cuts=14,
        use_grid_fill=True,
    )

    # Ajouter un léger excédent de tissu et une ondulation organique pour former des plis réels
    for v in bm.verts:
        ripple = 0.005 * math.sin(v.co.x * 26.0 + v.co.z * 11.0) * math.cos(v.co.y * 22.0)
        v.co.x += ripple * 0.5
        v.co.y += ripple

    # UVMap cubique simple pour la trame textile
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        n = face.normal
        for loop in face.loops:
            co = loop.vert.co
            if abs(n.z) > 0.6:
                u, v_uv = co.x * 1.4 + 0.5, co.y * 1.4 + 0.5
            elif abs(n.y) > 0.6:
                u, v_uv = co.x * 1.4 + 0.5, co.z * 1.4
            else:
                u, v_uv = co.y * 1.4 + 0.5, co.z * 1.4
            loop[uv_layer].uv = (u, v_uv)

    bm.to_mesh(obj.data)
    bm.free()

    cloth_mod = obj.modifiers.new(name="Cloth", type="CLOTH")
    cs = cloth_mod.settings
    cs.quality = 6
    cs.mass = 0.25
    cs.air_damping = 0.9
    cs.tension_stiffness = 12.0
    cs.compression_stiffness = 10.0
    cs.shear_stiffness = 8.0
    cs.bending_stiffness = 0.35
    cs.tension_damping = 5.0
    cs.bending_damping = 0.5
    cs.use_pressure = True
    cs.uniform_pressure_force = -0.85  # légère aspiration vers le sac pour plaquer les plis sans déborder

    cc = cloth_mod.collision_settings
    cc.use_collision = True
    cc.use_self_collision = True
    cc.distance_min = 0.006
    cc.self_distance_min = 0.005
    cc.friction = 14.0

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 36
    for f in range(1, 37):
        scene.frame_set(f)

    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    baked_mesh = bpy.data.meshes.new_from_object(eval_obj)

    obj.modifiers.remove(cloth_mod)
    obj.data = baked_mesh

    for v in obj.data.vertices:
        if v.co.z < 0.004:
            v.co.z = 0.004

    solid = obj.modifiers.new(name="Solidify", type="SOLIDIFY")
    solid.thickness = 0.008
    solid.offset = 1.0
    solid.use_rim = True
    bpy.ops.object.modifier_apply(modifier=solid.name)

    for poly in obj.data.polygons:
        poly.use_smooth = True

    obj.data.color_attributes.new(name="COLOR_0", type="FLOAT_COLOR", domain="CORNER")
    bm2 = bmesh.new()
    bm2.from_mesh(obj.data)
    bm2.normal_update()
    c_layer = bm2.loops.layers.float_color.get("COLOR_0")
    for face in bm2.faces:
        for loop in face.loops:
            v = loop.vert
            h_factor = min(1.0, max(0.0, v.co.z / BAG_H))
            ao = 0.80 + 0.20 * (0.35 + 0.65 * h_factor)
            ao = max(0.72, min(1.0, ao))
            loop[c_layer] = (ao, ao, ao, 1.0)
    bm2.to_mesh(obj.data)
    bm2.free()

    mat = bpy.data.materials.new("DimpaCoverRed")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        vcol = mat.node_tree.nodes.new("ShaderNodeVertexColor")
        vcol.layer_name = "COLOR_0"
        mat.node_tree.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.9
    obj.data.materials.append(mat)

    return obj


def export_glb(obj):
    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_attributes=True,
        export_materials="EXPORT",
    )
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for v in obj.data.vertices:
        mins.x = min(mins.x, v.co.x)
        mins.y = min(mins.y, v.co.y)
        mins.z = min(mins.z, v.co.z)
        maxs.x = max(maxs.x, v.co.x)
        maxs.y = max(maxs.y, v.co.y)
        maxs.z = max(maxs.z, v.co.z)
    print(
        f"Exported {OUT_GLB} ({os.path.getsize(OUT_GLB)} bytes, {tris} tris) "
        f"bounds min={tuple(round(x, 3) for x in mins)} max={tuple(round(x, 3) for x in maxs)}"
    )


if __name__ == "__main__":
    clear_scene()
    create_bag_collider()
    create_floor_collider()
    cover = create_draped_sheet()
    export_glb(cover)
