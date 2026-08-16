const fs = require('fs');

const originalCode = fs.readFileSync('src/features/scene/Walker.tsx', 'utf-8');

let singleCharacterCode = originalCode;
singleCharacterCode = singleCharacterCode.replace(/function InternalWalker[\s\S]*/, '');
singleCharacterCode = singleCharacterCode.replace('interface SingleCharacterProps', 'export interface SingleCharacterProps');
singleCharacterCode = singleCharacterCode.replace('function SingleCharacter', 'export function SingleCharacter');
singleCharacterCode = singleCharacterCode.replace('interface WalkerProps', 'export interface WalkerProps');
fs.writeFileSync('src/features/scene/SingleCharacter.tsx', singleCharacterCode);

let walkerCode = originalCode;
const match = originalCode.match(/interface WalkerProps[\s\S]*?(?=function GroundPoint\(\))/);
let walkerPropsContent = '';
if (match) {
  walkerPropsContent = match[0].replace('interface WalkerProps', 'export interface WalkerProps');
}
const toRemove = originalCode.match(/function GroundPoint\(\) \{[\s\S]*?(?=function InternalWalker\(props: WalkerProps\))/);
if (toRemove && match) {
  walkerCode = walkerCode.replace(match[0], walkerPropsContent);
  walkerCode = walkerCode.replace(toRemove[0], '');
}

walkerCode = walkerCode.replace("import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';", 
"import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';\nimport { SingleCharacter } from './SingleCharacter';");

fs.writeFileSync('src/features/scene/Walker.tsx', walkerCode);
console.log('SingleCharacter extracted');
