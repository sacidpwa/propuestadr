import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CostItem {
  concept: string;
  unit: string;
  price: number | null;
}

interface QuoteData {
  quote_number: string;
  service_type: "senior_living" | "centro_benesse";
  base_monthly_price: number;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  resident_name: string | null;
  resident_age: number | null;
  estimated_admission_date: string | null;
  notes: string | null;
  additional_costs: CostItem[];
  other_to_quote: CostItem[];
  created_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
  senior_living: "Senior Living",
  centro_benesse: "Centro Benesse",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  senior_living:
    "Residencia con acompañamiento personalizado, hospedaje, alimentación balanceada y supervisión continua orientada al bienestar integral del adulto mayor.",
  centro_benesse:
    "Centro especializado con atención médica y psiquiátrica continua, cuidados terapéuticos, plan nutricional y programa integral de rehabilitación.",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

// Brand colors (navy + gold from project memory)
const NAVY: [number, number, number] = [12, 27, 51];
const GOLD: [number, number, number] = [191, 154, 79];
const TEXT: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];

export function generateQuotePDF(quote: QuoteData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;

  // ===== HEADER =====
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 90, pageW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Cotización", margin, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(SERVICE_LABELS[quote.service_type], margin, 65);

  doc.setFontSize(9);
  doc.text(`Folio: ${quote.quote_number}`, pageW - margin, 45, { align: "right" });
  doc.text(
    `Fecha: ${format(new Date(quote.created_at), "dd 'de' MMMM, yyyy", { locale: es })}`,
    pageW - margin,
    60,
    { align: "right" },
  );

  let y = 130;

  // ===== CLIENT BLOCK =====
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PRESENTADO A", margin, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 4, margin + 90, y + 4);

  y += 22;
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(quote.client_name, margin, y);

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const clientLines: string[] = [];
  if (quote.client_phone) clientLines.push(`Tel: ${quote.client_phone}`);
  if (quote.client_email) clientLines.push(`Email: ${quote.client_email}`);
  if (clientLines.length) {
    doc.text(clientLines.join("   ·   "), margin, y);
    y += 14;
  }

  if (quote.resident_name || quote.resident_age || quote.estimated_admission_date) {
    y += 4;
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RESIDENTE", margin, y);
    y += 12;
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const resParts: string[] = [];
    if (quote.resident_name) resParts.push(quote.resident_name);
    if (quote.resident_age) resParts.push(`${quote.resident_age} años`);
    if (quote.estimated_admission_date)
      resParts.push(
        `Ingreso estimado: ${format(new Date(quote.estimated_admission_date), "dd MMM yyyy", { locale: es })}`,
      );
    doc.text(resParts.join("   ·   "), margin, y);
    y += 14;
  }

  // ===== SERVICE DESCRIPTION =====
  y += 16;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SERVICIO COTIZADO", margin, y);
  doc.line(margin, y + 4, margin + 130, y + 4);

  y += 22;
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(SERVICE_LABELS[quote.service_type], margin, y);

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const desc = doc.splitTextToSize(SERVICE_DESCRIPTIONS[quote.service_type], pageW - margin * 2);
  doc.text(desc, margin, y);
  y += desc.length * 12 + 10;

  // Highlighted price box
  doc.setFillColor(248, 245, 237);
  doc.roundedRect(margin, y, pageW - margin * 2, 50, 4, 4, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Cuota mensual base", margin + 16, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GOLD);
  doc.text(fmt(quote.base_monthly_price), pageW - margin - 16, y + 30, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("MXN / mes", pageW - margin - 16, y + 44, { align: "right" });

  y += 70;

  // ===== ADDITIONAL COSTS TABLE =====
  if (quote.additional_costs && quote.additional_costs.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Costos adicionales", "Unidad", "Precio"]],
      body: quote.additional_costs.map((c) => [
        c.concept || "—",
        c.unit || "—",
        c.price != null ? fmt(c.price) : "A cotizar",
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: TEXT },
      alternateRowStyles: { fillColor: [248, 248, 250] },
      columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
      theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 18;
  }

  // ===== OTHER TO QUOTE TABLE =====
  if (quote.other_to_quote && quote.other_to_quote.length > 0) {
    if (y > pageH - 200) {
      doc.addPage();
      y = margin;
    }
    autoTable(doc, {
      startY: y,
      head: [["Otros conceptos a cotizar", "Detalle"]],
      body: quote.other_to_quote.map((c) => [c.concept || "—", c.unit || "Según evaluación"]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: TEXT },
      alternateRowStyles: { fillColor: [252, 250, 244] },
      theme: "grid",
    });
    y = (doc as any).lastAutoTable.finalY + 18;
  }

  // ===== NOTES =====
  if (quote.notes) {
    if (y > pageH - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("NOTAS", margin, y);
    y += 14;
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(quote.notes, pageW - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 11 + 10;
  }

  // ===== FOOTER ON EVERY PAGE =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 50, pageW - margin, pageH - 50);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Cotización informativa. Precios sujetos a evaluación final del residente y vigentes 30 días naturales.",
      margin,
      pageH - 32,
    );
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 32, { align: "right" });
  }

  doc.save(`Cotizacion_${quote.quote_number}_${quote.client_name.replace(/\s+/g, "_")}.pdf`);
}
