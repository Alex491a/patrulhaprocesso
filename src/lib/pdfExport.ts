import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatrolReport, PatrolRequirement, RequirementStats, ProblemByType } from '@/types/patrol';
import { formatDateBR, getCurrentDateString } from './dateUtils';

const statusLabels = {
  OK: 'OK',
  NOK: 'NOK',
  'N/A': 'N/A',
};

// Use formatDateBR for date-only strings (YYYY-MM-DD) to avoid timezone issues
const formatDate = (dateString: string): string => {
  // Check if it's an ISO datetime string (contains T or Z)
  if (dateString.includes('T') || dateString.includes('Z')) {
    // For datetime strings, use the date part only
    return formatDateBR(dateString.split('T')[0]);
  }
  return formatDateBR(dateString);
};

export const exportSingleReportToPDF = (report: PatrolReport): void => {
  // ... keep existing code (single report export functionality)
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Patrulha de Processo', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 28, { align: 'center' });

  // Report Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Relatório', 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoStartY = 50;
  const lineHeight = 7;

  const info = [
    ['ID:', report.reportNumber],
    ['Data:', formatDate(report.date)],
    ['Máquina:', report.machine],
    ['Cliente:', report.client],
    ['OP:', report.opNumber],
    ['Auditor:', report.auditors],
    ['Operador:', `${report.operatorName} (${report.operatorRegistry})`],
    ['Status:', report.overallStatus === 'APPROVED' ? 'APROVADO' : 'REJEITADO'],
  ];

  info.forEach((item, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(item[0], 14, infoStartY + index * lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(item[1], 50, infoStartY + index * lineHeight);
  });

  // Requirements Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Requisitos Avaliados', 14, infoStartY + info.length * lineHeight + 10);

  const tableData = report.requirements.map((req: PatrolRequirement) => [
    req.id.toString(),
    req.description,
    statusLabels[req.status],
    req.evidence || '-',
  ]);

  autoTable(doc, {
    startY: infoStartY + info.length * lineHeight + 16,
    head: [['#', 'Requisito', 'Status', 'Evidência']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 60 },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'OK') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'NOK') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`patrulha-${report.reportNumber}-${formatDate(report.date).replace(/\//g, '-')}.pdf`);
};

export const exportMultipleReportsToPDF = (reports: PatrolReport[]): void => {
  // ... keep existing code (multiple reports export functionality)
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatórios de Patrulha de Processo', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total: ${reports.length} relatórios | Gerado em: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 28, { align: 'center' });

  // Summary stats
  const approved = reports.filter(r => r.overallStatus === 'APPROVED').length;
  const rejected = reports.length - approved;
  const approvalRate = reports.length > 0 ? ((approved / reports.length) * 100).toFixed(1) : '0';

  doc.setFontSize(11);
  doc.text(`Aprovados: ${approved} | Rejeitados: ${rejected} | Taxa de Aprovação: ${approvalRate}%`, pageWidth / 2, 36, { align: 'center' });

  // Reports Table
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
    startY: 44,
    head: [['ID', 'Data', 'Máquina', 'Cliente', 'OP', 'Auditor', 'Operador', 'Status']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didParseCell: (data) => {
      if (data.column.index === 7 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'Aprovado') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorios-patrulha-${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`);
};

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
}

export const exportDashboardToPDF = (data: DashboardExportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard - Patrulha de Processo', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${data.periodLabel}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 14;

  // Summary Stats Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const statsY = currentY + 12;
  const colWidth = (pageWidth - 28) / 4;
  
  doc.text('Total Relatórios', 14 + colWidth * 0.5, statsY, { align: 'center' });
  doc.text('Aprovados', 14 + colWidth * 1.5, statsY, { align: 'center' });
  doc.text('Rejeitados', 14 + colWidth * 2.5, statsY, { align: 'center' });
  doc.text('Taxa Qualidade', 14 + colWidth * 3.5, statsY, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text(data.totalReports.toString(), 14 + colWidth * 0.5, statsY + 10, { align: 'center' });
  doc.setTextColor(34, 197, 94);
  doc.text(data.approvedReports.toString(), 14 + colWidth * 1.5, statsY + 10, { align: 'center' });
  doc.setTextColor(239, 68, 68);
  doc.text(data.rejectedReports.toString(), 14 + colWidth * 2.5, statsY + 10, { align: 'center' });
  doc.setTextColor(59, 130, 246);
  doc.text(`${data.approvalRate.toFixed(1)}%`, 14 + colWidth * 3.5, statsY + 10, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  currentY += 36;

  // Problems by Type
  if (data.problemsByType.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Problemas por Tipo (Top 10)', 14, currentY);
    currentY += 6;

    const problemsData = data.problemsByType.slice(0, 10).map((p, i) => [
      (i + 1).toString(),
      p.type.length > 50 ? p.type.substring(0, 47) + '...' : p.type,
      p.count.toString(),
      `${p.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Tipo de Problema', 'Qtd', '%']],
      body: problemsData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 120 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Machine Stats
  if (data.machineStats.length > 0) {
    // Check if we need a new page
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NOKs por Máquina (Top 15)', 14, currentY);
    currentY += 6;

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
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Requirement Stats (Recurrence)
  if (data.requirementStats.length > 0) {
    // Check if we need a new page
    if (currentY > 180) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Taxa de Reincidência por Requisito', 14, currentY);
    currentY += 6;

    const reqData = data.requirementStats
      .filter(r => r.nokCount > 0)
      .sort((a, b) => b.recurrenceRate - a.recurrenceRate)
      .slice(0, 15)
      .map((r, i) => [
        (i + 1).toString(),
        r.description.length > 45 ? r.description.substring(0, 42) + '...' : r.description,
        r.okCount.toString(),
        r.nokCount.toString(),
        `${r.recurrenceRate.toFixed(1)}%`,
      ]);

    if (reqData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Requisito', 'OK', 'NOK', 'Reincidência']],
        body: reqData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 110 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didParseCell: (data) => {
          if (data.column.index === 4 && data.section === 'body') {
            const rate = parseFloat(data.cell.raw as string);
            if (rate >= 20) {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            } else if (rate >= 10) {
              data.cell.styles.textColor = [234, 179, 8];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });
    }
  }

  // Inspector Stats (Admin Only)
  if (data.isAdmin && data.inspectorStats && data.inspectorStats.length > 0) {
    // Check if we need a new page
    const currentYCheck = (doc as any).lastAutoTable?.finalY || currentY;
    if (currentYCheck > 180) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = currentYCheck + 10;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas por Inspetor', 14, currentY);
    currentY += 6;

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
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const rate = parseFloat(data.cell.raw as string);
          if (rate > 2) {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `dashboard-${data.periodLabel.replace(/[\/\s]/g, '-')}-${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
