import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dirPath = '/home/dinatih/3D Resources/humans/lara_croft';
const files = fs.readdirSync(dirPath);

console.log(`=== Inspecting ZIP contents in ${dirPath} ===`);
files.forEach(file => {
  if (file.endsWith('.zip')) {
    const filePath = path.join(dirPath, file);
    try {
      // List contents of zip (only first 5 lines for brevity)
      const listOutput = execSync(`unzip -l "${filePath}" | head -n 12`).toString('utf8');
      console.log(`\nZIP File: ${file}`);
      console.log(listOutput);
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
});
