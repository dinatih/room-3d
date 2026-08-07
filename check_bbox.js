const fs = require('fs');
const buf = fs.readFileSync('public/media/sandbox/kin-fine-camera.glb');
// The GLB is binary. The first 12 bytes are the header, then chunks.
// It's easier to just use three.js in node.
