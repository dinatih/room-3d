import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useGLTF, useHelper } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { isAppIdle } from '@features/scene/idleState';
import { glbLocalBBox } from '@features/scene/glbUtils';

const GLB_PATH = '/characters/robin/robin.glb';

type AIState = {
  mode: 'autonomous' | 'forced';
  state: 'idle' | 'flying';
  targetPos: THREE.Vector3;
  timer: number;
};

// Points d'intérêts dans le jardin (Z < 0) et zones AI etendues
const LANDING_POINTS = [
  new THREE.Vector3(149, 50, -231),  // Baignoire (rebord)
  new THREE.Vector3(270, 75, -110),  // ArmrestSofa (dossier)
  new THREE.Vector3(100, 75, -80),   // ArmlessSofa (dossier)
  new THREE.Vector3(40, 62, -90),    // ChestBench (dessus)
  new THREE.Vector3(100, 140, -145), // PottedPalm (feuilles)
  new THREE.Vector3(150, 150, -390), // Mur fond jardin
  new THREE.Vector3(5, 120, -200),   // Palissade bois (gauche)
  new THREE.Vector3(295, 120, -200), // Palissade bois (droite)
  // Zones AI Ouest et Est (Entrée cours et Entrée bat B)
  new THREE.Vector3(-350, 0, 1002),  // Entrée bat B (couloir ouest)
  new THREE.Vector3(-350, 0, -200),  // Entrée cours bat B (jardin ouest)
  new THREE.Vector3(650, 0, 424),    // Entrée bat B (couloir est)
  new THREE.Vector3(650, 0, -200)    // Entrée cours bat B (jardin est)
];

export function RobinBird({ isPreview = false, previewAnim = '', showSkeletonPreview = false, onSize }: { isPreview?: boolean, previewAnim?: string, showSkeletonPreview?: boolean, onSize?: (size: THREE.Vector3) => void }) {
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate } = useThree();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const isPlayingRef = useRef(false);

  const showSkeletonGlobal = useSceneStore(s => s.layers.skeleton);
  const showSkeleton = isPreview ? showSkeletonPreview : showSkeletonGlobal;
  useHelper(showSkeleton ? modelRef as any : null, THREE.SkeletonHelper);

  // IA Autonome
  const aiStateRef = useRef<AIState>({
    mode: 'autonomous',
    state: 'idle',
    targetPos: LANDING_POINTS[0].clone(),
    timer: 2.0
  });

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());

    if (size.y > 0) {
      scene.scale.setScalar(10 / size.y); // Scale to 10cm height
    } else {
      scene.scale.setScalar(1);
    }
    const scaledBox = glbLocalBBox(scene);
    scene.position.set(0, -scaledBox.min.y, 0);
    onSize?.(scaledBox.getSize(new THREE.Vector3()));

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.geometry) {
        m.geometry.computeBoundingBox();
        m.geometry.computeBoundingSphere();
        if (m.geometry.boundingSphere) {
          m.geometry.boundingSphere.radius = Math.max(m.geometry.boundingSphere.radius * 10, 50.0);
        }
      }
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = 0;
        mat.roughness = 0.8;
        mat.transparent = false;
        mat.alphaTest = 0;
        mat.depthWrite = true;
      }
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      let targetAnimName = 'Robin_Bird_Idle';
      if (isPreview && previewAnim) {
        targetAnimName = previewAnim;
      }
      const clip = animations.find(a => a.name === targetAnimName) || animations[0];
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
      isPlayingRef.current = true;
    }

    if (modelRef.current && !isPreview) {
      modelRef.current.position.copy(LANDING_POINTS[0]);
    }

    invalidate();

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
    };
  }, [scene, animations, isPreview, previewAnim, invalidate, onSize]);

  // Listener événements de l'UI (Menu Hover)
  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'robin-bird-replay') {
        // Redémarre l'IA et force l'envol
        aiStateRef.current.mode = 'autonomous';
        aiStateRef.current.state = 'idle';
        aiStateRef.current.timer = 0; // Trigger take off immediately
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [isPreview]);

  // Boucle de jeu (IA & Animation)
  useFrame((_, delta) => {
    if (isAppIdle() || !mixerRef.current || !modelRef.current) return;
    
    if (!isPreview) {
      const ai = aiStateRef.current;
      if (ai.mode === 'autonomous') {
        if (ai.state === 'idle') {
          ai.timer -= delta;
          if (ai.timer <= 0) {
            // Choose a new random landing point different from current
            let pts = LANDING_POINTS.filter(p => p.distanceTo(modelRef.current!.position) > 10);
            if (pts.length === 0) pts = LANDING_POINTS;
            const nextTarget = pts[Math.floor(Math.random() * pts.length)];
            ai.targetPos.copy(nextTarget);
            
            ai.state = 'flying';
            
            mixerRef.current.stopAllAction();
            const flyClip = animations.find(a => a.name === 'Robin_Bird_Fly') || animations[0];
            mixerRef.current.clipAction(flyClip).setLoop(THREE.LoopRepeat, Infinity).play();
          } else {
            // Randomly switch idle animations (Eat, Call, Idle) occasionally
            if (Math.random() < 0.01) {
              const idleAnimNames = ['Robin_Bird_Idle', 'Robin_Bird_Idle2', 'Robin_Bird_Eat', 'Robin_Bird_Call'];
              const randIdle = idleAnimNames[Math.floor(Math.random() * idleAnimNames.length)];
              const clip = animations.find(a => a.name === randIdle) || animations[0];
              mixerRef.current.stopAllAction();
              mixerRef.current.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
            }
          }
        } else if (ai.state === 'flying') {
          const speed = 150 * delta; // 150 cm/sec
          const dist = modelRef.current.position.distanceTo(ai.targetPos);
          
          if (dist < speed) {
            // Arrived
            modelRef.current.position.copy(ai.targetPos);
            ai.state = 'idle';
            ai.timer = 3 + Math.random() * 5; // Pause 3-8s
            
            mixerRef.current.stopAllAction();
            const idleClip = animations.find(a => a.name === 'Robin_Bird_Idle') || animations[0];
            mixerRef.current.clipAction(idleClip).setLoop(THREE.LoopRepeat, Infinity).play();
          } else {
            // Move & Rotate towards target
            const dir = new THREE.Vector3().subVectors(ai.targetPos, modelRef.current.position).normalize();
            
            // Add some arc to the flight (Y height) based on distance left vs total distance
            // Actually simple straight line for now
            modelRef.current.position.add(dir.multiplyScalar(speed));
            
            // Look at target
            const targetRot = Math.atan2(dir.x, dir.z);
            // Smooth rotation
            let rotDiff = targetRot - modelRef.current.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            modelRef.current.rotation.y += rotDiff * Math.min(1, 10 * delta);
          }
        }
      }
    }

    mixerRef.current.update(delta);
    invalidate();
  });

  return (
    <group ref={modelRef} position={isPreview ? undefined : LANDING_POINTS[0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);

