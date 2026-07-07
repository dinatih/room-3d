import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

def unexclude_all(lc):
    if "WGTS" in lc.name:
        lc.exclude = False
        print(f"Unexcluded {lc.name}")
    for child in lc.children:
        unexclude_all(child)

unexclude_all(bpy.context.view_layer.layer_collection)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
