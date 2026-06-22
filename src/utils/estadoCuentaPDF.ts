import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InvoiceRow {
  date: string;
  quantity: number;
  description: string;
  charge: number;
  payment: number;
}

interface PatientInfo {
  name: string;
  rfc?: string;
  address?: string;
  colonia?: string;
  locality?: string;
  state?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface UnitInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

interface StatementData {
  unit: UnitInfo;
  patient: PatientInfo;
  clientNumber: string;
  date: Date;
  creditLimit: number;
  creditAvailable: number;
  overdueBalance: number;
  totalBalance: number;
  rows: InvoiceRow[];
  title: string;
}

export function printStatement(data: StatementData) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(generateHTML(data, data.unit.logoUrl || ""));
  w.document.close();
}

export function downloadStatementPDF(data: StatementData) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageW = 216; // letter width in mm
  const margin = 15;
  const contentW = pageW - margin * 2;

  let y = margin - 4;

  if (data.unit.logoUrl) {
    try {
      doc.addImage(data.unit.logoUrl, "JPEG", margin - 8, y, 80, 15);
    } catch {}
  }
  y += 28;

  // Unit address info
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (data.unit.address) doc.text(data.unit.address, margin, y);
  y += 4;
  const contactLine = `${data.unit.phone ? "Tel: " + data.unit.phone : ""}${data.unit.phone && data.unit.email ? "  |  " : ""}${data.unit.email ? "eMail: " + data.unit.email : ""}`;
  if (contactLine) doc.text(contactLine, margin, y);
  y += 8;

  // Right-side info box
  const rightX = pageW - margin - 70;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 100);
  doc.text(data.title, rightX, margin + 16);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`No. De Cliente: ${data.clientNumber}`, rightX, margin + 22);
  doc.text(`Fecha: ${format(data.date, "dd/MM/yyyy")}`, rightX, margin + 26);

  // Credit info box
  const boxY = y;
  const boxH = 20;
  doc.setDrawColor(0, 128, 128);
  doc.setFillColor(230, 245, 245);
  doc.roundedRect(margin, boxY, contentW, boxH, 2, 2, "FD");

  const colW = contentW / 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Límite de Créd.", margin + colW * 0 + 2, boxY + 7);
  doc.text("Crédito Disp.", margin + colW * 1 + 2, boxY + 7);
  doc.text("Saldo Vencido", margin + colW * 2 + 2, boxY + 7);
  doc.text("Saldo Total", margin + colW * 3 + 2, boxY + 7);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`$${data.creditLimit.toLocaleString()}`, margin + colW * 0 + 2, boxY + 15);
  doc.text(`$${data.creditAvailable.toLocaleString()}`, margin + colW * 1 + 2, boxY + 15);
  doc.text(`$${data.overdueBalance.toLocaleString()}`, margin + colW * 2 + 2, boxY + 15);
  doc.text(`$${data.totalBalance.toLocaleString()}`, margin + colW * 3 + 2, boxY + 15);

  y = boxY + boxH + 8;

  // Patient info section
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient.name, margin + 20, y);
  y += 5;

  const addr = data.patient.address || "";
  const addrLine1 = addr.length > 30 ? addr.slice(0, 30) : addr;
  const addrLine2 = addr.length > 30 ? addr.slice(30) : "";

  const infoLines = [
    { label: "Nombre:", value: data.patient.name },
    { label: "R.F.C.:", value: data.patient.rfc || "" },
    { label: "Domicilio:", value: addrLine1 },
  ];
  if (addrLine2) infoLines.push({ label: "", value: addrLine2 });
  infoLines.push({ label: "Colonia:", value: data.patient.colonia || "" });

  const rightInfo = [
    { label: "Localidad:", value: data.patient.locality || "" },
    { label: "Estado:", value: data.patient.state || "" },
    { label: "Municipio:", value: data.patient.city || "" },
    { label: "País:", value: data.patient.country || "MÉXICO" },
  ];

  const infoY = y;
  infoLines.forEach((l, i) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    if (l.label) doc.text(l.label, margin, infoY + i * 4);
    doc.setFont("helvetica", "normal");
    if (l.value) doc.text(l.value, margin + 14, infoY + i * 4);
  });
  rightInfo.forEach((l, i) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(l.label, margin + contentW / 2, infoY + i * 4);
    doc.setFont("helvetica", "normal");
    doc.text(l.value, margin + contentW / 2 + 16, infoY + i * 4);
  });
  y = infoY + Math.max(infoLines.length, rightInfo.length) * 4 + 8;

  // Transactions table
  const tableData = data.rows.map((r) => [
    r.date,
    r.quantity.toString(),
    r.description,
    r.charge > 0 ? `$${r.charge.toLocaleString()}` : "",
    r.payment > 0 ? `$${r.payment.toLocaleString()}` : "",
    "",
  ]);

  // Calculate running balance
  let running = 0;
  const rowsWithBalance = data.rows.map((r) => {
    const amount = r.charge - r.payment;
    running += amount;
    return [
      r.date,
      r.quantity.toString(),
      r.description,
      r.charge > 0 ? `$${r.charge.toLocaleString()}` : "",
      r.payment > 0 ? `$${r.payment.toLocaleString()}` : "",
      `$${running.toLocaleString()}`,
    ];
  });

  const totalCharges = data.rows.reduce((s, r) => s + r.charge, 0);
  const totalPayments = data.rows.reduce((s, r) => s + r.payment, 0);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    head: [["Fecha", "Cant.", "Descripción", "Cargo", "Abono", "Saldo"]],
    body: rowsWithBalance,
    foot: [
      [
        { content: "TOTALES", colSpan: 3, styles: { fontStyle: "bold", fontSize: 8 } },
        { content: `$${totalCharges.toLocaleString()}`, styles: { fontStyle: "bold", fontSize: 8 } },
        { content: `$${totalPayments.toLocaleString()}`, styles: { fontStyle: "bold", fontSize: 8 } },
        { content: `$${data.totalBalance.toLocaleString()}`, styles: { fontStyle: "bold", fontSize: 8 } },
      ],
    ],
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 128, 128], fontSize: 7, fontStyle: "bold", textColor: [255, 255, 255] },
    footStyles: { fillColor: [230, 245, 245], textColor: [0, 100, 100] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 10, halign: "center" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
    },
  });

  doc.save(`gastos_${data.patient.name.replace(/\s+/g, "_")}.pdf`);
}

