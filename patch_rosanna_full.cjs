const fs = require('fs');

let allLara = fs.readFileSync('/home/dinatih/Projects/room-3d/all_lara_style.html', 'utf8');

// 1. Extract BONE_SYNONYMS down to the end of retargetMixamoClip
const startPos = allLara.indexOf('// Bone mapping dictionary between Mixamo and Lara 2026 Native');
const endPos = allLara.indexOf('function playAnimationOnModel');
let extractedCode = allLara.substring(startPos, endPos);

// Rename retargetMixamoClip to retargetForRosanna in the extracted code
extractedCode = extractedCode.replace('function retargetMixamoClip', 'function retargetForRosanna');

// Let's remove the previous `retargetForRosanna` that I injected last time, if it's there
let metarig = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');

// find the injected retargetForRosanna
const startPrevInject = metarig.indexOf('function retargetForRosanna');
if (startPrevInject !== -1) {
    const endPrevInject = metarig.indexOf('function retargetMixamoClip(animGltf, targetInstance)');
    // remove the old one
    metarig = metarig.substring(0, startPrevInject) + metarig.substring(endPrevInject);
}

// 2. Inject the FULL extractedCode before retargetMixamoClip
const injectPos = metarig.indexOf('function retargetMixamoClip(animGltf, targetInstance) {');
metarig = metarig.slice(0, injectPos) + extractedCode + '\n    ' + metarig.slice(injectPos);

fs.writeFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', metarig);
console.log("Patched test_metarig.html with full Rosanna retargeting dependencies!");
