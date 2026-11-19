import { GroundDatumLines } from '@features/inventory/GroundDatumLines';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@features/scene/camera/OrbitControls';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { GlobalSkeletonHelpers } from '@features/scene/utils/GlobalSkeletonHelpers';
import { SkeletonHierarchyPanel } from '@features/scene/utils/SkeletonHierarchyPanel';
import type { SkeletonGroup } from '@features/scene/utils/skeletonTypes';
import { AnimationSelect } from '@features/inventory/AnimationSelect';
import { pitbullAnimationChoices } from '@features/inventory/pitbullAnimationChoices';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import './dogComparison.css';

const NORMALIZED_HEIGHT = 100;
const MODELS = [
  { id: 'pitbull', label: 'Pitbull', path: '/characters/animated-pitbull-dog/dog.glb', height: 55, reference: '/references/xray/pitbull-xray.png' },
  { id: 'ushiro', label: 'Ushiro — Shiba Inu', path: '/characters/ushiro/ushiro.glb', height: 40, reference: '/references/xray/ushiro-xray.png' },
  { id: 'ulotte-hd', label: 'Ulotte HD — teckel noir', path: '/characters/dachshund-sculpt/dog.glb', height: 30, reference: '/references/xray/ulotte-xray.png' },
] as const;
type Model = typeof MODELS[number];
type View = 'side' | 'front' | 'back' | 'three-quarter' | 'top';
type CameraPose = { direction: [number, number, number]; target: [number, number, number]; up: [number, number, number]; zoom: number };
type Metadata = { id: string; size: [number, number, number]; bones: number; vertices: number; duration: number; clip: string };
const DIRECTIONS: Record<View, [number, number, number]> = { side: [1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], 'three-quarter': [1, .3, 1], top: [0, 1, 0] };
function urlParam(key: string, value: string | null) {
  const url = new URL(location.href);
  if (value === null) url.searchParams.delete(key); else url.searchParams.set(key, value);
  history.replaceState(null, '', url);
}

/** The only clock. The three mixers read this phase and never advance it. */
function ComparisonClock() {
  useEffect(() => {
    let previous = performance.now(), handle: number;
    const frame = (now: number) => {
      useAnimPreviewStore.getState().tick((now - previous) / 1000);
      previous = now; handle = requestAnimationFrame(frame);
    };
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, []);
  return null;
}
function Playback() {
  const s = useAnimPreviewStore();
  const frames = Math.round(s.duration * s.fps), frame = Math.min(frames, Math.round(s.currentTime * s.fps));
  const rememberFrame = () => urlParam('frame', String(Math.round(useAnimPreviewStore.getState().currentTime * s.fps)));
  const step = (direction: number) => { s.stepFrame(direction); rememberFrame(); };
  return <div className="d-flex flex-wrap gap-2 align-items-center" aria-label="Lecture synchronisée">
    <button className="btn btn-sm btn-outline-secondary text-dark" aria-label="Image précédente" onClick={() => step(-1)}><i className="bi bi-skip-backward-fill" /></button>
    <button className="btn btn-sm btn-primary" aria-label={s.isPlaying ? 'Pause' : 'Lire'} onClick={() => { s.togglePlay(); if (useAnimPreviewStore.getState().isPlaying) urlParam('frame', null); else rememberFrame(); }}><i className={`bi bi-${s.isPlaying ? 'pause' : 'play'}-fill`} /></button>
    <button className="btn btn-sm btn-outline-secondary text-dark" aria-label="Image suivante" onClick={() => step(1)}><i className="bi bi-skip-forward-fill" /></button>
    <input className="form-range flex-grow-1 w-auto" type="range" min={0} max={frames} value={frame} aria-label="Image commune" onChange={event => { s.pause(); s.seekToFrame(Number(event.target.value)); rememberFrame(); }} />
    <span className="small text-nowrap font-monospace" data-testid="comparison-frame">Image {frame} / {frames} · {s.currentTime.toFixed(2)} s</span>
    <select className="form-select form-select-sm w-auto" aria-label="Vitesse" value={s.speed} onChange={e => s.setSpeed(Number(e.target.value))}>{[.25, .5, 1, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select>
    <label className="form-check-label small d-flex gap-1 align-items-center"><input className="form-check-input m-0" type="checkbox" checked={s.isLooping} onChange={e => s.setLooping(e.target.checked)} /> Boucle</label>
  </div>;
}

function SyncedCamera({ pose, onChange, extent }: { pose: CameraPose; onChange: (pose: CameraPose) => void; extent: [number, number, number] }) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null), applying = useRef(false);
  const fitZoom = size.height / (Math.max(extent[1], Math.hypot(extent[0], extent[2]) / (size.width / size.height)) * 1.15);
  const distance = Math.hypot(...extent) * 3;
  useLayoutEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    applying.current = true;
    orbit.target.set(...pose.target);
    camera.position.copy(orbit.target).addScaledVector(new THREE.Vector3(...pose.direction).normalize(), distance);
    (camera as THREE.OrthographicCamera).zoom = fitZoom * pose.zoom;
    camera.up.set(...pose.up); camera.lookAt(orbit.target); camera.updateProjectionMatrix(); orbit.update();
    applying.current = false;
  }, [pose, camera, fitZoom, distance]);
  return <OrbitControls ref={controls} makeDefault enableDamping={false} onChange={() => {
    if (applying.current || !controls.current) return;
    const target = controls.current.target;
    const direction = camera.position.clone().sub(target).normalize();
    onChange({ direction: direction.toArray(), target: target.toArray(), up: camera.up.toArray(), zoom: (camera as THREE.OrthographicCamera).zoom / fitZoom });
  }} />;
}

