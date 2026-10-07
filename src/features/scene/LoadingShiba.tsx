import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  CanvasTexture, AnimationAction, AnimationMixer, Box3, Group, LoopOnce, LoopRepeat,
  Mesh, MeshLambertMaterial, MeshStandardMaterial, OrthographicCamera, SkinnedMesh, SRGBColorSpace, Vector3,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const SHIBA_PATH = '/characters/ushiro/shiba_inu_dog_ushiro.glb';
const DOG_HEIGHT = 40; // cm, comme le chien de l'appartement.
const RUN_SPEED = 120; // cm/s.
const ANIMATION_FADE = 0.2;

type Movement = 'walk' | 'run' | 'jump' | 'circle' | 'sit' | 'idle';
const WALK_SPEED = 50;
const BALL_RADIUS = 3.35; // Balle de tennis de 6,7 cm.
const TEXT_HEIGHT = 24;

function RunningShiba({ countdownStarted, countdownSeconds }: { countdownStarted: boolean; countdownSeconds: number }) {
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
    return { walk: find('walk'), run: find('run'), jump: find('jump'), sit: find('sitdown'), idle: find('idle') };
  }, [gltf.animations]);
  const runner = useRef<Group>(null);
  const ball = useRef<Mesh>(null);
  const titleMesh = useRef<Mesh>(null);
  const ballVelocity = useRef(new Vector3(60, 100, 30));
  const walkingTime = useRef(0);
  const floor = useRef(0);
  const title = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536; canvas.height = 96;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D indisponible pour le titre du chargement.');
    context.font = '900 60px system-ui, -apple-system, sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = '#b91c1c';
    // Relief discret sous les lettres, sans halo blanc autour du rouge.
    const textureScale = 60 / 13;
    context.shadowColor = 'rgba(255, 255, 255, 0.9)';
    context.shadowOffsetY = textureScale;
    context.shadowBlur = textureScale / 2;
    context.fillText('CHARGEMENT DE LA SCÈNE 3D…', 768, 48);
    context.shadowColor = 'transparent';
    context.fillText('CHARGEMENT DE LA SCÈNE 3D…', 768, 48);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useLayoutEffect(() => () => title.dispose(), [title]);
  const activeAction = useRef<AnimationAction | null>(null);
  const movement = useRef<Movement>('walk');
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
    const mode = countdownStarted ? (countdownSeconds <= 2 ? 'idle' : 'sit') : 'walk';
    if (movement.current === mode && activeAction.current) return;
    movement.current = mode;
    elapsed.current = 0;
    // Tirage indépendant du téléchargement, avec des attentes parfois longues.
    nextTrick.current = clips.run.duration * -Math.log(1 - Math.random()) * 2;
    if (!countdownStarted) {
      direction.current = Math.random() < 0.5 ? -1 : 1;
      runSpeed.current = WALK_SPEED;
    }
    const action = mixer.clipAction(clips[mode]);
    action.reset().setLoop(mode === 'sit' ? LoopOnce : LoopRepeat, mode === 'sit' ? 1 : Infinity);
    action.clampWhenFinished = mode === 'sit';
    if (!countdownStarted) {
      action.time = Math.random() * clips.walk.duration;
      action.setEffectiveTimeScale(runSpeed.current / WALK_SPEED);
    }
    action.fadeIn(ANIMATION_FADE).play();
    activeAction.current?.fadeOut(ANIMATION_FADE);
    activeAction.current = action;
  }, [countdownStarted, countdownSeconds <= 2, clips, mixer]);

  useLayoutEffect(() => {
    const ortho = camera as OrthographicCamera;
    ortho.zoom = Math.min(size.height / (envelope.height + DOG_HEIGHT / 2), size.width / (envelope.radius * 2 + DOG_HEIGHT / 2));
    ortho.updateProjectionMatrix();
    if (titleMesh.current) {
      titleMesh.current.scale.x = Math.min(TEXT_HEIGHT * 16, size.width / ortho.zoom * 0.85);
      titleMesh.current.position.y = -envelope.minY - envelope.height / 2 + TEXT_HEIGHT / 2;
    }
    horizontalLimit.current = Math.max(0, size.width / ortho.zoom / 2 - envelope.radius - DOG_HEIGHT / 4);
    if (runner.current) {
      floor.current = -envelope.minY - envelope.height / 2;
      runner.current.position.y = floor.current;
      if (ball.current) ball.current.position.set(0, floor.current + BALL_RADIUS, DOG_HEIGHT / 2);
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
    if (ball.current) {
      const position = ball.current.position;
      const velocity = ballVelocity.current;
      velocity.y -= 350 * delta;
      position.addScaledVector(velocity, delta);
      if (position.y < floor.current + BALL_RADIUS) {
        position.y = floor.current + BALL_RADIUS;
        velocity.set((Math.random() * 2 - 1) * RUN_SPEED, 80 + Math.random() * 100, (Math.random() * 2 - 1) * WALK_SPEED);
      }
      if (Math.abs(position.x) > limit) { position.x = Math.sign(position.x) * limit; velocity.x *= -1; }
      if (Math.abs(position.z) > DOG_HEIGHT) { position.z = Math.sign(position.z) * DOG_HEIGHT; velocity.z *= -1; }
    }
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
    if (movement.current === 'sit' || movement.current === 'idle') {
      const action = activeAction.current;
      if (movement.current === 'sit' && action && !action.paused && action.time >= envelope.sitTime) {
        action.time = envelope.sitTime;
        action.paused = true;
        mixer.update(0);
      }
      // Face au visiteur pendant les poses assise et idle.
      const target = 0;
      const turn = Math.atan2(Math.sin(target - group.rotation.y), Math.cos(target - group.rotation.y));
      group.rotation.y += turn * (1 - Math.exp(-delta / ANIMATION_FADE));
      return;
    }
    elapsed.current += delta;
    walkingTime.current += delta;
    if (movement.current === 'walk' && walkingTime.current >= clips.walk.duration * 3) play('run');
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
      if (movement.current !== 'walk' && elapsed.current >= nextTrick.current) {
        const trick = Math.floor(Math.random() * 3);
        if (trick === 0) {
          group.position.x = 0; group.position.z = DOG_HEIGHT / 2;
          play('jump');
        }
        else if (trick === 1) {
          const radius = Math.min(TEXT_HEIGHT * 8, limit);
          const spinDirection = Math.random() < 0.5 ? -1 : 1;
          const angle = -group.rotation.y + (spinDirection < 0 ? Math.PI : 0);
          circle.current = {
            x: 0,
            z: 0, angle,
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

  return <>
    <mesh ref={titleMesh}>
      <planeGeometry args={[1, TEXT_HEIGHT]} />
      <meshBasicMaterial map={title} transparent alphaTest={0.1} toneMapped={false} />
    </mesh>
    <mesh ref={ball}><sphereGeometry args={[BALL_RADIUS, 20, 12]} /><meshLambertMaterial color="#ef2222" /></mesh>
    <group ref={runner} dispose={null}><primitive object={model} /></group>
  </>;
}

export function LoadingShiba({ countdownStarted = false, countdownSeconds = 5 }: { countdownStarted?: boolean; countdownSeconds?: number }) {
  const container = document.getElementById('loading-shiba');
  if (!container) return null;
  return createPortal(
    <Canvas orthographic camera={{ position: [0, 0, 300], near: 0.1, far: 1000 }}
      dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <hemisphereLight args={['#ffffff', '#d8d5cf', 2]} />
      <directionalLight position={[100, 150, 200]} intensity={1} />
      <Suspense fallback={null}><RunningShiba countdownStarted={countdownStarted} countdownSeconds={countdownSeconds} /></Suspense>
    </Canvas>,
    container,
  );
}
