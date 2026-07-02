import json

with open("/tmp/victory_test.gltf", "r") as f:
    v = json.load(f)
with open("/tmp/woman_solo_test.gltf", "r") as f:
    w = json.load(f)

print("Victory animations count:", len(v.get("animations", [])))
if v.get("animations"):
    print("Victory channels count:", len(v["animations"][0].get("channels", [])))

print("Woman-solo animations count:", len(w.get("animations", [])))
for idx, anim in enumerate(w.get("animations", [])):
    channels = anim.get("channels", [])
    print(f"Animation #{idx} '{anim.get('name')}' channels count: {len(channels)}")
    nodes_seen = set()
    for ch in channels[:10]:
        node_idx = ch["target"]["node"]
        node_name = w["nodes"][node_idx]["name"]
        nodes_seen.add(node_name)
    print(f"  First few node targets: {list(nodes_seen)}")
