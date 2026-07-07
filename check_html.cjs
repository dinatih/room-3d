const fs = require('fs');
const html = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new Function(scriptMatch[1]);
    console.log("Syntax is OK!");
  } catch(e) {
    console.log("Syntax ERROR:", e);
  }
}
