import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type QueueTable = 'p2h_reports' | 'equipment_usage' | 'visual_reports' | 'capa' | 'ptw_permits' | 'near_miss_reports' | 'inspections' | 'field_issues' | 'daily_plans' | 'daily_reports' | 'daily_manpower';

export interface QueueItem {
  id: string;                 // = client_id (idempotensi)
  table: QueueTable;
  payload: Record<string, unknown>;
  blobKey?: string;
  blobBucket?: string;
  blobField?: string;
  attempts: number;
  createdAt: number;
  lastError?: string;
}

interface Schema extends DBSchema {
  queue: { key: string; value: QueueItem; indexes: { 'by-created': number } };
  blobs: { key: string; value: Blob };
}

let dbp: Promise<IDBPDatabase<Schema>> | null = null;
export const db = () =>
  (dbp ??= openDB<Schema>('prodhse', 1, {
    upgrade(d) {
      d.createObjectStore('queue', { keyPath: 'id' }).createIndex('by-created', 'createdAt');
      d.createObjectStore('blobs');
    },
  }));

export async function enqueue(
  table: QueueTable,
  payload: Record<string, unknown>,
  opts?: { blob?: Blob; bucket?: string; field?: string }
) {
  const d = await db();
  const id = (payload.client_id as string) ?? crypto.randomUUID();
  const item: QueueItem = {
    id, table, payload: { ...payload, client_id: id },
    attempts: 0, createdAt: Date.now(),
  };
  if (opts?.blob) {
    item.blobKey = `blob:${id}`;
    item.blobBucket = opts.bucket;
    item.blobField = opts.field;
    await d.put('blobs', opts.blob, item.blobKey);
  }
  await d.put('queue', item);
  try {
    const reg: any = await navigator.serviceWorker?.ready;
    await reg?.sync?.register('sync-queue');
  } catch {}
  return id;
}

export const pendingCount = async () => (await db()).count('queue');
