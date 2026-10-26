const { createServer } = require('vite');
const launch = require('./browser-test-options.cjs');
(async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 5197, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5197/?characterCount=0&skipIntro=1&preset=low&target=studio&projection=ortho&cameraPos=west&cameraElevation=90');
    await page.waitForFunction(async () => {
      const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
      return furnitureObstacles.size > 30;
    }, { timeout: 180000 });
    await page.waitForFunction(async () => (await import('/src/features/scene/cameraState.ts')).cameraState.isSceneLaunched, { timeout: 180000 });
    const result = await page.evaluate(async () => {
      const doors = await import('/src/features/scene/doorObstacles.ts');
      const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const door = doors.DOOR_CONFIGS.living;
      return { rack: furnitureObstacles.get('kallax-se:3'), allowedDegrees: doors.computeDoorAllowedAngle(door) * 180 / Math.PI, door, contacts: [...furnitureObstacles.values()].filter(o => o.yMax >= door.yMin && o.yMin <= door.yMax).map(o => ({ id: o.id, owner: o.owner, polygon: o.polygon, degrees: doors.getDoorContactAngle(door, o.polygon) })).filter(o => o.degrees !== null).map(o => ({ ...o, degrees: o.degrees * 180 / Math.PI })) };
    });
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('door-push', { detail: { key: 'livingDoor' } })));
    result.pushAngles = [];
    for (let i = 0; i < 6; i++) {
      result.pushAngles.push(await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return (await import('/src/features/scene/doorObstacles.ts')).doorCollisionState.living.angle * 180 / Math.PI;
      }));
    }
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