function DogModel({ model, clipName, height, referencePose, onMetadata }: { model: Model; clipName: string; height: number; referencePose: boolean; onMetadata: (metadata: Metadata) => void }) {
  const { scene, animations } = useGLTFClone(model.path, true);
  const clips = useMemo(() => animations.map(source => {
    const clip = source.clone();
    // Smooth the donor's STEP samplers before the mixer creates interpolants.
    for (const track of clip.tracks) track.setInterpolation(THREE.InterpolateLinear);
    return clip;
  }), [animations]);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const action = useRef<THREE.AnimationAction | null>(null), dimensions = useRef<[number, number, number]>([0, 0, 0]);
  const wireframe = useSceneStore(s => !!s.layers.wireframe);
  useLayoutEffect(() => {
    mixer.stopAllAction(); scene.scale.set(1, 1, 1); scene.position.set(0, 0, 0); scene.updateMatrixWorld(true);
    const idle = clips.find(clip => clip.name === 'idle 50');
    if (!idle) throw new Error(`Pose d’attente absente : ${model.label}`);
    mixer.clipAction(idle).reset().play(); mixer.setTime(0); scene.updateMatrixWorld(true);
    const box = glbLocalBBox(scene, true), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    mixer.stopAllAction();
    if (size.y <= 0) throw new Error(`Dimensions invalides : ${model.label}`);
    const scale = height / size.y;
    scene.scale.setScalar(scale); scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    dimensions.current = size.multiplyScalar(scale).toArray();
  }, [scene, mixer, clips, height, model.label]);
  useEffect(() => {
    scene.traverse(object => {
      if (!(object as THREE.Mesh).isMesh) return;
      const material = (object as THREE.Mesh).material;
      for (const m of Array.isArray(material) ? material : [material]) (m as THREE.MeshStandardMaterial).wireframe = wireframe;
    });
  }, [scene, wireframe]);
  useEffect(() => {
    const clip = clips.find(candidate => candidate.name === clipName);
    if (!clip) throw new Error(`Animation absente : ${model.label} / ${clipName}`);
    mixer.stopAllAction();
    if (referencePose) {
      scene.traverse(object => { if ((object as THREE.SkinnedMesh).isSkinnedMesh) (object as THREE.SkinnedMesh).skeleton.pose(); });
      action.current = null;
      scene.userData.comparisonPhase = 0; scene.userData.comparisonClip = 'bind-pose';
      scene.updateMatrixWorld(true);
    } else {
      action.current = mixer.clipAction(clip).reset().setLoop(THREE.LoopOnce, 1); action.current.clampWhenFinished = true; action.current.play(); mixer.update(0);
    }
    let bones = 0, vertices = 0;
    scene.traverse(object => { if ((object as THREE.Bone).isBone) bones++; if ((object as THREE.Mesh).isMesh) vertices += (object as THREE.Mesh).geometry.getAttribute('position').count; });
    onMetadata({ id: model.id, size: dimensions.current, bones, vertices, duration: clip.duration, clip: clip.name });
    return () => { mixer.stopAllAction(); action.current = null; };
  }, [scene, mixer, clips, model, clipName, height, referencePose, onMetadata]);
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); }, [mixer, scene]);
  useFrame(() => {
    if (!action.current) return;
    const clock = useAnimPreviewStore.getState();
    action.current.paused = false;
    mixer.setTime(clock.duration ? clock.currentTime / clock.duration * action.current.getClip().duration : 0);
    scene.userData.comparisonPhase = action.current.time / action.current.getClip().duration;
    scene.userData.comparisonClip = action.current.getClip().name;
    scene.updateMatrixWorld(true);
  });
  return <primitive object={scene} />;
}

