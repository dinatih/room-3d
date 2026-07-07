import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")

# Find vertices that are stretched. 
# They are likely at the bottom of the shorts or the back of the thighs.
# Let's find vertices with a high Z coordinate (like Z > 0.8) and low Y (backwards) that have multiple strong weights.

import bmesh
bm = bmesh.new()
bm.from_mesh(lara.data)
bm.verts.ensure_lookup_table()

deform_layer = bm.verts.layers.deform.verify()

print("Checking vertices that might be stretched in buttocks area...")
for v in bm.verts:
    # Look around the pelvis/upper thigh
    if 0.8 < v.co.z < 1.05 and v.co.y < -0.05:
        weights = {}
        for idx, weight in v[deform_layer].items():
            if weight > 0.01:
                weights[lara.vertex_groups[idx].name] = weight
                
        # If it has thigh and spine weights, it might be the problem
        has_spine = any("spine" in name for name in weights)
        has_thigh = any("thigh" in name for name in weights)
        has_pelvis = any("pelvis" in name for name in weights)
        
        if has_spine and has_thigh:
            print(f"Vertex {v.index} at {v.co}:")
            for name, w in weights.items():
                print(f"  {name}: {w:.3f}")
            print("---")
            break # just print one
