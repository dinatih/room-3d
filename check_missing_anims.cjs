const fs = require('fs');

const html = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');
const regex = /\{ name: '.*?', url: '\.\/models\/test_metarig_anims\/(.*?\.glb)' \}/g;
let match;
const expectedFiles = [];
while ((match = regex.exec(html)) !== null) {
  expectedFiles.push(match[1]);
}

const actualFiles = fs.readdirSync('/home/dinatih/Projects/room-3d/public/models/test_metarig_anims');
const missing = expectedFiles.filter(f => !actualFiles.includes(f));
console.log("Missing files:", missing.length);
missing.forEach(f => console.log(f));
