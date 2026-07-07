const fs = require('fs');
const htmlFile = '/home/dinatih/Projects/room-3d/test_metarig.html';
let html = fs.readFileSync(htmlFile, 'utf8');

const regex = /const animsToLoad = \[([\s\S]*?)\];/;
const match = html.match(regex);
if (match) {
  const actualFiles = fs.readdirSync('/home/dinatih/Projects/room-3d/public/models/test_metarig_anims');
  
  const entriesRegex = /\{ name: '(.*?)', url: '\.\/models\/test_metarig_anims\/(.*?\.glb)' \}/g;
  let newEntries = [];
  let m;
  while ((m = entriesRegex.exec(match[1])) !== null) {
    if (actualFiles.includes(m[2])) {
      newEntries.push(`          { name: '${m[1]}', url: './models/test_metarig_anims/${m[2]}' }`);
    } else {
      console.log('Removing missing:', m[2]);
    }
  }
  
  const newAnimsBlock = `const animsToLoad = [\n${newEntries.join(',\n')}\n        ];`;
  html = html.replace(match[0], newAnimsBlock);
  fs.writeFileSync(htmlFile, html);
  console.log('Patched animsToLoad successfully!');
}
