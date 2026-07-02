import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';

function listAllMeshes(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  const meshNames = [];
  if (json.meshes) {
    json.meshes.forEach((m, idx) => {
      meshNames.push(`Mesh [${idx}]: name="${m.name || 'Unnamed'}"`);
    });
  }
  
  const nodeNames = [];
  json.nodes.forEach((n, idx) => {
    if (n.mesh !== undefined) {
      nodeNames.push(`Node [${idx}]: name="${n.name || 'Unnamed'}", meshIndex=${n.mesh}`);
    }
  });

  return { meshNames, nodeNames };
}

const files = fs.readdirSync(allLaraDir)
  .filter(f => f.endsWith('.glb'))
  .sort();

files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  try {
    const { meshNames, nodeNames } = listAllMeshes(filePath);
    console.log(`\n=== File: ${file} ===`);
    console.log('  Meshes:');
    meshNames.forEach(m => console.log(`    ${m}`));
    console.log('  Nodes referencing meshes:');
    nodeNames.forEach(n => console.log(`    ${n}`));
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
