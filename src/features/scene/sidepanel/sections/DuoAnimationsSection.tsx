import { useState } from 'react';
import { DUO_ANIMATIONS } from '@features/scene/ai/duoAnimations';
import { duoSessionManager } from '@features/scene/ai/duoSessionManager';
import { resetAppIdle } from '@features/scene/idleState';

export interface DuoAnimationsSectionProps {
  isMobile: boolean;
}

export function DuoAnimationsSection({ isMobile }: DuoAnimationsSectionProps) {
  const [selectedDuoAnimId, setSelectedDuoAnimId] = useState<string>('');

  const handleSelectDuoAnim = (animId: string) => {
    setSelectedDuoAnimId(animId);
    const def = DUO_ANIMATIONS.find((a: any) => a.id === animId);
    if (def) {
      duoSessionManager.forceDuoAnimation(def);
    }
  };

  const handleRandomDuoAnim = () => {
    resetAppIdle();
    const randomAnim = DUO_ANIMATIONS[Math.floor(Math.random() * DUO_ANIMATIONS.length)];
    if (randomAnim) {
      handleSelectDuoAnim(randomAnim.id);
    }
  };

  return (
    <div
      className="d-flex flex-column bg-transparent overflow-hidden"
      style={{ maxHeight: '55vh' }}
    >
      <div className="p-2 border-bottom shadow-sm sticky-top" style={{ zIndex: 5, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="d-flex align-items-center gap-1">
          <select
            className="form-select form-select-sm"
            onChange={(e) => {
              const val = e.target.value;
              if (val) handleSelectDuoAnim(val);
            }}
            value={selectedDuoAnimId}
            style={{ fontSize: isMobile ? '13px' : '11px' }}
          >
            <option value="" disabled>Sélectionner une animation de couple...</option>
            {DUO_ANIMATIONS.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-sm btn-warning text-dark px-2 shadow-sm fw-bold"
            style={{ fontSize: isMobile ? '13px' : '11px', whiteSpace: 'nowrap' }}
            title="Animation de couple aléatoire 🎲"
            onClick={handleRandomDuoAnim}
          >
            🎲
          </button>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-2" style={{ maxHeight: '45vh' }}>
        <div className="d-flex flex-column gap-1">
          {DUO_ANIMATIONS.map((a: any) => {
            const isSelected = selectedDuoAnimId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => handleSelectDuoAnim(a.id)}
                className={`btn btn-sm text-start d-flex align-items-center justify-content-between px-2 py-1 ${
                  isSelected ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary border-0 bg-transparent text-dark'
                }`}
                style={{
                  fontSize: isMobile ? '13px' : '11px',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="text-truncate me-2">
                  <span className="me-1">{a.icon}</span> {a.label}
                </span>
                <span className={`badge border ${isSelected ? 'bg-light text-dark' : 'bg-light text-secondary'}`} style={{ fontSize: '9px' }}>
                  x3
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
