/**
 * LaptopDesk.tsx — Laptop + smartphone + mug sur le bureau 2.
 * Port fidèle de js/furniture/laptop.js.
 *
 * Le parent (desk2Surface) est au sommet du bureau 2 :
 * world position [200, 70, 170], rotation.y effectif = 0
 * (desk group π + laptop.js parent π = 2π).
 */
import { Laptop } from './items/Laptop';
import { Phone }  from './items/Phone';
import { Mug }    from './items/Mug';

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Contenu posé sur la surface du bureau 2.
 * Doit être rendu dans un group enfant du bureau 2 à [0, height, 0] rotation.y=π.
 * (desk2 rotY=π annulé par ce π = net 0, fidèle à laptop.js vanilla)
 */
export function LaptopDesk() {
  return (
    <>
      <Laptop item={{} as any} actionState={{}} onSize={() => {}} />
      <group position={[22, 0, 2]} rotation={[0, 0.15, 0]}>
        <Phone item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[-22, 0, -7]}>
        <Mug item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </>
  );
}
