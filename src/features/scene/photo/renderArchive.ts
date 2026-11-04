/** Métadonnées JSON courtes suivies des buffers binaires, sans tableaux de nombres en texte. */
export function packRenderArchive(payload: unknown): Blob {
  const buffers: ArrayBufferView[] = [];
  const indices = new Map<ArrayBufferView | string, number>();
  const json = JSON.stringify(payload, (key, value) => {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      if (Number.isNaN(value)) throw new Error(`Valeur numérique invalide : ${key}`);
      return { renderInfinity: Math.sign(value) };
    }
    const image = typeof value === 'string' && value.startsWith('data:');
    if (!image && !ArrayBuffer.isView(value)) return value;
    let index = indices.get(value);
    if (index === undefined) {
      index = buffers.length;
      indices.set(value, index);
      buffers.push(typeof value === 'string' ? new TextEncoder().encode(value) : value);
    }
    return image ? { renderImage: index } : { renderBuffer: index };
  });
  console.info('[Raytracing archive] metadata ready', json.length, buffers.length, buffers.reduce((n, b) => n + b.byteLength, 0));
  const metadata = new TextEncoder().encode(JSON.stringify({ json, buffers: buffers.map(buffer => ({ type: buffer.constructor.name, bytes: buffer.byteLength })) }));
  const header = new ArrayBuffer(4);
  new DataView(header).setUint32(0, metadata.byteLength, true);
  return new Blob([header, metadata, ...buffers.map(buffer => buffer as unknown as BlobPart)], { type: 'application/octet-stream' });
}

export async function unpackRenderArchive<T>(stream: ReadableStream<Uint8Array>): Promise<T> {
  const reader = stream.getReader();
  let pending: Uint8Array = new Uint8Array(0);
  const read = async (length: number) => {
    const result = new Uint8Array(length);
    let offset = 0;
    while (offset < length) {
      if (!pending.byteLength) {
        const chunk = await reader.read();
        if (chunk.done) throw new Error('Archive de rendu invalide : flux tronqué');
        pending = chunk.value;
      }
      const count = Math.min(pending.byteLength, length - offset);
      result.set(pending.subarray(0, count), offset);
      pending = pending.subarray(count);
      offset += count;
    }
    return result;
  };
  try {
    const length = new DataView((await read(4)).buffer).getUint32(0, true);
    const metadata = JSON.parse(new TextDecoder().decode(await read(length))) as { json: string; buffers: { type: string; bytes: number }[] };
    const constructors = { Float32Array, Float64Array, Uint32Array, Uint16Array, Uint8Array, Uint8ClampedArray, Int32Array, Int16Array, Int8Array };
    const buffers: ArrayBufferView[] = [];
    for (const entry of metadata.buffers) {
      const Constructor = constructors[entry.type as keyof typeof constructors];
      if (!Constructor || !Number.isInteger(entry.bytes) || entry.bytes < 0) throw new Error('Archive de rendu invalide');
      buffers.push(new Constructor((await read(entry.bytes)).buffer));
    }
    if (pending.byteLength || !(await reader.read()).done) throw new Error('Taille de l’archive de rendu invalide');
    return JSON.parse(metadata.json, (_key, value) => {
      if (value && typeof value === 'object' && 'renderInfinity' in value) {
        if (value.renderInfinity !== 1 && value.renderInfinity !== -1) throw new Error('Valeur infinie de rendu invalide');
        return value.renderInfinity * Infinity;
      }
      if (value && typeof value === 'object' && ('renderBuffer' in value || 'renderImage' in value)) {
        const index = value.renderImage ?? value.renderBuffer;
        if (!Number.isInteger(index) || !buffers[index]) throw new Error('Buffer de rendu invalide');
        return 'renderImage' in value ? new TextDecoder().decode(buffers[index] as Uint8Array<ArrayBuffer>) : buffers[index];
      }
      return value;
    });
  } finally { reader.releaseLock(); }
}
