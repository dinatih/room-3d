import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const brainPath = '/home/dinatih/.gemini/antigravity-cli/brain/582799ab-2b09-47bb-a03d-1f3bc69e494f';

const docFilename = 'lara_structural_comparison.md';
const docPathLocal = path.join(basePath, docFilename);
const docPathBrain = path.join(brainPath, docFilename);

let content = fs.readFileSync(docPathLocal, 'utf8');

// 1. Update Rig Group 7 table row in the Markdown content
const oldRow = '| **Groupe 7** | `lara_croft_black_tank_top`, `lara_croft_4259` | 91 | Noms d\'os propres sans suffixes numériques | `pelvis`, `arm left elbow`, `root hips` |';
const newRow = '| **Groupe 7** | `lara_croft_black_tank_top`, `lara_croft_4259`, `lara_croft_3254_rigged` | 91-97 | Noms d\'os propres sans suffixes numériques | `pelvis`, `arm left elbow`, `root hips` |';

if (content.includes(oldRow)) {
  content = content.replace(oldRow, newRow);
  console.log('Updated Rig Group 7 table row.');
} else {
  // Try case-insensitive or slight whitespace variation fallback if needed
  const fallbackRegex = /\| \*\*Groupe 7\*\* \| `lara_croft_black_tank_top`, `lara_croft_4259` \| 91 \|.*/;
  if (fallbackRegex.test(content)) {
    content = content.replace(fallbackRegex, newRow);
    console.log('Updated Rig Group 7 table row (regex fallback).');
  }
}

// 2. Append the detailed section for Lara 3254 Rigged
const lara3254Section = `
## 6. Nouveau Modèle Ajouté : Lara 3254 Rigged

Un nouveau modèle provenant du fichier \`lara-croft-3254-rigged.zip\` a été extrait et converti :
* **ID** : \`lara_croft_3254_rigged\`
* **Fichier GLB produit** : \`public/media/all_lara/lara_croft_3254_rigged.glb\`
* **Analyse du Rig (Groupe de Rig 7)** :
  * **Nombre d'os** : 97.
  * **Convention de nommage** : Noms propres sans suffixes d'indexation ni préfixe Mixamo (ex: \`pelvis\`, \`arm left elbow\`, \`weapon left\`). Il s'agit d'une variante étendue du squelette à 91 os (Groupe 7), incluant des os supplémentaires pour la poitrine (\`breast left/right base\`) et des ancrages d'armes (\`weapon left/right\`).
* **Analyse des Meshes** :
  * 1 seul \`SkinnedMesh\` d'origine (\`24_+Grenades|1.Grenade.002_1.0_0_0\`) divisé en **32 primitives géométriques** distinctes au runtime.
* **Process de Standardisation pour 3254 Rigged** :
  * Grâce à l'absence d'indexation numérique sur ses os, sa structure est extrêmement proche de celle du Master Rig (Groupe 7). Il n'a besoin que d'une pose T de référence dans Blender avant l'exportation pour être pleinement interopérable.
`;

content = `${content}\n\n${lara3254Section}`;

// 3. Write back to files
fs.writeFileSync(docPathLocal, content, 'utf8');
fs.writeFileSync(docPathBrain, content, 'utf8');

console.log('Documentation updated successfully in both paths.');
