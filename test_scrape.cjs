const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

(async () => {
    const url = process.argv[2];
    if (!url) {
        console.error('Please provide an IKEA URL.');
        process.exit(1);
    }

    console.log(`Scraping: ${url}`);
    
    // Launch puppeteer
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // We want to intercept GLB responses
    let glbUrl = null;
    page.on('response', response => {
        const reqUrl = response.url();
        if (reqUrl.endsWith('.glb')) {
            console.log('Found GLB URL:', reqUrl);
            glbUrl = reqUrl;
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Accept cookies if present (IKEA often has a cookie banner that blocks clicks)
    try {
        await page.evaluate(() => {
            const acceptBtn = document.querySelector('#onetrust-accept-btn-handler');
            if (acceptBtn) acceptBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
        // ignore
    }

    // Extract product details
    const productInfo = await page.evaluate(() => {
        const nameEl = document.querySelector('.pip-header-section__title--big');
        const descEl = document.querySelector('.pip-header-section__description-text');
        const priceEl = document.querySelector('.pip-price__integer');
        const priceDecEl = document.querySelector('.pip-price__decimal');
        
        // try fallback selectors if above are not found
        const name = nameEl ? nameEl.textContent.trim() : (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : 'Unknown');
        const desc = descEl ? descEl.textContent.trim() : '';
        const price = priceEl ? priceEl.textContent.trim() + (priceDecEl ? priceDecEl.textContent.trim() : '') : '';
        
        // Extract images
        const imgEls = document.querySelectorAll('.pip-image');
        const images = [];
        imgEls.forEach(img => {
            if (img.src && !img.src.includes('svg')) {
                images.push(img.src);
            }
        });
        
        return { name, desc, price, images: [...new Set(images)] };
    });
    
    console.log('Product Info:', productInfo);

    // Look for 3D button and click it
    console.log('Looking for 3D button...');
    await page.evaluate(() => {
        // Find buttons containing "3D" text or having a specific icon/class
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn3d = buttons.find(b => b.textContent && b.textContent.includes('3D'));
        if (btn3d) {
            btn3d.click();
        } else {
            // Check for specific pip-btn or something similar if text isn't directly "3D"
            // IKEA 3D button often has an icon. Let's click any button that has "3D" in its aria-label or text.
            const btnAria = buttons.find(b => b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('3D'));
            if (btnAria) {
                btnAria.click();
            } else {
                console.log('3D button not found directly.');
            }
        }
    });

    // Wait some time to see if the network request for GLB is triggered
    await new Promise(r => setTimeout(r, 5000));
    
    // If not found by click, let's search if it's already in the page source (sometimes it's in a JSON script)
    if (!glbUrl) {
        console.log('GLB not found via network, checking page source...');
        const source = await page.content();
        const match = source.match(/https:\/\/[^"']+\.glb/);
        if (match) {
            glbUrl = match[0];
            console.log('Found GLB URL in source:', glbUrl);
        }
    }

    if (glbUrl) {
        console.log('Downloading GLB...');
        // Download GLB
        // For testing, just log it.
        console.log(`Found GLB to download: ${glbUrl}`);
    } else {
        console.log('No GLB found.');
    }

    await browser.close();
})();
