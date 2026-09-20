import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3d';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MAX_TEXTURE_DIM = 1024;
const WEBP_QUALITY = 82;

async function run() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });

  const walkerConfig = fs.readFileSync('src/features/scene/walkerConfig.ts', 'utf8');
  const regex = /id:\s*'([^']+)',.*?path:\s*'([^']+)'/g;
  let match;
  const models = [];

  while ((match = regex.exec(walkerConfig)) !== null) {
    const id = match[1];
    const p = match[2];
    if (id === 'native' || id === 'xbot' || p.includes('lara_native')) continue;
    models.push({ id, relPath: p, fullPath: path.resolve('public', p) });
  }

  console.log(`Trouvé ${models.length} modèles extra à vérifier.`);
  let totalSavedBytes = 0;

  for (const { id, relPath, fullPath } of models) {
    if (!fs.existsSync(fullPath)) {
      console.warn(`[SKIP] Fichier introuvable : ${fullPath}`);
      continue;
    }

    const initialSize = fs.statSync(fullPath).size;
    const initialMB = (initialSize / (1024 * 1024)).toFixed(2);

    // Vérifier si le modèle a déjà WebP ET Draco ET fait moins de 3 Mo
    const buf = fs.readFileSync(fullPath);
    const jsonLen = buf.readUInt32LE(12);
    const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonStr);
    const exts = gltf.extensionsUsed || [];
    const hasDraco = exts.includes('KHR_draco_mesh_compression');
    const hasWebP = exts.includes('EXT_texture_webp');
    const imgTypes = new Set((gltf.images || []).map(img => img.mimeType));
    const hasRawPngOrJpeg = imgTypes.has('image/png') || imgTypes.has('image/jpeg');

    if (hasDraco && hasWebP && !hasRawPngOrJpeg && initialSize < 3 * 1024 * 1024) {
      console.log(`[OK] ${id.padEnd(16)} déjà optimisé (${initialMB} Mo)`);
      continue;
    }

    console.log(`\n[OPTIMIZING] ${id.padEnd(16)} (${initialMB} Mo) : ${relPath}`);
    const tmpPath = fullPath + '.tmp.glb';

    try {
      const doc = await io.read(fullPath);
      const textures = doc.getRoot().listTextures();

      for (const t of textures) {
        const rawImg = t.getImage();
        if (!rawImg || rawImg.length === 0) continue;
        try {
          const s = sharp(rawImg);
          const meta = await s.metadata();
          let pipeline = sharp(rawImg);
          if (meta.width > MAX_TEXTURE_DIM || meta.height > MAX_TEXTURE_DIM) {
            pipeline = pipeline.resize(MAX_TEXTURE_DIM, MAX_TEXTURE_DIM, { fit: 'inside', withoutEnlargement: true });
          }
          const webpBuf = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
          t.setImage(webpBuf);
          t.setMimeType('image/webp');
        } catch (imgErr) {
          console.warn(`   Avertissement texture "${t.getName() || 'sans nom'}" :`, imgErr.message);
        }
      }

      await doc.transform(
        draco({
          method: 'edgebreaker',
          quantizePosition: 14,
          quantizeNormal: 10,
          quantizeTexcoord: 12,
          quantizeColor: 8,
          quantizeGeneric: 12,
        })
      );

      const bin = await io.writeBinary(doc);
      fs.writeFileSync(tmpPath, bin);

      const finalSize = fs.statSync(tmpPath).size;
      const finalMB = (finalSize / (1024 * 1024)).toFixed(2);
      const diffMB = ((initialSize - finalSize) / (1024 * 1024)).toFixed(2);
      const pct = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);

      fs.renameSync(tmpPath, fullPath);
      totalSavedBytes += (initialSize - finalSize);
      console.log(` -> Terminé : ${initialMB} Mo -> ${finalMB} Mo (-${pct}%, gain de ${diffMB} Mo)`);
    } catch (err) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      console.error(`[ERREUR] Impossible d'optimiser ${id} :`, err);
    }
  }

  console.log(`\n========================================`);
  console.log(`GAIN TOTAL DE POIDS GLB : ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} Mo économisés sur disque !`);
  console.log(`========================================\n`);
}

run().catch(console.error);
