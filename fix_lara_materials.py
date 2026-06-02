import json
import struct
import numpy as np
import sys

# Script to force OPAQUE alphaMode on specific materials to fix the "hashed" mouth noise.
# This edits the final lara_perfect.glb directly.

GLB_PATH = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect.glb"

def load_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    if data[:4] != b'glTF':
        raise RuntimeError('Not a glTF file')
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    bin_chunk = data[20+json_len:]
    return js, bin_chunk

def save_glb(path, js, bin_chunk):
    js_bytes = json.dumps(js, separators=(',',':')).encode('utf-8')
    while len(js_bytes) % 4: js_bytes += b' '
    
    total_len = 12 + 8 + len(js_bytes) + len(bin_chunk)
    with open(path, 'wb') as f:
        f.write(b'glTF')
        f.write(struct.pack('<I', 2))
        f.write(struct.pack('<I', total_len))
        f.write(struct.pack('<I', len(js_bytes)))
        f.write(b'JSON')
        f.write(js_bytes)
        f.write(bin_chunk)

def main():
    try:
        js, bin_chunk = load_glb(GLB_PATH)
    except FileNotFoundError:
        print(f"Error: {GLB_PATH} not found.")
        return

    modified = False
    if 'materials' in js:
        for mat in js['materials']:
            name = mat.get('name', '')
            if 'Face' in name or 'Eyes' in name:
                print(f"Fixing material: {name}")
                mat['alphaMode'] = 'OPAQUE'
                if 'alphaCutoff' in mat:
                    del mat['alphaCutoff']
                modified = True
            
            # Also fix HASHED/BLEND modes that might cause issues on other parts
            elif mat.get('alphaMode') == 'HASHED':
                print(f"Changing HASHED to OPAQUE for: {name}")
                mat['alphaMode'] = 'OPAQUE'
                modified = True

    if modified:
        save_glb(GLB_PATH, js, bin_chunk)
        print("Successfully fixed materials in lara_perfect.glb")
    else:
        print("No materials needed fixing.")

if __name__ == "__main__":
    main()
