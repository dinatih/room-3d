import os
import shutil
import bpy
import bmesh

SRC_GLB = "public/items/utdrag10389142/Utdrag10389142.glb"
RAW_GLB = "public/items/utdrag10389142/Utdrag10389142_raw.glb"
OUT_GLB = "public/items/utdrag10389142/Utdrag10389142.glb"

if not os.path.exists(RAW_GLB):
    print(f"Backing up original to {RAW_GLB}")
    shutil.copyfile(SRC_GLB, RAW_GLB)

# Reset blender state
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import raw GLB
print(f"Importing {RAW_GLB}")
bpy.ops.import_scene.gltf(filepath=RAW_GLB)

source_obj = None
for obj in bpy.data.objects:
    if obj.type == "MESH":
        source_obj = obj
        break

if not source_obj:
    raise RuntimeError("No mesh object found in GLB")

print(f"Found source mesh: {source_obj.name}")

# Duplicate source_obj to create Base and Drawer
drawer_obj = source_obj.copy()
drawer_obj.data = source_obj.data.copy()
drawer_obj.name = "Utdrag_Drawer"
source_obj.name = "Utdrag_Base"
bpy.context.collection.objects.link(drawer_obj)

# Cut Base: keep only Z <= 0.270
bm_base = bmesh.new()
bm_base.from_mesh(source_obj.data)
bmesh.ops.bisect_plane(
    bm_base,
    geom=bm_base.verts[:] + bm_base.edges[:] + bm_base.faces[:],
    plane_co=(0, 0, 0.270),
    plane_no=(0, 0, 1),
    clear_outer=True,   # removes Z > 0.270
    clear_inner=False
)
bm_base.to_mesh(source_obj.data)
source_obj.data.update()
bm_base.free()

# Cut Drawer: keep only Z >= 0.270
bm_drawer = bmesh.new()
bm_drawer.from_mesh(drawer_obj.data)
bmesh.ops.bisect_plane(
    bm_drawer,
    geom=bm_drawer.verts[:] + bm_drawer.edges[:] + bm_drawer.faces[:],
    plane_co=(0, 0, 0.270),
    plane_no=(0, 0, 1),
    clear_outer=False,
    clear_inner=True    # removes Z < 0.270
)
bm_drawer.to_mesh(drawer_obj.data)
drawer_obj.data.update()
bm_drawer.free()

print("Base verts:", len(source_obj.data.vertices))
print("Drawer verts:", len(drawer_obj.data.vertices))

# Deselect everything then select both objects
for obj in bpy.data.objects:
    obj.select_set(False)

source_obj.select_set(True)
drawer_obj.select_set(True)
bpy.context.view_layer.objects.active = source_obj

# Export to GLB
print(f"Exporting separated objects to {OUT_GLB}")
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_draco_mesh_compression_enable=False
)
print("Export completed successfully.")
