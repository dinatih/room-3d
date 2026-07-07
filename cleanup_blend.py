import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")

# 1. Delete all rig and rig.001 objects
for obj_name in ["rig", "rig.001"]:
    obj = bpy.data.objects.get(obj_name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

# 2. Delete WGTS_rig and WGTS_rig.001 collections
for coll_name in ["WGTS_rig", "WGTS_rig.001"]:
    coll = bpy.data.collections.get(coll_name)
    if coll:
        # Delete objects inside the collection first
        for obj in coll.objects:
            bpy.data.objects.remove(obj, do_unlink=True)
        # Delete the collection itself
        bpy.data.collections.remove(coll)

# 3. Purge orphans to thoroughly clean up data (meshes, materials, etc. left behind)
bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")
