import json
import struct

with open('/home/dinatih/Projects/room-3d/public/models/test_metarig_anims/idle.glb', 'rb') as f:
    magic = f.read(4)
    version = struct.unpack('<I', f.read(4))[0]
    length = struct.unpack('<I', f.read(4))[0]
    
    chunk_len = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    json_data = f.read(chunk_len).decode('utf-8')
    
    bin_chunk_len = struct.unpack('<I', f.read(4))[0]
    bin_chunk_type = f.read(4)
    bin_data = f.read(bin_chunk_len)
    
gltf = json.loads(json_data)

def print_track_first_frame(node_id, path):
    for anim in gltf.get('animations', []):
        for channel in anim.get('channels', []):
            if channel['target'].get('node') == node_id and channel['target']['path'] == path:
                sampler = anim['samplers'][channel['sampler']]
                output_acc = gltf['accessors'][sampler['output']]
                buffer_view = gltf['bufferViews'][output_acc['bufferView']]
                
                offset = buffer_view.get('byteOffset', 0) + output_acc.get('byteOffset', 0)
                # Read 4 floats for quaternion
                q = struct.unpack_from('<ffff', bin_data, offset)
                print(f"Node {node_id} {path} first frame: {q}")
                return

hips_id = None
for i, n in enumerate(gltf.get('nodes', [])):
    if n.get('name') == 'mixamorig:Hips':
        hips_id = i
        break

if hips_id is not None:
    print_track_first_frame(hips_id, 'rotation')
