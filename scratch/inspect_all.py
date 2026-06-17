import bpy
import os

LARA_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect_v2.glb"
XBOT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/x_bot.glb"
WALK_GLB = "/home/dinatih/Projects/room-3d/public/media/glb-animations/happy_walk.glb"

def inspect(path, label):
    print(f"\n--- INSPECTING {label} ({path}) ---")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if path.endswith(".fbx"): bpy.ops.import_scene.fbx(filepath=path)
    else: bpy.ops.import_scene.gltf(filepath=path)
    
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if arm:
        print(f"Armature Name: {arm.name}")
        bones = [b.name for b in arm.data.bones]
        print(f"First 10 Bones: {bones[:10]}")
    
    for action in bpy.data.actions:
        print(f"Action: {action.name}")
        tracks = set()
        for fc in action.fcurves:
            # data_path is like 'pose.bones["mixamorig:Hips"].location'
            parts = fc.data_path.split('"')
            if len(parts) > 1: tracks.add(parts[1])
        print(f"Track targets (bones): {sorted(list(tracks))[:10]}")

def main():
    inspect(LARA_GLB, "LARA GLB")
    inspect(XBOT_GLB, "XBOT GLB")
    inspect(WALK_GLB, "WALK ANIM")

if __name__ == "__main__":
    main()
