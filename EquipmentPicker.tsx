'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/sync';

export type Equipment = { id: string; code: string; name: string; hour_meter: number };
const KEY = 'prodhse:equipment';

// Daftar alat di-cache agar bisa dipilih saat offline
export default function EquipmentPicker({ onPick }: { onPick: (e: Equipment | null) => void }) {
  const [list, setList] = useState<Equipment[]>([]);
  useEffect(() => {
    const cached = localStorage.getItem(KEY);
    if (cached) setList(JSON.parse(cached));
    if (navigator.onLine) supabase.from('equipment').select('id,code,name,hour_meter').order('code').then(({ data }) => {
      if (data) { setList(data as Equipment[]); localStorage.setItem(KEY, JSON.stringify(data)); }
    });
  }, []);
  return (
    <select className="h-14 w-full rounded-lg border-2 border-neutral-300 px-3 text-lg"
      defaultValue="" onChange={(e) => onPick(list.find((x) => x.id === e.target.value) ?? null)}>
      <option value="" disabled>Pilih alat</option>
      {list.map((e) => <option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}
    </select>
  );
}
