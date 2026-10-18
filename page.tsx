'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { enqueue } from '@/lib/offline-db';
import { useTasks, useEquipmentList } from '@/lib/tasks';

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('sv-SE'); };

export default function Page() {
  const { user, profile } = useAuth();
  const [tasks] = useTasks();
  const [equipment] = useEquipmentList();
  const [date, setDate] = useState(tomorrow());
  const [taskId, setTaskId] = useState('');
  const [target, setTarget] = useState('');
  const [hours, setHours] = useState<Record<string, string>>({});
  const [crew, setCrew] = useState<{ trade: string; qty: string }[]>([{ trade: '', qty: '' }]);
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!profile?.project_id) return <main className="p-4">Akun Anda belum terhubung ke proyek. Hubungi admin.</main>;
  const task = tasks.find((t) => t.id === taskId);
  const ok = date && taskId && parseFloat(target) > 0;

  async function submit() {
    setBusy(true);
    await enqueue('daily_plans', {
      project_id: profile!.project_id, plan_date: date, task_id: taskId, target_volume: parseFloat(target), notes,
      equipment: equipment.filter((e) => parseFloat(hours[e.id]) > 0).map((e) => ({ equipment_id: e.id, code: e.code, hours: parseFloat(hours[e.id]) })),
      manpower: crew.filter((c) => c.trade && parseInt(c.qty) > 0).map((c) => ({ trade: c.trade, qty: parseInt(c.qty) })),
      created_by: user!.id,
    });
    setBusy(false); setDone(true);
  }

  if (done) return (
    <main className="mx-auto max-w-xl p-4">
      <p className="rounded-lg bg-green-100 p-4 text-lg font-semibold text-green-800">Rencana tersimpan. Terkirim otomatis saat online.</p>
      <button onClick={() => { setDone(false); setTaskId(''); setTarget(''); setHours({}); setCrew([{ trade: '', qty: '' }]); setNotes(''); }}
        className="mt-4 h-14 w-full rounded-xl border-2 font-bold">Buat rencana lain</button>
    </main>
  );

  const input = 'h-14 w-full rounded-lg border-2 border-neutral-300 px-3 text-base';
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Planning harian</h1>
      <label className="font-semibold">Tanggal kerja<input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label className="font-semibold">Pekerjaan
        <select className={input} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
          <option value="">Pilih pekerjaan</option>
          {tasks.filter((t) => t.status !== 'done').map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select></label>
      <label className="font-semibold">Target volume hari itu {task && `(${task.unit})`}
        <input inputMode="decimal" className={input} value={target} onChange={(e) => setTarget(e.target.value)} /></label>
      {task && <p className="text-sm text-neutral-700">Sisa pekerjaan: {Math.max(task.target_volume - task.actual_volume, 0)} {task.unit}</p>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">Alat yang dialokasikan (jam rencana)</legend>
        {equipment.length === 0 && <p className="text-neutral-600">Belum ada data alat.</p>}
        {equipment.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-lg border p-2">
            <span className="flex-1 font-semibold">{e.code} · {e.name}</span>
            <input inputMode="decimal" placeholder="jam" className="h-12 w-20 rounded-lg border-2 px-2 text-center"
              value={hours[e.id] ?? ''} onChange={(x) => setHours({ ...hours, [e.id]: x.target.value })} />
          </div>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">Tenaga kerja</legend>
        {crew.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input className="h-14 flex-1 rounded-lg border-2 px-3" placeholder="Jenis (mis. tukang besi)" value={c.trade}
              onChange={(e) => setCrew(crew.map((x, j) => j === i ? { ...x, trade: e.target.value } : x))} />
            <input inputMode="numeric" className="h-14 w-20 rounded-lg border-2 px-2 text-center" placeholder="org" value={c.qty}
              onChange={(e) => setCrew(crew.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} />
          </div>
        ))}
        <button type="button" onClick={() => setCrew([...crew, { trade: '', qty: '' }])} className="h-12 rounded-lg border-2 font-semibold">Tambah baris</button>
      </fieldset>

      <textarea className="min-h-20 rounded-lg border-2 p-3" placeholder="Catatan persiapan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button onClick={submit} disabled={!ok || busy} className="h-16 rounded-xl bg-amber-500 text-lg font-bold text-black disabled:opacity-40">{busy ? 'Menyimpan…' : 'Simpan rencana'}</button>
    </main>
  );
}
