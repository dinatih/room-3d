import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
rig = bpy.data.objects.get("rig")
print(f"Rig exists: {rig is not None}")
if rig:
    print(f"Location: {rig.location}")
    print(f"Scale: {rig.scale}")
    print(f"Hide viewport: {rig.hide_viewport}, Hide render: {rig.hide_render}, Hide get: {rig.hide_get()}")
    print(f"Show in front: {rig.show_in_front}")
    print(f"Number of bones: {len(rig.data.bones)}")
    if hasattr(rig.data, 'collections'):
        for coll in rig.data.collections:
            print(f"Coll: {coll.name}, Visible: {coll.is_visible}")
