const {it}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('three');
const bytes=fs.readFileSync('public/items/framework-laptop13/framework-laptop13.glb');
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
it('livre le laptop fusionné et nettoyé sans dépasser ses six passes matériau',()=>{
    const primitives=gltf.meshes.flatMap(mesh=>mesh.primitives);
    assert.equal(primitives.length,6);
    assert(primitives.every(p=>p.mode===undefined || p.mode===4));
    const triangles=primitives.reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0);
    assert(triangles<176678,`Le CAD précédent rendu dans l’app avait 176678 triangles ; reçu ${triangles}`);
    assert(gltf.materials.every(m=>!m.alphaMode || m.alphaMode==='OPAQUE'));
    assert(!gltf.images?.length);
});
it('intègre le rouge opaque et les deux USB-C arrière dans les positions exportées',async()=>{
    const {NodeIO}=await import('@gltf-transform/core');
    const {ALL_EXTENSIONS}=await import('@gltf-transform/extensions');
    const {default:draco}=await import('draco3d');
    const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
    const doc=await io.readBinary(bytes),red=doc.getRoot().listMaterials().find(m=>m.getName()==='Framework matte red');
    assert(red);assert.equal(red.getAlphaMode(),'OPAQUE');assert.equal(red.getBaseColorFactor()[3],1);
    assert(Math.abs(red.getRoughnessFactor()-.7)<1e-6);
    assert(Math.abs(red.getBaseColorFactor()[0]-.60382734)<1e-6);
    assert.deepEqual(red.getBaseColorFactor().slice(1,3),[0,0]);
    // Port slots measured from the CAD: x ±0.1333m, rear z -0.0844m.
    // The bezel is above the 6.8mm expansion-card housing.
    const sides=new Set();
    for(const node of doc.getRoot().listNodes())for(const primitive of node.getMesh()?.listPrimitives()??[]){
        if(primitive.getMaterial()!==red)continue;
        const position=primitive.getAttribute('POSITION'),matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix());
        for(let i=0;i<position.getCount();i++){
            const {x,y,z}=new THREE.Vector3().fromArray(position.getElement(i,[])).applyMatrix4(matrix);
            if(y>.006801 || Math.abs(x)<.1183)continue;
            assert(z>=-.0994 && z<=-.0693,`USB-C rouge hors des emplacements arrière : ${x},${y},${z}`);
            sides.add(Math.sign(x));
        }
    }
    assert.deepEqual([...sides].sort(),[-1,1]);
});
