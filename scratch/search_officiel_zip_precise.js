import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dirPath = '/home/dinatih/3D Resources/humans/lara_croft';
const files = fs.readdirSync(dirPath);

console.log(`=== Searching precisely for lara_original_88_bones textures ===`);
const targets = ['8003', '8516', '8001', '8018', '8016'];

files.forEach(file => {
  if (file.endsWith('.zip')) {
    const filePath = path.join(dirPath, file);
    try {
      const listOutput = execSync(`unzip -l "${filePath}"`).toString('utf8');
      const lines = listOutput.split('\n');
      const filenames = lines.map(l => l.trim().split(/\s+/).pop()).filter(Boolean);
      
      const match = filenames.some(f => {
        const base = path.basename(f, path.extname(f));
        return targets.includes(base);
      });
      
      if (match) {
        console.log(`Found matching texture in ZIP: ${file}`);
      }
    } catch (err) {
      // Ignore
    }
  }
});
