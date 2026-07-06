import bpy
import sys

blend_path = '/home/dinatih/Projects/room-3d/sources_backup/lara_croft_perfect_rigify.blend'
output_path = '/home/dinatih/Projects/room-3d/public/models/lara_perfect.glb'

bpy.ops.wm.open_mainfile(filepath=blend_path)

# Delete rig and Armature, we only want metarig
for name in ['rig', 'Armature']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

metarig = bpy.data.objects.get('metarig')
if not metarig:
    print("FATAL: metarig not found")
    sys.exit(1)

# Ensure metarig is the only armature
bpy.context.view_layer.objects.active = metarig

# Rename vertex groups to remove 'DEF-' prefix so they match metarig bones
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        # Keep only one Armature modifier
        armature_mod = None
        for mod in obj.modifiers:
            if mod.type == 'ARMATURE':
                if armature_mod is None:
                    armature_mod = mod
                    mod.object = metarig
                else:
                    obj.modifiers.remove(mod)
        
        if armature_mod is None:
            armature_mod = obj.modifiers.new(name="Armature", type='ARMATURE')
            armature_mod.object = metarig
        
        # GLTF requires the mesh to be parented to the armature
        obj.parent = metarig
        
        vg_mapping = {
            'pelvis': 'spine',
            'spine lower': 'spine.001',
            'spine upper': 'spine.002',
            'head neck lower': 'spine.004',
            'head neck upper': 'spine.006'
        }

        # Rename vertex groups
        for vg in obj.vertex_groups:
            if vg.name.startswith('DEF-'):
                new_name = vg.name[4:] # remove 'DEF-'
                vg.name = new_name
            elif vg.name in vg_mapping:
                vg.name = vg_mapping[vg.name]

bpy.ops.object.mode_set(mode='OBJECT')

# Select all meshes and metarig for export
bpy.ops.object.select_all(action='DESELECT')
metarig.hide_set(False)
metarig.hide_viewport = False
metarig.select_set(True)
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and not obj.name.startswith("WGT-"):
        obj.select_set(True)

# Export
bpy.ops.export_scene.gltf(
    filepath=output_path,
    use_selection=True,
    export_format='GLB',
    export_apply=False
)

print("SUCCESS_EXPORT_METARIG")
