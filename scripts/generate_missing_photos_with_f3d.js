import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const F3D_BIN = '/usr/bin/f3d';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function renderGlbThumbnail(glbRelativePath, outputPngRelativePath) {
  const glbFullPath = path.resolve('public', glbRelativePath);
  const outFullPath = path.resolve('public', outputPngRelativePath);

  if (!fs.existsSync(glbFullPath)) {
    console.warn(`[Skip] GLB does not exist: ${glbFullPath}`);
    return false;
  }

  ensureDir(path.dirname(outFullPath));

  try {
    console.log(`Rendering with F3D: ${glbRelativePath} -> ${outputPngRelativePath}`);
    execSync(`"${F3D_BIN}" --output="${outFullPath}" --resolution=512,512 "${glbFullPath}"`, {
      stdio: 'pipe',
      timeout: 10000
    });
    return true;
  } catch (err) {
    console.error(`[Error] Failed to render ${glbRelativePath}:`, err.message);
    return false;
  }
}

// 1. Process Wigs in WIGS_ITEMS
console.log('=== 1. GENERATING PREVIEWS FOR WIGS ===');
let invCode = fs.readFileSync('src/features/inventory/inventoryData.ts', 'utf8');

// Render for all GLB files in characters/wigs/
const wigsDir = path.resolve('public/characters/wigs');
if (fs.existsSync(wigsDir)) {
  const wigFiles = fs.readdirSync(wigsDir).filter(f => f.endsWith('.glb'));
  wigFiles.forEach(f => {
    const baseName = path.basename(f, '.glb');
    const outPng = `characters/wigs/previews/${baseName}.png`;
    renderGlbThumbnail(`characters/wigs/${f}`, outPng);
  });
}

// 2. Update WIGS_ITEMS in inventoryData.ts to include photo previews
// Each wig item in WIGS_ITEMS gets its preview image attached
const wigEntryRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*[\"']([^\"']+)[\"'](?:,\s*glbPath:\s*'([^']+)')?\s*\}/g;

invCode = invCode.replace(wigEntryRegex, (match, id, name, glbPath) => {
  let finalGlb = glbPath || 'characters/wigs/hair_pack_part_2.glb';
  const baseName = path.basename(finalGlb, '.glb');
  const previewPath = `characters/wigs/previews/${baseName}.png`;
  
  if (fs.existsSync(path.join('public', previewPath))) {
    if (glbPath) {
      return `{ id: '${id}', name: "${name}", glbPath: '${glbPath}', photos: ['${previewPath}'] }`;
    } else {
      return `{ id: '${id}', name: "${name}", photos: ['${previewPath}'] }`;
    }
  }
  return match;
});

// Update the WIGS_ITEMS.forEach loop pushing into INVENTORY to forward photos:
invCode = invCode.replace(
  /INVENTORY\.push\(\{\s*id:\s*wig\.id,\s*name:\s*wig\.name,\s*brand:\s*'Custom',\s*category:\s*'wigs',\s*qty:\s*1,\s*dims:\s*\{\s*w:\s*25,\s*d:\s*25,\s*h:\s*25\s*\},\s*glbPath:\s*wig\.glbPath\s*\|\|\s*'characters\/wigs\/hair_pack_part_2\.glb',\s*notes:\s*`Perruque 3D:\s*\$\{wig\.name\}\.`\s*\}\);/,
  `INVENTORY.push({
      id: wig.id,
      name: wig.name,
      brand: 'Custom',
      category: 'wigs',
      qty: 1,
      dims: { w: 25, d: 25, h: 25 },
      glbPath: wig.glbPath || 'characters/wigs/hair_pack_part_2.glb',
      photos: (wig as any).photos || (wig.glbPath ? [\`characters/wigs/previews/\${wig.glbPath.split('/').pop()?.replace('.glb', '')}.png\`] : ['characters/wigs/previews/hair_pack_part_2.png']),
      notes: \`Perruque 3D: \${wig.name}.\`
    });`
);

// 3. Process any other items in INVENTORY with glbPath but no photos
console.log('=== 2. GENERATING PREVIEWS FOR INVENTORY ITEMS WITHOUT PHOTOS ===');
const itemRegex = /{\s*id:\s*'([^']+)'[^}]*}/g;
invCode = invCode.replace(itemRegex, (block, id) => {
  const glbMatch = block.match(/glbPath:\s*'([^']+)'/);
  const photosMatch = block.match(/photos:\s*\[([^\]]*)\]/);

  if (glbMatch) {
    const glb = glbMatch[1];
    const hasPhotos = photosMatch && photosMatch[1].trim().length > 0;
    
    if (!hasPhotos) {
      const outPng = `items/${id}/preview.png`;
      renderGlbThumbnail(glb, outPng);
      if (fs.existsSync(path.join('public', outPng))) {
        if (photosMatch) {
          return block.replace(/photos:\s*\[\]/, `photos: ['${outPng}']`);
        } else {
          return block.replace(/glbPath:\s*'([^']+)'/, `glbPath: '$1', photos: ['${outPng}']`);
        }
      }
    }
  }
  return block;
});

fs.writeFileSync('src/features/inventory/inventoryData.ts', invCode, 'utf8');
console.log('Done generating F3D previews and updating inventoryData.ts!');
