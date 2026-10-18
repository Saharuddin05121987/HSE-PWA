'use client';
import { useState } from 'react';
import { enqueue } from '@/lib/offline-db';
import { P2H_HEAVY, Result } from '@/lib/templates';
import { rememberP2H } from '@/lib/p2h-gate';

type Props = { equipmentId: string; equipmentName: string; operatorId: string; onDone?: (passed: boolean) => void };

export default function P2HForm({ equipmentId, equipmentName, operatorId, onDone }: Props) {
  const [res, setRes] = useState<Record<string, Result | undefined>>({});
  const [busy, setBusy] = useState(false);
  const allAnswered = P2H_HEAVY.every((i) => res[i.key]);
  const critFail = P2H_HEAVY.some((i) => i.critical && res[i.key] === 'fail');

  async function submit() {
    setBusy(true);
    const id = crypto.randomUUID(); // id = client_id agar hour-meter bisa mereferensikan P2H ini walau masih offline
    await enqueue('p2h_reports', {
      id, client_id: id, equipment_id: equipmentId, operator_id: operatorId,
      report_date: new Date().toLocaleDateString('sv-SE'),
      has_critical_fail: critFail,
      items: P2H_HEAVY.map((i) => ({ ...i, result: res[i.key] })),
    });
    rememberP2H(equipmentId, id, !critFail);
    setBusy(false);
    onDone?.(!critFail);
  }

  const btn = (item: string, v: Result, label: string, on: string) => (
    <button
      type="button" onClick={() => setRes({ ...res, [item]: v })}
      className={`h-14 flex-1 rounded-lg border-2 text-base font-bold ${res[item] === v ? on : 'border-neutral-300 bg-white text-neutral-700'}`}
    >{label}</button>
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">P2H: {equipmentName}</h2>
      {P2H_HEAVY.map((i) => (
        <div key={i.key} className="rounded-xl border p-3">
          <p className="mb-2 font-semibold">{i.label}{i.critical && <span className="ml-2 text-sm text-red-700">(kritis)</span>}</p>
          <div className="flex gap-2">
            {btn(i.key, 'pass', 'Baik', 'border-green-700 bg-green-600 text-white')}
            {btn(i.key, 'fail', 'Rusak', 'border-red-700 bg-red-600 text-white')}
            {btn(i.key, 'na', 'N/A', 'border-neutral-700 bg-neutral-600 text-white')}
          </div>
        </div>
      ))}
      {critFail && (
        <p className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
          Ada item kritis rusak. Alat dilarang beroperasi dan temuan CAPA akan dibuat otomatis.
        </p>
      )}
      <button onClick={submit} disabled={!allAnswered || busy}
        className="h-16 rounded-xl bg-amber-500 text-lg font-bold text-black disabled:opacity-40">
        {busy ? 'Menyimpan…' : 'Kirim P2H'}
      </button>
    </div>
  );
}
