import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import logoBenesse from "@/assets/logo-benesse.jpg";
import logoAlcatraces from "@/assets/logo-alcatraces.jpg";
import logoSenior from "@/assets/logo-senior-living.jpg";
import logoCtAlcatracesAsset from "@/assets/logo-ct-alcatraces.png.asset.json";

const LOGO_BY_SERVICE: Record<string, string> = {
  senior_living: logoSenior,
  centro_benesse: logoBenesse,
  ct_alcatraces: logoCtAlcatracesAsset.url,
  personalizado: logoAlcatraces,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

interface CostItem {
  concept: string;
  unit: string;
  price: number | null;
}

interface QuoteData {
  quote_number: string;
  service_type: "senior_living" | "centro_benesse" | "ct_alcatraces" | "personalizado";
  base_monthly_price: number;
  room_type?: "compartida" | "individual" | null;
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
  custom_period?: "dia" | "semana" | "mes" | null;
  custom_unit_price?: number | null;
  custom_quantity?: number | null;
  custom_concept?: string | null;
  base_period?: "dia" | "semana" | "mes" | null;
}

const SERVICE_LABELS: Record<string, string> = {
  senior_living: "Senior Living",
  centro_benesse: "Centro Benesse",
  ct_alcatraces: "Comunidad Terapéutica Alcatraces",
  personalizado: "Servicio Personalizado",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  senior_living:
    "Residencia con acompañamiento personalizado, hospedaje, alimentación balanceada y supervisión continua orientada al bienestar integral del adulto mayor.",
  centro_benesse:
    "Centro Benesse es una institución especializada en el tratamiento integral de las adicciones y los trastornos por uso de sustancias, que cuenta con un equipo multidisciplinario de profesionales de la salud —médicos psiquiatras, médicos internistas, psicólogos clínicos especializados en adicciones, consejeros terapéuticos, personal de enfermería capacitado, terapeutas ocupacionales, nutriólogos clínicos, trabajadores sociales y cuidadores entrenados— trabajando de forma coordinada bajo un mismo plan terapéutico individualizado. " +
    "Atendemos a personas que cursan con dependencia y uso problemático de alcohol, cocaína, cannabis, metanfetaminas, opioides, benzodiacepinas, tabaco y otras sustancias, así como adicciones conductuales (juego patológico, tecnologías) y los trastornos psiquiátricos asociados al consumo —depresión, ansiedad, trastornos del sueño, trastornos de personalidad y patología dual—, acompañando al paciente desde la desintoxicación supervisada hasta la rehabilitación y la prevención de recaídas. " +
    "Nuestro modelo terapéutico combina desintoxicación médica supervisada, manejo farmacológico de la abstinencia y de la patología dual, psicoterapia individual y grupal, terapia cognitivo-conductual, prevención de recaídas, terapia familiar, grupos de apoyo, intervención motivacional, rehabilitación funcional, plan nutricional personalizado, actividades terapéuticas y recreativas, y un programa estructurado de reinserción social y seguimiento posterior al egreso, todo dentro de un entorno residencial seguro, cálido y profesional diseñado para promover la recuperación sostenida, la autonomía y la mejor calidad de vida posible para cada residente y su familia.",
  personalizado:
    "Esquema a la medida cotizado por periodo (día, semana o mes), con costo unitario y cantidad definidos según las necesidades del residente.",
};

const PERIOD_SINGULAR: Record<string, string> = { dia: "día", semana: "semana", mes: "mes" };
const PERIOD_PLURAL: Record<string, string> = { dia: "días", semana: "semanas", mes: "meses" };

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

// Brand colors (navy + gold from project memory)
const NAVY: [number, number, number] = [12, 27, 51];
const GOLD: [number, number, number] = [191, 154, 79];
const TEXT: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];

