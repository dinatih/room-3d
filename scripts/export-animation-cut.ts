import { Accessor, NodeIO, type AnimationSampler } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { Quaternion, Vector3 } from 'three';
import type { AnimationOriginTransform } from '../src/features/scene/animations/animationResolver.ts';
import { VARIANT_ALIGNMENT_KEY } from '../src/features/scene/animations/variantAlignment.ts';

type Segment = [number, number];

function previousFloat(time: number) {
  const value = new Float32Array([time]);
  new Uint32Array(value.buffer)[0]--;
  return value[0];
}

function cutSampler(sampler: AnimationSampler, segments: Segment[], rotation: boolean, weights: boolean) {
  const input = sampler.getInput()!;
  const output = sampler.getOutput()!;
  const times = input.getArray()!;
  const values = output.getArray()!;
  const width = values.length / times.length;
  const interpolation = sampler.getInterpolation();
  if (interpolation !== 'LINEAR' && interpolation !== 'STEP') throw new Error('Interpolation non prise en charge.');
  if (!Number.isInteger(width) || (weights ? output.getType() !== Accessor.Type.SCALAR : width !== output.getElementSize())) {
    throw new Error('Piste GLB invalide.');
  }
  const nextTimes: number[] = [];
  const nextValues: number[] = [];
  const left = new Quaternion();
  const right = new Quaternion();
  let offset = 0;
  let index = 0;

  function sample(sourceTime: number, targetTime: number) {
    const time = Math.fround(targetTime);
    if (nextTimes.length && time <= nextTimes[nextTimes.length - 1]) throw new Error('Deux clés se confondent après la découpe.');
    nextTimes.push(time);
    while (index + 1 < times.length && times[index + 1] <= sourceTime) index++;
    const next = Math.min(index + 1, times.length - 1);
    const alpha = interpolation === 'STEP' || index === next ? 0
      : Math.max(0, (sourceTime - times[index]) / (times[next] - times[index]));
    if (rotation && alpha > 0) {
      left.fromArray(values, index * width).slerp(right.fromArray(values, next * width), alpha);
      nextValues.push(...left.toArray());
    } else {
      for (let i = 0; i < width; i++) {
        const a = values[index * width + i];
        nextValues.push(a + alpha * (values[next * width + i] - a));
      }
    }
  }

  for (const [segmentIndex, [start, end]] of segments.entries()) {
    const join = segmentIndex < segments.length - 1;
    const finish = Math.fround(offset + (end - start));
    sample(start, offset);
    for (let key = index + 1; key < times.length && times[key] < end; key++) {
      const target = Math.fround(offset + times[key] - start);
      if (target > Math.fround(offset) && target < (join ? previousFloat(finish) : finish)) sample(times[key], target);
    }
    if (!join || interpolation === 'LINEAR') sample(end, join ? previousFloat(finish) : finish);
    offset += end - start;
  }
  sampler.setInput(input.clone().setArray(Float32Array.from(nextTimes)));
  sampler.setOutput(output.clone().setArray(Float32Array.from(nextValues)));
}

export async function exportAnimationVariant(
  source: string, name: string, requested?: Segment[], alignment?: AnimationOriginTransform,
) {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
  });
  const doc = await io.read(source);
  const [clip, ...others] = doc.getRoot().listAnimations();
  if (!clip) throw new Error('Le GLB ne contient aucune animation.');
  const channels = clip.listChannels();
  const duration = Math.max(...channels.map(channel => {
    const times = channel.getSampler()!.getInput()!.getArray()!;
    return times[times.length - 1];
  }));
  const segments: Segment[] = [];
  for (const [rawStart, rawEnd] of requested ?? []) {
    const start = Math.fround(rawStart);
    const end = Math.fround(rawEnd);
    const previous = segments[segments.length - 1];
    if (start < 0 || !(end > start) || end > duration || (previous && start < previous[1])) {
      throw new Error('Les plages doivent être ordonnées, disjointes et comprises dans le clip.');
    }
    if (previous && start === previous[1]) previous[1] = end;
    else segments.push([start, end]);
  }
  if (segments.length === 1 && segments[0][0] === 0 && segments[0][1] === duration) {
    throw new Error('La sélection couvre toute l’animation.');
  }
  others.forEach(animation => animation.dispose());
  if (requested) {
    for (const sampler of clip.listSamplers()) {
      const path = channels.find(channel => channel.getSampler() === sampler)?.getTargetPath();
      if (path) cutSampler(sampler, segments, path === 'rotation', path === 'weights');
    }
  }
  if (alignment) {
    const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), alignment.rotY).toArray();
    const translation: [number, number, number] = [
      alignment.offset[0] / 100, alignment.offset[1] / 100, alignment.offset[2] / 100,
    ];
    for (const scene of doc.getRoot().listScenes()) {
      let origin = scene.listChildren().find(node => node.getExtras()[VARIANT_ALIGNMENT_KEY] === true);
      if (!origin) {
        origin = doc.createNode('Room 3D – Recentrage').setExtras({ [VARIANT_ALIGNMENT_KEY]: true });
        for (const root of scene.listChildren()) {
          scene.removeChild(root);
          origin.addChild(root);
        }
        scene.addChild(origin);
      }
      origin.setTranslation(translation).setRotation(rotation);
    }
  }
  clip.setName(name);
  // Decoded buffer views can be written directly without recompressing them.
  for (const extension of doc.getRoot().listExtensionsUsed()) {
    if (extension.extensionName === 'EXT_meshopt_compression' || extension.extensionName === 'KHR_meshopt_compression') {
      extension.dispose();
    }
  }
  await doc.transform(prune({ propertyTypes: ['accessor'], keepAttributes: true }));
  return { bytes: await io.writeBinary(doc), duration: requested ? Math.fround(segments.reduce((sum, [start, end]) => sum + (end - start), 0)) : duration, segments };
}
