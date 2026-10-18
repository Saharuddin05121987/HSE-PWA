'use client';
import { useState } from 'react';
import { supabase } from '@/lib/sync';
import SignaturePad from './SignaturePad';

const STEP_LABEL: Record<string, string> = {
  pending_supervisor: 'Menunggu Supervisor',
  pending_hse: 'Menunggu HSE Officer',
  pending_pm: 'Menunggu Project Manager',
  approved: 'Disetujui', rejected: 'Ditolak', closed: 'Ditutup',
};

// Approval WAJIB online: keputusan divalidasi server (peran + urutan tahap) lewat RPC approve_ptw.
export default function PTWApprovalCard({ permit, onDecided }: { permit: any; onDecided?: () => void }) {
  const [sig, setSig] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(decision: 'approved' | 'rejected') {
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('approve_ptw', {
      p_permit: permit.id, p_decision: decision, p_signature: sig, p_note: note || null,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    onDecided?.();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div>
        <p className="text-lg font-bold">{permit.title}</p>
        <p className="text-sm text-neutral-600">{permit.location} · {STEP_LABEL[permit.status]}</p>
      </div>
      <SignaturePad onChange={setSig} />
      <textarea className="min-h-20 rounded-lg border-2 p-3" placeholder="Catatan (wajib jika menolak)"
        value={note} onChange={(e) => setNote(e.target.value)} />
      {err && <p className="text-sm font-semibold text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button disabled={!sig || busy} onClick={() => decide('rejected')}
          className="h-16 flex-1 rounded-xl border-2 border-red-700 font-bold text-red-700 disabled:opacity-40">Tolak</button>
        <button disabled={!sig || busy} onClick={() => decide('approved')}
          className="h-16 flex-1 rounded-xl bg-green-600 font-bold text-white disabled:opacity-40">Setujui</button>
      </div>
    </div>
  );
}
