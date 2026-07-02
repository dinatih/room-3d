import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';

const weaponKeywords = [
  'gun', 'pistol', 'mp5', 'rifle', 'shotgun', 'uzi', 'weapon', 'sword', 
  'excalibur', 'hammer', 'pda', 'grapple', 'grenade', 'mag', 'harpoon'
];

function scanModel(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  const matches = [];

  if (json.meshes) {
    json.meshes.forEach((mesh, idx) => {
      const meshName = mesh.name || '';
      const nameLower = meshName.toLowerCase();
      
      const containsWeapon = weaponKeywords.some(kw => nameLower.includes(kw));
      const containsHand = nameLower.includes('hand') || nameLower.includes('wrist');
      const containsHolster = nameLower.includes('holster') || nameLower.includes('thigh') || nameLower.includes('hip');
      
      // Match active items in hands (must contain weapon/hand keyword and not be holster-stowed)
      if ((containsWeapon || containsHand) && !containsHolster) {
        let isHandActive = false;
        if (nameLower.includes('-hands') || nameLower.includes('hand') || nameLower.includes('wrist')) {
          isHandActive = true;
        } else if (nameLower.includes('weapon') || containsWeapon) {
          // If it's a general weapon mesh and doesn't specify holster, it might be in-hand active
          isHandActive = true;
        }
        
        if (isHandActive) {
          matches.push({
            index: idx,
            name: meshName
          });
        }
      }
    });
  }

  return matches;
}

const files = fs.readdirSync(allLaraDir)
  .filter(f => f.endsWith('.glb'))
  .sort();

let report = '=== ACTIVE WEAPONS & ACCESSORIES IN LARA HANDS ===\n';
files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  try {
    const matches = scanModel(filePath);
    if (matches.length > 0) {
      report += `\nModel: ${file}\n`;
      matches.forEach(m => {
        report += `  - Mesh [Index ${m.index}]: "${m.name}"\n`;
      });
    } else {
      report += `\nModel: ${file}\n  (No explicit hand weapon meshes found)\n`;
    }
  } catch (err) {
    report += `\nError reading ${file}: ${err.message}\n`;
  }
});

fs.writeFileSync('scratch/hand_meshes_clean.txt', report);
console.log('Scan complete! Saved to scratch/hand_meshes_clean.txt');
