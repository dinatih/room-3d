import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOOLBAR_BUTTON_CLASS } from '../toolbarStyles';

export interface PanelPopoverProps {
  icon: React.ReactNode;
  label?: string;
  title?: string;
  headerExtra?: React.ReactNode;
  hideUI?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

export function PanelPopover({
  icon,
  label,
  title,
  headerExtra,
  hideUI = false,
  active = false,
  children,
}: PanelPopoverProps) {
  const id = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const onToggle = () => {
      const open = popover.matches(':popover-open');
      setIsOpen(open);
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

  return (
    <>
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${isOpen ? 'btn-danger text-white' : active ? 'view-control-bar__btn--cyan' : 'btn-outline-secondary'} view-control-bar__npc-trigger`}
        {...{ popovertarget: id }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const popover = popoverRef.current!;
          const popoverWidth = parseFloat(getComputedStyle(popover).width);
          const above = rect.top > window.innerHeight / 2;
          popover.style.top = above ? 'auto' : `${rect.bottom + 8}px`;
          popover.style.bottom = above ? `${window.innerHeight - rect.top + 8}px` : 'auto';
          popover.style.right = `${Math.min(Math.max(8, window.innerWidth - rect.right), window.innerWidth - popoverWidth - 8)}px`;
          popover.style.maxHeight = `${(above ? rect.top : window.innerHeight - rect.bottom) - 16}px`;
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={title ?? label}
        aria-label={title ?? label}
      >
        {typeof icon === 'string' ? (
          <i className={`bi ${icon}`} aria-hidden="true" />
        ) : (
          icon
        )}
        {label && <span>{label}</span>}
      </button>
      {createPortal(
        <div
          ref={popoverRef}
          id={id}
          {...{ popover: 'auto' }}
          role="dialog"
          aria-labelledby={`${id}-title`}
          className="popover view-control-bar__npc-popover glass-card shadow-lg"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <div className="popover-header bg-transparent py-2 px-3 border-bottom d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
              {typeof icon === 'string' ? (
                <i className={`bi ${icon} text-primary`} aria-hidden="true" />
              ) : (
                <span className="text-primary d-inline-flex align-items-center gap-1">{icon}</span>
              )}
              <span id={`${id}-title`} className="fw-semibold small text-dark text-truncate">
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
          <div className="popover-body p-2">
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
