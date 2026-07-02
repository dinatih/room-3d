import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';

function processGLB(filePath) {
  const glb = fs.readFileSync(filePath);
  
  // Read header
  const magic = glb.readUInt32LE(0);
  const version = glb.readUInt32LE(4);
  const totalLength = glb.readUInt32LE(8);
  
  if (magic !== 0x46546C67) {
    throw new Error('Not a GLB file');
  }
  
  const chunks = [];
  let offset = 12;
  
  while (offset < glb.length) {
    const chunkLength = glb.readUInt32LE(offset);
    const chunkType = glb.readUInt32LE(offset + 4);
    const chunkData = glb.subarray(offset + 8, offset + 8 + chunkLength);
    chunks.push({ length: chunkLength, type: chunkType, data: chunkData });
    offset += 8 + chunkLength;
  }
  
  // Chunk 0 must be JSON
  if (chunks[0].type !== 0x4E4F534A) {
    throw new Error('First chunk is not JSON');
  }
  
  const json = JSON.parse(chunks[0].data.toString('utf8'));
  
  let modified = false;
  const renamedMeshIndices = new Set();
  const oldToNewNames = {};
  
  if (json.meshes) {
    json.meshes.forEach((mesh, idx) => {
      const oldName = mesh.name || '';
      const nameLower = oldName.toLowerCase();
      let newName = null;
      
      // Left handgun: must contain 'handgun left' or 'hhl2' and not holster
      if ((nameLower.includes('handgun left') || nameLower.includes('hhl2')) && !nameLower.includes('holster')) {
        newName = 'handgun_left';
      }
      // Right handgun: must contain 'handgun right' or 'hhr2' and not holster
      else if ((nameLower.includes('handgun right') || nameLower.includes('hhr2')) && !nameLower.includes('holster')) {
        newName = 'handgun_right';
      }
      // MP5: must contain 'mp5' and not ammo/hammo/holster
      else if (nameLower.includes('mp5') && !nameLower.includes('ammo') && !nameLower.includes('holster')) {
        newName = 'mp5';
      }
      // MP5 Ammo: must contain 'mp5' and 'ammo' and not holster
      else if (nameLower.includes('mp5') && nameLower.includes('ammo') && !nameLower.includes('holster')) {
        newName = 'mp5_ammo';
      }
      
      if (newName) {
        mesh.name = newName;
        renamedMeshIndices.add(idx);
        oldToNewNames[oldName] = newName;
        modified = true;
        console.log(`    Rename mesh [${idx}]: "${oldName}" -> "${newName}"`);
      }
    });
  }
  
  if (json.nodes) {
    json.nodes.forEach((node, idx) => {
      const oldName = node.name || '';
      // If node points to renamed mesh index
      if (node.mesh !== undefined && renamedMeshIndices.has(node.mesh)) {
        const newName = json.meshes[node.mesh].name;
        node.name = newName;
        modified = true;
        console.log(`    Rename node [${idx}] pointing to mesh: "${oldName}" -> "${newName}"`);
      } else {
        // Fallback exact matching
        for (const [oldMeshName, newMeshName] of Object.entries(oldToNewNames)) {
          if (oldName === oldMeshName) {
            node.name = newMeshName;
            modified = true;
            console.log(`    Rename node [${idx}] by exact match: "${oldName}" -> "${newMeshName}"`);
            break;
          }
        }
      }
    });
  }
  
  if (!modified) {
    return null;
  }
  
  // Re-serialize JSON
  let jsonStr = JSON.stringify(json);
  // Pad with spaces to 4-byte boundary
  while (Buffer.byteLength(jsonStr, 'utf8') % 4 !== 0) {
    jsonStr += ' ';
  }
  
  const newJsonBuffer = Buffer.from(jsonStr, 'utf8');
  chunks[0].data = newJsonBuffer;
  chunks[0].length = newJsonBuffer.length;
  
  // Re-calculate total size of GLB
  let newTotalLength = 12;
  chunks.forEach(c => {
    newTotalLength += 8 + c.length;
  });
  
  // Build new buffer
  const outBuffer = Buffer.alloc(newTotalLength);
  outBuffer.writeUInt32LE(0x46546C67, 0); // magic
  outBuffer.writeUInt32LE(2, 4); // version
  outBuffer.writeUInt32LE(newTotalLength, 8); // total length
  
  let outOffset = 12;
  chunks.forEach(c => {
    outBuffer.writeUInt32LE(c.length, outOffset);
    outBuffer.writeUInt32LE(c.type, outOffset + 4);
    c.data.copy(outBuffer, outOffset + 8);
    outOffset += 8 + c.length;
  });
  
  return outBuffer;
}

const files = fs.readdirSync(allLaraDir)
  .filter(f => f.endsWith('.glb'))
  .sort();

console.log('Starting GLB weapon meshes renaming...');
files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  try {
    const result = processGLB(filePath);
    if (result) {
      fs.writeFileSync(filePath, result);
      console.log(`[SUCCESS] Processed and saved: ${file}\n`);
    } else {
      console.log(`[SKIPPED] No matches in: ${file}\n`);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to process ${file}:`, err.message, '\n');
  }
});

console.log('Renaming process finished!');
