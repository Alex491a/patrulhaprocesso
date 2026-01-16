import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatrolReport, PatrolRequirement } from '@/types/patrol';

const statusLabels = {
  OK: 'OK',
  NOK: 'NOK',
  'N/A': 'N/A',
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const exportSingleReportToPDF = (report: PatrolReport): void => {
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
