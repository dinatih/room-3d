import bpy
import sys

SRC = "/tmp/lara_source/lara_base.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)
    
    o = bpy.data.objects.get("5_+Head|Glasses_1.0_0_0")
    if not o: return

    # Identify scary slots: 
    # Usually mouth interior has different material names like 'Mouth' or 'Teeth'
    # But here they are lumped into 'Eyes' or 'Face'.
    
    # Let's try to HIDE polygons in Slot 11 (Eyes) that are NOT near the actual eyes.
    # Actual eyes: Slot 22 (7_Eye2) and Slot 23 (7_Lashes) are separate?
    # Wait, Slot 11 (5_Eyes) has 5420 polys. Sample: (0.002, -0.077, 1.543).
    # Slot 22 (7_Eye2) has 680 polys. Sample: (0.002, -0.087, 1.606).
    
    # Hypothesis: Slot 11 '5_Eyes' is actually the mouth/tongue/teeth combo.
    # Let's try to vaporize Slot 11 entirely to see if it helps.
    
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    
    # Select slot 11
    o.active_material_index = 11
    bpy.ops.object.material_slot_select()
    
    # Delete selected
    bpy.ops.mesh.delete(type='FACE')
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Export for test
    bpy.ops.export_scene.gltf(
        filepath="/tmp/lara_source/lara_no_eyes_slot.glb",
        export_format='GLB'
    )
    print("Vaporized Slot 11 and exported to /tmp/lara_source/lara_no_eyes_slot.glb")

if __name__ == "__main__":
    main()
