import bpy

INPUT_GLB = "/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_just_dont_stare_into_the_eyes.glb"
OUTPUT_GLB = "/home/dinatih/Projects/room-3d/public/media/all_lara/lara_hair.glb"

def main():
    # Reset factory settings to ensure a clean state
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import GLB
    print(f"Importing: {INPUT_GLB}")
    bpy.ops.import_scene.gltf(filepath=INPUT_GLB)
    
    print("Objects in scene after import:")
    for o in bpy.context.scene.objects:
        print(f"  - {o.name} (Type: {o.type})")
        
    # We want to keep the armature and the mesh object for Object_8
    to_delete = []
    for o in bpy.context.scene.objects:
        if 'Object_8' in o.name:
            print(f"Keeping mesh: {o.name}")
            continue
        if o.type == 'ARMATURE':
            print(f"Keeping armature: {o.name}")
            continue
        # Mark other things for deletion
        to_delete.append(o)
        
    # Delete marked objects
    bpy.ops.object.select_all(action='DESELECT')
    for o in to_delete:
        o.select_set(True)
    bpy.ops.object.delete()
    
    print("Objects remaining:")
    for o in bpy.context.scene.objects:
        print(f"  - {o.name}")
        
    # Export to new GLB
    print(f"Exporting hair to: {OUTPUT_GLB}")
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False, # no animations needed for hair
        export_rest_position_armature=True,
    )
    print("Extraction successful.")

if __name__ == "__main__":
    main()
