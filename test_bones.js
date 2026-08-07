import fs from 'fs';
const buf = fs.readFileSync('public/media/hair_pack_part_2.glb');
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const chunkLength = view.getUint32(12, true);
const jsonStr = Buffer.from(buf.buffer, buf.byteOffset + 20, chunkLength).toString('utf8');
const json = JSON.parse(jsonStr);

const armNode = json.nodes.find(n => n.name === 'Hair101_ARM_75');
const armIndex = json.nodes.indexOf(armNode);

let foundBone = false;
function checkBonesInHierarchy(idx, path) {
  const n = json.nodes[idx];
  // check if this node is used as a joint in any skin
  let isJoint = false;
  if (json.skins) {
    json.skins.forEach(skin => {
      if (skin.joints && skin.joints.includes(idx)) {
        isJoint = true;
      }
    });
  }
  if (isJoint) {
    console.log('Bone found at path:', path.join(' -> '));
    foundBone = true;
  }
  if (n.children) {
    n.children.forEach(c => {
      checkBonesInHierarchy(c, [...path, json.nodes[c].name]);
    });
  }
}
checkBonesInHierarchy(armIndex, [armNode.name]);
if (!foundBone) {
  console.log('NO BONES FOUND INSIDE Hair101_ARM_75!!!');
}
