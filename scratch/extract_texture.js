import fs from 'fs';

const filePath = 'public/media/all_lara/lara_croft_red_dress.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));

const binOffset = 20 + jsonLength;
const binBuffer = glb.subarray(binOffset + 8); // Skip CHUNK header (length and type)

const mat = json.materials[11]; // "24_Dress_0.5_0_0"
const texIdx = mat.pbrMetallicRoughness.baseColorTexture.index;
const texture = json.textures[texIdx];
const imgIdx = texture.source;
const image = json.images[imgIdx];

console.log('Texture index:', texIdx);
console.log('Image index:', imgIdx);
console.log('Image details:', image);

if (image.bufferView !== undefined) {
  const bv = json.bufferViews[image.bufferView];
  console.log('BufferView details:', bv);
  const imgBuffer = binBuffer.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength);
  const outPath = `scratch/dress_texture.png`; // or jpg, let's see mimeType
  const ext = image.mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const outPathWithExt = `scratch/dress_texture.${ext}`;
  fs.writeFileSync(outPathWithExt, imgBuffer);
  console.log(`Wrote image to ${outPathWithExt}, size: ${imgBuffer.length} bytes`);
}
