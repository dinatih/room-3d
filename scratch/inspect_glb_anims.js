import fs from 'fs';

const filePath = 'public/media/all_lara/xbot_studio.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const jsonBuffer = glb.subarray(20, 20 + jsonLength);
const json = JSON.parse(jsonBuffer.toString('utf8'));

if (json.animations) {
  console.log(`Found ${json.animations.length} animations in ${filePath}:`);
  json.animations.forEach((anim, idx) => {
    console.log(`  [${idx}]: "${anim.name}" (tracks: ${anim.channels ? anim.channels.length : 0})`);
  });
} else {
  console.log(`No animations found in ${filePath}`);
}
