import fs from 'fs';
import path from 'path';

const filePath = 'public/media/all_lara/lara_croft_red_dress.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));

console.log(`=== Textures and Images in Red Dress GLB ===`);
if (json.images) {
  json.images.forEach((img, idx) => {
    console.log(`Image [${idx}]: "${img.name || ''}" (uri: ${img.uri || 'embedded'})`);
  });
}

if (json.materials) {
  json.materials.forEach((mat, mIdx) => {
    if (mat.name.includes('Gear') || mat.name.includes('Accs') || mat.name.includes('Body')) {
      console.log(`\nMaterial "${mat.name}":`);
      // Find texture index
      const baseColor = mat.pbrMetallicRoughness?.baseColorTexture;
      if (baseColor !== undefined) {
        const texIdx = baseColor.index;
        const texture = json.textures[texIdx];
        const imgIdx = texture.source;
        const image = json.images[imgIdx];
        console.log(`  Uses Texture index ${texIdx} -> Image index ${imgIdx}: "${image.name || ''}"`);
      } else {
        console.log(`  No base color texture`);
      }
    }
  });
}
