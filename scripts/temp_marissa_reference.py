from pathlib import Path
p=Path('src/features/scene/LaraVariants.ts')
s=p.read_text()
s=s.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport { applyMarissaReferenceTattoos } from './MarissaReferenceTattoos';",1)
s=s.replace("const isDelphinaNudeTorso =", "const isMarissaNudeTorso = isMarissa && meshName.startsWith('body_nude_torso');\n      const isDelphinaNudeTorso =",1)
s=s.replace('if (!isSaraNudeTorso && !isDelphinaNudeTorso', 'if (!isMarissaNudeTorso && !isSaraNudeTorso && !isDelphinaNudeTorso',1)
s=s.replace('if (isMarissa) applyMarissaTattoos(mat);', "if (isMarissa && meshName === 'arms') applyMarissaTattoos(mat);")
s=s.replace('  // MARISSA 3D PIERCINGS', '  if (isMarissa) applyMarissaReferenceTattoos(model);\n\n  // MARISSA 3D PIERCINGS',1)
start=s.index('  // ── 2. TATOUAGE TEXTE')
end=s.index('// ── DELPHINA FLORAL',start)
s=s[:start]+'}\n\n'+s[end:]
p.write_text(s)
