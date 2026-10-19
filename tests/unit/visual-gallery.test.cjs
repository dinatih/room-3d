const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeGallery, writeHistory } = require('../support/visual-gallery.cjs');

describe('Historique visuel hors ligne', () => {
    it('conserve les exécutions, les deux projections et les liens relatifs', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'room-visual-'));
        try {
            for (const id of ['2026-10-19', '2026-10-20']) {
                const manifest = { id, commit: id, createdAt: id, status: 'passed', label: '</script><script>bad()</script>', viewport: { width: 1280, height: 720 },
                    captures: ['ortho', 'persp'].map(projection => ({ view: 'front', label: 'Face', projection, file: `front-${projection}.png`, kind: 'image' })) };
                writeGallery(path.join(root, id), manifest);
            }
            writeHistory(root);
            const gallery = fs.readFileSync(path.join(root, '2026-10-19/index.html'), 'utf8');
            assert.match(gallery, /front-ortho.png/);
            assert.match(gallery, /front-persp.png/);
            assert.match(gallery, /&lt;script&gt;/);
            const history = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
            assert(history.indexOf('"id":"2026-10-20"') < history.indexOf('"id":"2026-10-19"'));
            assert(!history.includes('</script><script>bad()'));
            assert.match(history, /Conditions différentes/);
            assert.match(fs.readFileSync(path.join(root, '2026-10-20/README.md'), 'utf8'), /!\[front ortho\]\(front-ortho.png\)/);
            assert(fs.existsSync(path.join(root, '2026-10-19/manifest.json')));
        } finally { fs.rmSync(root, { recursive: true }); }
    });
});
