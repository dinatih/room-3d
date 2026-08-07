import { NodeIO } from '@gltf-transform/core';

async function check() {
  const io = new NodeIO();
  const doc = await io.read('public/media/wigs/wig_100.glb');
  const meshes = doc.getRoot().listMeshes();
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  meshes.forEach(m => {
    m.listPrimitives().forEach(p => {
      const pos = p.getAttribute('POSITION');
      if (pos) {
        const pMin = pos.getMinNormalized([]);
        const pMax = pos.getMaxNormalized([]);
        for(let i=0;i<3;i++){
          if(pMin[i] < min[i]) min[i] = pMin[i];
          if(pMax[i] > max[i]) max[i] = pMax[i];
        }
      }
    });
  });
  console.log("MIN:", min);
  console.log("MAX:", max);
  console.log("SIZE:", max.map((m, i) => m - min[i]));
}
check();
