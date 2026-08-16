const fs = require('fs');

let code = fs.readFileSync('src/features/scene/Walker.tsx', 'utf-8');

// Supprimer CC3_TO_MIXAMO à BONE_SYNONYMS
code = code.replace(/const CC3_TO_MIXAMO[\s\S]*?\]\n};\n/, '');

// Supprimer resolveTargetFingerBoneName à retargetClip
code = code.replace(/function resolveTargetFingerBoneName[\s\S]*?new THREE\.AnimationClip\(`\$\{workingClip\.name\}_retargeted`, workingClip\.duration, tracks\);\n}\n/, '');

// Ajouter les imports
code = code.replace("import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';", 
"import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';\nimport { buildHairChain, resolveTargetBoneName, retargetClip } from './retargeting';");

fs.writeFileSync('src/features/scene/Walker.tsx', code);
console.log('Walker.tsx refactored');
