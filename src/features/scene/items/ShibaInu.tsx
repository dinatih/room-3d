import { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { cameraState } from '@features/scene/cameraState';
import { isAppIdle } from '@features/scene/idleState';

type AIState = { mode: 'autonomous' | 'forced', state: 'idle' | 'walking' | 'running', targetPos: THREE.Vector3, timer: number };

export function ShibaInu({ isPreview = false, previewAnim = '', showSkeletonPreview = false }: { isPreview?: boolean, previewAnim?: string, showSkeletonPreview?: boolean }) {
  const { scene, animations } = useGLTFClone('/characters/ushiro/shiba_inu_dog_ushiro.glb');
  const { invalidate } = useThree();
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const playingRef = useRef(false);
  
  const showSkeletonGlobal = useSceneStore(s => s.layers.skeleton);
  const showSkeleton = isPreview ? showSkeletonPreview : showSkeletonGlobal;
  const modelRef = useRef<THREE.Group>(null);
  useHelper(showSkeleton ? modelRef as any : null, THREE.SkeletonHelper);

  const aiStateRef = useRef<AIState>({
    mode: 'autonomous',
    state: 'idle',
    targetPos: new THREE.Vector3(180, 0, -120),
    timer: 2.0
  });

  // Handle Preview Animations
  useEffect(() => {
    if (!isPreview || !mixerRef.current || !previewAnim) return;
    
    const animMap: Record<string, string> = {
      'idle': 'Dog|Dog|Idle', 'jump': 'Dog|Dog|Jump', 'run': 'Dog|Dog|Run',
      'sitdown': 'Dog|Dog|SitDown', 'walk': 'Dog|Dog|Walk'
    };
    
    const targetAnimName = animMap[previewAnim] || 'Dog|Dog|Idle';
    const clip = animations.find(a => a.name === targetAnimName) || animations[0];
    
    if (clip) {
      mixerRef.current.stopAllAction();
      const action = mixerRef.current.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.reset().play();
      playingRef.current = true;
    }
  }, [isPreview, previewAnim, animations]);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());

    if (size.y > 0) {
      scene.scale.setScalar(40 / size.y);
    } else {
      scene.scale.setScalar(1); // fallback
    }
    scene.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(scene);
    scene.position.set(0, -scaledBox.min.y, 0);

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = 0;
        mat.roughness = 0.8;
      }
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
    }

    // Set initial transform
    if (modelRef.current && !isPreview) {
      modelRef.current.position.set(180, 0, -120);
      modelRef.current.rotation.y = -Math.PI / 4;
    }

    return () => { mixerRef.current?.stopAllAction(); };
  }, [scene, animations, isPreview]);

  // Initial animation
  useEffect(() => {
    if (!isPreview && mixerRef.current && animations.length > 0) {
      const clip = animations.find(a => a.name === 'Dog|Dog|Idle') || animations[0];
      const action = mixerRef.current.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
      playingRef.current = true;
    }
  }, [isPreview, animations]);

  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      
      if (key === 'shiba-replay') {
        // Return to autonomous mode
        aiStateRef.current.mode = 'autonomous';
        aiStateRef.current.state = 'idle';
        aiStateRef.current.timer = 1.0;
        
      } else if (key.startsWith('shiba-play-') && mixerRef.current) {
        // Forced manual animation
        const idx = parseInt(key.split('-')[2], 10);
        if (!isNaN(idx) && animations[idx]) {
          aiStateRef.current.mode = 'forced';
          mixerRef.current.stopAllAction();
          const action = mixerRef.current.clipAction(animations[idx]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.reset().play();
          playingRef.current = true;
          invalidate();
        }
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate, isPreview, animations]);

  useFrame((_, delta) => {
    if (isAppIdle() || !mixerRef.current || !modelRef.current) return;
    
    if (!isPreview) {
      const ai = aiStateRef.current;
      if (ai.mode === 'autonomous') {
        if (ai.state === 'idle') {
          ai.timer -= delta;
          if (ai.timer <= 0) {
            // Pick new target (champ d'action complet appartement, jardin et zones AI etendues)
            const rand = Math.random();
            let tx, tz;
            if (rand < 0.5) {
              // Garden étendu (50%)
              tx = -350 + Math.random() * 1000;  // X: -350 to 650
              tz = -350 + Math.random() * 320; // Z: -350 to -30
            } else if (rand < 0.7) {
              // Main Room (20%)
              tx = 50 + Math.random() * 200;   // X: 50 to 250
              tz = 50 + Math.random() * 300;   // Z: 50 to 350
            } else if (rand < 0.9) {
              // Couloir rouge (20%) - Zone AI Entrée bat B
              tx = -350 + Math.random() * 1000; // X: -350 to 650
              tz = 598.3 - (tx - 348.5) * 0.57735; // Suit l'axe central du couloir
            } else {
              // Bathroom (10%)
              tx = 20 + Math.random() * 110;
              tz = 520 + Math.random() * 120;
            }
            ai.targetPos.set(tx, 0, tz);
            
            const dist = modelRef.current.position.distanceTo(ai.targetPos);
            ai.state = dist > 150 ? 'running' : 'walking';
            
            mixerRef.current.stopAllAction();
            const clipName = ai.state === 'running' ? 'Dog|Dog|Run' : 'Dog|Dog|Walk';
            const clip = animations.find(a => a.name === clipName) || animations[4];
            const action = mixerRef.current.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.reset().play();
          }
        } else {
          // Moving
          const speed = ai.state === 'running' ? 120 : 50;
          const dist = modelRef.current.position.distanceTo(ai.targetPos);
          if (dist < 5) {
            ai.state = 'idle';
            ai.timer = 3 + Math.random() * 8; // wait 3 to 11 seconds
            
            mixerRef.current.stopAllAction();
            const clipName = Math.random() > 0.5 ? 'Dog|Dog|Idle' : 'Dog|Dog|SitDown';
            const clip = animations.find(a => a.name === clipName) || animations[0];
            const action = mixerRef.current.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.reset().play();
          } else {
            const dir = new THREE.Vector3().subVectors(ai.targetPos, modelRef.current.position).normalize();
            modelRef.current.position.addScaledVector(dir, speed * delta);
            
            const targetRot = Math.atan2(dir.x, dir.z);
            let diff = targetRot - modelRef.current.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            modelRef.current.rotation.y += diff * 10 * delta;
          }
        }
      }
    }
    
    
    if (!isPreview) {
      cameraState.positions['shiba'] = {
        x: modelRef.current.position.x,
        y: modelRef.current.position.y,
        z: modelRef.current.position.z,
        yaw: modelRef.current.rotation.y
      };
    }
    
    mixerRef.current.update(delta);
    invalidate();
  });

  return (
    <group ref={modelRef as any}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/characters/ushiro/shiba_inu_dog_ushiro.glb');
