import fs from 'fs';

const filePath = 'public/media/all_lara/lara_croft_red_dress.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));

console.log(`=== Materials in Red Dress GLB ===`);
if (json.materials) {
  json.materials.forEach((mat, mIdx) => {
    console.log(`\nMaterial [${mIdx}] "${mat.name}":`);
    console.log(`  pbrMetallicRoughness:`, JSON.stringify(mat.pbrMetallicRoughness, null, 2));
    if (mat.normalTexture) console.log(`  normalTexture:`, mat.normalTexture);
    if (mat.occlusionTexture) console.log(`  occlusionTexture:`, mat.occlusionTexture);
    if (mat.emissiveTexture) console.log(`  emissiveTexture:`, mat.emissiveTexture);
    if (mat.emissiveFactor) console.log(`  emissiveFactor:`, mat.emissiveFactor);
  });
}
