const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
 const page = await browser.newPage();
 await page.setViewport({width:1362,height:738});
 async function mount() {
 await page.goto('http://127.0.0.1:5173/AGENTS.md');
 await page.evaluate(async()=>{
 window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
 await import('/scss/app.scss');await import('/src/index.css');
 const {AnimationStudioView}=await import('/src/features/inventory/AnimationStudioView.tsx');
 document.body.innerHTML='<div class="inventory-overlay"><div class="inventory-modal"><div class="p-2 border-bottom">Inventaire — Animations</div><div id="test-root" class="d-flex flex-grow-1 overflow-hidden"></div></div></div>';
 createRoot(document.getElementById('test-root')).render(React.createElement(AnimationStudioView,{isMobile:innerWidth<768}));
 });
 }
 await mount();
 await page.waitForSelector('.animation-studio__transport',{timeout:60000});
 await new Promise(r=>setTimeout(r,5000));
 async function check(label) {
 const result=await page.evaluate(()=>{
 const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};
 return {preview:rect('.animation-studio__preview'), toolbar:rect('.animation-studio .view-control-bar-inline'),transport:rect('.animation-studio__transport'),annotations:rect('.animation-studio__annotations'),workspace:rect('.animation-studio__workspace'), canvas:rect('.animation-studio canvas'),modal:rect('.inventory-modal')};
 });
 console.log(label,JSON.stringify(result));
 assert(result.canvas.height>0,'canvas visible');
 assert(result.toolbar.bottom<=result.transport.top+1,'toolbar overlaps timeline');
 assert(result.transport.bottom<=result.annotations.top+1,'timeline overlaps annotations');
 assert(result.preview.top>=result.workspace.top,'actors remain above preview');
 assert(result.preview.bottom<=result.modal.bottom,'preview within modal');
 }
 await check('solo desktop');
 await page.screenshot({path:'/tmp/inventory-studio-desktop.png'});
 await page.$$eval('.animation-studio__list button',buttons=>buttons.find(b=>b.textContent.includes('Duo (')).click());
 await new Promise(r=>setTimeout(r,3000));
 await check('duo desktop');
 await page.$$eval('.animation-studio__annotations button',buttons=>buttons.find(b=>b.textContent.includes('Favori')).click());
 await page.locator('.animation-studio__annotations textarea').fill('Test persistance duo');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('room3d_dev_annotations_v1')));
 assert(Object.entries(saved).some(([k,v])=>k.startsWith('duo:')&&v.notes==='Test persistance duo'&&v.status==='favorite'));
 await mount();
 await page.waitForSelector('.animation-studio__transport');
 assert(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('room3d_dev_annotations_v1'))).some(v=>v.notes==='Test persistance duo')));
 await page.setViewport({width:390,height:844});
 await mount();
 await page.waitForSelector('.animation-studio__transport');
 await new Promise(r=>setTimeout(r,1500));
 await check('mobile');
 await page.screenshot({path:'/tmp/inventory-studio-mobile.png'});
 console.log('PASS');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
