import bpy
import json

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/glb-animations/knee-push-up.glb")
bpy.ops.export_scene.gltf(filepath="/tmp/inspect.gltf", export_format='GLTF_SEPARATE')

with open("/tmp/inspect.gltf", "r") as f:
    data = json.load(f)

print("Animations count in exported GLB:", len(data.get("animations", [])))
for anim in data.get("animations", []):
    print(f"Animation name: {anim.get('name')}")
    channels = anim.get("channels", [])
    print(f"Channels count: {len(channels)}")
    
    counts = []
    for ch in channels:
        sampler = anim["samplers"][ch["sampler"]]
        input_acc = data["accessors"][sampler["input"]]
        counts.append(input_acc.get("count"))
    
    print(f"  Min frames in a channel: {min(counts)}")
    print(f"  Max frames in a channel: {max(counts)}")
    print(f"  Channels with > 2 frames: {len([c for c in counts if c > 2])}")

