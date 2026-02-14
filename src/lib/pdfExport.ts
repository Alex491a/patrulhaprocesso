import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatrolReport, PatrolRequirement, RequirementStats, ProblemByType } from '@/types/patrol';
import { formatDateBR, getCurrentDateString } from './dateUtils';

const statusLabels = {
  OK: 'OK',
  NOK: 'NOK',
  'N/A': 'N/A',
};

// Brand colors
const COLORS = {
  primary: [30, 58, 138] as [number, number, number],       // Deep navy blue
  primaryLight: [59, 130, 246] as [number, number, number],  // Bright blue
  success: [22, 163, 74] as [number, number, number],        // Green
  danger: [220, 38, 38] as [number, number, number],         // Red
  warning: [202, 138, 4] as [number, number, number],        // Amber
  dark: [30, 41, 59] as [number, number, number],            // Slate dark
  medium: [100, 116, 139] as [number, number, number],       // Slate medium
  light: [241, 245, 249] as [number, number, number],        // Slate light
  white: [255, 255, 255] as [number, number, number],
  accent: [99, 102, 241] as [number, number, number],        // Indigo
  headerBg: [15, 23, 42] as [number, number, number],        // Very dark navy
};

const formatDate = (dateString: string): string => {
  if (dateString.includes('T') || dateString.includes('Z')) {
    return formatDateBR(dateString.split('T')[0]);
  }
  return formatDateBR(dateString);
};

// Draw a colored header bar across the page
const drawHeaderBar = (doc: jsPDF, y: number, height: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, y, pageWidth, height, 'F');
};

// Draw a decorative accent line
const drawAccentLine = (doc: jsPDF, y: number, width?: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineWidth = width || pageWidth - 28;
  const x = (pageWidth - lineWidth) / 2;
  doc.setDrawColor(...COLORS.primaryLight);
  doc.setLineWidth(0.8);
  doc.line(x, y, x + lineWidth, y);
};

// Draw a stat card box
const drawStatCard = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: [number, number, number]
) => {
  // Card background
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  
  // Top accent bar
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, 3, 2, 2, 'F');
  doc.rect(x, y + 1.5, w, 1.5, 'F'); // Fill gap from rounded corners at bottom of accent

  // Label
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text(label, x + w / 2, y + 13, { align: 'center' });

  // Value
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(value, x + w / 2, y + 25, { align: 'center' });

  doc.setTextColor(...COLORS.dark);
};

// Draw section title with icon-like decoration
const drawSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(14, y - 4, 3, 12, 1, 1, 'F');
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(title, 22, y + 4);
  return y + 14;
};

// Add professional footer to all pages
const addFooter = (doc: jsPDF, companyName?: string) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.light);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text('Patrulha de Processo — Documento Confidencial', 14, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  }
};

// ===================== SINGLE REPORT EXPORT =====================

export const exportSingleReportToPDF = (report: PatrolReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark header bar
  drawHeaderBar(doc, 0, 40);

  // Title on dark background
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Relatório de Patrulha de Processo', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text(`${report.reportNumber}  •  ${formatDate(report.date)}`, pageWidth / 2, 28, { align: 'center' });

  // Status badge
  const statusText = report.overallStatus === 'APPROVED' ? 'APROVADO' : 'REJEITADO';
  const statusColor = report.overallStatus === 'APPROVED' ? COLORS.success : COLORS.danger;
  const badgeWidth = 36;
  const badgeX = pageWidth / 2 - badgeWidth / 2;
  doc.setFillColor(...statusColor);
  doc.roundedRect(badgeX, 32, badgeWidth, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(statusText, pageWidth / 2, 37, { align: 'center' });

  doc.setTextColor(...COLORS.dark);
  let currentY = 52;

  // Info grid (2 columns)
  const info = [
    { label: 'Máquina', value: report.machine },
    { label: 'Cliente', value: report.client },
    { label: 'OP', value: report.opNumber },
    { label: 'Auditor', value: report.auditors },
    { label: 'Operador', value: report.operatorName },
    { label: 'Registro', value: report.operatorRegistry || '-' },
  ];

  const colW = (pageWidth - 28) / 2;
  info.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 14 + col * colW;
    const y = currentY + row * 14;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(item.label.toUpperCase(), x, y);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(item.value || '-', x, y + 6);
  });

  currentY += Math.ceil(info.length / 2) * 14 + 6;
  drawAccentLine(doc, currentY);
  currentY += 8;

  // Requirements Table
  currentY = drawSectionTitle(doc, 'Requisitos Avaliados', currentY);

  const tableData = report.requirements.map((req: PatrolRequirement) => [
    req.id.toString(),
    req.description,
    statusLabels[req.status],
    req.evidence || '-',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Requisito', 'Status', 'Evidência']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 60 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'OK') {
          data.cell.styles.textColor = COLORS.success;
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'NOK') {
          data.cell.styles.textColor = COLORS.danger;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = COLORS.medium;
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`patrulha-${report.reportNumber}-${formatDate(report.date).replace(/\//g, '-')}.pdf`);
};

