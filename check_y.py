import json
import struct

def check_joint_y(path, joint):
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
            
            if joint in node_name and path_type == 'translation':
                sampler_idx = chan.get('sampler')
                sampler = anim['samplers'][sampler_idx]
                output_idx = sampler.get('output')
                accessor = js['accessors'][output_idx]
                bv_idx = accessor.get('bufferView')
                bv = js['bufferViews'][bv_idx]
                off = bv.get('byteOffset', 0) + accessor.get('byteOffset', 0)
                count = accessor['count']
                f_data = data[bin_start + off : bin_start + off + count * 12]
                v = struct.unpack('<' + 'f' * (count * 3), f_data)
                print(f"Track {node_name}.{path_type} (Y values):")
                print(f"  Start Y: {v[1]:.4f}")
                print(f"  Max Y:   {max(v[1::3]):.4f}")

if __name__ == "__main__":
    check_joint_y("public/media/sandbox/anim_walking.glb", "_rootJoint")
    check_joint_y("public/media/sandbox/anim_walking.glb", "Hips")
