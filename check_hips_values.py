import json
import struct

def check_hips_values(path):
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    anims = js.get('animations', [])
    for anim in anims:
        for chan in anim.get('channels', []):
            target = chan.get('target', {})
            node_idx = target.get('node')
            path_type = target.get('path')
            node_name = js['nodes'][node_idx].get('name')
            
            if 'Hips' in node_name and path_type == 'translation':
                sampler_idx = chan.get('sampler')
                sampler = anim['samplers'][sampler_idx]
                output_idx = sampler.get('output')
                accessor = js['accessors'][output_idx]
                
                bv_idx = accessor.get('bufferView')
                bv = js['bufferViews'][bv_idx]
                off = bv.get('byteOffset', 0) + accessor.get('byteOffset', 0)
                bin_start = 20 + jlen + 8
                
                count = accessor['count']
                f_data = data[bin_start + off : bin_start + off + count * 12]
                values = struct.unpack('<' + 'f' * (count * 3), f_data)
                print(f"Hips Translation Track for {node_name}:")
                print(f"  First 3: {values[0:3]}")
                print(f"  Mid 3: {values[30:33]}")
                print(f"  Max Y: {max(values[1::3])}")

if __name__ == "__main__":
    check_hips_values("public/media/sandbox/anim_walking.glb")
