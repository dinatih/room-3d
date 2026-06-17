import bpy
from mathutils import Vector

INPUT_GLB = "public/media/glb/lara_mixamo.glb"
OUTPUT_GLB = "public/media/glb/lara_perfect.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=INPUT_GLB)
    
    # Simple export, no complex transform to avoid breaking skinning.
    # Just scale the armature by 100 in object mode, but DON'T apply it.
    # Actually, Three.js handles scale. We don't even need to scale it in Blender!
    # The user just wants a "perfect" version. What was "perfect" about it?
    # "Modèle optimisé Blender avec Ground Point."
    # If the user wants the origin at the feet, we can just move the armature object UP by the min Z.
    
    armature = None
    for o in bpy.context.scene.objects:
        if o.type == 'ARMATURE':
            armature = o
            break
            
    if not armature: return

    min_z = 9999.0
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            for v in o.bound_box:
                z = (o.matrix_world @ Vector(v)).z
                if z < min_z: min_z = z

    # To put feet at Z=0, shift armature by -min_z
    armature.location.z -= min_z
    
    # Center X and Y based on Hips
    hips = armature.data.bones.get('mixamorig:Hips')
    if hips:
        pivot = armature.matrix_world @ hips.head_local
        armature.location.x -= pivot.x
        armature.location.y -= pivot.y

    # We DO NOT apply the location. We just leave the object translation.
    # GLTF export will bake the object translation into the root node.
    
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_rest_position_armature=True,
    )

if __name__ == "__main__":
    main()
