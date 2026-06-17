import json
import struct
import sys

def check_tracks(path):
    print(f"\n--- TRACKS IN {path} ---")
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    # In GLB, animations are in the JSON part
    anims = js.get('animations', [])
    for i, anim in enumerate(anims):
        print(f"Animation {i}: {anim.get('name')}")
        for j, chan in enumerate(anim.get('channels', [])):
            target = chan.get('target', {})
            node_idx = target.get('node')
            path_type = target.get('path')
            node_name = js['nodes'][node_idx].get('name') if node_idx is not None else "unknown"
            print(f"  Track {j}: {node_name}.{path_type}")

if __name__ == "__main__":
    check_tracks("public/media/sandbox/anim_walking.glb")
