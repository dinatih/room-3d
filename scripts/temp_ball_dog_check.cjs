const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5180'}/AGENTS.md`);
    await page.evaluate(async () => {
      (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree, useFrame } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const { BeachBall } = await import('/src/features/scene/items/BeachBall.tsx');
      const { ShibaInu } = await import('/src/features/scene/items/ShibaInu.tsx');
      const { BATHTUB } = await import('/src/features/scene/bathtubData.ts');
      const { OccupancyManager } = await import('/src/features/scene/ai/occupancyManager.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { HoverOverlay, HoverRaycaster } = await import('/src/features/scene/HoverMenu.tsx');
      const { hoverState } = await import('/src/features/scene/hoverState.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { useAgentController } = await import('/src/features/scene/ai/useAgentController.ts');
      const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts');
      const e = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      function Capture() {
        window.f = { ...useThree(), THREE, OccupancyManager, cameraState, BATHTUB, hoverState, useSceneStore, useAnimPreviewStore };
        return null;
      }
      function ActorProbe() {
        const agent = useAgentController('xbot', null, false, () => ({ x: 0, y: 0, z: -200, rotY: 0 }));
        window.agent = agent;
        React.useEffect(() => { window.agentReady = true; }, []);
        useFrame((_, delta) => {
          if (!window.actorEnabled) return;
          const state = agent.update(delta);
          cameraState.positions.xbot = { x: state.x, y: state.y, z: state.z, yaw: state.rotY, anim: state.animation };
        });
        return null;
      }
      window.root = createRoot(document.getElementById('fixture'));
      window.mountPreview = async () => {
        const { SCENE_REGISTRY } = await import('/src/features/inventory/previewRegistry.tsx');
        function Preview() {
          const [animation, setAnimation] = React.useState('ff-dancewithdog');
          window.setPreviewAnimation = setAnimation;
          return e(SCENE_REGISTRY.native, { actionState: { characterAnim: animation }, onSize: () => { window.previewReady = true; } });
        }
        window.root.render(e(Canvas, { camera: { position: [200, 180, 300], far: 2000 } }, e(Capture), e('ambientLight', { intensity: 2 }), e(React.Suspense, { fallback: null }, e(Preview))));
      };
      window.root.render(e(React.Fragment, null, e(Canvas, { camera: { position: [120, 200, 100], far: 2000 } },
        e(Capture), e(ActorProbe), e(HoverRaycaster), e('ambientLight', { intensity: 2 }),
        e(React.Suspense, { fallback: null },
          e('group', { position: BATHTUB.position, rotation: BATHTUB.rotation }, e(BeachBall, { onSize: s => { window.ballSize = s.toArray(); } })),
          e(ShibaInu, { onSize: () => { window.dogReady = true; } }))), e(HoverOverlay)));
    });
    await page.waitForFunction(() => window.ballSize && window.dogReady && window.f && window.agentReady);
    const menu = await page.evaluate(() => {
      const f = window.f;
      f.setFrameloop('never');
      const dog = f.scene.getObjectByName('shiba-inu');
      const proxy = dog.children.find(child => child.userData.isHoverProxy);
      if (!proxy) throw new Error('Dog needs a selection proxy');
      f.scene.updateMatrixWorld(true);
      const target = proxy.getWorldPosition(new f.THREE.Vector3());
      f.camera.position.copy(target).add(new f.THREE.Vector3(0, 100, 200));
      f.camera.lookAt(target);
      f.camera.updateMatrixWorld(true);
      f.advance(f.clock.elapsedTime + 1 / 60);
      const p = target.clone().project(f.camera);
      const rect = f.gl.domElement.getBoundingClientRect();
      return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2 };
    });
    await page.mouse.click(menu.x, menu.y);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Danser avec le personnage actif')));
    await page.evaluate(() => {
      window.actorEnabled = true;
      window.f.useSceneStore.getState().setActiveCharacterId('xbot');
      document.addEventListener('dog-dance', e => { window.lastDogEvent = { key: e.detail.key, active: window.f.useSceneStore.getState().activeCharacterId, dog: window.f.cameraState.positions.shiba }; }, { once: true });
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Danser avec le personnage actif')).click();
      window.pendingAfterClick = window.agent.hasPendingDynamicTask();
      const f = window.f;
      for (let i = 0; i < 120; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (f.cameraState.positions.xbot.anim !== 'ff-dancewithdog') throw new Error(`Dog menu must make active character dance: ${JSON.stringify({ actor: f.cameraState.positions.xbot, event: window.lastDogEvent, pendingAfterClick: window.pendingAfterClick, pending: window.agent.hasPendingDynamicTask(), status: window.agent.getStatus(), frame: f.get().frameloop, elapsed: f.clock.elapsedTime })}`);
      for (let i = 0; i < 360; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (f.cameraState.positions.xbot.anim === 'ff-dancewithdog') throw new Error('Requested dance must finish');
      Object.assign(f.hoverState, { locked: true, lockedLabel: 'Xbot', lockedActionIds: ['select-character-xbot', 'dance-with-dog:::xbot'], lockedX: 100, lockedY: 100 });
      f.hoverState.onUpdate();
    });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Danser avec le Shiba')));
    await page.evaluate(() => {
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Danser avec le Shiba')).click();
      const f = window.f;
      f.advance(f.clock.elapsedTime + 1 / 60);
      if (f.cameraState.positions.xbot.anim !== 'ff-dancewithdog') throw new Error('NPC menu must request the dance on that NPC');
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
    await page.evaluate(() => window.mountPreview());
    await page.waitForFunction(() => window.previewReady, { timeout: 60000 });
    await page.evaluate(() => {
      const f = window.f;
      f.setFrameloop('never');
      const dog = f.scene.getObjectByName('shiba-inu');
      if (!dog) throw new Error('Inventory character dance must include a dog');
      f.useAnimPreviewStore.getState().pause();
      const seek = time => {
        f.useAnimPreviewStore.getState().seekToTime(time);
        f.advance(f.clock.elapsedTime + 1 / 60);
      };
      seek(0.25);
      const start = dog.position.clone();
      const bones = [];
      dog.traverse(o => { if (o.isBone) bones.push(o); });
      const pose = bones.map(b => ({ position: b.position.clone(), rotation: b.quaternion.clone() }));
      seek(0.45);
      if (dog.position.distanceTo(start) < 5) throw new Error('Preview dog orbit must follow timeline scrubbing');
      if (!bones.some((bone, i) => bone.position.distanceTo(pose[i].position) > 0.001 || bone.quaternion.angleTo(pose[i].rotation) > 0.001)) throw new Error('Preview jump skeleton must follow timeline scrubbing');
      const paused = dog.position.clone();
      f.advance(f.clock.elapsedTime + 1);
      if (dog.position.distanceTo(paused) > 1e-6) throw new Error('Paused preview companion must stay paused');
      if (f.useAnimPreviewStore.getState().clipName.startsWith('Shiba')) throw new Error('Dog must preserve character timeline metadata');
      if (f.cameraState.positions.shiba) throw new Error('Inventory companion must not register in scene camera state');
      window.setPreviewAnimation('idle');
    });
    await page.waitForFunction(() => !window.f.scene.getObjectByName('shiba-inu'));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(JSON.stringify(results));
    console.log('Dog hover click, active character action, NPC action, inventory companion, scrub/pause and preview isolation validated');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
