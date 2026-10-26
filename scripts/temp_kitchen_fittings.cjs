const { NodeIO } = require('@gltf-transform/core');
const { Box3, Matrix4, Vector3 } = require('three');
(async () => {
  const io = new NodeIO().registerExtensions(require('@gltf-transform/extensions').ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await require('draco3d').createDecoderModule() });
  for (const [id, name] of [['annons80298474','Annons80298474'],['middagsmat60463714','Middagsmat60463714'],['rinnig30407814','Rinnig30407814'],['lillviken20317852','Lillviken20317852'],['boholmen99157501','Boholmen99157501']]) {
    const doc = await io.read(`public/items/${id}/${name}.glb`);
    const box = new Box3();
    const points = [];
    doc.getRoot().getDefaultScene().traverse(node => {
      const matrix = new Matrix4().fromArray(node.getWorldMatrix());
      for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
        if (primitive.getMode() !== 4) continue;
        const positions = primitive.getAttribute('POSITION');
        for (let i = 0; i < positions.getCount(); i++) {
          const point = new Vector3().fromArray(positions.getElement(i, [])).applyMatrix4(matrix).multiplyScalar(100);
          if (id.startsWith('boholmen')) point.applyAxisAngle(new Vector3(0,1,0), Math.PI / 2);
          box.expandByPoint(point); points.push(point);
        }
      }
    });
    console.log(name, 'bounds', box.min.toArray(), box.max.toArray(), 'size',box.getSize(new Vector3()).toArray());
    if (id.startsWith('boholmen')) {
      const bottom = points.filter(p => p.y < box.min.y + 0.2);
      console.log('Sink bottom bounds',new Box3().setFromPoints(bottom));
    }
  }
})();
