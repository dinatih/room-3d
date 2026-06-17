import json
import struct

def main():
    glb_path = "public/media/sandbox/lara_native.glb"
    with open(glb_path, 'rb') as f:
        data = f.read()
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    
    mat_idx = 18 # 5_Shirt_1.0_0_0
    mat = js['materials'][mat_idx]
    pbr = mat.get('pbrMetallicRoughness', {})
    base_tex = pbr.get('baseColorTexture', {}).get('index')
    if base_tex is not None:
        tex = js['textures'][base_tex]
        source = tex.get('source')
        print(f"Le matériau 5_Shirt_1.0_0_0 utilise la texture index {base_tex}, image source index {source}")
        image = js['images'][source]
        print(f"Nom de l'image source : {image.get('name')} / uri : {image.get('uri')}")

if __name__ == "__main__":
    main()
