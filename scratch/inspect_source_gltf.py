import json
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/tmp_anim_extract/PT74TBFLIU63A25FS9ZSIUKJV.glb")

bpy.ops.export_scene.gltf(filepath="/tmp/pt_source.gltf", export_format='GLTF_SEPARATE')
with open("/tmp/pt_source.gltf", "r") as f:
    data = json.load(f)

print("Source Animations:")
for idx, anim in enumerate(data.get("animations", [])):
    print(f"Anim #{idx}: name={anim.get('name')}, channels={len(anim.get('channels', []))}")
    sampler = anim["samplers"][0]
    inputAccessor = data["accessors"][sampler["input"]]
    print(f"  Sampler 0 Time count={inputAccessor.get('count')}, min={inputAccessor.get('min')}, max={inputAccessor.get('max')}")
