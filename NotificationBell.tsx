'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/sync';

type N = { kind: string; ref_id: string; message: string; at: string; priority: number };

export default function NotificationBell() {
  const [items, setItems] = useState<N[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!navigator.onLine) return;
    const { data } = await supabase.from('my_notifications').select('*').order('priority').order('at', { ascending: false });
    setItems((data as N[]) ?? []);
  }, []);

  useEffect(() => {
    load();
    // Realtime: muat ulang saat PTW / CAPA / P2H berubah
    const ch = supabase.channel('notif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ptw_permits' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capa' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'p2h_reports' }, load)
      .subscribe();
    window.addEventListener('online', load);
    return () => { supabase.removeChannel(ch); window.removeEventListener('online', load); };
  }, [load]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label={`Notifikasi (${items.length})`}
        className="relative h-12 w-12 rounded-full border-2 text-xl">
        🔔
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-auto rounded-xl border bg-white p-2 shadow-lg">
          {items.length === 0 && <p className="p-4 text-center text-neutral-600">Tidak ada yang perlu ditindak.</p>}
          {items.map((n) => (
            <div key={n.kind + n.ref_id} className="border-b p-3 last:border-0">
              <p className="font-semibold">{n.message}</p>
              <p className="text-xs text-neutral-500">{new Date(n.at).toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
