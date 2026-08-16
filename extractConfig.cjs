const fs = require('fs');
let code = fs.readFileSync('src/features/scene/Walker.tsx', 'utf-8');

const matchChar = code.match(/export interface CharacterConfig[\s\S]*?\];/);
const matchAcc = code.match(/const ACCESSORIES_MESH_NAMES[\s\S]*?\]\);/);

let configCode = `import { type LaraVariant } from './LaraVariants';\nimport { WALKER_ANIM_OPTIONS } from './animOptions';\n\n`;
if (matchChar) configCode += matchChar[0] + '\n\n';
if (matchAcc) configCode += matchAcc[0].replace('const ACCESSORIES_MESH_NAMES', 'export const ACCESSORIES_MESH_NAMES') + '\n';

fs.writeFileSync('src/features/scene/walkerConfig.ts', configCode);

code = code.replace(/export interface CharacterConfig[\s\S]*?\];\n\n/, '');
code = code.replace(/const ACCESSORIES_MESH_NAMES[\s\S]*?\]\);\n\n/, '');
code = code.replace("import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';", 
"import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';\nimport { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES } from './walkerConfig';");

fs.writeFileSync('src/features/scene/Walker.tsx', code);
console.log('Walker Config Extracted');
