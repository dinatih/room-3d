/**
 * GridLayout.tsx — Vue inventaire 3D en vitrine / grille verticale face à la caméra.
 *
 * Affiche les objets 3D de l'appartement classés par zone (Couloir, SDB, Cuisine, Salon, Jardin).
 * - Exclut les PNJ (Lara, XBot, etc.) et les animaux (Shiba, Robin, etc.)
 * - Exclut les perruques
 * - Normalise les objets 3D et applique une source de lumière frontale dédiée
 *   afin qu'aucun objet ne soit plongé dans l'ombre du dos de l'appartement.
 *
 * Échelle du projet : 1 unité = 1 cm.
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
    console.warn('[GridLayout] Error loading item GLB:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

// ── Configuration de la grille verticale ──────────────────────────────────────

const CELL_W = 100;
const CELL_H = 95;
const COLS_PER_ZONE = 4;
const ZONE_SPACING_X = 130;
const TARGET_DISPLAY_SIZE = 60;

// ── Définition des Zones ──────────────────────────────────────────────────────

interface ZoneDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const ZONES: ZoneDef[] = [
  {
    id: 'couloir',
    label: 'Couloir & Entrée',
    emoji: '🚪',
    color: '#f39c12',
  },
  {
    id: 'sdb',
    label: 'Salle de bain & WC',
    emoji: '🚿',
    color: '#00cec9',
  },
  {
    id: 'salon',
    label: 'Salon & Séjour',
    emoji: '🛋️',
    color: '#0984e3',
  },
  {
    id: 'cuisine',
    label: 'Cuisine',
    emoji: '🍳',
    color: '#e17055',
  },
  {
    id: 'jardin',
    label: 'Jardin & Balcon',
    emoji: '🌿',
    color: '#00b894',
  },
];

/**
 * Filtre strict pour exclure les personnages, perruques et animaux
 */
function isAllowedInventoryItem(item: InventoryItem): boolean {
  if (!item.glbPath) return false;
  const path = item.glbPath.toLowerCase();
  const id = item.id.toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  // Exclure perruques
  if (cat === 'wigs' || path.includes('wigs') || path.includes('hair') || id.startsWith('hair_')) {
    return false;
  }

  // Exclure personnages (Lara, XBot, etc.)
  if (
    cat === 'walkers' ||
    path.includes('characters/') ||
    id.includes('lara') ||
    id.includes('xbot') ||
    id.includes('walker') ||
    name.includes('lara')
  ) {
    return false;
  }

  // Exclure animaux (Shiba Inu, Robin Bird, etc.)
  if (
    id.includes('shiba') ||
    id.includes('ushiro') ||
    id.includes('robin') ||
    name.includes('shiba') ||
    name.includes('oiseau robin')
  ) {
    return false;
  }

  return true;
}

/**
 * Classe un item d'inventaire dans l'une des 5 zones
 */
function classifyItem(item: InventoryItem): string {
  const text = `${item.id} ${item.name} ${item.notes ?? ''} ${item.category}`.toLowerCase();

  // 1. Jardin / Extérieur
  if (
    text.includes('jardin') ||
    text.includes('extérieur') ||
    text.includes('exterieur') ||
    text.includes('terrasse') ||
    text.includes('balcon') ||
    text.includes('altappen') ||
    text.includes('vatterso') ||
    text.includes('mangeoire') ||
    item.category === 'garden' ||
    item.category === 'outdoor'
  ) {
    return 'jardin';
  }

  // 2. Couloir / Entrée
  if (
    text.includes('couloir') ||
    text.includes('entrée') ||
    text.includes('entree') ||
    text.includes('linky') ||
    text.includes('trottinette') ||
    text.includes('chaussure') ||
    text.includes('grejig') ||
    text.includes('mackapar') ||
    text.includes('patère') ||
    text.includes('patere') ||
    text.includes('sekiner') ||
    text.includes('enudden') ||
    text.includes('klyket')
  ) {
    return 'couloir';
  }

  // 3. Salle de bain / WC
  if (
    item.category === 'bathroom' ||
    text.includes('sdb') ||
    text.includes('bain') ||
    text.includes('douche') ||
    text.includes('wc') ||
    text.includes('toilet') ||
    text.includes('lavabo') ||
    text.includes('vasque') ||
    text.includes('serviette') ||
    text.includes('miroir') ||
    text.includes('nissedal') ||
    text.includes('brogrund') ||
    text.includes('storavan') ||
    text.includes('vallamosse') ||
    text.includes('havback') ||
    text.includes('tisken')
  ) {
    return 'sdb';
  }

  // 4. Cuisine
  if (
    item.category === 'kitchen' ||
    text.includes('cuisine') ||
    text.includes('évier') ||
    text.includes('evier') ||
    text.includes('cuisson') ||
    text.includes('plaque') ||
    text.includes('hotte') ||
    text.includes('casserole') ||
    text.includes('faitout') ||
    text.includes('couvert') ||
    text.includes('cuillère') ||
    text.includes('fourchette') ||
    text.includes('couteau') ||
    text.includes('vaisselle') ||
    text.includes('frigo') ||
    text.includes('boholmen') ||
    text.includes('utdrag') ||
    text.includes('valbildad') ||
    text.includes('middagsmat') ||
    text.includes('annons') ||
    text.includes('fornuft') ||
    text.includes('lillviken') ||
    text.includes('rinnig')
  ) {
    return 'cuisine';
  }

  // 5. Salon / Séjour (par défaut)
  return 'salon';
}

// ── Composant d'affichage d'un modèle 3D ──────────────────────────────────────

interface GridItemProps {
  item: InventoryItem;
  position: [number, number, number];
}

