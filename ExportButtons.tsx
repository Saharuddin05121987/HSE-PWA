'use client';
import { Col, exportExcel, exportPdf } from '@/lib/export';

export default function ExportButtons({ title, filename, cols, rows }:
  { title: string; filename: string; cols: Col[]; rows: Record<string, any>[] }) {
  const cls = 'h-12 flex-1 rounded-lg border-2 border-neutral-700 font-semibold disabled:opacity-40';
  return (
    <div className="flex gap-2">
      <button className={cls} disabled={!rows.length} onClick={() => exportPdf(title, filename, cols, rows)}>Ekspor PDF</button>
      <button className={cls} disabled={!rows.length} onClick={() => exportExcel(filename, cols, rows)}>Ekspor Excel</button>
    </div>
  );
}
