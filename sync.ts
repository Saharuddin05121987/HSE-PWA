import { createClient } from '@supabase/supabase-js';
import { db } from './offline-db';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

let running = false;
const MAX_ATTEMPTS = 8;

/** Kirim antrean FIFO. Aman dipanggil berulang: idempoten lewat client_id. */
export async function runSync(onProgress?: (left: number) => void) {
  if (running || !navigator.onLine) return;
  running = true;
  try {
    const d = await db();
    const items = await d.getAllFromIndex('queue', 'by-created');
    for (const item of items) {
      if (item.attempts >= MAX_ATTEMPTS) continue;
      try {
        const payload = { ...item.payload };

        if (item.blobKey && item.blobBucket && item.blobField) {
          const blob = await d.get('blobs', item.blobKey);
          if (!blob) throw new Error('Foto hilang dari penyimpanan lokal');
          const path = `${(payload.user_id ?? payload.operator_id ?? 'anon')}/${item.id}.jpg`;
          const up = await supabase.storage
            .from(item.blobBucket)
            .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
          if (up.error) throw up.error;
          payload[item.blobField] = path;
        }

        const { error } = await supabase
          .from(item.table)
          .upsert(payload, { onConflict: 'client_id', ignoreDuplicates: true });
        if (error) throw error;

        await d.delete('queue', item.id);
        if (item.blobKey) await d.delete('blobs', item.blobKey);
      } catch (e: any) {
        // Pelanggaran aturan bisnis (mis. P2H gagal) = permanen, jangan retry terus
        const permanent = /P2H|berwenang|violates|row-level/i.test(e?.message ?? '');
        await d.put('queue', {
          ...item,
          attempts: permanent ? MAX_ATTEMPTS : item.attempts + 1,
          lastError: e?.message ?? String(e),
        });
      }
      onProgress?.(await d.count('queue'));
    }
  } finally {
    running = false;
  }
}

/** Panggil sekali saat app dimuat (di layout klien). */
export function startAutoSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
    navigator.serviceWorker.addEventListener('message', (e) => e.data?.type === 'RUN_SYNC' && runSync());
  }
  window.addEventListener('online', () => runSync());
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && runSync());
  setInterval(() => runSync(), 30_000);
  runSync();
}
