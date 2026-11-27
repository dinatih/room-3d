import { useState } from 'react';
import { ANIMATION_DEFINITIONS, type AnimationDefinition } from '@features/scene/animations/animationRegistry';
import { getAnimationDef } from '@features/scene/animations/animationResolver';
import { inventoryUrl } from './inventoryUrlParams';

function animationUrl(id: string) {
  return inventoryUrl({ open: true, category: 'animations', target: { type: 'animation', mode: 'solo', id } });
}

export function AnimationCutLinks({ animation }: { animation: AnimationDefinition }) {
  const source = animation.cutFrom && getAnimationDef(animation.cutFrom.id);
  const versions = ANIMATION_DEFINITIONS.filter(def => def.cutFrom?.id === animation.id);
  if (!source && !versions.length) return null;

  return <div className="d-flex flex-column gap-1 small">
    {source && <div>Animation d’origine <a href={animationUrl(source.id)}>{source.label ?? source.id}</a></div>}
    {versions.length > 0 && <div className="d-flex flex-wrap gap-2">
      <span>Versions découpées</span>
      {versions.map(version => <a key={version.id} href={animationUrl(version.id)}>{version.label ?? version.id}</a>)}
    </div>}
  </div>;
}

export function AnimationCutSave({ animation, segments, duration }: {
  animation: AnimationDefinition;
  segments: Array<[number, number]>;
  duration: number;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ id: string; label: string }>();
  const hasCut = segments.length > 1 || segments.some(([start, end]) => start > 0 || end < duration);

  async function save() {
    setSaving(true);
    setError('');
    setSaved(undefined);
    try {
      const response = await fetch('/__animation-cut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: animation.id, name, segments }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSaved(result);
      setName('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSaving(false);
    }
  }

  return <form className="border-top pt-2 mt-2" onSubmit={event => { event.preventDefault(); void save(); }}>
    <label className="form-label mb-1" htmlFor={`cut-name-${animation.id}`}>Nom de la version découpée</label>
    <div className="d-flex flex-wrap gap-2">
      <input id={`cut-name-${animation.id}`} className="form-control form-control-sm w-auto" value={name}
        onChange={event => setName(event.target.value)} required disabled={saving} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={!hasCut || !name.trim() || saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer la découpe'}
      </button>
    </div>
    {error && <div className="text-danger mt-1" role="alert">{error}</div>}
    {saved && <div className="mt-1" role="status">
      Découpe enregistrée. <a href={animationUrl(saved.id)}>Ouvrir « {saved.label} »</a>
    </div>}
  </form>;
}
