'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/sync';
import { pendingCount } from '@/lib/offline-db';
import ExportButtons from '@/components/ExportButtons';
import NotificationBell from '@/components/NotificationBell';

type S = {
  project_name: string; progress_pct: number; total_man_hours: number; safe_man_hours: number; lti_total: number;
  capa_open: number; capa_closed: number; capa_overdue: number; pending_approvals: number;
};
const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n));

export default function Dashboard() {
  const [rows, setRows] = useState<S[]>([]);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    supabase.from('dashboard_summary').select('*').then(({ data }) => setRows((data as S[]) ?? []));
    pendingCount().then(setQueued);
  }, []);

  const cols = [
    { key: 'project_name', label: 'Proyek' }, { key: 'progress_pct', label: 'Progres (%)' },
    { key: 'safe_man_hours', label: 'Safe man-hours' }, { key: 'total_man_hours', label: 'Total man-hours' },
    { key: 'lti_total', label: 'LTI' }, { key: 'capa_open', label: 'CAPA terbuka' },
    { key: 'capa_closed', label: 'CAPA selesai' }, { key: 'capa_overdue', label: 'CAPA terlambat' },
    { key: 'pending_approvals', label: 'Menunggu approval' },
  ];

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ringkasan proyek</h1>
        <NotificationBell />
      </header>

      {queued > 0 && (
        <p className="rounded-lg bg-amber-100 p-3 font-semibold text-amber-900">
          {queued} data menunggu dikirim. Akan terkirim otomatis saat sinyal tersedia.
        </p>
      )}

      {rows.map((s) => (
        <section key={s.project_name} className="flex flex-col gap-3 rounded-2xl border-2 p-4">
          <h2 className="text-lg font-bold">{s.project_name}</h2>

          <div>
            <div className="flex justify-between font-semibold"><span>Progres keseluruhan</span><span>{s.progress_pct}%</span></div>
            <div className="mt-1 h-4 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full bg-amber-500" style={{ width: `${s.progress_pct}%` }} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-100 p-3"><dt className="text-sm">Safe man-hours</dt><dd className="text-2xl font-bold">{fmt(s.safe_man_hours)}</dd></div>
            <div className="rounded-xl bg-neutral-100 p-3"><dt className="text-sm">Total man-hours</dt><dd className="text-2xl font-bold">{fmt(s.total_man_hours)}</dd></div>
            <div className="rounded-xl bg-neutral-100 p-3"><dt className="text-sm">CAPA terbuka / selesai</dt><dd className="text-2xl font-bold">{s.capa_open} / {s.capa_closed}</dd></div>
            <div className={`rounded-xl p-3 ${s.pending_approvals ? 'bg-amber-100' : 'bg-neutral-100'}`}><dt className="text-sm">Menunggu approval</dt><dd className="text-2xl font-bold">{s.pending_approvals}</dd></div>
          </dl>

          {s.capa_overdue > 0 && <p className="font-semibold text-red-700">{s.capa_overdue} CAPA melewati target tanggal.</p>}
          {s.lti_total > 0 && <p className="text-sm">LTI tercatat: {s.lti_total}. Safe man-hours dihitung sejak LTI terakhir.</p>}
        </section>
      ))}

      <ExportButtons title="Ringkasan Proyek Produksi & HSE" filename="ringkasan-proyek" cols={cols} rows={rows} />
    </main>
  );
}
