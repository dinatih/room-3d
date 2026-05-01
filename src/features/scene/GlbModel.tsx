import { useMemo, useLayoutEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as THREE from 'three';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

interface Props {
  path: string;
  onSize: (size: THREE.Vector3) => void;
}

export function GlbModel({ path, onSize }: Props) {
  const gltf = useLoader(GLTFLoader, path, loader => {
    (loader as GLTFLoader).setDRACOLoader(draco);
  });

  const { obj, size } = useMemo(() => {
    const obj  = gltf.scene.clone(true);
    const box  = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    obj.position.sub(box.getCenter(new THREE.Vector3()));
    obj.position.y += size.y / 2;   // sit on Y=0
    return { obj, size };
  }, [gltf]);

  useLayoutEffect(() => { onSize(size); }, [size]);

  return <primitive object={obj} />;
}
