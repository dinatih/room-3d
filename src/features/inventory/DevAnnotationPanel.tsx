import { useState } from 'react';
import { useItemAnnotations, type AnnotationStatus } from './useItemAnnotations';

interface DevAnnotationPanelProps {
  targetId: string;
  targetName?: string;
  className?: string;
  compact?: boolean;
}

const DEFAULT_QUICK_TAGS = ['top', 'glitch-pied', 'offset', 'wip', 'favori', 'cut', 'loop', 'sync'];

export function DevAnnotationPanel({
  targetId,
  targetName,
  className = '',
  compact = false,
}: DevAnnotationPanelProps) {
  const { annotation, setStatus, setNotes, addTag, removeTag, clear } = useItemAnnotations(targetId);
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);

  const currentStatus = annotation?.status;
  const currentTags = annotation?.tags || [];
  const currentNotes = annotation?.notes || '';

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      addTag(newTagInput);
      setNewTagInput('');
    }
  };

  const handleCopySnippet = () => {
    const data = {
      id: targetId,
      name: targetName,
      status: currentStatus,
      tags: currentTags,
      notes: currentNotes,
      customOffsets: annotation?.customOffsets,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`card border shadow-sm bg-light bg-opacity-75 p-2 ${className}`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="fw-bold small text-dark d-flex align-items-center gap-1">
          <i className="bi bi-tag-fill text-danger" aria-hidden="true" />
          <span>Annotations Dev (LocalStorage)</span>
        </span>
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm py-0 px-1 border-0"
            title="Copier les annotations en JSON"
            onClick={handleCopySnippet}
          >
            <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'}`} aria-hidden="true" />
          </button>
          {(currentStatus || currentTags.length > 0 || currentNotes) && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm py-0 px-1 border-0"
              title="Effacer les annotations de cet élément"
              onClick={() => {
                if (confirm(`Effacer les annotations de "${targetName || targetId}" ?`)) {
                  clear();
                }
              }}
            >
              <i className="bi bi-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Boutons d'état rapide */}
      <div className="d-flex flex-wrap gap-1 mb-2">
        {(
          [
            { id: 'ok', label: '✅ OK', btnClass: 'btn-outline-success' },
            { id: 'issue', label: '⚠️ Problème', btnClass: 'btn-outline-danger' },
            { id: 'wip', label: '🚧 À revoir', btnClass: 'btn-outline-warning' },
            { id: 'favorite', label: '⭐ Favori', btnClass: 'btn-outline-primary' },
          ] as const
        ).map(item => {
          const isSelected = currentStatus === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`btn btn-sm py-0 px-2 rounded-pill small ${
                isSelected ? 'btn-dark text-white fw-bold shadow-sm' : `${item.btnClass} bg-white`
              }`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => setStatus(isSelected ? undefined : (item.id as AnnotationStatus))}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Quick Tags cliquables */}
      <div className="mb-2">
        <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.68rem' }}>
          TAGS RAPIDES :
        </div>
        <div className="d-flex flex-wrap gap-1">
          {DEFAULT_QUICK_TAGS.map(tag => {
            const hasTag = currentTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`btn btn-sm py-0 px-1.5 rounded-pill ${
                  hasTag ? 'btn-danger text-white' : 'btn-outline-secondary bg-white text-secondary'
                }`}
                style={{ fontSize: '0.7rem' }}
                onClick={() => (hasTag ? removeTag(tag) : addTag(tag))}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des tags actuels */}
      {currentTags.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {currentTags.map(tag => (
            <span
              key={tag}
              className="badge bg-secondary text-white d-inline-flex align-items-center gap-1 px-1.5 py-1"
              style={{ fontSize: '0.72rem' }}
            >
              #{tag}
              <button
                type="button"
                className="btn-close btn-close-white p-0"
                style={{ fontSize: '0.5rem' }}
                aria-label={`Supprimer le tag ${tag}`}
                onClick={() => removeTag(tag)}
              />
            </span>
          ))}
        </div>
      )}

      {/* Saisie d'un tag personnalisé */}
      <form onSubmit={handleAddTagSubmit} className="input-group input-group-sm mb-2">
        <input
          type="text"
          className="form-control form-control-sm bg-white"
          placeholder="Ajouter un tag personnalisé..."
          value={newTagInput}
          onChange={e => setNewTagInput(e.target.value)}
          style={{ fontSize: '0.75rem' }}
        />
        <button className="btn btn-outline-secondary btn-sm" type="submit" disabled={!newTagInput.trim()}>
          +
        </button>
      </form>

      {/* Notes / Remarques */}
      {!compact && (
        <div>
          <textarea
            className="form-control form-control-sm bg-white"
            rows={2}
            placeholder="Notes dev (ex: pied traverse le sol à 1.2s, revoir rotation Z...)"
            value={currentNotes}
            onChange={e => setNotes(e.target.value)}
            style={{ fontSize: '0.75rem', resize: 'vertical' }}
          />
        </div>
      )}
    </div>
  );
}
