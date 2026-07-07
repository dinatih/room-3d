import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend")

for name in ["5_Body_1.0_0_0", "5_Shirt_1.0_0_0", "5_Arms_1.0_0_0"]:
    obj = bpy.data.objects.get(name)
    if obj:
        print(f"--- VGs for {name} ---")
        for vg in obj.vertex_groups:
            print(f"  - {vg.name}")
