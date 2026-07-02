import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));

let report = '# Detailed Structural Comparison\n\n';

Object.entries(results).forEach(([id, res]) => {
  report += `## Model: ${id}\n`;
  report += `- **Bones count**: ${res.boneCount}\n`;
  report += `- **Skinned meshes count**: ${res.skinnedMeshCount}\n`;
  report += `- **Static meshes count**: ${res.meshCount}\n`;
  report += `- **Skins**: ${res.skins}\n`;
  
  report += `\n### Bones:\n`;
  if (res.bones && res.bones.length > 0) {
    report += `\`\`\`\n${res.bones.join('\n')}\n\`\`\`\n`;
  } else {
    report += `None detected\n`;
  }
  
  report += `\n### Skinned Meshes:\n`;
  if (res.skinnedMeshes && res.skinnedMeshes.length > 0) {
    report += `\`\`\`\n${res.skinnedMeshes.join('\n')}\n\`\`\`\n`;
  } else {
    report += `None detected\n`;
  }
  
  report += `\n### Static Meshes:\n`;
  if (res.meshes && res.meshes.length > 0) {
    report += `\`\`\`\n${res.meshes.join('\n')}\n\`\`\`\n`;
  } else {
    report += `None\n`;
  }
  
  report += `\n---\n\n`;
});

fs.writeFileSync(path.join(basePath, 'scratch/detailed_comparison.txt'), report);
console.log('Detailed comparison written to scratch/detailed_comparison.txt');
