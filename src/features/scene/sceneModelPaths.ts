import models from './scene-models.json';

/** Only audited models have a reduced scene variant; previews use the originals. */
export function sceneModelPath(path: string): string {
  return (models as Record<string, string>)[`/${path.replace(/^\/+/, '')}`] ?? path;
}
