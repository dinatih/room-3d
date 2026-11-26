const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('keeps the same initial wig across discarded first renders without consuming other mannequin choices', () => {
  const Wig = () => null;
  const wigs = Array.from({ length: 6 }, (_, i) => ({ id: `hair_${i}` }));
  const { MannequinHead } = load('src/features/scene/items/MannequinHead.tsx', {
    react: { useState: init => [typeof init === 'function' ? init() : init, () => {}], useEffect() {}, useLayoutEffect() {} },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@react-three/drei': { useGLTF: { preload() {} } },
    '@features/scene/useGLTFClone': { useGLTFClone: () => ({ scene: {} }) },
    three: require('three'), '@features/scene/glbUtils': {}, '@config': {},
    './Wig': { Wig, HAIR_COLORS: { red: {}, brown: {}, black: {} } },
    '@features/inventory/inventoryData': { WIGS_ITEMS: wigs },
    '@features/scene/LaraVariants': {}, '@features/scene/characterParts': {},
    '@features/scene/character/CharacterPendant': {},
  });
  const appearance = props => MannequinHead(props).props.children.find(child => child.type === Wig).props;
  const first = appearance({ mannequinId: 'one' });
  for (let retry = 0; retry < 100; retry++) {
    const next = appearance({ mannequinId: 'one' });
    assert.equal(next.id, first.id);
    assert.equal(next.color, first.color);
  }
  const second = appearance({ mannequinId: 'two' });
  assert.notEqual(second.id, first.id);
  assert.notEqual(second.color, first.color);
  assert.equal(appearance({ mannequinId: 'one', wigId: 'hair_5', hairColor: 'white' }).id, '5');
  assert.equal(appearance({ mannequinId: 'one', wigIndex: 4 }).id, '4');
});
