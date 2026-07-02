import fs from 'fs';
import path from 'path';

function inspectGlbTextures(glbPath) {
  if (!fs.existsSync(glbPath)) {
    console.log(`GLB file not found: ${glbPath}`);
    return [];
  }
  const glb = fs.readFileSync(glbPath);
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  
  const names = [];
  if (json.images) {
    json.images.forEach((img, idx) => {
      names.push(img.name || `Image_${idx}`);
    });
  }
  return names;
}

const allLaraDir = 'public/media/all_lara';
console.log(`lara_original_88_bones.glb textures:`, inspectGlbTextures(path.join(allLaraDir, 'lara_original_88_bones.glb')));
console.log(`lara_croft_zip.glb textures:`, inspectGlbTextures(path.join(allLaraDir, 'lara_croft_zip.glb')));
