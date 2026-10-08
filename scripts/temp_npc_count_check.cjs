const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/features/scene/characterConfig.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const config = {};
vm.runInNewContext(compiled, { exports: config, Set });

for (const activeId of [undefined, ...config.NON_EXTRA_CHARACTERS.map(character => character.id)]) {
  const selected = config.getDefaultNonExtraIds(10, activeId);
  assert.equal(selected.length, 10, `Preset count with active character ${activeId}`);
  assert.equal(new Set(selected).size, 10);
  assert(selected.includes('xbot'));
  if (activeId) assert(selected.includes(activeId));
  for (const ids of [undefined, selected, new Set(selected)]) {
    const visible = config.CHARACTERS.filter(character =>
      config.isCharacterVisibleInMode(character.id, 10, activeId, false, [], ids)
    );
    assert.equal(visible.length, 10, `Visible count with active character ${activeId}`);
    assert(visible.every(character => selected.includes(character.id)));
  }
}

// Explicit custom selections remain independent of the numerical preset.
const custom = ['xbot', 'angelina', 'rajaa'];
assert.equal(config.CHARACTERS.filter(character =>
  config.isCharacterVisibleInMode(character.id, 10, 'angelina', false, [], custom)
).length, custom.length);

for (let count = 0; count <= config.CHARACTERS.length; count++) {
  for (const activeId of config.CHARACTERS.map(character => character.id)) {
    const ids = config.getDefaultSceneCharacterIds(count, activeId);
    assert.equal(ids.length, count);
    assert.equal(new Set(ids).size, count);
    if (count > 0) assert(ids.includes(activeId));
    const mainIds = ids.filter(id => !config.isExtraCharacter(id));
    const extraIds = ids.filter(config.isExtraCharacter);
    if (count > 0) {
      assert.equal(config.CHARACTERS.filter(character =>
        config.isCharacterVisibleInMode(character.id, count, activeId, extraIds.length > 0, extraIds, mainIds)
      ).length, count);
    }
  }
}
for (const invalid of [-1, 1.5, NaN, config.CHARACTERS.length + 1]) {
  assert.throws(() => config.getDefaultSceneCharacterIds(invalid), /Nombre de personnages invalide/);
}
console.log('Every count from 0 to All: exact unique selection, active character included, extras counted, invalid counts rejected; 10-NPC regression preserved.');
