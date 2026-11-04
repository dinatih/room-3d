/** Métadonnées JSON courtes suivies des buffers binaires, sans tableaux de nombres en texte. */
export function packRenderArchive(payload: unknown): Blob {
  const buffers: ArrayBufferView[] = [];
  const indices = new Map<ArrayBufferView, number>();
  const json = JSON.stringify(payload, (_key, value) => {
    if (!ArrayBuffer.isView(value)) return value;
    let index = indices.get(value);
    if (index === undefined) { index = buffers.length; indices.set(value, index); buffers.push(value); }
    return { renderBuffer: index };
  });
  const metadata = new TextEncoder().encode(JSON.stringify({ json, buffers: buffers.map(buffer => ({ type: buffer.constructor.name, bytes: buffer.byteLength })) }));
  const header = new ArrayBuffer(4);
  new DataView(header).setUint32(0, metadata.byteLength, true);
  return new Blob([header, metadata, ...buffers.map(buffer => buffer as unknown as BlobPart)], { type: 'application/octet-stream' });
}

export async function unpackRenderArchive<T>(archive: Blob): Promise<T> {
  const length = new DataView(await archive.slice(0, 4).arrayBuffer()).getUint32(0, true);
  const metadata = JSON.parse(await archive.slice(4, 4 + length).text()) as { json: string; buffers: { type: string; bytes: number }[] };
  const constructors = { Float32Array, Float64Array, Uint32Array, Uint16Array, Uint8Array, Uint8ClampedArray, Int32Array, Int16Array, Int8Array };
  const buffers: ArrayBufferView[] = [];
  let offset = 4 + length;
  for (const entry of metadata.buffers) {
    const Constructor = constructors[entry.type as keyof typeof constructors];
    if (!Constructor || offset + entry.bytes > archive.size) throw new Error('Archive de rendu invalide');
    buffers.push(new Constructor(await archive.slice(offset, offset + entry.bytes).arrayBuffer()));
    offset += entry.bytes;
  }
  if (offset !== archive.size) throw new Error('Taille de l’archive de rendu invalide');
  return JSON.parse(metadata.json, (_key, value) => {
    if (value && typeof value === 'object' && 'renderBuffer' in value) {
      if (!Number.isInteger(value.renderBuffer) || !buffers[value.renderBuffer]) throw new Error('Buffer de rendu invalide');
      return buffers[value.renderBuffer];
    }
    return value;
  });
}
