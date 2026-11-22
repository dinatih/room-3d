import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Grid } from '@react-three/drei';
import { WIGS_ITEMS } from '../inventory/inventoryData';
import type { LaraTopId, LaraBottomId } from '../scene/character/laraOutfits';
import { Character } from '../scene/character/Character';
import { CharacterRuntimeProvider } from '../scene/character/CharacterRuntimeProvider';
import type { PreviewOutfit, PreviewPlayback } from '../scene/character/characterTypes';
import { NavigationEnabledContext } from '../scene/ai/navigation/NavigationContext';
import { LARA_TOP_SPECS, LARA_BOTTOM_SPECS, LARA_HOODIE_ZIP_OPTIONS, isOnePieceTop } from '../scene/character/laraOutfits';
import { HAIR_COLORS } from '../scene/items/Wig';
import { WALKER_ANIM_OPTIONS } from '../scene/animOptions';
import './comparison.css';

type Outfit = { id: string; name: string; hair: string; color: string; clothing: PreviewOutfit };
const makeOutfit = (top: LaraTopId = 'native', bottom: LaraBottomId = 'native'): Outfit => ({ id: crypto.randomUUID(), name: 'Tenue', hair: 'original', color: 'naturel', clothing: { laraTop: top, laraBottom: bottom, laraHoodieZip: 'closed', laraShoes: true, laraSocks: false, laraSneakers: false, laraGlasses: false, laraPistols: false, laraNeckBandana: false, laraWristBandana: false, accessories: true } });
const wigs = WIGS_ITEMS.filter(w => Boolean(w.glbPath));
const extras = [['laraShoes', 'Bottes'], ['laraSocks', 'Chaussettes rouges'], ['laraSneakers', 'Baskets rouges'], ['laraNeckBandana', 'Bandana cou'], ['laraWristBandana', 'Bandana poignet'], ['laraGlasses', 'Lunettes'], ['laraPistols', 'Pistolets en mains'], ['accessories', 'Accessoires natifs']] as const;
class ModelError extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  render() { return this.state.error ? <Html center><div className="alert alert-danger">{this.state.error}</div></Html> : this.props.children; }
}
function Clock({ playback, playing, speed, time }: { playback: PreviewPlayback; playing: boolean; speed: number; time: { current: number } }) {
  useFrame((_, delta) => {
    if (playing && playback.ready && playback.duration > 0) time.current = (time.current + delta * speed) % playback.duration;
    playback.time = time.current; playback.playing = playing;
  }, -1);
  return null;
}
function Timeline({ playback, seek }: { playback: PreviewPlayback; seek: (t: number) => void }) {
  const [{ time, duration }, setPosition] = useState({ time: playback.time, duration: playback.duration });
  useEffect(() => {
    const refresh = () => setPosition({ time: playback.time, duration: playback.duration });
    refresh();
    const timer = window.setInterval(refresh, 100);
    return () => window.clearInterval(timer);
  }, [playback]);
  return <div className="w-100 d-flex gap-3 align-items-center"><input aria-label="Temps de l’animation" className="form-range" type="range" min="0" max={duration || 0} step={1 / 30} value={time} onChange={e => { const value = Number(e.target.value); seek(value); setPosition({ time: value, duration: playback.duration }); }} /><span className="text-nowrap small font-monospace">{time.toFixed(2)} / {duration.toFixed(2)} s</span></div>;
}
function CameraLayers({ columns, rows }: { columns: number; rows: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.layers.enableAll();
    const distance = Math.max(rows * 240, columns * 220 / (size.width / size.height)) / (2 * Math.tan(25 * Math.PI / 180));
    camera.position.set(0, 85, distance * 1.15); camera.lookAt(0, 85, 0);
  }, [camera, columns, rows, size.width, size.height]);
  return null;
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly { id: string; label: string }[]; onChange: (s: string) => void }) {
  return <label className="d-flex flex-column gap-1 small">{label}<select className="form-select form-select-sm" value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
}
export function LaraOutfitComparison() {
  const [outfits, setOutfits] = useState<Outfit[]>(() => [makeOutfit(), makeOutfit('tshirt', 'legging'), makeOutfit('hoodie', 'sweatpants'), makeOutfit('onepiece', 'none')]);
  const [selected, setSelected] = useState(outfits[0].id);
  const [animation, setAnimation] = useState('idle'), [playing, setPlaying] = useState(true), [speed, setSpeed] = useState(1), [wireframe, setWireframe] = useState(false), [angle, setAngle] = useState(0), [search, setSearch] = useState('');
  const time = useRef(0), playback = useMemo<PreviewPlayback>(() => ({ time: 0, duration: 0, ready: false, playing: true }), [animation]);
  const current = outfits.find(o => o.id === selected)!;
  const columns = Math.ceil(Math.sqrt(outfits.length)), rows = Math.ceil(outfits.length / columns);
  const update = (change: Partial<Outfit>) => setOutfits(list => list.map(o => o.id === selected ? { ...o, ...change } : o));
  const clothing = (change: PreviewOutfit) => update({ clothing: { ...current.clothing, ...change } });
  const add = (items: Outfit[]) => { setOutfits(list => [...list, ...items]); if (items.length) setSelected(items[0].id); };
  const seek = (t: number) => { setPlaying(false); time.current = Math.max(0, Math.min(playback.duration, t)); playback.time = time.current; };
  return <main className="container-fluid p-3 lara-comparison">
    <header className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h1 className="h3 mb-1">Lara · Comparaison des tenues</h1><p className="text-secondary mb-0">Composer, comparer et inspecter les vêtements en mouvement.</p></div><a className="btn btn-outline-secondary" href="/">Retour au studio</a></header>
    <section className="card mb-3"><div className="card-body d-flex flex-wrap gap-3 align-items-end">
      <label className="small">Rechercher une animation<input className="form-control form-control-sm" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <Select label="Animation commune" value={animation} options={WALKER_ANIM_OPTIONS.filter(o => o.value === animation || o.label.toLowerCase().includes(search.toLowerCase())).map(o => ({ id: o.value, label: o.label }))} onChange={s => { setAnimation(s); time.current = 0; }} />
      <button className="btn btn-primary btn-sm" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Lecture'}</button>
      <button className="btn btn-outline-secondary btn-sm" onClick={() => seek(time.current - 1 / 30)}>Image précédente</button><button className="btn btn-outline-secondary btn-sm" onClick={() => seek(time.current + 1 / 30)}>Image suivante</button>
      <Select label="Vitesse" value={String(speed)} options={[.25, .5, 1, 2].map(s => ({ id: String(s), label: `${s}×` }))} onChange={s => setSpeed(Number(s))} />
      <label className="small"><input type="checkbox" className="form-check-input me-2" checked={wireframe} onChange={e => setWireframe(e.target.checked)} />Filaire</label>
      <Timeline playback={playback} seek={seek} />
    </div></section>
    <div className="row g-3"><aside className="col-12 col-xl-3"><section className="card"><div className="card-body d-flex flex-column gap-3">
      <h2 className="h5 mb-0">{outfits.length} tenues sur la grille</h2>
      <Select label="Tenue à modifier" value={selected} options={outfits.map((o, i) => ({ id: o.id, label: `${i + 1}. ${o.name}` }))} onChange={setSelected} />
      <label className="small">Nom<input className="form-control form-control-sm" value={current.name} onChange={e => update({ name: e.target.value })} /></label>
      <Select label="Haut / robe / maillot" value={current.clothing.laraTop!} options={LARA_TOP_SPECS} onChange={s => clothing({ laraTop: s as PreviewOutfit['laraTop'], ...(isOnePieceTop(s as LaraTopId) && s !== 'body-native-red' ? { laraBottom: 'none' as const } : {}) })} />
      <Select label="Bas" value={current.clothing.laraBottom!} options={LARA_BOTTOM_SPECS} onChange={s => clothing({ laraBottom: s as PreviewOutfit['laraBottom'] })} />
      <Select label="Fermeture du sweat" value={current.clothing.laraHoodieZip!} options={LARA_HOODIE_ZIP_OPTIONS} onChange={s => clothing({ laraHoodieZip: s as PreviewOutfit['laraHoodieZip'] })} />
      <Select label="Perruque" value={current.hair} options={[{ id: 'original', label: 'Cheveux d’origine' }, ...wigs.map(w => ({ id: w.id, label: w.name }))]} onChange={s => update({ hair: s })} />
      <Select label="Couleur des cheveux" value={current.color} options={Object.keys(HAIR_COLORS).map(id => ({ id, label: id }))} onChange={s => update({ color: s })} />
      <fieldset><legend className="h6">Chaussures et accessoires</legend>{extras.map(([key, label]) => <label className="d-block small mb-2" key={key}><input className="form-check-input me-2" type="checkbox" checked={Boolean(current.clothing[key])} onChange={e => clothing({ [key]: e.target.checked })} />{label}</label>)}</fieldset>
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary btn-sm" onClick={() => add([{ ...current, id: crypto.randomUUID(), name: `${current.name} copie`, clothing: { ...current.clothing } }])}>Dupliquer</button><button className="btn btn-outline-danger btn-sm" disabled={outfits.length === 1} onClick={() => { setOutfits(outfits.filter(o => o.id !== selected)); setSelected(outfits.find(o => o.id !== selected)!.id); }}>Supprimer</button></div>
      <button className="btn btn-outline-primary btn-sm" onClick={() => add(LARA_TOP_SPECS.map(s => ({ ...makeOutfit(s.id, s.isOnePiece ? 'none' : 'native'), name: s.label })))}>Ajouter tous les hauts</button>
      <button className="btn btn-outline-primary btn-sm" onClick={() => {
        const comparisons = LARA_BOTTOM_SPECS.filter(s => s.id.endsWith('-sol-high')).flatMap(s => {
          const original = LARA_BOTTOM_SPECS.find(o => o.id === s.id.replace('-sol-high', ''))!;
          return [original, s].map(spec => { const outfit = makeOutfit('native', spec.id); return { ...outfit, name: spec.label, clothing: { ...outfit.clothing, laraShoes: false, accessories: false } }; });
        });
        const references = (['native', 'bikini'] as const).map(bottom => { const outfit = makeOutfit('native', bottom); return { ...outfit, name: bottom === 'native' ? 'Référence · Short natif' : 'Référence · Bikini natif', clothing: { ...outfit.clothing, laraShoes: false, accessories: false } }; });
        add([...references, ...comparisons]);
      }}>Comparer les bas · GPT-6.1-Sol high</button>
      <button className="btn btn-outline-primary btn-sm" onClick={() => add(LARA_BOTTOM_SPECS.map(s => ({ ...makeOutfit('native', s.id), name: s.label })))}>Ajouter tous les bas</button>
      <button className="btn btn-outline-primary btn-sm" onClick={() => add(wigs.map(w => ({ ...current, id: crypto.randomUUID(), name: w.name, hair: w.id, clothing: { ...current.clothing } })))}>Comparer toutes les perruques</button>
    </div></section></aside>
    <section className="col-12 col-xl-9"><div className="d-flex flex-wrap gap-2 mb-2">{[['Face', 0], ['Profil', Math.PI / 2], ['Dos', Math.PI], ['Trois-quarts', Math.PI / 4]].map(([label, value]) => <button key={label} className="btn btn-sm btn-outline-secondary" onClick={() => setAngle(Number(value))}>{label}</button>)}<span className="small text-secondary align-self-center">Souris : tourner · molette : zoom · cliquer sur un nom pour modifier</span></div>
      <div className="lara-outfit-viewport rounded border"><Canvas camera={{ position: [0, 450, 700], near: 1, far: 20000 }}><CameraLayers columns={columns} rows={rows} /><color attach="background" args={['#202735']} /><ambientLight intensity={1.6} /><directionalLight position={[300, 500, 400]} intensity={2.5} /><directionalLight position={[-300, 200, -300]} intensity={1.5} />
        <OrbitControls makeDefault target={[0, 85, 0]} />
        <Clock playback={playback} playing={playing} speed={speed} time={time} />
        <NavigationEnabledContext.Provider value={false}><CharacterRuntimeProvider isPreview>{outfits.map((o, i) => <group key={o.id} position={[(i % columns - (columns - 1) / 2) * 220, ((rows - 1) / 2 - Math.floor(i / columns)) * 240, 0]}>
          <Grid args={[200, 180]} cellSize={20} sectionSize={100} fadeDistance={10000} />
          <Html position={[0, 200, 0]} center><button className={`btn btn-sm text-nowrap ${selected === o.id ? 'btn-primary' : 'btn-light'}`} title={o.name} onClick={() => setSelected(o.id)}>{i + 1}. {o.name.split(' · ')[0].replace(/^Bas maillot /, '')}{o.name.includes(' · ') && <span className="d-block small">{o.name.split(' · ').slice(1).join(' · ')}</span>}</button></Html>
          <ModelError><Suspense fallback={<Html center><span className="badge bg-secondary">Chargement…</span></Html>}><Character id="native" variant="native" name={o.name} modelPath="characters/lara/lara_native.glb" isLara targetHeight={173.4} isActive={false} isPreview isGridPartner instanceId={o.id} characterAnim={animation} previewPlayback={playback} previewOutfit={{ ...o.clothing, characterWireframe: wireframe }} previewHaircut={o.hair} previewHairColor={o.color} previewPosition={[0, 0, 0]} previewRotationY={angle} /></Suspense></ModelError>
        </group>)}</CharacterRuntimeProvider></NavigationEnabledContext.Provider>
      </Canvas></div>
    </section></div>
  </main>;
}
