import { BlobShadow, type BlobShadowProps } from '../BlobShadow';

export function CharacterShadow({ hipsBone, visible = true }: { hipsBone?: import('three').Bone | null; visible?: boolean }) {
  return <BlobShadow size={[55, 65]} trackBone={hipsBone} visible={visible} />;
}

export { BlobShadow, type BlobShadowProps };
