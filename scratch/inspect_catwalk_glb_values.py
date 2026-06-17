import json
import struct

path = "public/media/sandbox/anim_catwalk_walking_not_in_place.glb"
with open(path, 'rb') as f:
    data = f.read()

jlen = struct.unpack('<I', data[12:16])[0]
js = json.loads(data[20:20+jlen])

for anim in js.get('animations', []):
    print(f"Animation: {anim.get('name')}")
    for chan in anim.get('channels', []):
        target = chan.get('target', {})
        node_idx = target.get('node')
        node_name = js['nodes'][node_idx].get('name') if node_idx is not None else ""
        path_type = target.get('path')
        if "hips" in node_name.lower() and path_type == "translation":
            sampler_idx = chan.get('sampler')
            sampler = anim['samplers'][sampler_idx]
            output_accessor_idx = sampler.get('output')
            
            acc = js['accessors'][output_accessor_idx]
            bufferView = js['bufferViews'][acc['bufferView']]
            byteOffset = bufferView.get('byteOffset', 0) + acc.get('byteOffset', 0)
            
            bin_offset = 12 + 8 + jlen + 8
            total_offset = bin_offset + byteOffset
            
            # Unpack floats directly from the data buffer
            count = acc['count']
            values = struct.unpack(f"<{count * 3}f", data[total_offset : total_offset + count * 3 * 4])
            
            print(f"Node: {node_name}, Path: {path_type}, Count: {count}")
            print("First 5 vector3 values:")
            for i in range(min(5, count)):
                idx = i * 3
                print(f"  [{values[idx]:.4f}, {values[idx+1]:.4f}, {values[idx+2]:.4f}]")
            
            print("Last 5 vector3 values:")
            for i in range(max(0, count - 5), count):
                idx = i * 3
                print(f"  [{values[idx]:.4f}, {values[idx+1]:.4f}, {values[idx+2]:.4f}]")
