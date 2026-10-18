'use client';
import { useState } from 'react';
import { enqueue } from '@/lib/offline-db';
import { PTW_CHECKLIST, PTW_LABEL, PTWKey } from '@/lib/templates';
import SignaturePad from './SignaturePad';

export default function PTWForm({ requesterId, onDone }: { requesterId: string; onDone?: () => void }) {
  const [type, setType] = useState<PTWKey>('working_at_height');
  const [f, setF] = useState({ title: '', location: '', description: '', start_at: '', end_at: '' });
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = PTW_CHECKLIST[type];
  const complete = list.every((i) => checked[i.key]) && f.title && f.location && f.start_at && f.end_at && sig;

  async function submit() {
    setBusy(true);
    await enqueue('ptw_permits', {
      type, ...f,
      start_at: new Date(f.start_at).toISOString(), end_at: new Date(f.end_at).toISOString(),
      checklist: list.map((i) => ({ ...i, checked: !!checked[i.key] })),
      requester_id: requesterId, requester_signature: sig,
    });
    setBusy(false); onDone?.();
  }

  const input = 'h-14 w-full rounded-lg border-2 border-neutral-300 px-3 text-base';
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Permit to Work</h2>

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(PTW_LABEL) as PTWKey[]).map((k) => (
          <button key={k} type="button" onClick={() => { setType(k); setChecked({}); }}
            className={`h-16 rounded-xl border-2 font-bold ${type === k ? 'border-amber-600 bg-amber-400' : 'border-neutral-300 bg-white'}`}>
            {PTW_LABEL[k]}
          </button>
        ))}
      </div>

      <input className={input} placeholder="Judul pekerjaan" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <input className={input} placeholder="Lokasi kerja" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
      <textarea className="min-h-24 w-full rounded-lg border-2 border-neutral-300 p-3" placeholder="Uraian pekerjaan dan potensi bahaya"
        value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <label className="text-sm font-semibold">Mulai
        <input type="datetime-local" className={input} value={f.start_at} onChange={(e) => setF({ ...f, start_at: e.target.value })} /></label>
      <label className="text-sm font-semibold">Selesai
        <input type="datetime-local" className={input} value={f.end_at} onChange={(e) => setF({ ...f, end_at: e.target.value })} /></label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">Syarat keselamatan (wajib semua)</legend>
        {list.map((i) => (
          <label key={i.key} className="flex min-h-14 items-center gap-3 rounded-lg border p-3">
            <input type="checkbox" className="h-7 w-7" checked={!!checked[i.key]}
              onChange={(e) => setChecked({ ...checked, [i.key]: e.target.checked })} />
            <span>{i.label}</span>
          </label>
        ))}
      </fieldset>

      <div><p className="mb-1 font-bold">Tanda tangan pemohon</p><SignaturePad onChange={setSig} /></div>

      <button onClick={submit} disabled={!complete || busy}
        className="h-16 rounded-xl bg-amber-500 text-lg font-bold text-black disabled:opacity-40">
        {busy ? 'Menyimpan…' : 'Ajukan permit'}
      </button>
    </div>
  );
}
