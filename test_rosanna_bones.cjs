const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<script type="module">
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('http://localhost:5173/media/sandbox/rosanna_lara_native.glb', (gltf) => {
  let bones = [];
  gltf.scene.traverse(n => {
    if (n.isBone) bones.push(n.name);
  });
  console.log('ROSANNA BONES:', bones.join(', '));
});
</script>
</body>
</html>
`;
fs.writeFileSync('test_rosanna_bones.html', html);
