#!/usr/bin/env node
/**
 * remove-hdri.cjs
 * Script réutilisable pour supprimer un batch de HDRIs :
 *   1. Fichiers physiques dans public/environment/hdri/ (projet)
 *   2. Fichiers physiques dans /3D Resources/city/hdr pictures/ (.hdr et .exr)
 *   3. Entrées correspondantes dans src/features/scene/hdriConfig.ts
 *
 * Usage : node scripts/remove-hdri.cjs
 * → Éditer le tableau FILES_TO_DELETE ci-dessous avant chaque batch.
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
//  ✏️  ÉDITER ICI pour chaque nouveau batch
// ─────────────────────────────────────────────
const FILES_TO_DELETE = [
  // Exemples (basenames .hdr) :
  // 'lot_02_4k.hdr',
  // 'frozen_lake_4k.hdr',
];

// IDs à retirer de hdriConfig.ts (correspondants aux fichiers ci-dessus)
// → chaque id correspond à la valeur du champ `id:` dans HDRI_LIST
const IDS_TO_REMOVE = [
  // Exemples :
  // 'lot_02_4k',
  // 'frozen_lake_4k',
];
// ─────────────────────────────────────────────

const PROJECT_HDRI   = path.join(__dirname, '../public/environment/hdri');
const RESOURCES_DIR  = '/home/dinatih/3D Resources/city/hdr pictures';
const HDRI_CONFIG    = path.join(__dirname, '../src/features/scene/hdriConfig.ts');

let deletedProject   = 0;
let deletedResources = 0;

console.log('\n=== 1) Suppression dans le projet (public/environment/hdri) ===');
for (const f of FILES_TO_DELETE) {
  const target = path.join(PROJECT_HDRI, f);
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    console.log(`  ✅ Supprimé (projet)   : ${f}`);
    deletedProject++;
  } else {
    console.log(`  ⏭️  Absent (projet)    : ${f}`);
  }
}

console.log('\n=== 2) Suppression dans /3D Resources (hdr + exr) ===');
for (const f of FILES_TO_DELETE) {
  const base       = path.basename(f, path.extname(f));
  const targetHdr  = path.join(RESOURCES_DIR, f);
  const targetExr  = path.join(RESOURCES_DIR, base + '.exr');

  let found = false;
  for (const t of [targetHdr, targetExr]) {
    if (fs.existsSync(t)) {
      fs.unlinkSync(t);
      console.log(`  ✅ Supprimé (resources): ${path.basename(t)}`);
      deletedResources++;
      found = true;
    }
  }
  if (!found) console.log(`  ⏭️  Absent (resources) : ${f}`);
}

console.log('\n=== 3) Mise à jour de hdriConfig.ts ===');
let config  = fs.readFileSync(HDRI_CONFIG, 'utf8');
const lines = config.split('\n');

const filtered = lines.filter(line => {
  for (const id of IDS_TO_REMOVE) {
    if (line.includes(`id: '${id}'`)) {
      console.log(`  🗑️  Retiré du sélecteur: ${id}`);
      return false;
    }
  }
  return true;
});

// Nettoyer les lignes vides consécutives (> 1 blank)
const result = filtered.join('\n').replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(HDRI_CONFIG, result, 'utf8');

console.log('\n=== Résumé ===');
console.log(`  Fichiers projet supprimés    : ${deletedProject}`);
console.log(`  Fichiers resources supprimés : ${deletedResources}`);
console.log(`  Entrées config supprimées    : ${IDS_TO_REMOVE.length}`);
console.log('\n✅ Terminé. Penser à lancer : npx tsc --noEmit\n');
