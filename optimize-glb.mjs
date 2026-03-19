// Optimisation GLB — strip textures/UVs + simplify + draco pour les GLBs à couleur solide
// Usage: node optimize-glb.mjs
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup, prune, weld, simplify, draco, resample, textureCompress,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.join(__dirname, 'media');

await MeshoptSimplifier.ready;

const dracoEncoder = await draco3d.createEncoderModule();
const dracoDecoder = await draco3d.createDecoderModule();

const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': dracoEncoder,
    'draco3d.decoder': dracoDecoder,
    'meshopt.simplifier': MeshoptSimplifier,
  });

// GLBs avec couleur solide : on peut supprimer textures + UV
const SOLID_COLOR_GLBS = [
  'realistic_human_cloths.glb',
  'baseball_cap.glb',
  'salopette-noir.glb',
  'man_black_business_suit.glb',
  'mechanic_jumpsuit.glb',
  'ikea_Altappen.glb',
];

// GLBs avec textures à garder : draco seul
const TEXTURED_GLBS = [
  'sneaker.glb',
];

async function optimizeSolidColor(filename) {
  const input  = path.join(MEDIA, filename);
  const output = path.join(MEDIA, filename);
  console.log(`\n⚙ ${filename} ...`);

  const document = await io.read(input);
  const root = document.getRoot();

  // Supprimer toutes les textures
  root.listTextures().forEach(t => t.dispose());

  // Supprimer les attributs UV (TEXCOORD_*)
  root.listMeshes().forEach(mesh => {
    mesh.listPrimitives().forEach(prim => {
      ['TEXCOORD_0', 'TEXCOORD_1'].forEach(attr => {
        const a = prim.getAttribute(attr);
        if (a) { prim.setAttribute(attr, null); a.dispose(); }
      });
    });
  });

  await document.transform(
    dedup(),
    prune(),
    weld({ tolerance: 0.0001 }),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.25, error: 0.005 }),
    draco(),
  );

  await io.write(output, document);
  console.log(`  ✓ écrit`);
}

async function optimizeTextured(filename) {
  const input  = path.join(MEDIA, filename);
  const output = path.join(MEDIA, filename);
  console.log(`\n⚙ ${filename} ...`);

  const document = await io.read(input);

  await document.transform(
    dedup(),
    prune(),
    weld({ tolerance: 0.0001 }),
    draco(),
  );

  await io.write(output, document);
  console.log(`  ✓ écrit`);
}

for (const f of SOLID_COLOR_GLBS) {
  try { await optimizeSolidColor(f); }
  catch (e) { console.error(`  ✗ ${f}: ${e.message}`); }
}

for (const f of TEXTURED_GLBS) {
  try { await optimizeTextured(f); }
  catch (e) { console.error(`  ✗ ${f}: ${e.message}`); }
}

console.log('\n✅ Terminé.');
