const fs = require('fs');
let content = fs.readFileSync('src/features/scene/items/Wig.tsx', 'utf-8');

if (!content.includes('bone.rotation.x = state.clock.elapsedTime * 15;')) {
  content = content.replace(
    `useLayoutEffect(() => {`,
    `useFrame((state) => {
    if (hairBonesRef.current.length > 0) {
      const rootBone = hairBonesRef.current[0].bone;
      if (!(window as any)._spinLogged) {
        console.log("[Wig] Violent spin test activated on bone:", rootBone.name);
        (window as any)._spinLogged = true;
      }
      rootBone.rotation.x = state.clock.elapsedTime * 15; // Violently spin like a helicopter
    }
  });

  useLayoutEffect(() => {`
  );
  if (!content.includes('useFrame')) {
    content = content.replace(`import { useLayoutEffect`, `import { useFrame, useLayoutEffect`);
  }
  fs.writeFileSync('src/features/scene/items/Wig.tsx', content);
}
