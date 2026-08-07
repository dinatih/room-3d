const fs = require('fs');
let code = fs.readFileSync('src/features/scene/items/Wig.tsx', 'utf8');

// fix unused attachTo
code = code.replace(
  /if \(onBonesExtracted\) \{\n      onBonesExtracted\(hairBonesRef.current\);\n    \}\n  \}, \[scene, color\]\);/g,
  `if (onBonesExtracted) {
      onBonesExtracted(hairBonesRef.current);
    }
    
    if (attachTo && clonedHairRef.current) {
      attachTo.add(clonedHairRef.current);
    }
    return () => {
      if (attachTo && clonedHairRef.current) {
        attachTo.remove(clonedHairRef.current);
      }
    };
  }, [scene, color, attachTo]);`
);

// fix unused mat
code = code.replace(/m.material = m.material.map\(mat => \{/g, "m.material = m.material.map((_mat: any) => {");

fs.writeFileSync('src/features/scene/items/Wig.tsx', code);
