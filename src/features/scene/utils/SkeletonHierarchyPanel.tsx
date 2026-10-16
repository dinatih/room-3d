import { useState, useMemo } from 'react';
import type { SkeletonGroup, BoneHierarchyNode } from './skeletonTypes';

export interface SkeletonHierarchyPanelProps {
  skeletons: SkeletonGroup[];
  selectedBoneName: string | null;
  onSelectBoneName: (name: string | null) => void;
  onClose?: () => void;
}

function countTotalBones(skeletons: SkeletonGroup[]): number {
  return skeletons.reduce((acc, s) => acc + s.totalBones, 0);
}

// Composant récursif pour un nœud de l'arbre d'os
function BoneTreeNodeItem({
  node,
  depth,
  selectedBoneName,
  onSelectBoneName,
  expandedMap,
  toggleExpand,
  searchFilter,
}: {
  node: BoneHierarchyNode;
  depth: number;
  selectedBoneName: string | null;
  onSelectBoneName: (name: string | null) => void;
  expandedMap: Record<string, boolean>;
  toggleExpand: (name: string) => void;
  searchFilter: string;
}) {
  const isSelected = selectedBoneName === node.name;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedMap[node.name] ?? true;

  // Vérifier si le nœud ou un de ses descendants correspond au filtre
  const matchesFilter = (n: BoneHierarchyNode): boolean => {
    if (!searchFilter) return true;
    if (n.name.toLowerCase().includes(searchFilter)) return true;
    return n.children.some(child => matchesFilter(child));
  };

  if (!matchesFilter(node)) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={() => onSelectBoneName(isSelected ? null : node.name)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 6px',
          paddingLeft: 8 + depth * 14,
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'monospace',
          background: isSelected
            ? '#e63946'
            : 'transparent',
          color: isSelected ? '#ffffff' : '#e2e8f0',
          transition: 'background 0.1s ease',
          userSelect: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
        title={`Cliquer pour sélectionner l'os "${node.name}" et voir son influence`}
      >
        {/* Bouton déplier/replier si enfants */}
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.name);
            }}
            style={{
              width: 14,
              height: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: isSelected ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ width: 14 }} />
        )}

        <span style={{ fontSize: 11, opacity: isSelected ? 1 : 0.8 }}>🦴</span>

        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: isSelected ? 700 : 500,
          }}
        >
          {node.name}
        </span>

        {hasChildren && (
          <span
            style={{
              fontSize: 9,
              opacity: 0.6,
              background: isSelected ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)',
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            {node.children.length}
          </span>
        )}

        {isSelected && (
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              background: '#ffffff',
              color: '#e63946',
              padding: '1px 4px',
              borderRadius: 3,
              letterSpacing: 0.5,
            }}
          >
            ACTIF
          </span>
        )}
      </div>

      {/* Rendu des enfants si déplié */}
      {hasChildren && isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {node.children.map((child) => (
            <BoneTreeNodeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              selectedBoneName={selectedBoneName}
              onSelectBoneName={onSelectBoneName}
              expandedMap={expandedMap}
              toggleExpand={toggleExpand}
              searchFilter={searchFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SkeletonHierarchyPanel({
  skeletons,
  selectedBoneName,
  onSelectBoneName,
  onClose,
}: SkeletonHierarchyPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const totalBones = useMemo(() => countTotalBones(skeletons), [skeletons]);
  const cleanSearch = search.trim().toLowerCase();

  const toggleExpand = (boneName: string) => {
    setExpandedMap(prev => ({
      ...prev,
      [boneName]: prev[boneName] === undefined ? false : !prev[boneName],
    }));
  };

  const handleExpandAll = () => {
    const nextMap: Record<string, boolean> = {};
    const recurse = (node: BoneHierarchyNode) => {
      nextMap[node.name] = true;
      node.children.forEach(recurse);
    };
    skeletons.forEach(s => s.rootNodes.forEach(recurse));
    setExpandedMap(nextMap);
  };

  const handleCollapseAll = () => {
    const nextMap: Record<string, boolean> = {};
    const recurse = (node: BoneHierarchyNode) => {
      nextMap[node.name] = false;
      node.children.forEach(recurse);
    };
    skeletons.forEach(s => s.rootNodes.forEach(recurse));
    setExpandedMap(nextMap);
  };

  return (
    <div
      style={{
        width: 290,
        maxHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 8,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        overflow: 'hidden',
        fontSize: 12,
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <span>🌳</span>
          <span>Hiérarchie des os</span>
          <span
            style={{
              fontSize: 10,
              background: '#0284c7',
              color: '#ffffff',
              padding: '1px 5px',
              borderRadius: 10,
              fontWeight: 800,
            }}
          >
            {totalBones}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 14,
              padding: '0 4px',
              lineHeight: 1,
            }}
            title="Fermer la hiérarchie"
          >
            ✕
          </button>
        )}
      </div>

      {/* Légende Heatmap des Influences */}
      <div
        style={{
          padding: '6px 10px',
          background: 'rgba(2, 6, 23, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>
          <span>0.0 (Bleu: Aucune)</span>
          <span>0.5 (Vert/Jaune)</span>
          <span>1.0 (Rouge: Max)</span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: 'linear-gradient(to right, rgb(15,25,76) 0%, rgb(0,217,242) 25%, rgb(0,247,0) 50%, rgb(242,247,0) 75%, rgb(255,0,0) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
          title="Graduation des poids d'influence : Bleu foncé (0.0) -> Cyan -> Vert -> Jaune -> Rouge vif (1.0)"
        />
        <div style={{ fontSize: 8.5, color: '#64748b', textAlign: 'center' }}>
          Influence de l'os sur le maillage (Weight Painting)
        </div>
      </div>

      {/* Barre de filtre et boutons rapides */}
      <div
        style={{
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Filtrer les os (ex: hair, head)..."
            style={{
              width: '100%',
              padding: '4px 22px 4px 6px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(0, 0, 0, 0.4)',
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 4,
                background: 'none',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', fontSize: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={handleExpandAll}
              style={{
                padding: '2px 6px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 3,
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
              title="Déplier tous les os"
            >
              Tout déplier
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              style={{
                padding: '2px 6px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 3,
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
              title="Replier tous les os"
            >
              Tout replier
            </button>
          </div>

          {selectedBoneName && (
            <button
              type="button"
              onClick={() => onSelectBoneName(null)}
              style={{
                padding: '2px 6px',
                background: 'rgba(230, 57, 70, 0.3)',
                border: '1px solid #e63946',
                borderRadius: 3,
                color: '#ff7979',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Désélectionner l'os actif"
            >
              Désélectionner
            </button>
          )}
        </div>
      </div>

      {/* Arborescence des squelettes */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {skeletons.length === 0 ? (
          <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 11 }}>
            Aucun os détecté dans ce modèle 3D
          </div>
        ) : (
          skeletons.map((skel) => (
            <div
              key={skel.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 6,
                padding: '4px 2px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Entête du squelette (Perruque vs Perso) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: skel.type === 'wig' ? '#f472b6' : skel.type === 'character' ? '#38bdf8' : '#e2e8f0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  marginBottom: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{skel.type === 'wig' ? '💇' : skel.type === 'character' ? '💃' : '⚙️'}</span>
                  <span className="text-truncate" style={{ maxWidth: 190 }} title={skel.label}>
                    {skel.label}
                  </span>
                </div>
                <span style={{ fontSize: 9, opacity: 0.7 }}>
                  {skel.totalBones} os
                </span>
              </div>

              {/* Nœuds racines de ce squelette */}
              {skel.rootNodes.map((rootNode) => (
                <BoneTreeNodeItem
                  key={rootNode.name}
                  node={rootNode}
                  depth={0}
                  selectedBoneName={selectedBoneName}
                  onSelectBoneName={onSelectBoneName}
                  expandedMap={expandedMap}
                  toggleExpand={toggleExpand}
                  searchFilter={cleanSearch}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
