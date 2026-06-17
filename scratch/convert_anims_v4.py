import bpy
import os

ANIM_SRC = "/home/dinatih/Projects/room-3d/sources_backup/animations"
OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_animation(fbx_path, name):
    clean_scene()
    print(f"--- Exporting: {name} ---")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not arm: return

    # Bake the animation to ensure Hips has location keyframes
    # We select all bones and bake action
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    
    # Bake: 0 to end frame
    end_frame = bpy.context.scene.frame_end
    bpy.ops.nla.bake(frame_start=1, frame_end=end_frame, visual_keying=True, clear_constraints=True, use_current_action=True, bake_types={'POSE'})
    
    arm.name = "mixamo_armature"
    
    out_path = os.path.join(OUT_DIR, f"anim_{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_animations=True,
        export_yup=True,
        export_apply=True
    )

if __name__ == "__main__":
    if not os.path.exists(OUT_DIR): os.makedirs(OUT_DIR)
    # Re-export key anims with bake
    export_animation(os.path.join(ANIM_SRC, "Walking.fbx"), "walking")
    export_animation(os.path.join(ANIM_SRC, "Happy Walk.fbx"), "happy_walk")
