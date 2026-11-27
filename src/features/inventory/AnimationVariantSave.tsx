import { useState } from 'react';
import { ANIMATION_DEFINITIONS, type AnimationDefinition } from '@features/scene/animations/animationRegistry';
import { getAnimationDef, type AnimationOriginTransform } from '@features/scene/animations/animationResolver';
import { inventoryUrl } from './inventoryUrlParams';

function animationUrl(id: string) {
  return inventoryUrl({ open: true, category: 'animations', target: { type: 'animation', mode: 'solo', id } });
}

export function AnimationVariantLinks({ animation }: { animation: AnimationDefinition }) {
  const origin = animation.variantFrom ?? animation.cutFrom;
  const source = origin && getAnimationDef(origin.id);
  const versions = ANIMATION_DEFINITIONS.filter(def => (def.variantFrom ?? def.cutFrom)?.id === animation.id);
  if (!source && !versions.length) return null;

  return <div className="d-flex flex-column gap-1 small">
    {source && <div>Animation d’origine <a href={animationUrl(source.id)}>{source.label ?? source.id}</a></div>}
    {versions.length > 0 && <div className="d-flex flex-wrap gap-2">
      <span>Variantes</span>
      {versions.map(version => <a key={version.id} href={animationUrl(version.id)}>{version.label ?? version.id}</a>)}
    </div>}
  </div>;
}

export function AnimationVariantSave({ animation, segments, duration, alignment, hasAlignmentChange }: {
  animation: AnimationDefinition;
  segments: Array<[number, number]>;
  duration: number;
  alignment: AnimationOriginTransform;
  hasAlignmentChange: boolean;
}) {
  const [name, setName] = useState(animation.label || animation.id);
  const [cutChoice, setCutChoice] = useState<boolean>();
  const [alignmentChoice, setAlignmentChoice] = useState<boolean>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ id: string; label: string }>();
  const hasCut = duration > 0 && segments.some(([start, end], index) =>
    start > (segments[index - 1]?.[1] ?? 0) || (index === segments.length - 1 && end < duration),
  );

  const applyCut = hasCut && (cutChoice ?? true);
  const embedAlignment = alignmentChoice ?? hasAlignmentChange;

  async function save() {
    setSaving(true);
    setError('');
    setSaved(undefined);
    try {
      const response = await fetch('/__animation-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: animation.id, name,
          segments: applyCut ? segments : undefined,
          alignment: embedAlignment ? alignment : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSaved(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSaving(false);
    }
  }

  return <form className="border-top pt-2 mt-2" onSubmit={event => { event.preventDefault(); void save(); }}>
    <label className="form-label mb-1" htmlFor={`variant-name-${animation.id}`}>Nom de la variante</label>
    <div className="d-flex flex-wrap gap-2">
      <input id={`variant-name-${animation.id}`} className="form-control form-control-sm w-auto" value={name}
        onChange={event => setName(event.target.value)} required disabled={saving} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={(!applyCut && !embedAlignment) || !name.trim() || saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer la variante'}
      </button>
    </div>
    <div className="d-flex flex-wrap gap-3 mt-2">
      <label className="form-check mb-0">
        <input className="form-check-input" type="checkbox" checked={applyCut} disabled={!hasCut || saving}
          onChange={event => setCutChoice(event.target.checked)} />
        Appliquer la découpe
      </label>
      <label className="form-check mb-0">
        <input className="form-check-input" type="checkbox" checked={embedAlignment} disabled={saving}
          onChange={event => setAlignmentChoice(event.target.checked)} />
        Intégrer le recentrage au GLB
      </label>
    </div>
    {error && <div className="text-danger mt-1" role="alert">{error}</div>}
    {saved && <div className="mt-1" role="status">
      Variante enregistrée. <a href={animationUrl(saved.id)}>Ouvrir « {saved.label} »</a>
    </div>}
  </form>;
}
