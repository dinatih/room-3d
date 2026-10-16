/** NPZ workflow: node scripts/temp_npz_resume.cjs repair|repair-test|repair-browser|refine|refine-test|refine-browser
 * Baseline c14e25c6: calibrage déjà rogné, avant les corrections Y/hips-lock.
 * Les sauts sont des alertes angulaires (>25°/33 ms), pas une preuve d'occlusion.
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const THREE = require('three');
const root = path.resolve(__dirname, '..');
const registryPath = 'src/features/scene/animations/animationRegistry.ts';
const reportPath = path.join(__dirname, 'npz_resume_audit.json');
const manifestPath = path.join(__dirname, 'npz_resume_changes.json');
const baseline = 'c14e25c6';
const git = (...args) => cp.execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const baselineFiles = new Set(git('ls-tree', '-r', '--name-only', baseline, '--', 'public/animations/npz').toString().trim().split('\n'));
const registry = fs.readFileSync(path.join(root, registryPath), 'utf8');
const blocks = [...registry.matchAll(/^ +\{\n[\s\S]*?^ +\},?/gm)];
const entries = blocks.flatMap(m => {
  const id = m[0].match(/\bid:\s*'([^']+)'/);
  const file = m[0].match(/\bpath:\s*'(animations\/npz\/[^']+)'/);
  return id && file ? [{ id: id[1], file: 'public/' + file[1], block: m[0] }] : [];
});
function parse(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(4) !== 2 || buf.readUInt32LE(8) !== buf.length) throw Error('Invalid GLB');
  let json, bin;
  for (let off = 12; off < buf.length;) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    if (type === 0x4e4f534a) json = JSON.parse(buf.toString('utf8', off + 8, off + 8 + len));
    if (type === 0x004e4942) bin = off + 8;
    off += 8 + len;
  }
  if (!json || !bin) throw Error('Missing GLB chunk');
  function accessor(idx) {
    const a = json.accessors[idx], v = json.bufferViews[a.bufferView];
    if (a.componentType !== 5126 || a.sparse || v.buffer !== 0) throw Error('Unsupported accessor');
    const width = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
    if (!width) throw Error('Unsupported accessor type');
    const offset = bin + (v.byteOffset || 0) + (a.byteOffset || 0), stride = v.byteStride || width * 4;
    const values = Array.from({ length: a.count }, (_, i) => Array.from({ length: width }, (_, k) => buf.readFloatLE(offset + i * stride + k * 4)));
    if (values.some(v => v.some(x => !Number.isFinite(x)))) throw Error('Non-finite accessor');
    return { values, offset, stride, width, idx };
  }
  // useCharacterAnimations.ts lit gltf.animations[0]. Les clips résiduels du
  // modèle Mixamo ne doivent pas contaminer le diagnostic de la prise NPZ.
  const tracks = (json.animations || []).slice(0, 1).flatMap(a => a.channels.map(ch => {
    const s = a.samplers[ch.sampler];
    const times = accessor(s.input).values.map(v => v[0]);
    if (times.some((t, i) => i && t <= times[i - 1])) throw Error('Non-monotonic times');
    const output = accessor(s.output), interpolation = s.interpolation || 'LINEAR';
    if (output.values.length !== times.length * (interpolation === 'CUBICSPLINE' ? 3 : 1)) throw Error('Invalid sampler size');
    return { node: ch.target.node, bone: json.nodes[ch.target.node].name, type: ch.target.path, times, output, interpolation };
  }));
  return { buf, json, tracks, bin, accessor };
}
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
function norm(q) {
  const len = Math.hypot(...q);
  if (!len) throw Error('Zero quaternion');
  return q.map(x => x / len);
}
const angle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(dot(norm(a), norm(b))))) * 180 / Math.PI;
const jumpThreshold = 25; // Même critère d'audit que la conversation, à 30 Hz.
const keepThreshold = 150; // Seuil de conservation demandé par l'utilisateur.
function slerp(a, b, t) {
  a = norm(a); b = norm(b);
  let d = dot(a, b);
  if (d < 0) { b = b.map(x => -x); d = -d; }
  if (d > 0.9995) return norm(a.map((x, i) => x * (1 - t) + b[i] * t));
  const theta = Math.acos(Math.min(1, d)), sin = Math.sin(theta);
  return a.map((x, i) => (x * Math.sin((1 - t) * theta) + b[i] * Math.sin(t * theta)) / sin);
}
function sample(track, t, idx) {
  const ts = track.times, v = track.output.values, cubic = track.interpolation === 'CUBICSPLINE';
  while (idx.value + 1 < ts.length && ts[idx.value + 1] <= t) idx.value++;
  const i = idx.value, j = Math.min(i + 1, ts.length - 1);
  const a = v[cubic ? 3 * i + 1 : i], b = v[cubic ? 3 * j + 1 : j];
  if (i === j || track.interpolation === 'STEP') return a;
  const dt = ts[j] - ts[i], u = (t - ts[i]) / dt;
  if (cubic) {
    const h00 = 2*u**3 - 3*u*u + 1, h10 = u**3 - 2*u*u + u;
    const h01 = -2*u**3 + 3*u*u, h11 = u**3 - u*u;
    const out = a.map((x, k) => h00*x + h10*dt*v[3*i+2][k] + h01*b[k] + h11*dt*v[3*j][k]);
    return track.type === 'rotation' ? norm(out) : out;
  }
  return track.type === 'rotation' ? slerp(a, b, u) : a.map((x, k) => x * (1-u) + b[k]*u);
}
function audit(g) {
  let jumps = 0, maxJump = 0;
  const bones = [];
  for (const tr of g.tracks.filter(t => t.type === 'rotation')) {
    let n = 0, max = 0, prev, idx = { value: 0 };
    const end = tr.times.at(-1);
    for (let i = 0; i <= Math.floor((end-tr.times[0])*30); i++) {
      const q = sample(tr, tr.times[0] + i/30, idx);
      if (prev) { const d = angle(prev, q); if (d > jumpThreshold) n++; max = Math.max(max, d); }
      prev = q;
    }
    jumps += n; maxJump = Math.max(maxJump, max);
    if (n) bones.push({ bone: tr.bone, jumps: n, max: +max.toFixed(2) });
  }
  const hips = g.tracks.find(t => t.type === 'translation' && /hips/i.test(t.bone));
  const parents = new Map();
  g.json.nodes.forEach((n, i) => (n.children || []).forEach(c => parents.set(c, i)));
  function worldMatrix(i) {
    if (i === undefined) return new THREE.Matrix4();
    const n = g.json.nodes[i];
    const local = n.matrix ? new THREE.Matrix4().fromArray(n.matrix) : new THREE.Matrix4().compose(new THREE.Vector3().fromArray(n.translation || [0,0,0]), new THREE.Quaternion().fromArray(n.rotation || [0,0,0,1]), new THREE.Vector3().fromArray(n.scale || [1,1,1]));
    return worldMatrix(parents.get(i)).multiply(local);
  }
  const positions = hips ? hips.output.values.filter((_, i) => hips.interpolation !== 'CUBICSPLINE' || i%3 === 1).map(v => new THREE.Vector3().fromArray(v).applyMatrix4(worldMatrix(parents.get(hips.node))).toArray()) : null;
  const range = hips ? [0,1,2].map(k => {
    const values = positions.map(v => v[k]);
    return Math.max(...values) - Math.min(...values);
  }) : null;
  return { jumps, maxJump: +maxJump.toFixed(2), duration: Math.max(...g.tracks.map(t => t.times.at(-1))), hipsRange: range, interpolations: [...new Set(g.tracks.map(t => t.interpolation))], bones };
}
function main() {
  const mode = process.argv[2] || 'audit';
  if(!['audit','restore','smooth','retime-combat-b','olivia','inspect','metadata','verify','repair','repair-test','repair-browser','refine-scan','refine','refine-test','refine-browser'].includes(mode)) throw Error('Unknown mode '+mode);
  if(mode==='refine-scan') return scanRefinement();
  if(mode==='refine') return refineAndExtract();
  if(mode==='refine-test') return testRefinement();
  if(mode==='refine-browser') return reviewRefinement();
  if(mode==='repair') return prepareRepairs();
  if(mode==='repair-test') return testRepairs();
  if(mode==='repair-browser') return reviewRepairs();
  if(mode==='metadata') {syncMetadata();return;}
  if(mode==='verify') {
    const assert=require('node:assert/strict');
    assert(angle([0,0,0,1],[0,0,0,-1])<1e-5,'q et -q sont la même rotation');
    assert(angle(slerp([0,0,0,1],[0,0,0,-1],0.5),[0,0,0,1])<1e-5,'SLERP doit prendre le chemin court');
    const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'npz_resume_smoothing.json'),'utf8'));
    const all=[];
    function walk(dir) {for(const item of fs.readdirSync(dir,{withFileTypes:true})) {const f=path.join(dir,item.name);if(item.isDirectory())walk(f);else if(f.endsWith('.glb'))all.push(path.relative(root,f));}}
    walk(path.join(root,'public/animations/npz'));
    const registered=new Set(entries.map(e=>e.file));
    const extra=all.filter(f=>!registered.has(f));
    assert.equal(extra.length,0,'GLB non enregistrés : '+extra.join(', '));
    const actual=entries.map(e=>{
      const g=parse(fs.readFileSync(path.join(root,e.file))), stat=audit(g);
      let expected=rows.find(r=>r.file===e.file);
      if(!expected) {
        assert.equal(stat.jumps,0,'Une prise supplémentaire nécessite un adoucissement '+e.id);
        expected={id:e.id,file:e.file,before:stat,after:stat,edits:[]};rows.push(expected);
      }
      assert(expected,'Rapport manquant '+e.id);
      assert.deepEqual(stat,expected.after,'Résultat différent du rapport '+e.id);
      const duration=Number(e.block.match(/\bduration: ([\d.]+)/)[1]);
      assert.equal(duration,Math.round(stat.duration*10)/10,'Durée du registre '+e.id);
      return {id:e.id,file:e.file,...stat};
    });
    fs.writeFileSync(reportPath,JSON.stringify(actual,null,2)+'\n');
    fs.writeFileSync(path.join(__dirname,'npz_resume_smoothing.json'),JSON.stringify(rows,null,2)+'\n');
    writeReport(rows);
    console.log(`Vérifié : ${actual.length} GLB, registre synchronisé, aucune piste non finie, rapports cohérents.`);
    console.log('Au-dessus du seuil:',actual.filter(r=>r.jumps>=keepThreshold).map(r=>[r.id,r.jumps]));
    console.log('Y/XZ restaurés :',actual.filter(r=>/boat.*-a$|randb/.test(r.id)).map(r=>({id:r.id,duration:r.duration,hipsRange:r.hipsRange})));
    return;
  }
  if(mode==='retime-combat-b') {
    // temp_convert_61.py utilisait explicitement fps/2 : la prise B a été
    // exportée deux fois trop lentement et n'existe pas dans la baseline.
    const file='public/animations/npz/combat/anim_duo_martial_arts_b.glb',full=path.join(root,file);
    const g=parse(fs.readFileSync(full)), before=audit(g);
    const a=entries.find(e=>e.id==='duo-martial-arts-combat');
    const durationA=audit(parse(fs.readFileSync(path.join(root,a.file)))).duration;
    if(Math.abs(before.duration-durationA)<1/30+1e-5) {console.log('Cadence B déjà restaurée');return;}
    if(Math.abs(before.duration/2-durationA)>1/30+1e-5) throw Error('Unexpected combat A/B duration ratio');
    const inputs=new Set(g.json.animations[0].samplers.map(s=>s.input));
    for(const id of inputs) {
      const acc=g.accessor(id);
      for(let i=0;i<acc.values.length;i++) g.buf.writeFloatLE(acc.values[i][0]/2,acc.offset+i*acc.stride);
      for(const key of ['min','max']) if(g.json.accessors[id][key]) g.json.accessors[id][key]=g.json.accessors[id][key].map(v=>v/2);
    }
    const raw=Buffer.from(JSON.stringify(g.json)), json=Buffer.alloc(Math.ceil(raw.length/4)*4,0x20);raw.copy(json);
    const bin=g.buf.subarray(g.bin), out=Buffer.alloc(12+8+json.length+8+bin.length);
    out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
    out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);
    out.writeUInt32LE(bin.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);bin.copy(out,28+json.length);
    const changed=parse(out);
    g.tracks.forEach((t,i)=>{if(JSON.stringify(t.output.values)!==JSON.stringify(changed.tracks[i].output.values)) throw Error('Retime changed motion values');});
    fs.writeFileSync(full,out);syncMetadata();
    const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'npz_resume_smoothing.json'),'utf8'));
    const row=rows.find(r=>r.file===file);row.after=audit(changed);row.retime={from:before.duration,to:row.after.duration,cause:'fps / 2 dans temp_convert_61.py'};
    fs.writeFileSync(path.join(__dirname,'npz_resume_smoothing.json'),JSON.stringify(rows,null,2)+'\n');writeReport(rows);
    console.log('Combat B:',before.duration,'→',row.after.duration);return;
  }
  if(mode==='smooth') {
    const rows=[];
    for(const e of entries) {
      const input=fs.readFileSync(path.join(root,e.file)), g=parse(Buffer.from(input)), before=audit(g);
      const edits=[];
      if(before.jumps>0 && before.jumps<keepThreshold) for(const tr of g.tracks.filter(t=>t.type==='rotation')) {
        // Aucune réécriture de tangentes cubiques ni de pas discrets : le
        // traitement local concerne uniquement les rotations interpolées.
        if(tr.interpolation!=='LINEAR') continue;
        const src=tr.output.values.map(norm), q=src.map(v=>v.slice()), touched=new Set(), isolated=[];
        for(let i=1;i<q.length-1;i++) {
          const time=tr.times[i], left=tr.times[i-1], right=tr.times[i+1];
          // Seuil en degrés ramené au même intervalle physique (1/30 s).
          const out=angle(src[i-1],src[i])/(time-left)/30>jumpThreshold;
          const back=angle(src[i],src[i+1])/(right-time)/30>jumpThreshold;
          const bridge=angle(src[i-1],src[i+1])/(right-left)/30;
          if(out && back && bridge<jumpThreshold) {
            q[i]=slerp(src[i-1],src[i+1],(time-left)/(right-left));
            touched.add(i);isolated.push({key:i,time,angle:angle(src[i],q[i])});
          }
        }
        const hot=new Set();
        for(let i=1;i<q.length;i++) if(angle(q[i-1],q[i])/(tr.times[i]-tr.times[i-1])/30>jumpThreshold) {
          for(const k of [i-2,i-1,i,i+1]) if(k>0 && k<q.length-1) hot.add(k);
        }
        const pass=q.map(v=>v.slice());
        for(const i of hot) {
          // Moyenne géodésique pondérée [1,2,1]. Une seule passe locale,
          // aucun plafonnement de rotation et aucune translation modifiée.
          q[i]=slerp(slerp(pass[i-1],pass[i],2/3),pass[i+1],1/4);
          touched.add(i);
        }
        for(const i of touched) q[i].forEach((value,k)=>g.buf.writeFloatLE(value,tr.output.offset+i*tr.output.stride+k*4));
        if(touched.size) edits.push({bone:tr.bone,isolated,smoothedTimes:[...hot].sort((a,b)=>a-b).map(i=>tr.times[i]),modifiedKeys:touched.size});
      }
      const after=audit(parse(g.buf));
      assertPreserved(parse(input),parse(g.buf));
      if(edits.length) fs.writeFileSync(path.join(root,e.file),g.buf);
      rows.push({id:e.id,file:e.file,before,after,edits});
    }
    fs.writeFileSync(path.join(__dirname,'npz_resume_smoothing.json'),JSON.stringify(rows,null,2)+'\n');
    syncMetadata();
    writeReport(rows);
    console.log('Animations adoucies:',rows.filter(r=>r.edits.length).length);
    console.log('Sauts avant/après:',rows.filter(r=>r.edits.length).map(r=>[r.id,r.before.jumps,r.after.jumps]));
    console.log('Au-dessus du seuil:',rows.filter(r=>r.before.jumps>=keepThreshold).map(r=>[r.id,r.before.jumps]));
    return;
  }
  if (mode === 'restore') {
    const changes = [];
    for (const e of entries) {
      if (!baselineFiles.has(e.file)) continue;
      const previous = fs.readFileSync(path.join(root,e.file));
      const buf = git('show', `${baseline}:${e.file}`), g = parse(buf);
      if (!previous.equals(buf)) {
        const backup = path.join('/tmp/room-npz-before-resume',e.file);
        fs.mkdirSync(path.dirname(backup), {recursive:true});
        if (!fs.existsSync(backup)) fs.writeFileSync(backup,previous);
        changes.push({id:e.id,file:e.file,before:audit(parse(previous)),restored:audit(g)});
        fs.writeFileSync(path.join(root,e.file),buf);
      }
    }
    fs.writeFileSync(manifestPath,JSON.stringify({baseline,restored:changes},null,2)+'\n');
    console.log('Restaurées depuis '+baseline+': '+changes.length);
    syncMetadata();
    return;
  }
  if (process.argv[2] === 'olivia') {
    const dir='/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20131001_OliviaKyriakides';
    const rows=fs.readdirSync(dir).filter(f=>f.endsWith('_poses.npz')).map(file=>{
      const data=readMotionNPZ(path.join(dir,file)), poses=data.poses, fps=(data.mocap_frame_rate || data.mocap_framerate || data.fps)?.values[0];
      if (!fps || !poses || poses.shape.length!==2) throw Error('Missing capture metadata '+file+' '+JSON.stringify({names:data.names,shape:poses?.shape,fps}));
      const [n,stride]=poses.shape; let jumps=0, max=0;
      for (let bone=0;bone<22;bone++) {
        let prev;
        for(let frame=0;frame<=Math.floor((n-1)/fps*30);frame++) {
          const idx=Math.round(frame/30*fps)*stride+bone*3, aa=poses.values.slice(idx,idx+3), theta=Math.hypot(...aa);
          const q=theta?aa.map(x=>x/theta*Math.sin(theta/2)).concat(Math.cos(theta/2)):[0,0,0,1];
          if(prev) {const d=angle(prev,q); if(d>25)jumps++; max=Math.max(max,d);} prev=q;
        }
      }
      return {file,fps,duration:(n-1)/fps,jumps,maxJump:+max.toFixed(2)};
    });
    fs.writeFileSync(path.join(__dirname,'npz_olivia_sources.json'),JSON.stringify(rows,null,2)+'\n');
    console.log(JSON.stringify(rows,null,2));return;
  }
  if (process.argv[2] === 'inspect') {
    for (const file of ['public/animations/npz/daily/anim_holding_cup.glb', 'public/animations/npz/yoga/anim_yoga_downward_facing_dog_pose_or_adho_mukha_svanasana_c.glb']) {
      const g = parse(fs.readFileSync(path.join(root, file)));
      console.log(file, g.json.animations.map(a => ({name:a.name, channels:a.channels.length, duration:Math.max(...a.samplers.map(s=>g.json.accessors[s.input].max[0]))})));
    }
    return;
  }
  const rows = entries.map((e, i) => {
    const current = audit(parse(fs.readFileSync(path.join(root, e.file))));
    let restored;
    if (baselineFiles.has(e.file)) restored = audit(parse(git('show', `c14e25c6:${e.file}`)));
    if ((i+1)%30 === 0) console.log(`Audit ${i+1}/${entries.length}`);
    return { id: e.id, file: e.file, current, original: restored };
  });
  fs.writeFileSync(reportPath, JSON.stringify(rows, null, 2) + '\n');
  console.log('NPZ enregistrées:', rows.length);
  console.log('Olivia:', JSON.stringify(rows.filter(r => /olivia/.test(r.id))));
  console.log('>=150 sauts à 30 Hz:', rows.filter(r => (r.original || r.current).jumps >=150).map(r => [r.id,(r.original || r.current).jumps]));
  console.log('Top autres:', rows.filter(r => (r.original || r.current).jumps <150).sort((a,b) => (b.original || b.current).jumps-(a.original || a.current).jumps).slice(0,15).map(r => [r.id,(r.original || r.current).jumps]));
  console.log('Cadence modifiée:', rows.filter(r => r.original && Math.abs(r.original.duration-r.current.duration) > 0.1).map(r => [r.id,r.current.duration,r.original.duration]));
  console.log('Exemples:', JSON.stringify(rows.filter(r => /randb|boat.*-a$|downward/.test(r.id))));
}
function assertPreserved(before,after) {
  if(JSON.stringify(before.json)!==JSON.stringify(after.json)) throw Error('GLB structure changed');
  if(before.tracks.length!==after.tracks.length) throw Error('Track count changed');
  before.tracks.forEach((tr,i)=>{
    const b=after.tracks[i];
    if(JSON.stringify(tr.times)!==JSON.stringify(b.times)) throw Error('Timing changed');
    if(tr.type!=='rotation' && JSON.stringify(tr.output.values)!==JSON.stringify(b.output.values)) throw Error('Translation/scale changed');
  });
  // Toute modification binaire doit appartenir à une sortie quaternion
  // du clip principal : les autres clips, temps, meshes restent identiques.
  const allowed=new Uint8Array(before.buf.length);
  for(const tr of before.tracks.filter(t=>t.type==='rotation')) for(let i=0;i<tr.output.values.length;i++) allowed.fill(1,tr.output.offset+i*tr.output.stride,tr.output.offset+i*tr.output.stride+16);
  for(let i=0;i<before.buf.length;i++) if(before.buf[i]!==after.buf[i] && !allowed[i]) throw Error('Non-rotation byte changed');
}
function writeReport(rows) {
  fs.mkdirSync(path.join(root,'docs'),{recursive:true});
  let md='# Reprise des animations NPZ\n\n';
  md+='Restauration des GLB existants depuis `c14e25c6`, après rognage du calibrage et avant les corrections de hauteur Y et verrouillage X/Z. Les variantes déjà supprimées ne sont pas réintroduites. Les fichiers ajoutés après cette version sont conservés.\n\n';
  md+='## Mesure\n\nPremier clip uniquement (celui lu par `useCharacterAnimations`). Quaternions normalisés, distance `2 acos(abs(q₁·q₂))`, échantillonnage à 30 Hz avec interpolation du sampler. Un événement signifie un saut >25° sur un os en 1/30 s. Plusieurs os sur une même frame comptent séparément. Ce score repère des mouvements suspects ; il ne prouve pas une perte de marqueurs. Une inversion q→−q seule représente la même orientation et ne compte pas comme saut.\n\n';
  md+='## Adoucissement\n\nPour les clips à moins de 150 événements : remplacement des pics isolés (aller-retour angulaire, voisins cohérents) par SLERP entre leurs voisins à la même date, puis une seule moyenne géodésique pondérée [1,2,1] autour des sauts restants. Pas de clamp global. Les extrémités des pistes restent intactes. Les rotations STEP/CUBICSPLINE restent intactes. La liste exhaustive des clés, os et secondes modifiés est dans `scripts/npz_resume_smoothing.json`. Le script vérifie que les translations XYZ, échelles, dates et tous les autres octets restent identiques pendant le lissage. Le score final ne remplace pas la validation visuelle.\n\n';
  md+='## Catalogue complet\n\n| Animation | Sauts avant | Après | Action | Durée (s) | Amplitude X/Z (m) |\n|---|---:|---:|---|---:|---|\n';
  for(const r of [...rows].sort((a,b)=>b.before.jumps-a.before.jumps)) md+=`| ${r.id} | ${r.before.jumps} | ${r.after.jumps} | ${r.before.jumps>=keepThreshold?'Au-dessus du seuil':r.edits.length?'Adoucie':'Conservée'} | ${r.after.duration.toFixed(3)} | ${r.after.hipsRange?`${r.after.hipsRange[0].toFixed(3)} / ${r.after.hipsRange[2].toFixed(3)}`:'Sans piste bassin'} |\n`;
  md+='\n## Cadence de la prise combat B\n\nLa prise B, ajoutée après la baseline, utilisait `playback_fps = fps / 2` dans `temp_convert_61.py`. Ses temps sont divisés par deux pour rétablir le tempo natif (environ 37,37 s au lieu de 74,73 s), sans modifier ses valeurs de mouvement. L’exporteur utilise désormais `fps` directement.\n';
  const olivia=JSON.parse(fs.readFileSync(path.join(__dirname,'npz_olivia_sources.json'),'utf8'));
  md+='\n## Autres prises Olivia locales (sources NPZ)\n\nLes sources sont évaluées sur les 22 articulations SMPL, à 30 Hz depuis leur cadence native. Ce scan ne garantit pas le rendu du retargeting ; les prises non intégrées ne sont pas ajoutées automatiquement.\n\n| Source | Sauts | Durée (s) |\n|---|---:|---:|\n';
  for(const r of olivia) md+=`| ${r.file} | ${r.jumps} | ${r.duration.toFixed(3)} |\n`;
  fs.writeFileSync(path.join(root,'docs/npz-animation-audit.md'),md);
}
function syncMetadata() {
  let text=fs.readFileSync(path.join(root,registryPath),'utf8');
  const stats=new Map(entries.filter(e=>fs.existsSync(path.join(root,e.file))).map(e=>{
    const g=parse(fs.readFileSync(path.join(root,e.file)));
    return [path.basename(e.file),{duration:Math.round(audit(g).duration*10)/10,frames:Math.max(...g.tracks.map(t=>t.times.length)),size_kb:Math.round(g.buf.length/1024)}];
  }));
  for(const e of entries) {
    const st=stats.get(path.basename(e.file));
    if (st) text=text.replace(e.block,e.block.replace(/\bduration: [\d.]+/,`duration: ${st.duration}`).replace(/\(\d+f \/ [\d.]+s, \d+KB\)/,`(${st.frames}f / ${st.duration}s, ${st.size_kb}KB)`));
  }
  fs.writeFileSync(path.join(root,registryPath),text);
  const dirs=fs.readdirSync(path.join(root,'public/animations/npz'),{withFileTypes:true}).filter(e=>e.isDirectory());
  for(const dir of dirs) for(const file of fs.readdirSync(path.join(root,'public/animations/npz',dir.name)).filter(f=>f.endsWith('_meta.json'))) {
    const rel=`public/animations/npz/${dir.name}/${file}`, full=path.join(root,rel);
    const data=JSON.parse(fs.readFileSync(full,'utf8'));
    if (!Array.isArray(data)) throw Error('Unexpected metadata format '+rel);
    // Retenir uniquement les entrées actuelles; ne pas ressusciter les variantes supprimées.
    let prior=[];
    if(baselineFiles.has(rel)) prior=JSON.parse(git('show',`${baseline}:${rel}`).toString());
    const identify = m => m.filename || path.basename(m.out_path || '');
    const updated=data.map(m=>{
      const name=identify(m), st=stats.get(name);
      if(!st) return m;
      const source=prior.find(p=>identify(p)===name);
      const restored=entries.some(e=>path.basename(e.file)===name && baselineFiles.has(e.file));
      return {...m,...(restored && source?source:{}),...st};
    });
    const output=JSON.stringify(updated,null,2)+'\n';
    if (JSON.stringify(data)!==JSON.stringify(updated)) fs.writeFileSync(full,output);
  }
}
function readMotionNPZ(file) {
  const zlib = require('node:zlib'), b = fs.readFileSync(file), out = { names: [] };
  let end = b.length - 22;
  while (end >= 0 && b.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw Error('Missing ZIP directory: ' + file);
  let off = b.readUInt32LE(end + 16);
  for (let i = 0; i < b.readUInt16LE(end + 10); i++) {
    if (b.readUInt32LE(off) !== 0x02014b50) throw Error('Invalid ZIP directory');
    const n=b.readUInt16LE(off+28), extra=b.readUInt16LE(off+30), comment=b.readUInt16LE(off+32);
    const name=b.toString('utf8',off+46,off+46+n), start=b.readUInt32LE(off+42), size=b.readUInt32LE(off+20), method=b.readUInt16LE(off+10);
    out.names.push(name);
    if (/^(poses|mocap_frame_rate|mocap_framerate|fps)\.npy$/.test(name)) {
      if (![0,8].includes(method)) throw Error('Unsupported ZIP compression');
      const dataStart=start+30+b.readUInt16LE(start+26)+b.readUInt16LE(start+28), raw=b.subarray(dataStart,dataStart+size);
      const data=method===8?zlib.inflateRawSync(raw):raw;
      if (data.toString('latin1',0,6)!=='\x93NUMPY') throw Error('Invalid NPY magic');
      const major=data[6];
      if (![1,2,3].includes(major)) throw Error('Unsupported NPY version');
      const headerStart=major===1?10:12, len=major===1?data.readUInt16LE(8):data.readUInt32LE(8);
      const header=data.toString('ascii',headerStart,headerStart+len);
      if (!/'fortran_order': False/.test(header)) throw Error('Unsupported NPY order');
      const dtype=header.match(/'descr': '([^']+)'/)[1], shape=header.match(/'shape': \(([^)]*)\)/)[1].split(',').map(x=>x.trim()).filter(Boolean).map(Number);
      if (!['<f8','<f4'].includes(dtype)) throw Error('Unsupported NPY dtype '+dtype);
      const width=dtype==='<f8'?8:4, count=shape.reduce((a,b)=>a*b,1), offset=headerStart+len;
      if(offset+count*width!==data.length) throw Error('Invalid NPY length');
      const values=Array.from({length:count},(_,j)=>width===8?data.readDoubleLE(offset+j*width):data.readFloatLE(offset+j*width));
      if(values.some(x=>!Number.isFinite(x))) throw Error('Non-finite NPZ motion');
      out[name.slice(0,-4)]={shape,values};
    }
    off+=46+n+extra+comment;
  }
  return out;
}

// SMPL/SMPL-H body ordering used by the existing exporters (22 articulations).
const smplBones=['Hips','LeftUpLeg','RightUpLeg','Spine','LeftLeg','RightLeg','Spine1','LeftFoot','RightFoot','Spine2','LeftToeBase','RightToeBase','Neck','LeftShoulder','RightShoulder','Head','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand'];
const repairSources={
  'bachata-vaso-01':'20120807_VasoAristeidou/Vasso_Bachata_01_poses.npz',
  'reggaeton-vaso-01':'20120807_VasoAristeidou/Vasso_Reggaeton_01_poses.npz',
  'hiphop-fanie-c3d':'20140121_FanieAlexandrou/Fanie_Hiphop_C3D_poses.npz',
  'musical-theater-fanie-c3d':'20140121_FanieAlexandrou/Fanie_MusicalTheater_C3D_poses.npz',
  'zumba-fanie-c3d':'20140121_FanieAlexandrou/Fanie_Zumba_C3D_poses.npz',
  'bellydance2-anna-cortesi-c3d':'20140506_AnnaCortesi/AnnaCortesi_BellyDance2_C3D_poses.npz',
  'randb-anna-cortesi-c3d':'20140506_AnnaCortesi/AnnaCortesi_RandB_C3D_poses.npz',
  'salsa-stefanos-c3d':'20140526_StephanosKoullapis/StefanosKoullapis_Salsa_C3D_poses.npz',
  'happy-dance-olivia':'20131001_OliviaKyriakides/Olivia_Happy_C3D_poses.npz',
  'excited-dance-olivia':'20131001_OliviaKyriakides/Olivia_Excited_C3D_poses.npz',
  'pleased-dance-olivia':'20131001_OliviaKyriakides/Olivia_Pleased_C3D_poses.npz',
};
const repairReport='scripts/npz_repair_candidates.json';
const qObj=q=>new THREE.Quaternion().fromArray(q).normalize();
const relative=(a,b)=>qObj(a).invert().multiply(qObj(b)).normalize().toArray();
function rotvec(q) {
  q=norm(q);if(q[3]<0)q=q.map(x=>-x);
  const sine=Math.hypot(q[0],q[1],q[2]);
  return sine===0?new THREE.Vector3():new THREE.Vector3(q[0],q[1],q[2]).multiplyScalar(2*Math.atan2(sine,q[3])/sine);
}
function sourceMotion(file) {
  const data=readMotionNPZ(file), p=data.poses, fps=(data.mocap_frame_rate||data.mocap_framerate||data.fps)?.values[0];
  if(!p || p.shape.length!==2 || p.shape[1]<smplBones.length*3 || !Number.isFinite(fps) || fps<=0) throw Error('Invalid source motion '+file);
  const [count,stride]=p.shape;
  const quats=smplBones.map((_,bone)=>Array.from({length:count},(_,frame)=>{
    const idx=frame*stride+bone*3, v=new THREE.Vector3(...p.values.slice(idx,idx+3)), theta=v.length();
    return theta===0?[0,0,0,1]:new THREE.Quaternion().setFromAxisAngle(v.divideScalar(theta),theta).toArray();
  }));
  return {fps,count,quats};
}
function alignSource(g,motion) {
  const tr=g.tracks.find(t=>t.bone==='mixamorig:Hips' && t.type==='rotation');
  if(!tr || tr.interpolation!=='LINEAR') throw Error('No linear hips track for source alignment');
  const frames=tr.times.map(t=>Math.round((t-tr.times[0])*motion.fps));
  const maxStart=motion.count-1-frames.at(-1);
  if(maxStart<0) throw Error('GLB longer than its source');
  const source=motion.quats[0], target=tr.output.values.map(norm);
  const steps=new Map();
  for(let i=1;i<frames.length;i++) {
    const step=frames[i]-frames[i-1];
    if(step<=0) throw Error('Invalid source sampling cadence');
    if(!steps.has(step)) steps.set(step,source.slice(0,-step).map((q,j)=>angle(q,source[j+step])));
  }
  const targetAngles=target.slice(1).map((q,i)=>angle(target[i],q));
  const candidates=[];
  for(let start=0;start<=maxStart;start++) {
    let error=0;
    for(let i=1;i<frames.length;i++) error+=Math.abs(steps.get(frames[i]-frames[i-1])[start+frames[i-1]]-targetAngles[i-1]);
    candidates.push({start,meanAngularStepError:error/targetAngles.length});
  }
  candidates.sort((a,b)=>a.meanAngularStepError-b.meanAngularStepError);
  return {...candidates[0],startSeconds:candidates[0].start/motion.fps,outputStart:tr.times[0],runnerUpError:candidates[1]?.meanAngularStepError??null};
}
function fitBasis(source,target) {
  const pairs=source.slice(1).map((q,i)=>({a:rotvec(relative(source[i],q)),b:rotvec(relative(target[i],target[i+1]))}));
  const first=pairs.reduce((best,p)=>p.a.lengthSq()>best.a.lengthSq()?p:best,{a:new THREE.Vector3(),b:new THREE.Vector3()});
  if(first.a.lengthSq()===0) return new THREE.Quaternion();
  const second=pairs.reduce((best,p)=>first.a.clone().cross(p.a).lengthSq()>first.a.clone().cross(best.a).lengthSq()?p:best,first);
  if(first.a.clone().cross(second.a).lengthSq()<=Number.EPSILON*first.a.lengthSq()*second.a.lengthSq()) return new THREE.Quaternion().setFromUnitVectors(first.a.clone().normalize(),first.b.clone().normalize());
  function basis(a,b) {
    const x=a.clone().normalize(), y=b.clone().addScaledVector(x,-b.dot(x)).normalize();
    return new THREE.Matrix4().makeBasis(x,y,x.clone().cross(y));
  }
  return new THREE.Quaternion().setFromRotationMatrix(basis(first.b,second.b).multiply(basis(first.a,second.a).invert())).normalize();
}
function changedIntervals(indices,times) {
  const out=[];
  for(const i of [...indices].sort((a,b)=>a-b)) {
    const prev=out.at(-1);
    if(prev && i===prev.lastKey+1) {prev.lastKey=i;prev.end=times[i];}
    else out.push({firstKey:i,lastKey:i,start:times[i],end:times[i]});
  }
  return out;
}
function repairNative(src,fps) {
  const q=src.map(v=>v.slice()), repaired=new Set(), hot=new Set(), proposed=new Set();
  // 25° à 30 Hz = 750°/s. Ce critère d'alerte existant ne suffit pas :
  // exiger également le retour vers une orientation voisine cohérente.
  const speed=jumpThreshold*30;
  for(let i=1;i<src.length-1;i++) {
    if(angle(src[i-1],src[i])*fps>speed && angle(src[i],src[i+1])*fps>speed && angle(src[i-1],src[i+1])*fps/2<speed) {
      proposed.add(i);
    }
  }
  for(const i of proposed) if(!proposed.has(i-1) && !proposed.has(i+1)) {
    q[i]=slerp(src[i-1],src[i+1],0.5);repaired.add(i);
  }
  const bad=new Set();
  for(let i=1;i<q.length;i++) if(angle(q[i-1],q[i])*fps>speed) {bad.add(i-1);bad.add(i);}
  const intervals=changedIntervals(bad,q.map((_,i)=>i/fps)), unresolved=[];
  // Une reconstruction locale est limitée à un intervalle de sortie (1/30 s).
  // Au-delà, conserver les données et signaler : aucune pose n'est inventée.
  for(const span of intervals) {
    if(span.end-span.start>1/30) {unresolved.push(span);continue;}
    for(let i=span.firstKey;i<=span.lastKey;i++) if(i>0 && i<q.length-1) hot.add(i);
  }
  for(const i of repaired) for(const k of [i-1,i,i+1]) if(k>0 && k<q.length-1 && !unresolved.some(s=>k>=s.firstKey && k<=s.lastKey)) hot.add(k);
  const pass=q.map(v=>v.slice());
  for(const i of hot) q[i]=slerp(pass[i],slerp(pass[i-1],pass[i+1],0.5),0.5);
  for(const span of unresolved) for(let i=span.firstKey;i<=span.lastKey;i++) {
    q[i]=src[i].slice();repaired.delete(i);hot.delete(i);
  }
  return {quats:q,isolated:[...repaired],filtered:[...hot],unresolved};
}
function prepareRepairs() {
  // Lot explicitement revu : ne pas dépendre d'un audit mutable pouvant
  // contenir les candidats eux-mêmes ou de nouvelles animations du projet.
  const targets=[...Object.keys(repairSources),'yoga-dolphin-pose-or-ardha-pincha-mayurasana-a'].map(id=>({id}));
  const yoga=JSON.parse(fs.readFileSync(path.join(root,'public/animations/npz/yoga/yoga_meta.json'),'utf8'));
  const rows=[];
  const tolerance=2*Math.acos(1-8*2**-23)*180/Math.PI; // Float32 normalization/dot error budget.
  for(const item of targets) {
    const entry=entries.find(e=>e.id===item.id);
    if(!entry) throw Error('Missing registry entry '+item.id);
    const input=fs.readFileSync(path.join(root,entry.file)), original=parse(input), g=parse(Buffer.from(input));
    const sourceFile=item.id.startsWith('yoga-')?yoga.find(m=>m.filename===path.basename(entry.file))?.npz:path.join('/home/dinatih/3D Resources/animations/DanceDB/DanceDB',repairSources[item.id]);
    if(!sourceFile || !fs.existsSync(sourceFile)) throw Error('Missing NPZ source '+item.id);
    const motion=sourceMotion(sourceFile), alignment=alignSource(original,motion);
    const details=[];
    for(const tr of g.tracks.filter(t=>t.type==='rotation' && t.interpolation==='LINEAR')) {
      const bone=tr.bone.replace('mixamorig:',''), index=smplBones.indexOf(bone);
      if(index<0 || tr.times.length<2) continue;
      const frameAt=t=>alignment.start+Math.round((t-alignment.outputStart)*motion.fps);
      const source=motion.quats[index], sampled=tr.times.map(t=>source[frameAt(t)]), target=tr.output.values.map(norm);
      if(sampled.some(q=>!q)) throw Error('Source time outside capture '+JSON.stringify({id:item.id,bone,alignment,count:motion.count,firstTime:tr.times[0],lastTime:tr.times.at(-1),fps:motion.fps,firstFrame:frameAt(tr.times[0]),lastFrame:frameAt(tr.times.at(-1))}));
      const basis=fitBasis(sampled,target), inv=basis.clone().invert(), s0=qObj(sampled[0]).invert(), t0=qObj(target[0]);
      const convert=q=>t0.clone().multiply(basis).multiply(s0).multiply(qObj(q)).multiply(inv).normalize().toArray();
      const errors=sampled.map((q,i)=>angle(convert(q),target[i]));
      const maxError=Math.max(...errors);
      const detail={bone,sourceConsistencyMaxDegrees:maxError,numericToleranceDegrees:tolerance,modified:[],isolatedSourceTimes:[],filteredSourceTimes:[],unresolvedSourceIntervals:[]};
      if(maxError>tolerance) {
        detail.status='source/export mismatch: left unchanged for investigation';details.push(detail);continue;
      }
      const native=repairNative(source,motion.fps);
      detail.status='source/export rotations consistent';
      // Protéger les mouvements qui ne présentaient pas d'alerte dans le GLB :
      // seuls les deux bouts d'un saut observé peuvent être modifiés.
      const suspect=new Set();
      for(let i=1;i<target.length;i++) if(angle(target[i-1],target[i])/(tr.times[i]-tr.times[i-1])/30>jumpThreshold) {suspect.add(i-1);suspect.add(i);}
      detail.observedJumpIntervals=changedIntervals(suspect,tr.times);
      detail.unresolvedSourceIntervals=native.unresolved.map(s=>({start:s.start-alignment.startSeconds+alignment.outputStart,end:s.end-alignment.startSeconds+alignment.outputStart})).filter(s=>s.end>=tr.times[0] && s.start<=tr.times.at(-1));
      const changed=new Set();
      for(let i=1;i<tr.times.length-1;i++) {
        if(!suspect.has(i)) continue;
        const frame=frameAt(tr.times[i]);
        if(angle(native.quats[frame],source[frame])<=tolerance) continue;
        const q=convert(native.quats[frame]);
        if(dot(q,target[i])<0) q.forEach((v,k)=>q[k]=-v);
        q.forEach((v,k)=>g.buf.writeFloatLE(v,tr.output.offset+i*tr.output.stride+k*4));changed.add(i);
      }
      detail.modified=changedIntervals(changed,tr.times);details.push(detail);
      const exportedFrames=new Set([...changed].map(i=>frameAt(tr.times[i])));
      const support=new Set([...exportedFrames].flatMap(i=>[i-1,i,i+1]));
      detail.isolatedSourceTimes=native.isolated.filter(i=>support.has(i)).map(i=>i/motion.fps);
      detail.filteredSourceTimes=native.filtered.filter(i=>exportedFrames.has(i)).map(i=>i/motion.fps);
    }
    assertPreserved(original,parse(g.buf));
    const candidateFile=`public/animations/npz/repair-candidates/${path.basename(entry.file)}`;
    fs.mkdirSync(path.join(root,path.dirname(candidateFile)),{recursive:true});
    fs.writeFileSync(path.join(root,candidateFile),g.buf);
    const row={id:item.id,candidateId:item.id+'-repair-preview',originalFile:entry.file,candidateFile,sourceFile,sourceFPS:motion.fps,alignment,before:audit(original),after:audit(parse(g.buf)),details,originalSHA256:require('node:crypto').createHash('sha256').update(input).digest('hex'),acceptance:'pending visual comparison; original retained'};
    rows.push(row);console.log(item.id,`${row.before.jumps} → ${row.after.jumps}`,`source offset ${alignment.startSeconds}s`);
  }
  const registryText=fs.readFileSync(path.join(root,registryPath),'utf8');
  const start='  // BEGIN NPZ REPAIR COMPARISONS',end='  // END NPZ REPAIR COMPARISONS';
  const comparisons=rows.map(r=>{
    const e=entries.find(e=>e.id===r.id);
    return e.block.replace(/id: '[^']+'/,`id: '${r.candidateId}'`).replace(/path: '[^']+'/,`path: '${r.candidateFile.slice('public/'.length)}'`).replace(/label: (['`])([^\n]+?)\1/,(_,quote,label)=>`label: ${quote}[ESSAI correction] ${label}${quote}`).replace(/^ +aliases:.*\n/m,'').replace(/tags: \[[^\]]*\]/,"tags: ['npz-repair-candidate']");
  }).join('\n');
  const block=`${start}\n${comparisons}\n${end}\n`;
  const next=registryText.includes(start)?registryText.replace(new RegExp(start+'[\\s\\S]*?'+end+'\\n'),block):registryText.replace(/\n\];\s*$/,'\n'+block+'];\n');
  if(next===registryText && !registryText.includes(start)) throw Error('Cannot add comparison entries');
  fs.writeFileSync(path.join(root,registryPath),next);
  fs.writeFileSync(path.join(root,repairReport),JSON.stringify({version:1,method:'native isolated-return repair + local symmetric geodesic smoothing; long intervals retained',rows},null,2)+'\n');
  writeRepairReport(rows);
}
function writeRepairReport(rows) {
  let md='# Comparaisons de correction des 12 animations NPZ\n\nLes originaux restent actifs et inchangés. Les versions candidates sont accessibles dans le sélecteur existant sous **[ESSAI correction]**, identifiant original suffixé `-repair-preview`. Aucun remplacement définitif n’a été effectué. Les candidats portent uniquement le tag `npz-repair-candidate`, sans les alias ni tags comportementaux des originaux, pour ne pas rejoindre les tirages IA par tags.\n\n';
  md+='## Méthode et limites\n\nAlignement temporel NPZ/GLB par comparaison de la vitesse angulaire du bassin sur tous les instants exportés. Estimation du changement de base à partir des rotations relatives, puis vérification sur toutes les orientations de chaque articulation. Les discordances dépassant le budget numérique Float32 sont signalées et laissées intactes : elles ne sont pas attribuées automatiquement au capteur.\n\nÀ la cadence native : remplacement des pics isolés avec retour vers des voisins cohérents par SLERP ; moyenne géodésique symétrique [1,2,1] sur les transitoires courts. Les intervalles de vitesse élevée continus dépassant 1/30 s sont conservés et signalés. Le seuil historique 25° à 30 Hz est une alerte, pas une limite biomécanique. Les dates, translations XYZ, échelles, extrémités et autres octets des GLB sont préservés. Le traitement ne corrige ni la hauteur du sol ni les appuis par IK.\n\n';
  md+='## Résultats (premier clip, 30 Hz)\n\n| Animation | Avant | Candidate | Os modifiés | Intervalles longs signalés |\n|---|---:|---:|---:|---:|\n';
  for(const r of rows) md+=`| ${r.id} | ${r.before.jumps} | ${r.after.jumps} | ${r.details.filter(d=>d.modified.length).length} | ${r.details.reduce((n,d)=>n+d.unresolvedSourceIntervals.length,0)} |\n`;
  md+='\n## Vérification visuelle à effectuer\n\nComparer les versions aux mêmes instants, avec vitesse 1 et Hips-Lock désactivé. Observer les poignets, les cuisses et le bassin sur les passages modifiés, mais aussi les pieds/mains en appui et des passages non modifiés. Une baisse du compteur ne constitue pas une validation. RnB, Bachata Vaso et Dolphin sont les trois pilotes ; les neuf autres candidats restent eux aussi en attente de validation.\n\n';
  for(const r of rows) {
    md+=`### ${r.id}\n\nSource : ${path.basename(r.sourceFile)}, ${r.sourceFPS} Hz. Décalage : ${r.alignment.startSeconds.toFixed(4)} s. Erreur moyenne d’alignement : ${r.alignment.meanAngularStepError.toFixed(6)}°.\n\n`;
    for(const d of r.details.filter(d=>d.modified.length||d.unresolvedSourceIntervals.length||d.status.includes('mismatch'))) md+=`- **${d.bone}** : ${d.modified.length} plage(s) modifiée(s), ${d.unresolvedSourceIntervals.length} plage(s) longue(s) conservée(s). ${d.status}.\n`;
  }
  md+='\nLe rapport JSON `scripts/npz_repair_candidates.json` fournit les dates exactes, clés et articulations modifiées, les erreurs source/export et les intervalles restants.\n';
  md+='\n## Contrôles reproductibles\n\n- `node scripts/temp_npz_resume.cjs repair` : régénérer les 12 candidats depuis les originaux (aucun lissage cumulatif).\n- `node scripts/temp_npz_resume.cjs repair-test` : pics isolés, mouvement sain, signes q/−q, symétrie temporelle, longues zones intactes, récupération de base, alignement NPZ/GLB et invariants binaires des 12 paires.\n- `node scripts/temp_npz_resume.cjs repair-browser` : avec Vite sur le port 5193 (ou `ROOM_TEST_URL`), vérifier les deux squelettes dans Chromium headless aux mêmes instants, puis écrire `scripts/npz_repair_browser.json` et trois captures pilotes dans `/tmp/room-npz-repair-review/`. Les deltas d’extrémités sont mesurés sur ces instants seulement. Ce contrôle du chargement, du mixeur et du rendu des squelettes ne valide pas les contacts ni le retargeting sur les personnages de l’application.\n';
  md+='\n## Limite du contrôle historique global\n\nLe mode historique `verify` ne lit que les entrées littérales du registre et échoue actuellement sur 230 fichiers InterX déclarés par un manifeste importé. Il ne constitue donc pas une validation globale du catalogue actuel. Les tests ciblés `repair-test` et `repair-browser` vérifient les 12 paires de ce rapport, y compris leur résolution par le véritable registre de l’application.\n';
  fs.writeFileSync(path.join(root,'docs/npz-repair-candidates.md'),md);
}
function testRepairs() {
  const assert=require('node:assert/strict');
  const q=d=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),d*Math.PI/180).toArray();
  const clean=Array.from({length:30},(_,i)=>q(i));
  assert.deepEqual(repairNative(clean,120).quats,clean,'Healthy motion must remain exact');
  const flipped=clean.map((v,i)=>i%2?v.map(x=>-x):v);
  assert.equal(repairNative(flipped,120).isolated.length,0,'Quaternion signs are not spikes');
  const spike=clean.map(v=>v.slice());spike[12]=q(120);
  assert(angle(repairNative(spike,120).quats[12],clean[12])<1e-4,'Isolated spike must be repaired');
  const forward=repairNative(spike,120).quats, reverse=repairNative([...spike].reverse(),120).quats.reverse();
  forward.forEach((v,i)=>assert(angle(v,reverse[i])<1e-4,'Filter must be symmetric in time'));
  const noisy=Array.from({length:40},(_,i)=>q(i%2?120:-120));
  const severe=repairNative(noisy,120);
  assert(severe.unresolved.length>0,'Long corruption must be reported');
  for(const span of severe.unresolved) for(let i=span.firstKey;i<=span.lastKey;i++) assert.deepEqual(severe.quats[i],noisy[i],'Long corruption must remain exact');
  const basis=new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4,0.8,-0.3));
  const source=Array.from({length:30},(_,i)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(i/30,Math.sin(i/10),i*i/900)).toArray());
  const target=source.map(q=>basis.clone().multiply(qObj(q)).multiply(basis.clone().invert()).toArray());
  assert(basis.angleTo(fitBasis(source,target))<1e-5,'Change of basis recovery');
  const times=Array.from({length:5},(_,i)=>(i+1)/30);
  const clipped={tracks:[{bone:'mixamorig:Hips',type:'rotation',interpolation:'LINEAR',times,output:{values:times.map((_,i)=>target[4+i*4])}}]};
  const aligned=alignSource(clipped,{fps:120,count:source.length,quats:[source]});
  assert.equal(aligned.start,4,'Native source crop alignment');
  assert.equal(aligned.outputStart,1/30,'GLB initial frame offset');
  const report=JSON.parse(fs.readFileSync(path.join(root,repairReport),'utf8'));
  assert.equal(report.rows.length,12);
  for(const row of report.rows) {
    const input=fs.readFileSync(path.join(root,row.originalFile)), output=fs.readFileSync(path.join(root,row.candidateFile));
    assert.equal(require('node:crypto').createHash('sha256').update(input).digest('hex'),row.originalSHA256,'Original changed');
    assertPreserved(parse(input),parse(output));
    assert.deepEqual(audit(parse(output)),row.after,'Report mismatch');
    const candidateEntry=entries.find(e=>e.id===row.candidateId && e.file===row.candidateFile);
    assert(candidateEntry,'Candidate not selectable');
    assert(candidateEntry.block.includes("tags: ['npz-repair-candidate']"),'Comparison must not join normal behavior tag queries');
    assert.equal(row.before.duration,row.after.duration);
    assert.deepEqual(row.before.hipsRange,row.after.hipsRange);
    const a=parse(input),b=parse(output);
    a.tracks.forEach((tr,trackIndex)=>{
      if(tr.type!=='rotation') return;
      const detail=row.details.find(d=>'mixamorig:'+d.bone===tr.bone);
      tr.output.values.forEach((q,key)=>{
        if(JSON.stringify(q)===JSON.stringify(b.tracks[trackIndex].output.values[key])) return;
        assert(key>0 && key<tr.times.length-1,'Track endpoint modified');
        assert(detail?.modified.some(s=>key>=s.firstKey && key<=s.lastKey),'Undocumented changed key');
        const wrist=row.wristRefinement?.wrists.find(w=>w.bone===tr.bone);
        assert(detail?.observedJumpIntervals.some(s=>key>=s.firstKey && key<=s.lastKey)||wrist?.changed.some(s=>key>=s.firstKey && key<=s.lastKey),'Healthy GLB key modified');
      });
    });
  }
  console.log('Tests passed: isolated repair, healthy movement, q/-q, sustained corruption, basis fit, 12 GLB invariants and comparison entries.');
}
async function reviewRepairs(reviewRows,reportFile='npz_repair_browser.json',references={},outDir='/tmp/room-npz-repair-review') {
  const report=reviewRows?{rows:reviewRows}:JSON.parse(fs.readFileSync(path.join(root,repairReport),'utf8'));
  const launch=require('./browser-test-options.cjs');
  const browser=await launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  fs.mkdirSync(outDir,{recursive:true});
  const results=[], errors=[];
  try {
    const page=await browser.newPage();await page.setViewport({width:1400,height:800});
    page.on('pageerror',err=>errors.push(String(err)));
    if(Object.keys(references).length) {
      await page.setRequestInterception(true);
      page.on('request',request=>{
        const bytes=references[new URL(request.url()).pathname];
        if(bytes) request.respond({status:200,contentType:'model/gltf-binary',body:bytes});else request.continue();
      });
    }
    const url=process.env.ROOM_TEST_URL||'http://127.0.0.1:5193';
    await page.goto(url+'/AGENTS.md');
    await page.setContent('<html><body style="margin:0;background:#17212d;color:white;font:16px sans-serif"><div id="title" style="padding:12px"></div><canvas id="review"></canvas><div style="padding:12px">Gauche : original · Droite : essai correction · Même instant, mêmes translations XYZ</div></body></html>');
    for(const row of report.rows) {
      const pilot=row.capture??['bachata-vaso-01','randb-anna-cortesi-c3d','yoga-dolphin-pose-or-ardha-pincha-mayurasana-a'].includes(row.id);
      const hand=row.details.find(d=>d.bone==='LeftHand' && d.modified.length)||row.details.find(d=>d.modified.length);
      const affected=hand?.modified[0]?.start??row.before.duration/2;
      const times=[row.alignment.outputStart,affected,row.before.duration/2,row.before.duration];
      const result=await page.evaluate(async({row,times})=>{
        const T=await import('/node_modules/three/build/three.module.js');
        const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
        const {getAnimationDef,getAnimationsByTags}=await import('/src/features/scene/animations/animationResolver.ts');
        if(getAnimationDef(row.candidateId)?.path!==row.candidateFile.replace(/^public\//,'')) throw Error('Candidate does not resolve through app registry');
        if(getAnimationDef(row.originalRegistryId||row.id)?.path!==(row.originalRegistryFile||row.originalFile).replace(/^public\//,'')) throw Error('Original resolver mapping changed');
        if(getAnimationsByTags(['dance','yoga'],'any').some(d=>d.id===row.candidateId)) throw Error('Candidate entered normal behavior queries');
        const loader=new GLTFLoader();
        const models=await Promise.all([row.originalFile,row.candidateFile].map(f=>loader.loadAsync('/'+f.replace(/^public\//,''))));
        const states=models.map(g=>{
          const mixer=new T.AnimationMixer(g.scene),action=mixer.clipAction(g.animations[0]);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
          const bones=[];g.scene.traverse(n=>{if(n.isBone)bones.push(n);});
          return {g,mixer,action,bones};
        });
        const footDifferences=[];
        for(const time of times) {
          states.forEach((s,i)=>{s.action.reset().play();s.mixer.setTime(time+(i===0?(row.sourceStart||0):0));s.g.scene.updateMatrixWorld(true);});
          if(row.sourceStart===undefined && models[0].animations[0].duration!==models[1].animations[0].duration) throw Error('Browser clip duration mismatch');
          if(row.sourceStart!==undefined && Math.abs(models[1].animations[0].duration-row.before.duration)>1e-5) throw Error('Extract duration mismatch');
          for(const s of states) for(const bone of s.bones) if(bone.matrixWorld.elements.some(x=>!Number.isFinite(x))) throw Error('Non-finite skeleton');
          for(const [index,s] of states.entries()) {
            const hips=s.bones.find(b=>b.name==='mixamorigHips');
            const track=s.g.animations[0].tracks.find(t=>t.name===hips.name+'.quaternion');
            if(!track) throw Error('Missing animated hips track');
            const expected=new T.Quaternion().fromArray(track.createInterpolant().evaluate(time+(index===0?(row.sourceStart||0):0))).normalize();
            if(expected.angleTo(hips.quaternion.clone().normalize())>1e-5) throw Error('Mixer is not evaluating the requested frame');
          }
          // GLTFLoader applique PropertyBinding.sanitizeNodeName (retire ':').
          const endpoints=['mixamorigLeftFoot','mixamorigRightFoot','mixamorigLeftHand','mixamorigRightHand'];
          footDifferences.push({time,deltas:Object.fromEntries(endpoints.map(name=>{
            const a=states[0].bones.find(b=>b.name===name), b=states[1].bones.find(b=>b.name===name);
            if(!a||!b) throw Error('Missing comparison endpoint '+name);
            return [name,a.getWorldPosition(new T.Vector3()).distanceTo(b.getWorldPosition(new T.Vector3()))];
          }))});
        }
        const renderer=new T.WebGLRenderer({canvas:document.getElementById('review'),antialias:true,preserveDrawingBuffer:true});
        renderer.setSize(1400,680);renderer.setScissorTest(true);
        function draw(time) {
          const positions=[];
          states.forEach((s,i)=>{s.action.reset().play();s.mixer.setTime(time+(i===0?(row.sourceStart||0):0));s.g.scene.updateMatrixWorld(true);s.bones.forEach(b=>positions.push(b.getWorldPosition(new T.Vector3())));});
          const box=new T.Box3().setFromPoints(positions),center=box.getCenter(new T.Vector3()), size=box.getSize(new T.Vector3());
          const radius=Math.max(size.x,size.y,size.z);
          if(!(radius>0)) throw Error('Empty skeleton');
          states.forEach((s,i)=>{
            const scene=new T.Scene(),vertices=[];
            for(const bone of s.bones) if(bone.parent?.isBone) {
              const a=bone.getWorldPosition(new T.Vector3()),b=bone.parent.getWorldPosition(new T.Vector3());
              vertices.push(...a.toArray(),...b.toArray());
            }
            const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3));
            const material=new T.LineBasicMaterial({color:i?0x61e4ba:0xffca76});
            const skeleton=new T.LineSegments(geometry,material);scene.add(skeleton);
            const grid=new T.GridHelper(radius*3,12,0x6c7b8f,0x334155);grid.position.set(center.x,0,center.z);scene.add(grid);
            const camera=new T.PerspectiveCamera(40,700/680,radius/100,radius*20);
            camera.position.copy(center).add(new T.Vector3(radius*1.1,radius*0.55,radius*1.8));camera.lookAt(center);
            renderer.setViewport(i*700,0,700,680);renderer.setScissor(i*700,0,700,680);renderer.setClearColor(0x17212d);renderer.render(scene,camera);
            geometry.dispose();material.dispose();grid.geometry.dispose();grid.material.dispose();
          });
          document.getElementById('title').textContent=row.id+' — '+time.toFixed(3)+' s';
        }
        draw(times[1]);
        // Preserve the canvas for the screenshot; dispose WebGL resources after it.
        window.disposeReview=()=>{renderer.dispose();states.forEach(s=>s.mixer.stopAllAction());};
        return {id:row.id,duration:models[0].animations[0].duration,bones:states.map(s=>s.bones.length),evaluatedTimes:times,endpointDeltas:footDifferences};
      },{row,times});
      if(pilot) {result.screenshot=path.join(outDir,row.id+'.png');await page.screenshot({path:result.screenshot});}
      await page.evaluate(()=>window.disposeReview());
      results.push(result);console.log('Browser OK:',row.id);
    }
    if(errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(root,'scripts',reportFile),JSON.stringify({headless:true,notes:'Skeleton loader/render checks; not a visual acceptance of character retargeting or contacts.',results},null,2)+'\n');
  } finally {await browser.close();}
}
const acceptedRepairCommit='c6c5468f';
const refinementPath=path.join(root,'scripts/npz_refinement.json');
const minimumExtractSeconds=5; // Choix explicite de l'utilisateur.
function acceptedClip(id) {
  const rows=JSON.parse(fs.readFileSync(path.join(root,repairReport),'utf8')).rows;
  const row=rows.find(r=>r.id===id);
  if(!row) throw Error('Unknown reviewed clip '+id);
  return {row,g:parse(git('show',`${acceptedRepairCommit}:${row.candidateFile}`))};
}
function clipTimeline(g) {
  const hips=g.tracks.find(t=>t.bone==='mixamorig:Hips' && t.type==='rotation');
  if(!hips || hips.times.length<2) throw Error('No animated reference timeline');
  return hips.times;
}
function unstableFrames(g,times) {
  const bad=new Set(),events=[];
  for(const tr of g.tracks.filter(t=>t.type==='rotation')) {
    const cursor={value:0},q=times.map(t=>sample(tr,t,cursor));
    for(let i=1;i<q.length;i++) {
      const step=angle(q[i-1],q[i]);
      if(step>jumpThreshold) {bad.add(i-1);bad.add(i);events.push({bone:tr.bone,time:times[i],type:'angular-step',degrees:step});}
    }
    for(let i=1;i<q.length-1;i++) {
      const excess=angle(q[i-1],q[i])+angle(q[i],q[i+1])-angle(q[i-1],q[i+1]);
      if(excess>jumpThreshold) {bad.add(i-1);bad.add(i);bad.add(i+1);events.push({bone:tr.bone,time:times[i],type:'angular-return',degrees:excess});}
    }
  }
  return {bad,events};
}
function stableExtracts(g) {
  const times=clipTimeline(g),{bad,events}=unstableFrames(g,times);
  const good=new Set(times.map((_,i)=>i).filter(i=>!bad.has(i)));
  const runs=changedIntervals(good,times);
  return {events,accepted:runs.filter(s=>s.end-s.start>=minimumExtractSeconds),discarded:runs.filter(s=>s.end-s.start<minimumExtractSeconds),unstable:changedIntervals(bad,times)};
}
function poseRig(g) {
  const nodes=g.json.nodes.map(n=>{
    const obj=new THREE.Object3D();obj.name=n.name||'';
    if(n.matrix) new THREE.Matrix4().fromArray(n.matrix).decompose(obj.position,obj.quaternion,obj.scale);
    else {obj.position.fromArray(n.translation||[0,0,0]);obj.quaternion.fromArray(n.rotation||[0,0,0,1]);obj.scale.fromArray(n.scale||[1,1,1]);}
    return obj;
  });
  g.json.nodes.forEach((n,i)=>(n.children||[]).forEach(child=>nodes[i].add(nodes[child])));
  const scene=new THREE.Group();nodes.filter(n=>!n.parent).forEach(n=>scene.add(n));
  const cursors=g.tracks.map(()=>({value:0}));
  function setTime(time) {
    g.tracks.forEach((tr,i)=>{
      if(time<tr.times[0]) cursors[i].value=0;
      const q=time<tr.times[0]?tr.output.values[0]:sample(tr,time,cursors[i]);
      const target={translation:'position',rotation:'quaternion',scale:'scale'}[tr.type];
      if(!target) throw Error('Unsupported animated property '+tr.type);
      nodes[tr.node][target].fromArray(q);
    });
    scene.updateMatrixWorld(true);
  }
  return {nodes,scene,setTime};
}
function wristSeries(g) {
  const rig=poseRig(g),times=clipTimeline(g);
  const hands=['mixamorig:LeftHand','mixamorig:RightHand'].map(bone=>({bone,node:rig.nodes.find(n=>n.name===bone),world:[],parent:[]}));
  if(hands.some(h=>!h.node?.parent)) throw Error('Missing wrist hierarchy');
  for(const time of times) {
    rig.setTime(time);
    for(const h of hands) {h.world.push(h.node.getWorldQuaternion(new THREE.Quaternion()).toArray());h.parent.push(h.node.parent.getWorldQuaternion(new THREE.Quaternion()).toArray());}
  }
  return {times,hands};
}
function rotationNoise(q) {
  let jumps=0,returns=0,maxStep=0,returnEnergy=0;
  for(let i=1;i<q.length;i++) {const d=angle(q[i-1],q[i]);if(d>jumpThreshold)jumps++;maxStep=Math.max(maxStep,d);}
  for(let i=1;i<q.length-1;i++) {const excess=Math.max(0,angle(q[i-1],q[i])+angle(q[i],q[i+1])-angle(q[i-1],q[i+1]));if(excess>jumpThreshold)returns++;returnEnergy+=excess*excess;}
  return {jumps,returns,maxStep,returnEnergy};
}
function filterWrist(q,passes) {
  const hot=new Set();
  for(let i=1;i<q.length-1;i++) {
    const excess=angle(q[i-1],q[i])+angle(q[i],q[i+1])-angle(q[i-1],q[i+1]);
    if(excess>jumpThreshold || angle(q[i-1],q[i])>jumpThreshold || angle(q[i],q[i+1])>jumpThreshold) {
      // Support de chaque moyenne symétrique [1,2,1] : une clé voisine.
      for(const k of [i-1,i,i+1]) if(k>0 && k<q.length-1) hot.add(k);
    }
  }
  let out=q.map(v=>v.slice());
  for(let pass=0;pass<passes;pass++) {
    const src=out;out=out.map(v=>v.slice());
    for(const i of hot) out[i]=slerp(src[i],slerp(src[i-1],src[i+1],0.5),0.5);
  }
  return {quats:out,hot};
}
function scanRefinement() {
  for(const id of ['randb-anna-cortesi-c3d','yoga-dolphin-pose-or-ardha-pincha-mayurasana-a']) {
    const {g}=acceptedClip(id),scan=stableExtracts(g);
    const longest=scan.discarded.reduce((a,b)=>!a||b.end-b.start>a.end-a.start?b:a,null);
    console.log(id,JSON.stringify({accepted:scan.accepted.map(s=>({start:s.start,end:s.end,duration:s.end-s.start})),longestDiscarded:longest?{...longest,duration:longest.end-longest.start}:null,shorterRuns:scan.discarded.length,alerts:scan.events.length}));
  }
  const {g}=acceptedClip('bachata-vaso-01'),{hands}=wristSeries(g);
  for(const h of hands) console.log(h.bone,JSON.stringify({before:rotationNoise(h.world),trials:[1,2,3].map(p=>({passes:p,...rotationNoise(filterWrist(h.world,p).quats)}))}));
}
const hashBytes=buf=>require('node:crypto').createHash('sha256').update(buf).digest('hex');
function assertWristsOnly(before,after) {
  assertPreserved(before,after);
  const allowed=new Uint8Array(before.buf.length);
  for(const tr of before.tracks.filter(t=>t.type==='rotation' && ['mixamorig:LeftHand','mixamorig:RightHand'].includes(t.bone))) {
    for(let i=0;i<tr.output.values.length;i++) allowed.fill(1,tr.output.offset+i*tr.output.stride,tr.output.offset+i*tr.output.stride+16);
  }
  for(let i=0;i<before.buf.length;i++) if(before.buf[i]!==after.buf[i] && !allowed[i]) throw Error('Accepted non-wrist data changed');
}
function smoothWorldWrist(world) {
  let passes=0,best=world.map(q=>q.slice()),metrics=rotationNoise(best),hot=new Set();
  const history=[{passes,...metrics}];
  while(metrics.returns>0) {
    const next=filterWrist(world,++passes), trial=rotationNoise(next.quats);
    // Critère de convergence numérique, pas de plafond arbitraire de passes.
    if(metrics.returnEnergy-trial.returnEnergy<=Number.EPSILON*Math.max(1,metrics.returnEnergy)) break;
    best=next.quats;metrics=trial;hot=next.hot;history.push({passes,...metrics});
  }
  return {quats:best,passes:history.at(-1).passes,hot,history};
}
async function extractGLB(g,start,end,name) {
  const {NodeIO,PropertyType}=require('@gltf-transform/core');
  const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
  const {prune}=require('@gltf-transform/functions');
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.readBinary(g.buf);
  const animations=doc.getRoot().listAnimations(), source=animations[0];
  if(!source) throw Error('No source clip');
  const buffer=doc.getRoot().listBuffers()[0], out=doc.createAnimation(name);
  for(const channel of source.listChannels()) {
    const tr=g.tracks.find(t=>t.bone===channel.getTargetNode().getName() && t.type===channel.getTargetPath());
    if(!tr || !['LINEAR','STEP'].includes(tr.interpolation)) throw Error('Unsupported extraction sampler');
    const internal=tr.times.map((t,i)=>({t,i})).filter(({t})=>t>start && t<end);
    const times=[start,...internal.map(v=>v.t),end];
    const cursor={value:0},values=[sample(tr,start,cursor),...internal.map(({i})=>tr.output.values[i]),sample(tr,end,cursor)];
    const input=doc.createAccessor().setType('SCALAR').setArray(new Float32Array(times.map(t=>t-start))).setBuffer(buffer);
    const output=doc.createAccessor().setType(channel.getSampler().getOutput().getType()).setArray(new Float32Array(values.flat())).setBuffer(buffer);
    const sampler=doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation(tr.interpolation);
    out.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(channel.getTargetNode()).setTargetPath(channel.getTargetPath()).setSampler(sampler));
  }
  for(const animation of animations) {
    for(const c of animation.listChannels()) c.dispose();
    for(const s of animation.listSamplers()) s.dispose();
    animation.dispose();
  }
  // Supprimer uniquement les anciens accessors ; conserver toute la hiérarchie.
  await doc.transform(prune({propertyTypes:[PropertyType.ACCESSOR]}));
  return Buffer.from(await io.writeBinary(doc));
}
function assertExtract(source,clip,start,end) {
  const assert=require('node:assert/strict');
  assert.equal(clip.json.animations.length,1,'Residual template clip must not remain');
  assert.equal(clip.tracks.length,source.tracks.length,'Animated channels lost');
  assert(Math.abs(audit(clip).duration-(end-start))<1e-5,'Clip cadence/duration changed');
  for(const tr of clip.tracks) {
    const original=source.tracks.find(t=>t.bone===tr.bone && t.type===tr.type);
    assert(original,'Unknown channel');
    assert.equal(tr.interpolation,original.interpolation);
    const cursor={value:0};
    tr.times.forEach((time,i)=>{
      const expected=sample(original,start+time,cursor),actual=tr.output.values[i];
      if(tr.type==='rotation') assert(angle(expected,actual)<0.001,'Clip rotation changed '+tr.bone);
      else actual.forEach((v,k)=>assert(Math.abs(v-expected[k])<=2**-20*Math.max(1,Math.abs(expected[k])),'Clip translation/scale changed '+tr.bone));
    });
  }
  // Le clip complet, pas seulement ses extrémités, doit rester sous les alertes.
  assert.equal(unstableFrames(clip,clipTimeline(clip)).events.length,0,'Unstable extract');
}
async function refineAndExtract() {
  const {row,g:base}=acceptedClip('bachata-vaso-01'),g=parse(Buffer.from(base.buf));
  const original=parse(fs.readFileSync(path.join(root,row.originalFile))),series=wristSeries(base),wrists=[];
  const rows=JSON.parse(fs.readFileSync(path.join(root,repairReport),'utf8')).rows, current=rows.find(r=>r.id===row.id);
  for(const h of series.hands) {
    const tr=g.tracks.find(t=>t.type==='rotation' && t.bone===h.bone);
    if(JSON.stringify(tr.times)!==JSON.stringify(series.times)) throw Error('Wrist timeline mismatch');
    const result=smoothWorldWrist(h.world),changed=new Set();
    for(const i of result.hot) {
      const local=qObj(h.parent[i]).invert().multiply(qObj(result.quats[i])).normalize().toArray();
      if(dot(local,tr.output.values[i])<0) local.forEach((v,k)=>local[k]=-v);
      local.forEach((v,k)=>g.buf.writeFloatLE(v,tr.output.offset+i*tr.output.stride+k*4));changed.add(i);
    }
    const detail=current.details.find(d=>'mixamorig:'+d.bone===h.bone);
    const raw=original.tracks.find(t=>t.type==='rotation' && t.bone===h.bone);
    const final=parse(g.buf).tracks.find(t=>t.type==='rotation' && t.bone===h.bone);
    const allChanged=new Set(final.output.values.map((q,i)=>JSON.stringify(q)!==JSON.stringify(raw.output.values[i])?i:-1).filter(i=>i>=0));
    detail.modified=changedIntervals(allChanged,tr.times);
    wrists.push({bone:h.bone,passes:result.passes,beforeWorld:rotationNoise(h.world),history:result.history,changed:changedIntervals(changed,tr.times)});
  }
  assertWristsOnly(base,parse(g.buf));
  const actual=wristSeries(parse(g.buf));
  wrists.forEach(w=>w.afterWorld=rotationNoise(actual.hands.find(h=>h.bone===w.bone).world));
  fs.writeFileSync(path.join(root,row.candidateFile),g.buf);
  current.after=audit(parse(g.buf));current.wristRefinement={baseCommit:acceptedRepairCommit,wrists};
  fs.writeFileSync(path.join(root,repairReport),JSON.stringify({version:1,method:'native source repairs; Bachata wrists additionally stabilized in world space',rows},null,2)+'\n');
  const summaryPath=path.join(root,'docs/npz-repair-candidates.md');
  let summary=fs.readFileSync(summaryPath,'utf8').replace(/^> Mise à jour Bachata[^\n]*\n\n/m,'');
  const note='> Mise à jour Bachata : stabilisation supplémentaire des poignets en espace monde, sans modifier le reste de la version validée. Voir `npz-refinement-and-extracts.md` pour la méthode et les mesures des mains.';
  summary=summary.replace('## Méthode et limites',note+'\n\n## Méthode et limites').replace(/^\| bachata-vaso-01 \|[^\n]*$/m,`| bachata-vaso-01 | ${current.before.jumps} | ${current.after.jumps} | ${current.details.filter(d=>d.modified.length).length} | ${current.details.reduce((n,d)=>n+d.unresolvedSourceIntervals.length,0)} |`);
  fs.writeFileSync(summaryPath,summary);
  const manifest={acceptedRepairCommit,selection:'User selected RnB 4.37s and Dolphin 3.53s/5.30s; no concatenation or crossfade',bachata:{file:row.candidateFile,acceptedSHA256:hashBytes(base.buf),resultSHA256:hashBytes(g.buf),wrists},sources:[],extracts:[]};
  for(const id of ['randb-anna-cortesi-c3d','yoga-dolphin-pose-or-ardha-pincha-mayurasana-a']) {
    const {row:parent,g:source}=acceptedClip(id),scan=stableExtracts(source);
    const selected=id==='randb-anna-cortesi-c3d'?[scan.discarded.reduce((a,b)=>!a||b.end-b.start>a.end-a.start?b:a,null)]:[scan.discarded.reduce((a,b)=>!a||b.end-b.start>a.end-a.start?b:a,null),...scan.accepted];
    if(selected.some(s=>!s) || selected.length!==(id.startsWith('randb')?1:2)) throw Error('Reviewed extraction intervals changed');
    manifest.sources.push({id,file:parent.candidateFile,sourceSHA256:hashBytes(source.buf),unstable:scan.unstable,otherStableRuns:scan.discarded.filter(s=>!selected.includes(s))});
    for(let i=0;i<selected.length;i++) {
      const span=selected[i],clipId=`${id}-clean-${String(i+1).padStart(2,'0')}`;
      const file=`public/animations/npz/clean-extracts/${clipId}.glb`,buf=await extractGLB(source,span.start,span.end,clipId);
      const parsed=parse(buf);assertExtract(source,parsed,span.start,span.end);
      fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),buf);
      manifest.extracts.push({id:clipId,parentId:id,file,start:span.start,end:span.end,duration:span.end-span.start,sha256:hashBytes(buf),quality:audit(parsed)});
    }
  }
  const definitions=manifest.extracts.map(r=>`  {\n    id: '${r.id}',\n    path: '${r.file.slice(7)}',\n    category: '${r.parentId.startsWith('yoga-')?'yoga':'dances'}',\n    label: '[EXTRAIT] ${r.parentId.startsWith('yoga-')?'Dolphin':'RnB Anna'} — ${r.id.endsWith('02')?'02':'01'} (${r.start.toFixed(2)}–${r.end.toFixed(2)} s)',\n    tags: ['npz-clean-extract'],\n    duration: ${Math.round(r.duration*1000)/1000},\n  },`).join('\n');
  const start='  // BEGIN NPZ CLEAN EXTRACTS',end='  // END NPZ CLEAN EXTRACTS',block=`${start}\n${definitions}\n${end}\n`;
  let text=fs.readFileSync(path.join(root,registryPath),'utf8');
  text=text.includes(start)?text.replace(new RegExp(start+'[\\s\\S]*?'+end+'\\n'),block):text.replace(/\n\];\s*$/,'\n'+block+'];\n');
  fs.writeFileSync(path.join(root,registryPath),text);
  fs.writeFileSync(refinementPath,JSON.stringify(manifest,null,2)+'\n');
  let md='# Mains de Bachata et extraits RnB / Dolphin\n\n';
  md+='## Bachata Vaso\n\nLa version acceptée du commit `c6c5468f` est la référence immuable. Seules les rotations locales LeftHand/RightHand sont réécrites pour lisser leurs orientations en espace monde ; bras, avant-bras, doigts, bassin, jambes, translations XYZ, échelles et dates restent identiques octet par octet. Le filtre [1,2,1] symétrique est limité aux zones d’alerte des mains. Le nombre de passes est le premier supprimant les retours angulaires >25°, avec arrêt si l’énergie ne diminue plus. Les rotations rapides monotones ne sont pas assimilées à des vibrations dans le bilan. Les positions des poignets ne sont pas déplacées.\n\n| Main | Retours >25° avant → après | Passes |\n|---|---:|---:|\n';
  for(const w of wrists) md+=`| ${w.bone} | ${w.beforeWorld.returns} → ${w.afterWorld.returns} | ${w.passes} |\n`;
  md+='\n## Trois extraits choisis\n\nLe seuil initial de cinq secondes ne laissait aucun RnB et un seul Dolphin. L’utilisateur a choisi ces trois exceptions précises. Chaque extrait est un fichier GLB autonome, avec ses temps rebases à zéro, ses valeurs de pose et ses translations XYZ conservées dans les coordonnées originales. Aucun recentrage, verrouillage de bassin, fondu, collage ou changement de vitesse. Les extraits ne sont pas rendus bouclables artificiellement : désactiver la boucle pour observer leurs limites naturelles.\n\n| Sélecteur | Passage source | Durée | Alertes rotation / retour |\n|---|---|---:|---:|\n';
  for(const c of manifest.extracts) md+=`| ${c.id} | ${c.start.toFixed(3)}–${c.end.toFixed(3)} s | ${c.duration.toFixed(3)} s | 0 |\n`;
  md+='\nLes alertes sont définies à 30 Hz : saut >25° sur un os ou excès d’aller-retour >25° sur trois frames. Les deux côtés d’un saut et les trois frames d’un retour sont exclus. Ce critère ne garantit pas la qualité visuelle du retargeting ni les contacts au sol ; les fragments restent à examiner en lecture. Les versions complètes et les originaux ne sont pas supprimés. Les extraits portent uniquement le tag `npz-clean-extract` pour rester hors des tirages IA habituels.\n\nLe JSON `scripts/npz_refinement.json` consigne les masques des mains, les mesures, les références SHA-256 et les passages rejetés. Commandes : `node scripts/temp_npz_resume.cjs refine`, `refine-test` et `refine-browser`.\n';
  fs.writeFileSync(path.join(root,'docs/npz-refinement-and-extracts.md'),md);
  console.log(JSON.stringify({wrists:wrists.map(w=>({bone:w.bone,before:w.beforeWorld.returns,after:w.afterWorld.returns,passes:w.passes})),extracts:manifest.extracts.map(c=>({id:c.id,start:c.start,end:c.end,duration:c.duration}))},null,2));
}
function testRefinement() {
  const assert=require('node:assert/strict'),manifest=JSON.parse(fs.readFileSync(refinementPath,'utf8'));
  const {g:base}=acceptedClip('bachata-vaso-01'),current=parse(fs.readFileSync(path.join(root,manifest.bachata.file)));
  assert.equal(hashBytes(base.buf),manifest.bachata.acceptedSHA256);assert.equal(hashBytes(current.buf),manifest.bachata.resultSHA256);
  assertWristsOnly(base,current);
  const actual=wristSeries(current);
  for(const w of manifest.bachata.wrists) {
    const noise=rotationNoise(actual.hands.find(h=>h.bone===w.bone).world);
    assert.equal(noise.returns,0,'Residual violent wrist returns');assert.deepEqual(noise,w.afterWorld);
  }
  const oldRig=poseRig(base),newRig=poseRig(current);
  for(const t of clipTimeline(current)) {
    oldRig.setTime(t);newRig.setTime(t);
    for(const bone of ['mixamorig:LeftHand','mixamorig:RightHand','mixamorig:LeftFoot','mixamorig:RightFoot','mixamorig:Hips']) {
      const a=oldRig.nodes.find(n=>n.name===bone).getWorldPosition(new THREE.Vector3());
      const b=newRig.nodes.find(n=>n.name===bone).getWorldPosition(new THREE.Vector3());
      assert(a.distanceTo(b)<1e-8,'Wrist/body origin moved');
    }
  }
  assert.equal(manifest.extracts.length,3);
  for(const r of manifest.extracts) {
    const {row,g}=acceptedClip(r.parentId),clip=parse(fs.readFileSync(path.join(root,r.file)));
    assert.equal(hashBytes(clip.buf),r.sha256);
    assert.equal(hashBytes(fs.readFileSync(path.join(root,row.candidateFile))),hashBytes(g.buf),'Parent candidate changed');
    assertExtract(g,clip,r.start,r.end);
    assert(entries.some(e=>e.id===r.id && e.file===r.file),'Missing selectable extract');
    const clipRig=poseRig(clip),sourceRig=poseRig(g);
    for(const t of clipTimeline(clip)) {
      clipRig.setTime(t);sourceRig.setTime(t+r.start);
      for(const node of clipRig.nodes) {
        const ref=sourceRig.nodes.find(n=>n.name===node.name);
        assert(ref,'Lost/renamed hierarchy node');
        const a=node.getWorldPosition(new THREE.Vector3()),b=ref.getWorldPosition(new THREE.Vector3());
        assert(a.distanceTo(b)<=2**-18*Math.max(1,b.length()),'Extract world trajectory changed '+node.name);
      }
    }
  }
  testRepairs();
  console.log('Refinement OK: wrists only, 0 violent world returns, unchanged wrist/foot/hips positions at every frame, 3 selected clips, full-channel and world-pose equivalence, 0 extract alerts.');
}
async function reviewRefinement() {
  const manifest=JSON.parse(fs.readFileSync(refinementPath,'utf8')),{row,g:base}=acceptedClip('bachata-vaso-01');
  const rows=[{id:row.candidateId,candidateId:row.candidateId,originalFile:'public/__npz_accepted_bachata.glb',originalRegistryId:row.candidateId,originalRegistryFile:row.candidateFile,candidateFile:row.candidateFile,before:audit(base),alignment:{outputStart:clipTimeline(base)[0]},details:[{bone:'LeftHand',modified:[{start:manifest.bachata.wrists[0].changed[0]?.start||0}]}],capture:true}];
  for(const c of manifest.extracts) {
    const {row:parent}=acceptedClip(c.parentId);
    rows.push({id:c.id,candidateId:c.id,originalRegistryId:parent.candidateId,originalFile:parent.candidateFile,candidateFile:c.file,sourceStart:c.start,before:{duration:c.duration},alignment:{outputStart:0},details:[],capture:true});
  }
  return reviewRepairs(rows,'npz_refinement_browser.json',{'/__npz_accepted_bachata.glb':base.buf},'/tmp/room-npz-refinement-review');
}
Promise.resolve(main()).catch(err=>{console.error(err);process.exitCode=1;});
