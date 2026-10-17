const assert = require('node:assert/strict');
const fs = require('node:fs');
const THREE = require('three');

// Execute the actual frame callback with both hinges, including slow frames.
const source = fs.readFileSync('src/features/scene/items/Toilet.tsx', 'utf8');
const callback = source.split('useFrame((_, delta) => {')[1].split('\n  });')[0];
const constants = fs.readFileSync('src/features/scene/items/toiletAnimation.ts', 'utf8')
  .replaceAll('export const ', 'const ');
const makeFrame = new Function(
  'THREE', 'lidHingeRef', 'seatHingeRef', 'isLidOpenRef', 'isSeatOpenRef',
  `${constants}
  const buttonRef = { current: null };
  const invalidate = () => {};
  return (delta) => { ${callback} };`,
);
for (const open of [false, true]) {
  for (const delta of [1 / 60, 0.15, 0.25, 1]) {
    const angle = Math.PI / 2.2;
    const start = open ? 0 : -angle;
    const target = open ? -angle : 0;
    const lid = { current: { rotation: { x: start }, userData: { initialRotation: 0 } } };
    const seat = structuredClone(lid);
    const frame = makeFrame(THREE, lid, seat, { current: open }, { current: open });
    for (let elapsed = 0; elapsed < 2; elapsed += delta) {
      const previous = lid.current.rotation.x;
      frame(delta);
      for (const hinge of [lid, seat]) {
        const current = hinge.current.rotation.x;
        assert(current >= -angle && current <= 0, 'Hinge overshot its target');
        assert(Math.abs(target - current) <= Math.abs(target - previous), 'Hinge reversed direction');
      }
    }
    assert(Math.abs(target - lid.current.rotation.x) <= 0.005);
  }
}
console.log('Toilet hinges: opening and closing remain monotonic at normal and slow frame rates.');
