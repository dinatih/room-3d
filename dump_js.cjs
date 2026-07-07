const fs = require('fs');
const html = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  let js = scriptMatch[1];
  js = js.replace(/import .*? from .*?;/g, '');
  fs.writeFileSync('/home/dinatih/Projects/room-3d/temp_script.js', js);
}
