const fs = require('fs');
const content = fs.readFileSync('node_modules/three/examples/jsm/utils/SkeletonUtils.js', 'utf8');
const cloneFunc = content.split('function clone( source ) {')[1].split('}')[0];
console.log(cloneFunc);
