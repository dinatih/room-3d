import { useState, useMemo } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { Preview } from './components/Preview';
import type { Item } from './types';

// @ts-ignore — JS file with no type declarations
import { INVENTORY, CATEGORIES } from '@data/inventoryData.js';

export function App() {
  const [selected,  setSelected]  = useState<Item | null>(null);
  const [activeCat, setActiveCat] = useState('all');
  const [search,    setSearch]    = useState('');

  const items = useMemo<Item[]>(() => {
    const q = search.toLowerCase();
    return (INVENTORY as Item[]).filter(item => {
      if (activeCat !== 'all' && item.category !== activeCat) return false;
      if (q && !item.name.toLowerCase().includes(q) &&
               !(item.brand ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCat, search]);

  return (
    <div className="layout">
      <LeftPanel
        items={items}
        categories={CATEGORIES}
        activeCat={activeCat}
        search={search}
        selected={selected}
        onCatChange={setActiveCat}
        onSearchChange={setSearch}
        onSelect={setSelected}
      />
      <Preview selected={selected} />
    </div>
  );
}