// ===================== MULTIPLE REPORTS EXPORT =====================

export const exportMultipleReportsToPDF = (reports: PatrolReport[]): void => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark header
  drawHeaderBar(doc, 0, 35);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Relatórios de Patrulha de Processo', pageWidth / 2, 16, { align: 'center' });

  const approved = reports.filter(r => r.overallStatus === 'APPROVED').length;
  const rejected = reports.length - approved;
  const approvalRate = reports.length > 0 ? ((approved / reports.length) * 100).toFixed(1) : '0';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text(
    `${reports.length} relatórios  •  ${approved} aprovados  •  ${rejected} rejeitados  •  ${approvalRate}% aprovação`,
    pageWidth / 2, 28, { align: 'center' }
  );

  doc.setTextColor(...COLORS.dark);

  const tableData = reports.map(report => [
    report.reportNumber,
    formatDate(report.date),
    report.machine,
    report.client,
    report.opNumber,
    report.auditors,
    report.operatorName,
    report.overallStatus === 'APPROVED' ? 'Aprovado' : 'Rejeitado',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['ID', 'Data', 'Máquina', 'Cliente', 'OP', 'Auditor', 'Operador', 'Status']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: COLORS.white,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.column.index === 7 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'Aprovado') {
          data.cell.styles.textColor = COLORS.success;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = COLORS.danger;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  addFooter(doc);
  doc.save(`relatorios-patrulha-${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`);
};

// ===================== DASHBOARD EXPORT =====================

interface InspectorExportData {
  name: string;
  totalReports: number;
  totalNok: number;
  nokRate: number;
}

interface DashboardExportData {
  periodLabel: string;
  totalReports: number;
  approvedReports: number;
  rejectedReports: number;
  approvalRate: number;
  requirementStats: RequirementStats[];
  problemsByType: ProblemByType[];
  machineStats: { machine: string; totalNok: number; audits: number; rejectedAudits: number; avgNok: number }[];
  inspectorStats?: InspectorExportData[];
  isAdmin?: boolean;
  selectedMachine?: string | null;
}

export const exportDashboardToPDF = (data: DashboardExportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 0;

  // ---- COVER HEADER ----
  const headerHeight = data.selectedMachine ? 50 : 42;
  drawHeaderBar(doc, 0, headerHeight);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Dashboard — Patrulha de Processo', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text(`Período: ${data.periodLabel}  •  Gerado em: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 28, { align: 'center' });

  if (data.selectedMachine) {
    // Machine badge
    const machineText = `Máquina: ${data.selectedMachine}`;
    const textW = doc.getTextWidth(machineText) + 12;
    const badgeX = pageWidth / 2 - textW / 2;
    doc.setFillColor(...COLORS.primaryLight);
    doc.roundedRect(badgeX, 33, textW, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(machineText, pageWidth / 2, 39, { align: 'center' });
  }

  currentY = headerHeight + 10;
  doc.setTextColor(...COLORS.dark);

  // ---- STAT CARDS ----
  const cardGap = 6;
  const cardCount = 4;
  const totalGap = cardGap * (cardCount - 1);
  const cardW = (pageWidth - 28 - totalGap) / cardCount;
  const cardH = 30;

  drawStatCard(doc, 14, currentY, cardW, cardH, 'TOTAL RELATÓRIOS', data.totalReports.toString(), COLORS.primaryLight);
  drawStatCard(doc, 14 + (cardW + cardGap), currentY, cardW, cardH, 'APROVADOS', data.approvedReports.toString(), COLORS.success);
  drawStatCard(doc, 14 + 2 * (cardW + cardGap), currentY, cardW, cardH, 'REJEITADOS', data.rejectedReports.toString(), COLORS.danger);
  drawStatCard(doc, 14 + 3 * (cardW + cardGap), currentY, cardW, cardH, 'TAXA QUALIDADE', `${data.approvalRate.toFixed(1)}%`, COLORS.accent);

  currentY += cardH + 14;

  // ---- PROBLEMS BY TYPE ----
  if (data.problemsByType.length > 0) {
    currentY = drawSectionTitle(doc, 'Problemas por Tipo (Top 10)', currentY);

    const problemsData = data.problemsByType.slice(0, 10).map((p, i) => [
      (i + 1).toString(),
      p.type.length > 55 ? p.type.substring(0, 52) + '...' : p.type,
      p.count.toString(),
      `${p.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Tipo de Problema', 'Qtd', '%']],
      body: problemsData,
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 118 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (cellData) => {
        if (cellData.column.index === 3 && cellData.section === 'body') {
          const pct = parseFloat(cellData.cell.raw as string);
          if (pct >= 20) {
            cellData.cell.styles.textColor = COLORS.danger;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // ---- MACHINE STATS ----
  if (data.machineStats.length > 0) {
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    currentY = drawSectionTitle(doc, 'NOKs por Máquina (Top 15)', currentY);

    const machineData = data.machineStats.slice(0, 15).map((m, i) => [
      (i + 1).toString(),
      m.machine,
      m.totalNok.toString(),
      m.audits.toString(),
      m.rejectedAudits.toString(),
      m.avgNok.toFixed(1),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Máquina', 'Total NOK', 'Auditorias', 'Rejeitados', 'Média NOK']],
      body: machineData,
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 58 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (cellData) => {
        if (cellData.column.index === 5 && cellData.section === 'body') {
          const avg = parseFloat(cellData.cell.raw as string);
          if (avg >= 3) {
            cellData.cell.styles.textColor = COLORS.danger;
            cellData.cell.styles.fontStyle = 'bold';
          } else if (avg >= 1.5) {
            cellData.cell.styles.textColor = COLORS.warning;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // ---- REQUIREMENT RECURRENCE ----
  if (data.requirementStats.length > 0) {
    if (currentY > 180) { doc.addPage(); currentY = 20; }
    currentY = drawSectionTitle(doc, 'Taxa de Reincidência por Requisito', currentY);

    const reqData = data.requirementStats
      .filter(r => r.nokCount > 0)
      .sort((a, b) => b.recurrenceRate - a.recurrenceRate)
      .slice(0, 15)
      .map((r, i) => [
        (i + 1).toString(),
        r.description.length > 50 ? r.description.substring(0, 47) + '...' : r.description,
        r.okCount.toString(),
        r.nokCount.toString(),
        `${r.recurrenceRate.toFixed(1)}%`,
      ]);

    if (reqData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Requisito', 'OK', 'NOK', 'Reincidência']],
        body: reqData,
        styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 108 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (cellData) => {
          if (cellData.column.index === 4 && cellData.section === 'body') {
            const rate = parseFloat(cellData.cell.raw as string);
            if (rate >= 20) {
              cellData.cell.styles.textColor = COLORS.danger;
              cellData.cell.styles.fontStyle = 'bold';
            } else if (rate >= 10) {
              cellData.cell.styles.textColor = COLORS.warning;
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // ---- INSPECTOR STATS (Admin) ----
  if (data.isAdmin && data.inspectorStats && data.inspectorStats.length > 0) {
    const checkY = (doc as any).lastAutoTable?.finalY || currentY;
    if (checkY > 180) { doc.addPage(); currentY = 20; } else { currentY = checkY + 4; }
    currentY = drawSectionTitle(doc, 'Estatísticas por Inspetor', currentY);

    const inspectorData = data.inspectorStats.map((insp, i) => [
      (i + 1).toString(),
      insp.name,
      insp.totalReports.toString(),
      insp.totalNok.toString(),
      insp.nokRate.toFixed(2),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Inspetor', 'Relatórios', 'Total NOK', 'Média NOK/Rel']],
      body: inspectorData,
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.white, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 78 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (cellData) => {
        if (cellData.column.index === 4 && cellData.section === 'body') {
          const rate = parseFloat(cellData.cell.raw as string);
          if (rate > 2) {
            cellData.cell.styles.textColor = COLORS.danger;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
  }

  addFooter(doc);

  const machinePart = data.selectedMachine ? `-${data.selectedMachine}` : '';
  const filename = `dashboard${machinePart}-${data.periodLabel.replace(/[\/\s]/g, '-')}-${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
