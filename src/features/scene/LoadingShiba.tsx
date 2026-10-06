import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Box3, Group, LoopRepeat, OrthographicCamera, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const SHIBA_PATH = '/characters/ushiro/shiba_inu_dog_ushiro.glb';
const DOG_HEIGHT = 40; // Même échelle que le chien de l'appartement, en cm.
const RUN_SPEED = 120; // cm/s, comme sa course dans l'appartement.

function RunningShiba() {
  const gltf = useGLTF(SHIBA_PATH);
  const model = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const runner = useRef<Group>(null);
  const direction = useRef(1);
  const { camera, size } = useThree();
  const bounds = useMemo(() => new Box3(), []);
  const poseBounds = useMemo(() => new Box3(), []);
  const modelSize = useMemo(() => new Vector3(), []);
  const center = useMemo(() => new Vector3(), []);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);

  useLayoutEffect(() => {
    const clip = gltf.animations.find(animation => /run/i.test(animation.name));
    if (!clip) throw new Error('Le modèle du shiba ne contient pas d’animation de course.');
    model.scale.setScalar(1);
    model.updateMatrixWorld(true);
    bounds.setFromObject(model).getSize(modelSize);
    if (modelSize.y <= 0) throw new Error('La hauteur du modèle du shiba est invalide.');
    model.scale.setScalar(DOG_HEIGHT / modelSize.y);
    model.rotation.y = Math.PI / 2;
    const action = mixer.clipAction(clip).setLoop(LoopRepeat, Infinity).reset().play();
    // Enveloppe de la course échantillonnée à 30 images/s pour un cadrage fixe.
    bounds.makeEmpty();
    const samples = Math.ceil(clip.duration * 30);
    for (let frame = 0; frame <= samples; frame++) {
      mixer.setTime(frame * clip.duration / samples);
      model.updateMatrixWorld(true);
      bounds.union(poseBounds.setFromObject(model, true));
    }
    bounds.getSize(modelSize);
    bounds.getCenter(center);
    action.reset();
    mixer.setTime(0);
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    };
  }, [gltf.animations, model, mixer, bounds, poseBounds, modelSize, center]);

  useFrame((_, delta) => {
    if (!runner.current) return;
    mixer.update(delta);
    model.rotation.y = direction.current * Math.PI / 2;
    model.position.set(-center.x * direction.current, -center.y, -center.z * direction.current);

    const ortho = camera as OrthographicCamera;
    // Une marge d'une demi-hauteur du chien autour de sa silhouette.
    ortho.zoom = Math.min(size.height / (modelSize.y + DOG_HEIGHT / 2), size.width / (modelSize.x + DOG_HEIGHT / 2));
    ortho.updateProjectionMatrix();
    const limit = Math.max(0, (size.width / ortho.zoom - modelSize.x) / 2 - DOG_HEIGHT / 4);
    const nextX = runner.current.position.x + direction.current * RUN_SPEED * delta;
    runner.current.position.x = Math.max(-limit, Math.min(limit, nextX));
    if (nextX >= limit) direction.current = -1;
    else if (nextX <= -limit) direction.current = 1;
  });

  return <group ref={runner} dispose={null}><primitive object={model} /></group>;
}

export function LoadingShiba() {
  const container = document.getElementById('loading-shiba');
  if (!container) return null;
  return createPortal(
    <Canvas orthographic camera={{ position: [0, 0, 300], near: 0.1, far: 1000 }}
      dpr={1} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[100, 150, 200]} intensity={2} />
      <Suspense fallback={null}><RunningShiba /></Suspense>
    </Canvas>,
    container,
  );
}
