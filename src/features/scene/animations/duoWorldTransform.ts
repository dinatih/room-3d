/** Place both duo roots relative to a shared anchor (centimetres, radians). */
export function computeWorldTransform(
  anchorPos: [number, number, number],
  anchorRotY: number,
  offsetB: [number, number, number] = [0, 0, 0],
  rotB = 0
) {
  const [bx, by, bz] = anchorPos;
  const cos = Math.cos(anchorRotY);
  const sin = Math.sin(anchorRotY);
  const [lx, ly, lz] = offsetB;
  return {
    posA: [bx, by, bz] as [number, number, number],
    posB: [bx + lx * cos + lz * sin, by + ly, bz - lx * sin + lz * cos] as [number, number, number],
    rotA: anchorRotY % (Math.PI * 2),
    rotB: (anchorRotY + rotB) % (Math.PI * 2),
  };
}
