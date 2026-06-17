import json
import struct
import sys

def fix_glb_grounding(filepath, target_min_y=0.0):
    with open(filepath, 'rb') as f:
        data = f.read()

    # glTF header
    magic = data[:4]
    version = struct.unpack('<I', data[4:8])[0]
    total_length = struct.unpack('<I', data[8:12])[0]
    
    # JSON chunk
    jlen = struct.unpack('<I', data[12:16])[0]
    jtype = data[16:20]
    js = json.loads(data[20:20+jlen])
    
    # BIN chunk
    blen = struct.unpack('<I', data[20+jlen:20+jlen+4])[0]
    btype = data[20+jlen+4:20+jlen+8]
    bin_data = bytearray(data[20+jlen+8:20+jlen+8+blen])
    
    # Find all POSITION accessors
    min_y = 999999
    positions = []
    
    for mesh in js.get('meshes', []):
        for prim in mesh.get('primitives', []):
            if 'POSITION' in prim['attributes']:
                acc_idx = prim['attributes']['POSITION']
                acc = js['accessors'][acc_idx]
                bv = js['bufferViews'][acc['bufferView']]
                offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
                count = acc['count']
                positions.append((offset, count))
                
                for i in range(count):
                    y = struct.unpack('<fff', bin_data[offset + i*12 : offset + i*12 + 12])[1]
                    min_y = min(min_y, y)
    
    if min_y == 999999:
        print("No positions found.")
        return

    shift = target_min_y - min_y
    print(f"Current Min Y: {min_y:.4f}. Shifting by {shift:.4f}")
    
    for offset, count in positions:
        for i in range(count):
            start = offset + i*12
            x, y, z = struct.unpack('<fff', bin_data[start : start + 12])
            new_y = y + shift
            bin_data[start : start + 12] = struct.pack('<fff', x, new_y, z)

    # Rebuild GLB
    new_bin = bytes(bin_data)
    new_jlen = len(json.dumps(js))
    # Pad JSON
    while len(json.dumps(js)) % 4 != 0: js['_'] = js.get('_', '') + ' '
    js_str = json.dumps(js).encode('utf-8')
    new_jlen = len(js_str)
    
    new_total_len = 12 + 8 + new_jlen + 8 + len(new_bin)
    
    out = magic + struct.pack('<I', version) + struct.pack('<I', new_total_len)
    out += struct.pack('<I', new_jlen) + jtype + js_str
    out += struct.pack('<I', len(new_bin)) + btype + new_bin
    
    with open(filepath, 'wb') as f:
        f.write(out)
    print("SUCCESSfully grounded.")

if __name__ == "__main__":
    fix_glb_grounding(sys.argv[1])
