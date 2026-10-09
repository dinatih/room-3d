import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOOLBAR_BUTTON_CLASS } from '../toolbarStyles';

export interface PanelPopoverProps {
  id?: string;
  icon: string;
  label: string;
  title?: string;
  headerExtra?: React.ReactNode;
  width?: string;
  maxWidth?: string;
  hideUI?: boolean;
  children: React.ReactNode;
}

export function PanelPopover({
  id: customId,
  icon,
  label,
  title,
  headerExtra,
  width = '20rem',
  maxWidth = 'calc(100vw - 1rem)',
  hideUI = false,
  children,
}: PanelPopoverProps) {
  const generatedId = useId();
  const popoverId = customId ?? `popover-${generatedId.replace(/:/g, '')}`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const onToggle = () => {
      const open = popover.matches(':popover-open');
      setIsOpen(open);
      if (open) {
        // Déclencher un resize pour rafraîchir les canvas (Minimap, FPS, etc.)
        window.dispatchEvent(new Event('resize'));
      }
    };
    const closePopover = () => popover.hidePopover();
    popover.addEventListener('toggle', onToggle);
    window.addEventListener('resize', closePopover);
    return () => {
      popover.removeEventListener('toggle', onToggle);
      window.removeEventListener('resize', closePopover);
    };
  }, []);

  useEffect(() => {
    if (hideUI) {
      popoverRef.current?.hidePopover();
      setIsOpen(false);
    }
  }, [hideUI]);

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const popover = popoverRef.current;
    if (!popover) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const computed = getComputedStyle(popover);
    const popoverWidth = parseFloat(computed.width) || 320;

    const above = rect.top > window.innerHeight / 2;
    popover.style.top = above ? 'auto' : `${rect.bottom + 6}px`;
    popover.style.bottom = above ? `${window.innerHeight - rect.top + 6}px` : 'auto';

    const popoverLeft = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - popoverWidth - 8,
    );
    popover.style.left = `${popoverLeft}px`;
    popover.style.right = 'auto';

    const maxHeight = (above ? rect.top : window.innerHeight - rect.bottom) - 16;
    popover.style.maxHeight = `${maxHeight}px`;
  };

  return (
    <>
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${isOpen ? 'btn-danger text-white' : 'btn-outline-secondary'} view-control-bar__panel-trigger`}
        {...{ popovertarget: popoverId }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        title={title ?? label}
        aria-label={title ?? label}
        onClick={handleTriggerClick}
        onPointerDown={e => e.stopPropagation()}
      >
        <i className={`bi ${icon}`} aria-hidden="true" />
        <span className="fw-semibold">{label}</span>
      </button>

      {createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          {...{ popover: 'auto' }}
          role="dialog"
          aria-labelledby={`${popoverId}-title`}
          className="popover view-control-bar__panel-popover glass-card shadow-lg"
          style={{ width, maxWidth }}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <div className="popover-header bg-transparent py-2 px-3 border-bottom d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
              <i className={`bi ${icon} text-primary`} aria-hidden="true" />
              <span id={`${popoverId}-title`} className="fw-bold small text-dark text-truncate">
                {title ?? label}
              </span>
            </div>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              {headerExtra}
              <button
                type="button"
                className="btn-close ms-1"
                style={{ fontSize: '0.65rem' }}
                aria-label="Fermer"
                onClick={() => popoverRef.current?.hidePopover()}
              />
            </div>
          </div>
          <div className="popover-body p-2 overflow-y-auto">
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
