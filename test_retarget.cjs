const fs = require('fs');
const code = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');
const allCode = fs.readFileSync('/home/dinatih/Projects/room-3d/all_lara_style.html', 'utf8');

const t = code.split('function retargetForRosanna(rawClip, targetInstance, animScene) {')[1].split('function getMixamoAnimBones')[0];
const a = allCode.split('function retargetMixamoClip(rawClip, targetInstance, animScene) {')[1].split('const ANIMATION_FILES')[0];

console.log('test_metarig retargetForRosanna length:', t.length);
console.log('all_lara retargetMixamoClip length:', a.length);

if (t.includes('isClavicle')) console.log('test_metarig has isClavicle');
if (a.includes('isClavicle')) console.log('all_lara has isClavicle');

// compare them line by line
const tLines = t.split('\n').map(l => l.trim()).filter(l => l);
const aLines = a.split('\n').map(l => l.trim()).filter(l => l);

console.log('tLines:', tLines.length, 'aLines:', aLines.length);

