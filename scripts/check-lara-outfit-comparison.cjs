const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox']});
 try {
  const page = await browser.newPage();
  await page.setViewport({width:1440,height:1100});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',r=>{const u=new URL(r.url()); return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
  await page.goto(`${process.env.LARA_COMPARISON_URL || 'http://127.0.0.1:5174'}/lara-outfit-comparison.html`);
  await page.waitForFunction(()=>document.querySelector('canvas') && document.body.innerText.includes('4 tenues'),{timeout:60000});
  await new Promise(r=>setTimeout(r,12000));
  await page.screenshot({path:'/tmp/lara-outfit-comparison.png'});
  console.log('Page errors:',errors);
  console.log(await page.evaluate(()=>document.body.innerText.slice(-1400)));
  assert.equal(errors.length,0);
  await page.evaluate(() => {
   const labels = [...document.querySelectorAll('label')];
   const select = labels.find(l => l.textContent.startsWith('Perruque')).querySelector('select');
   select.value = select.options[1].value; select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r=>setTimeout(r,3000));
  await page.evaluate(() => {
   const select = [...document.querySelectorAll('label')].find(l => l.textContent.startsWith('Animation commune')).querySelector('select');
   select.value = 'walking'; select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r=>setTimeout(r,5000));
  assert.equal(errors.length,0);
  const button=await page.$('button.btn-primary.btn-sm');
  assert.ok(button);
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Dupliquer').click());
  await page.waitForFunction(()=>document.body.innerText.includes('5 tenues'));
  console.log('PASS: page loads and outfit duplication works');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
