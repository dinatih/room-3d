import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")

if rig:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
    
    for m in meshes:
        # Parent the object to the rig without modifying vertex groups
        m.parent = rig
        
        # Ensure there is an armature modifier pointing to this rig
        has_armature_mod = False
        for mod in m.modifiers:
            if mod.type == 'ARMATURE':
                mod.object = rig
                has_armature_mod = True
                
        if not has_armature_mod:
            mod = m.modifiers.new(name="Armature", type='ARMATURE')
            mod.object = rig
            
    print("Meshes successfully bound to rig using existing vertex groups.")
else:
    print("Rig not found.")

# Export to GLB again just in case
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
rig.select_set(True)

bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_animations=False
)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
