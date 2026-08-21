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
    console.warn(`[Skip] GLB not found: ${glbFullPath}`);
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

// 1. Process all GLB files inside public/items/
console.log('=== 1. GENERATING PREVIEWS FOR ALL ITEMS IN public/items/ ===');
function scanGlbs(dir) {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) list = list.concat(scanGlbs(full));
    else if (e.name.endsWith('.glb')) list.push(full);
  }
  return list;
}

const allItemGlbs = scanGlbs('public/items');
allItemGlbs.forEach(glbFullPath => {
  const relGlb = path.relative('public', glbFullPath);
  const dirName = path.dirname(relGlb);
  const baseName = path.basename(relGlb, '.glb');
  const outPng = `${dirName}/${baseName}_3d_preview.png`;
  renderGlbThumbnail(relGlb, outPng);
});

// 2. Process all characters
console.log('=== 2. GENERATING PREVIEWS FOR CHARACTERS ===');
renderGlbThumbnail('characters/lara/lara_native.glb', 'characters/lara/lara_native_3d_preview.png');
renderGlbThumbnail('characters/xbot/Xbot_official.glb', 'characters/xbot/Xbot_official_3d_preview.png');
renderGlbThumbnail('characters/ushiro/shiba_inu_dog_ushiro.glb', 'characters/ushiro/shiba_inu_dog_ushiro_3d_preview.png');

// 3. Update inventoryData.ts to append or include preview images for each item with glbPath
console.log('=== 3. UPDATING inventoryData.ts ===');
let invCode = fs.readFileSync('src/features/inventory/inventoryData.ts', 'utf8');

// Match items in INVENTORY
invCode = invCode.replace(/{\s*id:\s*'([^']+)'[^}]*}/g, (block, id) => {
  const glbMatch = block.match(/glbPath:\s*'([^']+)'/);
  if (!glbMatch) return block;

  const glbPath = glbMatch[1];
  const dirName = path.dirname(glbPath);
  const baseName = path.basename(glbPath, '.glb');
  const previewPath = `${dirName}/${baseName}_3d_preview.png`;

  if (fs.existsSync(path.join('public', previewPath))) {
    const photosMatch = block.match(/photos:\s*\[([^\]]*)\]/);
    if (photosMatch) {
      const currentPhotos = photosMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const quotedPreview = `'${previewPath}'`;
      if (!currentPhotos.includes(quotedPreview)) {
        // Prepend or append the 3D preview
        const newPhotos = [quotedPreview, ...currentPhotos].join(', ');
        return block.replace(/photos:\s*\[[^\]]*\]/, `photos: [${newPhotos}]`);
      }
    } else {
      // Add photos property if none existed
      return block.replace(/glbPath:\s*'([^']+)'/, `glbPath: '$1', photos: ['${previewPath}']`);
    }
  }
  return block;
});

fs.writeFileSync('src/features/inventory/inventoryData.ts', invCode, 'utf8');
console.log('Successfully generated all GLB previews and updated inventoryData.ts!');
