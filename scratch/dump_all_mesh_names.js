import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';

function dumpMeshes(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  const meshNames = [];
  if (json.meshes) {
    json.meshes.forEach((mesh, idx) => {
      meshNames.push({ index: idx, name: mesh.name || '' });
    });
  }
  return meshNames;
}

const files = fs.readdirSync(allLaraDir)
  .filter(f => f.endsWith('.glb'))
  .sort();

let output = '';
files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  try {
    const meshes = dumpMeshes(filePath);
    output += `=== ${file} ===\n`;
    meshes.forEach(m => {
      output += `  [${m.index}]: "${m.name}"\n`;
    });
    output += '\n';
  } catch (err) {
    output += `=== ${file} ===\n  Error: ${err.message}\n\n`;
  }
});

fs.writeFileSync('scratch/all_mesh_names_raw.txt', output);
console.log('Done! Output saved to scratch/all_mesh_names_raw.txt');
