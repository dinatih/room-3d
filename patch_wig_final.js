const fs = require('fs');
let code = fs.readFileSync('src/features/scene/items/Wig.tsx', 'utf8');

// 1. Replace the cloning logic
code = code.replace(
  /let sourceGroup: THREE\.Object3D \| null = null;[\s\S]*?const sg = SkeletonUtils\.clone\(sourceGroup as THREE\.Object3D\);/,
  `// Clone the ENTIRE scene to ensure SkinnedMesh binds perfectly to the bones
    const clonedFullScene = SkeletonUtils.clone(fullScene) as THREE.Group;
    
    let sg: THREE.Object3D | null = null;
    clonedFullScene.traverse(child => {
      if (!sg && child.name.startsWith(\`Hair\${gltfId}_ARM_\`)) sg = child as THREE.Object3D;
    });

    if (!sg) return new THREE.Group();`
);

// 2. Add the spin test
if (!code.includes('useFrame')) {
  code = code.replace(`import { useLayoutEffect`, `import { useFrame, useLayoutEffect`);
}
if (!code.includes('Violent spin test activated')) {
  code = code.replace(
    `const hairBonesRef = useRef<WigBone[]>([]);`,
    `const hairBonesRef = useRef<WigBone[]>([]);
  
  useFrame((state) => {
    if (hairBonesRef.current.length > 0) {
      const rootBone = hairBonesRef.current[0].bone;
      if (!(window as any)._spinLogged) {
        console.log("[Wig] Violent spin test activated on bone:", rootBone.name);
        (window as any)._spinLogged = true;
      }
      rootBone.rotation.x = state.clock.elapsedTime * 15; // Violently spin like a helicopter
    }
  });`
  );
}

// 3. Extract bones from sm.skeleton.bones
code = code.replace(
  /if \(\(child as THREE\.Mesh\)\.isMesh\) \{/,
  `if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        if (!(window as any)._skinLogged2) {
          console.log("[Wig] SkinnedMesh found:", sm.name, "with", sm.skeleton.bones.length, "bones.");
          (window as any)._skinLogged2 = true;
        }
        // Extract bones DIRECTLY from the SkinnedMesh's skeleton!
        if (extractedBones.length === 0) {
          const isRootOrScalp = (n: string) => n.toLowerCase().includes('root') || n.toLowerCase().includes('spine') || n.toLowerCase().includes('neck') || n.toLowerCase().includes('head');
          sm.skeleton.bones.forEach(b => {
            if (!isRootOrScalp(b.name)) {
              extractedBones.push({
                bone: b,
                restQ: b.quaternion.clone(),
                index: extractedBones.length
              });
            }
          });
        }
      }
      
      if ((child as THREE.Mesh).isMesh) {`
);

// 4. Remove the old bone extraction logic
code = code.replace(
  /if \(\(child as any\)\.isBone\) \{[\s\S]*?\}\n\s*\}/,
  ``
);

code = code.replace(
  /console\.log\("Wig extracted bones:", extractedBones\.length\);/,
  `console.log("Wig extracted bones directly from skeleton:", extractedBones.length);`
);

fs.writeFileSync('src/features/scene/items/Wig.tsx', code);
