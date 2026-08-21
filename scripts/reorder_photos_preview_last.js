import fs from 'fs';
import path from 'path';

let invCode = fs.readFileSync('src/features/inventory/inventoryData.ts', 'utf8');

// Parse inventory items by matching each item block cleanly
const lines = invCode.split('\n');
let inInventory = false;
let currentBlock = [];
let outputLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export const INVENTORY: InventoryItem[] = [')) {
    inInventory = true;
    outputLines.push(line);
    continue;
  }
  if (inInventory && line.startsWith('];')) {
    inInventory = false;
    outputLines.push(line);
    continue;
  }

  if (inInventory) {
    if (line.trim().startsWith('{ id:') || (currentBlock.length > 0 && !line.trim().endsWith('},') && !line.trim().endsWith('}'))) {
      currentBlock.push(line);
      if (line.trim().endsWith('},') || line.trim().endsWith('}')) {
        // Complete block
        let blockText = currentBlock.join('\n');
        blockText = processBlock(blockText);
        outputLines.push(blockText);
        currentBlock = [];
      }
    } else if (line.trim().startsWith('{') && (line.trim().endsWith('},') || line.trim().endsWith('}'))) {
      let blockText = processBlock(line);
      outputLines.push(blockText);
    } else {
      if (currentBlock.length > 0) {
        currentBlock.push(line);
        if (line.trim().endsWith('},') || line.trim().endsWith('}')) {
          let blockText = currentBlock.join('\n');
          blockText = processBlock(blockText);
          outputLines.push(blockText);
          currentBlock = [];
        }
      } else {
        outputLines.push(line);
      }
    }
  } else {
    outputLines.push(line);
  }
}

function processBlock(block) {
  const glbMatch = block.match(/glbPath:\s*'([^']+)'/);
  if (!glbMatch) return block;

  const glbPath = glbMatch[1];
  const dirName = path.dirname(glbPath);
  const baseName = path.basename(glbPath, '.glb');
  const previewPath = `${dirName}/${baseName}_3d_preview.png`;

  if (fs.existsSync(path.join('public', previewPath))) {
    const quotedPreview = `'${previewPath}'`;
    const photosMatch = block.match(/photos:\s*\[([\s\S]*?)\]/);
    
    if (photosMatch) {
      let rawPhotos = photosMatch[1];
      let currentPhotos = rawPhotos.split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => !s.includes('_3d_preview.png') && !s.includes('/previews/'));
      
      const newPhotos = [...currentPhotos, quotedPreview].join(', ');
      return block.replace(/photos:\s*\[[\s\S]*?\]/, `photos: [${newPhotos}]`);
    } else {
      return block.replace(/glbPath:\s*'([^']+)'/, `glbPath: '$1', photos: [${quotedPreview}]`);
    }
  }
  return block;
}

invCode = outputLines.join('\n');

// Character updates
invCode = invCode.replace(
  /INVENTORY\.push\(\{\s*id:\s*'ushiro',[\s\S]*?notes:\s*`Personnage : Chien Shiba Inu \(Ushiro\)\.`\s*\}\);/,
  `INVENTORY.push({
  id: 'ushiro',
  name: 'Chien Ushiro (Shiba Inu)',
  brand: 'Animal',
  category: 'walkers',
  qty: 1,
  dims: { w: 40, d: 80, h: 40 },
  glbPath: 'characters/ushiro/shiba_inu_dog_ushiro.glb',
  photos: ['characters/ushiro/shiba_inu_dog_ushiro_3d_preview.png'],
  notes: \`Personnage : Chien Shiba Inu (Ushiro).\`
});`
);

invCode = invCode.replace(
  /INVENTORY\.push\(\{\s*id:\s*'robin-bird',[\s\S]*?notes:\s*`Personnage : Oiseau Robin\.`\s*\}\);/,
  `INVENTORY.push({
  id: 'robin-bird',
  name: 'Oiseau Robin',
  brand: 'Animal',
  category: 'walkers',
  qty: 1,
  dims: { w: 10, d: 10, h: 10 },
  glbPath: 'items/robin-bird/model.glb',
  photos: ['items/robin-bird/model_3d_preview.png'],
  notes: \`Personnage : Oiseau Robin.\`
});`
);

invCode = invCode.replace(
  /CHARACTERS\.forEach\(char => \{[\s\S]*?\}\);\s*\}\);/,
  `CHARACTERS.forEach(char => {
  if (!INVENTORY.some((item: InventoryItem) => item.id === char.id)) {
    const charPreview = char.path.includes('xbot') ? 'characters/xbot/Xbot_official_3d_preview.png' : 'characters/lara/lara_native_3d_preview.png';
    INVENTORY.push({
      id: char.id,
      name: char.name,
      brand: char.id === 'xbot_studio' ? 'Mixamo' : 'Lara Croft Style',
      category: 'walkers',
      qty: 1,
      dims: { w: 45, d: 25, h: char.height },
      glbPath: char.path,
      photos: [charPreview],
      notes: \`Personnage : \${char.name}.\`
    });
  }
});`
);

fs.writeFileSync('src/features/inventory/inventoryData.ts', invCode, 'utf8');
console.log('Successfully reordered all photos with 3D preview as LAST item!');
