import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.ikea.com/fr/fr/p/koppla-prise-quadruple-2-ports-usb-blanc-00314741/', { waitUntil: 'networkidle2' });
    const data = await page.evaluate(() => {
        let w=10, d=10, h=10;
        const parseDim = (valStr) => {
            let val = parseFloat(valStr.replace(',', '.'));
            if (valStr.includes('cm')) return val;
            if (valStr.includes('m')) return val * 100;
            if (valStr.includes('mm')) return val / 10;
            return val;
        };
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const s of scripts) {
             const text = s.textContent;
             const mLargeur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"Largeur"/);
             if (mLargeur) w = parseDim(mLargeur[1]);
             const mLongueur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"(?:Longueur|Profondeur)"/);
             if (mLongueur) d = parseDim(mLongueur[1]);
             const mHauteur = text.match(/"measure":"([0-9.,]+\s*(?:cm|m|mm))","name":"Hauteur"/);
             if (mHauteur) h = parseDim(mHauteur[1]);
        }
        return { w, d, h };
    });
    console.log(data);
    await browser.close();
})();
