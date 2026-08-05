const fs = require('fs');
const data = fs.readFileSync('public/media/hair_pack_part_2.glb');
const str = data.toString('utf8');
const match = str.match(/"nodes":\[(.*?)\]/);
const namesMatch = str.match(/"name":"([^"]+)"/g);
if (namesMatch) {
  console.log("Names:", [...new Set(namesMatch)]);
}
