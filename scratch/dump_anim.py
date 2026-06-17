import json
import struct
import sys

def dump_anim(path):
    print(f"--- DUMPING {path} ---")
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    nodes = js.get('nodes', [])
    accessors = js.get('accessors', [])
    
    for anim in js.get('animations', []):
        print(f"Animation: {anim.get('name')}")
        for chan in anim.get('channels', []):
            target = chan.get('target', {})
            node_idx = target.get('node')
            path = target.get('path')
            node_name = nodes[node_idx].get('name') if node_idx is not None else "NONE"
            
            sampler_idx = chan.get('sampler')
            sampler = anim.get('samplers', [])[sampler_idx]
            input_idx = sampler.get('input')
            output_idx = sampler.get('output')
            
            count = accessors[input_idx].get('count')
            print(f"  Track: {node_name}.{path} | Frames: {count}")

dump_anim(sys.argv[1])
