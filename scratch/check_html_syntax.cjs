const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.resolve(__dirname, '../all_lara_style.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract content between <script type="module"> and </script>
const scriptRegex = /<script\s+type="module">([\s\S]*?)<\/script>/i;
const match = htmlContent.match(scriptRegex);

if (match && match[1]) {
  let jsCode = match[1];
  // Replace ES imports with comments so vm.Script (which expects scripts, not modules) doesn't choke on them
  jsCode = jsCode.replace(/^\s*import\s+[\s\S]*?;/gm, '// import ...');
  jsCode = jsCode.replace(/^\s*import\s+[\s\S]*?from\s+['"].*?['"];/gm, '// import ...');
  
  try {
    new vm.Script(jsCode, { filename: 'all_lara_style.html' });
    console.log('JavaScript syntax is CORRECT!');
  } catch (err) {
    console.error('Syntax error found:');
    console.error(err.message);
    console.error(err.stack);
  }
} else {
  console.error('Could not find script tag in HTML content.');
}
