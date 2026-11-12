const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('CharacterShadow et BlobShadow sont bien définis et exportés', () => {
  const { BlobShadow } = load('src/features/scene/BlobShadow.tsx', {
    react: { useMemo: (fn) => fn(), useRef: () => ({ current: null }) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@react-three/fiber': { useFrame: () => {} },
    three: require('three'),
  });
  const { CharacterShadow } = load('src/features/scene/character/CharacterShadow.tsx', {
    '../BlobShadow': { BlobShadow },
    'react/jsx-runtime': require('react/jsx-runtime'),
  });
  assert.equal(typeof BlobShadow, 'function');
  assert.equal(typeof CharacterShadow, 'function');
});
