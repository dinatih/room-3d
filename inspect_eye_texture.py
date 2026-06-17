import json
import struct

GLB_PATH = "public/media/sandbox/lara_native.glb"

def main():
    with open(GLB_PATH, 'rb') as f:
        data = f.read()
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    
    # Textures using image 7 (8003)
    tex_indices = [i for i, t in enumerate(js.get('textures', [])) if t.get('source') == 7]
    print(f"Textures using 8003: {tex_indices}")
    
    # Materials using these textures
    for i, mat in enumerate(js.get('materials', [])):
        pbr = mat.get('pbrMetallicRoughness', {})
        base_tex = pbr.get('baseColorTexture', {}).get('index')
        if base_tex in tex_indices:
            print(f"Material {i} ({mat.get('name')}): baseColorTexture = {base_tex}")

if __name__ == "__main__":
    main()
