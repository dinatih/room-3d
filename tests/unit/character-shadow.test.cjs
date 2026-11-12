const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('CharacterShadow est bien défini et exporté', () => {
  const { CharacterShadow } = load('src/features/scene/character/CharacterShadow.tsx', {
    react: { useMemo: (fn) => fn(), useRef: () => ({ current: null }) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@react-three/fiber': { useFrame: () => {} },
    three: require('three'),
  });
  assert.equal(typeof CharacterShadow, 'function');
});
