import math
import os
import bpy
import bmesh
from mathutils import Vector

OUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "bed-duvet.glb"))

# Dimensions en mètres (alignées sur UtakerFrame.tsx : longueur X = 1.50 m, largeur Y_blender = 0.80 m)
MATTRESS_LEN = 2.00
MATTRESS_WID = 0.80
MATTRESS_H = 0.30
DUVET_LEN = 1.50        # X local [-0.75, +0.75] sur le dessus avant retombée pied
DROP_NOMINAL = 0.20     # Retombée nominale (20 cm, modulable en Y côté Three.js)

# Résolution grille (modérée pour garder un GLB léger)
NX = 46
NY = 38


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def create_mattress_collider():
    """Boîte matelas arrondie en collision pour drapé réaliste."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(MATTRESS_LEN, MATTRESS_WID, MATTRESS_H), verts=bm.verts)
    # Placer le sommet du matelas à Z = 0, centré X=[-1.25, +0.75] pour que X=+0.75 soit le pied du lit
    bmesh.ops.translate(bm, vec=(-0.25, 0.0, -MATTRESS_H * 0.5), verts=bm.verts)

    # Chanfrein doux sur toutes les arêtes pour que la couette épouse le bord du matelas
    bmesh.ops.bevel(
        bm,
        geom=list(bm.edges),
        offset=0.028,
        segments=4,
        profile=0.5,
        affect='EDGES',
    )

    mesh = bpy.data.meshes.new("MattressCollider")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("MattressCollider", mesh)
    bpy.context.collection.objects.link(obj)
    obj.modifiers.new(name="Collision", type='COLLISION')
    obj.collision.thickness_outer = 0.005
    obj.collision.cloth_friction = 12.0
    return obj


def create_duvet_cloth():
    """Crée la grille de couette au-dessus du matelas et simule le drapé Cloth."""
    total_x = DUVET_LEN + DROP_NOMINAL + 0.02
    total_y = MATTRESS_WID + 2.0 * DROP_NOMINAL + 0.02

    bm = bmesh.new()
    verts_grid = []
    x_start = -DUVET_LEN * 0.5
    x_end = DUVET_LEN * 0.5 + DROP_NOMINAL + 0.02
    y_start = -total_y * 0.5
    y_end = total_y * 0.5

    for ix in range(NX + 1):
        u = ix / NX
        x = x_start + (x_end - x_start) * u
        row = []
        for iy in range(NY + 1):
            v = iy / NY
            y = y_start + (y_end - y_start) * v
            # Pré-courber légèrement les bords dépassant du matelas pour qu'ils épousent ses flancs sans s'écarter
            over_x = max(0.0, x - (DUVET_LEN * 0.5 - 0.02))
            over_y = max(0.0, abs(y) - (MATTRESS_WID * 0.5 - 0.02))
            if over_x > 0.0 or over_y > 0.0:
                x_eff = min(x, DUVET_LEN * 0.5 - 0.02) + over_x * 0.25
                y_eff = math.copysign(min(abs(y), MATTRESS_WID * 0.5 - 0.02) + over_y * 0.25, y)
                z = 0.012 - 0.85 * math.hypot(over_x, over_y)
            else:
                x_eff, y_eff = x, y
                z = 0.012 + 0.004 * math.sin(x * 7.0 + y * 5.0) + 0.003 * math.cos(y * 9.0 - x * 3.0)
            row.append(bm.verts.new((x_eff, y_eff, z)))
        verts_grid.append(row)

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for ix in range(NX):
        for iy in range(NY):
            f = bm.faces.new((
                verts_grid[ix][iy],
                verts_grid[ix + 1][iy],
                verts_grid[ix + 1][iy + 1],
                verts_grid[ix][iy + 1],
            ))
            uvs = (
                (ix / NX, iy / NY),
                ((ix + 1) / NX, iy / NY),
                ((ix + 1) / NX, (iy + 1) / NY),
                (ix / NX, (iy + 1) / NY),
            )
            for loop, uv in zip(f.loops, uvs):
                loop[uv_layer].uv = uv

    mesh = bpy.data.meshes.new("BedDuvet")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("BedDuvet", mesh)
    bpy.context.collection.objects.link(obj)

    # Pin léger sur la zone centrale côté tête pour empêcher la couette de glisser
    vg = obj.vertex_groups.new(name="PinTop")
    pin_indices = []
    for v in obj.data.vertices:
        if v.co.x < -DUVET_LEN * 0.5 + 0.08 and abs(v.co.y) < MATTRESS_WID * 0.42:
            pin_indices.append(v.index)
    vg.add(pin_indices, 0.9, 'REPLACE')

    # Modificateur Cloth (réglages coton/couette souple)
    cloth_mod = obj.modifiers.new(name="Cloth", type='CLOTH')
    cs = cloth_mod.settings
    cs.quality = 6
    cs.mass = 0.45
    cs.air_damping = 0.9
    cs.tension_stiffness = 22.0
    cs.compression_stiffness = 18.0
    cs.shear_stiffness = 12.0
    cs.bending_stiffness = 1.4
    cs.vertex_group_mass = "PinTop"
    cs.pin_stiffness = 0.85

    cc = cloth_mod.collision_settings
    cc.use_collision = True
    cc.distance_min = 0.005
    cc.friction = 15.0

    # Avancer la simulation pour que les bords retombent et se posent le long des flancs
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 42
    for f in range(1, 43):
        scene.frame_set(f)

    # Figer la géométrie simulée
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')

    return obj


def refine_and_color_duvet(obj):
    """Ajoute le revers en tête, l'effet matelassé, Solidify, lissage et AO dans les plis."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)

    # Clamp doux du bas pour garantir une retombée propre ≤ DROP_NOMINAL et ajouter un léger ourlet ondulé
    for v in bm.verts:
        if v.co.z < -DROP_NOMINAL:
            v.co.z = -DROP_NOMINAL + 0.004 * math.sin(v.co.x * 18.0 + v.co.y * 14.0)

        # Léger effet matelassé / piquage (carreaux de couette ~25 cm) sur la face supérieure
        if abs(v.co.y) < MATTRESS_WID * 0.47 and v.co.x < DUVET_LEN * 0.47 and v.co.z > -0.02:
            qx = abs(math.sin((v.co.x + 0.75) * math.pi / 0.25))
            qy = abs(math.sin((v.co.y + 0.40) * math.pi / 0.25))
            puff = 0.007 * (qx * qy) ** 0.7
            v.co.z += puff

        # Revers / pliure douce côté tête de lit (X près de -0.75)
        head_dist = v.co.x - (-DUVET_LEN * 0.5)
        if 0.0 <= head_dist < 0.14 and v.co.z > -0.04:
            roll = math.sin((head_dist / 0.14) * math.pi)
            v.co.z += 0.022 * roll

    bm.normal_update()
    bm.to_mesh(obj.data)
    bm.free()

    # Solidify pour donner l'épaisseur réelle d'une couette (~1.8 cm)
    solid = obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    solid.thickness = 0.018
    solid.offset = 1.0
    solid.use_rim = True

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="Solidify")

    # Smooth shading
    for p in obj.data.polygons:
        p.use_smooth = True

    # Vertex colors : rouge profond uniforme modulé par la hauteur/piquage (AO légère dans les creux)
    # et blanc cassé/rouge clair sur le bord du revers supérieur
    color_layer = obj.data.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='CORNER')
    verts = obj.data.vertices
    for poly in obj.data.polygons:
        for li in poly.loop_indices:
            v = verts[obj.data.loops[li].vertex_index]
            # Occlusion subtile en bas de retombée et dans les coutures de piquage
            shade = 0.84 + 0.16 * max(0.0, min(1.0, (v.co.z + DROP_NOMINAL) / DROP_NOMINAL))
            if abs(v.co.y) < MATTRESS_WID * 0.47 and v.co.x < DUVET_LEN * 0.47 and v.co.z > -0.02:
                qx = abs(math.sin((v.co.x + 0.75) * math.pi / 0.25))
                qy = abs(math.sin((v.co.y + 0.40) * math.pi / 0.25))
                shade *= (0.90 + 0.10 * (qx * qy))
            # Couleur blanche/neutre : le tint rouge (0x991111) + texture sont appliqués par redFabricMat,
            # ou directement ici en facteur AO grayscale (1,1,1)*shade !
            color_layer.data[li].color = (shade, shade, shade, 1.0)

    # Matériau neutre de prévisualisation GLB (ShaderNodeVertexColor assure l'export COLOR_0)
    mat = bpy.data.materials.new(name="DuvetFabric")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    vcol = nt.nodes.new(type="ShaderNodeVertexColor")
    vcol.layer_name = "Color"
    nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.88
    obj.data.materials.append(mat)


def main():
    clear_scene()
    collider = create_mattress_collider()
    duvet = create_duvet_cloth()
    refine_and_color_duvet(duvet)

    # Supprimer le collider avant export
    bpy.data.objects.remove(collider, do_unlink=True)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_materials='EXPORT',
        export_vertex_color='MATERIAL',
    )
    tri_count = sum(len(p.vertices) - 2 for p in duvet.data.polygons)
    print(f"Exported bed duvet GLB to {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes, {tri_count} tris)")


if __name__ == "__main__":
    main()
