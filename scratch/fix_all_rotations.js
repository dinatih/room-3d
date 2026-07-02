import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const models = [
  'lara_croft_324_rigged.glb',
  'lara_croft_43254_rigged.glb',
  'lara_croft_4543.glb',
  'lara_croft_motorcycle_gear.glb',
  'lara_croft_spy_gear.glb',
  'lara_croft_suit.glb',
  'lara_croft_brown_jacket.glb',
  'lara_croft_swim_gear.glb',
  'lara_croft_swim_gear_1.glb',
  'lara_croft_dress_345.glb',
  'lara_croft_red_dress.glb',
  'lara_croft_swim_gear_243.glb',
  'lara_croft_black_tank_top.glb',
  'lara_croft_4259.glb',
  'lara_croft_3254_rigged.glb',
  'lara_croft_gold_shades.glb',
  'lara_original_88_bones.glb',
  'lara_croft_zip.glb',
  'lara_croft_543i.glb',
  'xbot_studio.glb'
];

const allLaraDir = 'public/media/all_lara';

models.forEach(modelFile => {
  const destPath = path.join(allLaraDir, modelFile);
  console.log(`\n===========================================`);
  console.log(`RESTORING TRANSFORMS FOR: ${modelFile}`);
  console.log(`===========================================`);

  try {
    // 1. Get original GLB from git HEAD (which has upright versions)
    const origGLB = execSync(`git show HEAD:public/media/all_lara/${modelFile}`, { maxBuffer: 50 * 1024 * 1024 });
    const origLength = origGLB.readUInt32LE(12);
    const origJSON = JSON.parse(origGLB.subarray(20, 20 + origLength).toString('utf8'));

    // 2. Read re-exported GLB
    const reexpGLB = fs.readFileSync(destPath);
    const reexpLength = reexpGLB.readUInt32LE(12);
    const reexpJSON = JSON.parse(reexpGLB.subarray(20, 20 + reexpLength).toString('utf8'));

    // 3. Map original node names to their transforms
    const origMap = {};
    origJSON.nodes.forEach(node => {
      if (node.name) {
        origMap[node.name] = {
          translation: node.translation,
          rotation: node.rotation,
          scale: node.scale,
          matrix: node.matrix
        };
      }
    });

    // 4. Overwrite matching node transforms in re-exported JSON
    let restoreCount = 0;
    reexpJSON.nodes.forEach(node => {
      if (node.name && origMap[node.name]) {
        const orig = origMap[node.name];
        
        // Reset properties to match original exactly
        if (orig.translation !== undefined) node.translation = orig.translation;
        else delete node.translation;
        
        if (orig.rotation !== undefined) node.rotation = orig.rotation;
        else delete node.rotation;
        
        if (orig.scale !== undefined) node.scale = orig.scale;
        else delete node.scale;
        
        if (orig.matrix !== undefined) node.matrix = orig.matrix;
        else delete node.matrix;
        
        restoreCount++;
      }
    });

    console.log(`  Restored transforms for ${restoreCount} nodes.`);

    // 5. Serialize JSON back
    let newJsonStr = JSON.stringify(reexpJSON);
    let newJsonLength = Buffer.byteLength(newJsonStr, 'utf8');
    const remainder = newJsonLength % 4;
    if (remainder !== 0) {
      newJsonStr += ' '.repeat(4 - remainder);
      newJsonLength = Buffer.byteLength(newJsonStr, 'utf8');
    }

    const newJsonBuffer = Buffer.from(newJsonStr, 'utf8');

    // Compute total file length
    const oldChunk0Length = reexpLength;
    const oldTotalLength = reexpGLB.readUInt32LE(8);
    const lengthDiff = newJsonLength - oldChunk0Length;
    const newTotalLength = oldTotalLength + lengthDiff;

    // Create new GLB buffer
    const headerBuffer = Buffer.alloc(12);
    headerBuffer.writeUInt32LE(0x46546C67, 0); // magic
    headerBuffer.writeUInt32LE(2, 4); // version
    headerBuffer.writeUInt32LE(newTotalLength, 8);

    const chunk0Header = Buffer.alloc(8);
    chunk0Header.writeUInt32LE(newJsonLength, 0);
    chunk0Header.writeUInt32LE(0x4E4F534A, 4); // JSON type

    const chunk1Start = 20 + oldChunk0Length;
    const chunk1Buffer = reexpGLB.subarray(chunk1Start);

    const finalGLB = Buffer.concat([
      headerBuffer,
      chunk0Header,
      newJsonBuffer,
      chunk1Buffer
    ]);

    fs.writeFileSync(destPath, finalGLB);
    console.log(`[SUCCESS] Restored transforms and updated ${modelFile} successfully!`);

  } catch (err) {
    console.error(`Error fixing transforms for ${modelFile}:`, err.message);
  }
});
