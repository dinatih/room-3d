import { MeshStandardMaterial } from "three";

// Matériaux partagés entre plusieurs modules.
// Les matériaux spécifiques (textures, paramètres uniques) restent locaux.

export const whiteMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
export const blackMat = new MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.2 });
export const metalMat = new MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 });
export const redMat = new MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });
