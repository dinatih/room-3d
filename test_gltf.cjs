const fs = require('fs');
const data = fs.readFileSync('public/media/glb/wig_mannequin.glb');
const str = data.toString('utf8');
const match = str.match(/"meshes":\[(.*?)\]/);
if (match) {
  console.log(match[0].slice(0, 500));
}
