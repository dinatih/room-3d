import fs from 'fs';

const info = JSON.parse(fs.readFileSync('scratch/all_mesh_info.json', 'utf8'));

const targets = [
  'grenade',
  'pda',
  'holster',
  'hgun',
  'handgun'
];

console.log("=== SCANNING FOR PDA, GRENADES, HOLSTERS ===");

for (const [model, meshes] of Object.entries(info)) {
  console.log(`\nModel: ${model}`);
  let foundAny = false;
  meshes.forEach(m => {
    const nameLower = m.name.toLowerCase();
    const matsLower = m.materials.map(mat => mat.toLowerCase());
    
    const matchedTargets = [];
    targets.forEach(t => {
      if (nameLower.includes(t) || matsLower.some(mat => mat.includes(t))) {
        matchedTargets.push(t);
      }
    });
    
    if (matchedTargets.length > 0) {
      console.log(`  - Mesh: "${m.name}" | Materials: ${JSON.stringify(m.materials)} | Matched: ${matchedTargets.join(', ')}`);
      foundAny = true;
    }
  });
  if (!foundAny) {
    console.log("  (None found)");
  }
}
