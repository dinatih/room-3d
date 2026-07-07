import bpy

files = [
    "sources_backup/lara_croft_perfect_rigify_final.blend",
    "sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend"
]

for f in files:
    try:
        bpy.ops.wm.open_mainfile(filepath=f)
        def unexclude_all(lc):
            if "WGTS" in lc.name:
                lc.exclude = False
                print(f"Unexcluded {lc.name} in {f}")
            for child in lc.children:
                unexclude_all(child)

        unexclude_all(bpy.context.view_layer.layer_collection)
        
        # force visibility of WGTS collections
        for coll in bpy.data.collections:
            if "WGTS" in coll.name:
                coll.hide_viewport = False

        bpy.ops.wm.save_as_mainfile(filepath=f)
    except Exception as e:
        print(f"Failed on {f}: {e}")
