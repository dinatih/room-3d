/**
 * Garden.tsx — mobilier de jardin / terrasse.
 * Port de js/furniture/garden.js (sans galerie GLB animée ni Lara — HIDE_LARA=true).
 */
import { AltappenRugField } from './items/AltappenRug';
import { ArmrestSofa } from './items/ArmrestSofa';
import { ArmlessSofa } from './items/ArmlessSofa';
import { Bathtub } from './items/Bathtub';
import { ChestBench } from './items/ChestBench';
import { PottedPalm } from './items/PottedPalm';
import { Viggja } from './items/Viggja';
import { JoggingSuit } from './items/JoggingSuit';

// ── Canapé de jardin 1 (160×60×90cm, avec accoudoirs) ────────────────────────

function ArmrestSofaPlaced() {
  return (
    <group position={[270, 0, -110]}>
      <ArmrestSofa item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Canapé de jardin 2 (100×60×100cm, sans accoudoirs) ───────────────────────

function ArmlessSofaPlaced() {
  return (
    <group position={[100, 0, -80]} rotation={[0, Math.PI, 0]}>
      <ArmlessSofa item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Coffre banc YITAHOME (122×55×62cm) ───────────────────────────────────────

function ChestBenchPlaced() {
  return (
    <group position={[40 , 0, -90]}>
      <ChestBench item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Desserte VIGGJA (GLB) ─────────────────────────────────────────────────────

function ViggjaPlaced() {
  return (
    <group position={[100, 0, -178]}>
      <Viggja item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Palmier en pot ────────────────────────────────────────────────────────────

function PottedPalmPlaced() {
  return (
    <group position={[100, 0, -145]}>
      <PottedPalm item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Baignoire extérieure ──────────────────────────────────────────────────────

function BathtubPlaced() {
  return (
    <group position={[120, 0, -250]} rotation={[0, -1, 0]}>
      <Bathtub item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Jogging suit (GLB) ────────────────────────────────────────────────────────

function JoggingSuitPlaced() {
  return (
    <group position={[260, 0, -250]}>
      <JoggingSuit item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────

/** Éléments procéduraux (visibles indépendamment du filtre GLB) */
export function Garden() {
  return (
    <>
      <AltappenRugField />
      <ArmrestSofaPlaced />
      <ArmlessSofaPlaced />
      <ChestBenchPlaced />
      <BathtubPlaced />
    </>
  );
}

/** Éléments GLB du jardin (masqués par le filtre GLB) */
export function GardenGlb() {
  return (
    <>
      <ViggjaPlaced />
      <PottedPalmPlaced />
      <JoggingSuitPlaced />
    </>
  );
}
