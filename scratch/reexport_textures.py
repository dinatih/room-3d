import bpy
from mathutils import Vector

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath="scratch/lara_source_extracted/final_fbx/C1S1UIP9N1UQPLO2U787FMDUD.fbx")
    
    armature = None
    for o in bpy.context.scene.objects:
        if o.type == 'ARMATURE':
            armature = o
            break
            
    if not armature: return

    # 1. Scale 100x
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(100, 100, 100))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # 2. Find min Z (feet)
    min_z = 9999.0
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            for v in o.bound_box:
                z = (o.matrix_world @ Vector(v)).z
                if z < min_z: min_z = z

    # 3. Pivot Hips (X/Y)
    hips = armature.data.bones.get('mixamorig:Hips')
    # If hips not found, try without mixamorig:
    if not hips: hips = armature.data.bones.get('Hips')
    
    pivot = Vector((0,0,0))
    if hips:
        pivot = armature.matrix_world @ hips.head_local
        offset_x = -pivot.x
        offset_y = -pivot.y
    else:
        offset_x = 0
        offset_y = 0

    offset_z = -min_z

    # 4. Shift all root objects
    for o in bpy.context.scene.objects:
        if not o.parent:
            o.location.x += offset_x
            o.location.y += offset_y
            o.location.z += offset_z

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    
    # 5. Export with textures embedded
    bpy.ops.export_scene.gltf(
        filepath="public/media/glb/lara_perfect_v2.glb",
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_rest_position_armature=True,
        export_image_format='AUTO',
    )

if __name__ == "__main__":
    main()
