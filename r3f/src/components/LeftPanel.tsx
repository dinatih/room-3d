import type { Item, Category } from '../types';

interface Props {
  items: Item[];
  categories: Category[];
  activeCat: string;
  search: string;
  selected: Item | null;
  onCatChange: (cat: string) => void;
  onSearchChange: (val: string) => void;
  onSelect: (item: Item) => void;
}

export function LeftPanel({
  items, categories, activeCat, search, selected,
  onCatChange, onSearchChange, onSelect,
}: Props) {
  return (
    <aside className="panel-left">

      {/* Category filters */}
      <div className="cats">
        {categories.map((cat: Category) => (
          <button
            key={cat.id}
            className={`cat-btn${cat.id === activeCat ? ' active' : ''}`}
            onClick={() => onCatChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-wrap">
        <input
          placeholder="Rechercher…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      {/* Item list */}
      <div className="item-list">
        {items.map(item => (
          <div
            key={item.id}
            className={`item-row${item.id === selected?.id ? ' active' : ''}`}
            onClick={() => onSelect(item)}
          >
            <div className={`dot${item.glbPath ? ' glb' : ''}`} />
            <span className="item-name">{item.name}</span>
            <span className="item-brand">{item.brand}</span>
          </div>
        ))}
      </div>

    </aside>
  );
}
