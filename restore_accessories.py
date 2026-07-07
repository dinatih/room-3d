import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Remove the broken hair objects
for name in ["5_Hair2_1.0_0_0", "7_+Head|Hair.Classic_1.0_0_0", "7_-Head|Hair.FMV_1.0_0_0", "5_+Head|Glasses_1.0_0_0", "5_Gear_1.0_0_0", "5_Buckle_1.0_0_0"]:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj)

# Append them fresh from the base file
with bpy.data.libraries.load("sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend", link=False) as (data_from, data_to):
    data_to.objects = ["5_Hair2_1.0_0_0", "7_+Head|Hair.Classic_1.0_0_0", "7_-Head|Hair.FMV_1.0_0_0", "5_+Head|Glasses_1.0_0_0", "5_Gear_1.0_0_0", "5_Buckle_1.0_0_0"]

# Link to scene and setup properly
rig = bpy.data.objects.get("rig")
for obj in data_to.objects:
    if obj:
        bpy.context.scene.collection.objects.link(obj)
        # Put in xps collection
        xps = bpy.data.collections.get("xps")
        if xps and obj.name not in xps.objects:
            xps.objects.link(obj)
            bpy.context.scene.collection.objects.unlink(obj)
            
        # Parent to rig
        obj.parent = rig
        obj.matrix_parent_inverse = rig.matrix_world.inverted()
        
        # Modifier
        for mod in reversed(obj.modifiers):
            if mod.type == 'ARMATURE':
                obj.modifiers.remove(mod)
        mod = obj.modifiers.new("Armature", 'ARMATURE')
        mod.object = rig
        
        # Rename VGs safely
        mapping = {
            "pelvis": "DEF-spine",
            "spine lower": "DEF-spine.001",
            "spine upper": "DEF-spine.003",
            "head neck lower": "DEF-spine.005",
            "head neck upper": "DEF-spine.006",
            # The ponytail bones from mixamo were "head hair ponytail 1" etc.
            # Rigify generated "DEF-head hair ponytail 1" etc.
        }
        
        for vg in obj.vertex_groups:
            # Map known bones
            if vg.name in mapping:
                vg.name = mapping[vg.name]
            elif "hair ponytail" in vg.name and not vg.name.startswith("DEF-"):
                vg.name = "DEF-" + vg.name

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
