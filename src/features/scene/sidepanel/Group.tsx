import React, { useState } from 'react';

export interface GroupProps {
  emoji: string;
  title: string;
  defaultOpen?: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

export function Group({ emoji, title, defaultOpen = false, extra, children }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card shadow-sm glass-card overflow-hidden">
      <div className="card-header p-0 border-0 bg-transparent d-flex align-items-center justify-content-between">
        <button
          className="btn flex-grow-1 text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between text-dark border-0 shadow-none"
          onClick={() => setOpen(!open)}
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          <span>{emoji} {title}</span>
          <span 
            style={{ 
              fontSize: '8px', 
              color: 'var(--muted)',
              transform: open ? 'rotate(90deg)' : 'none', 
              transition: 'transform 0.18s' 
            }}
          >
            ▶
          </span>
        </button>
        {extra && (
          <div className="pe-2 d-flex align-items-center" onClick={e => e.stopPropagation()}>
            {extra}
          </div>
        )}
      </div>
      {open && (
        <div className="card-body p-0 bg-transparent d-flex flex-column border-top border-light-subtle">
          {children}
        </div>
      )}
    </div>
  );
}
