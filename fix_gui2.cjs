const fs = require('fs');
let code = fs.readFileSync('test_metarig.html', 'utf-8');
code = code.replace(/frame: 0/, 'frame: 0, ortho: true');
fs.writeFileSync('test_metarig.html', code);
