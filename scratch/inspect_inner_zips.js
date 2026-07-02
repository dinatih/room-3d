import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dirPath = '/home/dinatih/3D Resources/humans/lara_croft';
const files = fs.readdirSync(dirPath);

console.log(`=== Finding FBX names in nested ZIPs ===`);
files.forEach(file => {
  if (file.startsWith('lara-croft') && file.endsWith('.zip')) {
    const filePath = path.join(dirPath, file);
    try {
      // Find the nested zip in source/
      const listOutput = execSync(`unzip -l "${filePath}"`).toString('utf8');
      const lines = listOutput.split('\n');
      const innerZipLine = lines.find(l => l.includes('source/') && l.endsWith('.zip'));
      
      if (innerZipLine) {
        const innerZipPath = innerZipLine.trim().split(/\s+/).pop();
        // Extract the inner zip to a temp dir and list its contents
        const tempDir = `/tmp/lara_inspect_${path.basename(file, '.zip')}`;
        execSync(`rm -rf "${tempDir}" && mkdir -p "${tempDir}"`);
        execSync(`unzip -p "${filePath}" "${innerZipPath}" > "${tempDir}/inner.zip"`);
        const innerContents = execSync(`unzip -l "${tempDir}/inner.zip"`).toString('utf8');
        const fbxFiles = innerContents.split('\n').filter(l => l.toLowerCase().includes('.fbx')).map(l => l.trim().split(/\s+/).pop());
        console.log(`Parent: ${file} | Inner Zip: ${innerZipPath} | FBX:`, fbxFiles);
        execSync(`rm -rf "${tempDir}"`);
      } else {
        console.log(`Parent: ${file} | No inner zip found in source/`);
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
});
