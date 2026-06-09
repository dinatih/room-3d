import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

/**
 * KiraIK — Intégration du personnage Kira avec Inverse Kinematics (IK)
 * et une boule de cristal réfléchissant le studio.
 */
export function KiraIK() {
  const group = useRef<THREE.Group>(null!);
  const studioScene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  
  // Utilisation du modèle kira.glb (public/media/glb/kira.glb)
  const { scene: kiraScene } = useGLTF('/media/glb/kira.glb') as any;

  // Filtrage du décor : on ne garde que les persos et le canapé jaune.
  useEffect(() => {
    // 1. TOUT cacher par défaut
    kiraScene.traverse((n: THREE.Object3D) => {
      n.visible = false;
    });

    // 2. Définir ce qu'on veut ABSOLUMENT garder
    // On utilise des noms plus précis pour éviter les collisions
    const whitelist = [
      'kira_shirt_left', 'kira_shirt_right', 'kira_head_b', 'kira_hair_a', 'kira_pants_b', 'kira_feet',
      'boule', 'head', 'hand_l', 'hand_r', 'lowerarm_l', 'upperarm_l', 'arm_l', 'arm_r', 'leg', 'foot',
      'armchair', 'ymans', 'pmanl'
    ];

    // 3. Réactiver seulement le nécessaire
    kiraScene.traverse((n: any) => {
      const name = n.name.toLowerCase();
      
      // Blacklist explicite pour le fauteuil vert
      if (name.includes('wing') || (name.includes('chair') && !name.includes('armchair'))) {
        return;
      }

      const isWhitelisted = whitelist.some(k => name.includes(k));

      if (isWhitelisted) {
        n.visible = true;
        
        // Remonter aux parents pour s'assurer qu'ils sont visibles
        let p = n.parent;
        while (p) {
          p.visible = true;
          p = p.parent;
        }

        // Descendre aux enfants si c'est un Mesh ou un conteneur autorisé
        n.traverse((c: THREE.Object3D) => {
          const cName = c.name.toLowerCase();
          if (!cName.includes('wing') && (!cName.includes('chair') || cName.includes('armchair'))) {
            c.visible = true;
          }
        });
      }
    });

    // 4. Attachement stable de la boule à la main
    const sphere = kiraScene.getObjectByName('boule');
    const hand = kiraScene.getObjectByName('hand_l');
    if (sphere && hand) {
      hand.attach(sphere);
      // Ajustement léger pour qu'elle soit bien dans la paume
      sphere.position.set(0, 0, 0); 
    }
  }, [kiraScene]);

  // Références aux objets internes pour l'IK et les effets
  const OOI = useMemo(() => {
    const obj: any = {};
    kiraScene.traverse((n: THREE.Object3D) => {
      if (n.name === 'head') obj.head = n;
      if (n.name === 'lowerarm_l') obj.lowerarm_l = n;
      if (n.name === 'Upperarm_l') obj.Upperarm_l = n;
      if (n.name === 'hand_l') obj.hand_l = n;
      if (n.name === 'target_hand_l') obj.target_hand_l = n;
      if (n.name === 'boule') obj.sphere = n;
      if (n.name === 'Kira_Shirt_left') obj.kira = n;
    });
    return obj;
  }, [kiraScene]);

  // CubeCamera pour la réflexion sur la boule
  const { cubeCamera, cubeRenderTarget } = useMemo(() => {
    const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    // @ts-ignore - Three.js version compatibility
    if (renderTarget.texture.colorSpace) renderTarget.texture.colorSpace = THREE.SRGBColorSpace;
    
    const camera = new THREE.CubeCamera(0.05, 50, renderTarget);
    // On ignore le layer du Walker (6)
    // @ts-ignore
    const internalCam = (camera as any).camera as THREE.PerspectiveCamera;
    if (internalCam) internalCam.layers.disable(6);
    return { cubeCamera: camera, cubeRenderTarget: renderTarget };
  }, []);

  // Configuration de l'IK Solver
  const ikSolver = useMemo(() => {
    if (!OOI.kira) return null;
    if (OOI.kira.skeleton && OOI.kira.skeleton.bones.length > 0) {
      OOI.kira.add(OOI.kira.skeleton.bones[0]);
    }

    const iks = [{
      target: 22, // target_hand_l
      effector: 6, // hand_l
      links: [
        {
          index: 5, // lowerarm_l
          rotationMin: new THREE.Vector3(1.2, -1.8, -0.4),
          rotationMax: new THREE.Vector3(1.7, -1.1, 0.3)
        },
        {
          index: 4, // Upperarm_l
          rotationMin: new THREE.Vector3(0.1, -0.7, -1.8),
          rotationMax: new THREE.Vector3(1.1, 0, -1.4)
        },
      ],
    }];
    
    return new CCDIKSolver(OOI.kira, iks);
  }, [OOI.kira]);

  // Application du matériau miroir à la boule
  useEffect(() => {
    if (OOI.sphere) {
      OOI.sphere.material = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        metalness: 1,
        roughness: 0,
        color: 0xffffff,
      });
    }
  }, [OOI.sphere, cubeRenderTarget]);

  const v0 = new THREE.Vector3();

  useFrame((state) => {
    if (!OOI.sphere || !OOI.target_hand_l) return;

    // Mise à jour de la CubeCamera (réflexion)
    // On cache Kira pour que la boule ne reflète pas l'intérieur de son propre corps
    kiraScene.visible = false;
    // On s'assure que la camera suit la boule
    OOI.sphere.getWorldPosition(cubeCamera.position);
    cubeCamera.update(gl, studioScene);
    kiraScene.visible = true;

    // Mise à jour IK
    if (ikSolver) ikSolver.update();

    // Kira regarde la boule
    if (OOI.head) {
      OOI.sphere.getWorldPosition(v0);
      OOI.head.lookAt(v0);
      OOI.head.rotation.set(OOI.head.rotation.x, OOI.head.rotation.y + Math.PI, OOI.head.rotation.z);
    }
  });

  return (
    <group ref={group} scale={100} position={[158, 0, 100]} rotation-y={-Math.PI / 2}>
      <primitive object={kiraScene} />
      <primitive object={cubeCamera} />
    </group>
  );
}

// Pré-chargement du modèle
useGLTF.preload('/media/glb/kira.glb');
