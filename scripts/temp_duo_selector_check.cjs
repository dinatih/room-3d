const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await launchBrowser({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
    await page.evaluate(async () => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { AnimFrameController } = await import('/src/features/inventory/AnimFrameController.tsx');
      const { DUO_ANIMATIONS } = await import('/src/features/scene/animations/duoAnimations.ts');
      window.DUO_ANIMATIONS = DUO_ANIMATIONS;
      window.selectedDuo = null;
      window.selectedPartner = null;

      document.body.innerHTML = '<div id="root"></div>';
      document.body.style.margin = '0';
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/node_modules/bootstrap/dist/css/bootstrap.min.css';
      document.head.append(css);
      await import('/src/features/scene/ViewControlBar.scss');
      const layout = document.createElement('style');
      layout.textContent = '.anim-frame-controller__controls { display: flex; }';
      document.head.append(layout);

      function Wrapper() {
        const [duo, setDuo] = React.useState(undefined);
        const [partner, setPartner] = React.useState('native');
        return React.createElement(AnimFrameController, {
          animKey: 'idle',
          isHumanCharacter: true,
          duoAnimDef: duo,
          duoPartnerId: partner,
          onSelectDuoAnim: d => {
            setDuo(d);
            window.selectedDuo = d;
          },
          onSelectDuoPartner: p => {
            setPartner(p);
            window.selectedPartner = p;
          },
        });
      }

      createRoot(document.getElementById('root')).render(React.createElement(Wrapper));
    });

    await page.waitForSelector('button[title="Choisir une animation Duo"]');

    // 1. Ouvrir le sélecteur Duo
    await page.click('button[title="Choisir une animation Duo"]');
    await page.waitForSelector('input[placeholder="Filtrer animation duo..."]');

    // Vérifier les onglets de filtrage
    const filterTabs = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      return {
        combatTab: buttons.some(b => b.textContent.includes('Combat')),
        danseTab: buttons.some(b => b.textContent.includes('Danse & Duo')),
        toutesTab: buttons.some(b => b.textContent.includes('Toutes')),
      };
    });
    assert(filterTabs.combatTab && filterTabs.danseTab && filterTabs.toutesTab, 'Les onglets de filtrage doivent être présents');

    // 2. Sélectionner une animation Duo
    await page.evaluate(() => {
      const items = [...document.querySelectorAll('.overflow-auto .border-bottom')];
      const target = items.find(it => it.textContent.includes('Pop Dance'));
      if (target) target.click();
    });

    await page.waitForFunction(() => window.selectedDuo !== null && window.selectedDuo.id === 'pop_dance');

    // 3. Vérifier que les contrôles Partenaire B apparaissent
    await page.waitForSelector('button[title="Changer le partenaire (Rôle B)"]');
    const partnerButtonText = await page.evaluate(() => {
      return document.querySelector('button[title="Changer le partenaire (Rôle B)"]').textContent;
    });
    assert(partnerButtonText.includes('B:'), 'Le bouton partenaire B doit afficher B:');

    // 4. Ouvrir le sélecteur de partenaire
    await page.click('button[title="Changer le partenaire (Rôle B)"]');
    await page.waitForSelector('.row.row-cols-2 button');

    // Sélectionner un autre partenaire
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('.row.row-cols-2 button')];
      const target = buttons.find(b => b.textContent.includes('Rosanna'));
      if (target) target.click();
    });

    await page.waitForFunction(() => window.selectedPartner === 'rosanna');

    // 5. Quitter le mode duo
    await page.click('button[title="Quitter le mode duo"]');
    await page.waitForFunction(() => window.selectedDuo === undefined);

    console.log('TEST PASSED: DuoAnimSelector and DuoPartnerSelector work as expected.');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
