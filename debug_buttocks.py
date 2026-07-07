import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

obj = bpy.data.objects.get("Lara")
if obj:
    # Let's find a vertex that is stretching
    # In the screenshot, it stretches backwards.
    # The original pelvis is around Z=1.0. Let's find vertices that have high weights in some weird group
    
    print("VGs on Lara:")
    for vg in obj.vertex_groups:
        print(f"  - {vg.name}")
        
    print("\nChecking a few vertices near the pelvis (z approx 0.8 to 1.1)")
    count = 0
    for v in obj.data.vertices:
        if 0.8 < v.co.z < 1.0 and v.co.y < -0.05:
            # this is roughly the buttocks
            print(f"Vertex {v.index} at {v.co}:")
            for g in v.groups:
                vg_name = obj.vertex_groups[g.group].name
                print(f"    {vg_name}: {g.weight}")
            count += 1
            if count > 10:
                break
