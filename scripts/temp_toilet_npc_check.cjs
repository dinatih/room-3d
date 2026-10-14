const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
 const browser = await launchBrowser({headless:true,args:['--no-sandbox']});
 try {
  for (const initiallyOpen of [false, true]) {
   const page = await browser.newPage();
   const errors = [];
   page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
   page.on('console', m => { if (m.type() === 'error') console.error(m.text()); });
   await page.goto('http://localhost:5176/scripts/temp_toilet_npc_harness.html');
   await page.waitForFunction(() => window.mount);
   await page.evaluate(open => { window.store.getState().triggerAction('wc-lid-toggle', open); window.events = []; window.mount(); }, initiallyOpen);
   await page.waitForFunction(() => window.agent);
   const result = await page.evaluate(() => {
    let sawUse = false, sawStandUp = false, closedAfterStanding = false, finished = false;
    let openingFrames = 0, closingFrames = 0;
    const waits = window.sequence.filter(s => s.triggerEventKey === 'wc-lid-toggle');
    if (waits.some(s => s.type !== 'WAIT' || s.animation !== 'idle')) throw new Error('Lid steps must be idle waits');
    for (let frame = 0; frame < 18000; frame++) {
     const state = window.agent.update(1/60);
     const lidEvents = window.events.filter(e => e.key === 'wc-lid-toggle');
     const flushed = window.events.some(e => e.key === 'wc-flush');
     if (flushed && (state.animation === 'sitting-idle' || state.animation === 'sit-to-stand')) {
      throw new Error('PNJ must not sit down after flushing: ' + state.animation);
     }
     if (state.animation !== 'sitting-idle' && lidEvents.length && !flushed && window.agent.getStatus() === 'INTERACTING' && (!sawUse || lidEvents.length === 2)) {
      if (state.animation !== window.idleAnimation) throw new Error('PNJ must stand idle while lid moves: ' + state.animation);
      if (state.x !== 50 || state.z !== 500) throw new Error('PNJ moved during lid wait');
      if (lidEvents.length === 1) openingFrames++; else closingFrames++;
     }
     if (state.animation === 'sitting-idle') {
      sawUse = true;
      if (lidEvents.length !== 1 || lidEvents[0].value !== true) throw new Error('Lid must open before sitting and stay open during use');
     }
     if (state.animation === 'sit-to-stand') {
      sawStandUp = true;
      if (lidEvents.length !== 1) throw new Error('Lid closed before standing up');
     }
     if (lidEvents.length === 2) closedAfterStanding = sawStandUp;
     if (window.agent.getStatus() === 'FINISHED') { finished = true; break; }
    }
    const minimumWaitFrames = Math.floor(waits[0].duration * 60) - 1;
    if (openingFrames < minimumWaitFrames || closingFrames < minimumWaitFrames) throw new Error('Lid wait shorter than hinge movement');
    return {sawUse, sawStandUp, closedAfterStanding, finished, openingFrames, closingFrames, events: window.events};
   });
   assert.equal(result.finished, true);
   assert.equal(result.sawUse, true);
   assert.equal(result.sawStandUp, true);
   assert.equal(result.closedAfterStanding, true);
   assert.deepEqual(result.events.filter(e => e.key.startsWith('wc-')), [{key:'wc-lid-toggle',value:true},{key:'wc-lid-toggle',value:false},{key:'wc-flush',value:true}]);
   assert.deepEqual(errors, []);
   console.log(`Lid initially ${initiallyOpen ? 'open' : 'closed'}: standing waits ${result.openingFrames}/${result.closingFrames} frames, then sitting/standing/flush/hand washing verified.`);
   await page.close();
  }
 } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
