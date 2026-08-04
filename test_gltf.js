const fs = require('fs');
const path = require('path');
const data = fs.readFileSync('public/media/glb/wig_mannequin.glb');
// very naive check for material names, glTF chunk
const str = data.toString('utf8');
const matches = str.match(/"name":"[^"]+"/g);
if (matches) {
  const names = [...new Set(matches)];
  console.log(names);
}
