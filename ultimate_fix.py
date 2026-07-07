import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend")

rig = bpy.data.objects.get("rig")
if rig:
    rig.hide_set(False)
    rig.hide_viewport = False
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='OBJECT')

core_parts = ["5_Arms_1.0_0_0", "5_Body_1.0_0_0", "5_Boots_1.0_0_0", 
              "5_Face_1.0_0_0", "5_Fingers_1.0_0_0", "5_Gloves_1.0_0_0", 
              "5_Shirt_1.0_0_0", "5_Shorts_1.0_0_0", "5_Eyes_1.0_0_0", 
              "7_Eye2_1.0_0_0", "7_Lashes_1.0_0_0"]

parts_to_merge = []
for p in core_parts:
    obj = bpy.data.objects.get(p)
    if obj:
        obj.hide_set(False)
        obj.hide_viewport = False
        parts_to_merge.append(obj)

if parts_to_merge:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts_to_merge:
        obj.select_set(True)
    
    bpy.context.view_layer.objects.active = parts_to_merge[0]
    bpy.ops.object.join()
    
    lara = parts_to_merge[0]
    lara.name = "Lara"
    
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0001)
    bpy.ops.object.mode_set(mode='OBJECT')

mapping = {
    "pelvis": "DEF-spine",
    "spine lower": "DEF-spine.001",
    "spine upper": "DEF-spine.003",
    "head neck lower": "DEF-spine.005",
    "head neck upper": "DEF-spine.006",
}

for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and not obj.name.startswith("WGT"):
        for old_name, new_name in mapping.items():
            vg = obj.vertex_groups.get(old_name)
            if vg:
                vg.name = new_name
                
        for vg in obj.vertex_groups:
            if "hair ponytail" in vg.name and not vg.name.startswith("DEF-"):
                vg.name = "DEF-" + vg.name

for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and not obj.name.startswith("WGT"):
        xps = bpy.data.collections.get("xps")
        if xps and obj.name not in xps.objects:
            xps.objects.link(obj)
            try:
                bpy.context.scene.collection.objects.unlink(obj)
            except:
                pass
                
        if rig:
            obj.parent = rig
            obj.matrix_parent_inverse = rig.matrix_world.inverted()
            
            for mod in reversed(obj.modifiers):
                if mod.type == 'ARMATURE':
                    obj.modifiers.remove(mod)
                    
            mod = obj.modifiers.new("Armature", 'ARMATURE')
            mod.object = rig

meta = bpy.data.objects.get("metarig")
if meta:
    bpy.data.objects.remove(meta)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
