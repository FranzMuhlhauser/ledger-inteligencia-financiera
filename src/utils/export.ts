import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportInvoice {
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  tipoDocumento?: string;
  valorNeto: number;
  iva: number;
  valorTotal: number;
  descripcion?: string;
}

/** Export invoices to a UTF-8 CSV file (BOM included for Excel compatibility) */
export function exportToCSV(invoices: ExportInvoice[], filename = 'facturas') {
  const headers = ['N° Factura', 'Fecha', 'Proveedor', 'Tipo', 'Valor Neto', 'IVA', 'Valor Total', 'Descripción'];
  const rows = invoices.map(inv => [
    inv.numeroFactura,
    inv.fecha,
    inv.proveedor,
    inv.tipoDocumento || 'Factura',
    inv.valorNeto,
    inv.iva,
    inv.valorTotal,
    inv.descripcion || '',
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export invoices to a styled PDF using jsPDF + autoTable */
export function exportToPDF(invoices: ExportInvoice[], filename = 'facturas', companyName = 'Ledger') {
  const doc = new jsPDF();
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text(companyName, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Reporte de Facturas', 14, 28);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 34);

  autoTable(doc, {
    startY: 42,
    head: [['N° Factura', 'Fecha', 'Proveedor', 'Tipo', 'Neto', 'IVA', 'Total']],
    body: invoices.map(inv => [
      inv.numeroFactura,
      inv.fecha,
      inv.proveedor,
      inv.tipoDocumento || 'Factura',
      `$${inv.valorNeto.toLocaleString('es-CL')}`,
      `$${inv.iva.toLocaleString('es-CL')}`,
      `$${inv.valorTotal.toLocaleString('es-CL')}`,
    ]),
    foot: [[
      '', '', '', 'TOTAL',
      `$${invoices.reduce((s, i) => s + i.valorNeto, 0).toLocaleString('es-CL')}`,
      `$${invoices.reduce((s, i) => s + i.iva, 0).toLocaleString('es-CL')}`,
      `$${invoices.reduce((s, i) => s + i.valorTotal, 0).toLocaleString('es-CL')}`,
    ]],
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { cellPadding: 3.5 },
  });

  doc.save(`${filename}.pdf`);
}
