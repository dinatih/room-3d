import { useEffect, useId, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TOOLBAR_BUTTON_CLASS } from '../toolbarStyles';

export interface PanelPopoverProps {
  icon: React.ReactNode;
  label?: string;
  title?: string;
  headerExtra?: React.ReactNode;
  hideUI?: boolean;
  active?: boolean;
  manual?: boolean;
  placementMode?: 'default' | 'desktop-top-left' | 'desktop-right' | 'desktop-bottom-left' | 'desktop-above-viewbar';
  compactMode?: boolean;
  noHeader?: boolean;
  className?: string;
  toggleEvent?: string;
  children: React.ReactNode;
}

export function PanelPopover({
  icon,
  label,
  title,
  headerExtra,
  hideUI = false,
  active = false,
  manual = false,
  placementMode = 'default',
  compactMode = false,
  noHeader = false,
  className,
  toggleEvent,
  children,
}: PanelPopoverProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop && placementMode === 'desktop-above-viewbar') {
      const menuDock = trigger.closest('.view-control-bar-dock') || trigger.closest('.view-control-bar') || document.querySelector('.view-control-bar-dock');
      const dockRect = menuDock ? menuDock.getBoundingClientRect() : trigger.getBoundingClientRect();
      const dockWidth = Math.max(160, dockRect.width);
      popover.style.width = `${dockWidth}px`;
      popover.style.maxWidth = `${dockWidth}px`;

      // Multi-popover vertical stacking logic
      // Find all open above-viewbar popovers to compute stacked bottom
      const openAbovePopovers = Array.from(
        document.querySelectorAll<HTMLElement>('.view-control-bar__npc-popover--above-viewbar:popover-open')
      );
      
      const isStackedAboveOther = openAbovePopovers.some(other => other !== popover && other.dataset.popoverPlacement === 'desktop-above-viewbar');
      let baseBottom = Math.max(8, window.innerHeight - dockRect.top + 6);

      if (isStackedAboveOther) {
        // If this popover is stacking above another, find the bottom-most one and place this above it
        const other = openAbovePopovers.find(o => o !== popover);
        if (other) {
          const otherRect = other.getBoundingClientRect();
          // Height of the other popover + spacing
          baseBottom = Math.max(baseBottom, window.innerHeight - otherRect.top + 6);
        }
      }

      popover.style.top = 'auto';
      popover.style.bottom = `${baseBottom}px`;
      popover.style.right = `${Math.max(8, window.innerWidth - dockRect.right)}px`;
      popover.style.left = 'auto';
      popover.style.maxHeight = `${Math.max(120, dockRect.top - 16)}px`;
      return;
    }

    if (isDesktop && placementMode === 'desktop-top-left') {
      popover.style.top = '12px';
      popover.style.bottom = 'auto';
      popover.style.left = '12px';
      popover.style.right = 'auto';
      popover.style.maxHeight = 'calc(100vh - 24px)';
      return;
    }

    if (isDesktop && placementMode === 'desktop-right') {
      popover.style.top = '16px';
      popover.style.bottom = 'auto';
      popover.style.left = 'auto';
      popover.style.right = '16px';
      popover.style.maxHeight = 'calc(100vh - 32px)';
      return;
    }

    if (isDesktop && placementMode === 'desktop-bottom-left') {
      const menuDock = trigger.closest('.view-control-bar-dock') || trigger.closest('.view-control-bar');
      const dockRect = menuDock ? menuDock.getBoundingClientRect() : trigger.getBoundingClientRect();
      const popoverWidth = parseFloat(getComputedStyle(popover).width) || 352;
      popover.style.top = 'auto';
      popover.style.bottom = `${Math.max(16, window.innerHeight - dockRect.bottom)}px`;
      popover.style.right = `${Math.min(window.innerWidth - popoverWidth - 16, Math.max(16, window.innerWidth - dockRect.left + 12))}px`;
      popover.style.left = 'auto';
      popover.style.maxHeight = 'calc(100vh - 32px)';
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const popoverWidth = parseFloat(getComputedStyle(popover).width);
    const above = rect.top > window.innerHeight / 2;
    popover.style.top = above ? 'auto' : `${rect.bottom + 8}px`;
    popover.style.bottom = above ? `${window.innerHeight - rect.top + 8}px` : 'auto';
    popover.style.left = 'auto';
    popover.style.right = `${Math.min(Math.max(8, window.innerWidth - rect.right), window.innerWidth - popoverWidth - 8)}px`;
    popover.style.maxHeight = `${(above ? rect.top : window.innerHeight - rect.bottom) - 16}px`;
  }, [placementMode]);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const onToggle = () => {
      const open = popover.matches(':popover-open');
      setIsOpen(open);
      if (open) {
        updatePosition();
      }
    };
    const handleResize = () => {
      if (manual) {
        if (popover.matches(':popover-open')) {
          updatePosition();
        }
      } else {
        popover.hidePopover();
      }
    };
    popover.addEventListener('toggle', onToggle);
    window.addEventListener('resize', handleResize);
    return () => {
      popover.removeEventListener('toggle', onToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, [manual, updatePosition]);

  useEffect(() => {
    if (hideUI) {
      popoverRef.current?.hidePopover();
      setIsOpen(false);
    }
  }, [hideUI]);

  useEffect(() => {
    if (!toggleEvent) return;
    const handleToggle = () => {
      const popover = popoverRef.current;
      if (!popover) return;
      if (popover.matches(':popover-open')) {
        popover.hidePopover();
      } else {
        popover.showPopover();
        updatePosition();
      }
    };
    document.addEventListener(toggleEvent, handleToggle);
    return () => document.removeEventListener(toggleEvent, handleToggle);
  }, [toggleEvent, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${isOpen ? 'btn-danger text-white' : active ? 'view-control-bar__btn--cyan' : 'btn-outline-secondary'} view-control-bar__npc-trigger`}
        {...{ popovertarget: id }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={(e) => {
          e.stopPropagation();
          updatePosition();
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
          {...{ popover: manual ? 'manual' : 'auto' }}
          role="dialog"
          aria-labelledby={`${id}-title`}
          data-popover-placement={placementMode}
          className={`popover view-control-bar__npc-popover glass-card shadow-lg ${compactMode ? 'view-control-bar__npc-popover--compact' : ''} ${placementMode === 'desktop-above-viewbar' ? 'view-control-bar__npc-popover--above-viewbar view-control-bar__npc-popover--dock-width' : ''} ${className ?? ''}`}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          {!noHeader && (
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
          )}
          <div className={`popover-body ${noHeader || compactMode ? 'p-1' : 'p-2'}`}>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
