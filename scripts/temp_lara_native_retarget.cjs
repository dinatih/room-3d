// Regression against the native retargeting before the Mixamo rig experiment.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const baseline = 'f7f22fbe^';

async function main() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  global.ProgressEvent = class { constructor(type, data) { Object.assign(this, { type }, data); } };
  async function load(relative) {
    const bytes = fs.readFileSync(path.join(root, 'public', relative));
    const length = bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.subarray(20, 20 + length));
    const start = 20 + length;
    const bin = bytes.subarray(start + 8, start + 8 + bytes.readUInt32LE(start));
    json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
    for (const node of json.nodes) { delete node.mesh; delete node.skin; }
    for (const key of ['meshes', 'textures', 'images', 'materials', 'extensionsRequired', 'extensionsUsed']) delete json[key];
    return new GLTFLoader().parseAsync(JSON.stringify(json), '');
  }
  async function moduleFor(old) {
    const outfile = `/tmp/lara-native-retarget-${old ? 'baseline' : 'current'}.mjs`;
    await esbuild.build({
      stdin: { contents: `export {retargetClip} from './src/features/scene/retargeting/retargetClip'; export {resolveTargetBoneName} from './src/features/scene/retargeting/boneResolver';`, resolveDir: root },
      bundle: true, platform: 'node', format: 'esm', outfile,
      plugins: old ? [{ name: 'before-experiment', setup(build) {
        build.onLoad({ filter: /boneResolver\.ts$/ }, args => ({
          contents: execFileSync('git', ['show', `${baseline}:src/features/scene/retargeting/boneResolver.ts`], { cwd: root, encoding: 'utf8' }),
          loader: 'ts', resolveDir: path.dirname(args.path),
        }));
      } }] : [],
    });
    return import(pathToFileURL(outfile));
  }
  const current = await moduleFor(false);
  const original = await moduleFor(true);
  const models = ['characters/lara/lara_native.glb', 'characters/xbot/Xbot_official.glb'];
  const clips = [
    'animations/miley/miley_armature_against_wall_turn_l_to_sneakwalk.glb',
    'animations/miley/miley_armature_idle01_f.glb',
    'animations/mixamo/anim_female_walk.glb',
  ];
  let differences = 0;
  for (const model of models) {
    const roles = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'RightArm', 'LeftUpLeg', 'RightFoot'];
    const target = (await load(model)).scene;
    for (const role of roles) {
      const before = original.resolveTargetBoneName(target, role);
      const after = current.resolveTargetBoneName(target, role);
      if (before !== after) { differences++; console.log(`${model} ${role}: ${before} -> ${after}`); }
    }
    for (const animation of clips) {
      const outputs = [];
      for (const api of [original, current]) {
        const scene = (await load(model)).scene;
        scene.updateMatrixWorld(true);
        scene.traverse(node => {
          node.defaultPosition = node.position.clone();
          node.restLocalQuaternion = node.quaternion.clone();
          node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
          node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
        });
        const source = await load(animation);
        const clip = api.retargetClip(source.animations[0], scene, source.scene);
        const mixer = new THREE.AnimationMixer(scene);
        mixer.clipAction(clip).play();
        const frames = [];
        for (let frame = 0; frame < Math.ceil(clip.duration * 30); frame++) {
          mixer.setTime(frame / 30);
          scene.updateMatrixWorld(true);
          const matrices = [];
          scene.traverse(node => { if (node.isBone) matrices.push(...node.matrixWorld.elements); });
          frames.push(matrices);
        }
        outputs.push(frames);
      }
      let maxError = 0;
      assert.equal(outputs[0].length, outputs[1].length);
      for (let i = 0; i < outputs[0].length; i++) {
        assert.equal(outputs[0][i].length, outputs[1][i].length);
        for (let j = 0; j < outputs[0][i].length; j++) maxError = Math.max(maxError, Math.abs(outputs[0][i][j] - outputs[1][i][j]));
      }
      console.log(`${model} / ${animation}: ${outputs[0].length} frames, max matrix difference ${maxError}`);
      if (!process.argv.includes('--diagnose')) assert(maxError < 1e-7, 'Retargeted pose differs from before the experiment');
    }
  }
  if (!process.argv.includes('--diagnose')) assert.equal(differences, 0, 'Bone mapping differs from before the experiment');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
