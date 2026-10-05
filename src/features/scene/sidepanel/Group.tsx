import React, { useState } from 'react';

export interface GroupProps {
  emoji: string;
  title: string;
  defaultOpen?: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
  headerPadding?: string;
  onToggle?: (open: boolean) => void;
  className?: string;
}

export function Group({ emoji, title, defaultOpen = false, extra, children, headerPadding = 'py-2 px-3', onToggle, className }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  };
  return (
    <div className={`card shadow-sm glass-card overflow-hidden flex-shrink-0${className ? ` ${className}` : ''}`}>
      <div className="card-header p-0 border-0 bg-transparent d-flex align-items-center justify-content-between flex-shrink-0">
        <button
          className={`btn btn-sm ${extra ? 'flex-shrink-0' : 'flex-grow-1'} text-start ${headerPadding} fw-bold d-flex align-items-center justify-content-between text-dark border-0 shadow-none text-uppercase small flex-shrink-0`}
          onClick={handleToggle}
        >
          <span>{emoji} {title}</span>
          <span 
            className={`text-muted ${extra ? 'ms-2' : ''}`}
            style={{ 
              fontSize: '0.65rem',
              transform: open ? 'rotate(90deg)' : 'none', 
              transition: 'transform 0.18s' 
            }}
          >
            ▶
          </span>
        </button>
        {extra && (
          <div className="pe-2 d-flex align-items-center flex-grow-1 justify-content-end overflow-hidden flex-shrink-0" style={{ minWidth: 0 }} onClick={e => e.stopPropagation()}>
            {extra}
          </div>
        )}
      </div>
      <div
        className="card-body p-0 bg-transparent flex-column border-top border-light-subtle"
        style={{ display: open ? 'flex' : 'none' }}
      >
        {children}
      </div>
    </div>
  );
}