function DogPanel({ model, clip, equalHeight, referencePose, pose, onCamera, extent, onMetadata, metadata, references }: {
  model: Model; clip: string; equalHeight: boolean; referencePose: boolean; pose: CameraPose; onCamera: (pose: CameraPose) => void; extent: [number, number, number]; onMetadata: (m: Metadata) => void; metadata?: Metadata; references: boolean;
}) {
  const skeleton = useSceneStore(s => !!s.layers.skeleton);
  const [groups, setGroups] = useState<SkeletonGroup[]>([]), [selected, setSelected] = useState<string | null>(null), [tree, setTree] = useState(false);
  return <div className="d-flex flex-column gap-2">
    <section className="card overflow-hidden" aria-label={model.label}>
    <div className="card-header d-flex justify-content-between align-items-center gap-2">
      <strong className="small">{model.label}</strong>
      <button className="btn btn-sm btn-outline-secondary text-dark" onClick={() => { if (!tree && !skeleton) useSceneStore.getState().toggleLayer('skeleton'); setTree(value => !value); }} aria-expanded={tree}>Os {metadata ? `(${metadata.bones})` : '…'}</button>
    </div>
    <div className="dog-comparison-viewport" data-model={model.id}>
      <Canvas orthographic camera={{ position: [500, 50, 0], near: .1, far: 10000 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#e4e8ed']} />
        <hemisphereLight args={['#ffffff', '#7b8190', 2]} /><directionalLight position={[100, 200, 150]} intensity={2.5} />
        <SyncedCamera pose={pose} onChange={onCamera} extent={extent} />
        <GroundDatumLines mode={Math.abs(pose.direction[1]) > Math.max(Math.abs(pose.direction[0]), Math.abs(pose.direction[2])) ? 'top' : Math.abs(pose.direction[0]) > Math.abs(pose.direction[2]) ? 'east' : 'north'} span={Math.max(...extent) * 2} />
        <Grid infiniteGrid cellSize={10} sectionSize={50} fadeDistance={1000} cellColor="#acb3bf" sectionColor="#7c8798" position={[0, -.05, 0]} />
        <Suspense fallback={null}>
          <DogModel model={model} clipName={clip} height={equalHeight ? NORMALIZED_HEIGHT : model.height} referencePose={referencePose} onMetadata={onMetadata} />
        </Suspense>
        <GlobalSkeletonHelpers show={skeleton} selectedBoneName={selected} onSelectBoneName={setSelected} onSkeletonGroupsChange={setGroups} />
      </Canvas>
    </div>
    <div className="card-body p-2 small text-body-secondary">{metadata ? `${metadata.bones} os · ${metadata.vertices.toLocaleString('fr-FR')} sommets · ${metadata.duration.toFixed(2)} s` : 'Lecture du modèle…'}</div>
    {tree && <div className="dog-comparison-bone-tree"><SkeletonHierarchyPanel skeletons={groups} selectedBoneName={selected} onSelectBoneName={setSelected} onClose={() => setTree(false)} /></div>}
    </section>
    {references && <figure className="card overflow-hidden mb-0" aria-label={`Référence anatomique — ${model.label}`}>
      <a href={model.reference} target="_blank" rel="noreferrer" title={`Agrandir la référence anatomique — ${model.label}`}><img className="w-100" src={model.reference} alt={`Anatomie théorique — ${model.label}`} /></a>
      <figcaption className="card-body p-2 small text-body-secondary">{model.label} · anatomie théorique</figcaption>
    </figure>}
  </div>;
}

export function DogComparison() {
  const initial = useMemo(() => new URLSearchParams(location.search), []);
  const [clip, setClip] = useState(initial.get('clip') || 'walk_fwd 29');
  const [layout, setLayout] = useState(initial.get('layout') === 'rows' ? 'rows' : 'columns');
  const [view, setView] = useState<View>((initial.get('view') as View) || 'side');
  const [equalHeight, setEqualHeight] = useState(true), [references, setReferences] = useState(true);
  const [referencePose, setReferencePose] = useState(initial.get('referencePose') === '1');
  useEffect(() => { if (referencePose) useAnimPreviewStore.getState().pause(); }, [referencePose]);
  const [metadata, setMetadata] = useState<Record<string, Metadata>>({});
  const [pose, setPose] = useState<CameraPose>({ direction: DIRECTIONS[view] || DIRECTIONS.side, target: [0, NORMALIZED_HEIGHT / 2, 0], up: view === 'top' ? [0, 0, -1] : [0, 1, 0], zoom: 1 });
  const initialFrameUsed = useRef(false);
  const skeleton = useSceneStore(s => !!s.layers.skeleton), wireframe = useSceneStore(s => !!s.layers.wireframe);
  const reportMetadata = useCallback((m: Metadata) => {
    setMetadata(previous => ({ ...previous, [m.id]: m }));
    if (m.id === 'pitbull') {
      useAnimPreviewStore.getState().setClipInfo(m.clip, m.duration, false, 30);
      if (!initialFrameUsed.current) {
        initialFrameUsed.current = true;
        if (initial.has('frame')) { useAnimPreviewStore.getState().pause(); useAnimPreviewStore.getState().seekToFrame(Number(initial.get('frame'))); }
      }
    }
  }, [initial]);
  const extent = useMemo<[number, number, number]>(() => {
    const loaded = Object.values(metadata);
    return loaded.length ? [Math.max(...loaded.map(m => m.size[0])), Math.max(...loaded.map(m => m.size[1])), Math.max(...loaded.map(m => m.size[2]))] : [100, 100, 225];
  }, [metadata]);
  const selectClip = (value: string) => { setClip(value); useAnimPreviewStore.getState().seekToTime(0); urlParam('clip', value); urlParam('frame', null); };
  const selectView = (value: View) => { setView(value); setPose({ direction: DIRECTIONS[value], target: [0, equalHeight ? NORMALIZED_HEIGHT / 2 : Math.max(...MODELS.map(m => m.height)) / 2, 0], up: value === 'top' ? [0, 0, -1] : [0, 1, 0], zoom: 1 }); urlParam('view', value); };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, select, textarea, button')) return;
      if (event.key.toLowerCase() === 'k') useSceneStore.getState().toggleLayer('skeleton');
      if (event.code === 'Space') { event.preventDefault(); if (referencePose) return; const s = useAnimPreviewStore.getState(); s.togglePlay(); urlParam('frame', useAnimPreviewStore.getState().isPlaying ? null : String(Math.round(s.currentTime * s.fps))); }
    };
    document.addEventListener('keydown', key);return () => document.removeEventListener('keydown', key);
  }, [referencePose]);
  if (!Object.prototype.hasOwnProperty.call(DIRECTIONS, view) || (initial.has('frame') && (!Number.isInteger(Number(initial.get('frame'))) || Number(initial.get('frame')) < 0)) || !pitbullAnimationChoices.some(option => option.value === clip)) return <div className="alert alert-danger m-3">Paramètres de comparaison invalides (animation : {clip}). <a href="/dog-comparison.html">Réinitialiser la comparaison</a></div>;
  return <main className="container-fluid p-3 dog-comparison-page">
    <ComparisonClock />
    <header className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h1 className="h4 mb-0">Comparaison des chiens</h1>
      <a className="btn btn-sm btn-outline-secondary text-dark" href={`/?inventory=animals&item=ushiro${skeleton ? '&skeleton=1' : ''}`}>Retour à l’inventaire</a>
    </header>
    <div className="card mb-3 dog-comparison-controls"><div className="card-body p-2 d-flex flex-column gap-2">
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <AnimationSelect options={pitbullAnimationChoices} value={clip} onChange={selectClip} />
        <select className="form-select form-select-sm w-auto" aria-label="Disposition" value={layout} onChange={e => { setLayout(e.target.value); urlParam('layout', e.target.value); }}><option value="columns">Côte à côte</option><option value="rows">Empilés</option></select>
        <select className="form-select form-select-sm w-auto" aria-label="Vue commune" value={view} onChange={e => selectView(e.target.value as View)}><option value="side">Profil</option><option value="front">Face</option><option value="back">Dos</option><option value="three-quarter">3/4</option><option value="top">Dessus</option></select>
        <button className="btn btn-sm btn-outline-secondary text-dark" aria-label="Réinitialiser les caméras" onClick={() => selectView(view)}>Recadrer</button>
        <button className={`btn btn-sm ${skeleton ? 'btn-primary' : 'btn-outline-secondary text-dark'}`} aria-pressed={skeleton} aria-label="Squelette" onClick={() => useSceneStore.getState().toggleLayer('skeleton')}>🦴 Squelette</button>
        <button className={`btn btn-sm ${wireframe ? 'btn-primary' : 'btn-outline-secondary text-dark'}`} aria-pressed={wireframe} onClick={() => useSceneStore.getState().toggleLayer('wireframe')}>Filaire</button>
        <label className="form-check-label small d-flex gap-1 align-items-center"><input type="checkbox" className="form-check-input m-0" checked={equalHeight} onChange={e => { setEqualHeight(e.target.checked); setPose(p => ({ ...p, target: [0, e.target.checked ? NORMALIZED_HEIGHT / 2 : Math.max(...MODELS.map(m => m.height)) / 2, 0] })); }} /> Même hauteur</label>
        <label className="form-check-label small d-flex gap-1 align-items-center"><input type="checkbox" className="form-check-input m-0" checked={references} onChange={e => setReferences(e.target.checked)} /> Références anatomiques</label>
        <label className="form-check-label small d-flex gap-1 align-items-center"><input type="checkbox" className="form-check-input m-0" checked={referencePose} onChange={e => { setReferencePose(e.target.checked); urlParam('referencePose', e.target.checked ? '1' : null); }} /> Pose de référence</label>
      </div>
      <label className="small d-flex flex-column gap-1">
        Animation courante — nom et identifiant (cliquer pour tout sélectionner, puis Ctrl+C)
        <input
          className="form-control form-control-sm font-monospace"
          readOnly
          value={referencePose ? 'Pose de référence | ID : bind-pose' : `${pitbullAnimationChoices.find(option => option.value === clip)!.label} | ID : ${clip}`}
          onClick={event => event.currentTarget.select()}
          onFocus={event => event.currentTarget.select()}
        />
      </label>
      <fieldset disabled={referencePose}><Playback /></fieldset>
      <span className="small text-body-secondary">{referencePose ? 'Pose de liaison du maillage, sans animation.' : 'Lecture et phase communes · interpolation fluide.'} Caméras liées · cliquer un os affiche ses influences sur la peau. {equalHeight ? 'Hauteurs dans l’attente normalisées pour comparer les proportions.' : 'Dimensions de présentation des modèles en centimètres.'}</span>
    </div></div>
    <div className={`dog-comparison-grid ${layout === 'rows' ? 'stacked' : ''}`}>
      {MODELS.map(model => <DogPanel key={model.id} model={model} clip={clip} equalHeight={equalHeight} referencePose={referencePose} pose={pose} onCamera={setPose} extent={extent} onMetadata={reportMetadata} metadata={metadata[model.id]} references={references} />)}
    </div>
  </main>;
}
