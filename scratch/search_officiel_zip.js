import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dirPath = '/home/dinatih/3D Resources/humans/lara_croft';
const files = fs.readdirSync(dirPath);

console.log(`=== Searching for lara_original_88_bones textures ===`);
files.forEach(file => {
  if (file.endsWith('.zip')) {
    const filePath = path.join(dirPath, file);
    try {
      const listOutput = execSync(`unzip -l "${filePath}"`).toString('utf8');
      if (listOutput.includes('8003') || listOutput.includes('8001') || listOutput.includes('8516')) {
        console.log(`Found matching texture in ZIP: ${file}`);
      }
    } catch (err) {
      // Ignore errors
    }
  }
});
