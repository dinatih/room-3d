import json
import struct

def inspect_all_tracks(path):
    print(f"\n--- {path} ---")
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    animations = js.get('animations', [])
    if not animations:
        print("No animations found!")
        return
        
    anim = animations[0]
    print(f"Animation Name: {anim.get('name')}")
    channels = anim.get('channels', [])
    
    nodes = js.get('nodes', [])
    counts = {}
    for chan in channels:
        target = chan.get('target', {})
        node_idx = target.get('node')
        path_type = target.get('path')
        node_name = nodes[node_idx].get('name') if node_idx is not None else 'None'
        
        sampler_idx = chan.get('sampler')
        sampler = anim.get('samplers', [])[sampler_idx]
        output_accessor_idx = sampler.get('output')
        accessor = js.get('accessors', [])[output_accessor_idx]
        
        counts[f"{node_name}.{path_type}"] = accessor.get('count')
        
    # Print Hips curves
    for k, v in sorted(counts.items()):
        if "Hips" in k:
            print(f"  {k}: {v} frames")

inspect_all_tracks('public/media/sandbox/anim_left_turn.glb')
inspect_all_tracks('public/media/sandbox/anim_right_turn.glb')
inspect_all_tracks('public/media/sandbox/anim_ascending_stairs.glb')
