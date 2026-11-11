'use client';

import { FileDown, FileSpreadsheet } from 'lucide-react';

// columns: [{key, label}] | rows: array of objects
export function ExportButtons({ columns, rows, title = 'Laporan', filename = 'laporan', headerInfo = [] }) {
  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    headerInfo.forEach((line, i) => doc.text(String(line), 14, 22 + i * 5));
    autoTable(doc, {
      startY: 22 + headerInfo.length * 5 + 4,
      head: [columns.map((c) => c.label)],
      body: rows.map((r) => columns.map((c) => (c.export ? c.export(r) : (r[c.key] ?? '-')))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 80, 50] },
    });
    doc.save(`${filename}.pdf`);
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, c.export ? c.export(r) : (r[c.key] ?? '-')])))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <button className="btn btn-ghost !text-xs" onClick={exportPDF}><FileDown size={14} /> PDF</button>
      <button className="btn btn-ghost !text-xs" onClick={exportExcel}><FileSpreadsheet size={14} /> Excel</button>
    </div>
  );
}
