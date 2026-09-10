/**
 * GridLayout.tsx — Vue "inventaire" en grille 3D.
 *
 * Affiche tous les objets GLB de l'inventaire, rangés par zone (couloir,
 * sdb, salon, jardin) sur un plan X/Z à Y=0, avec des labels texte au-dessus
 * de chaque rangée et un sol de référence semi-transparent.
 *
 * Activation : layers.inventoryGrid (toggle dans le SidePanel → LayersSection).
 *
 * Architecture R3F :
 *   - <GridLayout> est un composant R3F monté directement dans le <Canvas>.
 *   - Chaque objet est rendu par <GridItem> qui utilise le hook useGLTF (Drei)
 *     pour charger le GLB via le cache partagé.
 *   - Les labels utilisent <Text> de @react-three/drei.
 *   - La grille est calculée côté JS : cellules de CELL_SIZE cm,
 *     N colonnes par rangée, séparation entre zones de ZONE_GAP cm.
 */

import React, { Component, Suspense, useMemo } from 'react';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';

import { INVENTORY, type InventoryItem } from '@features/inventory/inventoryData';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GridItemErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[GridLayout] Failed to load GLB:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

// ── Constantes de mise en page ────────────────────────────────────────────────

/** Taille de cellule (cm). Laisse un peu d'espace autour du plus grand objet. */
const CELL_SIZE = 120;

/** Nombre de colonnes par rangée. */
const COLS = 6;

/** Séparation (cm) entre deux zones. */
const ZONE_GAP = 80;

/** Hauteur des labels de zone au-dessus du sol. */
const LABEL_Y = 140;

/**
 * Taille max d'affichage : les GLBs sont auto-scalés pour tenir dans cette
 * dimension (en cm dans l'espace scène — 1 unité = 1 cm).
 */
const MAX_DISPLAY_SIZE = CELL_SIZE * 0.75;

// ── Zones et leur mapping ─────────────────────────────────────────────────────

interface Zone {
  id: string;
  label: string;
  emoji: string;
  color: THREE.ColorRepresentation;
  /** Filtre sur item.category. */
  categories: string[];
}

const ZONES: Zone[] = [
  {
    id: 'salon',
    label: 'Séjour / Chambre',
    emoji: '🛋️',
    color: 0x4a7fc1,
    categories: ['furniture', 'decor', 'storage', 'tech', 'tools', 'clothing'],
  },
  {
    id: 'sdb',
    label: 'Salle de bain',
    emoji: '🚿',
    color: 0x3da58a,
    categories: ['bathroom'],
  },
  {
    id: 'kitchen',
    label: 'Cuisine',
    emoji: '🍳',
    color: 0xe07b39,
    categories: ['kitchen'],
  },
  {
    id: 'jardin',
    label: 'Jardin / Terrasse',
    emoji: '🌿',
    color: 0x5a9e4f,
    categories: ['garden', 'outdoor'],
  },
  {
    id: 'wigs',
    label: 'Perruques',
    emoji: '💇',
    color: 0xb06dae,
    categories: ['wigs'],
  },
];

const FALLBACK_ZONE: Zone = {
  id: 'autres',
  label: 'Autres',
  emoji: '📦',
  color: 0x888888,
  categories: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getZone(item: InventoryItem): Zone {
  for (const zone of ZONES) {
    if (zone.categories.includes(item.category)) return zone;
  }
  return FALLBACK_ZONE;
}

// ── Composant item individuel ─────────────────────────────────────────────────

interface GridItemProps {
  item: InventoryItem;
  position: [number, number, number];
}

function GridItemInner({ item, position }: GridItemProps) {
  const gltf = useGLTF(item.glbPath!);

  const { clone, scale } = useMemo(() => {
    const clone = gltf.scene.clone(true);

    // Réinitialiser la transform du clone racine
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());

    // Centrer horizontalement, poser à Y=0
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -box.min.y, -center.z);

    // Auto-scale pour tenir dans MAX_DISPLAY_SIZE
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? Math.min(1, MAX_DISPLAY_SIZE / maxDim) : 1;

    return { clone, scale };
  }, [gltf]);

  return (
    <group position={position}>
      <primitive object={clone} scale={scale} />
    </group>
  );
}

