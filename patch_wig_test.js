const fs = require('fs');
let content = fs.readFileSync('src/features/scene/items/Wig.tsx', 'utf-8');

// We will inject a useFrame hook to violently spin the first bone
if (!content.includes('bone.rotation.x = state.clock.elapsedTime * 10;')) {
  content = content.replace(
    `useLayoutEffect(() => {`,
    `useFrame((state) => {
    if (hairBonesRef.current.length > 0 && haircut !== 'original') {
      const bone = hairBonesRef.current[0].bone;
      // violently spin the root bone
      bone.rotation.x = state.clock.elapsedTime * 10;
    }
  });

  useLayoutEffect(() => {`
  );
  // Add useFrame to imports if not present
  if (!content.includes('useFrame')) {
    content = content.replace(`import { useLayoutEffect, useMemo`, `import { useFrame, useLayoutEffect, useMemo`);
  }
  // We also need haircut state
  if (!content.includes('useSceneStore(s => s.equipment.haircut)')) {
    content = content.replace(
      `const scene = useMemo(() => {`,
      `const haircut = useSceneStore(s => s.equipment.haircut);
  const scene = useMemo(() => {`
    );
  }
  fs.writeFileSync('src/features/scene/items/Wig.tsx', content);
}
