import fs from 'fs';
import path from 'path';

const allLaraDir = '/home/dinatih/Projects/room-3d/public/media/all_lara';
const files = fs.readdirSync(allLaraDir).filter(f => f.endsWith('.glb'));

console.log(`Found ${files.length} GLB files in ${allLaraDir}`);

files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  try {
    const glb = fs.readFileSync(filePath);
    const jsonLength = glb.readUInt32LE(12);
    const jsonBuffer = glb.subarray(20, 20 + jsonLength);
    const json = JSON.parse(jsonBuffer.toString('utf8'));

    const rootsFound = [];
    if (json.nodes) {
      json.nodes.forEach((node, idx) => {
        if (node.name && node.name.toLowerCase().includes('root')) {
          rootsFound.push(node.name);
        }
      });
    }

    if (rootsFound.length > 0) {
      console.log(`File: ${file}`);
      console.log(`  Roots: ${JSON.stringify(rootsFound)}`);
    } else {
      console.log(`File: ${file} (No 'root' bones)`);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
