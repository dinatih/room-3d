const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('réserve les monuments au panorama Paris de nuit et respecte leurs calques', () => {
  for (const currentHdri of ['default', 'other']) for (const enabled of [false, true]) {
    let light = 1, frame, refs = [];
    const { ParisLandmarkLights } = load('src/features/scene/ParisLandmarkLights.tsx', {
      three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
      react: { useMemo: fn => fn(), useRef: value => { const ref = { current: value }; refs.push(ref); return ref; } },
      '@react-three/fiber': { useFrame: fn => { frame = fn; } },
      './astronomy': { simulatedHour: () => 12, daylight: () => light },
      './store/useSceneStore': { useSceneStore: select => select({ currentHdri, layers: { montparnasseLights: enabled, bnfLights: enabled, arcLights: enabled, bridgeLights: enabled, champDeMarsLights: enabled, avenueLights: enabled, boisLights: enabled } }) },
    });
    const monuments = ParisLandmarkLights({ skyRadius: 3600 });
    assert.equal(monuments.length, 7);
    for (const monument of monuments) {
      refs = [];
      const tree = monument.type(monument.props);
      refs[0].current = new THREE.Group();
      refs[1].current = new THREE.PointsMaterial();
      refs[2].current = new THREE.PointsMaterial();
      light = 1; frame({ clock: { elapsedTime: 0 } });
      assert.equal(refs[0].current.visible, false);
      light = 0; frame({ clock: { elapsedTime: 0.5 } });
      assert.equal(refs[0].current.visible, enabled && currentHdri === 'default');
      assert.equal(refs[1].current.opacity, 0.55);
      const positions = tree.props.children[0].props.children[0].props.children.props.args[0];
      for (let i = 0; i < positions.length; i += 3) {
        const radius = Math.hypot(...positions.subarray(i, i + 3));
        assert(Math.abs(radius - 3600 * 0.992) < 0.001, 'chaque lumière reste sur le dôme');
        if (tree.props.name === 'ArcDeTriompheLights') {
          const az = Math.atan2(positions[i + 2], -positions[i]);
          const x = az / (2 * Math.PI) * 7978 + 7978;
          const y = (0.5 - Math.asin(positions[i + 1] / radius) / Math.PI) * 3989;
          assert(!(x > 5008 && x < 5011 && y > 2138), 'le passage de l’Arc reste ouvert');
        }
      }
      if (tree.props.name === 'MontparnasseLights') {
        const peak = refs[2].current.opacity;
        frame({ clock: { elapsedTime: 1.5 } });
        assert(refs[2].current.opacity < peak, 'la balise de Montparnasse continue de pulser');
      }
    }
  }
});
