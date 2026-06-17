import json
import struct

def check_hips_full(path):
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    bin_start = 20 + jlen + 8
    
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
                
                count = accessor['count']
                f_data = data[bin_start + off : bin_start + off + count * 12]
                values = struct.unpack('<' + 'f' * (count * 3), f_data)
                
                print(f"Hips Translation Track for {node_name} ({count} keys):")
                v = list(values)
                print(f"  Start: {v[0:3]}")
                print(f"  End:   {v[-3:]}")
                
                xs = v[0::3]
                ys = v[1::3]
                zs = v[2::3]
                print(f"  Range X: [{min(xs):.3f}, {max(xs):.3f}] delta: {max(xs)-min(xs):.3f}")
                print(f"  Range Y: [{min(ys):.3f}, {max(ys):.3f}] delta: {max(ys)-min(ys):.3f}")
                print(f"  Range Z: [{min(zs):.3f}, {max(zs):.3f}] delta: {max(zs)-min(zs):.3f}")

if __name__ == "__main__":
    check_hips_full("public/media/sandbox/anim_walking.glb")
