const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

async function main() {
  const { Clock, Mesh } = await import('three');
  const source = fs.readFileSync('src/features/scene/BnfSkyMarker.tsx', 'utf8');
  const file = ts.createSourceFile('BnfSkyMarker.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(file) === 'useFrame') {
      assert.equal(callback, undefined, 'Expected one marker frame callback');
      callback = node.arguments[0].getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(callback, 'Marker frame callback found');
  const pulseRingRef = { current: new Mesh() };
  const frame = vm.runInNewContext(`(${callback})`, { pulseRingRef, Math });
  const originalPerformance = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  let milliseconds = 0;
  Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => milliseconds } });
  try {
    function simulate(markerVisible) {
      milliseconds = 0;
      const clock = new Clock(false);
      clock.start();
      pulseRingRef.current = markerVisible ? new Mesh() : null;
      let simulatedSeconds = 0;
      const frameCount = 120;
      for (let index = 1; index <= frameCount; index++) {
        milliseconds = index * 1000 / 60;
        simulatedSeconds += clock.getDelta();
        // Model work between R3F's time sample and the marker callback.
        milliseconds += 8;
        const oldTime = clock.oldTime;
        frame({ clock });
        if (!process.argv.includes('--expect-bug')) {
          assert.equal(clock.oldTime, oldTime, 'Marker must not consume the shared clock delta');
        }
        if (markerVisible) {
          const expectedScale = 1 + Math.sin(clock.elapsedTime * 2.8) * 0.08;
          assert.equal(pulseRingRef.current.scale.x, expectedScale);
          assert.equal(pulseRingRef.current.scale.y, expectedScale);
          assert.equal(pulseRingRef.current.scale.z, 1);
        }
      }
      return simulatedSeconds;
    }
    const hidden = simulate(false);
    const visible = simulate(true);
    console.log(JSON.stringify({ realSeconds: 2, hidden, visible, speedRatio: visible / hidden }));
    if (process.argv.includes('--expect-bug')) assert.ok(visible < hidden);
    else assert.ok(Math.abs(visible - hidden) < 1e-12, 'Marker visibility must not change simulation speed');
  } finally {
    Object.defineProperty(globalThis, 'performance', originalPerformance);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