export async function generateQuotePDF(quote: QuoteData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;

  // ===== HEADER (white background for logos) =====
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, 100, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 100, pageW, 3, "F");

  // Logo on the left
  try {
    const logo = await loadImage(LOGO_BY_SERVICE[quote.service_type]);
    const maxH = 56;
    const maxW = 220;
    const ratio = logo.width / logo.height;
    let h = maxH;
    let w = h * ratio;
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }
    doc.addImage(logo, "JPEG", margin, (100 - h) / 2, w, h);
  } catch {
    // ignore if logo fails to load
  }

  // Title block on the right (navy text on white)
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Cotización", pageW - margin, 38, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(SERVICE_LABELS[quote.service_type], pageW - margin, 54, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  doc.text(`Folio: ${quote.quote_number}`, pageW - margin, 70, { align: "right" });
  doc.text(
    `Fecha: ${format(new Date(quote.created_at), "dd 'de' MMMM, yyyy", { locale: es })}`,
    pageW - margin,
    84,
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
  doc.text(desc, margin, y, { align: "justify", maxWidth: pageW - margin * 2 });
  y += desc.length * 12 + 10;

  // Highlighted price box
  const isCustom = quote.service_type === "personalizado";
  const period = quote.custom_period || "mes";
  const qty = Number(quote.custom_quantity || 0);
  const unitPrice = Number(quote.custom_unit_price || 0);
  const periodWord = qty === 1 ? PERIOD_SINGULAR[period] : PERIOD_PLURAL[period];

  doc.setFillColor(248, 245, 237);
  doc.roundedRect(margin, y, pageW - margin * 2, 50, 4, 4, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const basePeriod = quote.base_period || "mes";
  const baseAdj = basePeriod === "dia" ? "diaria" : basePeriod === "semana" ? "semanal" : "mensual";
  let priceLabel = `Cuota ${baseAdj} base`;
  let priceUnit = `MXN / ${PERIOD_SINGULAR[basePeriod]}`;
  if (isCustom) {
    priceLabel = `${quote.custom_concept || "Servicio personalizado"} · ${qty} ${periodWord} × ${fmt(unitPrice)} por ${PERIOD_SINGULAR[period]}`;
    priceUnit = "MXN total";
  } else if (quote.room_type) {
    priceLabel = `Cuota ${baseAdj} base · Habitación ${quote.room_type === "compartida" ? "compartida" : "individual"}`;
  }
  doc.text(priceLabel, margin + 16, y + 22, { maxWidth: pageW - margin * 2 - 32 });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GOLD);
  doc.text(fmt(quote.base_monthly_price), pageW - margin - 16, y + 30, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(priceUnit, pageW - margin - 16, y + 44, { align: "right" });

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

  // ===== SEGUNDA HOJA: NO INCLUIDO / SUJETO A VALORACIÓN =====
  doc.addPage();
  y = margin;

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Conceptos no incluidos en la cuota", margin, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(margin, y + 6, margin + 260, y + 6);

  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  const introText =
    "La cuota base cubre exclusivamente hospedaje, alimentación estándar, supervisión general y uso de instalaciones comunes. " +
    "Los siguientes conceptos NO están incluidos y se cotizan por separado, ya que dependen de la condición clínica, " +
    "el nivel de dependencia y las necesidades específicas de cada residente:\n\n" +
    "•  Atención médica y psiquiátrica especializada (consultas, seguimiento, ajustes de tratamiento).\n" +
    "•  Medicamentos, insumos médicos, material de curación y estudios de laboratorio o gabinete.\n" +
    "•  Terapias individuales: psicológica, ocupacional, física, de lenguaje y rehabilitación.\n" +
    "•  Cuidado uno a uno o asistencia personalizada para residentes con alta dependencia.\n" +
    "•  Atención de enfermería especializada fuera del esquema general (curaciones, sondas, oxígeno, etc.).\n" +
    "•  Dietas especiales, suplementos alimenticios y nutrición clínica indicada por valoración.\n" +
    "•  Pañales, productos de higiene personal y artículos de uso individual.\n" +
    "•  Lavandería de prendas personales y tintorería.\n" +
    "•  Acompañamiento médico a citas externas y traslados especializados o ambulancia.\n" +
    "•  Hospitalizaciones, urgencias y procedimientos médicos fuera de las instalaciones.\n" +
    "•  Actividades recreativas externas, salidas o eventos especiales.\n" +
    "•  Cualquier servicio adicional solicitado por el residente o su familia no contemplado en la cuota base.";
  const introLines = doc.splitTextToSize(introText, pageW - margin * 2);
  doc.text(introLines, margin, y);
  y += introLines.length * 12 + 14;

  const otherRows =
    quote.other_to_quote && quote.other_to_quote.length > 0
      ? quote.other_to_quote
      : [{ concept: "Servicios complementarios", unit: "Sujeto a valoración de salud", price: null }];

  autoTable(doc, {
    startY: y,
    head: [["Concepto", "Detalle / Forma de cotización"]],
    body: otherRows.map((c) => [c.concept || "—", c.unit || "Sujeto a valoración de salud"]),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: TEXT },
    alternateRowStyles: { fillColor: [252, 250, 244] },
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 18;

  // Nota destacada
  if (y > pageH - 120) {
    doc.addPage();
    y = margin;
  }
  doc.setFillColor(248, 245, 237);
  doc.roundedRect(margin, y, pageW - margin * 2, 60, 4, 4, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Importante", margin + 16, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  const nota = doc.splitTextToSize(
    "Estos conceptos serán cotizados de manera personalizada únicamente después de realizar la valoración de salud del residente. " +
      "El equipo médico determinará los servicios necesarios y la frecuencia de cada uno para emitir un costo definitivo.",
    pageW - margin * 2 - 32,
  );
  doc.text(nota, margin + 16, y + 34);
  y += 70;
  // ===== NOTES =====
  const cleanNotes = (quote.notes || "")
    .replace(/__CUSTOM__.*?__END__/gs, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleanNotes) {
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
    const noteLines = doc.splitTextToSize(cleanNotes, pageW - margin * 2);
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
