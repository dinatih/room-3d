import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const brainPath = '/home/dinatih/.gemini/antigravity-cli/brain/582799ab-2b09-47bb-a03d-1f3bc69e494f';

// 1. Read original content from transcript_full.jsonl at line 626 (index 626)
const fullLogPath = path.join(brainPath, '.system_generated/logs/transcript_full.jsonl');
const lines = fs.readFileSync(fullLogPath, 'utf8').split('\n');
const lineObj = JSON.parse(lines[626]);
const originalContent = lineObj.tool_calls[0].args.CodeContent;

// 2. Read the current Blender process content
const currentPath = path.join(basePath, 'lara_structural_comparison.md');
const blenderProcessContent = fs.readFileSync(currentPath, 'utf8');

// 3. Define the update for the new Lara 543i model
const lara543iSection = `
## 5. Nouveau Modèle Ajouté : Lara 543i (FBX converti en GLB)

Un nouveau modèle provenant du fichier \`lara-croft-543i.zip\` a été extrait et converti :
* **ID** : \`lara_croft_543i\`
* **Fichier GLB produit** : \`public/media/all_lara/lara_croft_543i.glb\`
* **Analyse du Rig (Groupe de Rig 10)** :
  * **Nombre d'os** : 63 (Squelette le plus léger et simplifié de tous les modèles).
  * **Convention de nommage** : Tout en **MAJUSCULES** (ex: \`Root\`, \`HIP\`, \`NECK\`, \`HEAD\`, \`SHLDER_L\`, \`FORARM_L\`, \`PONY1_DYNAMIC\`).
* **Analyse des Meshes** :
  * 1 seul \`SkinnedMesh\` d'origine (\`40_lara.material01_1_0_0\`) qui se divise en **12 primitives géométriques** distinctes au chargement par Three.js.
* **Process de Standardisation pour 543i** :
  * En raison de son squelette en MAJUSCULES de 63 os, l'animation directe ou le partage de vêtement nécessite de renommer les os dans Blender (ex: \`SHLDER_L\` -> \`arm left shoulder\`) et d'appliquer la T-pose du squelette de référence avant l'exportation.
`;

// 4. Merge everything
const mergedReport = `${originalContent}

---

${blenderProcessContent}

---

${lara543iSection}`;

// 5. Write to both target file locations
fs.writeFileSync(currentPath, mergedReport, 'utf8');
fs.writeFileSync(path.join(brainPath, 'lara_structural_comparison.md'), mergedReport, 'utf8');

console.log('Merged report successfully written to:');
console.log(`- ${currentPath}`);
console.log(`- ${path.join(brainPath, 'lara_structural_comparison.md')}`);
