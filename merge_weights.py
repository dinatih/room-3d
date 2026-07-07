import bpy
import re

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# The original perfectly weighted mesh
lara = bpy.data.objects.get("Lara")

# 1. Append metarig
filepath = "sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend"
inner_path = "Object"
object_name = "metarig"

bpy.ops.wm.append(
    filepath=f"{filepath}/{inner_path}/{object_name}",
    directory=f"{filepath}/{inner_path}/",
    filename=object_name
)

metarig = bpy.data.objects.get("metarig")
metarig_bone_names = {b.name for b in metarig.data.bones}

# 2. Map DEF- groups to metarig bone names
vg_mapping = {} # old_name -> new_name
for vg in lara.vertex_groups:
    if vg.name.startswith("DEF-"):
        # e.g. DEF-thigh.L.001 -> thigh.L.001
        base_name = vg.name[4:]
        
        # Remove trailing .001, .002 if present
        # but be careful with names like lip.B.L.001 which MIGHT be in metarig
        
        # Check if base_name is already in metarig
        if base_name in metarig_bone_names:
            vg_mapping[vg.name] = base_name
            continue
            
        # Try stripping last .00X
        stripped_name = re.sub(r'\.\d{3}$', '', base_name)
        if stripped_name in metarig_bone_names:
            vg_mapping[vg.name] = stripped_name
            continue
            
        # Hardcode some known mismatches if any
        # e.g. DEF-pelvis.L -> pelvis.L
        
print("MAPPING:", vg_mapping)

# 3. Create new vertex groups and merge weights
mesh = lara.data
vgs = lara.vertex_groups

# Create target groups if they don't exist
for new_name in set(vg_mapping.values()):
    if new_name not in vgs:
        vgs.new(name=new_name)

# Accumulate weights
for v in mesh.vertices:
    weight_acc = {} # new_name -> total_weight
    for g in v.groups:
        old_vg_name = vgs[g.group].name
        if old_vg_name in vg_mapping:
            new_name = vg_mapping[old_vg_name]
            weight_acc[new_name] = weight_acc.get(new_name, 0.0) + g.weight
            
    # Assign accumulated weights
    for new_name, w in weight_acc.items():
        vgs[new_name].add([v.index], w, 'REPLACE')

# 4. Remove all original DEF- and other groups not in metarig
vgs_to_remove = []
for vg in vgs:
    if vg.name not in metarig_bone_names:
        vgs_to_remove.append(vg)

for vg in vgs_to_remove:
    vgs.remove(vg)

# 5. Remove Armature modifier pointing to rig, and point to metarig
for mod in lara.modifiers:
    if mod.type == 'ARMATURE':
        mod.object = metarig

# 6. Delete the old rig
rig = bpy.data.objects.get("rig")
if rig:
    bpy.data.objects.remove(rig, do_unlink=True)

# Delete WGTS collections
for coll_name in ["WGTS_rig", "WGTS_rig.001"]:
    coll = bpy.data.collections.get(coll_name)
    if coll:
        for obj in coll.objects:
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(coll)

bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

# Show metarig
metarig.hide_viewport = False
metarig.hide_render = False

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
