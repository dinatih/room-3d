const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
(async () => {
  const puppeteer = require('puppeteer');
  const browser = await launchBrowser({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', message => { if (message.text().startsWith('Controlled exit:') || message.text().startsWith('Agent trace:') || message.type() === 'error') console.log('CONSOLE:', message.text()); });
    page.on('requestfailed', request => console.log('REQUEST:', request.url(), request.failure()?.errorText));
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE:', error.message); });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5174'}/AGENTS.md`);
    await page.evaluate(async () => {
      (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useFrame, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const nav = await import('/src/features/scene/ai/navigation/service.ts');
      const registry = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const { doorCollisionState, DOOR_CONFIGS, computeDoorAllowedAngle, getDoorContactAngle } = await import('/src/features/scene/doorObstacles.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { useDeskScreenVideo } = await import('/src/features/scene/utils/deskScreenVideo.ts');
      const { useAgentController } = await import('/src/features/scene/ai/useAgentController.ts');
      const { resetAppIdle } = await import('/src/features/scene/idleState.ts');
      window.resolveCoords = (await import('/src/features/scene/ai/agent/agentInstructionCoords.ts')).resolveInstructionCoords;
      window.smartObjects = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      window.furnitureState = await import('/src/features/scene/furniturePositions.ts');
      window.positionState = (await import('/src/features/scene/positionState.ts')).positionState;
      window.cameraState = (await import('/src/features/scene/cameraState.ts')).cameraState;
      const e = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      window.geom = await import('/src/features/scene/ai/navigation/geometry.ts');
      window.nav = { ...nav, ...registry, doorCollisionState, DOOR_CONFIGS, computeDoorAllowedAngle, getDoorContactAngle, useSceneStore };
      function Probe() {
        window.fixtureScene = useThree().scene;
        window.videoResult = useDeskScreenVideo();
        window.fixtureScene.visible = false;
        const scenario = React.useMemo(() => [
          ...window.smartObjects.buildSmartObjectInstructionSequence('desk-bollsidan-2', 'work-standing'),
        ], []);
        const agent = useAgentController('probe', scenario, false, () => ({ x: 80, y: 0, z: 400, rotY: 0 }));
        window.agent = agent;
        useFrame((_, dt) => {
          resetAppIdle();
          if (window.runAgent) { window.agentState = { ...agent.update(dt) }; window.agentStatus = agent.getStatus(); }
        });
        return null;
      }
      window.root = createRoot(document.getElementById('fixture'));
      window.nav.setAgentProfile('probe', { radius: 20, height: 170 });
      const desk = window.smartObjects.getSmartObject('desk-bollsidan-2');
      registry.registerObstacle({ id: desk.id, owner: desk.id, polygon: window.geom.rectangle(desk.position[0], desk.position[2], 68, 36, desk.rotationY), yMin: 0, yMax: 105 });
      window.root.render(e(Canvas, {}, e(Probe)));
    });
    await page.waitForFunction(() => window.agent && window.videoResult);
    console.log('Scene assets ready:', await page.evaluate(() => ({ profile: window.nav.getAgentProfile('probe'), obstacles: window.nav.furnitureObstacles.size })));
    await page.evaluate(() => {
      window.nav.setAgentProfile('probe', window.nav.getAgentProfile('probe'));
      window.agent.setPosition(80, 0, 380);
    });
    for (let i = 0; i < 1000; i++) {
      const status = await page.evaluate(() => { window.agent.update(0.1); return window.agent.getStatus(); });
      if (status === 'INTERACTING' || status === 'BLOCKED') { console.log('STATUS', status); break; }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    console.log('RESULT', await page.evaluate(() => ({ status: window.agent.getStatus(), video: window.videoResult && { active: window.videoResult.isVideoActive, width: window.videoResult.texture?.image.videoWidth, paused: window.videoResult.texture?.image.paused }, enabled: window.nav.useSceneStore.getState().screenVideosEnabled, active: window.nav.useSceneStore.getState().desk2ScreenActive, debug: window.nav.navigationDebug.get('probe') })));
    await page.waitForFunction(() => window.videoResult?.texture?.image.videoWidth > 0 && !window.videoResult.texture.image.paused);
    assert.equal(await page.evaluate(() => window.agent.getStatus()), 'INTERACTING');
    await page.evaluate(() => window.agent.update(34));
    await page.waitForFunction(() => !window.videoResult.isVideoActive);
    assert.equal(await page.evaluate(() => window.nav.useSceneStore.getState().desk2ScreenActive), false);
    console.log('Desk smart action starts and stops playback with its interaction.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