function generateHTML(data: StatementData): string {
  let runningBalance = 0;
  const rowHtml = data.rows
    .map((r) => {
      runningBalance += r.charge - r.payment;
      return `
    <tr>
      <td>${r.date}</td>
      <td class="center">${r.quantity}</td>
      <td>${r.description}</td>
      <td class="right">${r.charge > 0 ? "$" + r.charge.toLocaleString() : ""}</td>
      <td class="right">${r.payment > 0 ? "$" + r.payment.toLocaleString() : ""}</td>
      <td class="right">$${runningBalance.toLocaleString()}</td>
    </tr>`;
    })
    .join("");

  const totalCharges = data.rows.reduce((s, r) => s + r.charge, 0);
  const totalPayments = data.rows.reduce((s, r) => s + r.payment, 0);

  const logoSrc = data.unit.logoUrl || "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: letter; margin: 15mm; }
  body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; }
  .header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
  .header img.logo { max-height: 57px; max-width: 300px; object-fit: contain; }
  .header h1 { font-size: 16px; margin: 0; }
  .info-box { display: flex; border: 1px solid #008080; border-radius: 4px; padding: 8px; margin: 10px 0; background: #e6f5f5; }
  .info-box > div { flex: 1; text-align: center; }
  .info-box label { font-size: 9px; font-weight: bold; display: block; color: #008080; }
  .info-box span { font-size: 12px; color: #004d4d; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; margin: 10px 0; font-size: 10px; }
  .patient-grid strong { display: inline-block; width: 70px; }
  .patient-grid .addr { grid-column: 1 / -1; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #008080; color: #fff; font-size: 9px; padding: 4px 6px; text-align: left; }
  td { padding: 3px 6px; border-bottom: 1px solid #ddd; font-size: 9px; }
  .right { text-align: right; }
  .center { text-align: center; }
  .totals td { font-weight: bold; background: #e6f5f5; border-top: 2px solid #008080; color: #004d4d; }
  .subtitle { font-size: 9px; margin: 2px 0; }
  .print-btn { margin: 20px 0; text-align: center; }
  .print-btn button { padding: 8px 24px; font-size: 14px; cursor: pointer; background: #008080; color: #fff; border: none; border-radius: 4px; }
  @media print { .print-btn { display: none; } }
</style></head><body>
  <div class="print-btn"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="header">
    ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="Logo" />` : `<h1>${data.unit.name.toUpperCase()}</h1>`}
    <div style="margin-left:auto;text-align:right">
      <h2 style="margin:0;font-size:14px;color:#008080">${logoSrc ? data.title.toUpperCase() : ""}</h2>
      <p style="margin:2px 0;font-size:10px">No. Cliente: ${data.clientNumber} &nbsp; Fecha: ${format(data.date, "dd/MM/yyyy")}</p>
    </div>
  </div>
  <div class="info-box">
    <div><label>Límite de Créd.</label><span>$${data.creditLimit.toLocaleString()}</span></div>
    <div><label>Crédito Disp.</label><span>$${data.creditAvailable.toLocaleString()}</span></div>
    <div><label>Saldo Vencido</label><span>$${data.overdueBalance.toLocaleString()}</span></div>
    <div><label>Saldo Total</label><span>$${data.totalBalance.toLocaleString()}</span></div>
  </div>
  <p><strong>Cliente:</strong> ${data.patient.name}</p>
  <div class="patient-grid">
    <div><strong>Nombre:</strong> ${data.patient.name}</div>
    <div><strong>Localidad:</strong> ${data.patient.locality || ""}</div>
    <div><strong>R.F.C.:</strong> ${data.patient.rfc || ""}</div>
    <div><strong>Estado:</strong> ${data.patient.state || ""}</div>
    <div class="addr"><strong>Domicilio:</strong> ${data.patient.address || ""}</div>
    <div><strong>Municipio:</strong> ${data.patient.city || ""}</div>
    <div><strong>Colonia:</strong> ${data.patient.colonia || ""}</div>
    <div><strong>País:</strong> ${data.patient.country || "MÉXICO"}</div>
  </div>
  <table>
    <thead><tr><th>Fecha</th><th>Cant.</th><th>Descripción</th><th class="right">Cargo</th><th class="right">Abono</th><th class="right">Saldo</th></tr></thead>
    <tbody>${rowHtml}</tbody>
    <tfoot>
      <tr class="totals"><td colspan="3">TOTALES</td><td class="right">$${totalCharges.toLocaleString()}</td><td class="right">$${totalPayments.toLocaleString()}</td><td class="right">$${data.totalBalance.toLocaleString()}</td></tr>
    </tfoot>
  </table>
</body></html>`;
}
