export interface AnimationOption { value: string; label: string }

/** Same navigation and count for animal previews and the comparison view. */
export function AnimationSelect({ options, value, onChange }: {
  options: readonly AnimationOption[]; value: string; onChange: (value: string) => void;
}) {
  const index = options.findIndex(option => option.value === value);
  const move = (direction: number) => {
    if (!options.length) return;
    const next = index < 0 ? (direction > 0 ? 0 : options.length - 1) : (index + direction + options.length) % options.length;
    onChange(options[next].value);
  };
  return <div className="input-group input-group-sm flex-nowrap w-auto" role="group" aria-label="Navigation des animations">
    <button type="button" className="btn btn-outline-secondary text-dark" aria-label="Animation précédente" title="Animation précédente" disabled={options.length < 2} onClick={() => move(-1)}><i className="bi bi-chevron-left" /></button>
    <select className="form-select form-select-sm w-auto" aria-label="Animation" value={value} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <button type="button" className="btn btn-outline-secondary text-dark" aria-label="Animation suivante" title="Animation suivante" disabled={options.length < 2} onClick={() => move(1)}><i className="bi bi-chevron-right" /></button>
    <span className="input-group-text text-nowrap" aria-label="Nombre d’animations">{index < 0 ? '—' : index + 1} / {options.length}</span>
  </div>;
}
