const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.ROOM_TEST_URL || 'http://127.0.0.1:5179/AGENTS.md');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const { Shower } = await import('/src/features/scene/items/Shower.tsx');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { DOOR_CONFIGS, doorCollisionState, computeDoorDynamics } = await import('/src/features/scene/doorObstacles.ts');
      const { SMART_OBJECTS } = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      const { separateAgentFromDoors } = await import('/src/features/scene/ai/agent/agentAvoidance.ts');
      const { getActionDef } = await import('/src/features/scene/objectActionRegistry.ts');
      const walls = await import('/src/features/scene/wallData.ts');
      window.fixture = { cameraState, DOOR_CONFIGS, doorCollisionState, computeDoorDynamics, SMART_OBJECTS, separateAgentFromDoors, getActionDef };
      for (const id in cameraState.positions) delete cameraState.positions[id];
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      const e = React.createElement;
      function Capture() { Object.assign(window.fixture, useThree()); return null; }
      function Fixture() {
        const [preview, setPreview] = React.useState(false);
        window.setPreview = setPreview;
        return e('group', { position: [walls.BATH_WEST_WALL + 35.5, 0, walls.SHOWER_SOUTH_WALL - 35.5] },
          e(Shower, { isPreview: preview, actionState: {}, onSize: () => { window.ready = true; } }));
      }
      createRoot(document.getElementById('fixture')).render(e(Canvas, {}, e(Capture), e(React.Suspense, { fallback: null }, e(Fixture))));
    });
    await page.waitForFunction(() => window.ready);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = await page.evaluate(() => {
      const f = window.fixture;
      const door = f.DOOR_CONFIGS.shower;
      const pivot = f.scene.getObjectByName('shower-door-pivot');
      f.setFrameloop('never');
      const tick = seconds => { for (let i = 0; i < seconds * 60; i++) f.advance(f.clock.elapsedTime + 1 / 60); };
      const check = (ok, message) => { if (!ok) throw new Error(message); };
      const position = { x: door.pivot.x + door.length / 2, y: 0, z: door.pivot.z - 15, yaw: 0, anim: 'walk' };
      f.cameraState.positions['fixture-user'] = position;
      tick(1);
      check(pivot.rotation.y > 0.5, 'NPC approaching shower must open the door');
      const entryAngle = pivot.rotation.y;
      // Traverse the doorway using the same separation applied by the NPC controller.
      const destination = f.SMART_OBJECTS.shower.slots[0].offset;
      for (const target of [destination]) {
      for (let i = 0; i < 600; i++) {
        const dx = target[0] - position.x;
        const dz = target[2] - position.z;
        const distance = Math.hypot(dx, dz);
        const step = Math.min(distance, 60 / 60);
        if (distance > 0) { position.x += dx / distance * step; position.z += dz / distance * step; }
        f.separateAgentFromDoors(position);
        tick(1 / 60);
      }
      check(Math.hypot(position.x - target[0], position.z - target[2]) < 1, `NPC must traverse the moving door: ${JSON.stringify({ position, target, angle: pivot.rotation.y })}`);
      }
      for (const slot of f.SMART_OBJECTS.shower.slots) {
        Object.assign(position, { x: slot.offset[0], y: slot.offset[1], z: slot.offset[2] });
        tick(3);
        const target = f.computeDoorDynamics(door).push;
        check(Math.abs(pivot.rotation.y - target) < 0.001, `Door must respect NPC clearance in ${slot.slotId}`);
      }
      Object.assign(position, { x: door.pivot.x + door.length / 2, z: door.pivot.z + 15 });
      tick(1);
      check(pivot.rotation.y > 0, 'NPC leaving shower must reopen the door');
      const exitAngle = pivot.rotation.y;
      delete f.cameraState.positions['fixture-user'];
      tick(3);
      check(pivot.rotation.y === 0 && f.doorCollisionState.shower.angle === 0, 'Door and collision state must close after passage');
      check(f.getActionDef('showerDoor').event === 'door-push', 'Manual action must use the common door event');
      document.dispatchEvent(new CustomEvent('door-push', { detail: { key: 'showerDoor' } }));
      tick(0.2);
      check(pivot.rotation.y > 0, 'Manual push must open the door');
      tick(4);
      check(pivot.rotation.y === 0, 'Manual push must expire and door close');
      return { entryAngle, exitAngle, allShowerSlots: true, npcReachesShower: true, manualPush: true };
    });
    await page.evaluate(() => window.setPreview(true));
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.evaluate(() => {
      const f = window.fixture;
      const door = f.DOOR_CONFIGS.shower;
      const pivot = f.scene.getObjectByName('shower-door-pivot');
      f.cameraState.positions['fixture-user'] = { x: door.pivot.x + door.length / 2, y: 0, z: door.pivot.z - 15, yaw: 0, anim: 'walk' };
      for (let i = 0; i < 60; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (pivot.rotation.y !== 0) throw new Error('Apartment NPC must not open preview door');
      document.dispatchEvent(new CustomEvent('door-push', { detail: { key: 'showerDoor' } }));
      for (let i = 0; i < 12; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (pivot.rotation.y <= 0 || f.doorCollisionState.shower.angle !== 0) throw new Error('Preview push must animate without changing apartment collision state');
    });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ...result, previewIsolated: true, browserErrors: errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