function GridItem({ item, position }: GridItemProps) {
  return (
    <GridItemErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <GridItemInner item={item} position={position} />
      </Suspense>
    </GridItemErrorBoundary>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function GridLayout() {
  // Filtrer uniquement les items ayant un GLB (perruques incluses si souhaité)
  const glbItems = useMemo(
    () => INVENTORY.filter(item => !!item.glbPath),
    [],
  );

  // Grouper par zone
  const groupedByZone = useMemo(() => {
    const map = new Map<string, { zone: Zone; items: InventoryItem[] }>();

    for (const item of glbItems) {
      const zone = getZone(item);
      if (!map.has(zone.id)) {
        map.set(zone.id, { zone, items: [] });
      }
      map.get(zone.id)!.items.push(item);
    }

    // Ordonner selon ZONES puis FALLBACK
    const ordered: { zone: Zone; items: InventoryItem[] }[] = [];
    for (const zone of [...ZONES, FALLBACK_ZONE]) {
      if (map.has(zone.id)) {
        ordered.push(map.get(zone.id)!);
      }
    }
    return ordered;
  }, [glbItems]);

  // Calculer les offsets Z de début de chaque zone
  const zoneOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentZ = 0;
    for (const { items } of groupedByZone) {
      offsets.push(currentZ);
      const rows = Math.ceil(items.length / COLS);
      currentZ += rows * CELL_SIZE + ZONE_GAP;
    }
    return offsets;
  }, [groupedByZone]);

  const gridWidth = COLS * CELL_SIZE;

  return (
    <group>
      {groupedByZone.map(({ zone, items }, zoneIdx) => {
        const zoneZ    = zoneOffsets[zoneIdx];
        const rows     = Math.ceil(items.length / COLS);
        const zoneDepth = rows * CELL_SIZE;
        const centerX  = (gridWidth - CELL_SIZE) / 2;
        const centerZ  = zoneZ + zoneDepth / 2;

        return (
          <group key={zone.id}>
            {/* Sol semi-transparent de zone */}
            <mesh position={[centerX, -0.5, centerZ]} receiveShadow>
              <boxGeometry args={[gridWidth, 1, zoneDepth]} />
              <meshStandardMaterial
                color={zone.color}
                transparent
                opacity={0.12}
                roughness={1}
                metalness={0}
              />
            </mesh>

            {/* Label de zone */}
            <Text
              position={[centerX, LABEL_Y, zoneZ - 24]}
              fontSize={18}
              color={zone.color as THREE.ColorRepresentation}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={1}
              outlineColor="#000000"
            >
              {`${zone.emoji} ${zone.label} (${items.length})`}
            </Text>

            {/* Trait séparateur de zone */}
            <mesh position={[centerX, 0.5, zoneZ - 3]}>
              <boxGeometry args={[gridWidth, 1, 3]} />
              <meshStandardMaterial color={zone.color} />
            </mesh>

            {/* Items */}
            {items.map((item, idx) => {
              const col = idx % COLS;
              const row = Math.floor(idx / COLS);
              const x = col * CELL_SIZE;
              const z = zoneZ + row * CELL_SIZE;

              return (
                <group key={item.id}>
                  {/* Plateau de cellule */}
                  <mesh position={[x, -0.2, z]}>
                    <boxGeometry args={[CELL_SIZE - 4, 0.4, CELL_SIZE - 4]} />
                    <meshStandardMaterial
                      color={zone.color}
                      transparent
                      opacity={0.06}
                    />
                  </mesh>

                  {/* GLB */}
                  <GridItem item={item} position={[x, 0, z]} />

                  {/* Label de l'objet */}
                  <Text
                    position={[x, -8, z + CELL_SIZE * 0.43]}
                    fontSize={6.5}
                    color="#cccccc"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={CELL_SIZE - 8}
                    textAlign="center"
                    outlineWidth={0.4}
                    outlineColor="#000000"
                  >
                    {item.name.length > 42 ? item.name.slice(0, 40) + '…' : item.name}
                  </Text>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
