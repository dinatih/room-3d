const { createServer } = require('vite');
const launch = require('./browser-test-options.cjs');
(async () => ({ title: document.title, text: document.body.innerText.slice(0, 1500), count: (await import('/src/features/scene/ai/navigation/obstacles.ts')).furnitureObstacles.size })));
    browser.disconnect();
  });
} else
(async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 5197, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5197/?characterCount=0&skipIntro=1&preset=low&mode=top');
    await page.waitForFunction(async () => {
      const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
      return furnitureObstacles.size > 30;
    }, { timeout: 180000 });
    console.log(JSON.stringify(await page.evaluate(async () => {
      const doors = await import('/src/features/scene/doorObstacles.ts');
      const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const door = doors.DOOR_CONFIGS.entry;
      return { allowedDegrees: doors.computeDoorAllowedAngle(door) * 180 / Math.PI, door, contacts: [...furnitureObstacles.values()].filter(o => o.yMax >= door.yMin && o.yMin <= door.yMax).map(o => ({ id: o.id, owner: o.owner, polygon: o.polygon, degrees: doors.getDoorContactAngle(door, o.polygon) })).filter(o => o.degrees !== null).map(o => ({ ...o, degrees: o.degrees * 180 / Math.PI })) };
    }), null, 2));
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
