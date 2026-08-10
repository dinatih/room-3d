import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import https from 'https';

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
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

const url = process.argv[2];
if (!url) {
    console.error('Please provide an IKEA URL.');
    process.exit(1);
}

const toCamelCase = (str) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return word.toUpperCase();
    }).replace(/\s+/g, '');
};

const toComponentName = (name) => {
    const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanName = normalized.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/)[0];
    return toCamelCase(cleanName.toLowerCase());
};

(async () => {
    console.log(`Scraping: ${url}`);
    
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    let glbUrl = null;
    page.on('response', response => {
        const reqUrl = response.url();
        if (reqUrl.endsWith('.glb') || reqUrl.endsWith('.gltf')) {
            console.log('Found 3D Model URL:', reqUrl);
            glbUrl = reqUrl;
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        await page.evaluate(() => {
            const acceptBtn = document.querySelector('#onetrust-accept-btn-handler');
            if (acceptBtn) acceptBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
        // ignore
    }

    const productData = await page.evaluate(() => {
        const titleMeta = document.querySelector('meta[property="og:title"]');
        const descMeta = document.querySelector('meta[property="og:description"]');
        
        let name = titleMeta ? titleMeta.content.split('-')[0].trim() : 'Unknown';
        let price = '';
        let desc = '';
        let w = 10, d = 10, h = 10;
        
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const s of scripts) {
             const text = s.textContent;
             
             // Extract description (no longer using full paragraphs, will use og:description instead)
             
             // Extract dimensions
             const parseDim = (valStr) => {
                 let val = parseFloat(valStr.replace(',', '.'));
                 if (valStr.includes('cm')) return val;
                 if (valStr.includes('m')) return val * 100;
                 if (valStr.includes('mm')) return val / 10;
                 return val;
             };
             const mLargeur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"Largeur"/);
             if (mLargeur) w = parseDim(mLargeur[1]);
             const mLongueur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"(?:Longueur|Profondeur)"/);
             if (mLongueur) d = parseDim(mLongueur[1]);
             const mHauteur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"(?:Hauteur|Épaisseur|Epaisseur)"/);
             if (mHauteur) h = parseDim(mHauteur[1]);
        }
        
        // Extract price
        const intEl = document.querySelector('[class*="price__integer"]');
        const decEl = document.querySelector('[class*="price__decimal"], [class*="price__decimals"]');
        if (intEl) {
            price = intEl.textContent.trim();
            if (decEl) {
                // Ignore the comma if it's separate or just use the decEl text
                const decText = decEl.textContent.trim();
                if (decText.startsWith(',')) {
                    price += decText;
                } else if (decText) {
                    price += ',' + decText;
                }
            }
        }
        
        if (!desc || desc.includes("Découvrez notre produit")) {
            const summaryEl = document.querySelector('[class*="overview-summary__description"]');
            if (summaryEl) {
                desc = summaryEl.textContent.trim();
            } else {
                const descMeta = document.querySelector('meta[property="og:description"]');
                const titleMetaStr = titleMeta ? titleMeta.content.trim() : '';
                if (descMeta) {
                    desc = descMeta.content.trim();
                    if (titleMetaStr && desc.startsWith(titleMetaStr)) {
                        desc = desc.substring(titleMetaStr.length).trim();
                    }
                }
            }
        }

        // Grab all product images
        const gallery = document.querySelector('.pip-product-gallery__left-section-wrapper, [class*="product-gallery__left-section-wrapper"]') || document;
        const imgs = Array.from(gallery.querySelectorAll('img.pip-image, img'));
        let imageUrls = imgs
            .map(img => img.src)
            .filter(src => src && src.includes('images/products') && (src.endsWith('.jpg') || src.endsWith('.png') || src.endsWith('.webp') || src.includes('.jpg?')));
            
        // Strip query params and deduplicate
        imageUrls = imageUrls.map(url => url.split('?')[0]);
        imageUrls = [...new Set(imageUrls)];
        
        // Optionally filter by item name if it's in the URL to avoid recommended products
        if (imageUrls.length > 0) {
            const mainSlugMatch = imageUrls[0].match(/products\/([a-z0-9-]+)__/);
            if (mainSlugMatch) {
                const slug = mainSlugMatch[1];
                imageUrls = imageUrls.filter(url => url.includes(slug));
            }
        }
            
        return {
            name, desc, price, w, d, h, images: imageUrls
        };
    });

    const imgUrls = productData.images;

    console.log('Product Data:', productData);
    
    console.log('Looking for 3D button...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn3d = buttons.find(b => 
            (b.textContent && b.textContent.includes('3D')) || 
            (b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('3D'))
        );
        if (btn3d) {
            btn3d.click();
        }
    });

    await new Promise(r => setTimeout(r, 5000));
    
    if (!glbUrl) {
        console.log('GLB not found via network, checking page source...');
        const source = await page.content();
        const match = source.match(/https:\/\/[^"']+\.glb/);
        if (match) {
            glbUrl = match[0];
            console.log('Found GLB URL in source:', glbUrl);
        }
    }

    await browser.close();

    if (!glbUrl) {
        console.log('No GLB found. Ensure this product actually has a 3D model.');
        process.exit(1);
    }

    const urlParts = url.replace(/\/$/, '').split('-');
    const articleId = urlParts[urlParts.length - 1].replace(/[^0-9]/g, '') || Math.floor(Math.random()*10000000).toString();
    const componentName = toComponentName(productData.name) + articleId;
    console.log(`Generating component ${componentName}...`);

    const glbFileName = `${componentName}.glb`;
    const glbDir = path.resolve('public/media/glb/ikea-official');
    fs.mkdirSync(glbDir, { recursive: true });
    const glbPath = path.resolve(glbDir, glbFileName);
    
    console.log(`Downloading model to ${glbPath}`);
    await downloadFile(glbUrl, glbPath);

    if (imgUrls && imgUrls.length > 0) {
        for (let i = 0; i < imgUrls.length; i++) {
            const url = imgUrls[i];
            const urlObj = new URL(url);
            const ext = path.extname(urlObj.pathname) || '.jpg';
            // First image has no suffix, others have _1, _2 etc.
            const suffix = i === 0 ? '' : `_${i}`;
            const imgFileName = `${componentName}${suffix}${ext}`;
            const imgDir = path.resolve('public/media/ikea-official', componentName.toLowerCase());
            fs.mkdirSync(imgDir, { recursive: true });
            const imgPath = path.resolve(imgDir, imgFileName);
            console.log(`Downloading image ${i+1}/${imgUrls.length} to ${imgPath}`);
            await downloadFile(url, imgPath);
        }
    }

    const compContent = `import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * ${productData.name}
 * Price: ${productData.price}
 * URL: ${url}
 */
export function ${componentName}({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/media/glb/ikea-official/${glbFileName}');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/media/glb/ikea-official/${glbFileName}');
`;

    const compPath = path.resolve('src/features/scene/items', `${componentName}.tsx`);
    fs.writeFileSync(compPath, compContent);
    console.log(`Component created at ${compPath}`);
    
    const inventoryPath = path.resolve('src/features/inventory/inventoryData.ts');
    if (fs.existsSync(inventoryPath)) {
        let invContent = fs.readFileSync(inventoryPath, 'utf-8');
        const photoPaths = imgUrls.map((url, i) => {
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const suffix = i === 0 ? '' : `_${i}`;
            return `'media/ikea-official/${componentName.toLowerCase()}/${componentName}${suffix}${ext}'`;
        }).join(', ');
        
        const newEntry = `
  { id: '${componentName.toLowerCase()}', name: "${productData.name.replace(/"/g, '\\"')}", brand: 'IKEA', category: 'furniture', qty: 1, dims: { w: ${productData.w}, d: ${productData.d}, h: ${productData.h} }, glbPath: 'media/glb/ikea-official/${glbFileName}', photos: [${photoPaths}], url: '${url}', price: '${productData.price}', notes: '' },`;
        
        invContent = invContent.replace('export const INVENTORY: InventoryItem[] = [', 'export const INVENTORY: InventoryItem[] = [' + newEntry);
        fs.writeFileSync(inventoryPath, invContent);
        console.log('Added to inventoryData.ts');
    }

    console.log('Done!');
})();
