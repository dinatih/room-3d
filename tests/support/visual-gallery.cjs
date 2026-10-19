const fs = require('node:fs');
const path = require('node:path');
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const document = (title, body) => `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><style>
body{font:16px system-ui,sans-serif;margin:2rem;background:#f3f4f6;color:#17202a}a{color:#174ea6}img{display:block;width:100%;height:auto;background:#111827}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:.5rem;vertical-align:top;text-align:left}select{max-width:100%;padding:.5rem}figure{margin:0}figcaption{padding:.5rem 0}section{margin:2rem 0}code{overflow-wrap:anywhere}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}@media(max-width:700px){.pair{grid-template-columns:1fr}}
</style><body><h1>${escape(title)}</h1>${body}</body></html>`;
exports.writeGallery = (directory, manifest) => {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
    const views = [...new Map(manifest.captures.map(c => [c.view, c.label])).entries()];
    const image = capture => capture ? `<a href="${escape(capture.file)}"><img loading="lazy" src="${escape(capture.file)}" alt="${escape(capture.label)} — ${capture.projection}" width="${manifest.viewport.width}" height="${manifest.viewport.height}"></a>` : 'Capture indisponible';
    const metadata = `Commit ${escape(manifest.commit)}${manifest.dirty ? ' (modifications locales)' : ''} · ${escape(manifest.createdAt)} · ${escape(manifest.status)} · ${escape(manifest.label)}<p><a href="../index.html">Comparer les exécutions</a> · <a href="manifest.json">Manifeste</a></p>`;
    fs.writeFileSync(path.join(directory, 'index.html'), document('Vues de l’appartement', metadata + views.map(([key, label]) => `<section><h2>${escape(label)}</h2><table><tr><th>Orthographique</th><th>Perspective</th></tr><tr>${['ortho', 'persp'].map(projection => `<td>${image(manifest.captures.find(c => c.view === key && c.projection === projection))}</td>`).join('')}</tr></table></section>`).join('') + (manifest.error ? `<pre>${escape(manifest.error)}</pre>` : '')));
    const markdown = ['# Vues de l’appartement', '', `Commit : ${manifest.commit} · ${manifest.createdAt} · ${manifest.status}`, '', '| Vue | Orthographique | Perspective |', '| --- | --- | --- |', ...views.map(([key, label]) => `| ${label} | ${['ortho', 'persp'].map(projection => { const c = manifest.captures.find(c => c.view === key && c.projection === projection); return c ? `![${key} ${projection}](${c.file})` : 'Indisponible'; }).join(' | ')} |`)];
    fs.writeFileSync(path.join(directory, 'README.md'), markdown.join('\n') + '\n');
};
exports.writeHistory = root => {
    const runs = fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
        const filename = path.join(root, e.name, 'manifest.json');
        return fs.existsSync(filename) ? { ...JSON.parse(fs.readFileSync(filename)), directory: e.name } : null;
    }).filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const data = JSON.stringify(runs).replaceAll('<', '\\u003c');
    fs.writeFileSync(path.join(root, 'index.html'), document('Historique visuel', `<p>Choisir deux exécutions pour comparer leurs vues. Aucun serveur nécessaire.</p><div class="pair"><label>Avant <select id="before"></select></label><label>Après <select id="after"></select></label></div><p id="conditions"></p><main id="images"></main><script>
const runs=${data};
const selectors=[document.getElementById('before'),document.getElementById('after')];
for(const select of selectors)for(const [i,run] of runs.entries()){const option=document.createElement('option');option.value=i;option.textContent=run.createdAt+' · '+run.commit.slice(0,8)+(run.dirty?' (modifié)':'')+' · '+run.status+(run.label?' · '+run.label:'');select.append(option);}
const latest=runs.findIndex(r=>r.status==='passed');
const previous=runs.findIndex((r,i)=>i>latest&&r.status==='passed');
selectors[1].selectedIndex=latest<0?0:latest;selectors[0].selectedIndex=previous<0?selectors[1].selectedIndex:previous;
function render(){
const selected=selectors.map(s=>runs[s.selectedIndex]);if(selected.some(r=>!r))return;
const same=JSON.stringify(selected[0].conditions)===JSON.stringify(selected[1].conditions);
document.getElementById('conditions').textContent=same?'Conditions de capture identiques.':'Conditions différentes : vérifier les manifestes (qualité, résolution, GPU, navigateur…).';
const main=document.getElementById('images');main.replaceChildren();
const keys=[...new Set(selected.flatMap(r=>r.captures.map(c=>c.view+'/'+c.projection)))];
for(const key of keys){const section=document.createElement('section');const title=document.createElement('h2');title.textContent=key;section.append(title);const pair=document.createElement('div');pair.className='pair';
for(const run of selected){const figure=document.createElement('figure');const capture=run.captures.find(c=>c.view+'/'+c.projection===key);if(capture){const link=document.createElement('a');link.href=run.directory+'/'+capture.file;const img=document.createElement('img');img.loading='lazy';img.src=link.href;img.alt=capture.label+' '+capture.projection;link.append(img);figure.append(link);}else figure.textContent='Capture indisponible';const caption=document.createElement('figcaption');const link=document.createElement('a');link.href=run.directory+'/index.html';link.textContent=run.commit.slice(0,8)+' · '+run.createdAt;caption.append(link);figure.append(caption);pair.append(figure);}section.append(pair);main.append(section);}}
for(const select of selectors)select.addEventListener('change',render);render();
</script>`));
};
