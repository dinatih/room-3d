import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dirPath = '/home/dinatih/3D Resources/humans/lara_croft';
const files = fs.readdirSync(dirPath);

console.log(`=== Inspecting Lara Croft ZIP files ===`);
files.forEach(file => {
  if (file.startsWith('lara-croft') && file.endsWith('.zip')) {
    const filePath = path.join(dirPath, file);
    try {
      const listOutput = execSync(`unzip -l "${filePath}"`).toString('utf8');
      const lines = listOutput.split('\n');
      const fbxLines = lines.filter(l => l.toLowerCase().includes('.fbx'));
      const allFiles = lines.map(l => l.trim().split(/\s+/).pop()).filter(Boolean).filter(f => !f.endsWith('/'));

      console.log(`\nZIP: ${file}`);
      console.log(`FBX files:`, fbxLines.map(l => l.trim()));
      console.log(`Top 5 files in zip:`, allFiles.slice(0, 5));
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
});
