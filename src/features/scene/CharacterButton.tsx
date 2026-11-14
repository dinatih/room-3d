import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { WIGS_ITEMS } from '../inventory/inventoryData';
import { ALL_HAIR_COLORS, type LayerState } from './sidepanel/types';
import { PanelPopover } from './sidepanel/PanelPopover';
import { CharacterSection } from './sidepanel/sections/CharacterSection';

export interface CharacterButtonProps {
  layers: LayerState;
  onToggleLayer: (layer: keyof LayerState) => void;
  hideUI?: boolean;
}

export function CharacterButton({
  layers,
  onToggleLayer,
  hideUI = false,
}: CharacterButtonProps) {
  const isMobile = useIsMobile();
  const [globalHaircut, setGlobalHaircut] = useState<string>('original');
  const [globalHairColor, setGlobalHairColor] = useState<string>('rose');
  const lastWigRef = useRef<string>('hair_101');

  const handleRandomHairColor = () => {
    const otherColors = ALL_HAIR_COLORS.filter((c: string) => c !== globalHairColor);
    const newColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    setGlobalHairColor(newColor);
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: newColor } }));
  };

  const handleRandomHaircut = () => {
    const allHaircuts = ['original', ...WIGS_ITEMS.map(w => w.id)];
    const otherHaircuts = allHaircuts.filter(h => h !== globalHaircut);
    const newHaircut = otherHaircuts[Math.floor(Math.random() * otherHaircuts.length)];
    setGlobalHaircut(newHaircut);
    if (newHaircut !== 'original') lastWigRef.current = newHaircut;
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: newHaircut } }));
  };

  const handleRandomHaircutAndColor = () => {
    handleRandomHaircut();
    handleRandomHairColor();
  };

  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; value?: string }>).detail;
      if (detail?.key === 'lara-haircut' && detail.value) {
        setGlobalHaircut(detail.value);
      }
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, []);

  useEffect(() => {
    const handleToggleHaircut = () => {
      setGlobalHaircut(prev => {
        if (prev === 'original') {
          const wigIds = WIGS_ITEMS.map(w => w.id);
          const next = wigIds[Math.floor(Math.random() * wigIds.length)];
          lastWigRef.current = next;
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: next } }));
          return next;
        }
        lastWigRef.current = prev;
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: 'original' } }));
        return 'original';
      });
    };
    document.addEventListener('toggle-lara-haircut', handleToggleHaircut);
    return () => document.removeEventListener('toggle-lara-haircut', handleToggleHaircut);
  }, []);

  const personnageHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold small rounded"
        title="Coupe et couleur de cheveux aléatoires"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomHaircutAndColor();
        }}
      >
        <i className="bi bi-shuffle" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <PanelPopover
      icon={
        <span className="d-inline-flex align-items-center gap-1">
          <i className="bi bi-person-fill" aria-hidden="true" />
          <i className="bi bi-gear-fill" aria-hidden="true" />
        </span>
      }
      title="Configuration utilisateur & Personnages"
      headerExtra={personnageHeaderButtons}
      hideUI={hideUI}
    >
      <CharacterSection
        layers={layers}
        onToggleLayer={onToggleLayer}
        isMobile={isMobile}
        globalHairColor={globalHairColor}
        setGlobalHairColor={setGlobalHairColor}
        globalHaircut={globalHaircut}
        setGlobalHaircut={setGlobalHaircut}
        lastWigRef={lastWigRef}
        handleRandomHairColor={handleRandomHairColor}
        handleRandomHaircut={handleRandomHaircut}
      />
    </PanelPopover>
  );
}
