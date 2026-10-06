import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AnimationAction, AnimationMixer, Box3, Group, LoopOnce, LoopRepeat,
  Mesh, MeshLambertMaterial, MeshStandardMaterial, OrthographicCamera, SkinnedMesh, Vector3,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const SHIBA_PATH = '/characters/ushiro/shiba_inu_dog_ushiro.glb';
const DOG_HEIGHT = 40; // cm, comme le chien de l'appartement.
const RUN_SPEED = 120; // cm/s.
const ANIMATION_FADE = 0.2;

type Movement = 'run' | 'jump' | 'circle' | 'sit';

function RunningShiba({ countdownStarted }: { countdownStarted: boolean }) {
  const gltf = useGLTF(SHIBA_PATH);
  const model = useMemo(() => {
    const instance = clone(gltf.scene);
    instance.traverse(object => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      // SkeletonUtils partage les matériaux : isoler le rendu du mini-canevas.
      // Le pelage ne doit pas reprendre la brillance métallique du GLB.
      const matte = (material: MeshStandardMaterial) => new MeshLambertMaterial({
        map: material.map,
        color: material.color,
        side: material.side,
        alphaTest: material.alphaTest,
        transparent: material.transparent,
        opacity: material.opacity,
      });
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(material => matte(material as MeshStandardMaterial))
        : matte(mesh.material as MeshStandardMaterial);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
    });
    return instance;
  }, [gltf.scene]);
  const clips = useMemo(() => {
    const find = (name: string) => {
      const clip = gltf.animations.find(animation => animation.name.toLowerCase().includes(name));
      if (!clip || clip.duration <= 0) throw new Error(`Animation du shiba invalide : ${name}`);
      return clip;
    };
    return { run: find('run'), jump: find('jump'), sit: find('sitdown') };
  }, [gltf.animations]);
  const runner = useRef<Group>(null);
  const activeAction = useRef<AnimationAction | null>(null);
  const movement = useRef<Movement>('run');
  const direction = useRef(1);
  const elapsed = useRef(0);
  const nextTrick = useRef(0);
  const runSpeed = useRef(RUN_SPEED);
  const startPositionChosen = useRef(false);
  const circle = useRef({ x: 0, z: 0, angle: 0, remaining: 0, radius: 0, direction: 1 });
  const horizontalLimit = useRef(0);
  const { camera, size } = useThree();
  const envelope = useMemo(() => ({ radius: 0, minY: 0, height: 0, sitTime: 0 }), []);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);

  useLayoutEffect(() => {
    model.scale.setScalar(1);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model, true);
    const rawSize = box.getSize(new Vector3());
    if (rawSize.y <= 0) throw new Error('La hauteur du modèle du shiba est invalide.');
    model.scale.setScalar(DOG_HEIGHT / rawSize.y);
    // Cadrage fixe couvrant les trois animations, y compris toute la hauteur du saut.
    const bounds = new Box3();
    const pelvis = model.getObjectByName('Dogger_pelvis_j');
    if (!pelvis) throw new Error('Le squelette du shiba ne contient pas de bassin.');
    const pelvisPosition = new Vector3();
    let seatedPelvis = Infinity;
    for (const clip of Object.values(clips)) {
      mixer.stopAllAction();
      mixer.clipAction(clip).reset().play();
      const samples = Math.ceil(clip.duration * 30);
      for (let frame = 0; frame <= samples; frame++) {
        mixer.setTime(frame * clip.duration / samples);
        model.updateMatrixWorld(true);
        model.traverse(object => {
          const mesh = object as SkinnedMesh;
          if (mesh.isSkinnedMesh) mesh.skeleton.update();
        });
        box.setFromObject(model, true);
        bounds.union(box);
        // SitDown contient aussi le relevé : garder le bassin au plus près du sol.
        pelvis.getWorldPosition(pelvisPosition);
        if (clip === clips.sit && pelvisPosition.y < seatedPelvis) {
          seatedPelvis = pelvisPosition.y;
          envelope.sitTime = frame * clip.duration / samples;
        }
      }
    }
    const center = bounds.getCenter(new Vector3());
    model.position.set(-center.x, 0, -center.z);
    envelope.radius = Math.hypot((bounds.max.x - bounds.min.x) / 2, (bounds.max.z - bounds.min.z) / 2);
    envelope.minY = bounds.min.y;
    envelope.height = bounds.max.y - bounds.min.y;
    mixer.stopAllAction();
    mixer.setTime(0);
    activeAction.current = null;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      model.traverse(object => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => material.dispose());
      });
    };
  }, [model, mixer, clips, envelope]);

  useLayoutEffect(() => {
    movement.current = countdownStarted ? 'sit' : 'run';
    elapsed.current = 0;
    // Tirage indépendant du téléchargement, avec des attentes parfois longues.
    nextTrick.current = clips.run.duration * -Math.log(1 - Math.random()) * 2;
    if (!countdownStarted) {
      direction.current = Math.random() < 0.5 ? -1 : 1;
      runSpeed.current = RUN_SPEED * (0.6 + Math.random() * 0.65);
    }
    const action = mixer.clipAction(countdownStarted ? clips.sit : clips.run);
    action.reset().setLoop(countdownStarted ? LoopOnce : LoopRepeat, countdownStarted ? 1 : Infinity);
    action.clampWhenFinished = countdownStarted;
    if (!countdownStarted) {
      action.time = Math.random() * clips.run.duration;
      action.setEffectiveTimeScale(runSpeed.current / RUN_SPEED);
    }
    action.fadeIn(ANIMATION_FADE).play();
    activeAction.current?.fadeOut(ANIMATION_FADE);
    activeAction.current = action;
  }, [countdownStarted, clips, mixer]);

  useLayoutEffect(() => {
    const ortho = camera as OrthographicCamera;
    ortho.zoom = Math.min(size.height / (envelope.height + DOG_HEIGHT / 2), size.width / (envelope.radius * 2 + DOG_HEIGHT / 2));
    ortho.updateProjectionMatrix();
    horizontalLimit.current = Math.max(0, size.width / ortho.zoom / 2 - envelope.radius - DOG_HEIGHT / 4);
    if (runner.current) {
      runner.current.position.y = -envelope.minY - envelope.height / 2;
      if (!startPositionChosen.current) {
        runner.current.position.x = (Math.random() * 2 - 1) * horizontalLimit.current;
        startPositionChosen.current = true;
      }
    }
  }, [camera, size.width, size.height, envelope]);

  useFrame((_, delta) => {
    const group = runner.current;
    if (!group) return;
    mixer.update(delta);
    const limit = horizontalLimit.current;
    const play = (mode: 'run' | 'jump') => {
      const action = mixer.clipAction(clips[mode]);
      // Sortir d'un cercle conserve la course déjà active, sans la faire disparaître.
      if (action !== activeAction.current) {
        action.stopFading().reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
        action.setLoop(mode === 'jump' ? LoopOnce : LoopRepeat, mode === 'jump' ? 1 : Infinity);
        action.clampWhenFinished = mode === 'jump';
        action.fadeIn(ANIMATION_FADE).play();
        activeAction.current?.fadeOut(ANIMATION_FADE);
        activeAction.current = action;
      }
      movement.current = mode;
      elapsed.current = 0;
      nextTrick.current = clips.run.duration * (1 - Math.log(1 - Math.random()) * 2);
      if (mode === 'run') {
        runSpeed.current = RUN_SPEED * (0.6 + Math.random() * 0.65);
        action.setEffectiveTimeScale(runSpeed.current / RUN_SPEED);
      }
    };
    if (movement.current === 'sit') {
      const action = activeAction.current;
      if (action && !action.paused && action.time >= envelope.sitTime) {
        action.time = envelope.sitTime;
        action.paused = true;
        mixer.update(0);
      }
      // Face légèrement de trois quarts pendant le décompte, puis pose finale maintenue.
      const target = Math.PI / 6;
      const turn = Math.atan2(Math.sin(target - group.rotation.y), Math.cos(target - group.rotation.y));
      group.rotation.y += turn * (1 - Math.exp(-delta / ANIMATION_FADE));
      return;
    }
    elapsed.current += delta;
    if (movement.current === 'jump') {
      if (elapsed.current >= clips.jump.duration) play('run');
      return;
    }
    if (movement.current === 'circle') {
      const orbit = circle.current;
      const radius = Math.min(orbit.radius, limit);
      const angleDelta = radius > 0 ? runSpeed.current / radius * delta : 0;
      orbit.angle += orbit.direction * angleDelta;
      orbit.remaining -= angleDelta;
      group.position.x = orbit.x + radius * Math.cos(orbit.angle);
      group.position.z = orbit.z + radius * Math.sin(orbit.angle);
      group.rotation.y = -orbit.angle + (orbit.direction < 0 ? Math.PI : 0);
      if (orbit.remaining <= 0 || radius === 0) {
        group.position.z = 0;
        direction.current = Math.random() < 0.5 ? -1 : 1;
        play('run');
      }
    } else {
      group.rotation.y = direction.current * Math.PI / 2;
      group.position.x += direction.current * runSpeed.current * delta;
      if (group.position.x >= limit) direction.current = -1;
      else if (group.position.x <= -limit) direction.current = 1;
      if (elapsed.current >= nextTrick.current) {
        const trick = Math.floor(Math.random() * 3);
        if (trick === 0) play('jump');
        else if (trick === 1) {
          const radius = Math.min(DOG_HEIGHT / 2 * (0.5 + Math.random()), limit);
          const spinDirection = Math.random() < 0.5 ? -1 : 1;
          const angle = -group.rotation.y + (spinDirection < 0 ? Math.PI : 0);
          circle.current = {
            x: Math.max(-limit + radius, Math.min(limit - radius, group.position.x - radius * Math.cos(angle))),
            z: -radius * Math.sin(angle), angle,
            remaining: Math.PI * 2 * (0.5 + Math.random() * 1.5),
            radius, direction: spinDirection,
          };
          movement.current = 'circle';
        } else {
          direction.current *= -1;
          play('run');
        }
      }
    }
    group.position.x = Math.max(-limit, Math.min(limit, group.position.x));
  });

  return <group ref={runner} dispose={null}><primitive object={model} /></group>;
}

export function LoadingShiba({ countdownStarted = false }: { countdownStarted?: boolean }) {
  const container = document.getElementById('loading-shiba');
  if (!container) return null;
  return createPortal(
    <Canvas orthographic camera={{ position: [0, 0, 300], near: 0.1, far: 1000 }}
      dpr={1} gl={{ alpha: true, antialias: true }}>
      <hemisphereLight args={['#ffffff', '#d8d5cf', 2]} />
      <directionalLight position={[100, 150, 200]} intensity={1} />
      <Suspense fallback={null}><RunningShiba countdownStarted={countdownStarted} /></Suspense>
    </Canvas>,
    container,
  );
}
