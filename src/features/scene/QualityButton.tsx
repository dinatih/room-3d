import { useId, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSceneStore, type GraphicsQualityPreset } from './store/useSceneStore';
import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';

const qualityPresets: { id: GraphicsQualityPreset; label: string; desc: string; badge: string }[] = [
  {
    id: 'sd',
    label: 'SD (Basse définition)',
    desc: 'Miroirs désactivés (reflet ambiance HDRI), vidéos en image fixe, ciel 2K',
    badge: 'SD',
  },
  {
    id: 'md-low',
    label: 'MD- (Moyenne basse)',
    desc: 'Miroir 128px (murs/sols sans perso), Vidéo LD, Ciel 4K',
    badge: 'MD-',
  },
  {
    id: 'md',
    label: 'MD (Moyenne définition)',
    desc: 'Miroir 256px (avec équipement & furniture), Vidéos HD, Ciel 8K',
    badge: 'MD',
  },
  {
    id: 'hd',
    label: 'HD (Haute définition)',
    desc: 'Miroir 512px plein détail, Vidéos HD, Ciel 8K',
    badge: 'HD',
  },
];

export function QualityButton({ hideUI = false }: { hideUI?: boolean }) {
  const qualityPopoverId = useId();
  const qualityTriggerRef = useRef<HTMLButtonElement>(null);
  const qualityPopoverRef = useRef<HTMLDivElement>(null);
  const [qualityPopoverOpen, setQualityPopoverOpen] = useState(false);
  const graphicsQualityPreset = useSceneStore(s => s.graphicsQualityPreset);
  const setGraphicsQualityPreset = useSceneStore(s => s.setGraphicsQualityPreset);

  const updateQualityPopoverPosition = () => {
    const trigger = qualityTriggerRef.current;
    const popover = qualityPopoverRef.current;
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    const above = rect.top > window.innerHeight / 2;
    popover.style.top = above ? 'auto' : `${rect.bottom + 6}px`;
    popover.style.bottom = above ? `${window.innerHeight - rect.top + 6}px` : 'auto';
    popover.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    popover.style.left = 'auto';
  };

  useEffect(() => {
    const popover = qualityPopoverRef.current;
    if (!popover) return;
    const onToggle = () => {
      const open = popover.matches(':popover-open');
      setQualityPopoverOpen(open);
      if (open) updateQualityPopoverPosition();
    };
    popover.addEventListener('toggle', onToggle);
    return () => popover.removeEventListener('toggle', onToggle);
  }, []);

  useEffect(() => {
    if (hideUI) {
      qualityPopoverRef.current?.hidePopover();
      setQualityPopoverOpen(false);
    }
  }, [hideUI]);

  return (
    <>
      <button
        ref={qualityTriggerRef}
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${qualityPopoverOpen ? 'btn-danger text-white' : graphicsQualityPreset === 'hd' ? 'btn-danger' : graphicsQualityPreset === 'md' ? 'btn-warning text-dark' : graphicsQualityPreset === 'md-low' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
        {...{ popovertarget: qualityPopoverId }}
        onClick={(e) => {
          e.stopPropagation();
          updateQualityPopoverPosition();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Définition & Performances : ${graphicsQualityPreset.toUpperCase()}`}
        aria-label="Preset de définition graphique"
        aria-expanded={qualityPopoverOpen}
      >
        <span className="fw-bold">{graphicsQualityPreset.toUpperCase()}</span>
      </button>
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={qualityPopoverRef}
          id={qualityPopoverId}
          {...{ popover: 'auto' }}
          role="dialog"
          aria-labelledby={`${qualityPopoverId}-title`}
          className="popover view-control-bar__npc-popover glass-card shadow-lg p-2"
          style={{ width: '19rem', maxWidth: 'calc(100vw - 1rem)' }}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
            <span id={`${qualityPopoverId}-title`} className="fw-semibold small text-dark d-flex align-items-center gap-1">
              <i className="bi bi-speedometer2 text-primary" aria-hidden="true" />
              Qualité graphique & Perfs
            </span>
            <button
              type="button"
              className="btn-close"
              style={{ fontSize: '0.65rem' }}
              aria-label="Fermer"
              onClick={() => qualityPopoverRef.current?.hidePopover()}
            />
          </div>
          <div className="d-flex flex-column gap-1">
            {qualityPresets.map(preset => {
              const isSelected = graphicsQualityPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn btn-sm text-start p-2 rounded d-flex flex-column gap-1 border ${isSelected ? 'btn-primary text-white border-primary' : 'btn-light text-body border-secondary-subtle'}`}
                  onClick={() => {
                    setGraphicsQualityPreset(preset.id);
                    qualityPopoverRef.current?.hidePopover();
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between w-100">
                    <span className="fw-bold small">{preset.label}</span>
                    <span className={`badge ${isSelected ? 'text-bg-light' : 'text-bg-secondary'}`}>{preset.badge}</span>
                  </div>
                  <span className={`small lh-sm ${isSelected ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
