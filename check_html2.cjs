const fs = require('fs');
const html = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  let js = scriptMatch[1];
  js = js.replace(/import .*? from .*?;/g, '');
  try {
    new Function(js);
    console.log("Syntax is OK!");
  } catch(e) {
    console.log("Syntax ERROR:", e);
  }
} else {
  console.log("No script tag found.");
}
