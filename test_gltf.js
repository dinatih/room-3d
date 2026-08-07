const fs = require('fs');
const content = fs.readFileSync('public/media/hair_pack_part_2.glb');
const view = new DataView(content.buffer, content.byteOffset, content.byteLength);
const chunkLength = view.getUint32(12, true);
const jsonStr = Buffer.from(content.buffer, content.byteOffset + 20, chunkLength).toString('utf8');
const json = JSON.parse(jsonStr);

// Find Hair101_ARM_75
const armNode = json.nodes.find(n => n.name === 'Hair101_ARM_75');
console.log('ArmNode:', armNode);
const armIndex = json.nodes.indexOf(armNode);
console.log('ArmIndex:', armIndex);
