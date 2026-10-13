/** Audit/reprise NPZ: node scripts/temp_npz_resume.cjs audit|restore|smooth|retime-combat-b|olivia|metadata|verify
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
  if(!['audit','restore','smooth','retime-combat-b','olivia','inspect','metadata','verify'].includes(mode)) throw Error('Unknown mode '+mode);
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
    const zlib = require('node:zlib');
    function npz(file) {
      const b = fs.readFileSync(file), out = { names: [] };
      let end = b.length-22;
      while (end >= 0 && b.readUInt32LE(end) !== 0x06054b50) end--;
      if (end < 0) throw Error('Missing ZIP directory');
      let off = b.readUInt32LE(end+16);
      for (let i=0; i<b.readUInt16LE(end+10); i++) {
        if (b.readUInt32LE(off) !== 0x02014b50) throw Error('Invalid ZIP directory');
        const n = b.readUInt16LE(off+28), extra = b.readUInt16LE(off+30), comment=b.readUInt16LE(off+32);
        const name = b.toString('utf8',off+46,off+46+n), start=b.readUInt32LE(off+42), size=b.readUInt32LE(off+20), method=b.readUInt16LE(off+10);
        out.names.push(name);
        const dataStart=start+30+b.readUInt16LE(start+26)+b.readUInt16LE(start+28);
        const raw=b.subarray(dataStart,dataStart+size);
        if (/^(poses|mocap_frame_rate|mocap_framerate|fps)\.npy$/.test(name)) {
          const data=method===8?zlib.inflateRawSync(raw):raw;
          if (method!==8 && method!==0) throw Error('Unsupported ZIP compression');
          const major=data[6], headerStart=major===1?10:12, len=major===1?data.readUInt16LE(8):data.readUInt32LE(8);
          const header=data.toString('ascii',headerStart,headerStart+len);
          if (!/'fortran_order': False/.test(header)) throw Error('Unsupported NPY order');
          const dtype=header.match(/'descr': '([^']+)'/)[1], shape=header.match(/'shape': \(([^)]*)\)/)[1].split(',').map(x=>x.trim()).filter(Boolean).map(Number);
          if (!['<f8','<f4'].includes(dtype)) throw Error('Unsupported NPY dtype '+dtype);
          const width=dtype==='<f8'?8:4, count=shape.reduce((a,b)=>a*b,1), offset=headerStart+len;
          out[name.slice(0,-4)]={shape, values:Array.from({length:count},(_,i)=>width===8?data.readDoubleLE(offset+i*width):data.readFloatLE(offset+i*width))};
        }
        off+=46+n+extra+comment;
      }
      return out;
    }
    const dir='/home/dinatih/3D Resources/animations/DanceDB/DanceDB/20131001_OliviaKyriakides';
    const rows=fs.readdirSync(dir).filter(f=>f.endsWith('_poses.npz')).map(file=>{
      const data=npz(path.join(dir,file)), poses=data.poses, fps=(data.mocap_frame_rate || data.mocap_framerate || data.fps)?.values[0];
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
main();
