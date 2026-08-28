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

const URLS = [
    'https://www.ikea.com/fr/fr/p/pepprig-eponge-a-recurer-vert-bleu-jaune-70567650/',
    'https://www.ikea.com/fr/fr/p/rensare-sac-impermeable-10482036/',
    'https://www.ikea.com/fr/fr/p/annons-faitout-avec-couvercle-verre-acier-inoxydable-80298474/',
    'https://www.ikea.com/fr/fr/p/middagsmat-casserole-avec-couvercle-revetement-anti-adherent-verre-transparent-acier-inoxydable-60463714/',
    'https://www.ikea.com/fr/fr/p/rinnig-brosse-a-vaisselle-gris-30407814/',
    'https://www.ikea.com/fr/fr/p/tasjoen-mules-blanc-80392023/',
    'https://www.ikea.com/fr/fr/p/koelvatten-eclairage-led-avec-capteur-gris-a-pile-00594176/',
    'https://www.ikea.com/fr/fr/p/bilresa-telecommande-blanc-connecte-molette-70604172/',
    'https://www.ikea.com/fr/fr/p/kabbleka-baguette-lum-led-av-connect-usb-couleur-ajustable-10609667/',
    'https://www.ikea.com/fr/fr/p/dirigera-passerelle-pour-produits-connectes-blanc-connecte-10503406/',
    'https://www.ikea.com/fr/fr/p/myggspray-detecteur-de-mouvement-sans-fil-connecte-70604186/',
    'https://www.ikea.com/fr/fr/p/sekiner-crochet-pour-porte-blanc-60498110/',
    'https://www.ikea.com/fr/fr/p/storavan-brosse-pour-wc-blanc-noir-80423816/',
    'https://www.ikea.com/fr/fr/p/uppdatera-boite-blanc-40546471/',
    'https://www.ikea.com/fr/fr/p/ikea-365-bouteille-a-eau-gris-fonce-20480013/',
    'https://www.ikea.com/fr/fr/p/enudden-patere-pour-porte-blanc-60251665/',
    'https://www.ikea.com/fr/fr/p/klyket-crochet-pliant-aluminium-beige-50503598/'
];

