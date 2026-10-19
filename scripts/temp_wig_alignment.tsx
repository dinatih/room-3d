import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import { MannequinHead, LaraWigBust } from '../src/features/scene/items/MannequinHead';
import * as THREE from 'three';
import { WIGS_ITEMS } from '../src/features/inventory/inventoryData';
function Inspect() {
 const { scene, camera } = useThree();
 React.useEffect(() => {
  camera.layers.enableAll();
  (window as any).setView = (side: boolean) => {
   camera.position.set(side ? 190 : 0, 100, side ? 0 : 210);
   camera.lookAt(0, 25, 0);
  };
  (window as any).inspectWigs = () => {
   scene.updateMatrixWorld(true);
   const result: any[] = [];
   scene.traverse(o => {
    if (!o.userData.isWigRoot || o.parent?.name !== "lara_custom_hair_attachment") return;
    const meshes: THREE.SkinnedMesh[] = [];
    o.traverse(c => { if ((c as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(c as THREE.SkinnedMesh); });
    const head = meshes[0].skeleton.bones.find(b => /^(bip_head|head)/i.test(b.name))!;
    const local = o.parent!.worldToLocal(head.getWorldPosition(new THREE.Vector3()));
    const forward = new THREE.Vector3(0, 0, 1).transformDirection(head.matrixWorld)
      .transformDirection(o.parent!.matrixWorld.clone().invert());
    const box = new THREE.Box3().setFromObject(o, true);
    const materials = meshes.flatMap(mesh => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((mat: any) => ({ alphaHash: mat.alphaHash, alphaTest: mat.alphaTest, transparent: mat.transparent, sourceTransparent: (Array.isArray(mesh.userData.__baseWigMaterial) ? mesh.userData.__baseWigMaterial : [mesh.userData.__baseWigMaterial]).some((base: any) => base.transparent) })));
    result.push({ materials, forward: forward.toArray(), path: o.children[0].userData.gltfPath, scale: o.scale.toArray(), pos: o.position.toArray(), parentPos: o.parent!.position.toArray(), head: local.toArray(), size: box.getSize(new THREE.Vector3()).toArray(), fixed: meshes[0].skeleton.bones.filter(b => /^(bip_head|head_00|hairAll)/i.test(b.name)).map(b => b.quaternion.toArray()) });
   });
   return result;
  };
 }, [scene, camera]);
 return null;
}
function App() {
 const [wind, setWind] = React.useState(false);
 const [selected, setSelected] = React.useState(["hair_104", "hair_105"]);
 (window as any).setSelected = setSelected;
 (window as any).wigs = WIGS_ITEMS.map(w => ({id:w.id, path:w.glbPath}));
 (window as any).setWind = setWind;
 return <Canvas camera={{ position: [100, 65, 170], near: 0.1, far: 1000, fov: 40 }} onCreated={({ camera }) => camera.lookAt(0, 25, 0)} style={{ width: '1200px', height: '800px' }}>
  <color attach="background" args={['#777777']} /><ambientLight intensity={2} /><directionalLight position={[0,100,100]} intensity={3} />
  <Inspect /><Suspense fallback={null}>
   {selected.map((id, i) => <group key={id} position={[(i - 0.5) * 65,0,0]}>
    <group position={[-14,0,0]}><MannequinHead mannequinId={id} wigId={id} windEnabled={wind} /></group>
    <group position={[14,0,0]}><LaraWigBust wigId={id} windEnabled={wind} /></group>
   </group>)}
  </Suspense>
 </Canvas>;
}
createRoot(document.getElementById('root')!).render(<App />);