function GridItemInner({ item, position }: GridItemProps) {
  const gltf = useGLTF(item.glbPath!);

  const { clone, scale } = useMemo(() => {
    const clone = gltf.scene.clone(true);

    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);

    // Activer ombres et s'assurer que les matériaux ne sont pas transparents par erreur
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => {
            // Empêcher l'invisibilité des matériaux transparents sans map
            if (m.transparent && !m.map && !m.alphaMap && m.opacity < 0.15) {
              m.opacity = 1;
              m.transparent = false;
            }
          });
        }
      }
    });

    // Bounding box locale réelle
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());

    // Si le modèle est en mètres (< 5 cm dans la box brute), le convertir en centimètres
    const rawMax = Math.max(size.x, size.y, size.z);
    if (rawMax > 0 && rawMax < 5) {
      clone.scale.setScalar(100);
      clone.updateMatrixWorld(true);
      box.setFromObject(clone);
      box.getSize(size);
    }

    // Centrer l'objet dans la case (X=0, Y=0, Z=0)
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);

    // Mettre à l'échelle pour s'inscrire harmonieusement dans la case
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = maxDim > 0 ? TARGET_DISPLAY_SIZE / maxDim : 1;

    return { clone, scale: targetScale };
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

// ── Composant Principal : GridLayout ──────────────────────────────────────────

export function GridLayout() {
  // Liste filtrée sans perso, perruques, ni animaux
  const items = useMemo(() => {
    return INVENTORY.filter(isAllowedInventoryItem);
  }, []);

  // Regroupement par zone
  const groupedZones = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const z of ZONES) map.set(z.id, []);

    for (const item of items) {
      const zoneId = classifyItem(item);
      if (map.has(zoneId)) {
        map.get(zoneId)!.push(item);
      } else {
        map.get('salon')!.push(item);
      }
    }

    return ZONES.map((zone) => ({
      ...zone,
      items: map.get(zone.id) ?? [],
    })).filter((z) => z.items.length > 0);
  }, [items]);

  // Positionnement en X de chaque section de zone
  const zoneLayouts = useMemo(() => {
    let currentX = 0;
    return groupedZones.map((zone) => {
      const cols = Math.min(COLS_PER_ZONE, Math.max(1, zone.items.length));
      const width = cols * CELL_W;
      const x = currentX;
      currentX += width + ZONE_SPACING_X;
      return {
        ...zone,
        startX: x,
        cols,
        width,
      };
    });
  }, [groupedZones]);

  // Centrage de la vitrine au-dessus et devant la scène
  const totalWidth = zoneLayouts.reduce((acc, z) => Math.max(acc, z.startX + z.width), 0);
  const offsetX = -totalWidth / 2 + 158; // centré par rapport à la pièce (ROOM_W = 316)
  const baseZ = -220; // Devant le jardin face caméra

  return (
    <group position={[offsetX, 40, baseZ]}>
      {/* 💡 Lumière directionnelle frontale dédiée à la vitrine pour éclairer parfaitement tous les objets */}
      <directionalLight
        position={[totalWidth / 2, 400, 500]}
        intensity={2.2}
        color="#ffffff"
      />

      {zoneLayouts.map((zone) => {
        const rows = Math.ceil(zone.items.length / zone.cols);
        const totalHeight = rows * CELL_H;
        const centerX = zone.startX + zone.width / 2 - CELL_W / 2;

        return (
          <group key={zone.id}>
            {/* 🏷️ Titre de la zone */}
            <Text
              position={[centerX, totalHeight + 35, 0]}
              fontSize={24}
              color={zone.color}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={1.5}
              outlineColor="#111111"
            >
              {`${zone.emoji} ${zone.label} (${zone.items.length})`}
            </Text>

            {/* 📋 Panneau d'arrière-plan semi-transparent */}
            <mesh
              position={[centerX, totalHeight / 2 - CELL_H / 2, -15]}
              receiveShadow
            >
              <planeGeometry args={[zone.width + 20, totalHeight + 20]} />
              <meshStandardMaterial
                color={zone.color}
                transparent
                opacity={0.16}
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>

            {/* Cadre délimitant */}
            <lineSegments position={[centerX, totalHeight / 2 - CELL_H / 2, -14]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(zone.width + 20, totalHeight + 20)]} />
              <lineBasicMaterial color={zone.color} transparent opacity={0.6} />
            </lineSegments>

            {/* 📦 Cellules et objets */}
            {zone.items.map((item, idx) => {
              const col = idx % zone.cols;
              const row = Math.floor(idx / zone.cols);

              // X en largeur, Y en hauteur (du haut vers le bas)
              const cellX = zone.startX + col * CELL_W;
              const cellY = (rows - 1 - row) * CELL_H;

              return (
                <group key={item.id} position={[cellX, cellY, 0]}>
                  {/* Fond de case */}
                  <mesh position={[0, 0, -10]}>
                    <planeGeometry args={[CELL_W - 12, CELL_H - 12]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
                  </mesh>

                  {/* Tablette d'étagère sous l'objet */}
                  <mesh position={[0, -CELL_H / 2 + 8, 0]}>
                    <boxGeometry args={[CELL_W - 10, 2, 35]} />
                    <meshStandardMaterial color={zone.color} roughness={0.4} />
                  </mesh>

                  {/* Modèle 3D centré */}
                  <GridItem item={item} position={[0, 0, 5]} />

                  {/* Nom de l'objet */}
                  <Text
                    position={[0, -CELL_H / 2 + 2, 18]}
                    fontSize={6.5}
                    color="#f1f2f6"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={CELL_W - 10}
                    textAlign="center"
                    outlineWidth={0.6}
                    outlineColor="#000000"
                  >
                    {item.name.length > 32 ? `${item.name.slice(0, 30)}…` : item.name}
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
