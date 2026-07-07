import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend")

rig = bpy.data.objects.get("metarig")
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='OBJECT')

# 1. Join core body parts into one mesh
core_parts = [
    "5_Arms_1.0_0_0", "5_Body_1.0_0_0", "5_Boots_1.0_0_0", 
    "5_Face_1.0_0_0", "5_Fingers_1.0_0_0", "5_Gloves_1.0_0_0", 
    "5_Shirt_1.0_0_0", "5_Shorts_1.0_0_0", "5_Eyes_1.0_0_0",
    "7_Eye2_1.0_0_0", "7_Lashes_1.0_0_0"
]

bpy.ops.object.select_all(action='DESELECT')
active_mesh = None
for p in core_parts:
    obj = bpy.data.objects.get(p)
    if obj:
        obj.select_set(True)
        active_mesh = obj

if active_mesh:
    bpy.context.view_layer.objects.active = active_mesh
    bpy.ops.object.join()
    active_mesh.name = "Lara"
    
    # Merge by distance
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.001)
    bpy.ops.object.mode_set(mode='OBJECT')

# 2. Generate Rig
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = rig
bpy.ops.pose.rigify_generate()

new_rig = bpy.data.objects.get("rig")
rig.hide_viewport = True
rig.hide_render = True

# Clean visibility
if hasattr(new_rig.data, 'collections'):
    for coll in new_rig.data.collections:
        if coll.name in ["DEF", "ORG", "MCH", "Root"]:
            coll.is_visible = False
        if "Tweak" in coll.name:
            coll.is_visible = False

def unexclude_all(lc):
    if "WGTS" in lc.name:
        lc.exclude = False
    for child in lc.children:
        unexclude_all(child)

unexclude_all(bpy.context.view_layer.layer_collection)

# 3. Parent meshes
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
for m in meshes:
    bpy.ops.object.select_all(action='DESELECT')
    m.select_set(True)
    new_rig.select_set(True)
    bpy.context.view_layer.objects.active = new_rig
    
    # Only use auto weights for the merged Lara body!
    # For accessories, just do empty groups or let it fail, 
    # but to avoid heat failure on accessories, we just assign manually!
    
    if m.name == "Lara":
        try:
            bpy.ops.object.parent_set(type='ARMATURE_AUTO')
            print("Auto weights succeeded for Lara.")
        except Exception as e:
            print(f"Auto weights FAILED for Lara: {e}")
            m.parent = new_rig
            mod = m.modifiers.new("Armature", 'ARMATURE')
            mod.object = new_rig
    else:
        m.parent = new_rig
        mod = m.modifiers.new("Armature", 'ARMATURE')
        mod.object = new_rig
        
        # Link accessories to bones properly
        for vg in m.vertex_groups:
            if vg.name == 'spine upper':
                vg.name = 'DEF-spine.003'
            elif vg.name == 'DEF-weapon right':
                vg.name = 'DEF-hand.R'
            elif vg.name == 'DEF-weapon left':
                vg.name = 'DEF-hand.L'
            elif vg.name == 'head':
                vg.name = 'DEF-head'

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
