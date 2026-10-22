const fs=require('node:fs');
const assert=require('node:assert/strict');
const launch=require('./browser-test-options.cjs');
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:5202,strictPort:true},plugins:[{name:'drona-test',configureServer(server){server.middlewares.use('/__drona-test',async (_req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__drona-test', '<html><body><script type="module" src="/tests/support/drona-carry.mjs"></script></body></html>'));});}}]});
 let browser;
 try{
  await server.listen();console.log('server ready');browser=await launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],timeout:30000});
  console.log('browser ready');const page=await browser.newPage();await page.setViewport({width:1200,height:800});
  let rejectPage;const failed=new Promise((_,reject)=>{rejectPage=reject;});
  const errors=[];page.on('pageerror',e=>{errors.push(String(e));rejectPage(e);});page.on('console',m=>{if(m.type()==='error')process.stderr.write(m.text()+'\n');});
  await page.goto('http://127.0.0.1:5202/__drona-test');await Promise.race([page.waitForFunction(()=>window.dronaTest,{timeout:30000}),failed]);
  const sequences=await page.evaluate(()=>window.dronaTest.check()),poses=[];
  for(const character of ['xbot','vivida'])for(const variant of ['pyjama','upper'])for(const [phase,time]of [['pull',1.2],['pull',2.6],['pull',5.6],['search',1.5],['search',2.9],['push',5.6]]){
   poses.push(await page.evaluate((...args)=>window.dronaTest.pose(...args),character,variant,phase,time));
   if(time===5.6||phase==='search'){
    await page.screenshot({path:`/tmp/drona-${character}-${variant}-${phase}-${time}.png`});
    await page.evaluate((...args)=>window.dronaTest.pose(...args),character,variant,phase,time,'side');
    await page.screenshot({path:`/tmp/drona-${character}-${variant}-${phase}-${time}-side.png`});
   }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync('/tmp/drona-carry-check.json',JSON.stringify({sequences,poses,errors},null,2));
  console.log('Drona carry checks:',JSON.stringify({sequences,poses:poses.length,errors}));
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
