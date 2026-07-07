import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")

# Re-enable use_deform for the REAL Rigify pelvis bones!
for b in ["DEF-pelvis.L", "DEF-pelvis.R"]:
    bone = rig.data.bones.get(b)
    if bone:
        bone.use_deform = True
        print(f"Re-enabled deform for {b}")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
