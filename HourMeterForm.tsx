'use client';
import { useEffect, useState } from 'react';
import { enqueue } from '@/lib/offline-db';
import { getTodayPassedP2H } from '@/lib/p2h-gate';

type Props = { equipmentId: string; equipmentName: string; operatorId: string; lastHm?: number; onDone?: () => void };

// Terkunci sampai P2H hari ini lulus. Penegakan sesungguhnya: trigger enforce_p2h_before_hm di database.
export default function HourMeterForm({ equipmentId, equipmentName, operatorId, lastHm = 0, onDone }: Props) {
  const [p2hId, setP2hId] = useState<string | null | undefined>(undefined);
  const [start, setStart] = useState(String(lastHm));
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setP2hId(getTodayPassedP2H(equipmentId)), [equipmentId]);
  if (p2hId === undefined) return null;

  if (!p2hId) {
    return (
      <div className="rounded-xl border-2 border-red-600 bg-red-50 p-4">
        <p className="text-lg font-bold text-red-800">Hour-meter terkunci</p>
        <p className="mt-1">Isi P2H {equipmentName} hari ini dan pastikan hasilnya lulus sebelum mencatat jam operasi.</p>
      </div>
    );
  }

  const s = parseFloat(start), e = parseFloat(end);
  const valid = !isNaN(s) && !isNaN(e) && e >= s;

  async function submit() {
    setBusy(true);
    await enqueue('equipment_usage', {
      equipment_id: equipmentId, p2h_id: p2hId, operator_id: operatorId,
      usage_date: new Date().toLocaleDateString('sv-SE'), hm_start: s, hm_end: e,
    });
    setBusy(false); onDone?.();
  }

  const input = 'h-14 w-full rounded-lg border-2 border-neutral-300 px-3 text-lg';
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Hour-meter: {equipmentName}</h2>
      <label className="font-semibold">HM awal
        <input inputMode="decimal" className={input} value={start} onChange={(x) => setStart(x.target.value)} /></label>
      <label className="font-semibold">HM akhir
        <input inputMode="decimal" className={input} value={end} onChange={(x) => setEnd(x.target.value)} /></label>
      {end && !valid && <p className="font-semibold text-red-700">HM akhir tidak boleh lebih kecil dari HM awal.</p>}
      {valid && <p className="text-neutral-700">Jam operasi: <strong>{(e - s).toFixed(1)} jam</strong></p>}
      <button onClick={submit} disabled={!valid || busy}
        className="h-16 rounded-xl bg-amber-500 text-lg font-bold text-black disabled:opacity-40">
        {busy ? 'Menyimpan…' : 'Simpan jam operasi'}
      </button>
    </div>
  );
}
