import json
import struct

def main():
    glb_path = "public/media/sandbox/lara_native.glb"
    with open(glb_path, 'rb') as f:
        data = f.read()
    
    magic = data[0:4]
    version = struct.unpack('<I', data[4:8])[0]
    total_len = struct.unpack('<I', data[8:12])[0]
    
    if magic != b'glTF':
        print("Not a glTF file")
        return
        
    json_len = struct.unpack('<I', data[12:16])[0]
    json_format = struct.unpack('<I', data[16:20])[0]
    json_chunk = data[20:20+json_len]
    
    js = json.loads(json_chunk)
    
    # 1. Print all images and their names
    images = js.get('images', [])
    print("--- IMAGES ---")
    for idx, img in enumerate(images):
        print(f"Image {idx}: name={img.get('name')}, uri={img.get('uri')}")
        
    # 2. Print all textures
    textures = js.get('textures', [])
    print("\n--- TEXTURES ---")
    for idx, tex in enumerate(textures):
        print(f"Texture {idx}: source={tex.get('source')}")
        
    # 3. Print all materials and their baseColorTexture index
    materials = js.get('materials', [])
    print("\n--- MATERIALS ---")
    for idx, mat in enumerate(materials):
        pbr = mat.get('pbrMetallicRoughness', {})
        base_tex = pbr.get('baseColorTexture', {}).get('index')
        tex_name = "None"
        if base_tex is not None and base_tex < len(textures):
            src_idx = textures[base_tex].get('source')
            if src_idx is not None and src_idx < len(images):
                tex_name = images[src_idx].get('name')
        print(f"Material {idx} ({mat.get('name')}): baseColorTexture={base_tex} (Image name: {tex_name})")

    # 4. Print all meshes, their primitives, and materials
    meshes = js.get('meshes', [])
    print("\n--- MESHES ---")
    for idx, mesh in enumerate(meshes):
        print(f"Mesh {idx} ({mesh.get('name')}):")
        for p_idx, prim in enumerate(mesh.get('primitives', [])):
            mat_idx = prim.get('material')
            mat_name = "None"
            if mat_idx is not None and mat_idx < len(materials):
                mat_name = materials[mat_idx].get('name')
            print(f"  Primitive {p_idx}: material={mat_idx} ({mat_name})")

if __name__ == "__main__":
    main()
