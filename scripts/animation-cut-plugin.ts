import { mkdir, open, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';
import type { AnimationDefinition } from '../src/features/scene/animations/animationRegistry.ts';
import { exportAnimationVariant } from './export-animation-cut.ts';

const registryModule = '/src/features/scene/animations/animationRegistry.ts';
const manifestPath = '/src/features/scene/animations/customCuts.json';

export function animationCutPlugin(): Plugin {
  return {
    name: 'room-animation-cut',
    apply: 'serve',
    handleHotUpdate({ file, server }) {
      // The save response lets the editor decide when to open the updated catalogue.
      if (file === server.config.root + manifestPath) {
        for (const module of server.moduleGraph.getModulesByFile(file) ?? []) server.moduleGraph.invalidateModule(module);
        return [];
      }
    },
    configureServer(server) {
      const publicDir = server.config.publicDir;
      const manifest = server.config.root + manifestPath;
      let pending = Promise.resolve();

      server.middlewares.use('/__animation-variant', (req, res) => {
        const reply = (status: number, payload: object) => {
          res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(payload));
        };
        if (req.method !== 'POST') return reply(405, { error: 'Méthode non autorisée.' });
        if (!req.headers.origin || !['http://' + req.headers.host, 'https://' + req.headers.host].includes(req.headers.origin)
          || req.headers['content-type'] !== 'application/json') {
          return reply(403, { error: 'Requête extérieure au studio.' });
        }

        async function save() {
          let body = '';
          for await (const chunk of req) body += chunk;
          const { sourceId, name, segments, alignment } = JSON.parse(body);
          const label = typeof name === 'string' ? name.trim() : '';
          const slug = label.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
            .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          if (!slug || slug.length > 120) throw new Error('Saisissez un nom valide pour la variante.');
          if (typeof sourceId !== 'string' || (segments === undefined && alignment === undefined)) {
            throw new Error('Sélectionnez une animation et une modification à enregistrer.');
          }
          if (segments !== undefined && (!Array.isArray(segments) || !segments.length
            || !segments.every(segment => Array.isArray(segment) && segment.length === 2 && segment.every(Number.isFinite)))) {
            throw new Error('Les plages de découpe sont invalides.');
          }
          if (alignment !== undefined && (!Array.isArray(alignment?.offset) || alignment.offset.length !== 3
            || !alignment.offset.every(Number.isFinite) || !Number.isFinite(alignment.rotY))) {
            throw new Error('Les valeurs de recentrage sont invalides.');
          }

          const entries: AnimationDefinition[] = JSON.parse(await readFile(manifest, 'utf8'));
          const { ANIMATION_DEFINITIONS } = await server.ssrLoadModule(registryModule);
          const definitions = [...entries, ...ANIMATION_DEFINITIONS] as AnimationDefinition[];
          const source = definitions.find(def => def.id === sourceId);
          if (!source) throw new Error('Animation introuvable.');
          const animationDir = await realpath(path.join(publicDir, 'animations'));
          const sourceFile = await realpath(path.resolve(publicDir, source.path));
          if (!sourceFile.startsWith(animationDir + path.sep)) throw new Error('Source hors du dossier des animations.');
          const { bytes, duration, segments: exportedSegments } = await exportAnimationVariant(sourceFile, label, segments, alignment);
          const directory = path.join(animationDir, 'custom');
          await mkdir(directory, { recursive: true });
          if (await realpath(directory) !== directory) throw new Error('Dossier de sortie invalide.');

          const prefix = segments ? 'decoupe' : 'recentrage';
          const baseId = prefix + '-' + slug;
          for (let suffix = 1; ; suffix++) {
            const id = suffix === 1 ? baseId : baseId + '-' + suffix;
            const relative = `animations/custom/${id}.glb`;
            if (definitions.some(def => def.id === id || def.aliases?.includes(id) || def.path === relative)) continue;
            const output = path.join(directory, id + '.glb');
            const file = await open(output, 'wx').catch(error => {
              if (error.code !== 'EEXIST') throw error;
            });
            if (!file) continue;

            const entry: AnimationDefinition = {
              id, label, path: relative, duration, category: source.category,
              tags: [...new Set([...source.tags, ...(segments ? ['decoupe'] : []), ...(alignment ? ['recentrage'] : [])])],
              defaultOffset: alignment?.offset ?? source.defaultOffset,
              defaultRotYOffset: alignment?.rotY ?? source.defaultRotYOffset,
              equipment: source.equipment, loop: source.loop, rootMotionSpace: source.rootMotionSpace,
              variantFrom: { id: source.id, segments: segments ? exportedSegments : undefined },
            };
            const temporary = manifest + '.tmp';
            try {
              try {
                await file.writeFile(bytes);
              } finally {
                await file.close();
              }
              await writeFile(temporary, JSON.stringify([...entries, entry], null, 2) + '\n');
              await rename(temporary, manifest);
            } catch (error) {
              await Promise.all([rm(temporary, { force: true }), rm(output)]);
              throw error;
            }
            reply(201, { id, label });
            return;
          }
        }

        pending = pending.then(save).catch(error => {
          reply(400, { error: error.message });
        });
      });
    },
  };
}
