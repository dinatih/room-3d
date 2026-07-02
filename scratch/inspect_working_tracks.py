import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/glb-animations/victory.glb")
print("\nVictory Action F-Curves:")
for act in bpy.data.actions:
    print("Action name:", act.name)
    # Print the animation tracks that will be exported in gltf
# Let's see how they are exported by exporting to a temporary file and printing its JSON tracks!
import json
import os

bpy.ops.export_scene.gltf(filepath="/tmp/victory_test.gltf", export_format='GLTF_SEPARATE')
with open("/tmp/victory_test.gltf", "r") as f:
    data = json.load(f)

print("\nTRACKS IN GLTF:")
if "animations" in data:
    for anim in data["animations"]:
        for channel in anim["channels"]:
            target = channel["target"]
            # find node name
            node_idx = target["node"]
            node_name = data["nodes"][node_idx]["name"]
            print(f"Node: {node_name}, Path: {target['path']}")
