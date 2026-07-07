import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
if rig:
    # Get all DEF bones from the rig
    def_bones = [b.name for b in rig.data.bones if b.name.startswith("DEF-")]
    
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj.name != "Lara" and not obj.name.startswith("WGT")]
    for m in meshes:
        print(f"Fixing weights for {m.name}")
        for vg in m.vertex_groups:
            old_name = vg.name
            
            # Known mappings based on standard rigify
            mapping = {
                'head': 'DEF-head',
                'neck': 'DEF-neck',
                'chest': 'DEF-spine.003',
                'spine upper': 'DEF-spine.003',
                'spine lower': 'DEF-spine.002',
                'hips': 'DEF-pelvis',
                'shoulder.L': 'DEF-shoulder.L',
                'shoulder.R': 'DEF-shoulder.R',
                'upper_arm.L': 'DEF-upper_arm.L',
                'upper_arm.R': 'DEF-upper_arm.R',
                'spine.001': 'DEF-spine.001',
                'spine.002': 'DEF-spine.002',
                'spine.003': 'DEF-spine.003',
                'pelvis': 'DEF-pelvis',
                'breast.L': 'DEF-breast.L',
                'breast.R': 'DEF-breast.R',
            }
            
            new_name = mapping.get(old_name, old_name)
            
            if new_name == old_name and not old_name.startswith("DEF-"):
                if f"DEF-{old_name}" in def_bones:
                    new_name = f"DEF-{old_name}"
            
            if new_name != old_name:
                print(f"  Rename VG: {old_name} -> {new_name}")
                vg.name = new_name

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
