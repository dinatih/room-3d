import fs from 'fs';
import path from 'path';

// 1. Rename all model.glb and model_3d_preview.png inside public/items/ and public/characters/
const folders = ['public/items', 'public/characters'];
const renameMap = new Map(); // oldRel -> newRel

folders.forEach(baseDir => {
  if (!fs.existsSync(baseDir)) return;
  const items = fs.readdirSync(baseDir, { withFileTypes: true });
  items.forEach(item => {
    if (item.isDirectory()) {
      const folderName = item.name;
      const itemDir = path.join(baseDir, folderName);
      
      const files = fs.readdirSync(itemDir);
      files.forEach(f => {
        if (f === 'model.glb') {
          const oldPath = path.join(itemDir, 'model.glb');
          const newPath = path.join(itemDir, `${folderName}.glb`);
          fs.renameSync(oldPath, newPath);
          renameMap.set(path.relative('public', oldPath), path.relative('public', newPath));
          console.log(`Renamed: ${path.relative('public', oldPath)} -> ${path.relative('public', newPath)}`);
        } else if (f === 'model_3d_preview.png') {
          const oldPath = path.join(itemDir, 'model_3d_preview.png');
          const newPath = path.join(itemDir, `${folderName}_3d_preview.png`);
          fs.renameSync(oldPath, newPath);
          renameMap.set(path.relative('public', oldPath), path.relative('public', newPath));
          console.log(`Renamed: ${path.relative('public', oldPath)} -> ${path.relative('public', newPath)}`);
        }
      });
    }
  });
});

// 2. Update all references in src/
function getFiles(dir, matchExt) {
  let res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) res = res.concat(getFiles(full, matchExt));
    else if (matchExt.test(e.name)) res.push(full);
  }
  return res;
}

const tsFiles = getFiles('src', /\.(tsx?|ts)$/);
tsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  renameMap.forEach((newRel, oldRel) => {
    if (content.includes(oldRel) || content.includes('/' + oldRel)) {
      content = content.replaceAll('/' + oldRel, '/' + newRel);
      content = content.replaceAll(oldRel, newRel);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated references in ${path.basename(file)}`);
  }
});

console.log('Done renaming all model.* files to match their parent folder name!');
