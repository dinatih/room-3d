import json
import struct

def inspect_glb(path):
    print(f"\n--- INSPECTING {path} ---")
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    # Bones
    nodes = js.get('nodes', [])
    skin_indices = set()
    for skin in js.get('skins', []):
        skin_indices.update(skin.get('joints', []))
    
    bone_names = [nodes[i].get('name') for i in skin_indices if i < len(nodes)]
    print(f"Joint Nodes ({len(bone_names)}): {sorted(bone_names)}")
    
    # Animations
    for anim in js.get('animations', []):
        print(f"Animation: {anim.get('name')}")
        channels = anim.get('channels', [])
        targets = set()
        for chan in channels:
            target_node_idx = chan.get('target', {}).get('node')
            if target_node_idx is not None:
                targets.add(nodes[target_node_idx].get('name'))
        print(f"Track Targets ({len(targets)}): {sorted(list(targets))[:10]}")

inspect_glb('public/media/sandbox/Xbot_official.glb')
inspect_glb('public/media/sandbox/lara_native.glb')
