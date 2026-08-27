import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, EXTTextureWebP } from '@gltf-transform/extensions';
import { draco, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3d';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimizeGlb(inputPath, outputPath) {
  console.log(`\n=== Optimisation de ${inputPath} ===`);
  const initialSize = fs.statSync(inputPath).size;
  console.log(`Taille initiale : ${(initialSize / 1024 / 1024).toFixed(2)} Mo (${initialSize} octets)`);

  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, EXTTextureWebP])
    .registerDependencies({
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });

  const document = await io.read(inputPath);

  // 1. Compression et conversion de toutes les textures (PNG/JPEG) en WebP
  await document.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      quality: 85,
    })
  );

  // 2. Compression géométrique Draco
  await document.transform(
    draco({
      method: 'edgebreaker',
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeGeneric: 12,
    })
  );

  await io.write(outputPath, document);
  const finalSize = fs.statSync(outputPath).size;
  const reductionPercent = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);
  console.log(`Taille finale   : ${(finalSize / 1024 / 1024).toFixed(2)} Mo (${finalSize} octets)`);
  console.log(`Réduction       : -${reductionPercent}%\n`);
}

const input = path.resolve('public/characters/lara/lara_native.glb');
const output = path.resolve('public/characters/lara/lara_native.glb');

const tempOutput = path.resolve('public/characters/lara/lara_native.tmp.glb');

try {
  await optimizeGlb(input, tempOutput);
  fs.renameSync(tempOutput, output);
  console.log('Optimisation terminée avec succès !');
} catch (err) {
  if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  console.error('Erreur lors de l\'optimisation :', err);
  process.exit(1);
}