async function importUrl(browser, url) {
    console.log(`\n========================================\nScraping: ${url}`);
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    let glbUrl = null;
    page.on('response', response => {
        const reqUrl = response.url();
        if (reqUrl.endsWith('.glb') || reqUrl.endsWith('.gltf')) {
            console.log('Found 3D Model URL:', reqUrl);
            glbUrl = reqUrl;
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
        await page.evaluate(() => {
            const acceptBtn = document.querySelector('#onetrust-accept-btn-handler');
            if (acceptBtn) acceptBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {}

    const productData = await page.evaluate(() => {
        const titleMeta = document.querySelector('meta[property="og:title"]');
        const descMeta = document.querySelector('meta[property="og:description"]');
        
        let name = titleMeta ? titleMeta.content.split('-')[0].trim() : 'Unknown';
        let price = '';
        let desc = descMeta ? descMeta.content : '';
        let w = 10, d = 10, h = 10;
        
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const s of scripts) {
             const text = s.textContent;
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
             const mHauteur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"(?:Hauteur|Épaisseur|Epaisseur|Diamètre)"/);
             if (mHauteur) h = parseDim(mHauteur[1]);
        }
        
        const priceEl = document.querySelector('.pip-temp-price__sr-text') || document.querySelector('.pip-price__integer');
        if (priceEl) {
            const match = priceEl.textContent.match(/[\d]+([,\.]\d+)?/);
            if (match) price = match[0];
        }

        const images = Array.from(document.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src && src.includes('images/products'))
            .map(src => src.split('?')[0]);
            
        return {
            name,
            desc,
            price,
            w, d, h,
            images: [...new Set(images)]
        };
    });

    console.log('Product Data:', productData);

    const btn3d = await page.$('.pip-see-in-3d-button, [data-testid="3d-button"]');
    if (btn3d) {
        console.log('Clicking 3D button...');
        await btn3d.click();
        await new Promise(r => setTimeout(r, 4000));
    } else {
        const idMatch = url.match(/-(\d+)\/?(?:#.*)?$/);
        if (idMatch) {
            const numericId = idMatch[1];
            const directGlb = `https://web-api.ikea.com/fr/fr/rotera/static/models/${numericId}-mini.glb`;
            console.log(`Checking direct GLB: ${directGlb}`);
            try {
                const check = await new Promise((res) => {
                    https.get(directGlb, (r) => res(r.statusCode === 200));
                });
                if (check) {
                    glbUrl = directGlb;
                    console.log('Found direct GLB URL!');
                }
            } catch (e) {}
        }
    }

    const idMatch = url.match(/-(\d+)\/?(?:#.*)?$/);
    const numericId = idMatch ? idMatch[1] : '';
    const rawName = toComponentName(productData.name);
    const componentName = `${rawName}${numericId}`;
    const baseId = `${rawName.toLowerCase()}${numericId}`;

    const itemsDir = path.resolve(process.cwd(), 'public/items', baseId);
    if (!fs.existsSync(itemsDir)) {
        fs.mkdirSync(itemsDir, { recursive: true });
    }

    const itemGlbRelPath = `items/${baseId}/${componentName}.glb`;
    const targetGlb = path.join(itemsDir, `${componentName}.glb`);

    if (glbUrl) {
        console.log(`Downloading model to ${targetGlb}`);
        await downloadFile(glbUrl, targetGlb);
    }

    const downloadedPhotos = [];
    for (let i = 0; i < productData.images.length; i++) {
        const imgUrl = productData.images[i];
        const suffix = i === 0 ? '' : `_${i}`;
        const fileName = `${componentName}${suffix}.jpg`;
        const dest = path.join(itemsDir, fileName);
        console.log(`Downloading image ${i + 1}/${productData.images.length} to ${dest}`);
        try {
            await downloadFile(imgUrl, dest);
            downloadedPhotos.push(`items/${baseId}/${fileName}`);
        } catch (e) {
            console.error(`Failed to download image ${imgUrl}`);
        }
    }

    if (glbUrl || fs.existsSync(targetGlb)) {
        console.log(`Generating component ${componentName}...`);
        const componentCode = `import { useGLTF } from '@react-three/drei';
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
  const { scene } = useGLTFClone('/${itemGlbRelPath}');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
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

useGLTF.preload('/${itemGlbRelPath}');
`;
        const componentPath = path.resolve(process.cwd(), 'src/features/scene/items', `${componentName}.tsx`);
        fs.writeFileSync(componentPath, componentCode);
        console.log(`Component created at ${componentPath}`);
    }

    // Update inventoryData.ts
    const invPath = path.resolve(process.cwd(), 'src/features/inventory/inventoryData.ts');
    let invContent = fs.readFileSync(invPath, 'utf8');

    // Determine category
    let category = 'decor';
    const lowerName = productData.name.toLowerCase();
    if (lowerName.includes('casserole') || lowerName.includes('faitout') || lowerName.includes('bouteille') || lowerName.includes('boîte') || lowerName.includes('boite') || lowerName.includes('sac') || lowerName.includes('boite')) {
        category = 'storage';
    } else if (lowerName.includes('éclairage') || lowerName.includes('baguette') || lowerName.includes('passerelle') || lowerName.includes('détecteur') || lowerName.includes('télécommande')) {
        category = 'tech';
    } else if (lowerName.includes('wc') || lowerName.includes('brosse') || lowerName.includes('éponge') || lowerName.includes('mules')) {
        category = 'bathroom';
    } else if (lowerName.includes('crochet') || lowerName.includes('patère')) {
        category = 'furniture';
    }

    const hasGlb = glbUrl || fs.existsSync(targetGlb);
    const invItemObj = {
        id: baseId,
        name: productData.name,
        brand: 'IKEA',
        category,
        qty: 1,
        dims: { w: productData.w, d: productData.d, h: productData.h },
        ...(hasGlb ? { glbPath: itemGlbRelPath } : {}),
        photos: downloadedPhotos,
        url: url,
        price: productData.price,
        notes: ''
    };

    const invItemStr = `  ${JSON.stringify(invItemObj).replace(/"([^"]+)":/g, '$1:')},`;

    // Check if already in inventory
    if (invContent.includes(`id: '${baseId}'`) || invContent.includes(`id: "${baseId}"`)) {
        console.log(`Updating ${baseId} in inventoryData.ts...`);
        const regex = new RegExp(`\\s*\\{[^\\}]*id:\\s*['"]${baseId}['"][^\\}]*\\},?`, 'g');
        invContent = invContent.replace(regex, `\n${invItemStr}`);
        fs.writeFileSync(invPath, invContent);
    } else {
        console.log(`Adding ${baseId} to inventoryData.ts...`);
        invContent = invContent.replace('export const INVENTORY: InventoryItem[] = [', `export const INVENTORY: InventoryItem[] = [\n${invItemStr}`);
        fs.writeFileSync(invPath, invContent);
    }

    // Register in previewRegistry if component exists
    if (hasGlb) {
        const regPath = path.resolve(process.cwd(), 'src/features/inventory/previewRegistry.tsx');
        let regContent = fs.readFileSync(regPath, 'utf8');
        if (!regContent.includes(`import { ${componentName} }`)) {
            regContent = `import { ${componentName} } from '@features/scene/items/${componentName}';\n` + regContent;
        }
        if (!regContent.includes(`'${baseId}':`)) {
            regContent = regContent.replace("SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {", `SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {\n  '${baseId}': ${componentName},`);
        }
        fs.writeFileSync(regPath, regContent);
    }

    await page.close();
}

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    for (const url of URLS) {
        try {
            await importUrl(browser, url);
        } catch (err) {
            console.error(`Error importing ${url}:`, err);
        }
    }

    await browser.close();
    console.log('\nAll 17 items imported successfully!');
})();
