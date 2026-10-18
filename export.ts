// Ekspor Excel/PDF. Library dimuat dinamis agar bundle awal tetap ringan.
export type Col = { key: string; label: string };

export async function exportExcel(filename: string, cols: Col[], rows: Record<string, any>[]) {
  const XLSX = await import('xlsx');
  const data = rows.map((r) => Object.fromEntries(cols.map((c) => [c.label, r[c.key] ?? ''])));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportPdf(title: string, filename: string, cols: Col[], rows: Record<string, any>[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [cols.map((c) => c.label)],
    body: rows.map((r) => cols.map((c) => String(r[c.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 158, 11], textColor: 0 },
  });
  doc.save(`${filename}.pdf`);
}
