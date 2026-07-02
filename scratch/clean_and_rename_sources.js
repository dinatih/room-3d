import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const srcDir = '/home/dinatih/3D Resources/humans/lara_croft';
const destDir = '/home/dinatih/Projects/room-3d/sources_backup';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const mappings = [
  { zip: 'lara-croft.zip', name: '01 Bikini' },
  { zip: 'lara-croft-red-dress.zip', name: '02 Double slit dress' },
  { zip: 'lara-croft-dress-345.zip', name: '03 Dress' },
  { zip: 'lara-croft-swim-gear (1).zip', name: '04 Baywatch' },
  { zip: 'lara-croft-4259.zip', name: '05 Crop top - Shorts' },
  { zip: 'lara-croft-43254-rigged.zip', name: '06 Cap sleeve crop top - Shorts' },
  { zip: 'sources_backup/lara-croft-2026-rigged.zip', name: '07 Scoop bodysuit - Shorts' },
  { zip: 'lara-croft-3254-rigged.zip', name: '08 Crew neck bodysuit - Shorts' },
  { zip: 'lara-croft-543i.zip', name: '09 Cap sleeve biketard' },
  { zip: 'lara-croft-swim-gear.zip', name: '10 Long sleeve surfsuit' },
  { zip: 'lara-croft-black-tank-top.zip', name: '11' },
  { zip: 'lara-croft-4543.zip', name: '12 Bodysuit - Jeans' },
  { zip: 'lara-croft-spy-gear.zip', name: '13 3-4 sleeve catsuit' },
  { zip: 'lara-croft-suit.zip', name: '14 Business suit' },
  { zip: 'lara-croft-motorcycle-gear.zip', name: '15 Motorcycle' },
  { zip: 'lara-croft-brown-jacket.zip', name: '16 Jacket - Pants' },
  { zip: 'lara-croft-gold-shades-2739-rigged.zip', name: '17 Catsuit' },
  { zip: 'lara-croft-324-rigged.zip', name: '17 Catsuit (mp5)' },
  { zip: 'lara-croft-swim-gear-243.zip', name: '18 Wetsuit' }
];

console.log('=== Cleaning and renaming ZIP models ===');

mappings.forEach(m => {
  const originalZipPath = path.join(srcDir, m.zip);
  const targetZipPath = path.join(destDir, `${m.name}.zip`);
  
  if (!fs.existsSync(originalZipPath)) {
    console.error(`ERROR: Source ZIP not found: ${originalZipPath}`);
    return;
  }
  
  console.log(`Processing: ${m.zip} -> ${m.name}.zip`);
  const tempDir = `/tmp/lara_clean_${m.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  execSync(`rm -rf "${tempDir}" && mkdir -p "${tempDir}/extract" "${tempDir}/flat"`);
  
  try {
    // 1. Unzip original to extract dir
    execSync(`unzip -q "${originalZipPath}" -d "${tempDir}/extract"`);
    
    // 2. Find nested zip in source/
    const sourceDir = path.join(tempDir, 'extract/source');
    let nestedZipName = null;
    if (fs.existsSync(sourceDir)) {
      const sourceFiles = fs.readdirSync(sourceDir);
      nestedZipName = sourceFiles.find(f => f.endsWith('.zip'));
    }
    
    // 3. Unzip nested zip to flat dir, or copy blend file if it was just blend
    if (nestedZipName) {
      const nestedZipPath = path.join(sourceDir, nestedZipName);
      execSync(`unzip -q "${nestedZipPath}" -d "${tempDir}/flat"`);
    } else {
      // Sometime there's no nested zip but direct source files
      console.log(`  No nested ZIP, looking for FBX directly...`);
      const extractFiles = fs.readdirSync(tempDir + '/extract');
      // Look recursively for .fbx
      const fbxSearch = execSync(`find "${tempDir}/extract" -name "*.fbx"`).toString('utf8').trim().split('\n').filter(Boolean);
      if (fbxSearch.length > 0) {
        fbxSearch.forEach(f => {
          fs.copyFileSync(f, path.join(tempDir, 'flat', path.basename(f)));
        });
      }
    }
    
    // 4. Rename the .fbx inside flat dir to new name
    const flatFiles = fs.readdirSync(tempDir + '/flat');
    const fbxFile = flatFiles.find(f => f.toLowerCase().endsWith('.fbx'));
    if (fbxFile) {
      const oldFbxPath = path.join(tempDir, 'flat', fbxFile);
      const newFbxPath = path.join(tempDir, 'flat', `${m.name}.fbx`);
      fs.renameSync(oldFbxPath, newFbxPath);
      console.log(`  Renamed FBX: ${fbxFile} -> ${m.name}.fbx`);
    } else {
      console.warn(`  WARNING: No FBX file found in flat extract for ${m.name}`);
    }
    
    // 5. Copy textures to flat dir (placing them next to the FBX)
    const texturesDir = path.join(tempDir, 'extract/textures');
    if (fs.existsSync(texturesDir)) {
      const textFiles = fs.readdirSync(texturesDir);
      textFiles.forEach(t => {
        const srcTex = path.join(texturesDir, t);
        const destTex = path.join(tempDir, 'flat', t);
        // Avoid overwriting if it exists
        if (!fs.existsSync(destTex)) {
          fs.copyFileSync(srcTex, destTex);
        }
      });
      console.log(`  Copied ${textFiles.length} textures next to FBX`);
    }
    
    // 6. Zip everything in flat dir directly
    if (fs.existsSync(targetZipPath)) {
      fs.unlinkSync(targetZipPath);
    }
    
    execSync(`cd "${tempDir}/flat" && zip -q -r "${targetZipPath}" .`);
    console.log(`  Successfully created: ${targetZipPath}`);
    
  } catch (err) {
    console.error(`  Error processing ${m.name}:`, err.message);
  } finally {
    // Cleanup
    execSync(`rm -rf "${tempDir}"`);
  }
});

console.log('=== Done cleaning ZIP models ===');
