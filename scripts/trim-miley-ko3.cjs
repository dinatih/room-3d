// Remove KO3's idle tail at the partner's endpoint, without stretching motion.
const fs = require('node:fs');
const path = require('node:path');
const T = require('three');
(async () => {
 const { NodeIO } = await import('@gltf-transform/core');
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader();loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new T.Group())}));
 const file='miley_armature_ko3_attack_hammer_fist.glb';
 const source=path.join('/home/dinatih/3D Resources/anims',file);
 const bytes=fs.readFileSync(source), original=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const partnerBytes=fs.readFileSync('public/animations/miley/miley_armature_ko3_fall_to_ground_side_up02.glb');
 const partner=await loader.parseAsync(partnerBytes.buffer.slice(partnerBytes.byteOffset,partnerBytes.byteOffset+partnerBytes.byteLength),'');
 const end=partner.animations[0].duration, clip=original.animations[0];
 if(!(end<clip.duration))throw Error('KO3 source no longer has the expected excess tail');
 const io=new NodeIO(), document=await io.read(source), animation=document.getRoot().listAnimations()[0];
 let maximumTailRotation=0, maximumTailTranslation=0;
 for(const channel of animation.listChannels()) {
  const sampler=channel.getSampler(), input=sampler.getInput(), output=sampler.getOutput();
  const track=clip.tracks.find(track=>track.name===channel.getTargetNode().getName()+'.'+({rotation:'quaternion',translation:'position',scale:'scale'}[channel.getTargetPath()]));
  if(!track)throw Error('Missing source track');
  const at=track.createInterpolant().evaluate(end), width=track.getValueSize();
  for(let i=0;i<track.times.length;i++)if(track.times[i]>end) {
   const values=track.values.slice(i*width,(i+1)*width);
   if(channel.getTargetPath()==='rotation')maximumTailRotation=Math.max(maximumTailRotation,new T.Quaternion().fromArray(at).normalize().angleTo(new T.Quaternion().fromArray(values).normalize())*180/Math.PI);
   if(channel.getTargetPath()==='translation')maximumTailTranslation=Math.max(maximumTailTranslation,Math.hypot(...values.map((v,j)=>v-at[j])));
  }
  const count=Array.from(track.times).filter(time=>time<end).length;
  const times=new Float32Array(count+1), values=new Float32Array((count+1)*width);
  times.set(track.times.slice(0,count));times[count]=end;
  values.set(track.values.slice(0,count*width));values.set(at,count*width);
  // Clone per sampler: source accessors may be shared by constant channels.
  sampler.setInput(document.createAccessor().setType(input.getType()).setArray(times));
  sampler.setOutput(document.createAccessor().setType(output.getType()).setArray(values));
 }
 // Keep mesh/skin accessors; dispose only detached animation buffers.
 for(const accessor of document.getRoot().listAccessors())if(accessor.listParents().length===1)accessor.dispose();
 const outputBytes=await io.writeBinary(document);
 const shortened=await loader.parseAsync(outputBytes.buffer.slice(outputBytes.byteOffset,outputBytes.byteOffset+outputBytes.byteLength),'');
 for(const track of clip.tracks) {
  const before=track.createInterpolant(), after=shortened.animations[0].tracks.find(t=>t.name===track.name).createInterpolant();
  for(const time of track.times)if(time<=end) {
   const a=before.evaluate(time),b=after.evaluate(time);
   for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>2**-23*Math.max(1,Math.abs(a[i]))*8)throw Error(`Trim changes retained motion: ${track.name} at ${time}`);
  }
 }
 if(process.argv.includes('--write')) {
  fs.writeFileSync('public/animations/miley/'+file,outputBytes);
  const registry='src/features/scene/animations/animationRegistry.ts';
  const frames=Math.max(...animation.listSamplers().map(s=>s.getInput().getCount()));
  const label=`[MILEY] Ko3 Attack Hammer Fist (${frames}f / ${end.toFixed(1)}s, ${Math.round(outputBytes.length/1024)}KB)`;
  const pattern=/(id: 'miley-armature-ko3-attack-hammer-fist',[\s\S]*?label: )`[^`]*`([\s\S]*?duration: )[\d.]+/;
  const text=fs.readFileSync(registry,'utf8');
  if(!pattern.test(text))throw Error('KO3 registry entry missing');
  fs.writeFileSync(registry,text.replace(pattern,(_,a,b)=>a+'`'+label+'`'+b+end));
 }
 console.log(JSON.stringify({written:process.argv.includes('--write'),beforeSeconds:clip.duration,afterSeconds:end,maximumTailRotationDegrees:maximumTailRotation,maximumTailTranslationSourceUnits:maximumTailTranslation}));
})().catch(e=>{console.error(e);process.exitCode=1});
