import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")

# Delete all armatures except metarig
armatures_to_delete = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE' and obj.name != 'metarig']

for arm in armatures_to_delete:
    print("Deleting armature:", arm.name)
    bpy.data.objects.remove(arm, do_unlink=True)

# Also delete any leftover collections starting with WGTS
collections_to_delete = [c for c in bpy.data.collections if c.name.startswith("WGTS")]
for coll in collections_to_delete:
    for obj in coll.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(coll)

# Purge orphans to truly remove the bone data
bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

# Ensure metarig is the only armature
armatures_remaining = [obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE']
print("REMAINING ARMATURES:", armatures_remaining)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")

# Export to GLB
bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_yup=True,
    export_animations=True
)
