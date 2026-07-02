const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// Paths
const debugHtmlPath = path.join(__dirname, '../cyber_sekes_debug.html');
const testHtmlPath = path.join(__dirname, '../cyber_sekes_test.html');
const resultsPath = path.join(__dirname, '../scratch/results.json');

console.log('Reading cyber_sekes_debug.html...');
let html = fs.readFileSync(debugHtmlPath, 'utf8');

// Injection script
const injection = `
    init().then(animate).then(async () => {
      console.log("Init completed, waiting 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const bone = window.models.a.getObjectByName('mixamorig_leg_left_thigh');
      if (!bone) {
        const errorMsg = "Bone mixamorig_leg_left_thigh not found in window.models.a";
        console.error(errorMsg);
        await fetch('http://localhost:8095/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: errorMsg })
        });
        return;
      }
      
      const q1 = bone.quaternion.clone();
      console.log("Quaternion 1:", q1);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const q2 = bone.quaternion.clone();
      console.log("Quaternion 2:", q2);
      
      const diffX = Math.abs(q1.x - q2.x);
      const diffY = Math.abs(q1.y - q2.y);
      const diffZ = Math.abs(q1.z - q2.z);
      const diffW = Math.abs(q1.w - q2.w);
      const maxDiff = Math.max(diffX, diffY, diffZ, diffW);
      const different = maxDiff > 0.001;
      
      const result = {
        q1: { x: q1.x, y: q1.y, z: q1.z, w: q1.w },
        q2: { x: q2.x, y: q2.y, z: q2.z, w: q2.w },
        diff: { x: diffX, y: diffY, z: diffZ, w: diffW },
        maxDiff,
        different
      };
      
      console.log("Sending results:", result);
      await fetch('http://localhost:8095/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    });
`;

// Replace init().then(animate); with our injected code
if (html.includes('init().then(animate);')) {
  html = html.replace('init().then(animate);', injection);
} else {
  console.error('Could not find init().then(animate); in HTML!');
  process.exit(1);
}

fs.writeFileSync(testHtmlPath, html, 'utf8');
console.log('Created cyber_sekes_test.html with injection.');

// Start HTTP server to receive results
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('Received results!');
      fs.writeFileSync(resultsPath, body, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('OK');
      cleanupAndExit(0);
    });
  } else {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
    } else {
      res.writeHead(404);
      res.end();
    }
  }
});

server.listen(8095, () => {
  console.log('Server listening on port 8095');
  launchChrome();
});

let chromeProcess = null;

function launchChrome() {
  // Try port 5174 first (our newly launched dev server), fallback to 5173
  const url = 'http://localhost:5174/cyber_sekes_test.html';
  console.log(`Launching chromium headless for ${url}...`);
  
  chromeProcess = spawn('chromium', [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security', // disable CORS just in case
    url
  ]);

  chromeProcess.stdout.on('data', (data) => {
    console.log(`Chrome stdout: ${data}`);
  });

  chromeProcess.stderr.on('data', (data) => {
    console.log(`Chrome stderr: ${data}`);
  });

  // Also launch for port 5173 just in case the existing dev server is there and we should use it
  setTimeout(() => {
    if (chromeProcess) {
      const urlFallback = 'http://localhost:5173/cyber_sekes_test.html';
      console.log(`Launching fallback chromium headless for ${urlFallback}...`);
      spawn('chromium', [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-web-security',
        urlFallback
      ]);
    }
  }, 2000);
}

// Timeout after 20 seconds
const timeoutId = setTimeout(() => {
  console.error('Timed out waiting for results.');
  cleanupAndExit(1);
}, 20000);

function cleanupAndExit(code) {
  clearTimeout(timeoutId);
  try {
    server.close();
  } catch (e) {}
  try {
    if (chromeProcess) chromeProcess.kill();
  } catch (e) {}
  try {
    if (fs.existsSync(testHtmlPath)) {
      fs.unlinkSync(testHtmlPath);
    }
  } catch (e) {}
  process.exit(code);
}
