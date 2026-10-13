const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/AGENTS.md');
    await page.evaluate(async () => {
      (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const { BeachBall } = await import('/src/features/scene/items/BeachBall.tsx');
      const { ShibaInu } = await import('/src/features/scene/items/ShibaInu.tsx');
      const { BATHTUB } = await import('/src/features/scene/bathtubData.ts');
      const { OccupancyManager } = await import('/src/features/scene/ai/occupancyManager.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const e = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      function Capture() {
        window.f = { ...useThree(), THREE, OccupancyManager, cameraState, BATHTUB };
        return null;
      }
      createRoot(document.getElementById('fixture')).render(e(Canvas, { camera: { position: [120, 200, 100], far: 2000 } },
        e(Capture), e('ambientLight', { intensity: 2 }),
        e(React.Suspense, { fallback: null },
          e('group', { position: BATHTUB.position, rotation: BATHTUB.rotation }, e(BeachBall, { onSize: s => { window.ballSize = s.toArray(); } })),
          e(ShibaInu, { onSize: () => { window.dogReady = true; } }))));
    });
    await page.waitForFunction(() => window.ballSize && window.dogReady);
    const results = await page.evaluate(() => {
      const f = window.f;
      f.setFrameloop('never');
      const ball = f.scene.getObjectByName('beach-ball');
      const dog = f.scene.getObjectByName('shiba-inu');
      const check = (ok, message) => { if (!ok) throw new Error(message); };
      const tick = seconds => { for (let i = 0; i < seconds * 60; i++) f.advance(f.clock.elapsedTime + 1 / 60); };
      check(window.ballSize.every(n => n === 25), 'Ball diameter must be 25 cm');
      const start = ball.position.clone();
      tick(3);
      check(Math.hypot(ball.position.x - start.x, ball.position.z - start.z) > 0.5, 'Ball must drift horizontally');
      const before = ball.position.clone();
      f.OccupancyManager.claimSlot('bathtub-garden', 'center', 'fixture-user');
      tick(0.5);
      check(Math.hypot(ball.position.x - before.x, ball.position.z - before.z) > 10, 'Smart object reservation must produce a visible impulse');
      let rebound = false;
      let previousDZ = null;
      for (let i = 0; i < 600; i++) {
        const z = ball.position.z;
        tick(1 / 60);
        const dz = ball.position.z - z;
        if (previousDZ !== null && dz * previousDZ < 0) rebound = true;
        previousDZ = dz;
        const segment = f.BATHTUB.length / 2 - f.BATHTUB.cornerRadius;
        const radius = f.BATHTUB.cornerRadius - f.BATHTUB.wallThickness - 12.5;
        check(Math.hypot(ball.position.x, ball.position.z - f.THREE.MathUtils.clamp(ball.position.z, -segment, segment)) <= radius + 1e-8, 'Ball must stay inside rounded walls');
      }
      check(rebound, 'Impulse must bounce off the end wall');
      f.OccupancyManager.releaseAllForCharacter('fixture-user');
      const world = ball.parent.localToWorld(new f.THREE.Vector3(ball.position.x - 20, 0, ball.position.z));
      f.cameraState.positions['fixture-user'] = { x: world.x, y: 0, z: world.z, yaw: 0, anim: 'idle' };
      const contactStart = ball.position.clone();
      tick(0.5);
      check(ball.position.distanceTo(contactStart) > 2, 'NPC contact in rotated tub must push ball');
      f.cameraState.positions['fixture-user'] = { x: 120, y: 0, z: -300, yaw: Math.PI / 2, anim: 'ff-dancewithdog' };
      tick(3);
      check(Math.abs(Math.hypot(dog.position.x - 120, dog.position.z + 300) - 75) < 5, 'Dog must dance 75 cm from owner');
      const dogStart = dog.position.clone();
      let orbitTravel = 0;
      for (let i = 0; i < 60; i++) {
        tick(1 / 60);
        orbitTravel = Math.max(orbitTravel, dog.position.distanceTo(dogStart));
      }
      check(orbitTravel > 5, 'Dog must orbit while dancing');
      const bones = [];
      dog.traverse(o => { if (o.isBone) bones.push(o); });
      const pose = bones.map(b => b.position.clone());
      tick(0.2);
      check(bones.some((b, i) => b.position.distanceTo(pose[i]) > 0.001), 'Dog jump animation must move skeleton');
      f.cameraState.positions['fixture-user'].anim = 'idle';
      const end = dog.position.clone();
      tick(3);
      check(dog.position.distanceTo(end) > 10, 'Dog must resume autonomous walking');
      return { diameter: 25, horizontalDrift: true, smartObjectImpulse: true, roundedWallRebound: true, rotatedNpcContact: true, dogOrbit: true, animatedJump: true, dogResumesWalking: true };
    });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
