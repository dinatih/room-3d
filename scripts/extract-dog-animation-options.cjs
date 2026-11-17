// Rebuild preview choices from each dog's embedded GLB animation catalog.
const fs = require('node:fs');
const dogs = require('../src/features/inventory/extraDogs.json');
const options = Object.fromEntries([...dogs, { id: 'ushiro', glbPath: 'characters/ushiro/ushiro.glb' }].map(dog => {
  const buffer = fs.readFileSync(`public/${dog.glbPath}`);
  const document = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
  if (!document.animations?.length) throw new Error(`No animations: ${dog.id}`);
  return [dog.id, document.animations.map(({ name }) => {
    if (!name) throw new Error(`Unnamed animation: ${dog.id}`);
    return { value: name, label: name };
  })];
}));
fs.writeFileSync('src/features/inventory/dogAnimationOptions.json', JSON.stringify(options) + '\n');
