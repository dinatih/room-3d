import bpy
import bmesh
import math
import mathutils
import os

BLEND_SRC = "/home/dinatih/Projects/room-3d/sources_backup/skeleton/skeleton_tpose.blend"
BLEND_PUBLIC = "/home/dinatih/Projects/room-3d/public/characters/skeleton/skeleton_tpose.blend"
GLB_PUBLIC = "/home/dinatih/Projects/room-3d/public/characters/skeleton/skeleton.glb"
PREVIEW_PNG = "/home/dinatih/Projects/room-3d/public/characters/skeleton/skeleton_3d_preview.png"

def process_skeleton():
    print(f"Loading {BLEND_SRC}...")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=BLEND_SRC)

    # 1. Delete Object_9, Object_11, Object_12 (and any extra objects like Icosphere if present)
    for name in ['Object_9', 'Object_11', 'Object_12', 'Icosphere']:
        obj = bpy.data.objects.get(name)
        if obj:
            print(f"Removing {name}...")
            bpy.data.objects.remove(obj, do_unlink=True)

    # 2. In Object_7: delete ribcage mesh
    obj7 = bpy.data.objects.get('Object_7')
    if not obj7:
        raise RuntimeError("Object_7 not found in blend file!")

    print(f"Processing Object_7 (initial vertices: {len(obj7.data.vertices)}, faces: {len(obj7.data.polygons)})...")
    rib_vgs = [vg.index for vg in obj7.vertex_groups if 'Rib' in vg.name]
    print(f"Found {len(rib_vgs)} rib vertex groups on Object_7")

    bm = bmesh.new()
    bm.from_mesh(obj7.data)

    # Partition into connected face islands
    visited = set()
    islands = []
    for f in bm.faces:
        if f in visited:
            continue
        island = []
        stack = [f]
        visited.add(f)
        while stack:
            curr = stack.pop()
            island.append(curr)
            for e in curr.edges:
                for lf in e.link_faces:
                    if lf not in visited:
                        visited.add(lf)
                        stack.append(lf)
        islands.append(island)

    faces_to_delete = []
    for isl in islands:
        verts = set(v for f in isl for v in f.verts)
        rib_weight_count = sum(
            1 for v in verts
            if any(g.group in rib_vgs and g.weight > 0.05 for g in obj7.data.vertices[v.index].groups)
        )
        if rib_weight_count / len(verts) > 0.5:
            faces_to_delete.extend(isl)

    print(f"Deleting {len(faces_to_delete)} ribcage faces...")
    bmesh.ops.delete(bm, geom=faces_to_delete, context='FACES_ONLY')
    orphan_verts = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=orphan_verts, context='VERTS')

    bm.to_mesh(obj7.data)
    obj7.data.update()
    bm.free()

    print(f"Object_7 remaining vertices: {len(obj7.data.vertices)}, faces: {len(obj7.data.polygons)}")

    # Remove the empty rib vertex groups from Object_7
    rib_group_names = [vg.name for vg in obj7.vertex_groups if 'Rib' in vg.name]
    for vg_name in rib_group_names:
        vg = obj7.vertex_groups.get(vg_name)
        if vg:
            obj7.vertex_groups.remove(vg)

    # 3. Save updated blend file
    print(f"Saving blend to {BLEND_PUBLIC}...")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PUBLIC)

    # Maintain symlink in sources_backup to avoid duplicating large binary files
    if not os.path.islink(BLEND_SRC):
        if os.path.exists(BLEND_SRC):
            os.remove(BLEND_SRC)
        rel_target = os.path.relpath(BLEND_PUBLIC, os.path.dirname(BLEND_SRC))
        os.symlink(rel_target, BLEND_SRC)
        print(f"Maintained symlink: {BLEND_SRC} -> {rel_target}")

    # 4. Export clean GLB
    print(f"Exporting GLB to {GLB_PUBLIC}...")
    bpy.ops.export_scene.gltf(
        filepath=GLB_PUBLIC,
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False
    )
    print(f"Exported GLB ({os.path.getsize(GLB_PUBLIC)} bytes)")

    # 5. Render clean 3D preview
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'FLAT'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    cam_data = bpy.data.cameras.new(name="PreviewCamera")
    cam_data.type = 'PERSP'
    cam_data.lens = 45
    cam_obj = bpy.data.objects.new(name="PreviewCamera", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_obj.location = mathutils.Vector((0.45, -2.4, 1.0))
    direction = mathutils.Vector((0, 0, 0.9)) - cam_obj.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot_quat.to_euler()

    for o in bpy.data.objects:
        o.hide_render = False

    scene.render.filepath = PREVIEW_PNG
    bpy.ops.render.render(write_still=True)
    print(f"Rendered 3D preview to {PREVIEW_PNG}")

    # Remove temporary test images
    for tmp in ['test_combined.png', 'test_obj7_after.png', 'test_obj7_before.png']:
        tmp_path = os.path.join("/home/dinatih/Projects/room-3d/public/characters/skeleton", tmp)
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            print(f"Removed temp file {tmp_path}")

    print("All tasks completed successfully!")

if __name__ == '__main__':
    process_skeleton()
